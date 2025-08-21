#!/bin/bash

# Activate virtual environment and run the health agent
echo "Activating virtual environment..."
source venv/bin/activate

echo "Starting HealthAgent..."
cd fetch
python agent.py