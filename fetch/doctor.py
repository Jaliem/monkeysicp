import requests
import json
from uagents import Agent, Context, Protocol, Model
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional

# === Configuration ===
AGENTVERSE_API_KEY = "sk_5666831f85d54da1a2922c9b9c53cf2784bc53e6a9fa48f0987ec74efb26737e"
CANISTER_ID = "bkyz2-fmaaa-aaaaa-qaaaq-cai"  # Updated to match HealthAgent canister
BASE_URL = "http://127.0.0.1:4943"

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# === Agent Setup ===
agent = Agent(
    name="doctor_agent",
    seed="healthcare_doctor_booking_agent_2025_unique_seed_v1",
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"],
    mailbox=True,
)

# === Message Models for HealthAgent Communication ===
class DoctorBookingRequest(Model):
    specialty: str
    preferred_time: str
    urgency: str = "normal"
    symptoms: Optional[str] = None
    user_id: str = "user123"

class DoctorBookingResponse(Model):
    status: str
    doctor_name: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_id: Optional[str] = None
    message: str

class DoctorSearchRequest(Model):
    specialty: str

class DoctorSearchResponse(Model):
    doctors: list
    total_count: int
    status: str = "success"

# Doctor database moved to ICP backend - no local storage needed

def parse_doctor_from_icp(doctor_data: dict) -> dict:
    """Convert ICP numeric key format to readable doctor fields"""
    # Map numeric keys to field names based on ICP response pattern
    parsed_doctor = {}
    for key, value in doctor_data.items():
        if isinstance(value, str):
            if "card_" in value or "derm_" in value or "neuro_" in value or "ortho_" in value or "pedia_" in value or "onco_" in value or "psych_" in value or "gp_" in value:
                parsed_doctor["doctor_id"] = value
            elif "Dr." in value:
                parsed_doctor["name"] = value
            elif value in ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Psychiatry", "General Practitioner"]:
                parsed_doctor["specialty"] = value
            elif "MD" in value or "FACC" in value or "FAAD" in value:
                parsed_doctor["qualifications"] = value
        elif isinstance(value, list):
            if all(isinstance(item, str) and ":" in item for item in value):
                parsed_doctor["available_slots"] = value
            elif all(isinstance(item, str) and item in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] for item in value):
                parsed_doctor["available_days"] = value
        elif isinstance(value, int):
            parsed_doctor["experience_years"] = value
        elif isinstance(value, float):
            parsed_doctor["rating"] = value
    
    return parsed_doctor

async def store_to_icp(endpoint: str, data: dict) -> dict:
    """Store data to ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        response = requests.post(url, headers=HEADERS, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to store data: {str(e)}", "status": "failed"}

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

async def search_doctors_by_specialty(specialty: str) -> list:
    """Search for doctors by specialty using ICP backend"""
    try:
        # Normalize specialty names to match backend data
        specialty_normalized = normalize_specialty(specialty)
        print(f"[DEBUG] Original specialty: '{specialty}' -> Normalized: '{specialty_normalized}'")
        
        # Get doctors from ICP backend
        response = await get_from_icp("get-doctors-by-specialty", {"specialty": specialty_normalized})
        print(f"[DEBUG] ICP response: {response}")
        
        if "error" in response:
            print(f"[DEBUG] ICP returned error: {response['error']}")
            return []
        
        # Parse doctors from ICP numeric key format to readable fields
        raw_doctors = response.get("doctors", [])
        print(f"[DEBUG] Raw doctors count: {len(raw_doctors)}")
        parsed_doctors = [parse_doctor_from_icp(doctor) for doctor in raw_doctors]
        print(f"[DEBUG] Parsed doctors count: {len(parsed_doctors)}")
        return parsed_doctors
        
    except Exception as e:
        print(f"[DEBUG] Exception in search: {str(e)}")
        return []

def normalize_specialty(specialty: str) -> str:
    """Normalize specialty names to match backend database"""
    specialty_lower = specialty.lower().strip()
    
    # Map different ways of saying specialties to standardized names
    if any(term in specialty_lower for term in ["cardiologist", "cardiology", "heart"]):
        return "Cardiology"
    elif any(term in specialty_lower for term in ["dermatologist", "dermatology", "skin"]):
        return "Dermatology"
    elif any(term in specialty_lower for term in ["neurologist", "neurology", "brain"]):
        return "Neurology"
    elif any(term in specialty_lower for term in ["orthopedic", "orthopedics", "bone"]):
        return "Orthopedics"
    elif any(term in specialty_lower for term in ["pediatrician", "pediatrics", "child"]):
        return "Pediatrics"
    elif any(term in specialty_lower for term in ["oncologist", "oncology", "cancer"]):
        return "Oncology"
    elif any(term in specialty_lower for term in ["psychiatrist", "psychiatry", "mental"]):
        return "Psychiatry"
    else:
        return "General Practitioner"

async def book_appointment(doctor_info: dict, preferred_time: str, urgency: str, symptoms: str, user_id: str) -> dict:
    """Book an appointment with a doctor"""
    try:
        # Generate appointment details
        appointment_id = f"APT-{datetime.now().strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}"
        
        # Simple time scheduling logic
        if preferred_time.lower() in ["today", "asap", "urgent"]:
            appointment_date = datetime.now().strftime("%Y-%m-%d")
            appointment_time = doctor_info["available_slots"][0] if doctor_info["available_slots"] else "09:00"
        elif preferred_time.lower() == "tomorrow":
            appointment_date = datetime.now().replace(day=datetime.now().day + 1).strftime("%Y-%m-%d")
            appointment_time = doctor_info["available_slots"][0] if doctor_info["available_slots"] else "09:00"
        else:
            # Default to next available slot
            appointment_date = datetime.now().replace(day=datetime.now().day + 1).strftime("%Y-%m-%d")
            appointment_time = doctor_info["available_slots"][0] if doctor_info["available_slots"] else "09:00"
        
        appointment_data = {
            "appointment_id": appointment_id,
            "doctor_id": doctor_info["doctor_id"],
            "doctor_name": doctor_info["name"],
            "specialty": doctor_info["specialty"],
            "patient_symptoms": symptoms,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "status": "confirmed",
            "urgency": urgency,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id
        }
        
        # Store appointment in ICP canister
        store_result = await store_to_icp("store-appointment", appointment_data)
        
        if "error" in store_result:
            return {"success": False, "error": store_result["error"]}
        
        return {
            "success": True,
            "appointment_id": appointment_id,
            "doctor_name": doctor_info["name"],
            "appointment_time": f"{appointment_date} at {appointment_time}",
            "message": "Appointment successfully booked"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to book appointment: {str(e)}"}

# === Protocol ===
doctor_protocol = Protocol(name="DoctorBookingProtocol", version="1.0")

@doctor_protocol.on_message(model=DoctorBookingRequest, replies=DoctorBookingResponse)
async def handle_doctor_booking(ctx: Context, sender: str, msg: DoctorBookingRequest):
    """Handle doctor appointment booking requests from HealthAgent"""
    
    ctx.logger.info(f"Received booking request for {msg.specialty}")
    
    try:
        ctx.logger.info("Step 1: Starting doctor search...")
        # Search for doctors by specialty
        available_doctors = await search_doctors_by_specialty(msg.specialty)
        ctx.logger.info(f"Step 1 complete: Found {len(available_doctors)} doctors")
        
        if not available_doctors:
            ctx.logger.warning(f"No doctors found for specialty: {msg.specialty}")
            response = DoctorBookingResponse(
                status="error",
                message=f"No doctors found for specialty: {msg.specialty}"
            )
        else:
            # Select first available doctor
            selected_doctor = available_doctors[0]
            ctx.logger.info(f"Step 2: Selected doctor: {selected_doctor.get('name', 'Unknown')}")
            
            ctx.logger.info("Step 3: Starting appointment booking...")
            # Book appointment
            booking_result = await book_appointment(
                selected_doctor, 
                msg.preferred_time, 
                msg.urgency, 
                msg.symptoms, 
                msg.user_id
            )
            ctx.logger.info(f"Step 3 complete: Booking result: {booking_result.get('success', False)}")
            
            if booking_result["success"]:
                response = DoctorBookingResponse(
                    status="success",
                    doctor_name=booking_result["doctor_name"],
                    appointment_time=booking_result["appointment_time"],
                    appointment_id=booking_result["appointment_id"],
                    message=booking_result["message"]
                )
                ctx.logger.info(f"SUCCESS: Appointment booked: {booking_result['appointment_id']}")
            else:
                response = DoctorBookingResponse(
                    status="error",
                    message=booking_result["error"]
                )
                ctx.logger.error(f"BOOKING FAILED: {booking_result['error']}")
        
        ctx.logger.info("Step 4: Sending response back to HealthAgent...")
        await ctx.send(sender, response)
        ctx.logger.info("Step 4 complete: Response sent")
        
    except Exception as e:
        ctx.logger.error(f"EXCEPTION in booking handler: {str(e)}")
        error_response = DoctorBookingResponse(
            status="error",
            message=f"Internal error: {str(e)}"
        )
        await ctx.send(sender, error_response)

@doctor_protocol.on_message(model=DoctorSearchRequest, replies=DoctorSearchResponse)
async def handle_doctor_search(ctx: Context, sender: str, msg: DoctorSearchRequest):
    """Handle doctor search requests"""
    
    ctx.logger.info(f"Received search request from {sender}: {msg.specialty}")
    
    try:
        available_doctors = await search_doctors_by_specialty(msg.specialty)
        
        response = DoctorSearchResponse(
            doctors=available_doctors,
            total_count=len(available_doctors),
            status="success"
        )
        
        ctx.logger.info(f"Found {len(available_doctors)} doctors for {msg.specialty}")
        await ctx.send(sender, response)
        
    except Exception as e:
        ctx.logger.error(f"Error handling search request: {str(e)}")
        error_response = DoctorSearchResponse(
            doctors=[],
            total_count=0,
            status="error"
        )
        await ctx.send(sender, error_response)

agent.include(doctor_protocol)

@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Doctor Booking Agent started")
    ctx.logger.info(f"Agent address: {agent.address}")
    ctx.logger.info(f"Connected to canister: {CANISTER_ID}")
    ctx.logger.info("Ready for HealthAgent connection")

if __name__ == "__main__":
    agent.run()
