const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Keys - In a real app, use environment variables!
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CHAT_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Same key as per user's info

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware to parse JSON request bodies

// --- Existing Weather API Route ---
app.get('/api/weather', async (req, res) => {
    const location = req.query.location;
    if (!location) {
        return res.status(400).json({ error: 'Location query parameter is required' });
    }
    const weatherApiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${WEATHER_API_KEY}`;
    try {
        const apiResponse = await fetch(weatherApiUrl);
        if (!apiResponse.ok) {
            let errorText = `External API Error: ${apiResponse.status} ${apiResponse.statusText}`;
            try { const errorBody = await apiResponse.json(); if (errorBody && errorBody.message) errorText = `External API Error: ${errorBody.message}`; else if (typeof errorBody === 'string' && errorBody.length > 0) errorText = `External API Error: ${errorBody}`; } catch (e) { /* ignore */ }
            console.error(`Error fetching from weather API for ${location}: ${apiResponse.status} ${apiResponse.statusText}`);
            return res.status(apiResponse.status).json({ error: errorText, details: `Failed to fetch weather for ${location}` });
        }
        const data = await apiResponse.json();
        if (data && data["0"]) {
            res.json(data["0"]);
        } else {
            console.error('Unexpected response structure from weather API:', data);
            res.status(500).json({ error: 'Unexpected response structure from weather API.' });
        }
    } catch (error) {
        console.error('Server error while fetching weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data due to server error.' });
    }
});

// --- New AI Chat API Route (Phase 2B) ---
app.post('/api/chat', async (req, res) => {
    const { ask, uid, webSearch } = req.body;

    if (!ask || !uid) {
        return res.status(400).json({ error: 'Parameters "ask" and "uid" are required.' });
    }

    // Validate webSearch parameter: API expects 'on' or 'off'
    const webSearchParam = (webSearch === true || String(webSearch).toLowerCase() === 'on') ? 'on' : 'off';

    const chatApiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${webSearchParam}&apikey=${CHAT_API_KEY}`;

    try {
        const apiResponse = await fetch(chatApiUrl);
        const responseText = await apiResponse.text(); // Read as text first for better error diagnosis

        if (!apiResponse.ok) {
            console.error(`Error fetching from Chat API for user ${uid}: ${apiResponse.status} ${apiResponse.statusText}. Response: ${responseText}`);
            // Try to parse as JSON for structured error, fallback to text
            let errorJson = { error: `External Chat API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try {
                errorJson = JSON.parse(responseText);
                if (!errorJson.error && !errorJson.message) { // Ensure there's a primary error message
                     errorJson.error = `External Chat API Error: ${apiResponse.status} ${apiResponse.statusText}`;
                }
            } catch (e) { /* Not a JSON error response, stick with the text based one */ }
             return res.status(apiResponse.status).json(errorJson);
        }

        // Attempt to parse the successful response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Error parsing JSON response from Chat API:', responseText, e);
            return res.status(500).json({ error: 'Failed to parse response from Chat API.', details: responseText });
        }


        if (data && data.response) {
            res.json({ author: data.author || "Kaizenji", response: data.response });
        } else {
            console.error('Unexpected response structure from Chat API:', data);
            res.status(500).json({ error: 'Unexpected response structure from Chat API.', details: data });
        }

    } catch (error) {
        console.error('Server error while calling Chat API:', error);
        res.status(500).json({ error: 'Server error while processing chat request.' });
    }
});


// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
