// Model management for Ollama Assistant
class ModelsManager {
    constructor() {
        this.modelSelect = document.getElementById('model-select');
        this.modelInfo = document.getElementById('model-info');
        this.models = [];
        this.currentModel = null;
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Model selection change
        this.modelSelect.addEventListener('change', () => {
            const selectedModel = this.modelSelect.value;
            this.setCurrentModel(selectedModel);
        });
    }
    
    async init() {
        // Load available models
        await this.loadModels();
        
        // Try to restore previously selected model
        const savedModel = Utils.loadFromLocalStorage('currentModel');
        if (savedModel && this.models.find(model => model.name === savedModel)) {
            this.setCurrentModel(savedModel);
        } else if (this.models.length > 0) {
            // Default to first model
            this.setCurrentModel(this.models[0].name);
        }
    }
    
    async loadModels() {
        // Show loading indicator
        this.modelSelect.innerHTML = `<option value="" disabled selected>Loading models...</option>`;
        
        try {
            console.log("Fetching models from test-api endpoint...");
            const response = await fetch('/test-api');
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Models data:", data);
            
            if (data && data.models) {
                this.models = data.models;
                console.log(`Found ${this.models.length} models`);
            } else {
                this.models = [];
                console.warn("No models found in API response");
            }
            
            // Update model select
            this.updateModelSelect();
            
        } catch (error) {
            console.error('Error loading models:', error);
            this.modelSelect.innerHTML = `<option value="" disabled selected>Error loading models</option>`;
        }
    }
    
    updateModelSelect() {
        // Clear select
        this.modelSelect.innerHTML = '';
        
        if (this.models.length === 0) {
            // No models found
            this.modelSelect.innerHTML = `<option value="" disabled selected>No models available</option>`;
            return;
        }
        
        // Add option for each model
        this.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            this.modelSelect.appendChild(option);
        });
    }
    
    setCurrentModel(modelName) {
        this.currentModel = modelName;
        this.modelSelect.value = modelName;
        
        // Find model info
        const model = this.models.find(m => m.name === modelName);
        
        // Update model info display
        if (model) {
            const sizeGB = (model.size / (1024 * 1024 * 1024)).toFixed(2);
            this.modelInfo.textContent = `Size: ${sizeGB} GB`;
        } else {
            this.modelInfo.textContent = '';
        }
        
        // Save to localStorage
        Utils.saveToLocalStorage('currentModel', modelName);
        
        // Dispatch model changed event
        document.dispatchEvent(new CustomEvent('model-changed', { 
            detail: { model: modelName }
        }));
    }
    
    getCurrentModel() {
        return this.currentModel;
    }
}
