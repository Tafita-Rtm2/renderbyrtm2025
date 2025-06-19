const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// API Keys
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CHAT_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const IMAGE_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';

// MongoDB Connection
const mongoUri = "mongodb+srv://rtmtafita:tafitaniaina1206@rtmchat.pzebpqh.mongodb.net/?retryWrites=true&w=majority&appName=rtmchat";
const client = new MongoClient(mongoUri);

let portfolioDb;
let commentsCollection;

async function connectDB() {
    try {
        await client.connect();
        portfolioDb = client.db("portfolioDb");
        commentsCollection = portfolioDb.collection("comments");
        console.log("Successfully connected to MongoDB Atlas!");
        await commentsCollection.createIndex({ createdAt: -1 });
        console.log("Indexes ensured for comments collection.");
    } catch (err) {
        console.error("Failed to connect to MongoDB Atlas or ensure indexes", err);
        process.exit(1);
    }
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


// --- Weather API Route ---
app.get('/api/weather', async (req, res) => { /* ... existing unchanged code ... */
    const location = req.query.location;
    if (!location) { return res.status(400).json({ error: 'Location query parameter is required' }); }
    const weatherApiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${WEATHER_API_KEY}`;
    try {
        const apiResponse = await fetch(weatherApiUrl);
        if (!apiResponse.ok) {
            let errorText = `External API Error: ${apiResponse.status} ${apiResponse.statusText}`;
            try { const errorBody = await apiResponse.json(); if (errorBody && errorBody.message) errorText = `External API Error: ${errorBody.message}`; else if (typeof errorBody === 'string' && errorBody.length > 0) errorText = `External API Error: ${errorBody}`; } catch (e) { /* ignore */ }
            return res.status(apiResponse.status).json({ error: errorText, details: `Failed to fetch weather for ${location}` });
        }
        const data = await apiResponse.json();
        if (data && data["0"]) { res.json(data["0"]); }
        else { return res.status(500).json({ error: 'Unexpected response structure from weather API.' }); }
    } catch (error) {
        console.error('Server error while fetching weather:', error);
        return res.status(500).json({ error: 'Failed to fetch weather data due to server error.' });
    }
});

// --- AI Chat API Route ---
app.post('/api/chat', async (req, res) => { /* ... existing unchanged code ... */
    const { ask, uid, webSearch } = req.body;
    if (!ask || !uid) { return res.status(400).json({ error: 'Parameters "ask" and "uid" are required.' }); }
    const webSearchParam = (webSearch === true || String(webSearch).toLowerCase() === 'on') ? 'on' : 'off';
    const chatApiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${webSearchParam}&apikey=${CHAT_API_KEY}`;
    try {
        const apiResponse = await fetch(chatApiUrl);
        const responseText = await apiResponse.text();
        if (!apiResponse.ok) {
            let errorJson = { error: `External Chat API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if (!errorJson.error && !errorJson.message) { errorJson.error = `External Chat API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); } catch (e) { return res.status(500).json({ error: 'Failed to parse response from Chat API.', details: responseText }); }
        if (data && data.response) { res.json({ author: data.author || "Kaizenji", response: data.response }); }
        else { return res.status(500).json({ error: 'Unexpected response structure from Chat API.', details: data }); }
    } catch (error) {
        console.error('Server error while calling Chat API:', error);
        return res.status(500).json({ error: 'Server error while processing chat request.' });
    }
});

// --- Image Generation API Route ---
app.post('/api/generate-image', async (req, res) => { /* ... existing unchanged code ... */
    const { prompt } = req.body;
    if (!prompt) { return res.status(400).json({ error: 'Parameter "prompt" is required.' }); }
    const imageApiUrl = `https://kaiz-apis.gleeze.com/api/flux?prompt=${encodeURIComponent(prompt)}&apikey=${IMAGE_API_KEY}`;
    try {
        const apiResponse = await fetch(imageApiUrl);
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            try { const errorJson = JSON.parse(errorText); return res.status(apiResponse.status).json(errorJson); }
            catch (e) { return res.status(apiResponse.status).json({ error: `Image API Error: ${apiResponse.statusText}`, details: errorText }); }
        }
        const contentType = apiResponse.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        const imageBuffer = await apiResponse.buffer();
        res.send(imageBuffer);
    } catch (error) {
        console.error('Server error while calling Image API:', error);
        return res.status(500).json({ error: 'Server error while processing image generation request.' });
    }
});

// DELETE /api/comments/:commentId - Delete a comment
app.delete('/api/comments/:commentId', async (req, res) => {
    if (!commentsCollection) {
        return res.status(503).json({ error: "Database not connected. Please try again later." });
    }
    try {
        const { commentId } = req.params;
        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: "Invalid comment ID format." });
        }
        const mongoDbCommentId = new ObjectId(commentId);

        const result = await commentsCollection.deleteOne({ _id: mongoDbCommentId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Comment not found." });
        }

        res.status(200).json({ message: "Comment deleted successfully.", deletedCount: result.deletedCount });

    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Failed to delete comment due to server error." });
    }
});


// --- New Comment Routes (Phase 4B) ---

// POST /api/comments - Add a new comment
app.post('/api/comments', async (req, res) => {
    if (!commentsCollection) {
        return res.status(503).json({ error: "Database not connected. Please try again later." });
    }
    try {
        const { name, text } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Name is required and must be a non-empty string.' });
        }
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required and must be a non-empty string.' });
        }

        const newComment = {
            name: name.trim(),
            text: text.trim(),
            createdAt: new Date()
        };

        const result = await commentsCollection.insertOne(newComment);
        // result.ops is deprecated, result.insertedId is preferred for single insert
        // To return the full document, you might need to fetch it or construct it if insertOne doesn't return it directly in your driver version.
        // However, newComment already has all fields except _id, which is in result.insertedId
        const createdComment = { _id: result.insertedId, ...newComment };

        res.status(201).json(createdComment);

    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ error: "Failed to post comment due to server error." });
    }
});

// GET /api/comments - Fetch all comments
app.get('/api/comments', async (req, res) => {
    if (!commentsCollection) {
        return res.status(503).json({ error: "Database not connected. Please try again later." });
    }
    try {
        const comments = await commentsCollection.find({})
                                             .sort({ createdAt: -1 }) // Sort by newest first
                                             .toArray();
        res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments due to server error." });
    }
});


// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server after DB connection
async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();
