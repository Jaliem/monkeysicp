# Quick Start Guide

This guide will help you set up and run the system on your local machine.

---

## Step 1: Initial Setup

```bash
# Make scripts executable
chmod +x setup.sh start.sh

# Run the automated setup
./setup.sh
```

---

## Step 2: Configure Environment

Edit the generated `.env` file with your actual values:

```env
# ICP Configuration - Get from 'dfx deploy backend' output
CANISTER_ID=your_actual_canister_id_here
BASE_URL=http://127.0.0.1:4943

# API Keys - Get from https://asi1.ai/dashboard/api-keys
ASI1_API_KEY=your_actual_api_key_here
```

🔧 **How to get required values:**

- **For CANISTER_ID & BASE_URL:**
  ```bash
  cd ic
  dfx start --clean --background
  dfx deploy
  # Note the canister ID and URL from deployment output
  ```

- **For ASI1_API_KEY:**
  - Visit: [https://asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys)
  - Create or copy your API key

---

## Step 3: Launch the System

```bash
# Start all services
./start.sh
```

---

## 🌐 Access Points

Once running, access your services at:

- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Agent API: [http://localhost:8000](http://localhost:8000)
- Doctor API: [http://localhost:8001](http://localhost:8001)
- Pharmacy API: [http://localhost:8002](http://localhost:8002)
- Wellness API: [http://localhost:8003](http://localhost:8003)

---

## ⚡ Need Help?

**Common Issues:**

- **Ports already in use?**  
  Stop other services using ports 3000, 8000-8003.

- **API errors?**  
  Verify your `ASI1_API_KEY` in `.env`.

- **Module errors?**  
  Run `./setup.sh` again.

---

## 🔄 Reset System

```bash
# Stop services (Ctrl+C), then:
rm -rf venv
./setup.sh
# Update .env and run ./start.sh
```

---

✅ You’re all set! The system should now be running locally.