# 🏥 Healthcare Agents - Flask Integration

Flask backend using **uAgents** for direct communication with Agentverse-connected agents.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Update Agent Addresses
Edit `flask_app.py` and replace with your actual Agentverse agent addresses:
```python
HEALTH_AGENT_ADDRESS = "agent1q..."  # Your HealthAgent address
DOCTOR_AGENT_ADDRESS = "agent1q..."  # Your DoctorAgent address  
PHARMACY_AGENT_ADDRESS = "agent1q..." # Your PharmacyAgent address
WELLNESS_AGENT_ADDRESS = "agent1q..." # Your WellnessAgent address
```

### 3. Start Flask Backend
```bash
python flask_app.py
```

### 4. Start Frontend
```bash
cd ../frontend
npm run dev
```

### 5. Test Real Agent Communication
Navigate to `/chat` and try:
- "I slept 8 hours" → WellnessAgent via uAgents
- "Book me a doctor" → DoctorAgent via uAgents  
- "Do you have aspirin?" → PharmacyAgent via uAgents

## 📁 File Structure

### Flask Integration
- **`flask_app.py`** - Flask server with uAgents integration
- **`requirements.txt`** - Python dependencies

### Core Agents (for reference)
- **`agent.py`** - Main HealthAgent with ASI1 LLM
- **`doctor.py`** - Doctor appointment booking
- **`pharmacy.py`** - Medicine availability & ordering  
- **`wellness.py`** - Health data tracking & ICP storage

### Documentation
- **`AGENTVERSE_GUIDE.md`** - Complete Agentverse setup guide

## 🎯 Architecture

```
React Frontend → Flask Backend → uagents.query() → Agentverse Agents
   (port 5173)    (port 5000)         (API)        (Your Mailbox)
```

## 📡 API Endpoints

- **`POST /api/chat`** - Main HealthAgent communication
- **`POST /api/wellness`** - Wellness tracking
- **`POST /api/wellness/log`** - Structured wellness logging  
- **`POST /api/doctor`** - Doctor booking requests
- **`POST /api/pharmacy`** - Medicine queries
- **`GET /api/agents/status`** - Check agent connectivity
- **`GET /health`** - API health check

**Real agent communication using uAgents - no simulation!** 🚀