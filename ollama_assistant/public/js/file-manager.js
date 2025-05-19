// File handling for Ollama Assistant
class FileManager {
    constructor() {
        this.uploadedFiles = [];
        this.activeFile = null;
        
        // Create file upload UI elements
        this.createFileUploadUI();
    }
    
    createFileUploadUI() {
        // Get the chat form to add file upload elements
        const chatForm = document.getElementById('chat-form');
        const userInput = document.getElementById('user-input');
        
        // Create file upload container
        const fileContainer = document.createElement('div');
        fileContainer.className = 'file-upload-container';
        fileContainer.style.display = 'flex';
        fileContainer.style.alignItems = 'center';
        fileContainer.style.marginBottom = '10px';
        
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-upload';
        fileInput.style.display = 'none';
        
        // Create upload button
        const uploadButton = document.createElement('button');
        uploadButton.type = 'button';
        uploadButton.className = 'file-upload-btn';
        uploadButton.innerHTML = '<span>📎</span>';
        uploadButton.title = 'Upload a file';
        uploadButton.style.marginRight = '10px';
        uploadButton.style.width = '40px';
        
        // Create file info display
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.style.display = 'none';
        fileInfo.style.flexGrow = '1';
        fileInfo.style.backgroundColor = '#f0f0f0';
        fileInfo.style.padding = '5px 10px';
        fileInfo.style.borderRadius = '4px';
        fileInfo.style.marginRight = '10px';
        
        // Create remove file button
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-file-btn';
        removeButton.innerHTML = '❌';
        removeButton.title = 'Remove file';
        removeButton.style.display = 'none';
        removeButton.style.marginRight = '10px';
        removeButton.style.width = '40px';
        removeButton.style.backgroundColor = 'transparent';
        removeButton.style.border = 'none';
        removeButton.style.cursor = 'pointer';
        
        // Add elements to container
        fileContainer.appendChild(fileInput);
        fileContainer.appendChild(uploadButton);
        fileContainer.appendChild(fileInfo);
        fileContainer.appendChild(removeButton);
        
        // Insert the file container before the user input
        chatForm.insertBefore(fileContainer, userInput);
        
        // Event listeners
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', async (e) => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                await this.uploadFile(file, fileInfo, removeButton);
            }
        });
        
        removeButton.addEventListener('click', () => {
            this.removeActiveFile(fileInfo, removeButton);
        });
    }
    
    async uploadFile(file, fileInfoElement, removeButton) {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            // Upload the file
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }
            
            const fileData = await response.json();
            
            // Add to uploaded files list
            this.uploadedFiles.push(fileData);
            
            // Set as active file
            this.activeFile = fileData;
            
            // Update UI
            fileInfoElement.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
            fileInfoElement.style.display = 'block';
            removeButton.style.display = 'block';
            
            console.log(`File uploaded: ${file.name}, ID: ${fileData.id}`);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Error uploading file: ${error.message}`);
        }
    }
    
    removeActiveFile(fileInfoElement, removeButton) {
        this.activeFile = null;
        fileInfoElement.style.display = 'none';
        removeButton.style.display = 'none';
        fileInfoElement.textContent = '';
    }
    
    getActiveFileId() {
        return this.activeFile?.id || null;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
