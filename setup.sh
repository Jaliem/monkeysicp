#!/bin/bash

echo "Setting up MONKEYSICP HealthAgent System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed (for frontend)
if ! command -v node &> /dev/null; then
    echo "WARNING: Node.js is not installed. Frontend won't work."
    echo "Please install Node.js if you want to use the React frontend."
fi

# Create or reactivate virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Using existing virtual environment..."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python requirements
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Setup environment configuration
echo "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    echo "Creating .env template file..."
    cat > .env << EOL
# ICP Configuration - Get from 'dfx deploy backend' output
CANISTER_ID=your_canister_id_here
BASE_URL=http://127.0.0.1:4943

# API Keys - Get from https://asi1.ai/dashboard/api-keys
ASI1_API_KEY=your_actual_api_key_here

# Ngrok Authtoken for public URLs - Get from https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_AUTHTOKEN=your_ngrok_authtoken_here

# Mailbox API Key for agent communication - Get from https://agentverse.ai/
MAILBOX_API_KEY=your_mailbox_api_key_here
EOL
    
    echo ""
    echo "IMPORTANT: Please edit the .env file with your actual values:"
    echo "1. CANISTER_ID and BASE_URL: Get from 'dfx deploy backend' output"
    echo "2. ASI1_API_KEY: Get from https://asi1.ai/dashboard/api-keys"
    echo "3. NGROK_AUTHTOKEN: Get from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "4. MAILBOX_API_KEY: Get from https://agentverse.ai/"
    echo ""
    echo "After updating .env, run ./start.sh to start the system"
else
    echo ".env file already exists. Using existing configuration."
fi

# Install frontend dependencies if package.json exists
if [ -f "frontend/package.json" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "WARNING: frontend/package.json not found. Frontend setup skipped."
fi

echo "Setup complete!"
echo ""
echo "If you haven't already, please update the .env file with your:"
echo "1. cd ic && dfx start --clean --background"
echo "2. CANISTER_ID and BASE_URL from 'dfx deploy backend'"
echo "3. ASI1_API_KEY from https://asi1.ai/dashboard/api-keys"
echo "4. NGROK_AUTHTOKEN from https://dashboard.ngrok.com/get-started/your-authtoken"
echo "5. MAILBOX_API_KEY from https://agentverse.ai/"
echo ""
echo "To start all services:"
echo "1. Run: ./start.sh"

# Make start script executable
chmod +x start.sh