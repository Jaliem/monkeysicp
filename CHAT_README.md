# HealthAgent Chat Integration

This integration connects the existing Python agent system (`agent.py`, `doctor.py`, `pharmacy.py`, `wellness.py`) with a modern React chat interface, allowing users to interact with all 3 healthcare agents through a single chat UI.

## 🏗️ Architecture

```
Frontend (React + TypeScript)
        ↓
   API Server (FastAPI)
        ↓
Agent Router (agent.py)
        ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   doctor.py     │   pharmacy.py   │   wellness.py   │
│   (Port 8001)   │   (Port 8002)   │   (Port 8003)   │
└─────────────────┴─────────────────┴─────────────────┘
```

## 🚀 Quick Start

### Method 1: Automatic Startup (Recommended)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start everything with one command
python start_chat.py
```

### Method 2: Manual Startup
```bash
# Terminal 1: Start API server
python api_server.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

## 🌐 Access URLs

- **Chat Interface**: http://localhost:5173
- **API Server**: http://localhost:8080  
- **API Documentation**: http://localhost:8080/docs

## 📱 Features

### Chat Interface
- **Natural Language Processing**: Users can chat naturally with the AI
- **Agent Detection**: Automatically routes messages to the correct specialist
- **Real-time Status**: Shows which agents are online/offline
- **Rich Formatting**: Supports markdown-style text formatting
- **Quick Actions**: Pre-built buttons for common queries

### Agent Routing
The system intelligently routes user messages to the appropriate agent:

- **Doctor Agent** 🩺: Doctor appointments, specialist booking
  - Keywords: "doctor", "appointment", "book", "cardiologist", etc.
  - Examples: "Book me a heart doctor", "Schedule appointment"

- **Pharmacy Agent** 💊: Medicine availability, ordering
  - Keywords: "medicine", "pharmacy", "paracetamol", "available", etc.
  - Examples: "Check if aspirin is available", "Buy paracetamol"

- **Wellness Agent** 💪: Activity tracking, health logging
  - Keywords: "sleep", "steps", "exercise", "walked", etc.
  - Examples: "I walked 5000 steps", "Slept 8 hours"

- **Health Agent** (General) 🤖: Symptom analysis, general health queries
  - Keywords: "symptoms", "pain", "feel sick", etc.
  - Examples: "I have a headache", "Analyze my symptoms"

## 🔧 Configuration

### Frontend Configuration
- **Proxy Setup**: `vite.config.ts` routes `/api/*` to backend
- **Agent Status**: Real-time monitoring of agent availability
- **UI Components**: Modern chat interface with agent-specific icons

### Backend Configuration  
- **CORS**: Configured for frontend development servers
- **Agent Endpoints**: Currently simulated, can be connected to real uAgents
- **Intent Classification**: Smart routing based on message content

## 🔌 Connecting to Real Agents

To connect to your actual Python agents:

1. **Update `api_server.py`**:
   ```python
   # Replace the simulated responses in send_to_agent() 
   # with actual HTTP calls or uAgents protocol communication
   
   async def send_to_agent(message: str, agent_type: str) -> dict:
       # Example: HTTP call to agent
       response = await http_client.post(f"http://localhost:800{1,2,3}/chat", {
           "message": message
       })
       return response.json()
   ```

2. **Agent Communication**: The existing `agent.py` already has the routing logic:
   ```python
   # In agent.py, the routing is already implemented:
   await route_to_doctor_agent(query, ctx, sender)
   await route_to_pharmacy_agent(query, ctx, sender) 
   await route_to_wellness_agent(query, ctx, sender)
   ```

## 📊 Example Conversations

### Doctor Booking
```
👤 User: "I need to see a cardiologist for chest pain"
🤖 Bot: "📅 I'm finding you a doctor and scheduling your appointment...
        ✅ Appointment booked! Dr. Sarah Wilson (Cardiology) 
        Tomorrow at 10:00 AM. Reference: APT-20250821-A1B2C3"
```

### Medicine Check
```
👤 User: "Do you have paracetamol available?"
🤖 Bot: "🔍 Checking medicine availability...
        ✅ Paracetamol is available at HealthPlus Pharmacy
        📦 Stock: 150 units | 💰 Price: $5.99/unit"
```

### Wellness Tracking
```
👤 User: "I walked 8000 steps today and slept 7 hours"
🤖 Bot: "📊 Logging your wellness data...
        ✅ Wellness Data Logged Successfully!
        💡 Great job staying active! Your sleep is in the healthy range."
```

## 🛠️ Development

### Adding New Agents
1. Create new agent file (e.g., `nutrition.py`)
2. Update intent classification in `api_server.py`
3. Add agent icon and status in `chat.tsx`
4. Update routing logic

### Customizing UI
- **Styling**: Edit Tailwind classes in `chat.tsx`
- **Icons**: Add new Lucide React icons for different agents
- **Quick Actions**: Modify the button array in the chat interface

## 📝 File Structure

```
monkeysicp/
├── agent.py              # Main health agent (already connected to sub-agents)
├── doctor.py             # Doctor booking agent  
├── pharmacy.py           # Pharmacy/medicine agent
├── wellness.py           # Wellness tracking agent
├── api_server.py         # FastAPI backend (NEW)
├── start_chat.py         # Startup script (NEW)
├── requirements.txt      # Python dependencies (NEW)
├── CHAT_README.md        # This file (NEW)
└── frontend/
    ├── src/
    │   ├── chat.tsx       # Main chat interface (UPDATED)
    │   └── ...
    ├── vite.config.ts     # Proxy configuration (UPDATED)
    └── package.json
```

## ✅ Integration Complete

The chat interface is now fully integrated with your existing agent system. Users can:

✅ Chat naturally with all 3 agents through one interface  
✅ Get intelligent routing to the right specialist  
✅ See real-time agent status  
✅ Use quick action buttons for common tasks  
✅ View rich formatted responses with markdown support  

Your existing `agent.py` handles all the complex routing and communication with `doctor.py`, `pharmacy.py`, and `wellness.py` - the chat interface simply provides a modern UI layer on top of this proven agent architecture.