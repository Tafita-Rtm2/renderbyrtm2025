require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb'); // Added
// axios is still needed for auth callback, but not for rendering views server-side anymore
const axios = require('axios');
const fetch = require('node-fetch'); // Or import fetch from 'node-fetch' if using ES modules
// const authRoutes = require('./routes/auth'); // auth.js was deleted
const apiRoutes = require('./routes/api'); // apiRoutes will be expanded

const app = express();
app.use(express.json()); // Added for parsing JSON request bodies
// app.use(express.urlencoded({ extended: true })); // Not strictly needed for JSON APIs but good to have
const PORT = process.env.PORT || 3000;

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liN9VcfABHu7Lqi9';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'bce085f1031ba6deb2d839b64fe944aee3004601';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_super_secure_wow_CHANGE_ME';
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio_db';
// const DB_PASSWORD = process.env.DB_PASSWORD || 'your_db_password'; // This will be part of MONGO_URI
// const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your_weather_api_key';
// const KAIZEN_API_KEY = process.env.KAIZEN_API_KEY || 'your_kaizen_api_key';

// MongoDB Connection
const mongoUsername = process.env.MONGO_USER;
const mongoPassword = process.env.DB_PASSWORD;
const mongoClusterUrl = process.env.MONGO_CLUSTER_URL; // e.g., rtmchat.pzebpqh.mongodb.net
const mongoDbName = process.env.MONGO_DB_NAME || 'portfolio_comments_db';

let MONGO_URI;
if (mongoUsername && mongoPassword && mongoClusterUrl && mongoClusterUrl.includes('mongodb.net')) {
  MONGO_URI = `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoClusterUrl}/?retryWrites=true&w=majority`;
  // If your appName is not in the cluster URL, you might need to append it like:
  // MONGO_URI = `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoClusterUrl}/${mongoDbName}?retryWrites=true&w=majority&appName=rtmchat`;
  // The provided MONGO_URI_DOMAIN started with @, so the appName might be part of the connection options already from Atlas.
  // For the connection string given in the prompt, it seems appName is part of the generic SRV record.
} else {
  console.warn('MongoDB Atlas credentials not fully configured via environment variables for MONGO_URI. Check MONGO_USER, DB_PASSWORD, MONGO_CLUSTER_URL.');
  MONGO_URI = `mongodb://localhost:27017/${mongoDbName}`; // Fallback for local development
}

let db;
MongoClient.connect(MONGO_URI)
    .then(client => {
        console.log('Successfully connected to MongoDB');
        db = client.db(mongoDbName);
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        // process.exit(1); // Optionally exit if DB connection is critical
    });


if (GITHUB_CLIENT_ID === 'Ov23liN9VcfABHu7Lqi9' || GITHUB_CLIENT_SECRET === 'bce085f1031ba6deb2d839b64fe944aee3004601') {
    console.warn("WARNING: Using default GitHub OAuth credentials. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.");
}
if (SESSION_SECRET === 'your_very_secret_key_super_secure_wow_CHANGE_ME') {
    console.warn("WARNING: Using default session secret. Please set SESSION_SECRET environment variable.");
}
// Add similar warnings for new sensitive data if default/missing
// if (!process.env.MONGO_URI) {
//     console.warn("WARNING: MONGO_URI is not set. Please set MONGO_URI environment variable.");
// }
// if (!process.env.WEATHER_API_KEY) {
//     console.warn("WARNING: WEATHER_API_KEY is not set. Please set WEATHER_API_KEY environment variable.");
// }
// if (!process.env.KAIZEN_API_KEY) {
//     console.warn("WARNING: KAIZEN_API_KEY is not set. Please set KAIZEN_API_KEY environment variable.");
// }


app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// No more EJS view engine setup
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to make session available for API routes (though they should protect themselves)
app.use((req, res, next) => {
    // res.locals are for server-side templates, not relevant for SPA in this way
    // res.locals.isAuthenticated = !!req.session.githubAccessToken;
    // res.locals.user = req.session.user;
    next();
});

// Pass GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to auth routes via app.locals
app.locals.GITHUB_CLIENT_ID = GITHUB_CLIENT_ID;
app.locals.GITHUB_CLIENT_SECRET = GITHUB_CLIENT_SECRET;

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
    const location = req.query.q || 'Antananarivo'; // Default to Antananarivo
    const apiKey = process.env.KAIZEN_API_KEY; // Load from environment

    if (!apiKey) {
        return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const weatherApiUrl = `https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(location)}&apikey=${apiKey}`;

    try {
        const weatherResponse = await fetch(weatherApiUrl);
        if (!weatherResponse.ok) {
            // Try to get error message from the API response if possible
            let errorMsg = `Error fetching weather: ${weatherResponse.statusText}`;
            try {
                const errorBody = await weatherResponse.json();
                errorMsg = errorBody.message || errorBody.error || errorMsg;
            } catch (e) { /* Ignore if error body is not JSON or empty */ }
            console.error(`Weather API error for ${location}: ${weatherResponse.status} - ${errorMsg}`);
            return res.status(weatherResponse.status).json({ error: errorMsg });
        }
        const weatherData = await weatherResponse.json();

        // The API returns an object with a "0" key
        if (weatherData && weatherData["0"]) {
            const currentWeatherData = weatherData["0"].current;
            res.json({
                location: weatherData["0"].location.name,
                temperature: currentWeatherData.temperature,
                skytext: currentWeatherData.skytext,
                imageUrl: currentWeatherData.imageUrl, // This is the direct image URL from the API
                feelslike: currentWeatherData.feelslike,
                humidity: currentWeatherData.humidity
            });
        } else {
            console.error('Unexpected weather API response structure:', weatherData);
            res.status(500).json({ error: 'Unexpected weather API response structure' });
        }
    } catch (error) {
        console.error('Error calling weather API:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// POST /api/admin-messages - User sends a direct message to admin
app.post('/api/admin-messages', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const { name, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required for admin message' });
        }
        if (name.length > 100 || message.length > 1000) { // Define reasonable limits
            return res.status(400).json({ error: 'Name or message too long for admin message' });
        }

        const newAdminMessage = {
            name: name.trim(),
            message: message.trim(),
            timestamp: new Date(),
            isRead: false // Default to unread
        };

        const result = await db.collection('admin_messages').insertOne(newAdminMessage);
        if (result.insertedId) {
            res.status(201).json({ success: true, messageId: result.insertedId });
        } else {
            // Fallback if insertedId is not available for some reason
            res.status(201).json({ success: true });
        }

    } catch (error) {
        console.error('Error saving admin message:', error);
        res.status(500).json({ error: 'Failed to send message to admin' });
    }
});

// GET /api/admin-messages - For admin to fetch messages (will be used later)
app.get('/api/admin-messages', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const messages = await db.collection('admin_messages').find().sort({ timestamp: -1 }).toArray();
        res.json(messages);
    } catch (error) {
        console.error('Error fetching admin messages:', error);
        res.status(500).json({ error: 'Failed to fetch admin messages' });
    }
});

// PUT /api/admin-messages/:id/read - For admin to mark as read (will be used later)
app.put('/api/admin-messages/:id/read', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const messageId = req.params.id;
        if (!ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: 'Invalid message ID format' });
        }

        const result = await db.collection('admin_messages').updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { isRead: true, readTimestamp: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        if (result.modifiedCount === 0 && result.matchedCount > 0) {
             return res.json({ success: true, message: 'Message was already marked as read.' });
        }
        res.json({ success: true, message: 'Message marked as read' });

    } catch (error) {
        console.error('Error marking admin message as read:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

// Chat API endpoint
app.get('/api/chat', async (req, res) => {
    const userMessage = req.query.ask;
    const userId = req.query.uid;
    const webSearch = req.query.webSearch === 'on' ? 'on' : 'off'; // Ensure 'on' or 'off'
    const apiKey = process.env.KAIZEN_API_KEY;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message ("ask") is required' });
    }
    if (!userId) {
        return res.status(400).json({ error: 'User ID ("uid") is required' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'Chat API key not configured' });
    }

    const chatApiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(userMessage)}&uid=${encodeURIComponent(userId)}&webSearch=${webSearch}&apikey=${apiKey}`;

    try {
        const chatResponse = await fetch(chatApiUrl);
        if (!chatResponse.ok) {
            let errorMsg = `Chat API error: ${chatResponse.statusText}`;
            try {
                const errorBody = await chatResponse.json();
                errorMsg = errorBody.message || errorBody.error || errorMsg;
            } catch (e) { /* Ignore if error body is not JSON */ }
            console.error(`Chat API error for UID ${userId}: ${chatResponse.status} - ${errorMsg}`);
            return res.status(chatResponse.status).json({ error: errorMsg });
        }

        const responseData = await chatResponse.json();
        // Expected: { "author": "Kaizenji", "response": "AI's message" }
        res.json(responseData);

    } catch (error) {
        console.error('Error calling Chat API:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

// Image Generation API endpoint
app.get('/api/generate-image', async (req, res) => {
    const prompt = req.query.prompt;
    const apiKey = process.env.KAIZEN_API_KEY;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'Image generation API key not configured' });
    }

    const imageUrl = `https://kaiz-apis.gleeze.com/api/flux?prompt=${encodeURIComponent(prompt)}&apikey=${apiKey}`;

    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            // Try to get text error from the API response if possible
            let errorMsg = `Error fetching image: ${imageResponse.statusText}`;
            try {
                const errorText = await imageResponse.text(); // Flux API might return plain text errors
                errorMsg = errorText || errorMsg;
            } catch (e) { /* Ignore if error body is not text or empty */ }
            console.error(`Image API error for prompt "${prompt}": ${imageResponse.status} - ${errorMsg}`);
            return res.status(imageResponse.status).send(errorMsg); // Send text error
        }

        // Forward the image stream directly
        res.setHeader('Content-Type', imageResponse.headers.get('Content-Type') || 'image/png'); // Or appropriate type
        imageResponse.body.pipe(res);

    } catch (error) {
        console.error('Error calling image generation API:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// API and Authentication Routes
// app.use('/auth', authRoutes); // auth.js was deleted
app.use('/api', apiRoutes); // This will include /api/repos and the new /api/user

// GET /api/comments - Fetch all comments
app.get('/api/comments', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const comments = await db.collection('comments').find().sort({ timestamp: -1 }).toArray();
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/comments - Add a new comment
app.post('/api/comments', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const { name, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }
        if (name.length > 50 || message.length > 500) {
            return res.status(400).json({ error: 'Name or message too long' });
        }

        const newComment = {
            name: name.trim(),
            message: message.trim(),
            timestamp: new Date()
        };

        const result = await db.collection('comments').insertOne(newComment);
        if (result.insertedId) {
             const insertedComment = { ...newComment, _id: result.insertedId };
             res.status(201).json(insertedComment);
        } else {
             res.status(201).json(newComment); // Fallback
        }

    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ error: 'Failed to post comment' });
    }
});

// All other GET requests not handled by API/Auth should serve the SPA's index.html
// This allows client-side routing to take over.
app.get('*', (req, res) => {
    // Ensure this is not catching API calls if they somehow miss the /api prefix router.
    // However, with the current setup, /api routes are handled first.
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/auth/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // If it's an API/auth path that wasn't handled, it's a 404 from the perspective of specific handlers.
        // Or, if the /api router doesn't send a response, this 'else' might not be needed.
        // Let the /api and /auth routers handle their own 404s or fall through.
        // This is mainly a catch-all for client-side navigation.
        // A better way for SPA is to ensure API routes are clearly defined.
        // If /api/something is not found by apiRoutes, it will 404 there.
        // So, this catch-all should be fine for serving index.html for non-API/non-Auth routes.

        // The logic here is a bit complex. A simpler approach for SPA catch-all:
        // After all specific API/Auth routes, any remaining GET request serves index.html.
        // Express routes are matched in order. So if /api and /auth are defined before this,
        // they will be hit first.
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(\`Server is running on http://localhost:\${PORT}\`);
    console.log('Serving SPA from public/index.html');
});
