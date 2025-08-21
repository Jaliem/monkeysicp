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
    if [ -f ".env.example" ]; then
        echo "Copying .env.example to .env..."
        cp .env.example .env
        echo ""
        echo "IMPORTANT: Please edit the .env file with your actual values:"
        echo "1. CANISTER_ID and BASE_URL: Get from 'dfx deploy backend' output"
        echo "2. ASI1_API_KEY: Get from https://asi1.ai/dashboard/api-keys"
        echo ""
        echo "After updating .env, run ./start.sh to start the system"
    else
        echo "Creating .env template file..."
        cat > .env << EOL
# ICP Configuration - Get from 'dfx deploy backend' output
CANISTER_ID=your_canister_id_here
BASE_URL=http://127.0.0.1:4943

# API Keys - Get from https://asi1.ai/dashboard/api-keys
ASI1_API_KEY=your_actual_api_key_here
EOL
        echo "Please edit the .env file with your actual values before running start.sh"
    fi
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
echo "1. CANISTER_ID and BASE_URL from 'dfx deploy backend'"
echo "2. ASI1_API_KEY from https://asi1.ai/dashboard/api-keys"
echo ""
echo "To start all services:"
echo "1. Run: ./start.sh"
echo "2. Open http://localhost:3000 for frontend"
echo "3. APIs will be available on ports 8000-8003"

# Make start script executable
chmod +x start.sh