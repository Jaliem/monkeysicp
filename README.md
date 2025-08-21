# 🏥 Cura Healthcare System

A comprehensive healthcare platform built with React frontend and AI-powered agents using Fetch.ai uAgents framework.

## 📋 Prerequisites

### **Install DFX (Internet Computer SDK)**

**macOS/Linux:**
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

**Windows:**
```powershell
# Install via WSL2 (recommended) or use the installer
wsl --install
# Then run the macOS/Linux command inside WSL
```

### **Install Mops (Motoko Package Manager)**

```bash
# Install via npm (requires Node.js)
npm install -g ic-mops

# Verify installation
mops --version
```

**Note**: Mops is used for managing Motoko dependencies in the ICP backend.

## 🚀 Quick Start Guide

### 1. **Start ICP Backend**

```bash
dfx start --clean --background
dfx deploy backend
```

**Note**: After `dfx deploy backend` completes, it will display the canister ID and base URL. Copy these values - you'll need them for the `.env` file in step 2.

### 2. **Setup Python Environment for Agents**

```bash
cd fetch
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Unix/macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### **Configure Environment Variables:**

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your values:**
   - **CANISTER_ID** and **BASE_URL**: Use the values from `dfx deploy backend` output
   - **ASI1_API_KEY**: Get your API key from https://asi1.ai/dashboard/api-keys
   - **Agent addresses**: Update with your actual agent addresses (or keep the provided ones)

   Example `.env` file:
   ```
   CANISTER_ID=rdmx6-jaaaa-aaaah-qcaaa-cai
   BASE_URL=http://127.0.0.1:4943
   ASI1_API_KEY=sk_your_actual_api_key_here
   DOCTOR_AGENT_ADDRESS=agent1qwqyy4k7jfccfuymlvujxefvt3fj2x3qus84mg7nruunr9gmezv6wruawru
   # ... other agent addresses
   ```

### 3. **Start All Healthcare Agents**

Run each agent in separate terminal windows:

```bash
# Terminal 1 - Main Health Agent (port 8000)
python agent.py

# Terminal 2 - Pharmacy Agent (port 8001)  
python pharmacy.py

# Terminal 3 - Doctor Agent (port 8002)
python doctor.py

# Terminal 4 - Wellness Agent (port 8003)
python wellness.py
```

### 4. **Start Frontend**

```bash
cd frontend
npm i
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Main Health Agent**: http://localhost:8000
- **Pharmacy Agent**: http://localhost:8001
- **Doctor Agent**: http://localhost:8002
- **Wellness Agent**: http://localhost:8003

## 🏗️ Architecture

```
React Frontend (TypeScript)
       ↓ Direct HTTP REST API
Healthcare Agents (Python uAgents)
       ↓ Data Storage
ICP Backend (Motoko)
```

## 🤖 Agent Capabilities

### **Health Agent** (Main)
- AI-powered symptom analysis
- Intent classification and routing
- Emergency response protocols
- Natural language understanding

### **Doctor Agent**
- Appointment scheduling
- Specialist matching
- Medical consultation booking

### **Pharmacy Agent**
- Medicine availability checking
- Prescription management
- Drug interaction analysis

### **Wellness Agent**
- Activity and sleep tracking
- Health metrics logging
- Wellness insights and advice

## 🧠 AI Features

- **ASI1 LLM Integration** for intelligent analysis
- **Natural Language Processing** for user queries
- **Smart Intent Classification** for accurate routing
- **Context-Aware Conversations** with memory
- **ICP Blockchain Storage** for secure health data

## 🤖 How the Agents Work

The Cura Healthcare System uses a multi-agent architecture built with **Fetch.ai uAgents framework**. Each agent operates independently while communicating through structured protocols.

### **Agent Architecture**

```
Frontend (React) → Health Agent (Main) → Specialized Agents
                                      ↓
                              ICP Blockchain Storage
```

### **Agent Communication Flow**

1. **Request Routing**: Health Agent receives user input and classifies intent using ASI1 LLM
2. **Protocol-Based Messaging**: Agents communicate via typed message models (Pydantic)
3. **Asynchronous Processing**: Each agent processes requests independently
4. **Response Correlation**: Requests tracked by unique IDs for proper response routing
5. **Data Persistence**: All health data stored on ICP blockchain for security

### **Core Agents**

#### **Health Agent** (`agent.py` - Port 8000)
- **Role**: Main coordinator and AI-powered health assistant
- **Features**:
  - ASI1 LLM integration for symptom analysis
  - Intent classification and request routing
  - REST API endpoints for frontend integration
  - Context-aware conversation management
- **Protocols**: Chat, Doctor, Pharmacy, Wellness

#### **Doctor Agent** (`doctor.py` - Port 8001)
- **Role**: Medical appointment booking and specialist matching
- **Features**:
  - Specialist database management via ICP
  - Appointment scheduling and conflict resolution
  - Doctor availability checking
- **Message Types**: `DoctorBookingRequest` → `DoctorBookingResponse`

#### **Pharmacy Agent** (`pharmacy.py` - Port 8002)
- **Role**: Medicine inventory and prescription management
- **Features**:
  - Real-time medicine availability checking
  - Price and stock management via ICP
  - Alternative medicine suggestions
- **Message Types**: `MedicineCheckRequest` → `MedicineCheckResponse`

#### **Wellness Agent** (`wellness.py` - Port 8003)
- **Role**: Health metrics tracking and wellness insights
- **Features**:
  - Sleep, exercise, mood, and activity logging
  - Health trend analysis and recommendations
  - Wellness data aggregation via ICP
- **Message Types**: `LogRequest` → `WellnessAdviceResponse`

### **Agent Communication Protocols**

Agents use **typed message models** for reliable communication:

```python
# Example: Health Agent → Doctor Agent
booking_request = DoctorBookingRequest(
    request_id="abc123",
    specialty="cardiology",
    preferred_time="tomorrow",
    urgency="urgent",
    symptoms="chest pain"
)
await ctx.send(DOCTOR_AGENT_ADDRESS, booking_request)
```

### **Key Features**

- **Event-Driven Architecture**: Agents respond to protocol-specific message events
- **Request Correlation**: Each request has unique ID for tracking responses
- **Fault Tolerance**: Graceful error handling and fallback mechanisms
- **Scalable Design**: Easy to add new agents and protocols
- **Blockchain Integration**: Secure data storage on ICP network

## 🛠️ Development

### **Agent Development**
- Each agent runs independently with REST endpoints
- Agents communicate via uAgents protocols
- Health data stored on ICP blockchain
- AI analysis powered by ASI1

### **Frontend Development**
- React with TypeScript
- Direct REST API communication
- Real-time health agent responses
- Responsive healthcare UI

## 📋 Troubleshooting

### **Agents Not Responding**
1. Ensure all agents are running in separate terminals
2. Check each agent shows "Starting server on http://0.0.0.0:XXXX"
3. Verify ports 8000-8003 are available

### **Frontend Connection Issues**
1. Confirm agent.py is running on port 8000
2. Check browser console for CORS errors
3. Ensure frontend is on http://localhost:5173

### **ICP Backend Issues**
1. Verify `dfx start` is running
2. Check `dfx deploy backend` completed successfully
3. Confirm canister is accessible

## 🎯 Usage Examples

### **Symptom Analysis**
```
User: "I have a headache and feel tired"
Agent: 🔍 Detected symptoms: headache, fatigue
       🏥 AI Analysis - Likely conditions:
       • 🟢 Tension-type headache (70% confidence)
       💡 Recommendations: Rest, hydration, OTC pain relief
```

### **Wellness Tracking**
```
User: "I slept 8 hours and walked 5000 steps"
Agent: 😴 Sleep Analysis: Excellent (8 hours)
       🚶 Activity: Great job on 5000 steps!
       📊 Health insights and optimization tips
```

### **Pharmacy Services**
```
User: "Do you have ibuprofen?"
Agent: ✅ Ibuprofen is available at HealthPlus Pharmacy
       📦 Stock: 150 units | 💰 Price: $5.99
       💡 Usage: reducing inflammation, pain, and fever
```

## 🔒 Security & Privacy

- Health data encrypted and stored on ICP blockchain
- AI analysis performed locally with ASI1
- No sensitive data sent to external services
- HIPAA-compliant data handling practices

---

**🚀 Start with the ICP backend, then agents, then frontend for the complete healthcare experience!**