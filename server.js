const express = require('express');
const fetch = require('node-fetch'); // For making HTTP requests
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MongoDB Configuration ---
const MONGO_URI = "mongodb+srv://rtmtafita:tafitaniaina1206@rtmchat.pzebpqh.mongodb.net/?retryWrites=true&w=majority&appName=rtmchat";
const mongoClient = new MongoClient(MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectDB() {
    try {
        await mongoClient.connect();
        await mongoClient.db("admin").command({ ping: 1 }); // "admin" db is typical for ping
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        // Example: Assign db instance to a variable for use in routes
        // app.locals.db = mongoClient.db("yourDbName");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        // process.exit(1); // Optionally exit if DB connection is critical
    }
}
connectDB();

// --- API Configuration ---
const WEATHER_API_URL = 'https://kaiz-apis.gleeze.com/api/weather'; // Base URL for weather
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Specific key for Weather API
const GPT4O_API_URL_BASE = 'https://kaiz-apis.gleeze.com/api/gpt-4o'; // Base URL for GPT-4o
const FLUX_API_URL_BASE = 'https://kaiz-apis.gleeze.com/api/flux'; // Base URL for Flux
const KAIZ_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Common key for Kaiz APIs (GPT-4o, Flux, VIP)

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Proxy Endpoints ---

// 1. Weather API Proxy
app.get('/api/weather', async (req, res) => {
    const location = req.query.q || req.query.location || 'antananarivo';
    if (!location) {
        return res.status(400).json({ error: 'Location query parameter is required.' });
    }
    try {
        const apiRes = await fetch(`${WEATHER_API_URL}?q=${encodeURIComponent(location)}&apikey=${WEATHER_API_KEY}`);
        const data = await apiRes.json();
        if (!apiRes.ok) {
            console.error('Weather API Error:', data);
            return res.status(apiRes.status).json(data);
        }
        res.json(data);
    } catch (error) {
        console.error('Error proxying to Weather API:', error);
        res.status(500).json({ error: 'Failed to fetch weather data.', details: error.message });
    }
});

// 2. GPT-4o (AI Chat, Story Generator) Proxy
app.post('/api/chat', async (req, res) => {
    const { ask, uid, webSearch } = req.body;
    if (!ask) {
        return res.status(400).json({ error: 'The "ask" field is required.' });
    }
    try {
        const params = new URLSearchParams({
            ask: ask,
            uid: uid || 'default-chat-uid', // Ensure UID is present
            webSearch: webSearch ? 'on' : 'off',
            apikey: KAIZ_API_KEY
        });
        const apiRes = await fetch(`${GPT4O_API_URL_BASE}?${params.toString()}`, {
            method: 'POST' // API docs imply POST, query params for args
        });

        const data = await apiRes.json();
        if (!apiRes.ok) {
            console.error('GPT-4o API Error:', data);
            return res.status(apiRes.status).json(data);
        }
        res.json(data);
    } catch (error) {
        console.error('Error proxying to GPT-4o API:', error);
        res.status(500).json({ error: 'Failed to communicate with AI service.', details: error.message });
    }
});

// 3. Flux (Image Generator) Proxy
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'The "prompt" field is required.' });
    }
    try {
        const params = new URLSearchParams({
            prompt: prompt,
            apikey: KAIZ_API_KEY
        });
        const apiRes = await fetch(`${FLUX_API_URL_BASE}?${params.toString()}`, {
            method: 'POST' // API docs imply POST for this action
        });

        if (!apiRes.ok) {
            let errorData;
            try { errorData = await apiRes.json(); } catch (e) { errorData = { error: apiRes.statusText }; }
            console.error('Flux API Error:', errorData);
            return res.status(apiRes.status).json(errorData);
        }
        const imageBlob = await apiRes.blob();
        res.type(imageBlob.type);
        imageBlob.arrayBuffer().then(buffer => {
            res.send(Buffer.from(buffer));
        }).catch(err => {
            console.error('Error sending image blob:', err);
            res.status(500).json({ error: 'Failed to process image response.' });
        });
    } catch (error) {
        console.error('Error proxying to Flux API:', error);
        res.status(500).json({ error: 'Failed to generate image.', details: error.message });
    }
});

// 4. VIP Chat Proxy
app.post('/api/vip-chat', async (req, res) => {
    const { model, prompt, uid } = req.body;
    if (!prompt || !model) {
        return res.status(400).json({ error: 'The "model" and "prompt" fields are required.' });
    }
    try {
        const params = new URLSearchParams({
            ask: prompt,
            uid: uid || 'default-vip-uid',
            model: model, // Assuming the API uses 'model' for VIP model selection
            apikey: KAIZ_API_KEY
        });
        // Using GPT4O_API_URL_BASE as the placeholder for VIP models, per previous structure
        const apiRes = await fetch(`${GPT4O_API_URL_BASE}?${params.toString()}`, {
            method: 'POST' // Assuming VIP chat also follows POST with query params
        });
        const data = await apiRes.json();
        if (!apiRes.ok) {
            console.error(`VIP Chat API Error (model: ${model}):`, data);
            return res.status(apiRes.status).json(data);
        }
        res.json(data);
    } catch (error) {
        console.error(`Error proxying to VIP Chat API (model: ${model}):`, error);
        res.status(500).json({ error: `Failed to communicate with ${model} AI service.`, details: error.message });
    }
});

// Fallback for any other request: send index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});
