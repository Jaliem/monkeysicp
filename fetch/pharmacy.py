import requests
import json
from uagents import Agent, Context, Protocol, Model
from datetime import datetime, timezone
from uuid import uuid4
from typing import List, Optional
from pydantic import BaseModel

# === Configuration ===
CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai"  # Updated to match HealthAgent canister
BASE_URL = "http://127.0.0.1:4943"

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# === Agent Setup ===
agent = Agent(
    name="pharmacy_agent",
    seed="healthcare_pharmacy_agent_2025_unique_seed_v1",
    port=8002,
    mailbox=True,
)

# === Message Models for HealthAgent Communication ===
class MedicineCheckRequest(Model):
    medicine_name: str
    quantity: Optional[int] = 1
    prescription_id: Optional[str] = None
    # Remove request_id since send_and_receive handles correlation automatically

class MedicineCheckResponse(Model):
    type: str = "MedicineCheckResponse"
    medicine: str
    available: bool
    stock: Optional[int] = None
    price: Optional[float] = None
    pharmacy_name: str = "HealthPlus Pharmacy"
    status: str
    message: str
    # Remove request_id since send_and_receive handles correlation automatically

class MedicineOrderRequest(Model):
    medicine_id: str
    medicine_name: Optional[str] = None
    quantity: int
    user_id: str = "user123"
    prescription_id: Optional[str] = None

class MedicineOrderResponse(Model):
    type: str = "MedicineOrderResponse"
    medicine: str
    medicine_id: str
    qty: int
    price: float
    status: str  # "confirmed", "insufficient_stock", "prescription_required", "not_found"
    order_id: Optional[str] = None
    message: str
    suggested_alternatives: Optional[List[dict]] = None

# === ICP Integration Functions ===
def parse_medicine_data(medicine_data: dict) -> dict:
    """Parse medicine data with numeric keys from ICP backend to proper field names"""
    # Mapping of numeric keys to field names based on the Medicine type structure
    # This is a workaround for the JSON serialization issue in the backend
    key_mapping = {
        '1_098_344_064': 'medicine_id',
        '1_224_700_491': 'name', 
        '1_026_369_715': 'generic_name',
        '2_909_547_262': 'category',
        '2_216_036_054': 'stock',
        '3_364_572_809': 'price',
        '341_121_617': 'manufacturer',
        '1_595_738_364': 'description',
        '3_699_773_643': 'requires_prescription',
        '819_652_970': 'active_ingredient',
        '829_945_655': 'dosage'
    }
    
    parsed_medicine = {}
    for numeric_key, value in medicine_data.items():
        field_name = key_mapping.get(numeric_key, numeric_key)
        parsed_medicine[field_name] = value
    
    return parsed_medicine

async def get_from_icp(endpoint: str, params: dict = None) -> dict:
    """Retrieve data from ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        if params:
            response = requests.post(url, headers=HEADERS, json=params, timeout=30)
        else:
            response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to retrieve data: {str(e)}", "status": "failed"}

async def post_to_icp(endpoint: str, data: dict) -> dict:
    """Send data to ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        response = requests.post(url, headers=HEADERS, json=data, timeout=10)  # Reduced from 30s to 10s
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to post data: {str(e)}", "status": "failed"}

# === Pharmacy Business Logic ===
async def search_medicine_by_name(medicine_name: str, ctx: Context) -> dict:
    """Search for medicines by name in ICP backend"""
    try:
        import time
        search_start = time.time()
        ctx.logger.info(f"⏱️ [ICP] Starting ICP search for: {medicine_name}")
        
        # Search medicines by name using ICP backend
        search_params = {"medicine_name": medicine_name}
        icp_start = time.time()
        icp_result = await post_to_icp("search-medicines-by-name", search_params)
        icp_end = time.time()
        ctx.logger.info(f"⏱️ [ICP] ICP call took {icp_end - icp_start:.2f}s")
        
        if "error" in icp_result:
            ctx.logger.error(f"ICP search error: {icp_result['error']}")
            return {"error": icp_result["error"], "medicines": []}
        
        medicines = icp_result.get("medicines", [])
        ctx.logger.info(f"Found {len(medicines)} medicines for '{medicine_name}'")
        
        # Parse medicines with numeric keys to proper field names
        parse_start = time.time()
        parsed_medicines = [parse_medicine_data(med) for med in medicines]
        parse_end = time.time()
        ctx.logger.info(f"⏱️ [PARSE] Parsing took {parse_end - parse_start:.2f}s")
        
        # Debug: Log first medicine details if found
        if parsed_medicines:
            ctx.logger.info(f"First parsed medicine: {parsed_medicines[0]}")
        
        total_time = parse_end - search_start
        ctx.logger.info(f"⏱️ [TOTAL] Search function completed in {total_time:.2f}s")
        
        return {"medicines": parsed_medicines, "total_count": len(parsed_medicines)}
        
    except Exception as e:
        ctx.logger.error(f"Error searching medicine: {str(e)}")
        return {"error": f"Medicine search failed: {str(e)}", "medicines": []}

async def get_medicine_inventory(medicine_id: str, ctx: Context) -> dict:
    """Get detailed medicine inventory from ICP backend"""
    try:
        ctx.logger.info(f"Getting inventory for medicine ID: {medicine_id}")
        
        # Get medicine details from ICP backend
        inventory_params = {"medicine_id": medicine_id}
        icp_result = await post_to_icp("get-medicine-by-id", inventory_params)
        
        if "error" in icp_result:
            ctx.logger.error(f"ICP inventory error: {icp_result['error']}")
            return {"error": icp_result["error"]}
        
        # Parse the medicine data if it exists
        if "medicine" in icp_result and icp_result["medicine"]:
            icp_result["medicine"] = parse_medicine_data(icp_result["medicine"])
        
        return icp_result
        
    except Exception as e:
        ctx.logger.error(f"Error getting inventory: {str(e)}")
        return {"error": f"Inventory check failed: {str(e)}"}

async def place_medicine_order(medicine_id: str, quantity: int, user_id: str, prescription_id: Optional[str], ctx: Context) -> dict:
    """Place a medicine order through ICP backend"""
    try:
        ctx.logger.info(f"Placing order: Medicine {medicine_id}, Qty {quantity}, User {user_id}")
        
        # Place order using ICP backend
        order_params = {
            "medicine_id": medicine_id,
            "quantity": quantity,
            "user_id": user_id,
            "prescription_id": prescription_id
        }
        icp_result = await post_to_icp("place-medicine-order", order_params)
        
        if "error" in icp_result:
            ctx.logger.error(f"ICP order error: {icp_result['error']}")
            return {"error": icp_result["error"]}
        
        ctx.logger.info(f"Order result: {icp_result}")
        return icp_result
        
    except Exception as e:
        ctx.logger.error(f"Error placing order: {str(e)}")
        return {"error": f"Order placement failed: {str(e)}"}

async def get_available_medicines(ctx: Context) -> dict:
    """Get all available medicines from ICP backend"""
    try:
        ctx.logger.info("Getting available medicines")
        
        # Get available medicines from ICP backend
        icp_result = await post_to_icp("get-available-medicines", {})
        
        if "error" in icp_result:
            ctx.logger.error(f"ICP error: {icp_result['error']}")
            return {"error": icp_result["error"], "medicines": []}
        
        medicines = icp_result.get("medicines", [])
        ctx.logger.info(f"Found {len(medicines)} available medicines")
        
        # Parse medicines with numeric keys to proper field names
        parsed_medicines = [parse_medicine_data(med) for med in medicines]
        
        return {"medicines": parsed_medicines, "total_count": len(parsed_medicines)}
        
    except Exception as e:
        ctx.logger.error(f"Error getting available medicines: {str(e)}")
        return {"error": f"Failed to get available medicines: {str(e)}", "medicines": []}

def format_medicine_alternatives(alternatives: List[dict]) -> List[dict]:
    """Format alternative medicine suggestions for response"""
    formatted_alternatives = []
    for alt in alternatives[:3]:  # Limit to top 3 alternatives
        # Parse the alternative medicine data
        parsed_alt = parse_medicine_data(alt) if isinstance(alt, dict) and any(k.isdigit() for k in alt.keys() if '_' in k) else alt
        
        formatted_alternatives.append({
            "medicine_id": parsed_alt.get("medicine_id", ""),
            "name": parsed_alt.get("name", ""),
            "price": parsed_alt.get("price", 0.0),
            "stock": parsed_alt.get("stock", 0),
            "category": parsed_alt.get("category", ""),
            "description": parsed_alt.get("description", "")
        })
    return formatted_alternatives

# === Protocol Definition ===
pharmacy_protocol = Protocol(name="PharmacyProtocol", version="1.0")

@pharmacy_protocol.on_message(model=MedicineCheckRequest, replies=MedicineCheckResponse)
async def handle_medicine_check(ctx: Context, sender: str, msg: MedicineCheckRequest):
    """Handle medicine availability check requests from HealthAgent"""
    
    import time
    start_time = time.time()
    ctx.logger.info(f"⏱️ [TIMING] Started processing request at {start_time}")
    ctx.logger.info(f"Received medicine check request from {sender}: {msg.medicine_name}")
    
    try:
        # TEMPORARY: Skip ICP call for testing - just return a quick response
        if msg.medicine_name.lower() == "test":
            response = MedicineCheckResponse(
                medicine="Test Medicine",
                available=True,
                stock=100,
                price=5.99,
                status="available",
                message="Test response - no ICP call made"
            )
            ctx.logger.info(f"⏱️ [TEST] Using test response, skipping ICP")
        else:
            # Normal ICP flow
            # Search for the medicine by name
            search_start = time.time()
            search_result = await search_medicine_by_name(msg.medicine_name, ctx)
            search_end = time.time()
            ctx.logger.info(f"⏱️ [TIMING] Medicine search took {search_end - search_start:.2f}s")
            
            if "error" in search_result:
                response = MedicineCheckResponse(
                    medicine=msg.medicine_name,
                    available=False,
                    status="error",
                    message=f"Error checking medicine availability: {search_result['error']}"
                )
            elif not search_result.get("medicines", []):
                response = MedicineCheckResponse(
                    medicine=msg.medicine_name,
                    available=False,
                    status="not_found",
                    message=f"Medicine '{msg.medicine_name}' not found in our inventory"
                )
            else:
                # Get the first matching medicine
                medicine = search_result["medicines"][0]
                ctx.logger.info(f"Medicine data: {medicine}")
                
                stock_level = medicine.get("stock", 0)
                ctx.logger.info(f"Stock level for {medicine.get('name', 'Unknown')}: {stock_level}")
                
                is_available = stock_level > 0
                
                response = MedicineCheckResponse(
                    medicine=medicine.get("name", msg.medicine_name),
                    available=is_available,
                    stock=medicine.get("stock", 0),
                    price=medicine.get("price", 0.0),
                    status="available" if is_available else "out_of_stock",
                    message=f"Medicine found. Stock: {medicine.get('stock', 0)} units, Price: ${medicine.get('price', 0.0):.2f}"
                    if is_available 
                    else f"Medicine '{msg.medicine_name}' is currently out of stock"
                )
        
        ctx.logger.info(f"Sending medicine check response: {response.status}")
        send_start = time.time()
        await ctx.send(sender, response)
        send_end = time.time()
        total_time = send_end - start_time
        ctx.logger.info(f"⏱️ [TIMING] Response sent in {send_end - send_start:.2f}s, total processing: {total_time:.2f}s")
        
    except Exception as e:
        ctx.logger.error(f"Error handling medicine check: {str(e)}")
        error_response = MedicineCheckResponse(
            medicine=msg.medicine_name,
            available=False,
            status="error",
            message=f"Internal error checking medicine: {str(e)}"
        )
        await ctx.send(sender, error_response)

@pharmacy_protocol.on_message(model=MedicineOrderRequest, replies=MedicineOrderResponse)
async def handle_medicine_order(ctx: Context, sender: str, msg: MedicineOrderRequest):
    """Handle medicine order requests from HealthAgent"""
    
    ctx.logger.info(f"Received medicine order request from {sender}: {msg.medicine_id}, qty: {msg.quantity}")
    
    try:
        # Place the order through ICP backend
        order_result = await place_medicine_order(
            msg.medicine_id, 
            msg.quantity, 
            msg.user_id, 
            msg.prescription_id, 
            ctx
        )
        
        if "error" in order_result:
            # Handle different error types
            error_message = order_result["error"]
            
            if "prescription" in error_message.lower():
                status = "prescription_required"
            elif "stock" in error_message.lower() or "insufficient" in error_message.lower():
                status = "insufficient_stock"
            elif "not found" in error_message.lower():
                status = "not_found"
            else:
                status = "error"
            
            # Get suggested alternatives if available
            suggested_alternatives = None
            if order_result.get("suggested_alternatives"):
                suggested_alternatives = format_medicine_alternatives(order_result["suggested_alternatives"])
            
            response = MedicineOrderResponse(
                medicine=msg.medicine_name or "Unknown Medicine",
                medicine_id=msg.medicine_id,
                qty=msg.quantity,
                price=0.0,
                status=status,
                message=error_message,
                suggested_alternatives=suggested_alternatives
            )
        else:
            # Order was successful
            order_data = order_result.get("order", {})
            response = MedicineOrderResponse(
                medicine=order_data.get("medicine_name", msg.medicine_name or "Unknown Medicine"),
                medicine_id=msg.medicine_id,
                qty=msg.quantity,
                price=order_data.get("total_price", 0.0),
                status="confirmed",
                order_id=order_data.get("order_id"),
                message=f"Order confirmed! Total: ${order_data.get('total_price', 0.0):.2f}. Ready for pickup at HealthPlus Pharmacy."
            )
        
        ctx.logger.info(f"Sending medicine order response: {response.status}")
        await ctx.send(sender, response)
        
    except Exception as e:
        ctx.logger.error(f"Error handling medicine order: {str(e)}")
        error_response = MedicineOrderResponse(
            medicine=msg.medicine_name or "Unknown Medicine",
            medicine_id=msg.medicine_id,
            qty=msg.quantity,
            price=0.0,
            status="error",
            message=f"Internal error processing order: {str(e)}"
        )
        await ctx.send(sender, error_response)

# Include protocol in agent
agent.include(pharmacy_protocol)

@agent.on_event("startup")
async def pharmacy_agent_startup(ctx: Context):
    ctx.logger.info(f"🏥 PharmacyAgent started")
    ctx.logger.info(f"📋 Agent address: {agent.address}")
    ctx.logger.info(f"🔗 Protocol: PharmacyProtocol v1.0")
    ctx.logger.info(f"💊 Connected to medicine inventory canister: {CANISTER_ID}")
    ctx.logger.info(f"🔍 Ready for medicine check and order requests from HealthAgent")
    
    # Test connection to ICP backend
    try:
        available_medicines = await get_available_medicines(ctx)
        medicine_count = available_medicines.get("total_count", 0)
        ctx.logger.info(f"✅ Successfully connected to medicine inventory: {medicine_count} medicines available")
    except Exception as e:
        ctx.logger.warning(f"⚠️ Could not connect to medicine inventory: {str(e)}")

if __name__ == "__main__":
    print("Starting PharmacyAgent...")
    print(f"Agent Address: {agent.address}")
    print("Ready to handle medicine availability checks and orders!")
    agent.run()

"""
PHARMACY AGENT - USAGE EXAMPLES

🔍 Medicine Availability Check:
HealthAgent -> PharmacyAgent:
{
  "medicine_name": "Paracetamol",
  "quantity": 2
}

PharmacyAgent -> HealthAgent:
{
  "type": "MedicineCheckResponse",
  "medicine": "Paracetamol", 
  "available": true,
  "stock": 150,
  "price": 5.99,
  "status": "available",
  "message": "Medicine found. Stock: 150 units, Price: $5.99"
}

📦 Medicine Order:
HealthAgent -> PharmacyAgent:
{
  "medicine_id": "med_001",
  "medicine_name": "Paracetamol",
  "quantity": 2,
  "user_id": "user123"
}

PharmacyAgent -> HealthAgent:
{
  "type": "MedicineOrderResponse",
  "medicine": "Paracetamol",
  "medicine_id": "med_001", 
  "qty": 2,
  "price": 11.98,
  "status": "confirmed",
  "order_id": "ORD-2024-001",
  "message": "Order confirmed! Total: $11.98. Ready for pickup at HealthPlus Pharmacy."
}

🚫 Out of Stock with Alternatives:
{
  "type": "MedicineOrderResponse",
  "medicine": "Insulin Glargine",
  "status": "insufficient_stock", 
  "message": "Insufficient stock. Available: 0 units",
  "suggested_alternatives": [
    {
      "medicine_id": "med_010",
      "name": "Insulin Aspart", 
      "price": 75.50,
      "stock": 25,
      "category": "Diabetes"
    }
  ]
}

💊 Features:
- Real-time inventory checking via ICP backend
- Stock management with automatic updates
- Prescription validation for controlled medicines  
- Alternative medicine suggestions when out of stock
- Order confirmatiwon with pickup instructions
- JSON-only structured responses
- Error handling for all edge cases
"""