# 🏥 Cura Healthcare System

A comprehensive healthcare platform built with React frontend and AI-powered agents using Fetch.ai uAgents framework.

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