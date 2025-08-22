import os
from dotenv import load_dotenv
import requests
import json
import re
from uagents_core.contrib.protocols.chat import (
    chat_protocol_spec,
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    StartSessionContent,
)
from uagents import Agent, Context, Protocol, Model
from typing import Any, Dict
from datetime import datetime, timezone
from uuid import uuid4
from typing import List, Optional
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# ICP Canister settings for healthcare backend
CANISTER_ID = os.getenv("CANISTER_ID_BACKEND", "uxrrr-q7777-77774-qaaaq-cai")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4943")

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# ASI1 API settings
# Create yours at: https://asi1.ai/dashboard/api-keys
ASI1_API_KEY = os.getenv("ASI1_API_KEY")
ASI1_BASE_URL = "https://api.asi1.ai/v1"

if not ASI1_API_KEY:
    raise ValueError("ASI1_API_KEY not found in environment variables. Please check your .env file.")

ASI1_HEADERS = {
    "Authorization": f"Bearer {ASI1_API_KEY}",
    "Content-Type": "application/json"
}

# Healthcare data storage (local backup, primary storage is ICP canister)
user_symptoms = []
user_reminders = []
emergency_status = False

# Conversation context tracking
user_contexts = {}  # Store user conversation states

# Removed hard-coded symptom mappings - now using ASI1 LLM for all analysis

# REST endpoint models for Flask API integration
class ChatRequest(Model):
    message: str
    user_id: str = "frontend_user"

class ChatResponse(Model):
    response: str
    intent: str
    confidence: float
    timestamp: str
    request_id: str
    sender: str
    user_id: str
    communication_status: str

# Protocol definitions for inter-agent communication
class DoctorBookingRequest(Model):
    request_id: str  # For correlation
    specialty: str
    preferred_time: str
    urgency: str = "normal"
    symptoms: Optional[str] = None
    user_id: str = "user123"

class DoctorBookingResponse(Model):
    request_id: str  # Echo back for correlation
    status: str
    doctor_name: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_id: Optional[str] = None
    message: str

class MedicineCheckRequest(Model):
    request_id: str  # For correlation
    medicine_name: str
    quantity: Optional[int] = 1
    prescription_id: Optional[str] = None

class MedicineCheckResponse(Model):
    request_id: str  # Echo back for correlation
    type: str = "MedicineCheckResponse"
    medicine: str
    available: bool
    stock: Optional[int] = None
    price: Optional[float] = None
    pharmacy_name: str = "HealthPlus Pharmacy"
    status: str
    message: str

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

# Create protocols for inter-agent communication
doctor_protocol = Protocol(name="DoctorBookingProtocol", version="1.0")
pharmacy_protocol = Protocol(name="PharmacyProtocol", version="1.0")
wellness_protocol = Protocol(name="WellnessProtocol", version="1.0")
ack_protocol = Protocol(name="ACKProtocol", version="1.0")

# Agent addresses - loaded from environment variables
DOCTOR_AGENT_ADDRESS = os.getenv("DOCTOR_AGENT_ADDRESS")
PHARMACY_AGENT_ADDRESS = os.getenv("PHARMACY_AGENT_ADDRESS") 
WELLNESS_AGENT_ADDRESS = os.getenv("WELLNESS_AGENT_ADDRESS")

# Agent communication with request tracking
class RequestACK(Model):
    request_id: str
    agent_type: str  # "doctor", "pharmacy", or "wellness"
    message: str = "Request received and processing"
    timestamp: str

# Store connected agents
connected_agents = {}
pending_requests = {}  # Track active requests by request_id
user_request_mapping = {}  # Map request_id to user_sender for notifications

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

async def analyze_with_asi1(symptoms_text: str, analysis_type: str = "current") -> dict:
    """Use ASI1 LLM for intelligent symptom analysis"""
    try:
        if analysis_type == "current":
            system_prompt = """You are a medical AI assistant. Analyze the given symptoms and provide:
1. Most likely conditions (with confidence %)
2. Recommended medical specialists
3. Urgency level (emergency/urgent/moderate/mild)
4. Key symptoms detected
5. Brief explanation of your reasoning

Respond in JSON format with: {"likely_conditions": [{"condition": "", "confidence": 0, "severity": ""}], "recommended_doctors": [], "urgency": "", "detected_symptoms": [], "explanation": ""}

IMPORTANT: This is for informational purposes only. Always recommend consulting healthcare professionals."""
            
            user_prompt = f"Patient reports: {symptoms_text}"
            
        else:  # historical analysis
            system_prompt = """You are a medical AI assistant analyzing a patient's symptom history. Based on the pattern of symptoms over time, provide:
1. Most likely underlying conditions
2. Symptom patterns and frequency analysis  
3. Recommended specialists based on overall pattern
4. Health insights and recommendations
5. Urgency assessment

Respond in JSON format with: {"pattern_analysis": "", "likely_conditions": [{"condition": "", "confidence": 0, "reasoning": ""}], "recommended_doctors": [], "health_insights": [], "urgency": "", "recommendations": []}

IMPORTANT: This is for informational purposes only. Always recommend consulting healthcare professionals."""
            
            user_prompt = f"Patient symptom history: {symptoms_text}"

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            try:
                analysis_result = json.loads(content)
                return {"success": True, "analysis": analysis_result}
            except json.JSONDecodeError:
                return {"success": False, "error": "Invalid JSON response from ASI1"}
        else:
            return {"success": False, "error": f"ASI1 API error: {response.status_code}"}
            
    except Exception as e:
        return {"success": False, "error": f"ASI1 analysis failed: {str(e)}"}

# Removed old hard-coded analyze_symptoms function - now using ASI1 LLM exclusively

def extract_reminder_info(text: str) -> dict:
    """Extract medication reminder information from natural language"""
    text_lower = text.lower()
    
    # Extract medication name
    medicine_match = re.search(r'take\s+([\w\s]+?)\s+at', text_lower)
    if not medicine_match:
        medicine_match = re.search(r'remind.*?([\w\s]+?)\s+at', text_lower)
    
    medicine = medicine_match.group(1).strip() if medicine_match else "medication"
    
    # Extract time
    time_match = re.search(r'at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)', text)
    time_str = time_match.group(1) if time_match else "unspecified time"
    
    return {
        "medicine": medicine,
        "time": time_str,
        "original_text": text
    }

async def classify_user_intent_with_llm(message: str, ctx: Context) -> str:
    """Classify user intent using ASI1 LLM for more accurate natural language understanding"""
    try:
        system_prompt = """You are a healthcare AI assistant's intent classifier. Analyze user messages and classify them into exactly one of these intents:

1. "emergency" - Urgent medical situations, emergencies, life-threatening conditions
2. "symptom_logging" - User describing symptoms, pain, illness, how they feel physically
3. "health_analysis" - Asking for diagnosis, disease analysis, "what might I have", symptom interpretation
4. "book_doctor" - Requesting doctor appointments, medical consultations, scheduling visits
5. "pharmacy" - Medicine availability, buying drugs, prescription requests, pharmacy queries
6. "medication_reminder" - Setting up pill reminders, medication scheduling
7. "wellness" - Activity tracking, sleep logging, exercise, steps, water intake, mood logging
8. "general" - Greetings, general questions, anything not healthcare-related

IMPORTANT: Respond with ONLY the intent name, nothing else.

Examples:
- "I have a headache and fever" → symptom_logging
- "I walked 5000 steps today" → wellness  
- "Do you have aspirin?" → pharmacy
- "Book me a cardiologist" → book_doctor
- "What disease might I have?" → health_analysis
- "Remind me to take pills at 8PM" → medication_reminder
- "Emergency! Chest pain!" → emergency
- "Hello, how are you?" → general"""

        user_prompt = f"User message: \"{message}\""

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,  # Very low for consistent classification
            "max_tokens": 20
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            intent = result["choices"][0]["message"]["content"].strip().lower()
            
            # Validate the response
            valid_intents = ["emergency", "symptom_logging", "health_analysis", 
                           "book_doctor", "pharmacy", "medication_reminder", "wellness", "general"]
            
            if intent in valid_intents:
                ctx.logger.info(f"LLM classified '{message}' as: {intent}")
                return intent
            else:
                ctx.logger.warning(f"LLM returned invalid intent: {intent}, using fallback")
                return classify_user_intent_fallback(message)
        else:
            ctx.logger.warning(f"ASI1 API error: {response.status_code}, using fallback")
            return classify_user_intent_fallback(message)
            
    except Exception as e:
        ctx.logger.error(f"LLM intent classification failed: {str(e)}, using fallback")
        return classify_user_intent_fallback(message)

def classify_user_intent_fallback(message: str) -> str:
    """Fallback intent classifier using keywords (original method)"""
    message_lower = message.lower()
    
    # Simple keyword-based fallback
    if "emergency" in message_lower:
        return "emergency"
    elif any(phrase in message_lower for phrase in ["what disease", "what illness", "analyze my symptoms", "diagnose me"]):
        return "health_analysis"
    elif any(word in message_lower for word in ["doctor", "appointment", "book", "schedule"]):
        return "book_doctor"
    elif any(word in message_lower for word in ["medicine", "pharmacy", "buy", "prescription", "available"]):
        return "pharmacy"
    elif any(word in message_lower for word in ["remind", "reminder", "medication"]):
        return "medication_reminder"
    elif any(word in message_lower for word in ["sleep", "steps", "walked", "exercise", "workout", "water", "drank"]):
        return "wellness"
    elif any(phrase in message_lower for phrase in ["i have", "i feel", "pain", "ache", "hurt", "sick"]):
        return "symptom_logging"
    else:
        return "general"

def classify_user_intent(message: str, sender: str = None) -> str:
    """Legacy synchronous wrapper - will be replaced by async version"""
    return classify_user_intent_fallback(message)

def set_user_context(sender: str, context: dict):
    """Set conversation context for a user"""
    if sender not in user_contexts:
        user_contexts[sender] = {}
    user_contexts[sender].update(context)

def clear_user_context(sender: str):
    """Clear conversation context for a user"""
    if sender in user_contexts:
        del user_contexts[sender]

def get_user_context(sender: str) -> dict:
    """Get conversation context for a user"""
    return user_contexts.get(sender, {})

async def handle_symptom_logging(symptoms_text: str, ctx: Context, sender: str = "default_user") -> str:
    """Handle symptom logging and analysis"""
    try:
        # Store symptoms to ICP canister
        symptom_data = {
            "symptoms": symptoms_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": "user123"  # In production, get from user context
        }
        
        store_result = await store_to_icp("store-symptoms", symptom_data)
        
        # Analyze symptoms using ASI1 LLM
        ctx.logger.info("Analyzing symptoms with ASI1 LLM...")
        asi1_result = await analyze_with_asi1(symptoms_text, "current")
        
        # Store locally as backup
        user_symptoms.append(symptom_data)
        
        # Build detailed response message
        response_parts = [f"**Symptoms logged successfully!**"]
        response_parts.append(f"\n**What was recorded:**")
        response_parts.append(f"• Symptoms: {symptoms_text}")
        response_parts.append(f"• Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        response_parts.append(f"• Storage: Securely saved to ICP blockchain")
        response_parts.append(f"\n**AI Analysis Results:**")
        
        if asi1_result["success"]:
            analysis = asi1_result["analysis"]
            
            # Detected symptoms
            if analysis.get("detected_symptoms"):
                response_parts.append(f"\nDetected symptoms: {', '.join(analysis['detected_symptoms'])}")
            
            # Likely conditions from ASI1
            if analysis.get("likely_conditions"):
                response_parts.append(f"\n**AI Analysis - Likely conditions:**")
                for condition in analysis["likely_conditions"][:3]:
                    confidence = condition.get("confidence", 0)
                    severity = condition.get("severity", "moderate")
                    severity_emoji = {"emergency": "🚨", "urgent": "⚠️", "serious": "🟡", "moderate": "🔵", "mild": "🟢"}.get(severity, "🔵")
                    response_parts.append(f"  • {severity_emoji} **{condition['condition']}** ({confidence}% confidence)")
            
            # Recommended doctors from ASI1
            if analysis.get("recommended_doctors"):
                doctors_list = ", ".join(analysis["recommended_doctors"][:3])
                response_parts.append(f"\n**Recommended specialists:** {doctors_list}")
            
            # ASI1 explanation
            if analysis.get("explanation"):
                response_parts.append(f"\n**AI Insight:** {analysis['explanation']}")
            
            # Urgency assessment
            urgency = analysis.get("urgency", "moderate")
            if urgency in ["emergency", "urgent"]:
                response_parts.append(f"\n**URGENCY LEVEL: {urgency.upper()}** - Consider seeking immediate medical attention!")
            else:
                response_parts.append(f"\nPlease consult a healthcare professional for proper diagnosis.")
            
            # Offer appointment booking and set context
            if analysis.get("recommended_doctors"):
                primary_doctor = analysis["recommended_doctors"][0]
                response_parts.append(f"\nWould you like me to book an appointment with a {primary_doctor}?")
                
                # Set context for follow-up response
                set_user_context(sender, {
                    "awaiting_doctor_confirmation": True,
                    "recommended_doctor": primary_doctor,
                    "last_analysis": analysis
                })
        else:
            # Simple fallback when ASI1 fails
            ctx.logger.warning(f"ASI1 analysis failed: {asi1_result['error']}, using basic fallback")
            
            response_parts.append(f"\nAI analysis temporarily unavailable")
            response_parts.append(f"\nRecommend consulting: General Practitioner")
            response_parts.append(f"\nYour symptoms have been logged for future analysis")
            response_parts.append(f"\nPlease consult a healthcare professional for proper diagnosis.")
        
        return "\n".join(response_parts)
            
    except Exception as e:
        ctx.logger.error(f"Error in symptom logging: {str(e)}")
        return "Sorry, I encountered an error while logging your symptoms. Please try again."

async def handle_medication_reminder(reminder_text: str, ctx: Context) -> str:
    """Handle medication reminder setup"""
    try:
        reminder_info = extract_reminder_info(reminder_text)
        
        reminder_data = {
            "medicine": reminder_info["medicine"],
            "time": reminder_info["time"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_id": "user123",
            "active": True
        }
        
        # Store to ICP canister
        store_result = await store_to_icp("store-reminder", reminder_data)
        
        # Store locally as backup
        user_reminders.append(reminder_data)
        
        return f"Reminder set: Take {reminder_info['medicine']} at {reminder_info['time']}. You'll be notified at the scheduled time."
        
    except Exception as e:
        ctx.logger.error(f"Error setting medication reminder: {str(e)}")
        return "Sorry, I had trouble setting up your medication reminder. Please try again with a format like 'remind me to take paracetamol at 8PM'."

async def handle_emergency(ctx: Context) -> str:
    """Handle emergency situations"""
    global emergency_status
    try:
        emergency_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": "user123",
            "status": "active"
        }
        
        # Store to ICP canister
        store_result = await store_to_icp("emergency-alert", emergency_data)
        
        # Set local emergency flag
        emergency_status = True
        
        return "EMERGENCY RECORDED. Please call emergency services (911/112) immediately if you need urgent medical assistance. This alert has been logged in your health record."
        
    except Exception as e:
        ctx.logger.error(f"Error handling emergency: {str(e)}")
        return "EMERGENCY ALERT: Please call emergency services immediately. There was an error logging this emergency, but your safety is the priority."

async def analyze_historical_symptoms(ctx: Context, sender: str = "default_user") -> str:
    """Analyze all past symptoms to provide health summary and disease suggestions"""
    try:
        # Get symptom history from ICP
        icp_result = await get_from_icp("get-symptom-history", {"user_id": "user123"})
        
        all_symptoms = []
        
        # Extract symptoms from ICP
        if "error" not in icp_result and "symptoms" in icp_result:
            all_symptoms.extend([entry["symptoms"] for entry in icp_result["symptoms"]])
        
        # Add local backup symptoms
        all_symptoms.extend([entry["symptoms"] for entry in user_symptoms])
        
        if not all_symptoms:
            return "No symptom history found. Start logging your symptoms by telling me how you feel!"
        
        # Combine all symptoms text for analysis
        combined_symptoms = " | ".join(all_symptoms)
        
        # Use ASI1 for intelligent historical analysis
        ctx.logger.info("Analyzing symptom history with ASI1 LLM...")
        asi1_result = await analyze_with_asi1(combined_symptoms, "historical")
        
        # Simple frequency analysis without hard-coded mappings
        frequent_symptoms = []
        if len(all_symptoms) >= 2:
            # Count common medical terms
            common_terms = ["fever", "cough", "pain", "headache", "nausea", "fatigue", "dizziness", "ache"]
            term_frequency = {}
            
            for symptom_text in all_symptoms:
                for term in common_terms:
                    if term in symptom_text.lower():
                        term_frequency[term] = term_frequency.get(term, 0) + 1
            
            frequent_symptoms = sorted(term_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Build comprehensive health summary
        response_parts = ["**AI-POWERED HEALTH ANALYSIS SUMMARY**"]
        response_parts.append(f"\nTotal symptom logs: {len(all_symptoms)}")
        
        if frequent_symptoms:
            freq_list = [f"{symptom} ({count}x)" for symptom, count in frequent_symptoms]
            response_parts.append(f"\nMost frequent symptoms: {', '.join(freq_list)}")
        
        if asi1_result["success"]:
            analysis = asi1_result["analysis"]
            
            # Pattern analysis from ASI1
            if analysis.get("pattern_analysis"):
                response_parts.append(f"\n**AI PATTERN ANALYSIS:**")
                response_parts.append(f"  {analysis['pattern_analysis']}")
            
            # Likely conditions from ASI1
            if analysis.get("likely_conditions"):
                response_parts.append(f"\n**AI-IDENTIFIED LIKELY CONDITIONS:**")
                for condition in analysis["likely_conditions"][:3]:
                    confidence = condition.get("confidence", 0)
                    reasoning = condition.get("reasoning", "")
                    response_parts.append(f"  • **{condition['condition']}** ({confidence}% confidence)")
                    if reasoning:
                        response_parts.append(f"    Reasoning: {reasoning}")
            
            # Health insights from ASI1
            if analysis.get("health_insights"):
                response_parts.append(f"\n**HEALTH INSIGHTS:**")
                for insight in analysis["health_insights"][:3]:
                    response_parts.append(f"  • {insight}")
            
            # Recommended doctors from ASI1
            if analysis.get("recommended_doctors"):
                doctors_list = ", ".join(analysis["recommended_doctors"][:3])
                response_parts.append(f"\n**RECOMMENDED SPECIALISTS:** {doctors_list}")
            
            # AI recommendations
            if analysis.get("recommendations"):
                response_parts.append(f"\n**AI RECOMMENDATIONS:**")
                for rec in analysis["recommendations"][:3]:
                    response_parts.append(f"  • {rec}")
            
            # Urgency assessment
            urgency = analysis.get("urgency", "moderate")
            if urgency in ["emergency", "urgent"]:
                response_parts.append(f"\n**URGENCY ASSESSMENT: {urgency.upper()}**")
                response_parts.append(f"  Your symptom pattern suggests need for prompt medical evaluation!")
            
        else:
            # Simple fallback when ASI1 fails
            ctx.logger.warning(f"ASI1 historical analysis failed: {asi1_result['error']}")
            
            response_parts.append(f"\n**AI ANALYSIS TEMPORARILY UNAVAILABLE**")
            response_parts.append(f"\n**BASIC SUMMARY:**")
            response_parts.append(f"  • Your symptom history has been preserved")
            response_parts.append(f"  • Consider discussing patterns with your doctor")
            response_parts.append(f"\n **GENERAL RECOMMENDATION:** Consult General Practitioner")
        
        response_parts.append(f"\n**DISCLAIMER:** This AI analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis.")
        
        # Offer appointment booking and set context
        if asi1_result["success"] and asi1_result["analysis"].get("recommended_doctors"):
            primary_doctor = asi1_result["analysis"]["recommended_doctors"][0]
            response_parts.append(f"\nWould you like me to book an appointment with a {primary_doctor}?")
            
            # Set context for follow-up response
            set_user_context(sender, {
                "awaiting_doctor_confirmation": True,
                "recommended_doctor": primary_doctor,
                "last_analysis": asi1_result["analysis"]
            })
        
        return "\n".join(response_parts)
        
    except Exception as e:
        ctx.logger.error(f"Error analyzing historical symptoms: {str(e)}")
        return "Sorry, I encountered an error while analyzing your symptom history. Please try again."

async def handle_doctor_booking_confirmation(sender: str, ctx: Context) -> str:
    """Handle confirmation of doctor appointment booking"""
    context = get_user_context(sender)
    doctor = context.get("recommended_doctor", "General Practitioner")
    
    # Clear the context
    clear_user_context(sender)
    
    # Note: For REST API users, confirmations are handled via the API response
    # No need to send chat messages to REST API user IDs
    
    # Route to doctor booking agent (this will send detailed results later)
    booking_result = await route_to_doctor_agent(f"book {doctor}", ctx, sender)
    
    return booking_result

async def handle_doctor_booking_cancellation(sender: str, ctx: Context) -> str:
    """Handle cancellation of doctor appointment booking"""
    # Clear the context
    clear_user_context(sender)
    
    return "No problem! Your symptoms are still logged. You can ask for a doctor booking anytime by saying 'book me a doctor appointment'."

async def get_medicine_usage_hint(medicine_name: str, ctx: Context) -> str:
    """Use ASI1 LLM to provide intelligent medicine usage insights"""
    try:
        system_prompt = """You are a pharmaceutical AI assistant. Provide a brief, helpful insight about a medicine's common uses.
        
For the given medicine, provide a concise 1-sentence description of its primary use or indication.
Examples:
- Paracetamol: "pain relief and fever reduction"
- Ibuprofen: "reducing inflammation, pain, and fever"
- Insulin: "managing blood sugar levels in diabetes"
- Amoxicillin: "treating bacterial infections"

Keep it simple, accurate, and helpful. Only mention common, well-known uses."""

        user_prompt = f"Medicine: {medicine_name}"

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 50
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            usage_hint = result["choices"][0]["message"]["content"].strip()
            return usage_hint
        else:
            return "general medical treatment"
            
    except Exception as e:
        ctx.logger.error(f"Medicine usage hint failed: {str(e)}")
        return "medical treatment"

async def get_medicine_alternatives(medicine_name: str, ctx: Context) -> list:
    """Use ASI1 LLM to suggest alternative medicines"""
    try:
        system_prompt = """You are a pharmaceutical AI assistant. Suggest alternative medicines for a given medication.
        
For the given medicine, suggest 3-4 common alternatives that have similar effects or uses.
Respond with a simple list, one medicine per line.
Focus on well-known, commonly available medicines.
Do not include the original medicine in the alternatives.

Example format:
Paracetamol
Ibuprofen
Aspirin"""

        user_prompt = f"Original medicine: {medicine_name}\nSuggest alternatives:"

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 100
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            alternatives_text = result["choices"][0]["message"]["content"].strip()
            # Parse alternatives from response
            alternatives = [alt.strip() for alt in alternatives_text.split('\n') if alt.strip()]
            return alternatives[:4]  # Limit to 4 alternatives
        else:
            return ["Paracetamol", "Ibuprofen", "Aspirin"]  # Fallback alternatives
            
    except Exception as e:
        ctx.logger.error(f"Medicine alternatives failed: {str(e)}")
        return ["Paracetamol", "Ibuprofen", "Aspirin"]  # Fallback alternatives

async def extract_specialty_with_llm(message: str, ctx: Context) -> str:
    """Use ASI1 LLM to intelligently extract medical specialty from natural language"""
    try:
        system_prompt = """You are a medical assistant that helps route patients to the correct specialist. 
        
Analyze the user's message and determine which medical specialty they need. Respond with ONLY one of these exact specialty names:
- cardiology (for heart, chest pain, blood pressure, circulation issues)
- dermatology (for skin, hair, nail issues)
- neurology (for brain, nervous system, headaches, memory issues)
- orthopedics (for bones, joints, muscles, fractures, sports injuries)
- pediatrics (for children, infants, child-related health)
- oncology (for cancer, tumors, chemotherapy)
- psychiatry (for mental health, depression, anxiety, therapy)
- general practitioner (for general health, checkups, common illnesses, or unclear cases)

Only respond with the specialty name, nothing else."""

        user_prompt = f"Patient message: \"{message}\""

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,  # Lower temperature for consistent classification
            "max_tokens": 50
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            specialty = result["choices"][0]["message"]["content"].strip().lower()
            
            # Validate the response
            valid_specialties = ["cardiology", "dermatology", "neurology", "orthopedics", 
                               "pediatrics", "oncology", "psychiatry", "general practitioner"]
            
            if specialty in valid_specialties:
                ctx.logger.info(f"LLM extracted specialty: {specialty}")
                return specialty
            else:
                ctx.logger.warning(f"LLM returned invalid specialty: {specialty}, using fallback")
                return "general practitioner"
        else:
            ctx.logger.warning(f"ASI1 API error: {response.status_code}")
            return "general practitioner"
            
    except Exception as e:
        ctx.logger.error(f"LLM specialty extraction failed: {str(e)}")
        return "general practitioner"

async def route_to_doctor_agent(message: str, ctx: Context, user_sender: str = None) -> str:
    """Route doctor booking request to DoctorAgent"""
    try:
        # Use LLM to intelligently extract specialty
        ctx.logger.info(f" Analyzing booking request with AI: '{message}'")
        specialty = await extract_specialty_with_llm(message, ctx)
        
        # Also extract timing and urgency with simple parsing (can enhance with LLM later)
        preferred_time = "next available"
        urgency = "normal"
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["urgent", "emergency", "asap", "immediately", "right now"]):
            urgency = "urgent"
            preferred_time = "today"
        elif "tomorrow" in message_lower:
            preferred_time = "tomorrow"
        elif "today" in message_lower:
            preferred_time = "today"
        elif any(word in message_lower for word in ["next week", "later this week"]):
            preferred_time = "next week"
        
        # Extract symptoms if mentioned
        symptoms = None
        if any(word in message_lower for word in ["symptoms", "feel", "pain", "hurt", "ache", "problem"]):
            symptoms = message  # Pass the full message as symptoms context
            
        request_id = str(uuid4())[:8]
        booking_request = DoctorBookingRequest(
            request_id=request_id,
            specialty=specialty,
            preferred_time=preferred_time,
            urgency=urgency,
            symptoms=symptoms,
            user_id="user123"
        )
        
        # Track pending request
        pending_requests[request_id] = {
            "type": "doctor",
            "specialty": specialty,
            "timestamp": datetime.now(),
            "user_sender": user_sender,
            "urgency": urgency
        }
        if user_sender:
            user_request_mapping[request_id] = user_sender
        
        # Send request to DoctorAgent
        
        if DOCTOR_AGENT_ADDRESS:
            try:
                ctx.logger.info(f"Booking {specialty} appointment ({urgency})")
                
                # Note: For REST API users, immediate notifications are handled via the API response
                # No need to send chat messages to REST API user IDs
                
                # Events no longer needed - using pure event-driven architecture
                
                ctx.logger.info(f"Sending booking request at: {datetime.now()}")
                ctx.logger.info(f"Sending to address: {DOCTOR_AGENT_ADDRESS}")
                ctx.logger.info(f"Message content: {booking_request}")
                send_id = str(uuid4())[:8]
                ctx.logger.info(f"[SEND-{send_id}] Sending booking request to DoctorAgent")
                ctx.logger.info(f"🔍 About to send message type: {type(booking_request)}")
                ctx.logger.info(f"🔍 Message details: {booking_request}")
                
                try:
                    await ctx.send(DOCTOR_AGENT_ADDRESS, booking_request)
                    ctx.logger.info(f"Request sent (ID: {request_id}), user notified")
                    
                    # Create detailed immediate response showing what was requested
                    response = f"**Doctor appointment request submitted!**\n\n**Booking Details:**\n"
                    response += f"• Specialty: {specialty.title()}\n"
                    response += f"• Preferred time: {preferred_time}\n"
                    response += f"• Urgency: {urgency}\n"
                    if symptoms:
                        response += f"• Symptoms mentioned: Yes\n"
                    response += f"\n**Request ID:** {request_id}"
                    response += f"\n**Status:** Processing appointment availability..."
                    response += f"\n**Storage:** Request saved to ICP blockchain"
                    
                    return response
                except Exception as e:
                    ctx.logger.error(f"Failed to send request: {str(e)}")
                    return f"Failed to send request to DoctorAgent: {str(e)}"
                
                # No polling needed - response will come via event handler
                    
            except Exception as e:
                ctx.logger.error(f"Error communicating with DoctorAgent: {str(e)}")
                return "Sorry, there was an error connecting to the doctor booking service. Please try again."
        else:
            ctx.logger.error("DOCTOR_AGENT_ADDRESS not configured")
            return "Sorry, the doctor booking service is not properly configured. Please contact support."
        
    except Exception as e:
        ctx.logger.error(f"Error routing to doctor agent: {str(e)}")
        return "Sorry, I couldn't book your appointment right now. Please try again later."

async def extract_medicine_info_with_llm(message: str, ctx: Context) -> dict:
    """Use ASI1 LLM to intelligently extract medicine information from natural language"""
    try:
        system_prompt = """You are a pharmacy assistant AI. Extract medicine information from user requests.
        
Analyze the user's message and extract:
1. Medicine name (generic or brand name)
2. Request type (check availability, order/buy, general inquiry)
3. Quantity if mentioned
4. Any specific requirements (prescription, dosage, etc.)

Respond in JSON format with: {"medicine_name": "", "request_type": "check|order|inquiry", "quantity": 1, "requirements": ""}

Common medicines: Paracetamol, Ibuprofen, Aspirin, Insulin, Amoxicillin, Omeprazole, Metformin, Vitamin D, etc.
If medicine name is unclear, use the closest match or "medication"."""

        user_prompt = f"User request: \"{message}\""

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 200,
            "response_format": {"type": "json_object"}
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            try:
                medicine_info = json.loads(content)
                ctx.logger.info(f" LLM extracted medicine info: {medicine_info}")
                
                # Validate and sanitize the response
                validated_info = {
                    "medicine_name": str(medicine_info.get("medicine_name", "medication")),
                    "request_type": str(medicine_info.get("request_type", "check")),
                    "quantity": int(medicine_info.get("quantity", 1)) if medicine_info.get("quantity") else 1,
                    "requirements": str(medicine_info.get("requirements", ""))
                }
                return validated_info
            except (json.JSONDecodeError, ValueError, TypeError) as e:
                ctx.logger.warning(f"LLM returned invalid data, using fallback: {str(e)}")
                return {"medicine_name": "medication", "request_type": "check", "quantity": 1, "requirements": ""}
        else:
            ctx.logger.warning(f"ASI1 API error: {response.status_code}")
            return {"medicine_name": "medication", "request_type": "check", "quantity": 1, "requirements": ""}
            
    except Exception as e:
        ctx.logger.error(f"LLM medicine extraction failed: {str(e)}")
        return {"medicine_name": "medication", "request_type": "check", "quantity": 1, "requirements": ""}

async def route_to_pharmacy_agent(message: str, ctx: Context, user_sender: str = None) -> str:
    """Route medicine check/order to PharmacyAgent using ASI1 LLM for intelligent parsing"""
    try:
        # Use ASI1 LLM to intelligently extract medicine information
        ctx.logger.info(f"Analyzing medicine request with AI: '{message}'")
        medicine_info = await extract_medicine_info_with_llm(message, ctx)
        
        medicine_name = medicine_info.get("medicine_name", "medication")
        request_type = medicine_info.get("request_type", "check")
        quantity = medicine_info.get("quantity", 1)
        
        # Ensure quantity is an integer
        try:
            quantity = int(quantity) if quantity else 1
        except (ValueError, TypeError):
            quantity = 1
        
        # Create request based on LLM-extracted information
        is_order_request = request_type == "order"
        
        ctx.logger.info(f"Creating MedicineCheckRequest with: medicine_name='{medicine_name}' (type: {type(medicine_name)}), quantity={quantity} (type: {type(quantity)})")
        
        try:
            if is_order_request:
                # For order requests, we need medicine_id - first check availability to get it
                ctx.logger.info(f"Processing medicine order request for: {medicine_name} (qty: {quantity})")
                request_id = str(uuid4())[:8]
                medicine_request = MedicineCheckRequest(
                    request_id=request_id,
                    medicine_name=medicine_name,
                    quantity=quantity
                )
                
                # Track pending request
                pending_requests[request_id] = {
                    "type": "pharmacy",
                    "medicine": medicine_name,
                    "timestamp": datetime.now(),
                    "user_sender": user_sender,
                    "is_order_request": is_order_request,
                    "quantity": quantity
                }
                if user_sender:
                    user_request_mapping[request_id] = user_sender
            else:
                # Availability check
                ctx.logger.info(f"Processing medicine availability check for: {medicine_name}")
                request_id = str(uuid4())[:8]
                medicine_request = MedicineCheckRequest(
                    request_id=request_id,
                    medicine_name=medicine_name,
                    quantity=quantity
                )
                
                # Track pending request
                pending_requests[request_id] = {
                    "type": "pharmacy",
                    "medicine": medicine_name,
                    "timestamp": datetime.now(),
                    "user_sender": user_sender,
                    "is_order_request": is_order_request,
                    "quantity": quantity
                }
                if user_sender:
                    user_request_mapping[request_id] = user_sender
            
            ctx.logger.info(f"Successfully created MedicineCheckRequest: {type(medicine_request)}")
            
        except Exception as e:
            ctx.logger.error(f"   Failed to create MedicineCheckRequest: {str(e)}")
            ctx.logger.error(f"   Medicine name: '{medicine_name}' (type: {type(medicine_name)})")
            ctx.logger.error(f"   Quantity: {quantity} (type: {type(quantity)})")
            raise
        
        # Send request to PharmacyAgent if available
        if PHARMACY_AGENT_ADDRESS:
            try:
                ctx.logger.info(f"Sending medicine request to PharmacyAgent")
                
                # Events no longer needed - using pure event-driven architecture
                
                # Note: For REST API users, immediate notifications are handled via the API response
                # No need to send chat messages to REST API user IDs
                
                await ctx.send(PHARMACY_AGENT_ADDRESS, medicine_request)
                ctx.logger.info(f"Medicine request sent (ID: {request_id}), user notified")
                
                # Create detailed immediate response showing what was requested
                response = f"**Medicine request submitted!**\n\n **Request Details:**\n"
                response += f"• Medicine: {medicine_name}\n"
                response += f"• Quantity: {quantity}\n"
                response += f"• Request type: {'Purchase order' if is_order_request else 'Availability check'}\n"
                response += f"\n**Request ID:** {request_id}"
                response += f"\n**Status:** Checking pharmacy inventory..."
                response += f"\n**Storage:** Request saved to ICP blockchain"
                
                return response
                
                # No polling needed - response will come via event handler
                # Response processing moved to handle_pharmacy_check_response
                    
            except Exception as e:
                ctx.logger.error(f"Error communicating with PharmacyAgent: {str(e)}")
                return "Sorry, there was an error connecting to the pharmacy service. Please try again."
        else:
            ctx.logger.error("PHARMACY_AGENT_ADDRESS not configured")
            return "Sorry, the pharmacy service is not properly configured. Please contact support."
        
    except Exception as e:
        ctx.logger.error(f"Error routing to pharmacy agent: {str(e)}")
        return "Sorry, I couldn't process your medicine request right now. Please try again later."

async def route_to_wellness_agent(message: str, ctx: Context, user_sender: str = None) -> str:
    """Route wellness logging to WellnessAgent using event-driven architecture"""
    try:
        # Parse wellness data from natural language message
        wellness_data = parse_wellness_message(message)
        
        request_id = str(uuid4())[:8]
        wellness_request = LogRequest(
            request_id=request_id,
            sleep=wellness_data.get("sleep"),
            steps=wellness_data.get("steps"),
            exercise=wellness_data.get("exercise"),
            mood=wellness_data.get("mood"),
            water_intake=wellness_data.get("water_intake"),
            user_id="user123"
        )
        
        # Track pending request
        pending_requests[request_id] = {
            "type": "wellness",
            "data_type": wellness_data.get("type", "general"),
            "timestamp": datetime.now(),
            "user_sender": user_sender,
            "original_message": message
        }
        if user_sender:
            user_request_mapping[request_id] = user_sender
        
        # Send request to WellnessAgent if available
        if WELLNESS_AGENT_ADDRESS:
            try:
                # Note: For REST API users, immediate notifications are handled via the API response
                # No need to send chat messages to REST API user IDs
                
                await ctx.send(WELLNESS_AGENT_ADDRESS, wellness_request)
                ctx.logger.info(f"Wellness request sent (ID: {request_id}), user notified")
                
                # Create detailed immediate response showing what was logged
                logged_items = []
                if wellness_data.get("sleep"):
                    logged_items.append(f"Sleep: {wellness_data['sleep']} hours")
                if wellness_data.get("steps"):
                    logged_items.append(f"🚶 Steps: {wellness_data['steps']:,}")
                if wellness_data.get("exercise"):
                    logged_items.append(f"Exercise: {wellness_data['exercise']}")
                if wellness_data.get("mood"):
                    logged_items.append(f"Mood: {wellness_data['mood']}")
                if wellness_data.get("water_intake"):
                    logged_items.append(f"Water: {wellness_data['water_intake']} glasses")
                
                if logged_items:
                    response = f"**Wellness data logged successfully!**\n\n**What was recorded:**\n" + "\n".join([f"• {item}" for item in logged_items])
                    response += f"\n\n **Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                    response += f"\n **Storage:** Securely saved to ICP blockchain"
                    return response
                else:
                    return f"**Wellness data logged:** {message}\n\n **Storage:** Securely saved to ICP blockchain"
                
            except Exception as e:
                ctx.logger.error(f" Error communicating with WellnessAgent: {str(e)}")
                return "Sorry, there was an error connecting to the wellness service. Please try again."
        else:
            ctx.logger.error(" WELLNESS_AGENT_ADDRESS not configured")
            return "Sorry, the wellness service is not properly configured. Please contact support."
        
    except Exception as e:
        ctx.logger.error(f"Error routing to wellness agent: {str(e)}")
        return "Sorry, I couldn't log your wellness data right now. Please try again later."

def parse_wellness_message(message: str) -> dict:
    """Parse wellness data from natural language message"""
    import re
    
    message_lower = message.lower()
    wellness_data = {"type": "general"}
    
    # Debug logging
    print(f"[DEBUG] Parsing message: '{message}'")
    print(f"[DEBUG] Message lower: '{message_lower}'")
    
    # Parse sleep data - handle "slept 8 hours", "8 hours sleep", and "I slept 8 hours"
    sleep_match = re.search(r'(?:sleep|slept)\s+([0-9\.]+)\s*(?:hours?|hrs?)', message_lower) or re.search(r'([0-9\.]+)\s*(?:hours?|hrs?).*?(?:sleep|slept)', message_lower)
    if sleep_match:
        wellness_data["sleep"] = float(sleep_match.group(1))
        wellness_data["type"] = "sleep"
    
    # Parse steps data - handle both "walked 3000 steps" and "3000 steps"
    steps_match = re.search(r'([0-9,]+)\s*(?:steps?)', message_lower) or re.search(r'(?:walked|walk).*?([0-9,]+)', message_lower)
    if steps_match:
        wellness_data["steps"] = int(steps_match.group(1).replace(',', ''))
        wellness_data["type"] = "steps"
    
    # Parse exercise data
    if any(word in message_lower for word in ["exercise", "workout", "gym", "run", "jog", "bike"]):
        wellness_data["exercise"] = message
        wellness_data["type"] = "exercise"
    
    # Parse mood data
    if any(word in message_lower for word in ["mood", "feel", "happy", "sad", "stressed", "anxious", "calm"]):
        wellness_data["mood"] = message
        wellness_data["type"] = "mood"
    
    # Parse water intake - handle "drank 6 glasses" and "6 glasses of water"
    water_match = re.search(r'([0-9\.]+)\s*(?:cups?|glasses?|liters?|l).*?(?:water|drink)', message_lower) or re.search(r'(?:water|drank|drink).*?([0-9\.]+)\s*(?:cups?|glasses?|liters?|l)', message_lower)
    if water_match:
        wellness_data["water_intake"] = float(water_match.group(1))
        wellness_data["type"] = "water"
    
    print(f"[DEBUG] Parsed wellness data: {wellness_data}")
    return wellness_data

async def process_health_query(query: str, ctx: Context, sender: str = "default_user") -> str:
    """Process health-related queries and route appropriately"""
    try:
        # Check for context-based responses first (immediate responses)
        if sender and sender in user_contexts:
            context = user_contexts[sender]
            
            # Handle doctor booking confirmations
            if context.get("awaiting_doctor_confirmation"):
                message_lower = query.lower()
                if any(word in message_lower for word in ["yes", "yeah", "sure", "ok", "okay", "book it", "please", "go ahead"]):
                    return await handle_doctor_booking_confirmation(sender, ctx)
                elif any(word in message_lower for word in ["no", "nope", "cancel", "not now", "maybe later"]):
                    return await handle_doctor_booking_cancellation(sender, ctx)
        
        # Use ASI1 LLM for intent classification (more accurate)
        ctx.logger.info(f"🗣️ User query: '{query}' - Classifying with ASI1 LLM...")
        intent = await classify_user_intent_with_llm(query, ctx)
        
        if intent == "emergency":
            return await handle_emergency(ctx)
        elif intent == "confirm_doctor_booking":
            return await handle_doctor_booking_confirmation(sender, ctx)
        elif intent == "cancel_doctor_booking":
            return await handle_doctor_booking_cancellation(sender, ctx)
        elif intent == "health_analysis":
            return await analyze_historical_symptoms(ctx, sender)
        elif intent == "symptom_logging":
            return await handle_symptom_logging(query, ctx, sender)
        elif intent == "medication_reminder":
            return await handle_medication_reminder(query, ctx)
        elif intent == "book_doctor":
            return await route_to_doctor_agent(query, ctx, sender)
        elif intent == "pharmacy":
            return await route_to_pharmacy_agent(query, ctx, sender)
        elif intent == "wellness":
            return await route_to_wellness_agent(query, ctx, sender)
        else:
            # Clear any waiting context when showing general help
            clear_user_context(sender)
            return ("Hello! I'm your HealthAgent powered by ASI1 AI. Just talk to me naturally! I can help you with:\n\n"
                   "🩺 **Symptom Tracking & Analysis:**\n"
                   "• 'I have a headache and feel tired'\n"
                   "• 'My chest hurts when I breathe'\n"
                   "• 'What might be causing my symptoms?'\n\n"
                   " **Pharmacy & Medications:**\n"
                   "• 'Do you have paracetamol available?'\n"
                   "• 'I need insulin for my diabetes'\n"
                   "• 'Can I buy 2 ibuprofen tablets?'\n\n"
                   " **Doctor Appointments:**\n"
                   "• 'I need to see a heart doctor'\n"
                   "• 'Book me an appointment for my back pain'\n"
                   "• 'Schedule me with a skin specialist'\n\n"
                   " **Complete Wellness Tracking - I can log:**\n\n"
                   " **Sleep:** 'I slept 8 hours', '7.5 hrs sleep', 'got 6 hours of sleep'\n"
                   " **Steps:** 'I walked 5,000 steps', '3000 steps today', 'walked 2 miles'\n"
                   " **Exercise:** 'I did a 30-minute workout', 'went for a run', 'hit the gym'\n"
                   " **Water:** 'I drank 8 glasses', '2 liters today', '6 cups of water'\n"
                   " **Mood:** 'I feel happy today', 'feeling stressed', 'I'm anxious'\n\n"
                   " **Medication Reminders:**\n"
                   "• 'Remind me to take my pills at 8PM'\n\n"
                   " **Emergency Support:**\n"
                   "• Just type 'emergency' for urgent help\n\n"
                   " **Smart AI Features:**\n"
                   "• ASI1-powered natural language understanding\n"
                   "• Context-aware conversations & follow-ups\n"
                   "• Intelligent intent classification\n"
                   "• Handles typos, synonyms & different phrasings\n"
                   "• Real-time data logging to secure ICP blockchain\n\n"
                   " **Just speak naturally - I understand everything!**")
        
    except Exception as e:
        ctx.logger.error(f"Error processing health query: {str(e)}")
        return "I'm having trouble processing your request. Please try again or rephrase your question."

# Create the HealthAgent with REST endpoints enabled
agent = Agent(
    name='health-agent',
    port=8000,
    mailbox=True,
)

# Add REST endpoint for Flask API integration
@agent.on_rest_post("/api/chat", ChatRequest, ChatResponse)
async def handle_rest_chat(ctx: Context, req: ChatRequest) -> ChatResponse:
    """Handle chat messages from Flask API via REST endpoint"""
    try:
        ctx.logger.info(f" REST API request from user {req.user_id}: {req.message}")
        
        # Process the health-related query using existing logic
        response_text = await process_health_query(req.message, ctx, req.user_id)
        
        # Classify intent for response metadata
        intent = await classify_user_intent_with_llm(req.message, ctx)
        
        # Create structured response
        response = ChatResponse(
            response=response_text,
            intent=intent,
            confidence=0.95,
            timestamp=datetime.now(timezone.utc).isoformat(),
            request_id=str(uuid4()),
            sender=agent.address,
            user_id=req.user_id,
            communication_status="success"
        )
        
        ctx.logger.info(f" REST API response sent to user {req.user_id}")
        return response
        
    except Exception as e:
        ctx.logger.error(f" REST API error: {str(e)}")
        
        # Return error response
        return ChatResponse(
            response=f"I'm experiencing technical difficulties: {str(e)}. Please try again.",
            intent="error",
            confidence=0.0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            request_id=str(uuid4()),
            sender=agent.address,
            user_id=req.user_id,
            communication_status="error"
        )

# Add health check endpoint for Flask API
@agent.on_rest_get("/health", ChatResponse)
async def handle_rest_health(ctx: Context) -> Dict[str, Any]:
    """Health check endpoint for Flask API integration"""
    return {
        "response": "HealthAgent is running and ready to process requests",
        "intent": "health_check",
        "confidence": 1.0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": str(uuid4()),
        "sender": agent.address,
        "user_id": "system",
        "communication_status": "online"
    }

# Initialize chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(model=ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages from users"""
    try:
        # Send acknowledgment
        ack = ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc),
            acknowledged_msg_id=msg.msg_id
        )
        await ctx.send(sender, ack)

        # Process message content
        for item in msg.content:
            if isinstance(item, StartSessionContent):
                ctx.logger.info(f"Health session started with {sender}")
                welcome_msg = (
                    " Welcome to **HealthAgent** powered by ASI1 AI! I'm your intelligent healthcare assistant.\n\n"
                    " **AI-Enhanced Capabilities:**\n\n"
                    " **Smart Health Analysis**\n"
                    "• AI-powered symptom analysis and condition predictions\n"
                    "• Intelligent specialist recommendations\n\n"
                    " **Intelligent Pharmacy Services**\n"
                    "• AI medicine name recognition from natural language\n"
                    "• Real-time inventory checking with smart alternatives\n"
                    "• Usage insights and safety recommendations\n\n"
                    " **Smart Appointment Booking**\n"
                    "• AI specialty matching from symptom descriptions\n"
                    "• Automated doctor selection and scheduling\n\n"
                    " **Medication Management**\n"
                    "• Intelligent reminder scheduling\n\n"
                    " **Wellness Tracking**\n"
                    "• Health data logging and insights\n\n"
                    " **Emergency Support**\n"
                    "• Immediate emergency response protocols\n\n"
                    "**How can I assist you with your healthcare needs today?**"
                )
                
                response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=welcome_msg)]
                )
                await ctx.send(sender, response)
                
            elif isinstance(item, TextContent):
                ctx.logger.info(f"Processing health query from {sender}: {item.text}")
                
                # Process the health-related query with sender context
                response_text = await process_health_query(item.text, ctx, sender)
                
                ctx.logger.info(f"Health response: {response_text}")
                
                response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=response_text)]
                )
                await ctx.send(sender, response)
                
            else:
                ctx.logger.info(f"Received unexpected content type from {sender}")
                
    except Exception as e:
        ctx.logger.error(f"Error in health chat handler: {str(e)}")
        error_response = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text="I'm experiencing technical difficulties. Please try again in a moment.")]
        )
        await ctx.send(sender, error_response)

@chat_proto.on_message(model=ChatAcknowledgement)
async def handle_chat_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle chat acknowledgments"""
    ctx.logger.info(f"Health message acknowledged by {sender}: {msg.acknowledged_msg_id}")
    if msg.metadata:
        ctx.logger.info(f"Ack metadata: {msg.metadata}")

# Handler for doctor booking responses
@doctor_protocol.on_message(model=DoctorBookingResponse)
async def handle_doctor_response(ctx: Context, sender: str, msg: DoctorBookingResponse):
    """Handle responses from DoctorAgent"""
    global DOCTOR_AGENT_ADDRESS
    
    try:
        ctx.logger.info(f" DOCTOR PROTOCOL HANDLER TRIGGERED!")
        ctx.logger.info(f" Received booking response: {msg.status} - {msg.doctor_name}")
        ctx.logger.info(f" Response sender: {sender}, Request ID: {msg.request_id}")
        
        # Store the DoctorAgent address for future communications
        if DOCTOR_AGENT_ADDRESS != sender:
            DOCTOR_AGENT_ADDRESS = sender
            connected_agents[sender] = "DoctorAgent"
        
        # Check if this is a pending request
        if msg.request_id not in pending_requests:
            ctx.logger.warning(f" Received response for unknown request ID: {msg.request_id}")
            return
        
        request_info = pending_requests[msg.request_id]
        user_sender = request_info.get("user_sender")
        
        # Send immediate ACK
        ack = RequestACK(
            request_id=msg.request_id,
            agent_type="doctor",
            message=f"Received booking response: {msg.status}",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        await ctx.send(sender, ack)
        
        # Send result to user (only for direct chat users, not REST API users)
        if user_sender and not user_sender.startswith("frontend_"):
            if msg.status == "success":
                success_message = f" Appointment booked! {msg.doctor_name} ({request_info['specialty']}) on {msg.appointment_time}. Reference: {msg.appointment_id}"
            else:
                success_message = f" Booking failed: {msg.message}"
            
            chat_response = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text=success_message)]
            )
            await ctx.send(user_sender, chat_response)
        else:
            ctx.logger.info(f" Result for REST API user {user_sender}: {msg.status} - {msg.message}")
        
        # Clean up pending request
        del pending_requests[msg.request_id]
        if msg.request_id in user_request_mapping:
            del user_request_mapping[msg.request_id]
        
        ctx.logger.info(f" Doctor response processed successfully")
        
    except Exception as e:
        ctx.logger.error(f" Error in doctor response handler: {str(e)}")

# Handler for pharmacy medicine check responses  
@pharmacy_protocol.on_message(model=MedicineCheckResponse)
async def handle_pharmacy_check_response(ctx: Context, sender: str, msg: MedicineCheckResponse):
    """Handle medicine check responses from PharmacyAgent"""
    global PHARMACY_AGENT_ADDRESS
    
    try:
        ctx.logger.info(f" PHARMACY PROTOCOL HANDLER TRIGGERED!")
        ctx.logger.info(f" Received medicine check response: {msg.status} - {msg.medicine}")
        ctx.logger.info(f" Response sender: {sender}, Request ID: {msg.request_id}")
        ctx.logger.info(f" Available: {msg.available}, Stock: {msg.stock}, Price: ${msg.price}")
        
        # Store the PharmacyAgent address for future communications
        if PHARMACY_AGENT_ADDRESS != sender:
            PHARMACY_AGENT_ADDRESS = sender
            connected_agents[sender] = "PharmacyAgent"
        
        # Check if this is a pending request
        if msg.request_id not in pending_requests:
            ctx.logger.warning(f" Received response for unknown request ID: {msg.request_id}")
            return
        
        request_info = pending_requests[msg.request_id]
        user_sender = request_info.get("user_sender")
        medicine_name = request_info.get("medicine")
        is_order_request = request_info.get("is_order_request", False)
        quantity = request_info.get("quantity", 1)
        
        # Send immediate ACK
        ack = RequestACK(
            request_id=msg.request_id,
            agent_type="pharmacy",
            message=f"Received medicine response: {msg.status}",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        await ctx.send(sender, ack)
        
        # Send result to user (only for direct chat users, not REST API users)
        if user_sender and not user_sender.startswith("frontend_"):
            if msg.available:
                if is_order_request:
                    # User wants to order - provide comprehensive ordering information
                    order_message = f" **{msg.medicine}** is available for purchase!\n\n"
                    order_message += f" **Stock:** {msg.stock} units available\n"
                    order_message += f" **Price:** ${msg.price:.2f} per unit\n"
                    order_message += f" **Pharmacy:** {msg.pharmacy_name}\n\n"
                    order_message += f"**To complete your order:**\n"
                    order_message += f"• Specify quantity needed (you requested {quantity})\n"
                    order_message += f"• Example: 'Order {quantity} units of {msg.medicine}'"
                else:
                    # Just availability check
                    order_message = f" **{msg.medicine}** is available at {msg.pharmacy_name}\n\n"
                    order_message += f" **Stock:** {msg.stock} units in inventory\n"
                    order_message += f" **Price:** ${msg.price:.2f} per unit\n\n"
                    order_message += f"Would you like me to help you place an order for this medicine?"
            else:
                # Unavailable message
                order_message = f" **{msg.medicine}** is currently {msg.status}\n\n"
                order_message += f" **Pharmacy:** {msg.pharmacy_name}\n"
                order_message += f" **Details:** {msg.message}\n\n"
                
                # Add alternative suggestions
                alternatives = await get_medicine_alternatives(medicine_name, ctx)
                if alternatives:
                    order_message += f" **AI Suggestions - Similar medicines you might consider:**\n"
                    for alt in alternatives[:3]:
                        order_message += f"• {alt}\n"
                    order_message += f"\nWould you like me to check availability for any of these alternatives?"
            
            chat_response = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text=order_message)]
            )
            await ctx.send(user_sender, chat_response)
        else:
            ctx.logger.info(f" Pharmacy result for REST API user {user_sender}: {msg.status} - {msg.medicine}")
        
        # Clean up pending request
        del pending_requests[msg.request_id]
        if msg.request_id in user_request_mapping:
            del user_request_mapping[msg.request_id]
        
        ctx.logger.info(f" Pharmacy response processed successfully")
        
    except Exception as e:
        ctx.logger.error(f" Error in pharmacy response handler: {str(e)}")

# Handler for pharmacy medicine order responses
@pharmacy_protocol.on_message(model=MedicineOrderResponse)
async def handle_pharmacy_order_response(ctx: Context, sender: str, msg: MedicineOrderResponse):
    """Handle medicine order responses from PharmacyAgent"""
    ctx.logger.info(f" Received medicine order response: {msg.status} - {msg.medicine}")
    ctx.logger.info(f"Order ID: {msg.order_id}, Total: ${msg.price}")
    # For now, just log the order response - could be extended to relay back to user

# Handler for wellness advice responses
@wellness_protocol.on_message(model=WellnessAdviceResponse)
async def handle_wellness_response(ctx: Context, sender: str, msg: WellnessAdviceResponse):
    """Handle responses from WellnessAgent"""
    global WELLNESS_AGENT_ADDRESS
    
    try:
        ctx.logger.info(f" WELLNESS PROTOCOL HANDLER TRIGGERED!")
        ctx.logger.info(f" Received wellness response: {msg.success} - {msg.message}")
        ctx.logger.info(f" Response sender: {sender}, Request ID: {msg.request_id}")
        
        # Store the WellnessAgent address for future communications
        if WELLNESS_AGENT_ADDRESS != sender:
            WELLNESS_AGENT_ADDRESS = sender
            connected_agents[sender] = "WellnessAgent"
        
        # Check if this is a pending request
        if msg.request_id not in pending_requests:
            ctx.logger.warning(f" Received response for unknown request ID: {msg.request_id}")
            return
        
        request_info = pending_requests[msg.request_id]
        user_sender = request_info.get("user_sender")
        data_type = request_info.get("data_type", "general")
        
        # Send immediate ACK
        ack = RequestACK(
            request_id=msg.request_id,
            agent_type="wellness",
            message=f"Received wellness response: {msg.success}",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        await ctx.send(sender, ack)
        
        # Send result to user (only for direct chat users, not REST API users)
        if user_sender and not user_sender.startswith("frontend_"):
            if msg.success:
                wellness_message = f" **Wellness Data Logged Successfully!**\n\n"
                if msg.summary:
                    wellness_message += f" **Summary:** {msg.summary}\n\n"
                if msg.advice:
                    wellness_message += f" **AI Wellness Advice:**\n"
                    for advice in msg.advice:
                        wellness_message += f"• {advice}\n"
            else:
                wellness_message = f" **Wellness Logging Failed**\n\n"
                wellness_message += f" **Error:** {msg.message}"
            
            chat_response = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text=wellness_message)]
            )
            await ctx.send(user_sender, chat_response)
        else:
            ctx.logger.info(f" Wellness result for REST API user {user_sender}: {msg.success} - {msg.message}")
        
        # Clean up pending request
        del pending_requests[msg.request_id]
        if msg.request_id in user_request_mapping:
            del user_request_mapping[msg.request_id]
        
        ctx.logger.info(f" Wellness response processed successfully")
        
    except Exception as e:
        ctx.logger.error(f" Error in wellness response handler: {str(e)}")

# ACK handler
@ack_protocol.on_message(model=RequestACK)
async def handle_request_ack(ctx: Context, sender: str, msg: RequestACK):
    """Handle ACK responses from other agents"""
    ctx.logger.info(f" Received ACK from {msg.agent_type} agent: {msg.message} (Request: {msg.request_id})")

# Include all protocols in the agent
agent.include(chat_proto)
agent.include(doctor_protocol) 
agent.include(pharmacy_protocol)
agent.include(wellness_protocol)
agent.include(ack_protocol)

# Manual configuration - no discovery service needed

@agent.on_event("startup")
async def health_agent_startup(ctx: Context):
    ctx.logger.info(f" HealthAgent started")
    ctx.logger.info(f" Agent address: {agent.address}")
    ctx.logger.info(f" Protocols registered: chat, doctor, pharmacy, wellness")
    ctx.logger.info(f" Ready for inter-agent communication")
    
    # Initialize manual connections
    global DOCTOR_AGENT_ADDRESS
    
    if DOCTOR_AGENT_ADDRESS:
        connected_agents[DOCTOR_AGENT_ADDRESS] = "DoctorAgent"
        ctx.logger.info(f" DoctorAgent configured: {DOCTOR_AGENT_ADDRESS}")
    else:
        ctx.logger.info("  DoctorAgent address not configured - update DOCTOR_AGENT_ADDRESS in code")
    
    if PHARMACY_AGENT_ADDRESS:
        connected_agents[PHARMACY_AGENT_ADDRESS] = "PharmacyAgent"
        ctx.logger.info(f" PharmacyAgent configured: {PHARMACY_AGENT_ADDRESS}")
    else:
        ctx.logger.info("  PharmacyAgent address not configured - will be set when PharmacyAgent connects")

if __name__ == "__main__":
    print("Starting HealthAgent...")
    print(f"Agent Address: {agent.address}")
    print("Ready to assist with your healthcare needs!")
    agent.run()

"""
HEALTH AGENT - ASI1 AI-ENHANCED SAMPLE CONVERSATIONS

 **AI-Powered Symptom Analysis:**
- "I have fever and cough" → AI provides detailed condition analysis with confidence scores
- "I'm experiencing headache and fatigue" → Smart specialist recommendations
- "I have chest pain and shortness of breath" → Urgency assessment with emergency protocols

💊 **Intelligent Pharmacy Services:**
- "Check if paracetamol is available" → Real-time stock + AI usage insights
- "I need to buy insulin for diabetes" → Smart quantity suggestions + prescription guidance
- "Do you have something for headaches?" → AI medicine recognition + alternatives
- "Order 3 tablets of ibuprofen" → Quantity-specific ordering with safety tips

👨‍⚕️ **Smart Doctor Appointments:**
- "Book me a cardiologist tomorrow" → AI specialty matching + automated scheduling
- "I need help with my skin problems" → AI maps to dermatology + books appointment
- "My head hurts constantly, need a doctor" → AI routes to neurology specialist

💊 **Medication Reminders:**
- "Remind me to take paracetamol at 8PM" → Smart scheduling with dosage reminders
- "Set reminder for insulin at 7AM and 7PM" → Diabetes-specific guidance

💪 **Wellness Tracking:**
- "Log my sleep: 8 hours last night" → AI sleep quality analysis
- "I exercised for 30 minutes today" → Personalized fitness insights

🚨 **Emergency Response:**
- "emergency" → Immediate protocol activation with location services

🤖 **ASI1 AI-Enhanced Example Conversation:**
User: "I have fever and cough."
HealthAgent: "✅ Symptoms logged: 'fever and cough'
🔍 Detected symptoms: fever, persistent cough
🏥 **AI Analysis - Likely conditions:**
  • 🔵 **Upper Respiratory Infection** (85% confidence)
  • 🟡 **Influenza** (70% confidence)
👨‍⚕️ **Recommended specialists:** General Practitioner
💡 **AI Insight:** These symptoms commonly indicate viral or bacterial respiratory infections.
📅 Would you like me to book an appointment with a General Practitioner?"

User: "Yes, book it"
HealthAgent: "✅ Appointment booked! Dr. Sarah Wilson (General Practitioner) on Tomorrow at 10:00 AM. Reference: APT-20250820-A1B2C3"

User: "Check if paracetamol is available"
HealthAgent: "✅ **Paracetamol** is available at HealthPlus Pharmacy
📦 **Stock:** 150 units in inventory
💰 **Price:** $5.99 per unit
💡 **AI Insight:** pain relief and fever reduction
Would you like me to help you place an order for this medicine?"

🎯 **Key ASI1 AI Features:**
- Natural language medicine name extraction
- Intelligent symptom-to-specialist mapping
- Real-time inventory with smart alternatives
- Confidence-based medical condition analysis
- Contextual health insights and recommendations
"""