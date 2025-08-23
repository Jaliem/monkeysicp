import datetime
import json
import re
import os
from typing import Optional, List
from uagents import Agent, Context, Model, Protocol
import requests
from dotenv import load_dotenv

# --- Agent communication with request tracking ---
class RequestACK(Model):
    request_id: str
    agent_type: str = "wellness"
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

# === Configuration (same as doctor.py) ===
CANISTER_ID = os.getenv("CANISTER_ID_BACKEND", "uxrrr-q7777-77774-qaaaq-cai")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4943")

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# === Agent Setup (same pattern as doctor.py) ===
agent = Agent(
    name="wellness_agent",
    seed="healthcare_wellness_agent_2025_unique_seed_v1",
    port=8003,
    mailbox=True,
)

# === ICP Integration Functions (same pattern as doctor.py) ===
async def store_to_icp(endpoint: str, data: dict) -> dict:
    """Store data to ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        response = requests.post(url, headers=HEADERS, json=data, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to store data: {str(e)}", "status": "failed"}

async def get_from_icp(endpoint: str, params: dict = None) -> dict:
    """Retrieve data from ICP canister backend"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        if params:
            response = requests.post(url, headers=HEADERS, json=params, timeout=10)
        else:
            response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to retrieve data: {str(e)}", "status": "failed"}

def parse_wellness_from_icp(log_data: dict) -> dict:
    """Convert ICP wellness log format to a standard dictionary if needed."""
    return {
        "sleep": log_data.get("sleep"),
        "steps": log_data.get("steps"),
        "exercise": log_data.get("exercise"),
        "date": log_data.get("date"),
        "mood": log_data.get("mood"),
        "water_intake": log_data.get("water_intake")
    }

# === Wellness Business Logic ===
async def log_wellness_data(wellness_data: WellnessLog) -> dict:
    """Log wellness data to ICP backend"""
    try:
        # Convert to dictionary for ICP storage
        log_payload = wellness_data.dict()
        
        # Store data on-chain
        store_result = await store_to_icp("add-wellness-log", log_payload)
        
        if "error" in store_result:
            return {"success": False, "error": store_result["error"]}
        
        return {"success": True, "message": "Wellness data logged successfully"}
        
    except Exception as e:
        return {"success": False, "error": f"Failed to log wellness data: {str(e)}"}

async def get_wellness_summary(user_id: str, days: int = 7) -> dict:
    """Get wellness summary from ICP backend"""
    try:
        icp_params = {"user_id": user_id, "days": days}
        response_data = await get_from_icp("get-wellness-summary", icp_params)

        if "error" in response_data:
            return {"success": False, "error": response_data["error"]}

        # Parse logs from ICP
        logs = [parse_wellness_from_icp(log) for log in response_data.get("logs", [])]
        
        if not logs:
            return {
                "success": True,
                "summary": "No logs found for the requested period.",
                "advice": ["Start logging your daily habits to track your progress."],
                "logs": []
            }

        # Calculate averages
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
        
        return {
            "success": True,
            "summary": summary_text,
            "logs": logs,
            "avg_sleep": avg_sleep,
            "avg_steps": avg_steps
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to get wellness summary: {str(e)}"}

# === LLM Advice Generation ===
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

# === Protocol Definition ===
wellness_protocol = Protocol(name="WellnessProtocol", version="1.0")
ack_protocol = Protocol(name="ACKProtocol", version="1.0")

@wellness_protocol.on_message(model=LogRequest, replies=WellnessAdviceResponse)
async def handle_log_request(ctx: Context, sender: str, msg: LogRequest):
    """Handle wellness log requests from HealthAgent"""
    
    ctx.logger.info(f"Received log request from {sender}: {msg.request_id}")
    
    try:
        # Send immediate ACK
        ack = RequestACK(
            request_id=msg.request_id,
            message=f"Wellness log request received and processing",
            timestamp=datetime.datetime.now().isoformat()
        )
        await ctx.send(sender, ack)
        
        # Create wellness log
        wellness_log = WellnessLog(
            user_id=msg.user_id,
            date=datetime.date.today().isoformat(),
            sleep=msg.sleep,
            steps=msg.steps,
            exercise=msg.exercise,
            mood=msg.mood,
            water_intake=msg.water_intake
        )
        
        # Log to ICP backend
        log_result = await log_wellness_data(wellness_log)
        
        if not log_result["success"]:
            error_response = WellnessAdviceResponse(
                request_id=msg.request_id,
                summary=None,
                advice=[f"Error logging data: {log_result['error']}"],
                success=False,
                message=log_result['error']
            )
            await ctx.send(sender, error_response)
            return
        
        # Generate advice
        daily_prompt = f"User's daily log:\n- Hours Slept: {msg.sleep or 'Not logged'}\n- Steps Taken: {msg.steps or 'Not logged'}\n- Exercise Done: {msg.exercise or 'Not logged'}"
        advice_from_llm = await get_llm_advice(daily_prompt, ctx)
        
        # Send success response
        success_response = WellnessAdviceResponse(
            request_id=msg.request_id,
            summary=f"Successfully logged your wellness data for {datetime.date.today().isoformat()}",
            advice=advice_from_llm,
            success=True,
            message="Data logged successfully"
        )
        
        ctx.logger.info(f"Sending wellness advice response")
        await ctx.send(sender, success_response)
        
    except Exception as e:
        ctx.logger.error(f"Error handling wellness log: {str(e)}")
        error_response = WellnessAdviceResponse(
            request_id=msg.request_id,
            summary=None,
            advice=[f"Internal error: {str(e)}"],
            success=False,
            message=f"Internal error: {str(e)}"
        )
        await ctx.send(sender, error_response)

@wellness_protocol.on_message(model=SummaryRequest, replies=WellnessAdviceResponse)
async def handle_summary_request(ctx: Context, sender: str, msg: SummaryRequest):
    """Handle wellness summary requests from HealthAgent"""
    
    ctx.logger.info(f"Received summary request from {sender}: {msg.request_id}")
    
    try:
        # Send immediate ACK
        ack = RequestACK(
            request_id=msg.request_id,
            message=f"Wellness summary request received and processing",
            timestamp=datetime.datetime.now().isoformat()
        )
        await ctx.send(sender, ack)
        
        # Get summary from ICP backend
        summary_result = await get_wellness_summary(msg.user_id, msg.days)
        
        if not summary_result["success"]:
            error_response = WellnessAdviceResponse(
                request_id=msg.request_id,
                summary="Could not retrieve summary from the canister.",
                advice=[summary_result["error"]],
                success=False,
                message=summary_result["error"]
            )
            await ctx.send(sender, error_response)
            return
        
        # Generate advice for summary
        advice_text = ["Start logging your daily habits to track your progress."]
        if summary_result.get("logs"):
            avg_sleep = summary_result.get("avg_sleep", 0)
            avg_steps = summary_result.get("avg_steps", 0)
            summary_prompt = f"User's Weekly Summary:\n- Average Sleep: {avg_sleep:.1f} hours\n- Average Steps: {int(avg_steps)}"
            advice_text = await get_llm_advice(summary_prompt, ctx)
        
        # Send summary response
        summary_response = WellnessAdviceResponse(
            request_id=msg.request_id,
            summary=summary_result.get("summary", "No data available"),
            advice=advice_text,
            success=True,
            message="Summary retrieved successfully"
        )
        
        ctx.logger.info(f"Sending wellness summary response")
        await ctx.send(sender, summary_response)
        
    except Exception as e:
        ctx.logger.error(f"Error handling wellness summary: {str(e)}")
        error_response = WellnessAdviceResponse(
            request_id=msg.request_id,
            summary="Error retrieving summary",
            advice=[f"Internal error: {str(e)}"],
            success=False,
            message=f"Internal error: {str(e)}"
        )
        await ctx.send(sender, error_response)

# ACK handler
@ack_protocol.on_message(model=RequestACK)
async def handle_request_ack(ctx: Context, sender: str, msg: RequestACK):
    """Handle ACK responses from HealthAgent"""
    ctx.logger.info(f"Received ACK from health agent: {msg.message} (Request: {msg.request_id})")

# Include protocols in agent
agent.include(wellness_protocol)
agent.include(ack_protocol)

@agent.on_event("startup")
async def wellness_agent_startup(ctx: Context):
    ctx.logger.info(f"WellnessAgent started")
    ctx.logger.info(f"Agent address: {agent.address}")
    ctx.logger.info(f"Protocol: WellnessProtocol v1.0")
    ctx.logger.info(f"Connected to wellness canister: {CANISTER_ID}")
    ctx.logger.info(f"Ready for wellness logging and summary requests from HealthAgent")

if __name__ == "__main__":
    print("Starting WellnessAgent...")
    print(f"Agent Address: {agent.address}")
    print("Ready to handle wellness data logging and summaries!")
    agent.run()