#!/bin/bash

echo "=== Ollama Assistant Starter ==="
echo "This script will start both Ollama service and web UI"
echo "Press Ctrl+C to exit"
echo ""

# Create logs directory
mkdir -p ~/ollama-assistant/logs

# Check for running processes and stop them
echo "Checking for running processes..."
pkill -f ollama 2>/dev/null || echo "No Ollama processes found"
pkill -f "node.*server.js" 2>/dev/null || echo "No Node server processes found"
sleep 2

# Set GPU variables
export CUDA_VISIBLE_DEVICES=0
echo "Set GPU device to: $CUDA_VISIBLE_DEVICES"

# Start Ollama in background
echo "Starting Ollama service..."
ollama serve > ~/ollama-assistant/logs/ollama_service.log 2>&1 &
OLLAMA_PID=$!
echo "Ollama started with PID: $OLLAMA_PID"

# Wait for Ollama to initialize
echo "Waiting for Ollama to initialize (10 seconds)..."
sleep 10

# Start web UI in foreground to keep terminal open
echo "Starting Ollama web UI..."
echo "The UI will be available at: http://localhost:3001"
echo "=== Server output will appear below (Ctrl+C to stop) ==="
cd ~/ollama-assistant && node server.js
