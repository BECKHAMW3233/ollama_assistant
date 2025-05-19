#!/bin/bash
# start_ollama_service.sh
# This script starts the Ollama service in WSL

echo "Starting Ollama service..."
ollama serve > ~/ollama-proxy/logs/ollama_service.log 2>&1 &
echo "Ollama service started. Log file: ~/ollama-proxy/logs/ollama_service.log"
