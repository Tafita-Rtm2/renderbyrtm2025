const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // For ES Modules compatibility
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Key - In a real app, use environment variables!
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';

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

// Fallback to index.html for SPA-like behavior (optional, but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
