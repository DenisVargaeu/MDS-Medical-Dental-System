#!/bin/bash

# MDS Startup Script
# This script starts both the backend API and the frontend Electron application.

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping MDS processes..."
    # Kill all background jobs started by this script
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Starting MDS Medical Dental System..."

# Start Backend
echo "[1/2] Starting Backend API..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start Frontend
echo "[2/2] Starting Frontend App..."
cd ../frontend
npm run start

# If the frontend process exits (e.g. app closed), trigger cleanup
cleanup
