# wellness_agent.py
import datetime
import aiohttp
import json
import re
from typing import Optional, List
from uagents import Agent, Context, Model, Protocol
import requests # Using requests for synchronous ICP calls for simplicity

# --- Agent communication with request tracking ---
class RequestACK(Model):
    request_id: str
    agent_type: str  # "doctor", "pharmacy", or "wellness"
    message: str = "Request received and processing"
    timestamp: str

# --- MESSAGE MODELS ---
class WellnessLog(Model):
    user_id: str
    date: str
    sleep: Optional[float] = None
    steps: Optional[int] = None
    exercise: Optional[str] = None
    mood: Optional[str] = None
    water_intake: Optional[float] = None

class LogRequest(Model):
    request_id: str  # For correlation
    sleep: Optional[float] = None
    steps: Optional[int] = None
    exercise: Optional[str] = None
    mood: Optional[str] = None
    water_intake: Optional[float] = None
    user_id: str = "user123"

class StoreResponse(Model):
    success: bool
    message: str
    id: Optional[str] = None
    logged_data: Optional[dict] = None  # Changed from WellnessLog to dict

class SummaryRequest(Model):
    request_id: str  # For correlation
    days: int = 7
    user_id: str = "user123"

class WellnessAdviceResponse(Model):
    request_id: str  # Echo back for correlation
    summary: Optional[str] = None
    advice: List[str]
    success: bool = True
    message: str = ""

# --- ICP & LLM Configuration (MERGED FROM DOCTOR.PY) ---
CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai"
BASE_URL = "http://127.0.0.1:4943"

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# --- ICP HELPER FUNCTIONS (ADAPTED FROM DOCTOR.PY) ---
def store_to_icp(endpoint: str, data: dict, ctx: Context) -> dict:
    """Store data to ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        ctx.logger.info(f"Storing data to ICP: {url} with payload {data}")
        response = requests.post(url, headers=HEADERS, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        ctx.logger.error(f"Failed to store data to ICP: {str(e)}")
        return {"error": f"Failed to store data: {str(e)}", "status": "failed"}

def get_from_icp(endpoint: str, params: dict, ctx: Context) -> dict:
    """Retrieve data from ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        ctx.logger.info(f"Getting data from ICP: {url} with params {params}")
        response = requests.post(url, headers=HEADERS, json=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        ctx.logger.error(f"Failed to retrieve data from ICP: {str(e)}")
        return {"error": f"Failed to retrieve data: {str(e)}", "status": "failed"}

def parse_wellness_from_icp(log_data: dict) -> dict:
    """Convert ICP wellness log format to a standard dictionary if needed."""
    # This is a placeholder. Adjust based on your canister's actual return format.
    # For now, we assume it returns a clean dictionary.
    return {
        "sleep": log_data.get("sleep"),
        "steps": log_data.get("steps"),
        "exercise": log_data.get("exercise"),
        "date": log_data.get("date"),
        "mood": log_data.get("mood"),
        "water_intake": log_data.get("water_intake")
    }

# --- LLM Function (Unchanged) ---
async def get_llm_advice(prompt: str, ctx: Context) -> List[str]:
    # This function remains the same, providing simulated advice
    ctx.logger.info(f"Generated LLM Prompt: {prompt}")
    advice = []
    sleep_match = re.search(r"- (?:Hours Slept|Average Sleep): (\d+\.?\d*)", prompt)
    steps_match = re.search(r"- (?:Steps Taken|Average Steps): (\d+)", prompt)
    sleep = float(sleep_match.group(1)) if sleep_match else 99
    steps = int(steps_match.group(1)) if steps_match else 99999
    if sleep < 6: advice.append(f"Your sleep of {sleep:.1f} hours is a bit short. Aiming for 7-8 hours can make a huge difference!")
    if steps < 5000: advice.append(f"With {steps} steps, you're on your way! A short walk could be a great way to boost that number.")
    if "daily log" in prompt and "Exercise Done: Not logged" in prompt: advice.append("Remembering to get some exercise is a great goal.")
    if not advice: advice.append("Fantastic work on your wellness today! Keep up the amazing consistency!")
    return advice

# --- Agent Setup ---
wellness_agent = Agent(
    name="wellness_agent",
    port=8003,
    seed="wellness_agent_secret_seed_phrase_123",
    mailbox=True,
)

wellness_protocol = Protocol("WellnessProtocol", version="1.0")
ack_protocol = Protocol(name="ACKProtocol", version="1.0")

@wellness_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("Wellness Agent is ready and connected to ICP.")
    ctx.logger.info(f"My address is: {ctx.agent.address}")

@wellness_protocol.on_message(model=LogRequest, replies=WellnessAdviceResponse)
async def handle_log_request(ctx: Context, sender: str, msg: LogRequest):
    """Handles log requests and stores them on the ICP canister."""
    ctx.logger.info(f"Received log from {sender}. Request ID: {msg.request_id}")
    
    # Send immediate ACK
    ack = RequestACK(
        request_id=msg.request_id,
        agent_type="wellness",
        message=f"Wellness log request received and processing",
        timestamp=datetime.datetime.now().isoformat()
    )
    await ctx.send(sender, ack)
    
    ctx.logger.info("Storing wellness data to ICP canister...")
    
    wellness_log = WellnessLog(
        user_id=msg.user_id,
        date=datetime.date.today().isoformat(),
        sleep=msg.sleep,
        steps=msg.steps,
        exercise=msg.exercise,
        mood=msg.mood,
        water_intake=msg.water_intake
    )
    
    # Send wellness log directly (not wrapped in payload)
    log_payload = wellness_log.dict()
    
    # Store data on-chain
    store_result = store_to_icp("add-wellness-log", log_payload, ctx)
    
    if "error" in store_result:
        error_response = WellnessAdviceResponse(
            request_id=msg.request_id,
            summary=None,
            advice=[f"Error storing data: {store_result['error']}"],
            success=False,
            message=f"Error storing data: {store_result['error']}"
        )
        await ctx.send(sender, error_response)
        return

    ctx.logger.info("Log stored successfully. Getting LLM advice...")
    
    daily_prompt = (f"User's daily log:\n- Hours Slept: {msg.sleep or 'Not logged'}\n- Steps Taken: {msg.steps or 'Not logged'}\n- Exercise Done: {msg.exercise or 'Not logged'}")
    advice_from_llm = await get_llm_advice(daily_prompt, ctx)
    
    success_response = WellnessAdviceResponse(
        request_id=msg.request_id,
        summary=f"Successfully logged your wellness data for {datetime.date.today().isoformat()}",
        advice=advice_from_llm,
        success=True,
        message="Data logged successfully"
    )
    await ctx.send(sender, success_response)

@wellness_protocol.on_message(model=SummaryRequest, replies=WellnessAdviceResponse)
async def handle_summary_request(ctx: Context, sender: str, msg: SummaryRequest):
    """Handles summary requests by querying the ICP canister."""
    ctx.logger.info(f"Received summary request for user {msg.user_id}. Request ID: {msg.request_id}")
    
    # Send immediate ACK
    ack = RequestACK(
        request_id=msg.request_id,
        agent_type="wellness",
        message=f"Wellness summary request received and processing",
        timestamp=datetime.datetime.now().isoformat()
    )
    await ctx.send(sender, ack)
    
    ctx.logger.info("Querying wellness data from ICP canister...")

    icp_params = {"user_id": msg.user_id, "days": msg.days}
    response_data = get_from_icp("get-wellness-summary", icp_params, ctx)

    if "error" in response_data:
        await ctx.send(sender, WellnessAdviceResponse(
            request_id=msg.request_id,
            summary="Could not retrieve summary from the canister.",
            advice=[response_data["error"]],
            success=False,
            message=response_data["error"]
        ))
        return

    # Assuming the canister returns a list of log objects
    logs = [parse_wellness_from_icp(log) for log in response_data.get("logs", [])]
    
    summary_text = "No logs found for the requested period."
    advice_text = ["Start logging your daily habits to track your progress."]

    if logs:
        total_sleep = sum(log.get('sleep') or 0 for log in logs)
        total_steps = sum(log.get('steps') or 0 for log in logs)
        logs_found = len(logs)
        
        avg_sleep = total_sleep / logs_found if logs_found > 0 else 0
        avg_steps = total_steps / logs_found if logs_found > 0 else 0
        
        summary_text = (
            f"Here is your summary for the last {logs_found} logged day(s): "
            f"Average sleep: {avg_sleep:.1f} hours. "
            f"Average steps: {int(avg_steps)}."
        )
        
        summary_prompt = (f"User's Weekly Summary:\n- Average Sleep: {avg_sleep:.1f} hours\n- Average Steps: {int(avg_steps)}")
        advice_text = await get_llm_advice(summary_prompt, ctx)

    await ctx.send(sender, WellnessAdviceResponse(
        request_id=msg.request_id,
        summary=summary_text, 
        advice=advice_text,
        success=True,
        message="Summary retrieved successfully"
    ))

# ACK handler
@ack_protocol.on_message(model=RequestACK)
async def handle_request_ack(ctx: Context, sender: str, msg: RequestACK):
    """Handle ACK responses from HealthAgent"""
    ctx.logger.info(f"✅ Received ACK from health agent: {msg.message} (Request: {msg.request_id})")

wellness_agent.include(wellness_protocol)
wellness_agent.include(ack_protocol)

if __name__ == "__main__":
    wellness_agent.run()