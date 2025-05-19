// models-guide.js - Handle model guide functionality
document.addEventListener('DOMContentLoaded', () => {
    // Configure sample prompt clicks
    const samplePrompts = document.querySelectorAll('.model-card ul li');
    samplePrompts.forEach(promptElement => {
        promptElement.style.cursor = 'pointer';
        promptElement.title = 'Click to use this prompt';
        promptElement.addEventListener('click', () => {
            const userInput = document.getElementById('user-input');
            const prompt = promptElement.textContent.replace(/^"(.+)"$/, '$1'); // Remove quotes
            userInput.value = prompt;
            userInput.focus();
            
            // Hide the model guide panel
            document.getElementById('model-guide-panel').classList.add('hidden');
        });
    });
    
    // Listen for model changes to highlight the current model card
    document.addEventListener('model-changed', (event) => {
        const modelName = event.detail.model;
        const modelCards = document.querySelectorAll('.model-card');
        
        modelCards.forEach(card => {
            // Remove any previous highlighting
            card.style.border = '';
            
            // Check if this card matches the selected model
            const cardTitle = card.querySelector('h4').textContent.toLowerCase();
            if (cardTitle.includes(modelName.toLowerCase())) {
                card.style.border = '2px solid var(--primary-color)';
                
                // Scroll the card into view if the model guide is visible
                const modelGuidePanel = document.getElementById('model-guide-panel');
                if (!modelGuidePanel.classList.contains('hidden')) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        });
    });
});
