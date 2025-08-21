#!/bin/bash

# Start Frontend React App

echo "⚛️  Starting Frontend React App..."

# Navigate to frontend directory
cd frontend

# Install npm dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting frontend on http://localhost:5173"
echo "🔗 Make sure backend is running on http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop the development server"
echo ""

# Start the development server
npm run dev