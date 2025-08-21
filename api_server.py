from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional
from datetime import datetime, timezone

app = FastAPI(title="HealthAgent API", description="API for HealthAgent chat interface")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = "user123"

class ChatResponse(BaseModel):
    response: str
    agent: str
    status: str = "success"

AGENT_ENDPOINTS = {
    "health": "http://localhost:8000",  # Main health agent
    "doctor": "http://localhost:8001",
    "pharmacy": "http://localhost:8002", 
    "wellness": "http://localhost:8003"
}

def classify_intent(message: str) -> str:
    """Simple intent classification to route to appropriate agent"""
    message_lower = message.lower()
    
    # Doctor keywords
    if any(word in message_lower for word in ["doctor", "appointment", "book", "schedule", "cardiologist", "dermatologist", "neurologist", "specialist"]):
        return "doctor"
    
    # Pharmacy keywords  
    if any(word in message_lower for word in ["medicine", "pharmacy", "drug", "prescription", "available", "buy", "paracetamol", "ibuprofen"]):
        return "pharmacy"
    
    # Wellness keywords
    if any(word in message_lower for word in ["sleep", "steps", "exercise", "workout", "walked", "mood", "water", "hours"]):
        return "wellness"
    
    # Symptom keywords
    if any(word in message_lower for word in ["symptom", "pain", "hurt", "ache", "sick", "feel", "headache", "fever"]):
        return "health"
    
    return "health"  # Default to main health agent

async def send_to_agent(message: str, agent_type: str) -> dict:
    """Send message to the appropriate agent and get response"""
    
    # For now, simulate agent responses based on the existing agent.py logic
    # In a production environment, this would use uAgents protocol or HTTP API
    
    if agent_type == "doctor":
        return {
            "response": "📅 I'm finding you a doctor and scheduling your appointment...\n\n✅ Appointment booked! Dr. Sarah Wilson (General Practitioner) on Tomorrow at 10:00 AM. Reference: APT-20250821-A1B2C3\n\nYour appointment has been confirmed. Please arrive 15 minutes early with a valid ID.",
            "agent": "doctor",
            "status": "success"
        }
    
    elif agent_type == "pharmacy":
        return {
            "response": "🔍 Checking medicine availability...\n\n✅ **Paracetamol** is available at HealthPlus Pharmacy\n\n📦 **Stock:** 150 units in inventory\n💰 **Price:** $5.99 per unit\n💡 **Usage:** Pain relief and fever reduction\n\nWould you like me to help you place an order for this medicine?",
            "agent": "pharmacy", 
            "status": "success"
        }
    
    elif agent_type == "wellness":
        return {
            "response": "📊 Logging your wellness data...\n\n✅ **Wellness Data Logged Successfully!**\n\n📊 **Summary:** Successfully logged your wellness data for today\n\n💡 **AI Wellness Advice:**\n• Great job staying active today!\n• Your activity level shows good consistency\n• Consider maintaining this healthy routine",
            "agent": "wellness",
            "status": "success"
        }
    
    else:  # health agent (general)
        if any(word in message.lower() for word in ["symptom", "pain", "hurt", "ache", "sick", "feel", "headache", "fever"]):
            return {
                "response": "✅ Symptoms logged: '" + message + "'\n\n🔍 Detected symptoms: fever, headache\n\n🏥 **AI Analysis - Likely conditions:**\n  • 🔵 **Upper Respiratory Infection** (85% confidence)\n  • 🟡 **Viral Infection** (70% confidence)\n\n👨‍⚕️ **Recommended specialists:** General Practitioner\n\n💡 **AI Insight:** These symptoms commonly indicate viral infections.\n\n📅 Would you like me to book an appointment with a General Practitioner?",
                "agent": "health",
                "status": "success"
            }
        else:
            return {
                "response": "Hello! I'm your HealthAgent powered by ASI1 AI. I can help you with:\n\n🩺 **Symptom Analysis:** Tell me how you feel\n💊 **Medicine Checks:** Ask about any medication\n👨‍⚕️ **Doctor Booking:** Request specialist appointments\n💪 **Wellness Tracking:** Log your daily activities\n\nWhat would you like help with today?",
                "agent": "general",
                "status": "success"
            }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(message: ChatMessage):
    """Main chat endpoint that routes messages to appropriate agents"""
    try:
        # Classify the intent and route to appropriate agent
        agent_type = classify_intent(message.message)
        
        # Send to agent and get response
        result = await send_to_agent(message.message, agent_type)
        
        return ChatResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/agent-status")
async def agent_status():
    """Check status of all agents"""
    return {
        "doctor": True,  # In production, ping actual agent endpoints
        "pharmacy": True,
        "wellness": True,
        "health": True
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)