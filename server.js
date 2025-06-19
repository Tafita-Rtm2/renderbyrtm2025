const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // For ES Modules compatibility
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Key - In a real app, use environment variables!
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CHAT_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Same key as weather

// Middleware to parse JSON bodies (IMPORTANT!)
app.use(express.json()); 

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API route for weather
app.get('/api/weather', async (req, res) => {
    const location = req.query.location;
    if (!location) {
        return res.status(400).json({ error: 'Location query parameter is required' });
    }

    const weatherApiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${WEATHER_API_KEY}`;

    try {
        const apiResponse = await fetch(weatherApiUrl);
        if (!apiResponse.ok) {
            // Try to get error message from the API if available
            let errorText = `External API Error: ${apiResponse.status} ${apiResponse.statusText}`;
            try {
                const errorBody = await apiResponse.json(); // Or .text() if not JSON
                if (errorBody && errorBody.message) {
                     errorText = `External API Error: ${errorBody.message}`;
                } else if (typeof errorBody === 'string' && errorBody.length > 0) {
                    errorText = `External API Error: ${errorBody}`;
                }
            } catch (e) {
                // Ignore if error body cannot be parsed
            }
            console.error(`Error fetching from weather API for ${location}: ${apiResponse.status} ${apiResponse.statusText}`);
            return res.status(apiResponse.status).json({ error: errorText, details: `Failed to fetch weather for ${location}` });
        }
        
        const data = await apiResponse.json();

        // The API returns data in an object where the key is "0"
        if (data && data["0"]) {
            res.json(data["0"]); // Send the relevant part of the data
        } else {
            console.error('Unexpected response structure from weather API:', data);
            res.status(500).json({ error: 'Unexpected response structure from weather API.' });
        }

    } catch (error) {
        console.error('Server error while fetching weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data due to server error.' });
    }
});

// API route for AI Chat
app.post('/api/chat', async (req, res) => {
    const { ask, uid, webSearch } = req.body; // webSearch should be true/false from client, convert to 'on'/'off'

    if (!ask) {
        return res.status(400).json({ error: 'Query ("ask") is required.' });
    }
    if (!uid) {
        return res.status(400).json({ error: 'User ID ("uid") is required.' });
    }
    // webSearch is optional, default to 'on' if not provided or handle as needed
    const webSearchStatus = (typeof webSearch === 'boolean' && webSearch === false) ? 'off' : 'on';

    const chatApiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${webSearchStatus}&apikey=${CHAT_API_KEY}`; // Re-use CHAT_API_KEY

    try {
        const apiResponse = await fetch(chatApiUrl); // fetch is already defined globally from previous setup
        
        // It seems this API might sometimes return non-JSON errors for certain issues
        // So, check content-type before parsing as JSON or handle parsing error
        const responseText = await apiResponse.text(); // Get raw text first

        if (!apiResponse.ok) {
            console.error(`Error from Kaizen Chat API for user ${uid}, query "${ask}": ${apiResponse.status} ${apiResponse.statusText}. Response: ${responseText}`);
            // Try to parse as JSON if possible, otherwise send text
            let errorDetail = responseText;
            try {
                errorDetail = JSON.parse(responseText);
            } catch(e) { /* Keep as text if not JSON */ }
            return res.status(apiResponse.status).json({ error: `External Chat API Error: ${apiResponse.statusText}`, details: errorDetail });
        }
        
        // Attempt to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error(`Kaizen Chat API returned non-JSON response for user ${uid}, query "${ask}". Response: ${responseText}`);
            return res.status(500).json({ error: 'Chat API returned non-JSON response', details: responseText });
        }

        if (data && data.response) {
            res.json({ author: data.author, response: data.response });
        } else {
            console.error('Unexpected response structure from Kaizen Chat API:', data);
            res.status(500).json({ error: 'Unexpected response structure from Chat API.' });
        }

    } catch (error) {
        console.error('Server error while fetching from Kaizen Chat API:', error);
        res.status(500).json({ error: 'Failed to get chat response due to server error.' });
    }
});

// Fallback to index.html for SPA-like behavior (optional, but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
