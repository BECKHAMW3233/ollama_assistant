import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import multer from 'multer';
import { createReadStream } from 'fs';

// Load environment variables
dotenv.config();

// ES module equivalents of __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configure file upload with increased size limit
const upload = multer({
    dest: path.join(__dirname, 'uploads'),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enable CORS
app.use(cors());

// Parse JSON bodies with increased limit
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Set longer timeout for large responses
app.use((req, res, next) => {
    res.setTimeout(600000); // 10 minutes
    next();
});

// Add cross-platform path handling for WSL
app.use((req, res, next) => {
    if (req.body && req.body.fileId) {
        // Convert Windows paths to WSL paths if needed
        const filePath = req.body.fileId;
        if (typeof filePath === 'string' && filePath.match(/^[A-Z]:\\/)) {
            // It's a Windows path, convert it
            req.body.fileId = filePath.replace(/^([A-Z]):\\/, '/mnt/$1/').replace(/\\/g, '/');
        }
    }
    next();
});

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`File uploaded: ${req.file.originalname}`);
    
    // Return file info
    res.json({
        filename: req.file.originalname,
        filepath: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        id: req.file.filename // This is the unique ID multer assigns
    });
});

// Get uploaded file by ID
app.get('/api/files/:id', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.id);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    // Create a readable stream and pipe to response
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
});

// Get file content as text
app.get('/api/files/:id/content', async (req, res) => {
    const filePath = path.join(uploadsDir, req.params.id);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content });
    } catch (error) {
        console.error("Error reading file:", error);
        res.status(500).json({ error: 'Failed to read file content' });
    }
});

// List all uploaded files
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir)
            .filter(file => fs.statSync(path.join(uploadsDir, file)).isFile())
            .map(file => {
                const stats = fs.statSync(path.join(uploadsDir, file));
                return {
                    id: file,
                    size: stats.size,
                    created: stats.ctime
                };
            });
            
        res.json({ files });
    } catch (error) {
        console.error("Error listing files:", error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Get models
app.get('/api/tags', async (req, res) => {
    try {
        console.log(`Getting models from ${OLLAMA_URL}/api/tags`);
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            timeout: 30000 // 30 second timeout
        });
        const data = await response.json();
        console.log(`Found ${data.models?.length || 0} models`);
        res.json(data);
    } catch (error) {
        console.error("Error getting models:", error);
        res.status(500).json({ error: error.message });
    }
});

// Direct API routes for testing
app.get('/test-api', async (req, res) => {
    try {
        console.log(`Testing API connection to ${OLLAMA_URL}/api/tags`);
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            timeout: 30000 // 30 second timeout
        });
        if (!response.ok) {
            throw new Error(`API test returned: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Test API found ${data.models?.length || 0} models`);
        res.json(data);
    } catch (error) {
        console.error("Test API error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get ngrok URL
app.get('/get-ngrok-url', async (req, res) => {
    try {
        const logFile = path.join(logsDir, 'server.log');
        if (fs.existsSync(logFile)) {
            const logs = fs.readFileSync(logFile, 'utf8');
            const match = logs.match(/Ollama Assistant accessible externally at: (https:\/\/[^\s]+)/);
            if (match && match[1]) {
                return res.json({ url: match[1] });
            }
        }
        res.json({ url: null, message: 'No ngrok URL found in logs' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple proxy for generate with file handling
app.post('/api/generate', async (req, res) => {
    console.log(`Generate request for model: ${req.body.model}`);
    
    try {
        let prompt = req.body.prompt;
        
        // If there's a file reference, append its content to the prompt
        if (req.body.fileId) {
            const filePath = path.join(uploadsDir, req.body.fileId);
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                prompt = `${prompt}\n\nFile content:\n${fileContent}`;
                console.log(`Appended file content to prompt, new length: ${prompt.length}`);
            } else {
                console.warn(`File not found: ${req.body.fileId}`);
            }
        }
        
        // Create a new payload with the possibly modified prompt and optimized parameters
        const payload = {
            ...req.body,
            prompt,
            stream: true,
            options: {
                ...req.body.options,
                temperature: parseFloat(req.body.options?.temperature || 0.7),
                top_p: parseFloat(req.body.options?.top_p || 0.9),
                num_gpu: 1,
                num_thread: 16,
                gpu_layers: -1, // Use all layers on GPU
                f16: true,      // Use FP16 precision
                seed: 0         // Consistent results (optional)
            }
        };
        
        // Forward the request to Ollama with increased timeout
        const ollama_response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            timeout: 600000 // 10 minute timeout
        });
        
        if (!ollama_response.ok) {
            console.error(`Ollama error: ${ollama_response.status} ${ollama_response.statusText}`);
            return res.status(ollama_response.status).json({ 
                error: `Ollama API error: ${ollama_response.statusText}` 
            });
        }
        
        // Set up response headers for streaming
        res.setHeader('Content-Type', 'application/json');
        
        // Simple way: pipe the response
        ollama_response.body.pipe(res);
    } catch (error) {
        console.error("Generate error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// GPU info endpoint
app.get('/gpu-info', async (req, res) => {
    try {
        // Simple proxy to Ollama API
        const response = await fetch(`${OLLAMA_URL}/api/show`, {
            method: 'GET',
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error getting GPU info:", error);
        res.status(500).json({ error: error.message });
    }
});

// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const server = app.listen(PORT, async () => {
    console.log(`⚡️ Server running at http://localhost:${PORT}`);
    console.log(`📡 API target: ${OLLAMA_URL}`);
    
    // Try to start ngrok
    try {
        console.log("Starting ngrok...");
        // Use dynamic import for ngrok
        const ngrokModule = await import('ngrok');
        
        // Kill any existing ngrok processes (this won't work in all environments)
        try {
            console.log("Attempting to clean up any existing ngrok processes...");
            const { exec } = await import('child_process');
            exec('pkill -f ngrok', (error) => {
                // We don't care about errors here, just trying to clean up
                if (!error) console.log("Successfully killed existing ngrok processes");
            });
        } catch (err) {
            console.log("Could not kill existing ngrok processes, continuing anyway");
        }
        
        // Set the auth token - this is an important step
        console.log("Setting ngrok auth token...");
        await ngrokModule.default.authtoken('2xAi4zjXf7Kj63EOGjRE3eK5zqv_3a9bh3uGxZgwYz1zamAeo');
                
        // Connect ngrok with more explicit options
        console.log("Connecting ngrok tunnel...");
        const url = await ngrokModule.default.connect({
            addr: PORT,
            region: 'us',
            onStatusChange: (status) => {
                console.log(`Ngrok status changed to: ${status}`);
            },
            onLogEvent: (logEvent) => {
                console.log(`Ngrok log: ${logEvent}`);
            }
        });
        
        console.log(`🌐 Ollama Assistant accessible externally at: ${url}`);
        
        // Save URL to a log file
        const logFile = path.join(logsDir, 'server.log');
        fs.appendFileSync(logFile, `Ollama Assistant accessible externally at: ${url}\n`);
    } catch (error) {
        console.error('Error with ngrok:', error);
        console.log('External access will not be available. Using local access only.');
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
