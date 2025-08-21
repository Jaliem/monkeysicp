import json
import asyncio
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import uuid
from datetime import datetime
import time

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enables CORS for all domains on all routes

# Agent REST API endpoints
HEALTH_AGENT_URL = "http://localhost:8000/api/chat"
HEALTH_AGENT_HEALTH_URL = "http://localhost:8000/health"

# Other agents would use their respective ports if running separately
DOCTOR_AGENT_URL = "http://localhost:8001/api/chat"  
PHARMACY_AGENT_URL = "http://localhost:8002/api/chat"
WELLNESS_AGENT_URL = "http://localhost:8003/api/chat"

@app.route("/")
def home():
    return "Welcome to the Cura Healthcare API!"

@app.route("/health")
def health():
    return {"status": "healthy", "message": "Healthcare Agent API is running"}

def send_message_to_agent_rest(agent_url, message, user_id="frontend_user", timeout=30):
    """
    Send message to agent via REST endpoint
    """
    try:
        print(f"Sending to agent via REST API: {message}")
        
        # Prepare request payload
        payload = {
            "message": message,
            "user_id": user_id
        }
        
        # Send POST request to agent's REST endpoint
        response = requests.post(
            agent_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Received response from agent: {result.get('response', '')[:100]}...")
            return result
        else:
            print(f"Agent REST API error: {response.status_code} - {response.text}")
            return {
                "error": "Agent communication failed",
                "message": f"Agent returned {response.status_code}: {response.text}",
                "suggestion": "Please ensure your agent is running and accessible"
            }
            
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error to agent: {e}")
        return {
            "error": "Agent offline",
            "message": "Unable to connect to your agent. It may not be running.",
            "suggestion": "Please start your agent by running: python agent.py",
            "troubleshooting": {
                "steps": [
                    "1. Open a terminal/command prompt",
                    "2. Navigate to your agent directory",
                    "3. Run: python agent.py",
                    "4. Wait for the agent to start on port 8000", 
                    "5. Try your request again"
                ]
            }
        }
    except requests.exceptions.Timeout as e:
        print(f"Timeout connecting to agent: {e}")
        return {
            "error": "Agent timeout",
            "message": "Your agent is taking too long to respond.",
            "suggestion": "Your agent may be busy processing other requests"
        }
    except Exception as e:
        print(f"Error communicating with agent: {e}")
        return {
            "error": "Communication error",
            "message": f"Unexpected error: {str(e)}"
        }

# Chat endpoints - communicate with your real Agentverse agents

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "")
        user_id = data.get("user_id", "frontend_user")
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        print(f"Sending to HealthAgent: {message}")
        
        # Send to your HealthAgent via REST API
        response_data = send_message_to_agent_rest(
            agent_url=HEALTH_AGENT_URL,
            message=message,
            user_id=user_id
        )
        
        if response_data:
            if "error" in response_data:
                print(f"HealthAgent error: {response_data['error']}")
                return jsonify(response_data), 500
            else:
                print(f"Received from HealthAgent: Success")
                return jsonify(response_data)
        else:
            return jsonify({
                "error": "No response from HealthAgent", 
                "message": "Agent may be offline or busy. Please try again.",
                "suggestion": "Check if your HealthAgent is running"
            }), 500
            
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({"error": "Agent communication failed", "message": str(e)}), 500

# Wellness endpoint - communicates with your real WellnessAgent
@app.route("/api/wellness", methods=["POST"])
def wellness():
    try:
        data = request.json
        message = data.get("message", "")
        user_id = data.get("user_id", "frontend_user")
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        print(f"Sending to WellnessAgent: {message}")
        
        response_data = send_message_to_agent_rest(
            agent_url=HEALTH_AGENT_URL,
            message=message,
            user_id=user_id
        )
        
        if response_data:
            print(f"Received from WellnessAgent: Success")
            return jsonify(response_data)
        else:
            return jsonify({"error": "No response from WellnessAgent"}), 500
            
    except Exception as e:
        print(f"Error in wellness endpoint: {e}")
        return jsonify({"error": "WellnessAgent communication failed", "message": str(e)}), 500

# Doctor endpoint - communicates with your real DoctorAgent
@app.route("/api/doctor", methods=["POST"])
def doctor():
    try:
        data = request.json
        message = data.get("message", "")
        user_id = data.get("user_id", "frontend_user")
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        print(f"Sending to DoctorAgent: {message}")
        
        response_data = send_message_to_agent_rest(
            agent_url=HEALTH_AGENT_URL,
            message=message,
            user_id=user_id
        )
        
        if response_data:
            print(f"Received from DoctorAgent: Success")
            return jsonify(response_data)
        else:
            return jsonify({"error": "No response from DoctorAgent"}), 500
            
    except Exception as e:
        print(f"Error in doctor endpoint: {e}")
        return jsonify({"error": "DoctorAgent communication failed", "message": str(e)}), 500

# Pharmacy endpoint - communicates with your real PharmacyAgent
@app.route("/api/pharmacy", methods=["POST"])
def pharmacy():
    try:
        data = request.json
        message = data.get("message", "")
        user_id = data.get("user_id", "frontend_user")
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        print(f"Sending to PharmacyAgent: {message}")
        
        response_data = send_message_to_agent_rest(
            agent_url=HEALTH_AGENT_URL,
            message=message,
            user_id=user_id
        )
        
        if response_data:
            print(f"Received from PharmacyAgent: Success")
            return jsonify(response_data)
        else:
            return jsonify({"error": "No response from PharmacyAgent"}), 500
            
    except Exception as e:
        print(f"Error in pharmacy endpoint: {e}")
        return jsonify({"error": "PharmacyAgent communication failed", "message": str(e)}), 500

# Agent status endpoint - check real agent connectivity
@app.route("/api/agents/status", methods=["GET"])
def agent_status():
    """Check if your agents are reachable via REST API"""
    try:
        # Test connection to HealthAgent
        response = requests.get(HEALTH_AGENT_HEALTH_URL, timeout=5)
        
        if response.status_code == 200:
            return jsonify({
                "health": "online",
                "doctor": "online",  # Routed through health agent
                "pharmacy": "online",  # Routed through health agent 
                "wellness": "online",  # Routed through health agent
                "communication": "rest_api_active",
                "agent_url": HEALTH_AGENT_URL
            })
        else:
            return jsonify({
                "health": "offline",
                "doctor": "offline",
                "pharmacy": "offline", 
                "wellness": "offline",
                "communication": "rest_api_error",
                "error": f"Agent returned {response.status_code}"
            })
            
    except requests.exceptions.ConnectionError:
        return jsonify({
            "health": "offline",
            "doctor": "offline",
            "pharmacy": "offline",
            "wellness": "offline", 
            "communication": "agent_not_running",
            "suggestion": "Start your agent with: python agent.py"
        })
    except Exception as e:
        return jsonify({
            "health": "unknown",
            "doctor": "unknown",
            "pharmacy": "unknown",
            "wellness": "unknown",
            "communication": "error",
            "error": str(e)
        })

# Wellness logging endpoint - structured data to your real WellnessAgent
@app.route("/api/wellness/log", methods=["POST"])
def log_wellness():
    try:
        data = request.json
        user_id = data.get("user_id", "frontend_user")
        
        # Convert wellness data to message format
        wellness_data = {
            "sleep": data.get("sleep", 0),
            "steps": data.get("steps", 0),
            "water": data.get("water", 0),
            "mood": data.get("mood", ""),
            "exercise": data.get("exercise", "")
        }
        
        # Format as natural language message for your WellnessAgent
        message_parts = []
        if wellness_data["sleep"] > 0:
            message_parts.append(f"I slept {wellness_data['sleep']} hours")
        if wellness_data["steps"] > 0:
            message_parts.append(f"walked {wellness_data['steps']} steps")
        if wellness_data["water"] > 0:
            message_parts.append(f"drank {wellness_data['water']} glasses of water")
        if wellness_data["mood"]:
            message_parts.append(f"feeling {wellness_data['mood'].lower()}")
        if wellness_data["exercise"]:
            message_parts.append(f"exercise: {wellness_data['exercise']}")
            
        message = "Today I " + ", ".join(message_parts) + "." if message_parts else "Wellness data logged"
        
        print(f"Logging wellness data to WellnessAgent: {message}")
        
        response_data = send_message_to_agent_rest(
            agent_url=HEALTH_AGENT_URL,
            message=message,
            user_id=user_id
        )
        
        if response_data:
            print(f"Wellness log response: Success")
            return jsonify(response_data)
        else:
            return jsonify({"error": "No response from WellnessAgent"}), 500
            
    except Exception as e:
        print(f"Error in wellness log endpoint: {e}")
        return jsonify({"error": "WellnessAgent logging failed", "message": str(e)}), 500

# Start the Flask application
if __name__ == "__main__":
    print("🏥 Starting Cura Healthcare Flask API...")
    print("🌐 REST API COMMUNICATION ENABLED!")
    print("🤖 Your Healthcare Agent:")
    print(f"   Agent URL: {HEALTH_AGENT_URL}")
    print(f"   Health Check: {HEALTH_AGENT_HEALTH_URL}")
    print("🔗 Communication Method: Direct REST API")
    print("🚀 Flask server starting on http://localhost:5000")
    print("✨ Your frontend will get REAL responses from your healthcare agent!")
    print("")
    print("📋 Make sure your agent is running:")
    print("   cd fetch && python agent.py")
    
    app.run(debug=True, port=5000, host='0.0.0.0')