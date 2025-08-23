#!/bin/bash
echo "Starting HealthAgent System..."

# Function to find Python executable
find_python() {
    if command -v python &> /dev/null; then
        echo "python"
    elif command -v python3 &> /dev/null; then
        echo "python3"
    else
        echo "ERROR: Neither python nor python3 is available. Please install Python."
        exit 1
    fi
}

# Get Python command
PYTHON_CMD=$(find_python)

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "ERROR: Virtual environment not found. Please run ./setup.sh first."
    exit 1
fi

# Check if .env file exists and is configured
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found. Please run ./setup.sh first to create it."
    exit 1
fi

# Validate that API key is set (not the example value)
if grep -q "your_actual_api_key_here" .env || grep -q "your_canister_id_here" .env; then
    echo "Please cd ic && dfx start --clean --background"
    echo "ERROR: Please update your .env file with actual values:"
    echo "2. Get CANISTER_ID and BASE_URL from 'dfx deploy backend' output"
    echo "3. Get ASI1_API_KEY from https://asi1.ai/dashboard/api-keys"
    exit 1
fi

# Load environment variables
echo "Loading environment variables from .env file"
export $(grep -v '^#' .env | xargs)

# Validate required environment variables
if [ -z "$ASI1_API_KEY" ] || [ -z "$CANISTER_ID" ] || [ -z "$BASE_URL" ]; then
    echo "ERROR: Missing required environment variables in .env file"
    echo "Please ensure ASI1_API_KEY, CANISTER_ID, and BASE_URL are set"
    exit 1
fi

cd fetch

# Activate venv
source venv/bin/activate

echo "Starting Agent service on port 8000..."
$PYTHON_CMD agent.py &
AGENT_PID=$!
sleep 2

echo "Starting Doctor service on port 8001..."
$PYTHON_CMD doctor.py &
DOCTOR_PID=$!
sleep 1

echo "Starting Pharmacy service on port 8002..."
$PYTHON_CMD pharmacy.py &
PHARMACY_PID=$!
sleep 1

echo "Starting Wellness service on port 8003..."
$PYTHON_CMD wellness.py &
WELLNESS_PID=$!
sleep 2

# Start frontend with npm run dev (development server)
echo "Starting Frontend (React) with npm run dev..."
cd ../frontend

# Check if package.json exists and start the dev server
if [ -f "package.json" ]; then
    # Use npm run dev if available, otherwise fall back to npm start
    if grep -q "\"dev\":" package.json; then
        npm run dev &
    else
        npm start &
    fi
    FRONTEND_PID=$!
    echo "Frontend development server starting on http://localhost:3000"
else
    echo "ERROR: frontend/package.json not found. Frontend not started."
    FRONTEND_PID=""
fi

cd ../fetch

echo ""
echo "All services are now starting!"
echo "Frontend: http://localhost:3000 (may take a moment to start)"
echo "Agent API: http://localhost:8000"
echo "Doctor API: http://localhost:8001"
echo "Pharmacy API: http://localhost:8002"
echo "Wellness API: http://localhost:8003"
echo ""
echo "Environment loaded:"
echo "CANISTER_ID: $CANISTER_ID"
echo "BASE_URL: $BASE_URL"
echo "ASI1_API_KEY: ${ASI1_API_KEY:0:10}..."
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
if [ -n "$FRONTEND_PID" ]; then
    trap 'kill $AGENT_PID $DOCTOR_PID $PHARMACY_PID $WELLNESS_PID $FRONTEND_PID 2>/dev/null; echo ""; echo "All services stopped."; exit 0' INT
else
    trap 'kill $AGENT_PID $DOCTOR_PID $PHARMACY_PID $WELLNESS_PID 2>/dev/null; echo ""; echo "All services stopped."; exit 0' INT
fi

wait