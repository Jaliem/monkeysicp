![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

# System Overview

Cura is a comprehensive healthcare agent system built on Internet Computer Protocol (ICP) with Fetch.ai agents that provide intelligent healthcare services through multiple specialized microservices.

This project demonstrates a decentralized healthcare ecosystem where multiple Fetch.ai agents collaborate to provide comprehensive medical services. Each agent specializes in a specific healthcare domain and communicates through standardized APIs.

---

## System Architecture

| Service             | Port  | Description                                           |
|---------------------|-------|-------------------------------------------------------|
| Frontend React App  | 3000  | User interface for interacting with all services      |
| Agent Service       | 8000  | Main coordination agent and API gateway               |
| Doctor Service      | 8001  | Handles medical diagnosis, and appointments           |
| Pharmacy Service    | 8002  | Handles prescriptions, medicine lookup, and inventory |
| Wellness Service    | 8003  | Tracks lifestyle data and provides wellness guidance  |

---

## Fetch.ai Agents Configuration

### Agent Details

| Agent Name    | Type           | Address                                                             | Purpose                                               |
|---------------|----------------|---------------------------------------------------------------------|-------------------------------------------------------|
| HealthAgent   | Main Agent     | agent1qv9wjqqwamnrlwv4knwrxkkw035sq7yhgshv6a2zu9ks7k0sndf55kr5ufy   | Coordinates between all healthcare services           |
| DoctorAgent   | Doctor Agent   | agent1qwqyy4k7jfccfuymlvujxefvt3fj2x3qus84mg7nruunr9gmezv6wruawru   | Provides medical diagnosis and make appointment       |
| PharmacyAgent | Pharmacy Agent | agent1q2dlr9x8hkcl5p2dchemnt3utf2h4g05rcpku88rtaulxh33jlgs6spw49c   | Manages medication inventory and prescription         |
| WellnessAgent | Wellness Agent | agent1qg9d9628xnvzdlmexshr5c7mexkekxpavn4yxtn0tums9a6jcg3ygwzatgx   | Offers health monitoring and wellness recommendations |

#### Agent Capabilities

- Multi-agent collaboration through standardized APIs
- Secure communication between healthcare domains
- Intelligent decision-making using Fetch.ai's agent framework
- Scalable architecture for adding new healthcare services

---

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

**How to get required values:**

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


## Need Help?

**Common Issues:**

- **Ports already in use?**  
  Stop other services using ports 3000, 8000-8003.

- **API errors?**  
  Verify your `ASI1_API_KEY` in `.env`.

- **Module errors?**  
  Run `./setup.sh` again.

---

## Reset System

```bash
# Stop services (Ctrl+C), then:
rm -rf venv
./setup.sh
# Update .env and run ./start.sh
```

---

You’re all set! The system should now be running locally.
