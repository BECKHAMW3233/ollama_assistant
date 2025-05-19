// Chat functionality for Ollama Assistant
class ChatManager {
    constructor(modelsManager) {
        this.modelsManager = modelsManager;
        this.messagesContainer = document.getElementById('messages');
        this.inputForm = document.getElementById('chat-form');
        this.userInput = document.getElementById('user-input');
        this.currentModel = null;
        this.conversation = [];
        this.abortController = null;
        
        // Initialize the file manager
        this.fileManager = new FileManager();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Add welcome message
        this.addSystemMessage(SYSTEM_MESSAGES.WELCOME);
    }
    
    initEventListeners() {
        // Form submission
        this.inputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userMessage = this.userInput.value.trim();
            
            if (userMessage) {
                this.sendMessage(userMessage);
                this.userInput.value = '';
            }
        });
    }
    
    async sendMessage(message) {
        // Check if a model is selected
        this.currentModel = this.modelsManager.getCurrentModel();
        if (!this.currentModel) {
            this.addSystemMessage(SYSTEM_MESSAGES.NO_MODEL_SELECTED);
            return;
        }
        
        // Get the active file ID
        const fileId = this.fileManager.getActiveFileId();
        
        // If there's a file, add a note to the user message
        const displayMessage = fileId ? `${message} [with attached file]` : message;
        
        // Add user message to UI
        this.addUserMessage(displayMessage);
        
        // Add to conversation history
        this.conversation.push({ role: 'user', content: displayMessage });
        
        // Get parameters
        const temperature = document.getElementById('temperature')?.value || 0.7;
        const topP = document.getElementById('top-p')?.value || 0.9;
        
        // Create request payload for Ollama API
        const payload = {
            model: this.currentModel,
            prompt: message,
            stream: true,
            fileId: fileId, // Add the file ID if present
            options: {
                temperature: parseFloat(temperature),
                top_p: parseFloat(topP)
            }
        };
        
        console.log('Sending request with payload:', payload);
        
        // Add thinking indicator
        const assistantMessageElement = this.addAssistantMessage('');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<span class="loader"></span>';
        assistantMessageElement.appendChild(loadingIndicator);
        
        // Create a new AbortController for this request
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        
        // Dispatch generation started event
        document.dispatchEvent(new CustomEvent('generation-started'));
        
        try {
            // Send the request to the API
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: signal
            });
            
            // Check if response is successful
            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                const errorData = await response.json();
                throw new Error(errorData.error || `API returned status ${response.status}`);
            }
            
            // Handle the streaming response
            await this.handleStreamingResponse(response, assistantMessageElement);
            
            // Clear the file after successful message
            if (fileId) {
                this.fileManager.removeActiveFile(
                    document.querySelector('.file-info'),
                    document.querySelector('.remove-file-btn')
                );
            }
            
        } catch (error) {
            console.error('Error generating response:', error);
            if (error.name === 'AbortError') {
                assistantMessageElement.textContent = '[Generation stopped]';
            } else {
                assistantMessageElement.textContent = `Error: ${error.message || SYSTEM_MESSAGES.ERROR_GENERATING}`;
                assistantMessageElement.classList.add('error-message');
            }
        } finally {
            // Remove loading indicator
            if (loadingIndicator.parentNode === assistantMessageElement) {
                assistantMessageElement.removeChild(loadingIndicator);
            }
            
            // Dispatch generation ended event
            document.dispatchEvent(new CustomEvent('generation-ended'));
            
            // Clear the AbortController
            this.abortController = null;
        }
    }
    
    async handleStreamingResponse(response, messageElement) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                // Decode the chunk - use stream: true for all but the last chunk
                const chunk = decoder.decode(value, { stream: true });
                
                // Parse the chunk (may contain multiple JSON objects)
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullText += data.response;
                            messageElement.innerHTML = this.formatMessage(fullText);
                            
                            // Scroll to bottom while typing
                            this.scrollToBottom();
                        }
                    } catch (e) {
                        console.warn('Failed to parse JSON:', line, e);
                    }
                }
            }
            
            // Process any final decoding with stream: false
            const finalChunk = decoder.decode();
            if (finalChunk) {
                const lines = finalChunk.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullText += data.response;
                            messageElement.innerHTML = this.formatMessage(fullText);
                        }
                    } catch (e) {
                        // Ignore errors on final chunk
                    }
                }
            }
            
            // Add the response to conversation history
            this.conversation.push({ role: 'assistant', content: fullText });
            
        } catch (error) {
            console.error('Error reading stream:', error);
            throw error;
        }
    }
    
    formatMessage(text) {
        if (!text) return '';
        return Utils.formatMarkdown(text);
    }
    
    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        return messageElement;
    }
    
    addAssistantMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message assistant-message';
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        return messageElement;
    }
    
    addSystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        return messageElement;
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    clearConversation() {
        this.conversation = [];
        this.messagesContainer.innerHTML = '';
        this.addSystemMessage(SYSTEM_MESSAGES.WELCOME);
    }
}
