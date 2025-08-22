import datetime
import aiohttp
import json
import re
import os
from typing import Optional, List
from uagents import Agent, Context, Model, Protocol
import requests # Using requests for synchronous ICP calls for simplicity
from dotenv import load_dotenv

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

# Load environment variables
load_dotenv()

# Try to load from the ic/.env file first, then fallback to current directory
ic_env_path = os.path.join(os.path.dirname(__file__), '..', 'ic', '.env')
if os.path.exists(ic_env_path):
    load_dotenv(ic_env_path)

# --- ICP & LLM Configuration (MERGED FROM DOCTOR.PY) ---
CANISTER_ID = os.getenv("CANISTER_ID_BACKEND", "uxrrr-q7777-77774-qaaaq-cai")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4943")

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
    """Enhanced wellness advice with detailed sleep analysis and recommendations"""
    ctx.logger.info(f"Generated LLM Prompt: {prompt}")
    advice = []
    
    sleep_match = re.search(r"- (?:Hours Slept|Average Sleep): (\d+\.?\d*)", prompt)
    steps_match = re.search(r"- (?:Steps Taken|Average Steps): (\d+)", prompt)
    sleep = float(sleep_match.group(1)) if sleep_match else 99
    steps = int(steps_match.group(1)) if steps_match else 99999
    
    # Enhanced sleep analysis with detailed feedback
    if sleep_match:
        if sleep >= 8.5:
            advice.append(f"😴 **Excellent sleep quality!** {sleep:.1f} hours is outstanding - you're in the optimal range for recovery and mental performance.")
            advice.append("💡 **Sleep insight:** Your body had ample time for deep sleep cycles and REM recovery. This supports immune function and cognitive performance.")
        elif sleep >= 7:
            advice.append(f"😊 **Great sleep!** {sleep:.1f} hours falls in the healthy range recommended by sleep experts.")
            advice.append("💡 **Sleep insight:** You're getting quality restorative sleep. This supports mood regulation and physical recovery.")
        elif sleep >= 6:
            advice.append(f"⚠️ **Moderate sleep:** {sleep:.1f} hours is on the lower end. Consider aiming for 7-8 hours for optimal health benefits.")
            advice.append("💡 **Sleep tip:** Try establishing a consistent bedtime routine 30 minutes before sleep to improve sleep quality.")
        else:
            advice.append(f"🚨 **Sleep deficit detected:** {sleep:.1f} hours is below recommended levels. Prioritizing sleep can significantly improve your health.")
            advice.append("💡 **Sleep recovery:** Consider power naps (20-30 min) and avoid caffeine after 2PM to improve tonight's sleep.")
    
    # Enhanced steps analysis
    if steps_match:
        if steps >= 10000:
            advice.append(f"🚶‍♂️ **Activity champion!** {steps:,} steps is excellent - you're exceeding daily activity goals!")
            advice.append("💪 **Fitness insight:** This level of activity supports cardiovascular health and helps maintain healthy weight.")
        elif steps >= 5000:
            advice.append(f"👍 **Good activity level:** {steps:,} steps shows you're staying active throughout the day.")
            advice.append("🎯 **Activity tip:** Try to reach 10,000 steps by adding short walks after meals or taking stairs when possible.")
        else:
            advice.append(f"📈 **Activity opportunity:** {steps:,} steps is a good start! Small increases in daily movement can have big health benefits.")
            advice.append("💡 **Movement tip:** Even 10-minute walks can boost energy and improve circulation. Start small and build consistency!")
    
    # General wellness encouragement if no specific data
    if "daily log" in prompt and "Exercise Done: Not logged" in prompt:
        advice.append("🏃‍♀️ **Exercise reminder:** Regular movement is key to wellness. Even light stretching or a 5-minute walk counts!")
    
    # Default positive reinforcement
    if not advice:
        advice.append("✨ **Wellness tracking active!** You're building healthy habits by monitoring your daily activities. Consistency is key to long-term health!")
        advice.append("📊 **Pro tip:** Regular logging helps identify patterns and optimize your health routine over time.")
    
    return advice

# --- Agent Setup ---
# In wellness.py
wellness_agent = Agent(
    name="wellness_agent",
    port=8003,
    seed="new_wellness_agent_secret_seed_2025",
    mailbox=os.environ.get("MAILBOX_API_KEY"), 
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