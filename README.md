# 🏥 Cura. - Healthcare Agent System

A comprehensive healthcare system built with React frontend, ICP blockchain backend, and AI-powered agents for personalized health management.

## 🚀 Quick Start

### 1. Install Agent Dependencies
```bash
cd fetch
pip install -r requirements.txt
```

### 2. Configure Agentverse API
```bash
cd fetch
python setup_agentverse.py
```

### 3. Start Agent System
```bash
python start_agentverse.py
```

This starts:
- **HealthAgent** - Main coordination agent
- **DoctorAgent** - Appointment booking
- **PharmacyAgent** - Medicine queries
- **WellnessAgent** - Health data tracking
- **Agentverse API Bridge** - Cloud agent communication

### 4. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Deploy ICP Backend (Optional)
```bash
cd ic
dfx start --clean
dfx deploy
```

## 🏗️ Architecture

```
React Frontend (localhost:5173)
           ↓ HTTP requests
   Agentverse API Bridge
           ↓ Cloud API calls
     HealthAgent (Cloud)
           ↓ Inter-agent communication
    ┌─────────────┬─────────────┬─────────────┐
    │             │             │             │
DoctorAgent  PharmacyAgent  WellnessAgent  ICP Backend
  (Cloud)      (Cloud)      (Cloud)     (Blockchain)
```

## ✨ Features

### 🏥 Complete Healthcare Dashboard
- **Wellness Tracking**: Sleep, steps, water, mood, exercise logging
- **Doctor Booking**: Search specialists, book appointments
- **Pharmacy**: Medicine search, prescription management, online ordering
- **Health Profile**: Personal info, medical history, preferences
- **AI Chat**: Natural language health assistance

### 🤖 AI-Powered Agents
- **Natural Language Processing**: ASI1 LLM for intent classification
- **Real-time Communication**: Event-driven agent architecture
- **Request Correlation**: UUID-based request/response tracking
- **Error Handling**: Graceful fallbacks and timeout management

### 🔐 Security & Privacy
- **ICP Blockchain**: Secure health data storage
- **Internet Identity**: Decentralized authentication
- **End-to-end Encryption**: Private health information
- **GDPR Compliant**: Privacy controls and data management

## 🎯 Usage Examples

### Wellness Tracking
```
"I slept 8 hours and walked 5000 steps today"
→ WellnessAgent processes and stores to ICP blockchain
```

### Doctor Appointments
```
"I need to see a cardiologist next week"
→ DoctorAgent searches and books appointment
```

### Medicine Queries
```
"Do you have paracetamol in stock?"
→ PharmacyAgent checks availability and pricing
```

## 📁 Project Structure

```
monkeysicp/
├── fetch/                    # Agent system
│   ├── agent.py             # Main HealthAgent
│   ├── doctor.py            # Doctor booking agent
│   ├── pharmacy.py          # Medicine agent
│   ├── wellness.py          # Health tracking agent
│   ├── agentverse_bridge.py # API integration
│   └── AGENTVERSE_GUIDE.md  # Setup documentation
├── frontend/                # React UI
│   ├── src/
│   │   ├── chat.tsx         # AI chat interface
│   │   ├── wellness.tsx     # Wellness dashboard
│   │   ├── doctor.tsx       # Doctor booking
│   │   ├── pharmacy.tsx     # Medicine search
│   │   └── profile.tsx      # Health profile
│   └── package.json
└── ic/                      # ICP blockchain
    └── src/backend/         # Motoko canisters
```

## 🔧 Configuration

### Agentverse API Setup
1. Get API key from [Agentverse](https://agentverse.ai)
2. Configure in `setup_agentverse.py`
3. Deploy agents to cloud or run locally

### Environment Variables
```bash
# Frontend
VITE_API_BASE_URL=http://localhost:8080
VITE_ICP_HOST=http://localhost:4943

# Agents
ASI1_API_KEY=your_asi1_key
AGENTVERSE_API_KEY=your_agentverse_key
```

## 🔒 Privacy & Compliance

- **HIPAA Aligned**: Healthcare data protection standards
- **Decentralized Storage**: User controls their data via ICP
- **Anonymous Options**: Privacy-first health tracking
- **Audit Trail**: Blockchain-based access logging

## 🚀 Deployment

### Production Setup
1. Deploy ICP canisters to mainnet
2. Deploy agents to Agentverse cloud
3. Configure production frontend with environment variables
4. Set up monitoring and alerting

### Cloud Integration
- **Agentverse**: AI agent hosting and management
- **ICP Mainnet**: Production blockchain deployment
- **CDN**: Frontend asset distribution

## 📊 Monitoring

Check system health:
```bash
# Agent status
curl http://localhost:8080/health

# Frontend build
npm run build

# ICP canister status
dfx canister status --all
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes following code style
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Fetch.ai Agents, ICP Blockchain, and React**

*Empowering personalized healthcare through AI and blockchain technology.*