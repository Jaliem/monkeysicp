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
    "Content-Type": "application/json",
    "Accept": "application/json"
}

# Healthcare data storage (local backup, primary storage is ICP canister)
user_symptoms = []
user_reminders = []
emergency_status = False

# Conversation context tracking
user_contexts = {}  # Store user conversation states

# REST endpoint models for Flask API integration
class FileData(Model):
    content: str  # Base64 encoded file content
    file_type: str  # "image" or "document"
    file_name: str
    mime_type: str

class ChatRequest(Model):
    message: str
    user_id: str
    file: Optional[FileData] = None

class ChatResponse(Model):
    response: str
    intent: str
    confidence: float
    timestamp: str
    request_id: str
    sender: str
    user_id: str
    communication_status: str
    file_analysis: Optional[dict] = None

# Protocol definitions for inter-agent communication
class DoctorBookingRequest(Model):
    request_id: str  # For correlation
    specialty: str
    preferred_time: str
    urgency: str = "normal"
    symptoms: Optional[str] = None
    user_id: str

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
    user_id: str
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

# === NEW: Unified Medicine Purchase Models (like Doctor Booking) ===
class MedicinePurchaseRequest(Model):
    request_id: str  # For correlation
    medicine_name: str
    quantity: int = 1
    user_id: str
    prescription_id: Optional[str] = None
    auto_order: bool = True  # Automatically place order if available

class MedicinePurchaseResponse(Model):
    request_id: str  # Echo back for correlation
    status: str  # "success", "error", "insufficient_stock", "prescription_required"
    medicine_name: Optional[str] = None
    order_id: Optional[str] = None
    total_price: Optional[float] = None
    message: str

class LogRequest(Model):
    request_id: str  # For correlation
    date: Optional[str] = None  # Date for the wellness log (YYYY-MM-DD format)
    sleep: Optional[float] = None
    steps: Optional[int] = None
    exercise: Optional[str] = None
    mood: Optional[str] = None
    water_intake: Optional[float] = None
    user_id: str

class SummaryRequest(Model):
    request_id: str  # For correlation
    days: int = 7
    user_id: str

class DeleteRequest(Model):
    request_id: str  # For correlation
    date: str  # Date to delete (YYYY-MM-DD format)
    user_id: str

class WellnessAdviceResponse(Model):
    request_id: str  # Echo back for correlation
    summary: Optional[str] = None
    advice: List[str]
    success: bool = True
    message: str = ""

class CancelRequest(Model):
    request_id: str  # For correlation
    cancel_type: str  # "appointment" or "order"
    item_id: str  # appointment_id or order_id
    user_id: str

class CancelResponse(Model):
    request_id: str  # Echo back for correlation
    success: bool
    message: str
    cancelled_id: Optional[str] = None

class WellnessInsightsRequest(Model):
    request_id: str
    user_id: str
    days: int = 7

class WellnessInsightsResponse(Model):
    request_id: str
    success: bool
    insights: Optional[str] = None
    summary: Optional[str] = None
    recommendations: List[str] = []
    message: str = ""

# Create protocols for inter-agent communication
doctor_protocol = Protocol(name="DoctorBookingProtocol", version="1.0")
pharmacy_protocol = Protocol(name="PharmacyProtocol", version="1.0")
wellness_protocol = Protocol(name="WellnessProtocol", version="1.0")
cancel_protocol = Protocol(name="CancelProtocol", version="1.0")
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

async def analyze_with_asi1(symptoms_text: str, analysis_type: str = "current", image_data: Optional[FileData] = None) -> dict:
    """Use ASI1 LLM for intelligent symptom and image analysis"""
    try:
        messages = []
        model = "asi1-mini"
        
        if analysis_type == "current":
            system_prompt = """You are HealthAgent, a friendly and cheerful AI medical assistant. Your goal is to provide clear, helpful, and reassuring health information. Always use a positive and empathetic tone. Use emojis to make your responses more engaging and break down complex information into bullet points or numbered lists where appropriate.

Analyze the given symptoms and provide:
1. Most likely conditions (with confidence %)
2. Recommended medical specialists
3. Urgency level (emergency/urgent/moderate/mild)
4. Key symptoms detected
5. A detailed, reassuring explanation of your reasoning.

Respond in JSON format with: {"likely_conditions": [{"condition": "", "confidence": 0, "severity": ""}], "recommended_doctors": [], "urgency": "", "detected_symptoms": [], "explanation": ""}

IMPORTANT: This is for informational purposes only. Always recommend consulting healthcare professionals."""
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Patient reports: {symptoms_text}"}
            ]

        elif analysis_type == "image_analysis":
            model = "asi1-mini"  # Use the standard model for multimodal inputs
            system_prompt = """You are HealthAgent, a friendly and cheerful AI medical assistant. Your goal is to provide clear, helpful, and reassuring health information from images. Always use a positive and empathetic tone. Use emojis - a lot of them - to make your responses more engaging and break down complex information into bullet points or numbered lists where appropriate.

Analyze the provided image and any accompanying text to give feedback. Your analysis should be tailored to the type of image.

Possible image types and required analysis:
1.  **Skin Condition (e.g., rash, mole):**
    *   Describe what you see (color, shape, texture).
    *   Suggest possible (NOT DEFINITIVE) conditions.
    *   Recommend a specialist (e.g., Dermatologist).
    *   Provide a clear disclaimer that this is not a diagnosis.
    *   Respond in JSON: `{"image_type": "skin_condition", "description": "...", "possible_conditions": ["...", "..."], "recommendation": "..."}`

2.  **Food/Meal:**
    *   Identify the food items.
    *   Estimate nutritional information (calories, macronutrients).
    *   Provide health feedback (e.g., "This looks like a balanced meal...").
    *   Respond in JSON: `{"image_type": "food", "identified_food": ["...", "..."], "nutritional_estimate": {"calories": "...", "protein": "...", "carbs": "...", "fats": "..."}, "feedback": "..."}`

3.  **Medical Document/Report (e.g., lab results, prescription):**
    *   **First, perform Optical Character Recognition (OCR) to read all the text in the image.**
    *   Extract key information from the recognized text (e.g., patient details, test names, values, units, reference ranges).
    *   Provide a concise summary of the key findings from the results, not a general description of the document itself.
    *   Based on the findings, provide 2-3 actionable, general wellness recommendations (e.g., dietary suggestions, exercise advice, or stress management tips) that might be relevant. Frame these as general health advice, not as a treatment plan.
    *   Conclude the recommendation by strongly advising the user to discuss the results with their healthcare provider for an official interpretation and personalized medical advice.
    *   Respond in JSON: `{"image_type": "medical_document", "extracted_text": "...", "extracted_data": [{"test": "...", "value": "...", "range": "...", "status": "Normal/High/Low"}], "summary": "...", "recommendation": "..."}`

4.  **General/Other:**
    *   Describe the image and its relevance to health.
    *   Provide general feedback or answer the user's question about the image.
    *   Respond in JSON: `{"image_type": "other", "description": "...", "feedback": "..."}`

Analyze the image and the user's prompt, determine the image type, and provide the analysis in the corresponding JSON format.
IMPORTANT: You MUST respond with ONLY a valid JSON object that adheres to the structure specified for the detected image type. Do not include any other text, explanations, or markdown formatting outside of the JSON object."""
            
            user_content = [
                {"type": "text", "text": symptoms_text or "Please analyze this image."}
            ]
            if image_data:
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{image_data.mime_type};base64,{image_data.content}"
                    }
                })
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
        
        else:  # historical analysis
            system_prompt = """You are HealthAgent, a friendly and cheerful AI medical assistant. Your goal is to provide clear, helpful, and reassuring health information. Always use a positive and empathetic tone. Use emojis to make your responses more engaging and break down complex information into bullet points or numbered lists where appropriate.

Analyze a patient's symptom history. Based on the pattern of symptoms over time, provide:
1. Most likely underlying conditions
2. Symptom patterns and frequency analysis
3. Recommended specialists based on overall pattern
4. Health insights and recommendations
5. Urgency assessment

Respond in JSON format with: {"pattern_analysis": "", "likely_conditions": [{"condition": "", "confidence": 0, "reasoning": ""}], "recommended_doctors": [], "health_insights": [], "urgency": "", "recommendations": []}

IMPORTANT: This is for informational purposes only. Always recommend consulting healthcare professionals."""
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Patient symptom history: {symptoms_text}"}
            ]

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096,
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

            # Attempt to extract JSON from the response string, which might have markdown
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                json_string = json_match.group(0)
                try:
                    analysis_result = json.loads(json_string)
                    return {"success": True, "analysis": analysis_result}
                except json.JSONDecodeError:
                    return {"success": False, "error": f"Found a JSON-like object, but failed to parse it. Content: {json_string}"}
            else:
                return {"success": False, "error": f"No valid JSON object found in the AI's response. Full response: {content}"}
        else:
            return {"success": False, "error": f"ASI1 API error: {response.status_code}"}

    except Exception as e:
        return {"success": False, "error": f"ASI1 analysis failed: {str(e)}"}

# Removed old hard-coded analyze_symptoms function - now using ASI1 LLM exclusively

async def extract_reminder_info_with_llm(text: str, ctx: Context) -> dict:
    """Extract medication reminder information using ASI1 LLM for better natural language understanding"""
    ctx.logger.info(f"🔍 Extracting reminder info from: '{text}'")
    try:
        prompt = f"""Extract medication reminder information from this text: "{text}"

Please respond with a JSON object containing:
- "medicine": The medication name (e.g., "aspirin", "blood pressure pills", "vitamins")
- "time": The time/schedule in natural language (e.g., "8PM", "after eating", "with breakfast", "before bed", "every 6 hours", "as needed")

Examples:
- "Remind me to take aspirin at 8PM" → {{"medicine": "aspirin", "time": "8PM"}}
- "Take vitamins with breakfast" → {{"medicine": "vitamins", "time": "with breakfast"}}
- "Blood pressure pills after eating" → {{"medicine": "blood pressure pills", "time": "after eating"}}
- "Insulin before bed" → {{"medicine": "insulin", "time": "before bed"}}
- "Take paracetamol as needed" → {{"medicine": "paracetamol", "time": "as needed"}}

Respond only with valid JSON, no additional text."""

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json={
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 200
            },
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            llm_response = result["choices"][0]["message"]["content"].strip()
            ctx.logger.info(f"🤖 LLM raw response: {llm_response}")
            
            try:
                # Parse the JSON response from LLM
                reminder_data = json.loads(llm_response)
                ctx.logger.info(f"📋 Parsed reminder data: {reminder_data}")
                
                # Validate the response has required fields
                if "medicine" in reminder_data and "time" in reminder_data:
                    ctx.logger.info(f"✅ Successfully extracted reminder: {reminder_data}")
                    return {
                        "medicine": reminder_data["medicine"],
                        "time": reminder_data["time"],
                        "original_text": text
                    }
                else:
                    ctx.logger.warning(f"❌ LLM response missing required fields. Expected: medicine, time. Got: {list(reminder_data.keys())}")
                    
            except json.JSONDecodeError as e:
                ctx.logger.warning(f"❌ LLM response not valid JSON: {llm_response}. Error: {e}")
                
        else:
            ctx.logger.warning(f"ASI1 API error: {response.status_code}")
            
    except Exception as e:
        ctx.logger.error(f"❌ Error in LLM reminder extraction: {str(e)}")
    
    # Fallback to simple regex extraction if LLM fails
    ctx.logger.warning(f"🔄 LLM extraction failed, using regex fallback for: '{text}'")
    
    # Simple regex patterns for common medication reminders
    text_lower = text.lower()
    
    # Extract medicine name
    medicine = "medication"
    medicine_patterns = [
        r"take\s+([a-zA-Z][a-zA-Z\s]+?)(?:\s+(?:at|after|before|with|during))",
        r"remind.*?(?:take|about)\s+([a-zA-Z][a-zA-Z\s]+?)(?:\s+(?:at|after|before|with|during))",
        r"([a-zA-Z][a-zA-Z\s]+?)(?:\s+(?:reminder|after|before|at))"
    ]
    
    for pattern in medicine_patterns:
        match = re.search(pattern, text_lower)
        if match:
            medicine = match.group(1).strip()
            break
    
    # Extract time
    time_str = "as needed"
    if "after eating" in text_lower or "after food" in text_lower:
        time_str = "after eating"
    elif "before eating" in text_lower or "before food" in text_lower:
        time_str = "before eating"
    elif "with breakfast" in text_lower:
        time_str = "with breakfast"
    elif "with lunch" in text_lower:
        time_str = "with lunch"
    elif "with dinner" in text_lower:
        time_str = "with dinner"
    elif "before bed" in text_lower or "bedtime" in text_lower:
        time_str = "before bed"
    elif "morning" in text_lower:
        time_str = "in the morning"
    elif "evening" in text_lower:
        time_str = "in the evening"
    elif re.search(r'\d{1,2}(?::\d{2})?\s*(?:am|pm)', text_lower):
        time_match = re.search(r'(\d{1,2}(?::\d{2})?\s*(?:am|pm))', text_lower, re.IGNORECASE)
        if time_match:
            time_str = time_match.group(1)
    
    ctx.logger.info(f"📋 Regex extracted - medicine: '{medicine}', time: '{time_str}'")
    return {
        "medicine": medicine,
        "time": time_str,
        "original_text": text
    }


async def classify_confirmation_with_llm(message: str, ctx: Context) -> str:
    """Use LLM to classify user confirmation responses"""
    try:
        prompt = f"""Analyze this user response and determine if it's a confirmation (yes/no): "{message}"

Respond with exactly one of these:
- "yes" - User is confirming, agreeing, or saying yes (examples: "yes", "yeah", "sure", "ok", "book it", "go ahead", "sounds good")
- "no" - User is declining, disagreeing, or saying no (examples: "no", "nope", "cancel", "not now", "maybe later", "I changed my mind")
- "unclear" - Response is ambiguous or unclear

Respond with only the classification word, nothing else."""

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json={
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 50
            },
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            llm_response = result["choices"][0]["message"]["content"].strip().lower()
            
            if llm_response in ["yes", "no", "unclear"]:
                ctx.logger.info(f"LLM classified confirmation '{message}' as: {llm_response}")
                return llm_response
            
        else:
            ctx.logger.warning(f"ASI1 API error for confirmation: {response.status_code}")
            
    except Exception as e:
        ctx.logger.error(f"Error in LLM confirmation classification: {str(e)}")
    
    # Fallback to unclear if LLM fails
    return "unclear"

async def extract_appointment_timing_with_llm(message: str, ctx: Context) -> dict:
    """Use LLM to extract appointment timing and urgency information"""
    try:
        prompt = f"""Analyze this appointment request and extract timing information: "{message}"

Respond with a JSON object containing:
- "preferred_time": The preferred appointment time (e.g., "today", "tomorrow", "next week", "next available", "morning", "afternoon")
- "urgency": The urgency level - either "urgent", "normal", or "low"

Examples:
- "I need to see a doctor ASAP" → {{"preferred_time": "today", "urgency": "urgent"}}
- "Book me an appointment for tomorrow morning" → {{"preferred_time": "tomorrow morning", "urgency": "normal"}}
- "I'd like to schedule something for next week" → {{"preferred_time": "next week", "urgency": "normal"}}
- "Emergency appointment needed right now" → {{"preferred_time": "today", "urgency": "urgent"}}
- "When is the next available slot?" → {{"preferred_time": "next available", "urgency": "normal"}}

Respond only with valid JSON, no additional text."""

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json={
                "model": "asi1-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 150
            },
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            llm_response = result["choices"][0]["message"]["content"].strip()
            
            try:
                timing_data = json.loads(llm_response)
                if "preferred_time" in timing_data and "urgency" in timing_data:
                    ctx.logger.info(f"LLM extracted timing: {timing_data}")
                    return timing_data
            except json.JSONDecodeError:
                ctx.logger.warning(f"LLM timing response not valid JSON: {llm_response}")
                
        else:
            ctx.logger.warning(f"ASI1 API error for timing: {response.status_code}")
            
    except Exception as e:
        ctx.logger.error(f"Error in LLM timing extraction: {str(e)}")
    
    # Fallback to defaults if LLM fails
    return {"preferred_time": "next available", "urgency": "normal"}

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
8. "wellness_delete" - Deleting, removing, or clearing wellness/health data from logs
9. "cancel" - Cancelling appointments, orders, bookings, or other healthcare services
10. "image_analysis" - User has uploaded an image and is asking for analysis, feedback, or information about it.
11. "general" - Greetings, general questions, anything not healthcare-related

IMPORTANT: Respond with ONLY the intent name, nothing else.

Examples:
- "I have a headache and fever" → symptom_logging
- "I walked 5000 steps today" → wellness
- "I slept 8 hours and drank 6 glasses of water" → wellness
- "Do you have aspirin?" → pharmacy
- "Book me a cardiologist" → book_doctor
- "What disease might I have?" → health_analysis
- "Remind me to take pills at 8PM" → medication_reminder
- "Emergency! Chest pain!" → emergency
- "Delete my wellness data for today" → wellness_delete
- "Clear my steps from today" → wellness_delete
- "I want to delete my workout data" → wellness_delete
- "Erase my health logs for Monday" → wellness_delete
- "Cancel my appointment APT-123" → cancel
- "Cancel order ORD-456" → cancel
- "Analyze this picture of my rash" → image_analysis
- "What do you think of this meal?" → image_analysis
- "Hello, how are you?" → general
- "How's the weather?" → general"""

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
                           "book_doctor", "pharmacy", "medication_reminder", "wellness", "wellness_delete", "cancel", "image_analysis", "general"]

            if intent in valid_intents:
                ctx.logger.info(f"LLM classified '{message}' as: {intent}")
                return intent
            else:
                ctx.logger.warning(f"LLM returned invalid intent: {intent}, returning general")
                return "general"
        else:
            ctx.logger.warning(f"ASI1 API error: {response.status_code}, returning general")
            return "general"

    except Exception as e:
        ctx.logger.error(f"LLM intent classification failed: {str(e)}, returning general")
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

async def handle_image_analysis(message: str, file_data: FileData, ctx: Context, sender: str = "default_user") -> str:
    """Handle image analysis requests by asking the user for their preferred analysis type."""
    try:
        ctx.logger.info(f"Analyzing image '{file_data.file_name}' with ASI1 Vision...")
        
        # Call the multimodal analysis function to get the data
        asi1_result = await analyze_with_asi1(message, "image_analysis", image_data=file_data)
        
        if not asi1_result.get("success"):
            return f"Sorry, I encountered an error analyzing the image: {asi1_result.get('error', 'Unknown error')}"

        analysis = asi1_result.get("analysis", {})
        
        # Store the analysis in the user's context and ask for their preference
        set_user_context(sender, {
            "awaiting_analysis_confirmation": True,
            "last_image_analysis": analysis,
        })
        
        return "I have analyzed the image. Would you like a **Full Analysis** (including all extracted data) or a **Regular Analysis** (summary and recommendation only)?"

    except Exception as e:
        ctx.logger.error(f"Error in image analysis handler: {str(e)}")
        return "Sorry, I encountered an unexpected error while analyzing the image."


async def handle_symptom_logging(symptoms_text: str, ctx: Context, sender: str = "default_user") -> str:
    """Handle symptom logging and analysis"""
    try:
        # Store symptoms to ICP canister
        symptom_data = {
            "symptoms": symptoms_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": sender
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

async def handle_medication_reminder(reminder_text: str, ctx: Context, sender: str = "default_user") -> str:
    """Handle medication reminder setup"""
    try:
        reminder_info = await extract_reminder_info_with_llm(reminder_text, ctx)

        reminder_data = {
            "medicine": reminder_info["medicine"],
            "time": reminder_info["time"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_id": sender,
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

async def handle_emergency(ctx: Context, sender: str = "default_user") -> str:
    """Handle emergency situations"""
    global emergency_status
    try:
        emergency_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": sender,
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
        icp_result = await get_from_icp("get-symptom-history", {"user_id": sender})

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

async def extract_cancellation_intent_with_llm(message: str, ctx: Context) -> dict:
    """Use ASI1 LLM to intelligently extract cancellation information from natural language"""
    try:
        system_prompt = """You are a healthcare AI assistant that helps users cancel appointments and orders. Analyze the user's message and extract cancellation information.

Extract the following information:
1. What they want to cancel (appointment/order)
2. Any specific ID mentioned
3. If no ID is provided, determine if they want to cancel their most recent item or need help finding the right one
4. The urgency or reason for cancellation (optional)

Respond in JSON format with:
{
  "cancel_type": "appointment" or "order" or "unknown",
  "specific_id": "extracted ID" or null,
  "intent": "cancel_specific" or "cancel_recent" or "need_help",
  "description": "brief description of what they want to cancel",
  "reason": "reason for cancellation if mentioned" or null
}

Examples:
- "Cancel my doctor appointment APT-123" → {"cancel_type": "appointment", "specific_id": "APT-123", "intent": "cancel_specific", "description": "doctor appointment", "reason": null}
- "I need to cancel my latest medicine order" → {"cancel_type": "order", "specific_id": null, "intent": "cancel_recent", "description": "latest medicine order", "reason": null}
- "Cancel my appointment, something came up" → {"cancel_type": "appointment", "specific_id": null, "intent": "cancel_recent", "description": "appointment", "reason": "something came up"}
- "How do I cancel my booking?" → {"cancel_type": "appointment", "specific_id": null, "intent": "need_help", "description": "booking", "reason": null}"""

        user_prompt = f"User message: \"{message}\""

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
                cancellation_info = json.loads(content)
                ctx.logger.info(f"LLM extracted cancellation info: {cancellation_info}")
                return cancellation_info
            except json.JSONDecodeError:
                ctx.logger.warning("LLM returned invalid JSON for cancellation extraction")
                return {"cancel_type": "unknown", "specific_id": None, "intent": "need_help", "description": "request", "reason": None}
        else:
            ctx.logger.warning(f"ASI1 API error in cancellation extraction: {response.status_code}")
            return {"cancel_type": "unknown", "specific_id": None, "intent": "need_help", "description": "request", "reason": None}

    except Exception as e:
        ctx.logger.error(f"LLM cancellation extraction failed: {str(e)}")
        return {"cancel_type": "unknown", "specific_id": None, "intent": "need_help", "description": "request", "reason": None}

async def get_user_recent_items(cancel_type: str, user_id: str, ctx: Context) -> list:
    """Get user's recent appointments or orders for selection"""
    try:
        if cancel_type == "appointment":
            # Get user appointments from ICP backend
            result = await get_from_icp("get-user-appointments", {"user_id": user_id})
            if "error" not in result and "appointments" in result:
                # Return the most recent confirmed appointments
                appointments = [apt for apt in result["appointments"] if apt.get("status") == "confirmed"]
                return sorted(appointments, key=lambda x: x.get("created_at", ""), reverse=True)[:3]
        else:
            # Get user medicine orders from ICP backend
            result = await get_from_icp("get-user-medicine-orders", {"user_id": user_id})
            if "error" not in result and isinstance(result, list):
                # Return the most recent confirmed orders
                orders = [order for order in result if order.get("status") == "confirmed"]
                return sorted(orders, key=lambda x: x.get("order_date", ""), reverse=True)[:3]
        
        return []
    except Exception as e:
        ctx.logger.error(f"Error getting user recent items: {str(e)}")
        return []

async def generate_natural_cancel_response(cancellation_info: dict, cancel_result: dict, ctx: Context) -> str:
    """Use ASI1 LLM to generate natural language cancellation responses"""
    try:
        if cancel_result.get("success"):
            system_prompt = """You are HealthAgent, a friendly and cheerful AI assistant. A user has successfully cancelled something. Create a helpful and reassuring response that confirms the cancellation.

- Be friendly, professional, and empathetic.
- Use emojis to convey a helpful tone.
- Include the key details of the cancellation.
- If appropriate, offer next steps, like rescheduling."""
        else:
            system_prompt = """You are HealthAgent, a friendly and cheerful AI assistant. A user's attempt to cancel something has failed. Create a helpful and empathetic response that explains the problem clearly and offers a solution.

- Be understanding and reassuring.
- Clearly state the reason for the failure.
- Provide clear guidance on what to do next (e.g., try again, contact support).
- Use emojis to convey a helpful and supportive tone."""

        context = {
            "success": cancel_result.get("success", False),
            "message": cancel_result.get("message", ""),
            "cancelled_id": cancel_result.get("cancelled_id"),
            "cancel_type": cancellation_info.get("cancel_type"),
            "reason": cancellation_info.get("reason"),
            "description": cancellation_info.get("description")
        }

        user_prompt = f"Generate a natural response for this cancellation result: {json.dumps(context)}"

        payload = {
            "model": "asi1-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            natural_response = result["choices"][0]["message"]["content"].strip()
            
            # Add technical details for successful cancellations
            if cancel_result.get("success"):
                natural_response += f"\n\n📋 **Details:**\n"
                if cancel_result.get("cancelled_id"):
                    natural_response += f"• ID: {cancel_result.get('cancelled_id')}\n"
                natural_response += f"• Status: {cancel_result.get('message', 'Cancelled')}\n"
                natural_response += f"• Storage: Recorded on ICP blockchain"
            
            return natural_response
        else:
            # Fallback to structured response
            if cancel_result.get("success"):
                return f"✅ Your {cancellation_info.get('cancel_type', 'item')} has been cancelled successfully!\n\n📋 **Details:**\n• ID: {cancel_result.get('cancelled_id')}\n• Storage: Recorded on ICP blockchain"
            else:
                return f"❌ I wasn't able to cancel your {cancellation_info.get('cancel_type', 'item')}.\n\n**Issue:** {cancel_result.get('message', 'Unknown error')}\n\nPlease try again or contact support if you need assistance."

    except Exception as e:
        ctx.logger.error(f"Error generating natural cancel response: {str(e)}")
        # Fallback to basic response
        if cancel_result.get("success"):
            return f"✅ Your {cancellation_info.get('cancel_type', 'item')} has been cancelled successfully!"
        else:
            return f"❌ Unable to cancel your {cancellation_info.get('cancel_type', 'item')}: {cancel_result.get('message', 'Unknown error')}"

async def handle_cancel_request(message: str, ctx: Context, sender: str = None) -> str:
    """Handle cancellation requests using ASI1 LLM for natural language understanding"""
    try:
        ctx.logger.info(f"Processing natural language cancel request: '{message}'")
        
        # Use LLM to extract cancellation intent and information
        cancellation_info = await extract_cancellation_intent_with_llm(message, ctx)
        cancel_type = cancellation_info.get("cancel_type")
        specific_id = cancellation_info.get("specific_id")
        intent = cancellation_info.get("intent")
        
        if cancel_type == "unknown":
            return "I'd be happy to help you cancel something! Could you please specify what you'd like to cancel? For example:\n\n• 'Cancel my doctor appointment'\n• 'Cancel my medicine order'\n• 'I need to cancel my latest booking'"
        
        # Handle different cancellation intents
        if intent == "need_help":
            if cancel_type == "appointment":
                return "I can help you cancel your appointment! Do you have the appointment ID (like APT-123ABC), or would you like me to show you your recent appointments so you can choose which one to cancel?"
            else:
                return "I can help you cancel your medicine order! Do you have the order ID (like ORD-123456), or would you like me to show you your recent orders so you can choose which one to cancel?"
        
        elif intent == "cancel_recent":
            # Get user's recent items to find the most recent one
            recent_items = await get_user_recent_items(cancel_type, sender, ctx)
            
            if not recent_items:
                return f"I don't see any recent {cancel_type}s that can be cancelled. You may not have any confirmed {cancel_type}s, or they may have already been processed."
            
            # Auto-cancel the most recent item
            most_recent = recent_items[0]
            if cancel_type == "appointment":
                item_id = most_recent.get("appointment_id")
                endpoint = "cancel-appointment"
                request_data = {"appointment_id": item_id, "user_id": sender}
            else:
                item_id = most_recent.get("order_id")
                endpoint = "cancel-medicine-order"
                request_data = {"order_id": item_id, "user_id": sender}
            
            cancellation_info["specific_id"] = item_id
            
        elif intent == "cancel_specific" and specific_id:
            # Use the specific ID provided
            item_id = specific_id
            if cancel_type == "appointment":
                endpoint = "cancel-appointment"
                request_data = {"appointment_id": item_id, "user_id": sender}
            else:
                endpoint = "cancel-medicine-order"
                request_data = {"order_id": item_id, "user_id": sender}
                
        else:
            # Need more information
            return f"I understand you want to cancel your {cancel_type}. Could you provide the ID, or say 'cancel my latest {cancel_type}' to cancel the most recent one?"
        
        # Validate that we have the required variables set
        if 'item_id' not in locals() or 'endpoint' not in locals() or 'request_data' not in locals():
            return f"I need the {cancel_type} ID to cancel it. Could you provide it? For example: 'cancel {cancel_type} APT-123ABC'"
        
        # Make the cancellation request
        cancel_result = await store_to_icp(endpoint, request_data)
        
        # Generate natural language response
        return await generate_natural_cancel_response(cancellation_info, cancel_result, ctx)
        
    except Exception as e:
        ctx.logger.error(f"Error handling natural cancel request: {str(e)}")
        return "I apologize, but I encountered an issue processing your cancellation request. Please try again, or if you continue to have problems, please contact support for assistance."

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

        # Extract timing and urgency using LLM for better understanding
        timing_info = await extract_appointment_timing_with_llm(message, ctx)
        preferred_time = timing_info.get("preferred_time", "next available")
        urgency = timing_info.get("urgency", "normal")

        # Use the full message as symptom context for better doctor matching
        symptoms = message

        request_id = str(uuid4())[:8]
        ctx.logger.info(f"🏥 Creating doctor booking request with user_id: '{user_sender}'")
        booking_request = DoctorBookingRequest(
            request_id=request_id,
            specialty=specialty,
            preferred_time=preferred_time,
            urgency=urgency,
            symptoms=symptoms,
            user_id=user_sender
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
    """Route medicine purchase to PharmacyAgent using unified request like doctor booking"""
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

        # Use LLM-extracted request type to determine if this is an order
        is_order_request = request_type == "order"

        ctx.logger.info(f"Medicine: {medicine_name}, Type: {request_type}, Quantity: {quantity}, Is Order: {is_order_request}")

        try:
            # Use unified medicine purchase request (like doctor booking)
            ctx.logger.info(f"Processing unified medicine {'purchase' if is_order_request else 'check'} for: {medicine_name} (qty: {quantity})")
            request_id = str(uuid4())[:8]
            medicine_request = MedicinePurchaseRequest(
                request_id=request_id,
                medicine_name=medicine_name,
                quantity=quantity,
                user_id=user_sender,
                auto_order=is_order_request  # Auto-order only if user wants to buy
            )

            # Track pending request
            pending_requests[request_id] = {
                "type": "pharmacy_purchase",
                "medicine": medicine_name,
                "timestamp": datetime.now(),
                "user_sender": user_sender,
                "is_order_request": is_order_request,
                "quantity": quantity
            }
            if user_sender:
                user_request_mapping[request_id] = user_sender

            ctx.logger.info(f"Successfully created MedicinePurchaseRequest: {type(medicine_request)}")

        except Exception as e:
            ctx.logger.error(f"Failed to create MedicinePurchaseRequest: {str(e)}")
            raise

        # Send request to PharmacyAgent if available
        if PHARMACY_AGENT_ADDRESS:
            try:
                ctx.logger.info(f"Sending unified medicine purchase request to PharmacyAgent")

                await ctx.send(PHARMACY_AGENT_ADDRESS, medicine_request)
                ctx.logger.info(f"Medicine purchase request sent (ID: {request_id})")

                # Create detailed immediate response showing what was requested
                response = f"**Medicine {'purchase' if is_order_request else 'availability check'} request submitted!**\n\n"
                response += f"**Request Details:**\n"
                response += f"• Medicine: {medicine_name}\n"
                response += f"• Quantity: {quantity}\n"
                response += f"• Action: {'Auto-purchase if available' if is_order_request else 'Check availability only'}\n"
                response += f"\n**Request ID:** {request_id}"
                response += f"\n**Status:** Processing with pharmacy agent..."
                response += f"\n**Storage:** Request saved to ICP blockchain"

                return response

            except Exception as e:
                ctx.logger.error(f"Error communicating with PharmacyAgent: {str(e)}")
                return "Sorry, there was an error connecting to the pharmacy service. Please try again."
        else:
            ctx.logger.error("PHARMACY_AGENT_ADDRESS not configured")
            return "Sorry, the pharmacy service is not properly configured. Please contact support."

    except Exception as e:
        ctx.logger.error(f"Error routing to pharmacy agent: {str(e)}")
        return "Sorry, I couldn't process your medicine request right now. Please try again later."

async def route_to_wellness_delete(message: str, ctx: Context, user_sender: str = None) -> str:
    """Route wellness delete request to WellnessAgent"""
    try:
        # Parse delete data from natural language message
        delete_data = parse_delete_message(message)

        request_id = str(uuid4())[:8]
        delete_request = DeleteRequest(
            request_id=request_id,
            date=delete_data.get("date"),
            user_id=user_sender
        )

        # Track pending request
        pending_requests[request_id] = {
            "type": "wellness_delete",
            "timestamp": datetime.now().isoformat(),
            "user_sender": user_sender
        }

        # Find and route to wellness agent
        wellness_agent_address = os.getenv("WELLNESS_AGENT_ADDRESS")
        if wellness_agent_address:
            ctx.logger.info(f"Routing delete request {request_id} to wellness agent for date: {delete_data.get('date')}")
            await ctx.send(wellness_agent_address, delete_request)
            
            return "⏳ Processing your wellness data deletion request..."
        else:
            ctx.logger.error("WELLNESS_AGENT_ADDRESS not configured")
            return "Sorry, the wellness service is not properly configured. Please contact support."

    except Exception as e:
        ctx.logger.error(f"Error routing to wellness delete: {str(e)}")
        return "Sorry, I couldn't process your delete request right now. Please try again later."

async def route_to_wellness_agent(message: str, ctx: Context, user_sender: str = None) -> str:
    """Route wellness logging to WellnessAgent using event-driven architecture"""
    try:
        # Parse wellness data from natural language message
        wellness_data = parse_wellness_message(message)

        request_id = str(uuid4())[:8]
        wellness_request = LogRequest(
            request_id=request_id,
            date=wellness_data.get("date"),
            sleep=wellness_data.get("sleep"),
            steps=wellness_data.get("steps"),
            exercise=wellness_data.get("exercise"),
            mood=wellness_data.get("mood"),
            water_intake=wellness_data.get("water_intake"),
            user_id=user_sender
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
                    log_date = wellness_data.get("date", datetime.now().strftime('%Y-%m-%d'))
                    formatted_date = datetime.strptime(log_date, '%Y-%m-%d').strftime('%B %d, %Y')
                    
                    response = f"**Wellness data logged successfully!**\n\n**Date:** {formatted_date}\n\n**What was recorded:**\n" + "\n".join([f"• {item}" for item in logged_items])
                    response += f"\n\n **Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                    response += f"\n **Storage:** Securely saved to ICP blockchain"
                    return response
                else:
                    log_date = wellness_data.get("date", datetime.now().strftime('%Y-%m-%d'))
                    formatted_date = datetime.strptime(log_date, '%Y-%m-%d').strftime('%B %d, %Y')
                    return f"**Wellness data logged for {formatted_date}:** {message}\n\n **Storage:** Securely saved to ICP blockchain"

            except Exception as e:
                ctx.logger.error(f" Error communicating with WellnessAgent: {str(e)}")
                return "Sorry, there was an error connecting to the wellness service. Please try again."
        else:
            ctx.logger.error(" WELLNESS_AGENT_ADDRESS not configured")
            return "Sorry, the wellness service is not properly configured. Please contact support."

    except Exception as e:
        ctx.logger.error(f"Error routing to wellness agent: {str(e)}")
        return "Sorry, I couldn't log your wellness data right now. Please try again later."

def parse_delete_message(message: str) -> dict:
    """Parse delete request from natural language message"""
    import re
    from datetime import datetime, timedelta
    
    message_lower = message.lower()
    delete_data = {}
    
    # Always use today's date only - no previous day deletion allowed
    today = datetime.now()
    delete_data["date"] = today.strftime('%Y-%m-%d')
    
    return delete_data

def parse_wellness_message(message: str) -> dict:
    """Parse wellness data from natural language message"""
    import re
    from datetime import datetime, timedelta

    message_lower = message.lower()
    wellness_data = {}

    # Always use today's date only - no previous day logging allowed
    today = datetime.now()
    wellness_data["date"] = today.strftime('%Y-%m-%d')

    # Parse sleep data - more flexible patterns
    sleep_patterns = [
        r'(?:sleep|slept)\s+([0-9\.]+)\s*(?:hours?|hrs?)',  # "sleep 8 hours"
        r'([0-9\.]+)\s*(?:hours?|hrs?).*?(?:sleep|slept)',  # "8 hours sleep"
        r'(?:sleep|slept).*?([0-9\.]+)\s*(?:hours?|hrs?)',  # "sleep for 8 hours"
        r'(?:got|had)\s+([0-9\.]+)\s*(?:hours?|hrs?).*?(?:sleep|rest)',  # "got 8 hours sleep"
        r'([0-9\.]+)\s*(?:h|hrs?)\s*(?:sleep|rest)',  # "8h sleep"
        r'slept.*?([0-9\.]+)',  # "slept 8"
    ]
    
    for pattern in sleep_patterns:
        sleep_match = re.search(pattern, message_lower)
        if sleep_match:
            try:
                sleep_hours = float(sleep_match.group(1))
                if 0 <= sleep_hours <= 24:  # Reasonable range
                    wellness_data["sleep"] = sleep_hours
                    break
            except ValueError:
                continue

    # Parse steps data - more flexible patterns
    steps_patterns = [
        r'([0-9,]+)\s*(?:steps?)',  # "10000 steps"
        r'(?:walked|walk|took).*?([0-9,]+)\s*(?:steps?)',  # "walked 10000 steps"
        r'(?:steps?).*?([0-9,]+)',  # "steps 10000"
        r'(?:did|took|walked)\s+([0-9,]+)',  # "did 10000"
        r'([0-9,]+)\s*(?:step)',  # "10000 step"
    ]
    
    for pattern in steps_patterns:
        steps_match = re.search(pattern, message_lower)
        if steps_match:
            try:
                steps_count = int(steps_match.group(1).replace(',', ''))
                if 0 <= steps_count <= 100000:  # Reasonable range
                    wellness_data["steps"] = steps_count
                    break
            except ValueError:
                continue

    # Parse water intake - more specific patterns to avoid conflicts
    water_patterns = [
        r'([0-9\.]+)\s*(?:cups?|glasses?|liters?|l)\s*(?:of\s+)?(?:water|fluid)',  # "8 cups of water"
        r'\b(?:drank|drink|consumed)\s+([0-9\.]+)\s*(?:cups?|glasses?|liters?|l)\s*(?:of\s+)?(?:water|fluid)?',  # "drank 8 glasses of water"
        r'\b(?:had|got)\s+([0-9\.]+)\s*(?:cups?|glasses?|liters?|l)\s*(?:of\s+)?(?:water|fluid)',  # "had 8 cups of water"
        r'([0-9\.]+)\s*(?:cups?|glasses?)\s*(?:of\s+)?water',  # "8 glasses water"
        r'water.*?([0-9\.]+)\s*(?:cups?|glasses?|liters?|l)',  # "water 8 cups"
    ]
    
    for pattern in water_patterns:
        water_match = re.search(pattern, message_lower)
        if water_match:
            try:
                water_amount = float(water_match.group(1))
                if 0 <= water_amount <= 50:  # Reasonable range
                    wellness_data["water_intake"] = water_amount
                    break
            except ValueError:
                continue

    # Parse mood - more flexible patterns
    mood_patterns = [
        r'feeling\s+([a-zA-Z]+)',  # "feeling good"
        r'mood.*?([a-zA-Z]+)',  # "mood is good"
        r'(?:i am|im)\s+([a-zA-Z]+)',  # "I am happy"
        r'(?:i feel|feel)\s+([a-zA-Z]+)',  # "I feel tired"
    ]
    
    allowed_moods = ['excellent', 'good', 'okay', 'tired', 'stressed', 'sad', 'happy', 'great', 'fine', 'bad', 'awful']
    
    for pattern in mood_patterns:
        mood_match = re.search(pattern, message_lower)
        if mood_match:
            mood = mood_match.group(1).lower()
            if mood in allowed_moods:
                wellness_data["mood"] = mood.capitalize()
                break

    # Parse exercise - more flexible patterns
    exercise_patterns = [
        r'exercise:\s+(.*)',  # "exercise: running"
        r'(?:did|had|went)\s+(.*?)(?:workout|exercise)',  # "did cardio workout"
        r'(?:workout|exercise).*?(?:was|is)\s+(.*?)(?:\.|$)',  # "workout was running"
        r'\b(?:ran|running|walked|walking|swimming|cycling|gym|lifting|jogging|hiking|yoga)\b.*',  # Activity verbs with word boundaries
        r'(?:workout|exercise):\s+(.*)',  # "workout: cardio"
    ]
    
    for pattern in exercise_patterns:
        exercise_match = re.search(pattern, message, re.IGNORECASE)
        if exercise_match:
            if pattern == r'\b(?:ran|running|walked|walking|swimming|cycling|gym|lifting|jogging|hiking|yoga)\b.*':
                # For activity verbs, capture the whole match
                exercise = exercise_match.group(0).strip()
            else:
                exercise = exercise_match.group(1).strip().rstrip('.')
            
            if len(exercise) > 0 and len(exercise) <= 100:  # Reasonable length
                wellness_data["exercise"] = exercise
                break

    return wellness_data


async def generate_wellness_insights_with_llm(wellness_logs: List[Dict], ctx: Context) -> str:
    """Generate AI-powered wellness insights from user's wellness logs using ASI1 LLM"""
    try:
        # Prepare wellness data summary for the LLM
        if not wellness_logs:
            return "No wellness data available for insights generation."
        
        # Debug: Log the raw data structure
        if ctx:
            ctx.logger.info(f"🔍 Raw wellness logs structure: {wellness_logs[:2]}")  # Show first 2 logs
        
        # Helper function to normalize ICP wellness log data 
        def normalize_icp_log(log):
            """Convert ICP numeric-key format to standard field names"""
            # Based on the actual data structure observed:
            # "1_113_806_382": date, "1_152_427_284": water_intake, "1_214_307_575": mood, 
            # "1_450_210_392": exercise, "1_869_947_023": user_id, "2_126_822_679": sleep, "2_215_541_671": steps
            
            normalized = {}
            
            # Handle standard field names first (in case format changes)
            if any(key in ['user_id', 'date', 'sleep', 'steps', 'exercise', 'mood', 'water_intake'] for key in log.keys()):
                for key, value in log.items():
                    if key in ['user_id', 'date', 'sleep', 'steps', 'exercise', 'mood', 'water_intake']:
                        normalized[key] = value
                return normalized
            
            # Handle ICP numeric key format - map by exact key based on _WellnessLogKeys order
            # _WellnessLogKeys = ["user_id", "date", "sleep", "steps", "exercise", "mood", "water_intake"]
            key_mapping = {
                "1_869_947_023": "user_id",        # field 0: user_id
                "1_113_806_382": "date",           # field 1: date
                "2_126_822_679": "sleep",          # field 2: sleep
                "2_215_541_671": "steps",          # field 3: steps
                "1_450_210_392": "exercise",       # field 4: exercise
                "1_214_307_575": "mood",           # field 5: mood
                "1_152_427_284": "water_intake"    # field 6: water_intake
            }
            
            for key, value in log.items():
                if key in key_mapping:
                    field_name = key_mapping[key]
                    if value is not None:  # Only set non-null values
                        normalized[field_name] = value
                        
            return normalized
        
        # Extract key metrics from logs with proper ICP format handling
        sleep_data = []
        steps_data = []
        water_data = []
        moods = []
        exercises = []
        
        for log in wellness_logs:
            normalized_log = normalize_icp_log(log)
            if ctx:
                ctx.logger.info(f"🔍 Normalized log: {normalized_log}")
            
            # Extract sleep data
            sleep_val = normalized_log.get('sleep', 0)
            if isinstance(sleep_val, (int, float)) and sleep_val > 0:
                sleep_data.append(sleep_val)
                
            # Extract steps data
            steps_val = normalized_log.get('steps', 0)
            if isinstance(steps_val, (int, float)) and steps_val > 0:
                steps_data.append(steps_val)
                
            # Extract water data
            water_val = normalized_log.get('water_intake', 0)
            if isinstance(water_val, (int, float)) and water_val > 0:
                water_data.append(water_val)
                
            # Extract mood data
            mood_val = normalized_log.get('mood')
            if mood_val and str(mood_val).strip() and str(mood_val) != 'None':
                moods.append(str(mood_val))
                
            # Extract exercise data
            exercise_val = normalized_log.get('exercise')
            if exercise_val and str(exercise_val).strip() and str(exercise_val) not in ['None', 'Not logged']:
                exercises.append(str(exercise_val))
        
        # Debug: Log extracted data
        if ctx:
            ctx.logger.info(f"🔍 Extracted data - Sleep: {sleep_data}, Steps: {steps_data}, Water: {water_data}, Moods: {moods}")
        
        # Calculate basic statistics
        avg_sleep = sum(sleep_data) / len(sleep_data) if sleep_data else 0
        total_steps = sum(steps_data)
        avg_water = sum(water_data) / len(water_data) if water_data else 0
        exercise_days = len(exercises)
        
        # Calculate actual days with any data
        days_with_data = len(set([log.get('date', '') for log in wellness_logs if any([
            log.get('sleep', 0) > 0,
            log.get('steps', 0) > 0, 
            log.get('water_intake', 0) > 0,
            log.get('mood'),
            log.get('exercise') and log.get('exercise') != 'Not logged'
        ])]))
        
        # Get unique dates from normalized logs to count actual calendar days
        normalized_logs = [normalize_icp_log(log) for log in wellness_logs]
        unique_dates = set([log.get('date', '') for log in normalized_logs if log.get('date')])
        actual_calendar_days = len(unique_dates)
        
        # Prepare context for LLM
        wellness_summary = f"""
        Wellness Data Summary:
        - Log entries analyzed: {len(wellness_logs)}
        - Actual calendar days covered: {actual_calendar_days} 
        - Days with meaningful data: {days_with_data}
        
        Sleep:
        - Average: {avg_sleep:.1f} hours per night
        - Data points: {len(sleep_data)} days with sleep recorded
        - Range: {min(sleep_data) if sleep_data else 0:.1f}h - {max(sleep_data) if sleep_data else 0:.1f}h
        
        Physical Activity:
        - Total steps: {total_steps:,}
        - Average daily steps: {total_steps/actual_calendar_days if actual_calendar_days > 0 else 0:,.0f}
        - Exercise sessions: {exercise_days} out of {actual_calendar_days} days
        - Activities: {', '.join(set(exercises[:5]))}
        
        Hydration:
        - Average water intake: {avg_water:.1f} glasses/cups per day
        - Data points: {len(water_data)} days with water recorded
        
        Mood Patterns:
        - Recorded moods: {', '.join(set(moods))}
        - Most common: {max(set(moods), key=moods.count) if moods else 'No data'}
        - Mood tracking: {len(moods)} out of {actual_calendar_days} days
        """
        
        payload = {
            "model": "asi1-mini",
            "messages": [
                {
                    "role": "system",
                    "content": """You are HealthAgent, a friendly and cheerful AI wellness coach. Your goal is to provide clear, helpful, and encouraging insights based on the user's data. Always use a positive and empathetic tone. Use emojis to make your responses more engaging and break down complex information into bullet points.
                    
                    Your response should contain:
                    • A brief, encouraging assessment (1 sentence).
                    • 2-3 key insights from the data (1 line each, use emojis).
                    • 2-3 actionable and specific recommendations (1 line each, use emojis).
                    
                    Keep the total response under 300 words."""
                },
                {
                    "role": "user",
                    "content": f"Please analyze this wellness data and provide personalized insights and recommendations:\n\n{wellness_summary}"
                }
            ],
            "temperature": 0.7,
            "max_tokens": 800
        }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=15
        )

        if response.status_code == 200:
            result = response.json()
            insights = result["choices"][0]["message"]["content"]
            ctx.logger.info(f"✨ Generated wellness insights with ASI1 LLM")
            return insights.strip()
        else:
            ctx.logger.warning(f"ASI1 API error for insights: {response.status_code} - {response.text}")
            # Provide a basic fallback analysis based on the data
            return generate_fallback_insights(wellness_logs)

    except Exception as e:
        ctx.logger.error(f"Error generating wellness insights: {str(e)}")
        return generate_fallback_insights(wellness_logs) if 'wellness_logs' in locals() else "Unable to generate AI insights at the moment. Please try again later."


def generate_fallback_insights(wellness_logs: List[Dict]) -> str:
    """Generate basic wellness insights when ASI1 API is not available"""
    if not wellness_logs:
        return """Welcome to your wellness journey! 🌱

To get personalized insights, start logging your daily activities:
• Sleep hours (aim for 7-9 hours)
• Daily steps (target 8,000-10,000)
• Water intake (8 glasses recommended)
• Exercise activities
• Daily mood

Once you have some data, I'll provide personalized recommendations to help you achieve your health goals!"""

    # Extract basic statistics
    sleep_data = [log.get('sleep', 0) for log in wellness_logs if log.get('sleep', 0) > 0]
    steps_data = [log.get('steps', 0) for log in wellness_logs if log.get('steps', 0) > 0]
    water_data = [log.get('water_intake', 0) for log in wellness_logs if log.get('water_intake', 0) > 0]
    moods = [log.get('mood') for log in wellness_logs if log.get('mood')]
    exercises = [log.get('exercise') for log in wellness_logs if log.get('exercise') and log.get('exercise') != 'Not logged']
    
    insights = f"**Your Wellness Summary ({len(wellness_logs)} days tracked):**\n\n"
    
    # Sleep analysis
    if sleep_data:
        avg_sleep = sum(sleep_data) / len(sleep_data)
        if avg_sleep >= 7:
            insights += f"✅ **Sleep**: Great job! Averaging {avg_sleep:.1f}h per night.\n"
        else:
            insights += f"⚠️ **Sleep**: {avg_sleep:.1f}h average - try for 7-9 hours.\n"
    else:
        insights += "📊 **Sleep**: Start tracking your sleep patterns for better insights.\n"
    
    # Activity analysis
    if steps_data:
        avg_steps = sum(steps_data) / len(steps_data)
        if avg_steps >= 8000:
            insights += f"🚶 **Activity**: Excellent! {avg_steps:,.0f} steps daily average.\n"
        else:
            insights += f"🚶 **Activity**: {avg_steps:,.0f} steps daily - aim for 8,000+.\n"
    else:
        insights += "🚶 **Activity**: Track your daily steps to monitor activity levels.\n"
        
    # Hydration analysis
    if water_data:
        avg_water = sum(water_data) / len(water_data)
        if avg_water >= 8:
            insights += f"💧 **Hydration**: Perfect! {avg_water:.1f} glasses daily.\n"
        else:
            insights += f"💧 **Hydration**: {avg_water:.1f} glasses - try for 8 glasses daily.\n"
    else:
        insights += "💧 **Hydration**: Log your water intake for hydration tracking.\n"
        
    # Exercise analysis
    if exercises:
        insights += f"💪 **Exercise**: Active {len(exercises)} days - keep it up!\n"
    else:
        insights += "💪 **Exercise**: Add some physical activity for better health.\n"
        
    # Mood analysis
    if moods:
        mood_counts = {}
        for mood in moods:
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
        top_mood = max(mood_counts, key=mood_counts.get)
        insights += f"😊 **Mood**: Most common: {top_mood}. Keep tracking for patterns!\n"
    else:
        insights += "😊 **Mood**: Track your daily mood to understand patterns.\n"
        
    insights += "\n**Keep logging your wellness data for more detailed AI-powered insights!**"
    
    return insights


async def get_wellness_insights(user_id: str, days: int = 7, ctx: Context = None) -> Dict:
    """Get AI-powered wellness insights by fetching logs from ICP and analyzing them"""
    try:
        # Fetch wellness data from ICP backend using get_wellness_summary
        # Request more days to ensure we get enough data for date filtering
        url = f"{BASE_URL}/get-wellness-summary"
        
        payload = {
            "user_id": user_id,
            "days": days + 10  # Request extra days to ensure coverage
        }
        
        response = requests.post(url, headers=HEADERS, json=payload, timeout=10)
        
        if response.status_code == 200:
            if ctx:
                ctx.logger.info(f"🔍 Raw ICP response: {response.text[:500]}...")  # Log first 500 chars
            
            data = response.json()
            all_wellness_logs = data.get('logs', [])
            
            if ctx:
                ctx.logger.info(f"🔍 Parsed JSON data: {data}")
                ctx.logger.info(f"🔍 All wellness logs: {all_wellness_logs}")
            
            # For now, use all available logs to get insights working
            # TODO: Re-implement proper date filtering later
            wellness_logs = all_wellness_logs
            
            if ctx:
                ctx.logger.info(f"📊 Using {len(wellness_logs)} wellness logs for insights generation")
            
            if wellness_logs:
                # Generate insights using ASI1 LLM
                insights = await generate_wellness_insights_with_llm(wellness_logs, ctx)
                
                # Calculate date range for display
                from datetime import datetime, timedelta
                today = datetime.now()
                target_days_ago = today - timedelta(days=days-1)
                
                return {
                    "success": True,
                    "insights": insights,
                    "logs_count": len(wellness_logs),
                    "days_analyzed": days,
                    "date_range": f"{target_days_ago.strftime('%Y-%m-%d')} to {today.strftime('%Y-%m-%d')}",
                    "message": f"Generated insights from {len(wellness_logs)} wellness log entries over {days} calendar days"
                }
            else:
                return {
                    "success": False,
                    "insights": "No wellness data available for the specified period. Start logging your daily activities to receive personalized insights!",
                    "logs_count": 0,
                    "days_analyzed": days,
                    "message": "No wellness logs found"
                }
        else:
            ctx.logger.error(f"Failed to fetch wellness data: {response.status_code}")
            return {
                "success": False,
                "insights": "Unable to fetch wellness data at the moment. Please try again later.",
                "logs_count": 0,
                "days_analyzed": days,
                "message": "Backend connection error"
            }
            
    except Exception as e:
        ctx.logger.error(f"Error fetching wellness insights: {str(e)}")
        # Provide fallback insights even when there's an error
        fallback_insights = generate_fallback_insights([])
        return {
            "success": True,
            "insights": fallback_insights,
            "logs_count": 0,
            "days_analyzed": days,
            "message": f"Generated fallback insights due to error: {str(e)}"
        }


def format_analysis_response(analysis: dict, format_type: str, sender: str) -> str:
    """Formats the stored image analysis into a user-friendly string."""
    try:
        if not analysis:
            return "Sorry, I seem to have lost the analysis data. Please upload the image again."

        response_parts = []
        image_type = analysis.get("image_type", "other")

        # Define a generic formatter for different image types
        if image_type == "medical_document":
            if format_type == "full" and analysis.get("extracted_data"):
                response_parts.append("**Extracted Data:**")
                for item in analysis.get("extracted_data"):
                    response_parts.append(f"  • **Test:** {item.get('test', 'N/A')} - **Value:** {item.get('value', 'N/A')} ({item.get('status', 'N/A')}) - **Range:** {item.get('range', 'N/A')}")
                response_parts.append("") # Add a blank line for spacing
            
            response_parts.append(f"**Summary:**\n{analysis.get('summary', 'N/A')}")
            response_parts.append(f"\n**Recommendation:**\n{analysis.get('recommendation', 'Please discuss these results with your doctor.')}")

        elif image_type == "skin_condition":
            if format_type == "full":
                response_parts.append(f"**Description:**\n{analysis.get('description', 'N/A')}")
            
            if analysis.get("possible_conditions"):
                response_parts.append(f"\n**Possible Conditions (Not a diagnosis):**\n• {', '.join(analysis.get('possible_conditions'))}")
            
            response_parts.append(f"\n**Recommendation:**\n{analysis.get('recommendation', 'Consult a healthcare professional.')}")
            response_parts.append(f"\n**Disclaimer:** {analysis.get('disclaimer', 'This is an AI analysis and not a medical diagnosis.')}")

        elif image_type == "food":
            if format_type == "full" and analysis.get("identified_food"):
                response_parts.append(f"**Identified Food:**\n• {', '.join(analysis.get('identified_food'))}")

            if analysis.get("nutritional_estimate"):
                nutrition = analysis.get("nutritional_estimate")
                response_parts.append("\n**Nutritional Estimate:**")
                for key, value in nutrition.items():
                    response_parts.append(f"  • {key.capitalize()}: {value}")
            
            response_parts.append(f"\n**Feedback:**\n{analysis.get('feedback', 'N/A')}")

        else: # General/Other
            response_parts.append(f"**Description:**\n{analysis.get('description', 'N/A')}")
            response_parts.append(f"\n**Feedback:**\n{analysis.get('feedback', 'N/A')}")

        return "\n".join(response_parts)
    finally:
        # Always clear the context after providing the response
        clear_user_context(sender)

async def process_health_query(query: str, ctx: Context, sender: str = "default_user", file: Optional[FileData] = None) -> str:
    """Process health-related queries and route appropriately"""
    try:
        # Check for context-based responses first
        if sender and sender in user_contexts:
            context = get_user_context(sender)

            # Handle image analysis confirmation
            if context.get("awaiting_analysis_confirmation"):
                message_lower = query.lower()
                analysis_data = context.get("last_image_analysis")

                if "full" in message_lower:
                    return format_analysis_response(analysis_data, "full", sender)
                elif "regular" in message_lower or "summary" in message_lower:
                    return format_analysis_response(analysis_data, "regular", sender)
                else:
                    # If the response is ambiguous, ask again and preserve context
                    return "Sorry, I didn't understand. Please choose either **Full Analysis** or **Regular Analysis**."

            # Handle doctor booking confirmations
            if context.get("awaiting_doctor_confirmation"):
                # Use LLM to understand confirmation intent
                confirmation_intent = await classify_confirmation_with_llm(query, ctx)
                if confirmation_intent == "yes":
                    return await handle_doctor_booking_confirmation(sender, ctx)
                elif confirmation_intent == "no":
                    return await handle_doctor_booking_cancellation(sender, ctx)

        # Use ASI1 LLM for intent classification (more accurate)
        ctx.logger.info(f"🗣️ User query: '{query}' - Classifying with ASI1 LLM...")
        intent = await classify_user_intent_with_llm(query, ctx)

        # If a file is attached, it's always an image_analysis intent
        if file is not None:
            ctx.logger.info(f"File detected, overriding intent to image_analysis.")
            intent = "image_analysis"

        if intent == "image_analysis":
            if file is None:
                return "It looks like you want to analyze an image, but you haven't attached one. Please upload an image with your message."
            return await handle_image_analysis(query, file, ctx, sender)
        elif intent == "emergency":
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
            return await handle_medication_reminder(query, ctx, sender)
        elif intent == "book_doctor":
            return await route_to_doctor_agent(query, ctx, sender)
        elif intent == "pharmacy":
            return await route_to_pharmacy_agent(query, ctx, sender)
        elif intent == "wellness":
            return await route_to_wellness_agent(query, ctx, sender)
        elif intent == "wellness_delete":
            return await route_to_wellness_delete(query, ctx, sender)
        elif intent == "cancel":
            return await handle_cancel_request(query, ctx, sender)
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
                   " **Natural Language Cancellation:**\n"
                   "• 'Cancel my latest appointment'\n"
                   "• 'I need to cancel my medicine order'\n"
                   "• 'Cancel my doctor booking, something came up'\n"
                   "• 'Cancel appointment APT-123ABC'\n\n"
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

# Add file analysis function
async def analyze_file_with_asi1(file_data: FileData, ctx: Context) -> dict:
    """Analyze uploaded files using ASI1's vision and document analysis capabilities"""
    try:
        if file_data.file_type == "image":
            # Use ASI1's vision API for image analysis
            payload = {
                "model": "asi1-vision",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this medical image and describe what you see. If you see any potential health concerns, mention them professionally and suggest relevant follow-up actions."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{file_data.mime_type};base64,{file_data.content}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 500
            }
        else:
            # Use ASI1's document analysis for PDFs and other documents
            payload = {
                "model": "asi1-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a medical document analyzer. Review the provided document and extract key medical information."
                    },
                    {
                        "role": "user",
                        "content": file_data.content
                    }
                ],
                "max_tokens": 500
            }

        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            analysis = result["choices"][0]["message"]["content"]
            return {
                "success": True,
                "analysis": analysis,
                "file_type": file_data.file_type,
                "file_name": file_data.file_name
            }
        else:
            return {
                "success": False,
                "error": f"ASI1 API error: {response.status_code}",
                "file_type": file_data.file_type,
                "file_name": file_data.file_name
            }

    except Exception as e:
        ctx.logger.error(f"Error analyzing file: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "file_type": file_data.file_type,
            "file_name": file_data.file_name
        }

# Add REST endpoint for Flask API integration
@agent.on_rest_post("/api/chat", ChatRequest, ChatResponse)
async def handle_rest_chat(ctx: Context, req: ChatRequest) -> ChatResponse:
    """Handle chat messages from Flask API via REST endpoint"""
    try:
        ctx.logger.info(f"Received REST request: {req}")
        ctx.logger.info(f" REST API request from user {req.user_id}: {req.message}")
        if req.file:
            ctx.logger.info(f" File attached: {req.file.file_name} ({req.file.file_type})")

        # Process the health-related query using existing logic
        response_text = await process_health_query(req.message, ctx, req.user_id, req.file)

        # Classify intent for response metadata
        intent = await classify_user_intent_with_llm(req.message, ctx)
        if req.file:
            intent = "image_analysis"

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

# Add wellness insights endpoint for frontend
@agent.on_rest_post("/api/wellness-insights", WellnessInsightsRequest, WellnessInsightsResponse)
async def handle_wellness_insights(ctx: Context, req: WellnessInsightsRequest) -> WellnessInsightsResponse:
    """Generate AI-powered wellness insights for frontend"""
    try:
        ctx.logger.info(f"🌱 REST ENDPOINT CALLED - Request ID: {req.request_id} - User: {req.user_id} for {req.days} days")
        
        # Get AI-powered insights
        insights_data = await get_wellness_insights(req.user_id, req.days, ctx)
        
        if insights_data["success"]:
            return WellnessInsightsResponse(
                request_id=req.request_id,
                success=True,
                insights=insights_data["insights"],
                summary=f"Analyzed {insights_data['logs_count']} wellness entries over {req.days} days",
                recommendations=[],  # Can be expanded later
                message=insights_data["message"]
            )
        else:
            return WellnessInsightsResponse(
                request_id=req.request_id,
                success=False,
                insights=insights_data["insights"],
                summary="No data available",
                recommendations=[],
                message=insights_data["message"]
            )
            
    except Exception as e:
        ctx.logger.error(f"Error in wellness insights endpoint: {str(e)}")
        return WellnessInsightsResponse(
            request_id=req.request_id,
            success=False,
            insights="Unable to generate wellness insights at the moment.",
            summary="Error occurred",
            recommendations=[],
            message=f"Error: {str(e)}"
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

# Handler for unified medicine purchase responses (like doctor booking)
@pharmacy_protocol.on_message(model=MedicinePurchaseResponse)
async def handle_medicine_purchase_response(ctx: Context, sender: str, msg: MedicinePurchaseResponse):
    """Handle unified medicine purchase responses from PharmacyAgent"""
    ctx.logger.info(f"Received medicine purchase response: {msg.status} - {msg.medicine_name}")
    
    try:
        # Find the corresponding request info
        request_info = pending_requests.get(msg.request_id)
        if not request_info:
            ctx.logger.warning(f"No pending request found for purchase response ID: {msg.request_id}")
            return
        
        # Get user sender from request mapping
        user_sender = user_request_mapping.get(msg.request_id) or request_info.get("user_sender")
        
        if msg.status == "success":
            # Order placed successfully
            success_message = f"🎉 **Medicine Order Successfully Placed!**\n\n"
            success_message += f"**Medicine:** {msg.medicine_name}\n"
            success_message += f"**Order ID:** `{msg.order_id}`\n"
            success_message += f"**Total Price:** ${msg.total_price:.2f}\n\n"
            success_message += f"💡 **Keep this Order ID to track or cancel your order**\n\n"
            success_message += f"💾 **Storage:** Order saved to ICP blockchain\n"
            success_message += f"📍 **Pickup:** {msg.message}"
            
            if user_sender and not user_sender.startswith("frontend_"):
                chat_response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    sender=user_sender,
                    message=success_message,
                    message_type="pharmacy_order_success",
                    request_id=msg.request_id
                )
                await store_to_icp("store-chat", {"chat": chat_response.dict()})
        
        elif msg.status == "insufficient_stock":
            # Not enough stock
            stock_message = f"⚠️ **Insufficient Stock**\n\n"
            stock_message += f"**Medicine:** {msg.medicine_name}\n"
            stock_message += f"**Issue:** {msg.message}\n\n"
            stock_message += f"Please try again later or contact the pharmacy directly."
            
            if user_sender and not user_sender.startswith("frontend_"):
                chat_response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    sender=user_sender,
                    message=stock_message,
                    message_type="pharmacy_stock_error",
                    request_id=msg.request_id
                )
                await store_to_icp("store-chat", {"chat": chat_response.dict()})
        
        elif msg.status == "available":
            # Medicine available but not ordered (availability check only)
            available_message = f"✅ **Medicine Available**\n\n"
            available_message += f"**Medicine:** {msg.medicine_name}\n"
            available_message += f"**Price:** ${msg.total_price:.2f}\n"
            available_message += f"**Details:** {msg.message}\n\n"
            available_message += f"💡 Say 'I want to order {msg.medicine_name}' to place an order"
            
            if user_sender and not user_sender.startswith("frontend_"):
                chat_response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    sender=user_sender,
                    message=available_message,
                    message_type="pharmacy_available",
                    request_id=msg.request_id
                )
                await store_to_icp("store-chat", {"chat": chat_response.dict()})
        
        else:
            # Error case
            error_message = f"❌ **Medicine Request Error**\n\n"
            error_message += f"**Medicine:** {msg.medicine_name or 'Unknown'}\n"
            error_message += f"**Error:** {msg.message}\n\n"
            error_message += f"Please try again or contact support if the issue persists."
            
            if user_sender and not user_sender.startswith("frontend_"):
                chat_response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    sender=user_sender,
                    message=error_message,
                    message_type="pharmacy_error",
                    request_id=msg.request_id
                )
                await store_to_icp("store-chat", {"chat": chat_response.dict()})
        
        # Clean up pending request
        if msg.request_id in pending_requests:
            del pending_requests[msg.request_id]
        if msg.request_id in user_request_mapping:
            del user_request_mapping[msg.request_id]
            
        ctx.logger.info(f"Medicine purchase response processed successfully")

    except Exception as e:
        ctx.logger.error(f"Error in medicine purchase response handler: {str(e)}")

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
                success_message = f"🎉 **Appointment Successfully Booked!**\n\n" \
                                 f"**Doctor:** {msg.doctor_name}\n" \
                                 f"**Specialty:** {request_info['specialty']}\n" \
                                 f"**Date & Time:** {msg.appointment_time}\n\n" \
                                 f"📋 **Your Appointment ID:** `{msg.appointment_id}`\n" \
                                 f"💡 **Keep this ID to cancel or modify your appointment**\n\n" \
                                 f"💾 **Storage:** Appointment saved to ICP blockchain"
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

        # Handle order placement if this was an order request and medicine is available
        if is_order_request and msg.available:
            try:
                ctx.logger.info(f"Auto-placing order for {msg.medicine} (qty: {quantity})")
                
                # Create medicine order request - we need medicine_id from the availability response
                # For now, use the medicine name as ID (pharmacy agent should handle this)
                order_request_id = str(uuid4())[:8]
                medicine_order = MedicineOrderRequest(
                    medicine_id=msg.medicine,  # Use medicine name as fallback ID
                    medicine_name=msg.medicine,
                    quantity=quantity,
                    user_id=user_sender
                )
                
                # Track the order request
                pending_requests[order_request_id] = {
                    "type": "pharmacy_order",
                    "medicine": msg.medicine,
                    "timestamp": datetime.now(),
                    "user_sender": user_sender,
                    "quantity": quantity,
                    "original_request_id": msg.request_id
                }
                if user_sender:
                    user_request_mapping[order_request_id] = user_sender
                
                # Send order request to pharmacy agent
                await ctx.send(sender, medicine_order)
                ctx.logger.info(f"Order request sent for {msg.medicine}")
                
                # Don't send immediate response - wait for order confirmation
                
            except Exception as e:
                ctx.logger.error(f"Error placing automatic order: {str(e)}")
                # Fall back to manual order instructions
                if user_sender and not user_sender.startswith("frontend_"):
                    order_message = f" **{msg.medicine}** is available but automatic ordering failed!\n\n"
                    order_message += f" **Error:** {str(e)}\n\n"
                    order_message += f"Please try manual ordering: 'Order {quantity} units of {msg.medicine}'"
                    
                    chat_response = ChatMessage(
                        timestamp=datetime.now(timezone.utc),
                        msg_id=uuid4(),
                        content=[TextContent(type="text", text=order_message)]
                    )
                    await ctx.send(user_sender, chat_response)
        else:
            # Send result to user (only for direct chat users, not REST API users)
            if user_sender and not user_sender.startswith("frontend_"):
                if msg.available:
                    if is_order_request:
                        # This should not happen since we handle orders above
                        order_message = f" **{msg.medicine}** is available for purchase!\n\n"
                        order_message += f" **Stock:** {msg.stock} units available\n"
                        order_message += f" **Price:** ${msg.price:.2f} per unit\n"
                        order_message += f" **Total:** ${msg.price * quantity:.2f} for {quantity} units\n"
                        order_message += f" **Pharmacy:** {msg.pharmacy_name}\n\n"
                        order_message += f"Processing your order..."
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
    
    try:
        # Find the corresponding request info (we don't have request_id in MedicineOrderResponse)
        request_info = None
        original_request_id = None
        user_sender = None
        
        # Look for pending pharmacy order requests
        for req_id, req_info in list(pending_requests.items()):
            if (req_info.get("type") == "pharmacy_order" and 
                req_info.get("medicine") == msg.medicine):
                request_info = req_info
                original_request_id = req_id
                user_sender = req_info.get("user_sender")
                break
        
        # Send ACK if we found the request
        if original_request_id:
            ack = RequestACK(
                request_id=original_request_id,
                agent_type="pharmacy",
                message=f"Received order response: {msg.status}",
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            await ctx.send(sender, ack)
        
        # Send result to user (only for direct chat users, not REST API users)
        if user_sender and not user_sender.startswith("frontend_"):
            if msg.status == "confirmed":
                order_message = f"🎉 **Order Confirmed!**\n\n"
                order_message += f"**Medicine:** {msg.medicine}\n"
                order_message += f"**Quantity:** {msg.qty} units\n"
                order_message += f"**Total Price:** ${msg.price:.2f}\n"
                if msg.order_id:
                    order_message += f"**Order ID:** {msg.order_id}\n"
                order_message += f"\n📍 **Pickup Instructions:**\n"
                order_message += f"{msg.message}\n\n"
                order_message += f"💾 **Storage:** Order saved to ICP blockchain"
            elif msg.status == "insufficient_stock":
                order_message = f"❌ **Order Failed - Insufficient Stock**\n\n"
                order_message += f"**Medicine:** {msg.medicine}\n"
                order_message += f"**Requested:** {msg.qty} units\n"
                order_message += f"**Details:** {msg.message}\n\n"
                
                if msg.suggested_alternatives:
                    order_message += f"🔄 **Alternative Suggestions:**\n"
                    for alt in msg.suggested_alternatives:
                        order_message += f"• {alt.get('name', 'Unknown')} - ${alt.get('price', 0):.2f} ({alt.get('stock', 0)} available)\n"
                    order_message += f"\nWould you like to order one of these alternatives instead?"
            elif msg.status == "prescription_required":
                order_message = f"📋 **Prescription Required**\n\n"
                order_message += f"**Medicine:** {msg.medicine}\n"
                order_message += f"**Details:** {msg.message}\n\n"
                order_message += f"Please provide a valid prescription to order this medicine."
            else:
                order_message = f"❌ **Order Error**\n\n"
                order_message += f"**Medicine:** {msg.medicine}\n"
                order_message += f"**Status:** {msg.status}\n"
                order_message += f"**Details:** {msg.message}"
            
            chat_response = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text=order_message)]
            )
            await ctx.send(user_sender, chat_response)
        else:
            ctx.logger.info(f"Order result for REST API user {user_sender}: {msg.status} - {msg.medicine}")
        
        # Clean up pending request if found
        if original_request_id and original_request_id in pending_requests:
            del pending_requests[original_request_id]
            if original_request_id in user_request_mapping:
                del user_request_mapping[original_request_id]
        
        ctx.logger.info(f"Pharmacy order response processed successfully")
        
    except Exception as e:
        ctx.logger.error(f"Error in pharmacy order response handler: {str(e)}")

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
        request_type = request_info.get("type", "wellness")

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
            if request_type == "wellness_delete":
                if msg.success:
                    wellness_message = f"🗑️ **Wellness Data Deleted Successfully!**\n\n"
                    if msg.summary:
                        wellness_message += f" **Summary:** {msg.summary}\n\n"
                    if msg.advice:
                        for advice in msg.advice:
                            wellness_message += f"{advice}\n"
                else:
                    wellness_message = f"❌ **Wellness Data Deletion Failed**\n\n"
                    wellness_message += f" **Error:** {msg.message}"
            else:  # Regular wellness logging
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
agent.include(cancel_protocol)
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