#!/bin/bash
# start_ollama_webui.sh
# This script starts the Ollama web UI in WSL

echo "Starting Ollama web UI..."
cd ~/ollama-assistant
npm start > ~/ollama-proxy/logs/server.log 2>&1 &
echo "Ollama web UI started. Log file: ~/ollama-proxy/logs/server.log"
