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
from datetime import datetime, timezone
from uuid import uuid4
from typing import List, Optional
from pydantic import BaseModel

# ICP Canister settings for healthcare backend
CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai"
BASE_URL = "http://127.0.0.1:4943"

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# ASI1 API settings
# Create yours at: https://asi1.ai/dashboard/api-keys
ASI1_API_KEY = "sk_0ccc42224b8b45be81d4dee26203ab5a086eca11c56741758fd1fcea4060b823" # your_asi1_api_key" # Replace with your ASI1 key
ASI1_BASE_URL = "https://api.asi1.ai/v1"
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

# Protocol definitions for inter-agent communication
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

class MedicineCheckRequest(Model):
    medicine_name: str
    quantity: Optional[int] = 1
    prescription_id: Optional[str] = None

class MedicineCheckResponse(Model):
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

class WellnessLog(Model):
    log_type: str
    value: str
    timestamp: str
    notes: Optional[str] = None

class WellnessAdvice(Model):
    advice_type: str
    recommendation: str
    based_on: str
    priority: str = "normal"

# Create protocols for inter-agent communication
doctor_protocol = Protocol(name="DoctorBookingProtocol", version="1.0")
pharmacy_protocol = Protocol(name="PharmacyProtocol", version="1.0")
wellness_protocol = Protocol(name="WellnessProtocol", version="1.0")

# Agent addresses - update these with actual addresses from agent startup logs
DOCTOR_AGENT_ADDRESS = "agent1qwqyy4k7jfccfuymlvujxefvt3fj2x3qus84mg7nruunr9gmezv6wruawru"  # Fixed to exact sender from warning logs
PHARMACY_AGENT_ADDRESS = "agent1q2dlr9x8hkcl5p2dchemnt3utf2h4g05rcpku88rtaulxh33jlgs6spw49c"  # PharmacyAgent actual address
WELLNESS_AGENT_ADDRESS = None

# Store connected agents
connected_agents = {}
agent_responses = {}  # Store responses from other agents
response_events = {}  # Store asyncio events for response waiting
agent_request_mapping = {}  # Map agent addresses to request IDs

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

def classify_user_intent(message: str, sender: str = None) -> str:
    """Classify user intent based on message content and context"""
    message_lower = message.lower()
    
    # Check for context-based responses first
    if sender and sender in user_contexts:
        context = user_contexts[sender]
        
        # Handle doctor booking confirmations
        if context.get("awaiting_doctor_confirmation"):
            if any(word in message_lower for word in ["yes", "yeah", "sure", "ok", "okay", "book it", "please", "go ahead"]):
                return "confirm_doctor_booking"
            elif any(word in message_lower for word in ["no", "nope", "cancel", "not now", "maybe later"]):
                return "cancel_doctor_booking"
    
    # Regular intent classification
    if "emergency" in message_lower:
        return "emergency"
    elif any(phrase in message_lower for phrase in ["what disease", "what illness", "what condition", "disease summary", "health summary", "analyze my symptoms", "what might i have", "diagnose me", "my diagnosis", "health analysis"]):
        return "health_analysis"
    elif any(phrase in message_lower for phrase in ["doctor", "appointment", "book", "schedule", "see a doctor", "need a doctor", "visit a doctor", "consult a doctor", "medical help", "need medical attention", "check up", "checkup", "medical consultation", "i need to see", "can you book", "schedule me"]):
        return "book_doctor"
    elif any(word in message_lower for word in ["medicine", "pharmacy", "buy", "prescription", "drug", "tablet", "pill", "capsule", "available", "stock", "order"]):
        return "pharmacy"
    elif any(word in message_lower for word in ["remind", "reminder", "medication", "take"]):
        return "medication_reminder"
    elif any(word in message_lower for word in ["sleep", "exercise", "mood", "wellness", "log"]):
        return "wellness"
    elif any(phrase in message_lower for phrase in ["i have", "i feel", "i'm feeling", "experiencing", "my head", "my chest", "my stomach", "pain in", "ache", "hurts", "sick", "unwell", "not feeling well", "symptoms"]):
        return "symptom_logging"
    else:
        return "general"

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
        
        # Build response message
        response_parts = [f"✅ Symptoms logged: '{symptoms_text}'"]
        
        if asi1_result["success"]:
            analysis = asi1_result["analysis"]
            
            # Detected symptoms
            if analysis.get("detected_symptoms"):
                response_parts.append(f"\n🔍 Detected symptoms: {', '.join(analysis['detected_symptoms'])}")
            
            # Likely conditions from ASI1
            if analysis.get("likely_conditions"):
                response_parts.append(f"\n🏥 **AI Analysis - Likely conditions:**")
                for condition in analysis["likely_conditions"][:3]:
                    confidence = condition.get("confidence", 0)
                    severity = condition.get("severity", "moderate")
                    severity_emoji = {"emergency": "🚨", "urgent": "⚠️", "serious": "🟡", "moderate": "🔵", "mild": "🟢"}.get(severity, "🔵")
                    response_parts.append(f"  • {severity_emoji} **{condition['condition']}** ({confidence}% confidence)")
            
            # Recommended doctors from ASI1
            if analysis.get("recommended_doctors"):
                doctors_list = ", ".join(analysis["recommended_doctors"][:3])
                response_parts.append(f"\n👨‍⚕️ **Recommended specialists:** {doctors_list}")
            
            # ASI1 explanation
            if analysis.get("explanation"):
                response_parts.append(f"\n💡 **AI Insight:** {analysis['explanation']}")
            
            # Urgency assessment
            urgency = analysis.get("urgency", "moderate")
            if urgency in ["emergency", "urgent"]:
                response_parts.append(f"\n🚨 **URGENCY LEVEL: {urgency.upper()}** - Consider seeking immediate medical attention!")
            else:
                response_parts.append(f"\n⚕️ Please consult a healthcare professional for proper diagnosis.")
            
            # Offer appointment booking and set context
            if analysis.get("recommended_doctors"):
                primary_doctor = analysis["recommended_doctors"][0]
                response_parts.append(f"\n📅 Would you like me to book an appointment with a {primary_doctor}?")
                
                # Set context for follow-up response
                set_user_context(sender, {
                    "awaiting_doctor_confirmation": True,
                    "recommended_doctor": primary_doctor,
                    "last_analysis": analysis
                })
        else:
            # Simple fallback when ASI1 fails
            ctx.logger.warning(f"ASI1 analysis failed: {asi1_result['error']}, using basic fallback")
            
            response_parts.append(f"\n⚠️ AI analysis temporarily unavailable")
            response_parts.append(f"\n👨‍⚕️ Recommend consulting: General Practitioner")
            response_parts.append(f"\n💡 Your symptoms have been logged for future analysis")
            response_parts.append(f"\n⚕️ Please consult a healthcare professional for proper diagnosis.")
        
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
        
        return f"✅ Reminder set: Take {reminder_info['medicine']} at {reminder_info['time']}. You'll be notified at the scheduled time."
        
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
        
        return "🚨 EMERGENCY RECORDED. Please call emergency services (911/112) immediately if you need urgent medical assistance. This alert has been logged in your health record."
        
    except Exception as e:
        ctx.logger.error(f"Error handling emergency: {str(e)}")
        return "🚨 EMERGENCY ALERT: Please call emergency services immediately. There was an error logging this emergency, but your safety is the priority."

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
            return "📊 No symptom history found. Start logging your symptoms by telling me how you feel!"
        
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
        response_parts = ["📊 **AI-POWERED HEALTH ANALYSIS SUMMARY**"]
        response_parts.append(f"\n📝 Total symptom logs: {len(all_symptoms)}")
        
        if frequent_symptoms:
            freq_list = [f"{symptom} ({count}x)" for symptom, count in frequent_symptoms]
            response_parts.append(f"\n🔄 Most frequent symptoms: {', '.join(freq_list)}")
        
        if asi1_result["success"]:
            analysis = asi1_result["analysis"]
            
            # Pattern analysis from ASI1
            if analysis.get("pattern_analysis"):
                response_parts.append(f"\n📈 **AI PATTERN ANALYSIS:**")
                response_parts.append(f"  {analysis['pattern_analysis']}")
            
            # Likely conditions from ASI1
            if analysis.get("likely_conditions"):
                response_parts.append(f"\n🏥 **AI-IDENTIFIED LIKELY CONDITIONS:**")
                for condition in analysis["likely_conditions"][:3]:
                    confidence = condition.get("confidence", 0)
                    reasoning = condition.get("reasoning", "")
                    response_parts.append(f"  • **{condition['condition']}** ({confidence}% confidence)")
                    if reasoning:
                        response_parts.append(f"    Reasoning: {reasoning}")
            
            # Health insights from ASI1
            if analysis.get("health_insights"):
                response_parts.append(f"\n💡 **HEALTH INSIGHTS:**")
                for insight in analysis["health_insights"][:3]:
                    response_parts.append(f"  • {insight}")
            
            # Recommended doctors from ASI1
            if analysis.get("recommended_doctors"):
                doctors_list = ", ".join(analysis["recommended_doctors"][:3])
                response_parts.append(f"\n👨‍⚕️ **RECOMMENDED SPECIALISTS:** {doctors_list}")
            
            # AI recommendations
            if analysis.get("recommendations"):
                response_parts.append(f"\n📋 **AI RECOMMENDATIONS:**")
                for rec in analysis["recommendations"][:3]:
                    response_parts.append(f"  • {rec}")
            
            # Urgency assessment
            urgency = analysis.get("urgency", "moderate")
            if urgency in ["emergency", "urgent"]:
                response_parts.append(f"\n🚨 **URGENCY ASSESSMENT: {urgency.upper()}**")
                response_parts.append(f"  ⚠️ Your symptom pattern suggests need for prompt medical evaluation!")
            
        else:
            # Simple fallback when ASI1 fails
            ctx.logger.warning(f"ASI1 historical analysis failed: {asi1_result['error']}")
            
            response_parts.append(f"\n⚠️ **AI ANALYSIS TEMPORARILY UNAVAILABLE**")
            response_parts.append(f"\n📋 **BASIC SUMMARY:**")
            response_parts.append(f"  • Your symptom history has been preserved")
            response_parts.append(f"  • Consider discussing patterns with your doctor")
            response_parts.append(f"\n👨‍⚕️ **GENERAL RECOMMENDATION:** Consult General Practitioner")
        
        response_parts.append(f"\n⚕️ **DISCLAIMER:** This AI analysis is for informational purposes only. Please consult a healthcare professional for proper diagnosis.")
        
        # Offer appointment booking and set context
        if asi1_result["success"] and asi1_result["analysis"].get("recommended_doctors"):
            primary_doctor = asi1_result["analysis"]["recommended_doctors"][0]
            response_parts.append(f"\n📅 Would you like me to book an appointment with a {primary_doctor}?")
            
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
    
    # Send immediate confirmation
    confirmation_message = "✅ Booking confirmed! I'm finding you a doctor and scheduling your appointment..."
    chat_response = ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[TextContent(type="text", text=confirmation_message)]
    )
    await ctx.send(sender, chat_response)
    
    # Route to doctor booking agent (this will send detailed results later)
    booking_result = await route_to_doctor_agent(f"book {doctor}", ctx, sender)
    
    return booking_result

async def handle_doctor_booking_cancellation(sender: str, ctx: Context) -> str:
    """Handle cancellation of doctor appointment booking"""
    # Clear the context
    clear_user_context(sender)
    
    return "👍 No problem! Your symptoms are still logged. You can ask for a doctor booking anytime by saying 'book me a doctor appointment'."

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
                ctx.logger.info(f"🤖 LLM extracted specialty: {specialty}")
                return specialty
            else:
                ctx.logger.warning(f"🤖 LLM returned invalid specialty: {specialty}, using fallback")
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
        ctx.logger.info(f"🧠 Analyzing booking request with AI: '{message}'")
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
            
        booking_request = DoctorBookingRequest(
            specialty=specialty,
            preferred_time=preferred_time,
            urgency=urgency,
            symptoms=symptoms,
            user_id="user123"
        )
        
        # Send request to DoctorAgent
        
        if DOCTOR_AGENT_ADDRESS:
            try:
                ctx.logger.info(f"📤 Booking {specialty} appointment ({urgency})")
                
                # Clear any previous responses and create a simple event
                import asyncio
                if DOCTOR_AGENT_ADDRESS in agent_responses:
                    del agent_responses[DOCTOR_AGENT_ADDRESS]
                
                response_event = asyncio.Event()
                response_events[DOCTOR_AGENT_ADDRESS] = response_event
                # Also create event with a generic key for any DoctorAgent response
                response_events["doctor_response"] = response_event
                ctx.logger.info(f"📋 Event created and stored for: {DOCTOR_AGENT_ADDRESS}")
                ctx.logger.info(f"📋 Also created generic 'doctor_response' event")
                ctx.logger.info(f"🔍 Event object ID: {id(response_event)}")
                
                ctx.logger.info(f"⏰ Sending booking request at: {datetime.now()}")
                ctx.logger.info(f"📋 Sending to address: {DOCTOR_AGENT_ADDRESS}")
                ctx.logger.info(f"📋 Message content: {booking_request}")
                send_id = str(uuid4())[:8]
                ctx.logger.info(f"[SEND-{send_id}] Sending booking request to DoctorAgent")
                ctx.logger.info(f"🔍 About to send message type: {type(booking_request)}")
                ctx.logger.info(f"🔍 Message details: {booking_request}")
                
                try:
                    await ctx.send(DOCTOR_AGENT_ADDRESS, booking_request)
                    ctx.logger.info(f"📤 Request sent successfully, now waiting for response...")
                except Exception as e:
                    ctx.logger.error(f"❌ Failed to send request: {str(e)}")
                    return f"Failed to send request to DoctorAgent: {str(e)}"
                
                # Small delay to allow response to be processed in the same event loop
                await asyncio.sleep(0.1)
                
                # Poll for response (more reliable than event waiting)
                max_wait_time = 20.0  # Increased to accommodate DoctorAgent processing time
                poll_interval = 0.5
                total_waited = 0.0
                
                # Check immediately in case response is already available
                ctx.logger.info(f"🔍 Immediate check for response with key: {DOCTOR_AGENT_ADDRESS}")
                ctx.logger.info(f"🔍 Available keys before polling: {list(agent_responses.keys())}")
                
                if DOCTOR_AGENT_ADDRESS in agent_responses:
                    ctx.logger.info(f"✅ Response found immediately!")
                    response = agent_responses.pop(DOCTOR_AGENT_ADDRESS)
                    
                    # Clean up
                    if DOCTOR_AGENT_ADDRESS in response_events:
                        del response_events[DOCTOR_AGENT_ADDRESS]
                    
                    if response.status == "success":
                        ctx.logger.info(f"✅ Appointment confirmed: {response.doctor_name}")
                        return f"✅ Appointment booked! {response.doctor_name} ({specialty}) on {response.appointment_time}. Reference: {response.appointment_id}"
                    else:
                        return f"❌ Booking failed: {response.message}"
                
                ctx.logger.info(f"⏳ No immediate response, starting polling every {poll_interval}s, max {max_wait_time}s...")
                ctx.logger.info(f"🔍 Looking for response with key: {DOCTOR_AGENT_ADDRESS}")
                
                while total_waited < max_wait_time:
                    ctx.logger.info(f"🔍 Poll check at {total_waited}s - Available keys: {list(agent_responses.keys())}")
                    
                    if DOCTOR_AGENT_ADDRESS in agent_responses:
                        ctx.logger.info(f"✅ Response found after {total_waited}s!")
                        response = agent_responses.pop(DOCTOR_AGENT_ADDRESS)
                        
                        # Clean up
                        if DOCTOR_AGENT_ADDRESS in response_events:
                            del response_events[DOCTOR_AGENT_ADDRESS]
                        
                        if response.status == "success":
                            ctx.logger.info(f"✅ Appointment confirmed: {response.doctor_name}")
                            success_message = f"✅ Appointment booked! {response.doctor_name} ({specialty}) on {response.appointment_time}. Reference: {response.appointment_id}"
                            
                            # Send detailed results to user if user_sender is provided
                            if user_sender:
                                chat_response = ChatMessage(
                                    timestamp=datetime.now(timezone.utc),
                                    msg_id=uuid4(),
                                    content=[TextContent(type="text", text=success_message)]
                                )
                                await ctx.send(user_sender, chat_response)
                                return "Booking details sent to user"
                            else:
                                return success_message
                        else:
                            error_message = f"❌ Booking failed: {response.message}"
                            if user_sender:
                                chat_response = ChatMessage(
                                    timestamp=datetime.now(timezone.utc),
                                    msg_id=uuid4(),
                                    content=[TextContent(type="text", text=error_message)]
                                )
                                await ctx.send(user_sender, chat_response)
                                return "Error details sent to user"
                            else:
                                return error_message
                    
                    await asyncio.sleep(poll_interval)
                    total_waited += poll_interval
                    
                ctx.logger.warning(f"⚠️ No response found after {max_wait_time}s of polling")
                ctx.logger.warning(f"⚠️ Available responses: {list(agent_responses.keys())}")
                
                # Give a longer moment for any in-flight responses to arrive (mailbox delay)
                ctx.logger.info("⏸️ Waiting for any in-flight responses (accounting for mailbox delays)...")
                await asyncio.sleep(5.0)  # Extended to catch delayed responses
                
                # Check one more time after the delay
                if DOCTOR_AGENT_ADDRESS in agent_responses:
                    ctx.logger.info(f"✅ Found response after delay!")
                    response = agent_responses.pop(DOCTOR_AGENT_ADDRESS)
                    
                    # Clean up
                    if DOCTOR_AGENT_ADDRESS in response_events:
                        del response_events[DOCTOR_AGENT_ADDRESS]
                    
                    if response.status == "success":
                        ctx.logger.info(f"✅ Appointment confirmed: {response.doctor_name}")
                        success_message = f"✅ Appointment booked! {response.doctor_name} on {response.appointment_time}. Reference: {response.appointment_id}"
                        
                        if user_sender:
                            chat_response = ChatMessage(
                                timestamp=datetime.now(timezone.utc),
                                msg_id=uuid4(),
                                content=[TextContent(type="text", text=success_message)]
                            )
                            await ctx.send(user_sender, chat_response)
                            return "Booking details sent to user"
                        else:
                            return success_message
                    else:
                        error_message = f"❌ Booking failed: {response.message}"
                        if user_sender:
                            chat_response = ChatMessage(
                                timestamp=datetime.now(timezone.utc),
                                msg_id=uuid4(),
                                content=[TextContent(type="text", text=error_message)]
                            )
                            await ctx.send(user_sender, chat_response)
                            return "Error details sent to user"
                        else:
                            return error_message
                
                # Clean up to prevent late responses from being processed
                if DOCTOR_AGENT_ADDRESS in response_events:
                    del response_events[DOCTOR_AGENT_ADDRESS]
                    ctx.logger.info("🧹 Cleaned up DOCTOR_AGENT_ADDRESS event after timeout")
                if "doctor_response" in response_events:
                    del response_events["doctor_response"]
                    ctx.logger.info("🧹 Cleaned up generic doctor_response event after timeout")
                
                timeout_message = "Sorry, the doctor booking service is not responding right now. Please try again in a moment."
                if user_sender:
                    chat_response = ChatMessage(
                        timestamp=datetime.now(timezone.utc),
                        msg_id=uuid4(),
                        content=[TextContent(type="text", text=timeout_message)]
                    )
                    await ctx.send(user_sender, chat_response)
                    return "Timeout message sent to user"
                else:
                    return timeout_message
                    
            except Exception as e:
                ctx.logger.error(f"❌ Error communicating with DoctorAgent: {str(e)}")
                return "Sorry, there was an error connecting to the doctor booking service. Please try again."
        else:
            ctx.logger.error("❌ DOCTOR_AGENT_ADDRESS not configured")
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
                ctx.logger.info(f"🤖 LLM extracted medicine info: {medicine_info}")
                
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
        ctx.logger.info(f"🧠 Analyzing medicine request with AI: '{message}'")
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
        
        ctx.logger.info(f"📋 Creating MedicineCheckRequest with: medicine_name='{medicine_name}' (type: {type(medicine_name)}), quantity={quantity} (type: {type(quantity)})")
        
        try:
            if is_order_request:
                # For order requests, we need medicine_id - first check availability to get it
                ctx.logger.info(f"Processing medicine order request for: {medicine_name} (qty: {quantity})")
                medicine_request = MedicineCheckRequest(
                    medicine_name=medicine_name,
                    quantity=quantity
                )
            else:
                # Availability check
                ctx.logger.info(f"Processing medicine availability check for: {medicine_name}")
                medicine_request = MedicineCheckRequest(
                    medicine_name=medicine_name,
                    quantity=quantity
                )
            
            ctx.logger.info(f"✅ Successfully created MedicineCheckRequest: {type(medicine_request)}")
            
        except Exception as e:
            ctx.logger.error(f"❌ Failed to create MedicineCheckRequest: {str(e)}")
            ctx.logger.error(f"   Medicine name: '{medicine_name}' (type: {type(medicine_name)})")
            ctx.logger.error(f"   Quantity: {quantity} (type: {type(quantity)})")
            raise
        
        # Send request to PharmacyAgent if available
        if PHARMACY_AGENT_ADDRESS:
            try:
                ctx.logger.info(f"📤 Sending medicine request to PharmacyAgent")
                
                # Clear any previous responses and create event
                import asyncio
                if PHARMACY_AGENT_ADDRESS in agent_responses:
                    del agent_responses[PHARMACY_AGENT_ADDRESS]
                
                response_event = asyncio.Event()
                response_events[PHARMACY_AGENT_ADDRESS] = response_event
                response_events["pharmacy_response"] = response_event
                
                await ctx.send(PHARMACY_AGENT_ADDRESS, medicine_request)
                ctx.logger.info(f"📤 Medicine request sent, waiting for response...")
                
                # Poll for response
                max_wait_time = 15.0
                poll_interval = 0.5
                total_waited = 0.0
                
                while total_waited < max_wait_time:
                    if PHARMACY_AGENT_ADDRESS in agent_responses:
                        ctx.logger.info(f"✅ Medicine response received after {total_waited}s")
                        response = agent_responses.pop(PHARMACY_AGENT_ADDRESS)
                        
                        # Clean up
                        if PHARMACY_AGENT_ADDRESS in response_events:
                            del response_events[PHARMACY_AGENT_ADDRESS]
                        
                        # Format response for user with enhanced ASI1-powered messaging
                        if response.available:
                            if is_order_request:
                                # User wants to order - provide comprehensive ordering information
                                order_message = f"✅ **{response.medicine}** is available for purchase!\n\n"
                                order_message += f"📦 **Stock:** {response.stock} units available\n"
                                order_message += f"💰 **Price:** ${response.price:.2f} per unit\n"
                                order_message += f"🏥 **Pharmacy:** {response.pharmacy_name}\n\n"
                                
                                # Add intelligent recommendations based on medicine type
                                requirements = medicine_info.get("requirements", "")
                                if "prescription" in requirements.lower() or "insulin" in medicine_name.lower():
                                    order_message += f"⚠️ **Note:** This medicine may require a prescription.\n\n"
                                
                                order_message += f"**To complete your order:**\n"
                                order_message += f"• Specify quantity needed (you requested {quantity})\n"
                                order_message += f"• Provide prescription ID if required\n"
                                order_message += f"• Example: 'Order {quantity} units of {response.medicine}'\n\n"
                                order_message += f"💡 **AI Tip:** This medication is commonly used for {await get_medicine_usage_hint(medicine_name, ctx)}"
                            else:
                                # Just availability check with intelligent insights
                                order_message = f"✅ **{response.medicine}** is available at {response.pharmacy_name}\n\n"
                                order_message += f"📦 **Stock:** {response.stock} units in inventory\n"
                                order_message += f"💰 **Price:** ${response.price:.2f} per unit\n\n"
                                order_message += f"💡 **AI Insight:** {await get_medicine_usage_hint(medicine_name, ctx)}\n\n"
                                order_message += f"Would you like me to help you place an order for this medicine?"
                            
                            if user_sender:
                                # Send as ChatMessage with TextContent
                                chat_response = ChatMessage(
                                    timestamp=datetime.now(timezone.utc),
                                    msg_id=uuid4(),
                                    content=[TextContent(type="text", text=order_message)]
                                )
                                await ctx.send(user_sender, chat_response)
                                return "Enhanced medicine availability sent to user"
                            else:
                                return order_message
                        else:
                            # Enhanced unavailable message with alternatives
                            unavailable_message = f"❌ **{response.medicine}** is currently {response.status}\n\n"
                            unavailable_message += f"🏥 **Pharmacy:** {response.pharmacy_name}\n"
                            unavailable_message += f"📝 **Details:** {response.message}\n\n"
                            
                            # Add intelligent alternative suggestions
                            alternatives = await get_medicine_alternatives(medicine_name, ctx)
                            if alternatives:
                                unavailable_message += f"💡 **AI Suggestions - Similar medicines you might consider:**\n"
                                for alt in alternatives[:3]:
                                    unavailable_message += f"• {alt}\n"
                                unavailable_message += f"\nWould you like me to check availability for any of these alternatives?"
                            
                            if user_sender:
                                # Send as ChatMessage with TextContent
                                chat_response = ChatMessage(
                                    timestamp=datetime.now(timezone.utc),
                                    msg_id=uuid4(),
                                    content=[TextContent(type="text", text=unavailable_message)]
                                )
                                await ctx.send(user_sender, chat_response)
                                return "Enhanced unavailability info sent to user"
                            else:
                                return unavailable_message
                    
                    await asyncio.sleep(poll_interval)
                    total_waited += poll_interval
                
                # Timeout
                ctx.logger.warning(f"⚠️ No response from PharmacyAgent after {max_wait_time}s")
                timeout_message = "Sorry, the pharmacy service is not responding right now. Please try again in a moment."
                if user_sender:
                    # Send as ChatMessage with TextContent
                    chat_response = ChatMessage(
                        timestamp=datetime.now(timezone.utc),
                        msg_id=uuid4(),
                        content=[TextContent(type="text", text=timeout_message)]
                    )
                    await ctx.send(user_sender, chat_response)
                    return "Timeout message sent to user"
                else:
                    return timeout_message
                    
            except Exception as e:
                ctx.logger.error(f"❌ Error communicating with PharmacyAgent: {str(e)}")
                return "Sorry, there was an error connecting to the pharmacy service. Please try again."
        else:
            ctx.logger.error("❌ PHARMACY_AGENT_ADDRESS not configured")
            return "Sorry, the pharmacy service is not properly configured. Please contact support."
        
    except Exception as e:
        ctx.logger.error(f"Error routing to pharmacy agent: {str(e)}")
        return "Sorry, I couldn't process your medicine request right now. Please try again later."

async def route_to_wellness_agent(message: str, ctx: Context) -> str:
    """Route wellness logging to WellnessAgent"""
    try:
        # Determine wellness log type
        log_type = "general"
        if "sleep" in message.lower():
            log_type = "sleep"
        elif "exercise" in message.lower():
            log_type = "exercise"
        elif "mood" in message.lower():
            log_type = "mood"
        
        wellness_log = WellnessLog(
            log_type=log_type,
            value=message,
            timestamp=datetime.now(timezone.utc).isoformat(),
            notes="Logged via HealthAgent"
        )
        
        # In a real implementation, send to actual WellnessAgent
        # For demo, simulate response
        mock_advice = WellnessAdvice(
            advice_type=log_type,
            recommendation="Great job logging your wellness data! Keep tracking for better health insights.",
            based_on="User wellness logging",
            priority="normal"
        )
        
        return f"📊 {log_type.title()} data logged successfully! {mock_advice.recommendation}"
        
    except Exception as e:
        ctx.logger.error(f"Error routing to wellness agent: {str(e)}")
        return "Sorry, I couldn't log your wellness data right now. Please try again later."

async def process_health_query(query: str, ctx: Context, sender: str = "default_user") -> str:
    """Process health-related queries and route appropriately"""
    try:
        intent = classify_user_intent(query, sender)
        
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
            return await route_to_wellness_agent(query, ctx)
        else:
            # Clear any waiting context when showing general help
            clear_user_context(sender)
            return ("Hello! I'm your HealthAgent powered by ASI1 AI. I can help you with:\n\n"
                   "🩺 **Smart Symptom Analysis:**\n"
                   "• 'I have fever and cough' - AI-powered diagnosis suggestions\n"
                   "• 'What disease might I have?' - Comprehensive health analysis\n\n"
                   "💊 **Intelligent Pharmacy Services:**\n"
                   "• 'Check if paracetamol is available' - Real-time stock checking\n"
                   "• 'I need to buy insulin' - Smart medicine ordering\n"
                   "• 'Order 2 tablets of ibuprofen' - Quantity-specific requests\n"
                   "• AI-powered alternative medicine suggestions when unavailable\n\n"
                   "👨‍⚕️ **Smart Doctor Booking:**\n"
                   "• 'Book me a cardiologist appointment' - AI specialty matching\n"
                   "• 'I need to see a doctor for my headaches' - Intelligent routing\n\n"
                   "💊 **Medication Management:**\n"
                   "• 'Remind me to take aspirin at 8PM' - Smart reminders\n\n"
                   "💪 **Wellness Tracking:**\n"
                   "• 'Log my sleep: 8 hours last night' - Health data logging\n\n"
                   "🚨 **Emergency Support:**\n"
                   "• Type 'emergency' for urgent medical situations\n\n"
                   "🤖 **Powered by ASI1 AI** for intelligent healthcare assistance!")
        
    except Exception as e:
        ctx.logger.error(f"Error processing health query: {str(e)}")
        return "I'm having trouble processing your request. Please try again or rephrase your question."

# Create the HealthAgent
agent = Agent(
    name='health-agent',
    port=8000,
    mailbox=True,
)

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
                    "👋 Welcome to **HealthAgent** powered by ASI1 AI! I'm your intelligent healthcare assistant.\n\n"
                    "🤖 **AI-Enhanced Capabilities:**\n\n"
                    "🩺 **Smart Health Analysis**\n"
                    "• AI-powered symptom analysis and condition predictions\n"
                    "• Intelligent specialist recommendations\n\n"
                    "💊 **Intelligent Pharmacy Services**\n"
                    "• AI medicine name recognition from natural language\n"
                    "• Real-time inventory checking with smart alternatives\n"
                    "• Usage insights and safety recommendations\n\n"
                    "👨‍⚕️ **Smart Appointment Booking**\n"
                    "• AI specialty matching from symptom descriptions\n"
                    "• Automated doctor selection and scheduling\n\n"
                    "💊 **Medication Management**\n"
                    "• Intelligent reminder scheduling\n\n"
                    "💪 **Wellness Tracking**\n"
                    "• Health data logging and insights\n\n"
                    "🚨 **Emergency Support**\n"
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
        ctx.logger.info(f"🎯 PROTOCOL HANDLER TRIGGERED!")
        ctx.logger.info(f"📨 Received booking response at {datetime.now()}: {msg.status} - {msg.doctor_name}")
        ctx.logger.info(f"📨 Response sender: {sender}")
        ctx.logger.info(f"📨 Response message type: {type(msg)}")
        ctx.logger.info(f"📨 Full response content: {msg}")
        
        # Store the DoctorAgent address for future communications
        if DOCTOR_AGENT_ADDRESS != sender:
            DOCTOR_AGENT_ADDRESS = sender
            connected_agents[sender] = "DoctorAgent"
        
        # Check if we have an active waiting event BEFORE storing response
        ctx.logger.info(f"🔍 Looking for events. Current response_events keys: {list(response_events.keys())}")
        ctx.logger.info(f"🔍 Checking sender '{sender}' against events")
        ctx.logger.info(f"🔍 Checking DOCTOR_AGENT_ADDRESS '{DOCTOR_AGENT_ADDRESS}' against events")
        
        if sender in response_events:
            # Store the response using sender address - only if we're actively waiting
            agent_responses[sender] = msg
            ctx.logger.info(f"✅ Stored response from sender: {sender}")
            
            # Also store with DOCTOR_AGENT_ADDRESS for consistency  
            if DOCTOR_AGENT_ADDRESS:
                agent_responses[DOCTOR_AGENT_ADDRESS] = msg
                ctx.logger.info(f"✅ Also stored response with DOCTOR_AGENT_ADDRESS: {DOCTOR_AGENT_ADDRESS}")
            
            event_obj = response_events[sender]
            ctx.logger.info(f"🔍 Found event for sender: {sender}, object ID: {id(event_obj)}")
            event_obj.set()
            ctx.logger.info(f"✅ Event signaled for sender: {sender}")
            
        elif DOCTOR_AGENT_ADDRESS and DOCTOR_AGENT_ADDRESS in response_events:
            # Store the response - only if we're actively waiting
            agent_responses[sender] = msg
            agent_responses[DOCTOR_AGENT_ADDRESS] = msg
            ctx.logger.info(f"✅ Stored response from sender: {sender} and DOCTOR_AGENT_ADDRESS: {DOCTOR_AGENT_ADDRESS}")
            
            event_obj = response_events[DOCTOR_AGENT_ADDRESS]
            ctx.logger.info(f"🔍 Found event for DOCTOR_AGENT_ADDRESS: {DOCTOR_AGENT_ADDRESS}, object ID: {id(event_obj)}")
            event_obj.set()
            ctx.logger.info(f"✅ Event signaled for DOCTOR_AGENT_ADDRESS: {DOCTOR_AGENT_ADDRESS}")
            
        elif "doctor_response" in response_events:
            # Store the response using generic doctor response event
            agent_responses[sender] = msg
            agent_responses[DOCTOR_AGENT_ADDRESS] = msg
            ctx.logger.info(f"✅ Stored response using generic doctor_response event from sender: {sender}")
            
            event_obj = response_events["doctor_response"]
            ctx.logger.info(f"🔍 Found generic doctor_response event, object ID: {id(event_obj)}")
            event_obj.set()
            ctx.logger.info(f"✅ Generic doctor_response event signaled")
            
        else:
            ctx.logger.warning(f"⚠️ No active waiting events - response arrived too late")
            ctx.logger.warning(f"⚠️ Sender: {sender}, DOCTOR_AGENT_ADDRESS: {DOCTOR_AGENT_ADDRESS}")
            ctx.logger.warning(f"⚠️ Available events: {list(response_events.keys())}")
            ctx.logger.info("🗑️ Discarding late response to prevent confusion")
            
            # Early return to prevent processing of late responses - don't store them at all
            ctx.logger.info("🚫 Stopping processing of late response")
            return
                
        ctx.logger.info(f"✅ Response handler completed successfully")
        
    except Exception as e:
        ctx.logger.error(f"❌ Error in response handler: {str(e)}")
        # Emergency fallback: signal all events
        for event_id, event in list(response_events.items()):
            ctx.logger.info(f"🚨 Emergency signaling event: {event_id}")
            event.set()

# Handler for pharmacy medicine check responses  
@pharmacy_protocol.on_message(model=MedicineCheckResponse)
async def handle_pharmacy_check_response(ctx: Context, sender: str, msg: MedicineCheckResponse):
    """Handle medicine check responses from PharmacyAgent"""
    global PHARMACY_AGENT_ADDRESS
    
    try:
        ctx.logger.info(f"🎯 PHARMACY PROTOCOL HANDLER TRIGGERED!")
        ctx.logger.info(f"📨 Received medicine check response at {datetime.now()}: {msg.status} - {msg.medicine}")
        ctx.logger.info(f"📨 Response sender: {sender}")
        ctx.logger.info(f"📨 Response type: {type(msg)}")
        ctx.logger.info(f"📨 Available: {msg.available}, Stock: {msg.stock}, Price: ${msg.price}")
        
        # Store the PharmacyAgent address for future communications
        if PHARMACY_AGENT_ADDRESS != sender:
            PHARMACY_AGENT_ADDRESS = sender
            connected_agents[sender] = "PharmacyAgent"
        
        # Check if we have an active waiting event
        ctx.logger.info(f"🔍 Looking for events. Current response_events keys: {list(response_events.keys())}")
        
        if sender in response_events:
            # Store the response using sender address
            agent_responses[sender] = msg
            ctx.logger.info(f"✅ Stored pharmacy response from sender: {sender}")
            
            # Also store with PHARMACY_AGENT_ADDRESS for consistency  
            if PHARMACY_AGENT_ADDRESS:
                agent_responses[PHARMACY_AGENT_ADDRESS] = msg
                ctx.logger.info(f"✅ Also stored response with PHARMACY_AGENT_ADDRESS: {PHARMACY_AGENT_ADDRESS}")
            
            event_obj = response_events[sender]
            ctx.logger.info(f"🔍 Found event for sender: {sender}, signaling...")
            event_obj.set()
            ctx.logger.info(f"✅ Event signaled for sender: {sender}")
            
        elif PHARMACY_AGENT_ADDRESS and PHARMACY_AGENT_ADDRESS in response_events:
            # Store using PHARMACY_AGENT_ADDRESS
            agent_responses[sender] = msg
            agent_responses[PHARMACY_AGENT_ADDRESS] = msg
            ctx.logger.info(f"✅ Stored pharmacy response using PHARMACY_AGENT_ADDRESS: {PHARMACY_AGENT_ADDRESS}")
            
            event_obj = response_events[PHARMACY_AGENT_ADDRESS]
            event_obj.set()
            ctx.logger.info(f"✅ Event signaled for PHARMACY_AGENT_ADDRESS: {PHARMACY_AGENT_ADDRESS}")
            
        elif "pharmacy_response" in response_events:
            # Store using generic pharmacy response event
            agent_responses[sender] = msg
            agent_responses[PHARMACY_AGENT_ADDRESS] = msg
            ctx.logger.info(f"✅ Stored response using generic pharmacy_response event")
            
            event_obj = response_events["pharmacy_response"]
            event_obj.set()
            ctx.logger.info(f"✅ Generic pharmacy_response event signaled")
            
        else:
            ctx.logger.warning(f"⚠️ No active waiting events - pharmacy response arrived too late")
            ctx.logger.warning(f"⚠️ Available events: {list(response_events.keys())}")
            ctx.logger.info("🚫 Stopping processing of late response")
            return
                
        ctx.logger.info(f"✅ Pharmacy response handler completed successfully")
        
    except Exception as e:
        ctx.logger.error(f"❌ Error in pharmacy response handler: {str(e)}")
        # Emergency fallback: signal all events
        for event_id, event in list(response_events.items()):
            if "pharmacy" in event_id:
                ctx.logger.info(f"🚨 Emergency signaling pharmacy event: {event_id}")
                event.set()

# Handler for pharmacy medicine order responses
@pharmacy_protocol.on_message(model=MedicineOrderResponse)
async def handle_pharmacy_order_response(ctx: Context, sender: str, msg: MedicineOrderResponse):
    """Handle medicine order responses from PharmacyAgent"""
    ctx.logger.info(f"📨 Received medicine order response: {msg.status} - {msg.medicine}")
    ctx.logger.info(f"Order ID: {msg.order_id}, Total: ${msg.price}")
    # For now, just log the order response - could be extended to relay back to user

# Handler for wellness advice
@wellness_protocol.on_message(model=WellnessAdvice)
async def handle_wellness_response(ctx: Context, sender: str, msg: WellnessAdvice):
    """Handle responses from WellnessAgent"""
    ctx.logger.info(f"Received wellness advice: {msg}")
    # In a real implementation, relay this back to the user

# Include all protocols in the agent
agent.include(chat_proto)
agent.include(doctor_protocol) 
agent.include(pharmacy_protocol)
agent.include(wellness_protocol)

# Manual configuration - no discovery service needed

@agent.on_event("startup")
async def health_agent_startup(ctx: Context):
    ctx.logger.info(f"🏥 HealthAgent started")
    ctx.logger.info(f"📋 Agent address: {agent.address}")
    ctx.logger.info(f"🔗 Protocols registered: chat, doctor, pharmacy, wellness")
    ctx.logger.info(f"🔍 Ready for inter-agent communication")
    
    # Initialize manual connections
    global DOCTOR_AGENT_ADDRESS
    
    if DOCTOR_AGENT_ADDRESS:
        connected_agents[DOCTOR_AGENT_ADDRESS] = "DoctorAgent"
        ctx.logger.info(f"✅ DoctorAgent configured: {DOCTOR_AGENT_ADDRESS}")
    else:
        ctx.logger.info("⚠️  DoctorAgent address not configured - update DOCTOR_AGENT_ADDRESS in code")
    
    if PHARMACY_AGENT_ADDRESS:
        connected_agents[PHARMACY_AGENT_ADDRESS] = "PharmacyAgent"
        ctx.logger.info(f"✅ PharmacyAgent configured: {PHARMACY_AGENT_ADDRESS}")
    else:
        ctx.logger.info("⚠️  PharmacyAgent address not configured - will be set when PharmacyAgent connects")

if __name__ == "__main__":
    print("Starting HealthAgent...")
    print(f"Agent Address: {agent.address}")
    print("Ready to assist with your healthcare needs!")
    agent.run()

"""
HEALTH AGENT - ASI1 AI-ENHANCED SAMPLE CONVERSATIONS

🧠 **AI-Powered Symptom Analysis:**
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