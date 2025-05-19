// Main application entry point 
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize modules
    const modelsManager = new ModelsManager();
    await modelsManager.init();
    
    const chatManager = new ChatManager(modelsManager);
    
    // Configure buttons
    const parametersToggle = document.getElementById('parameters-toggle');
    const parametersPanel = document.getElementById('parameters-panel');
    const modelGuideToggle = document.getElementById('model-guide-toggle');
    const modelGuidePanel = document.getElementById('model-guide-panel');
    const clearButton = document.getElementById('clear-conversation');
    const stopButton = document.getElementById('stop-generation');
    
    // Toggle parameters panel
    parametersToggle.addEventListener('click', () => {
        parametersPanel.classList.toggle('hidden');
        // Hide model guide panel when parameters panel is shown
        if (!parametersPanel.classList.contains('hidden')) {
            modelGuidePanel.classList.add('hidden');
        }
    });
    
    // Toggle model guide panel
    modelGuideToggle.addEventListener('click', () => {
        modelGuidePanel.classList.toggle('hidden');
        // Hide parameters panel when model guide panel is shown
        if (!modelGuidePanel.classList.contains('hidden')) {
            parametersPanel.classList.add('hidden');
        }
    });
    
    // Configure clear conversation button
    clearButton.addEventListener('click', () => chatManager.clearConversation());
    
    // Configure stop generation button
    stopButton.addEventListener('click', () => {
        if (chatManager.abortController) {
            chatManager.abortController.abort();
        }
    });
    
    // Listen for generation state changes
    document.addEventListener('generation-started', () => {
        stopButton.style.display = 'inline-block';
    });
    
    document.addEventListener('generation-ended', () => {
        stopButton.style.display = 'none';
    });
    
    // Listen for model changes
    document.addEventListener('model-changed', (event) => {
        console.log(`Model changed to: ${event.detail.model}`);
        
        // Clear any error messages when a model is selected
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(message => {
            message.remove();
        });
        
        // Highlight the matching model card if found
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            const cardTitle = card.querySelector('h4').textContent;
            const modelName = event.detail.model;
            
            // Remove any previous highlights
            card.style.border = '';
            
            // Check if this card matches the selected model
            if (cardTitle.toLowerCase().includes(modelName.toLowerCase())) {
                card.style.border = '2px solid var(--primary-color)';
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });
    
    // Handle dark mode toggle
    const darkModeCheckbox = document.getElementById('dark-mode-checkbox');
    darkModeCheckbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', darkModeCheckbox.checked);
        localStorage.setItem('darkMode', darkModeCheckbox.checked ? 'enabled' : 'disabled');
    });
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        darkModeCheckbox.checked = true;
        document.body.classList.add('dark-mode');
    }
});
