const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Keys
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CHAT_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const IMAGE_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Assuming same API key

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Already present, ensures req.body is parsed

// --- Weather API Route ---
app.get('/api/weather', async (req, res) => {
    // ... (existing weather route code - unchanged) ...
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

// --- AI Chat API Route ---
app.post('/api/chat', async (req, res) => {
    // ... (existing chat route code - unchanged) ...
    const { ask, uid, webSearch } = req.body;
    if (!ask || !uid) {
        return res.status(400).json({ error: 'Parameters "ask" and "uid" are required.' });
    }
    const webSearchParam = (webSearch === true || String(webSearch).toLowerCase() === 'on') ? 'on' : 'off';
    const chatApiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${webSearchParam}&apikey=${CHAT_API_KEY}`;
    try {
        const apiResponse = await fetch(chatApiUrl);
        const responseText = await apiResponse.text();
        if (!apiResponse.ok) {
            console.error(`Error fetching from Chat API for user ${uid}: ${apiResponse.status} ${apiResponse.statusText}. Response: ${responseText}`);
            let errorJson = { error: `External Chat API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if (!errorJson.error && !errorJson.message) { errorJson.error = `External Chat API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); } catch (e) {
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

// --- New Image Generation API Route (Phase 3B) ---
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Parameter "prompt" is required.' });
    }

    const imageApiUrl = `https://kaiz-apis.gleeze.com/api/flux?prompt=${encodeURIComponent(prompt)}&apikey=${IMAGE_API_KEY}`;

    try {
        const apiResponse = await fetch(imageApiUrl);

        if (!apiResponse.ok) {
            // Try to get error message from API if it's text/json
            const errorText = await apiResponse.text();
            console.error(`Error fetching from Image API for prompt "${prompt}": ${apiResponse.status} ${apiResponse.statusText}. Details: ${errorText}`);
            try {
                const errorJson = JSON.parse(errorText); // If API returns JSON error
                return res.status(apiResponse.status).json(errorJson);
            } catch (e) { // If error is not JSON
                return res.status(apiResponse.status).json({ error: `Image API Error: ${apiResponse.statusText}`, details: errorText });
            }
        }

        // Determine content type from API response headers if possible, otherwise assume jpeg/png
        const contentType = apiResponse.headers.get('content-type') || 'image/jpeg'; // Default to JPEG
        res.setHeader('Content-Type', contentType);

        const imageBuffer = await apiResponse.buffer(); // node-fetch specific method for Buffer
        res.send(imageBuffer);

    } catch (error) {
        console.error('Server error while calling Image API:', error);
        res.status(500).json({ error: 'Server error while processing image generation request.' });
    }
});


// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
