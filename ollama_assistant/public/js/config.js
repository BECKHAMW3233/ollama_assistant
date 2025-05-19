// Configuration settings for Ollama Assistant
const CONFIG = {
    OLLAMA_API_URL: '/api', // Proxied API URL
    DEFAULT_MODEL: '', // Will be set when models are loaded
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_TOP_P: 0.9
};

// System messages
const SYSTEM_MESSAGES = {
    WELCOME: 'Welcome to Ollama Assistant! Select a model to begin.',
    NO_MODEL_SELECTED: 'Please select a model first.',
    ERROR_GENERATING: 'Error generating response. Please try again.',
    LOADING_MODELS: 'Loading available models...',
    NO_MODELS_FOUND: 'No models found. Please run "ollama pull [model]" to download a model.',
    CONNECTION_ERROR: 'Could not connect to Ollama API. Please ensure Ollama is running.'
};
