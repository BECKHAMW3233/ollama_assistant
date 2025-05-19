#!/bin/bash

# Create working directories
mkdir -p ~/ollama-assistant/logs

# Clear existing log files
echo "" > ~/ollama-assistant/logs/ollama_service.log
echo "" > ~/ollama-assistant/logs/server.log

# Stop any existing processes
echo "Stopping any existing Ollama or Node processes..."
pkill -f ollama 2>/dev/null || true
pkill -f node 2>/dev/null || true
pkill -f ngrok 2>/dev/null || true
sleep 2

# Set environment variables for GPU
echo "Setting environment variables for GPU acceleration..."
export CUDA_VISIBLE_DEVICES=0

# Start Ollama service
echo "Starting Ollama service..."
cd ~
# Check if ollama binary exists
if ! command -v ollama &> /dev/null; then
    echo "Error: Ollama binary not found. Make sure it's installed and in your PATH."
    exit 1
fi

# Start ollama in the background
ollama serve > ~/ollama-assistant/logs/ollama_service.log 2>&1 &
OLLAMA_PID=$!

# Check if process started
if ! ps -p $OLLAMA_PID > /dev/null; then
    echo "Error: Failed to start Ollama service."
    exit 1
fi

echo "Ollama service started with PID: $OLLAMA_PID"
echo "Waiting for Ollama service to initialize..."
sleep 10

# Start web UI
echo "Starting Ollama web UI..."
cd ~/ollama-assistant
npm start > ~/ollama-assistant/logs/server.log 2>&1 &
WEBUI_PID=$!

# Check if process started
if ! ps -p $WEBUI_PID > /dev/null; then
    echo "Error: Failed to start Web UI."
    echo "Check the log file: ~/ollama-assistant/logs/server.log"
    exit 1
fi

echo "Web UI started with PID: $WEBUI_PID"

# Print status information
echo ""
echo "====================================="
echo "Ollama Assistant started successfully"
echo "====================================="
echo "Web UI: http://localhost:3001"
echo "Ollama API: http://localhost:11434"
echo ""
echo "To monitor GPU usage: watch -n 0.5 nvidia-smi"
echo "To start ngrok for external access: cd ~/ollama-assistant && npx ngrok http 3001"
echo "Log files:"
echo "  - Ollama service: ~/ollama-assistant/logs/ollama_service.log"
echo "  - Web UI: ~/ollama-assistant/logs/server.log"
