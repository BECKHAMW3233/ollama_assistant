// Utility functions for Ollama Assistant
const Utils = {
    // Format markdown text with basic formatting
    formatMarkdown: function(text) {
        if (!text) return '';
        
        // Replace code blocks
        text = text.replace(/```([\s\S]*?)```/g, function(match, code) {
            return `<pre><code>${code.trim()}</code></pre>`;
        });
        
        // Replace inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Replace bold text
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Replace italic text
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Replace headers
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Replace line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    },
    
    // Save data to localStorage
    saveToLocalStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    // Load data from localStorage
    loadFromLocalStorage: function(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return defaultValue;
        }
    }
};


