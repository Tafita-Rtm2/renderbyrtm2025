const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer'); // For handling file uploads
const fs = require('fs'); // For file system operations like deleting files

// Configure Multer for disk storage
const UPLOAD_PATH = 'public/uploads/gemini_temp/';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)){
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Serve static files from the upload directory first
app.use('/uploads/gemini_temp', express.static(path.join(__dirname, UPLOAD_PATH)));
// Serve main public files
app.use(express.static(path.join(__dirname, 'public')));
// JSON parsing middleware
app.use(express.json());


// API Keys (can be here or further down, as long as before use in routes if routes are defined later)
const WEATHER_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const CHAT_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const IMAGE_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';
const GEMINI_API_URL = 'https://kaiz-apis.gleeze.com/api/gemini-vision';
const GEMINI_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Votre clé API fournie
const GPT4O_LATEST_API_URL = 'https://kaiz-apis.gleeze.com/api/gpt4o-latest';
const GPT4O_LATEST_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Même clé API

// TMDB API Configuration
const TMDB_API_KEY = '973515c7684f56d1472bba67b13d676b';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzM1MTVjNzY4NGY1NmQxNDcyYmJhNjdiMTNkNjc2YiIsIm5iZiI6MTc1MDc1NDgwNy41OTksInN1YiI6IjY4NWE2NWY3OWM3M2UyMWMzYWU2NGJmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.qofUiAxiL4ed8ONCxljkTqbsddbvFyVB4_Jwp_HyDnM';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// MongoDB Connection (can be here)
const mongoUri = "mongodb+srv://rtmtafita:tafitaniaina1206@rtmchat.pzebpqh.mongodb.net/?retryWrites=true&w=majority&appName=rtmchat";
const client = new MongoClient(mongoUri);

let portfolioDb;
let commentsCollection;
let userActivitiesCollection; // Added for user activity tracking
let usersCollection; // For storing user names and UIDs

async function connectDB() {
    try {
        await client.connect();
        portfolioDb = client.db("portfolioDb");
        commentsCollection = portfolioDb.collection("comments");
        userActivitiesCollection = portfolioDb.collection("userActivities");
        usersCollection = portfolioDb.collection("users"); // Initialize users collection
        console.log("Successfully connected to MongoDB Atlas!");

        // Indexes for commentsCollection
        await commentsCollection.createIndex({ createdAt: -1 });
        console.log("Indexes ensured for comments collection.");

        // Indexes for userActivitiesCollection
        await userActivitiesCollection.createIndex({ uid: 1 });
        await userActivitiesCollection.createIndex({ timestamp: -1 });
        await userActivitiesCollection.createIndex({ activityType: 1 });
        console.log("Indexes ensured for userActivities collection.");

        // Indexes for usersCollection
        await usersCollection.createIndex({ uid: 1 }, { unique: true });
        await usersCollection.createIndex({ name: 1 }, { unique: true });
        console.log("Unique indexes ensured for uid and name in users collection.");

    } catch (err) {
        console.error("Failed to connect to MongoDB Atlas or ensure indexes", err);
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            console.warn("Warning: Duplicate name index error during setup. This might be okay if you are re-running after a partial setup, but ensure names are unique.");
        } else if (err.code === 11000 && err.keyPattern && err.keyPattern.uid) {
            console.warn("Warning: Duplicate UID index error during setup. This is highly unusual and might indicate a problem if UIDs are not unique from the client.");
        }
        // Decide if process should exit for all errors or just critical ones
        // For now, let's keep process.exit(1) for general DB connection/setup failures
        // process.exit(1); // Commenting out to allow server to start even if index creation has non-critical issues on re-run
    }
}

// Admin Code
const ADMIN_VERIFICATION_CODE = '2201018280';

// --- ROUTES ---

// --- Admin Verification API Route ---
app.post('/api/verify-admin', (req, res) => {
    const { adminCode } = req.body;

    if (!adminCode) {
        return res.status(400).json({ success: false, message: "Admin code is required" });
    }

    if (adminCode === ADMIN_VERIFICATION_CODE) {
        return res.json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: "Invalid admin code" });
    }
});

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

// GET /api/activities - Fetch user activities (for admin panel)
app.get('/api/activities', async (req, res) => {
    if (!userActivitiesCollection) {
        return res.status(503).json({ error: "Database service not available." });
    }
    try {
        const { uid, limit = 50, page = 1 } = req.query;
        const query = uid ? { uid } : {};
        const nLimit = parseInt(limit);
        const nPage = parseInt(page);

        const options = {
            sort: { timestamp: -1 },
            limit: nLimit,
            skip: (nPage - 1) * nLimit
        };

        const activities = await userActivitiesCollection.find(query, options).toArray();
        const totalActivities = await userActivitiesCollection.countDocuments(query);

        let uniqueVisitors = undefined; // Only calculate if no specific UID is queried
        if (!uid) {
            const distinctUIDs = await userActivitiesCollection.distinct('uid', {}); // Query all documents for distinct UIDs
            uniqueVisitors = distinctUIDs.length;
        }

        res.status(200).json({
            activities,
            totalActivities, // This is total for the current query (all activities if no UID)
            currentPage: nPage,
            totalPages: Math.ceil(totalActivities / nLimit),
            uniqueVisitors // This will be undefined if a UID was specified in query
        });

    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Failed to fetch activities due to server error." });
    }
});

// POST /api/comments/:commentId/reply - Add/update admin reply to a comment
app.post('/api/comments/:commentId/reply', async (req, res) => {
    if (!commentsCollection) {
        return res.status(503).json({ error: "Database not connected." });
    }
    try {
        const { commentId } = req.params;
        const { replyText } = req.body;

        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: "Invalid comment ID format." });
        }
        // replyText can be an empty string (to clear a reply)
        if (replyText === undefined || typeof replyText !== 'string') {
            return res.status(400).json({ error: 'Reply text must be a string.' });
        }

        const mongoDbCommentId = new ObjectId(commentId);
        const updateFields = {
            adminReplyText: replyText.trim(), // Store trimmed reply
            adminReplyTimestamp: new Date()
        };

        // If replyText is empty, it effectively clears the reply.
        // We still update the timestamp to know when it was last actioned.
        // If you wanted to truly "remove" the reply fields, you'd use $unset here.
        // For simplicity, setting to empty string is fine.

        const updateResult = await commentsCollection.updateOne(
            { _id: mongoDbCommentId },
            { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Comment not found." });
        }

        // Fetch the updated comment to return it
        const updatedComment = await commentsCollection.findOne({ _id: mongoDbCommentId });
        res.status(200).json(updatedComment);

    } catch (error) {
        console.error("Error posting admin reply:", error);
        res.status(500).json({ error: "Failed to post admin reply due to server error." });
    }
});

// --- AI Chat API Route ---
app.post('/api/chat', async (req, res) => {
    const { ask, uid, webSearch, isStoryRequestFlag } = req.body; // Added isStoryRequestFlag
    if (!ask || !uid) { return res.status(400).json({ error: 'Parameters "ask" and "uid" are required.' }); }

    const storyKeywords = ["create a short story about", "generate a story about", "write a story about", "tell me a story about", "story about"];
    // Check both the flag and keywords for robustness
    const isStoryRequest = isStoryRequestFlag || storyKeywords.some(keyword => ask.toLowerCase().startsWith(keyword));

    if (isStoryRequest) {
        const storyApiUrl = `https://kaiz-apis.gleeze.com/api/gpt4o-latest?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&imageUrl=&apikey=${CHAT_API_KEY}`;
        try {
            const apiResponse = await fetch(storyApiUrl);
            const responseText = await apiResponse.text(); // Get text first for better error handling
            if (!apiResponse.ok) {
                let errorJson = { error: `External Story API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
                try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Story API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
                return res.status(apiResponse.status).json(errorJson);
            }
            let data;
            try { data = JSON.parse(responseText); } catch (e) { return res.status(500).json({ error: 'Failed to parse response from Story API.', details: responseText }); }

            if (data && data.response) {
                // Ensure the response structure matches what the client expects for stories
                res.json({ author: data.author || "Kaizenji", response: data.response });
            } else {
                return res.status(500).json({ error: 'Unexpected response structure from Story API.', details: data });
            }
        } catch (error) {
            console.error('Server error while calling Story API:', error);
            return res.status(500).json({ error: 'Server error while processing story generation request.' });
        }
    } else {
        // Existing chat logic using gpt-4o
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
    }
});

// --- Gemini Chat API Route ---
// Apply multer middleware for single file upload, field name 'imageFile'
app.post('/api/gemini-chat', upload.single('imageFile'), async (req, res) => {
    // 'imageFile' should match the name attribute in FormData on the client-side
    const { q, uid } = req.body;
    let tempImagePath = null; // To store path of temporarily saved file
    let publicImageUrl = null;

    if (req.file) {
        tempImagePath = req.file.path;
        // Construct the public URL. This assumes the server is running at the root.
        // For a robust solution, req.protocol and req.get('host') should be used if the app is behind a proxy or has a complex setup.
        // For simplicity here, we'll use a relative path which the client might need to resolve, or an assumed absolute if deployed.
        // The API likely needs an absolute public URL.
        // NOTE: This URL will only be valid if the server is publicly accessible.
        // And the path must match the one configured in app.use(express.static(...))
        publicImageUrl = `/uploads/gemini_temp/${req.file.filename}`;
        console.log(`Image temporarily saved at ${tempImagePath}, accessible via ${publicImageUrl}`);
    }

    if (!uid) {
        if (tempImagePath) fs.unlinkSync(tempImagePath); // Clean up uploaded file if UID is missing
        return res.status(400).json({ error: 'Parameter "uid" is required.' });
    }

    const questionText = q ? q.trim() : "";
    if (questionText === "" && !publicImageUrl) {
        if (tempImagePath) fs.unlinkSync(tempImagePath); // Clean up
        return res.status(400).json({ error: 'Either a question ("q") or an image file is required.' });
    }

    let fullApiUrl = `${GEMINI_API_URL}?uid=${encodeURIComponent(uid)}&apikey=${GEMINI_API_KEY}`;
    if (questionText) {
        fullApiUrl += `&q=${encodeURIComponent(questionText)}`;
    }
    if (publicImageUrl) {
        // IMPORTANT: The API needs an ABSOLUTE URL.
        // For now, sending the relative one. This will likely fail if the API is external
        // unless the API client (this server) resolves it to its own public absolute URL.
        // This needs to be adjusted based on actual deployment.
        // A placeholder for where the app's public base URL would be.
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`; // Attempt to get base URL
        const absolutePublicImageUrl = new URL(publicImageUrl, APP_BASE_URL).toString();
        fullApiUrl += `&imageUrl=${encodeURIComponent(absolutePublicImageUrl)}`;
        console.log("Attempting to use absolute image URL for API:", absolutePublicImageUrl);
    }

    try {
        const apiResponse = await fetch(fullApiUrl);
        const responseText = await apiResponse.text();

        if (tempImagePath) { // Clean up the uploaded file after the API call
            fs.unlink(tempImagePath, (err) => {
                if (err) console.error("Error deleting temporary image file:", err);
                else console.log("Temporary image file deleted:", tempImagePath);
            });
        }

        if (!apiResponse.ok) {
            let errorJson = { error: `External Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }

        let data;
        try { data = JSON.parse(responseText); }
        catch (e) {
            console.warn('Gemini API response was not JSON, but status was OK. Response text:', responseText);
            return res.status(500).json({ error: 'Failed to parse response from Gemini API.', details: responseText });
        }

        if (data && data.response) {
            res.json({ author: data.author || "Gemini (Kaizenji)", response: data.response });
        } else {
            return res.status(500).json({ error: 'Unexpected response structure from Gemini API.', details: data });
        }

    } catch (error) {
        console.error('Server error while calling Gemini API:', error);
        if (tempImagePath && fs.existsSync(tempImagePath)) { // Ensure cleanup on error too
            fs.unlink(tempImagePath, (err) => {
                if (err) console.error("Error deleting temporary image file on error:", err);
            });
        }
        return res.status(500).json({ error: 'Server error while processing Gemini chat request.' });
    }
});

// --- GPT-4o Latest Chat API Route (similar to Gemini for file handling) ---
app.post('/api/gpt4o-chat', upload.single('imageFile'), async (req, res) => {
    const { q, uid } = req.body;
    let tempImagePath = null;
    let publicImageUrl = null;

    if (req.file) {
        tempImagePath = req.file.path;
        // Construct public URL for the temporarily saved image
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        publicImageUrl = new URL(`/uploads/gemini_temp/${req.file.filename}`, APP_BASE_URL).toString();
        console.log(`GPT-4o: Image temporarily saved at ${tempImagePath}, accessible via ${publicImageUrl}`);
    }

    if (!uid) {
        if (tempImagePath) fs.unlinkSync(tempImagePath); // Clean up
        return res.status(400).json({ error: 'Parameter "uid" is required.' });
    }

    const questionText = q ? q.trim() : "";
    if (questionText === "" && !publicImageUrl) {
        if (tempImagePath) fs.unlinkSync(tempImagePath); // Clean up
        return res.status(400).json({ error: 'Either a question ("q") or an image file is required for GPT-4o chat.' });
    }

    let fullApiUrl = `${GPT4O_LATEST_API_URL}?uid=${encodeURIComponent(uid)}&apikey=${GPT4O_LATEST_API_KEY}`;
    if (questionText) {
        fullApiUrl += `&ask=${encodeURIComponent(questionText)}`; // API uses 'ask' not 'q'
    }
    if (publicImageUrl) {
        fullApiUrl += `&imageUrl=${encodeURIComponent(publicImageUrl)}`;
    }
    // console.log("Calling GPT-4o API with URL (first 200 chars):", fullApiUrl.substring(0, 200));


    try {
        const apiResponse = await fetch(fullApiUrl);
        const responseText = await apiResponse.text();

        if (tempImagePath) {
            fs.unlink(tempImagePath, (err) => {
                if (err) console.error("Error deleting temporary image file for GPT-4o:", err);
                else console.log("Temporary image file for GPT-4o deleted:", tempImagePath);
            });
        }

        if (!apiResponse.ok) {
            let errorJson = { error: `External GPT-4o API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External GPT-4o API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }

        let data;
        try { data = JSON.parse(responseText); }
        catch (e) {
            console.warn('GPT-4o API response was not JSON, but status was OK. Response text:', responseText);
            return res.status(500).json({ error: 'Failed to parse response from GPT-4o API.', details: responseText });
        }

        if (data && data.response) { // Expecting { "author": "Kaizenji", "response": "..." }
            res.json({ author: data.author || "GPT-4o (Kaizenji)", response: data.response });
        } else {
            return res.status(500).json({ error: 'Unexpected response structure from GPT-4o API.', details: data });
        }

    } catch (error) {
        console.error('Server error while calling GPT-4o API:', error);
        if (tempImagePath && fs.existsSync(tempImagePath)) {
            fs.unlink(tempImagePath, (err) => {
                if (err) console.error("Error deleting temporary image file for GPT-4o on error:", err);
            });
        }
        return res.status(500).json({ error: 'Server error while processing GPT-4o chat request.' });
    }
});


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

// GET /api/activities - Fetch user activities (for admin panel)
app.get('/api/activities', async (req, res) => {
    if (!userActivitiesCollection) {
        return res.status(503).json({ error: "Database service not available." });
    }
    try {
        const { uid, limit = 50, page = 1 } = req.query;
        const query = uid ? { uid } : {};
        const nLimit = parseInt(limit);
        const nPage = parseInt(page);

        const options = {
            sort: { timestamp: -1 },
            limit: nLimit,
            skip: (nPage - 1) * nLimit
        };

        const activities = await userActivitiesCollection.find(query, options).toArray();
        const totalActivities = await userActivitiesCollection.countDocuments(query);

        let uniqueVisitors = undefined; // Only calculate if no specific UID is queried
        if (!uid) {
            const distinctUIDs = await userActivitiesCollection.distinct('uid', {}); // Query all documents for distinct UIDs
            uniqueVisitors = distinctUIDs.length;
        }

        res.status(200).json({
            activities,
            totalActivities, // This is total for the current query (all activities if no UID)
            currentPage: nPage,
            totalPages: Math.ceil(totalActivities / nLimit),
            uniqueVisitors // This will be undefined if a UID was specified in query
        });

    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Failed to fetch activities due to server error." });
    }
});

// POST /api/comments/:commentId/reply - Add/update admin reply to a comment
app.post('/api/comments/:commentId/reply', async (req, res) => {
    if (!commentsCollection) {
        return res.status(503).json({ error: "Database not connected." });
    }
    try {
        const { commentId } = req.params;
        const { replyText } = req.body;

        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: "Invalid comment ID format." });
        }
        // replyText can be an empty string (to clear a reply)
        if (replyText === undefined || typeof replyText !== 'string') {
            return res.status(400).json({ error: 'Reply text must be a string.' });
        }

        const mongoDbCommentId = new ObjectId(commentId);
        const updateFields = {
            adminReplyText: replyText.trim(), // Store trimmed reply
            adminReplyTimestamp: new Date()
        };

        // If replyText is empty, it effectively clears the reply.
        // We still update the timestamp to know when it was last actioned.
        // If you wanted to truly "remove" the reply fields, you'd use $unset here.
        // For simplicity, setting to empty string is fine.

        const updateResult = await commentsCollection.updateOne(
            { _id: mongoDbCommentId },
            { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Comment not found." });
        }

        // Fetch the updated comment to return it
        const updatedComment = await commentsCollection.findOne({ _id: mongoDbCommentId });
        res.status(200).json(updatedComment);

    } catch (error) {
        console.error("Error posting admin reply:", error);
        res.status(500).json({ error: "Failed to post admin reply due to server error." });
    }
});

// --- AI Chat API Route ---
app.post('/api/chat', async (req, res) => {
    const { ask, uid, webSearch, isStoryRequestFlag } = req.body; // Added isStoryRequestFlag
    if (!ask || !uid) { return res.status(400).json({ error: 'Parameters "ask" and "uid" are required.' }); }

    const storyKeywords = ["create a short story about", "generate a story about", "write a story about", "tell me a story about", "story about"];
    // Check both the flag and keywords for robustness
    const isStoryRequest = isStoryRequestFlag || storyKeywords.some(keyword => ask.toLowerCase().startsWith(keyword));

    if (isStoryRequest) {
        const storyApiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o-pro?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&imageUrl=&apikey=${CHAT_API_KEY}`;
        try {
            const apiResponse = await fetch(storyApiUrl);
            const responseText = await apiResponse.text(); // Get text first for better error handling
            if (!apiResponse.ok) {
                let errorJson = { error: `External Story API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
                try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Story API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
                return res.status(apiResponse.status).json(errorJson);
            }
            let data;
            try { data = JSON.parse(responseText); } catch (e) { return res.status(500).json({ error: 'Failed to parse response from Story API.', details: responseText }); }

            if (data && data.response) {
                // Ensure the response structure matches what the client expects for stories
                res.json({ author: data.author || "Kaizenji", response: data.response });
            } else {
                return res.status(500).json({ error: 'Unexpected response structure from Story API.', details: data });
            }
        } catch (error) {
            console.error('Server error while calling Story API:', error);
            return res.status(500).json({ error: 'Server error while processing story generation request.' });
        }
    } else {
        // Existing chat logic using gpt-4o
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
    }
});

// --- Gemini Chat API Route ---
// Apply multer middleware for single file upload, field name 'imageFile'
app.post('/api/gemini-chat', upload.single('imageFile'), async (req, res) => {
    // 'imageFile' should match the name attribute in FormData on the client-side
    const { q, uid } = req.body;
    let tempImagePath = null; // To store path of temporarily saved file
    let publicImageUrl = null;

    if (req.file) {
        tempImagePath = req.file.path;
        // Construct the public URL. This assumes the server is running at the root.
        // For a robust solution, req.protocol and req.get('host') should be used if the app is behind a proxy or has a complex setup.
        // For simplicity here, we'll use a relative path which the client might need to resolve, or an assumed absolute if deployed.
        // The API likely needs an absolute public URL.
        // NOTE: This URL will only be valid if the server is publicly accessible.
        // And the path must match the one configured in app.use(express.static(...))
        publicImageUrl = `/uploads/gemini_temp/${req.file.filename}`;
        console.log(`Image temporarily saved at ${tempImagePath}, accessible via ${publicImageUrl}`);
    }

    if (!uid) {
        if (tempImagePath) fs.unlinkSync(tempImagePath); // Clean up uploaded file if UID is missing
        return res.status(400).json({ error: 'Parameter "uid" is required.' });
    }

    const questionText = q ? q.trim() : "";
    if (questionText === "" && !publicImageUrl) {
        if (tempImagePath) fs.unlinkSync(tempImagePath); // Clean up
        return res.status(400).json({ error: 'Either a question ("q") or an image file is required.' });
    }

    let fullApiUrl = `${GEMINI_API_URL}?uid=${encodeURIComponent(uid)}&apikey=${GEMINI_API_KEY}`;
    if (questionText) {
        fullApiUrl += `&q=${encodeURIComponent(questionText)}`;
    }
    if (publicImageUrl) {
        // IMPORTANT: The API needs an ABSOLUTE URL.
        // For now, sending the relative one. This will likely fail if the API is external
        // unless the API client (this server) resolves it to its own public absolute URL.
        // This needs to be adjusted based on actual deployment.
        // A placeholder for where the app's public base URL would be.
        const APP_BASE_URL = process.env.APP_URL || `${req.protocol}://${req.get('host')}`; // Attempt to get base URL
        const absolutePublicImageUrl = new URL(publicImageUrl, APP_BASE_URL).toString();
        fullApiUrl += `&imageUrl=${encodeURIComponent(absolutePublicImageUrl)}`;
        console.log("Attempting to use absolute image URL for API:", absolutePublicImageUrl);
    }

    try {
        const apiResponse = await fetch(fullApiUrl);
        const responseText = await apiResponse.text();

        if (tempImagePath) { // Clean up the uploaded file after the API call
            fs.unlink(tempImagePath, (err) => {
                if (err) console.error("Error deleting temporary image file:", err);
                else console.log("Temporary image file deleted:", tempImagePath);
            });
        }

        if (!apiResponse.ok) {
            let errorJson = { error: `External Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Gemini API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }

        let data;
        try { data = JSON.parse(responseText); }
        catch (e) {
            console.warn('Gemini API response was not JSON, but status was OK. Response text:', responseText);
            return res.status(500).json({ error: 'Failed to parse response from Gemini API.', details: responseText });
        }

        if (data && data.response) {
            res.json({ author: data.author || "Gemini (Kaizenji)", response: data.response });
        } else {
            return res.status(500).json({ error: 'Unexpected response structure from Gemini API.', details: data });
        }

    } catch (error) {
        console.error('Server error while calling Gemini API:', error);
        if (tempImagePath && fs.existsSync(tempImagePath)) { // Ensure cleanup on error too
            fs.unlink(tempImagePath, (err) => {
                if (err) console.error("Error deleting temporary image file on error:", err);
            });
        }
        return res.status(500).json({ error: 'Server error while processing Gemini chat request.' });
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
        const { name: clientProvidedName, text, uid } = req.body; // Expect uid from client

        if (!uid) {
            return res.status(400).json({ error: 'User ID (uid) is required to post a comment.' });
        }
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required and must be a non-empty string.' });
        }
        // Name validation can be less strict here if we prioritize the server-verified name
        if (!clientProvidedName || typeof clientProvidedName !== 'string' || clientProvidedName.trim() === '') {
            return res.status(400).json({ error: 'Name is required (even if prefilled).' });
        }

        let finalName = clientProvidedName.trim();
        let userVerified = false;

        // Fetch user from usersCollection to get the authoritative name
        if (usersCollection) { // Check if usersCollection is available
            const user = await usersCollection.findOne({ uid: uid });
            if (user && user.name) {
                finalName = user.name; // Prioritize registered name
                userVerified = true;
                console.log(`Comment submitted by verified user: ${finalName} (UID: ${uid})`);
            } else {
                console.warn(`Comment submitted by UID: ${uid} but user not found or has no name in usersCollection. Using client-provided name: ${clientProvidedName}`);
                // Fallback to client-provided name if user not found, but log this.
                // Or, you could choose to reject the comment if UID must be verified:
                // return res.status(403).json({ error: 'User not verified. Cannot post comment.' });
            }
        } else {
            console.warn("usersCollection not available. Using client-provided name for comment.");
        }


        const newComment = {
            uid: uid, // Store the UID
            name: finalName, // Store the (preferably verified) name
            text: text.trim(),
            createdAt: new Date(),
            likes: { count: 0, users: [] },
            dislikes: { count: 0, users: [] },
            adminReplyText: "", // Initialize admin reply fields
            adminReplyTimestamp: null
        };

        const result = await commentsCollection.insertOne(newComment);
        const createdComment = { _id: result.insertedId, ...newComment };
        res.status(201).json(createdComment);

    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ error: "Failed to post comment due to server error." });
    }
});

// POST /api/comments/:commentId/like - Like a comment
app.post('/api/comments/:commentId/like', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { commentId } = req.params;
        const { uid } = req.body; // User's UID performing the action

        if (!ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid comment ID." });
        if (!uid) return res.status(400).json({ error: "User ID is required." });

        const mongoCommentId = new ObjectId(commentId);
        const comment = await commentsCollection.findOne({ _id: mongoCommentId });
        if (!comment) return res.status(404).json({ error: "Comment not found." });

        // Ensure likes/dislikes fields exist (for older comments)
        comment.likes = comment.likes || { count: 0, users: [] };
        comment.dislikes = comment.dislikes || { count: 0, users: [] };

        const hasLiked = comment.likes.users.includes(uid);
        const hasDisliked = comment.dislikes.users.includes(uid);

        if (hasLiked) { // User wants to unlike
            comment.likes.users = comment.likes.users.filter(userId => userId !== uid);
            comment.likes.count = comment.likes.users.length;
        } else { // User wants to like
            comment.likes.users.push(uid);
            comment.likes.count = comment.likes.users.length;
            if (hasDisliked) { // If previously disliked, remove dislike
                comment.dislikes.users = comment.dislikes.users.filter(userId => userId !== uid);
                comment.dislikes.count = comment.dislikes.users.length;
            }
        }

        await commentsCollection.updateOne({ _id: mongoCommentId }, { $set: { likes: comment.likes, dislikes: comment.dislikes } });
        res.status(200).json(comment); // Return updated comment
    } catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ error: "Server error while liking comment." });
    }
});

// POST /api/comments/:commentId/dislike - Dislike a comment
app.post('/api/comments/:commentId/dislike', async (req, res) => {
    if (!commentsCollection) return res.status(503).json({ error: "Database not connected." });
    try {
        const { commentId } = req.params;
        const { uid } = req.body;

        if (!ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid comment ID." });
        if (!uid) return res.status(400).json({ error: "User ID is required." });

        const mongoCommentId = new ObjectId(commentId);
        const comment = await commentsCollection.findOne({ _id: mongoCommentId });
        if (!comment) return res.status(404).json({ error: "Comment not found." });

        // Ensure likes/dislikes fields exist (for older comments)
        comment.likes = comment.likes || { count: 0, users: [] };
        comment.dislikes = comment.dislikes || { count: 0, users: [] };

        const hasLiked = comment.likes.users.includes(uid);
        const hasDisliked = comment.dislikes.users.includes(uid);

        if (hasDisliked) { // User wants to un-dislike
            comment.dislikes.users = comment.dislikes.users.filter(userId => userId !== uid);
            comment.dislikes.count = comment.dislikes.users.length;
        } else { // User wants to dislike
            comment.dislikes.users.push(uid);
            comment.dislikes.count = comment.dislikes.users.length;
            if (hasLiked) { // If previously liked, remove like
                comment.likes.users = comment.likes.users.filter(userId => userId !== uid);
                comment.likes.count = comment.likes.users.length;
            }
        }

        await commentsCollection.updateOne({ _id: mongoCommentId }, { $set: { likes: comment.likes, dislikes: comment.dislikes } });
        res.status(200).json(comment);
    } catch (error) {
        console.error("Error disliking comment:", error);
        res.status(500).json({ error: "Server error while disliking comment." });
    }
});

// --- User Registration and Check API Routes ---

// POST /api/users/register - Register a new user or log them in if UID exists with same name
app.post('/api/users/register', async (req, res) => {
    if (!usersCollection) {
        return res.status(503).json({ message: "User service not available." });
    }
    try {
        const { uid, name } = req.body;

        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            return res.status(400).json({ message: 'User ID (uid) is required.' });
        }
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Name is required.' });
        }

        const trimmedName = name.trim();
        if (trimmedName.length < 3) {
             return res.status(400).json({ message: 'Name must be at least 3 characters long.' });
        }


        // Check if UID already exists
        const existingUserByUID = await usersCollection.findOne({ uid: uid });

        if (existingUserByUID) {
            // UID exists. Check if the name matches.
            if (existingUserByUID.name === trimmedName) {
                // Same UID, same name - consider it a login/re-confirmation.
                return res.status(200).json({ uid: existingUserByUID.uid, name: existingUserByUID.name, message: "Welcome back!" });
            } else {
                // Same UID, different name. This is problematic.
                // For now, let's prevent name changes via this route.
                // A separate "update profile" route would be better for name changes.
                return res.status(409).json({ message: "This User ID is already associated with a different name. Please contact support if you believe this is an error." });
            }
        }

        // UID is new, now check if the name is already taken by another UID
        const existingUserByName = await usersCollection.findOne({ name: trimmedName });
        if (existingUserByName) {
            // Name is taken by a different UID
            return res.status(409).json({ message: "This name is already taken. Please choose a different name." });
        }

        // UID is new and Name is available, proceed to register
        const newUser = {
            uid: uid,
            name: trimmedName,
            createdAt: new Date()
        };
        const result = await usersCollection.insertOne(newUser);
        // const createdUser = await usersCollection.findOne({ _id: result.insertedId }); // Re-fetch to confirm

        // Return the newly created user data (or at least uid and name)
        res.status(201).json({ uid: newUser.uid, name: newUser.name, message: "User registered successfully." });

    } catch (error) {
        console.error("Error during user registration:", error);
        if (error.code === 11000) { // Duplicate key error (either uid or name from index)
             if (error.message.includes('index: name_1')) { // Check if it's the name index
                return res.status(409).json({ message: "This name is already taken. Please choose a different name." });
            } else if (error.message.includes('index: uid_1')) { // Check if it's the uid index (should be caught by findOne earlier but as a safeguard)
                 return res.status(409).json({ message: "This User ID is already registered." });
            }
        }
        res.status(500).json({ message: "Server error during user registration." });
    }
});

// GET /api/users/check/:uid - Check if a user is registered and get their name
app.get('/api/users/check/:uid', async (req, res) => {
    if (!usersCollection) {
        return res.status(503).json({ message: "User service not available." });
    }
    try {
        const { uid } = req.params;
        if (!uid) {
            return res.status(400).json({ message: 'User ID (uid) is required in path.' });
        }

        const user = await usersCollection.findOne({ uid: uid });

        if (user) {
            res.status(200).json({ uid: user.uid, name: user.name });
        } else {
            res.status(404).json({ message: "User not found or name not registered yet." });
        }
    } catch (error) {
        console.error("Error checking user:", error);
        res.status(500).json({ message: "Server error while checking user." });
    }
});

// --- End of User Registration and Check API Routes ---

// --- New AI Model API Routes ---

// Blackbox AI
app.post('/api/blackbox', async (req, res) => {
    const { ask, uid, webSearch } = req.body;
    if (!ask || !uid) {
        return res.status(400).json({ error: 'Parameters "ask" and "uid" are required for Blackbox AI.' });
    }
    const webSearchParam = (String(webSearch).toLowerCase() === 'on' || webSearch === true) ? 'on' : 'off';
    // The API key is hardcoded in the URL as per the example, but ideally, it should be a constant here.
    // For this implementation, I'll use the provided URL structure.
    const apiKey = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Extracted from example
    const blackboxApiUrl = `https://kaiz-apis.gleeze.com/api/blackbox?ask=${encodeURIComponent(ask)}&uid=${encodeURIComponent(uid)}&webSearch=${webSearchParam}&apikey=${apiKey}`;

    try {
        const apiResponse = await fetch(blackboxApiUrl);
        const responseText = await apiResponse.text();
        if (!apiResponse.ok) {
            let errorJson = { error: `External Blackbox API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Blackbox API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); }
        catch (e) { return res.status(500).json({ error: 'Failed to parse response from Blackbox API.', details: responseText }); }

        if (data && data.response) {
            res.json({ author: data.author || "Blackbox AI (Kaizenji)", response: data.response });
        } else {
            return res.status(500).json({ error: 'Unexpected response structure from Blackbox API.', details: data });
        }
    } catch (error) {
        console.error('Server error while calling Blackbox API:', error);
        return res.status(500).json({ error: 'Server error while processing Blackbox AI request.' });
    }
});

// DeepSeek API
app.post('/api/deepseek', async (req, res) => {
    const { ask } = req.body;
    if (!ask) {
        return res.status(400).json({ error: 'Parameter "ask" is required for DeepSeek API.' });
    }
    const apiKey = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Extracted from example
    const deepseekApiUrl = `https://kaiz-apis.gleeze.com/api/deepseek-v3?ask=${encodeURIComponent(ask)}&apikey=${apiKey}`;

    try {
        const apiResponse = await fetch(deepseekApiUrl);
        const responseText = await apiResponse.text();
        if (!apiResponse.ok) {
            let errorJson = { error: `External DeepSeek API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External DeepSeek API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); }
        catch (e) { return res.status(500).json({ error: 'Failed to parse response from DeepSeek API.', details: responseText }); }

        if (data && data.response) {
            res.json({ author: data.author || "DeepSeek AI (Kaizenji)", response: data.response });
        } else {
            return res.status(500).json({ error: 'Unexpected response structure from DeepSeek API.', details: data });
        }
    } catch (error) {
        console.error('Server error while calling DeepSeek API:', error);
        return res.status(500).json({ error: 'Server error while processing DeepSeek AI request.' });
    }
});

// Claude Haiku API
app.post('/api/claude-haiku', async (req, res) => {
    const { ask } = req.body;
    if (!ask) {
        return res.status(400).json({ error: 'Parameter "ask" is required for Claude Haiku API.' });
    }
    const apiKey = '793fcf57-8820-40ea-b34e-7addd227e2e6'; // Extracted from example
    const claudeApiUrl = `https://kaiz-apis.gleeze.com/api/claude3-haiku?ask=${encodeURIComponent(ask)}&apikey=${apiKey}`;

    try {
        const apiResponse = await fetch(claudeApiUrl);
        const responseText = await apiResponse.text();
        if (!apiResponse.ok) {
            let errorJson = { error: `External Claude Haiku API Error: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `External Claude Haiku API Error: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            return res.status(apiResponse.status).json(errorJson);
        }
        let data;
        try { data = JSON.parse(responseText); }
        catch (e) { return res.status(500).json({ error: 'Failed to parse response from Claude Haiku API.', details: responseText }); }

        if (data && data.response) {
            res.json({ author: data.author || "Claude Haiku (Kaizenji)", response: data.response });
        } else {
            return res.status(500).json({ error: 'Unexpected response structure from Claude Haiku API.', details: data });
        }
    } catch (error) {
        console.error('Server error while calling Claude Haiku API:', error);
        return res.status(500).json({ error: 'Server error while processing Claude Haiku AI request.' });
    }
});

// --- End of New AI Model API Routes ---

// --- TMDB API Routes ---
// Helper function to fetch data from TMDB
async function fetchTMDB(path, queryParams = {}) {
    const url = new URL(`${TMDB_BASE_URL}${path}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    // Add any other default params, e.g., language=en-US
    // url.searchParams.append('language', 'en-US'); // Or 'fr-FR' based on user preference
    for (const key in queryParams) {
        url.searchParams.append(key, queryParams[key]);
    }

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json;charset=utf-8'
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ status_message: `TMDB API error: ${response.statusText}` }));
            console.error(`TMDB API Error for path ${path}:`, errorData.status_message || response.statusText);
            throw { status: response.status, message: errorData.status_message || `Failed to fetch from TMDB: ${path}` };
        }
        return await response.json();
    } catch (error) {
        console.error(`Error in fetchTMDB for ${path}:`, error);
        throw error; // Re-throw to be handled by route
    }
}

// GET /api/movies/popular
app.get('/api/movies/popular', async (req, res) => {
    try {
        const data = await fetchTMDB('/movie/popular', { page: req.query.page || '1' });
        res.json(data);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to fetch popular movies.' });
    }
});

// GET /api/movies/search
app.get('/api/movies/search', async (req, res) => {
    const { query, page } = req.query;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required.' });
    }
    try {
        const data = await fetchTMDB('/search/movie', { query: query, page: page || '1' });
        res.json(data);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to search movies.' });
    }
});

// GET /api/movies/details/:id
app.get('/api/movies/details/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Movie ID is required.' });
    }
    try {
        // Fetch main details and credits simultaneously if desired
        const movieDetails = await fetchTMDB(`/movie/${id}`);
        // Example: Fetch credits (cast/crew)
        // const credits = await fetchTMDB(`/movie/${id}/credits`);
        // movieDetails.credits = credits; // Attach credits to the response
        res.json(movieDetails);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to fetch movie details.' });
    }
});

// GET /api/movies/details/:id/videos - Fetch videos for a movie
app.get('/api/movies/details/:id/videos', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Movie ID is required.' });
    }
    try {
        const videoData = await fetchTMDB(`/movie/${id}/videos`);
        res.json(videoData); // TMDB already returns {id, results: [...]}
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Failed to fetch movie videos.' });
    }
});
// --- END OF TMDB API Routes ---


// POST /api/activity - Track user activity
app.post('/api/activity', async (req, res) => {
    if (!userActivitiesCollection) {
        return res.status(503).json({ error: "Database service not available." });
    }
    try {
        const { uid, activityType, details, timestamp, url } = req.body;
        if (!uid || !activityType || !timestamp) {
            return res.status(400).json({ error: 'UID, activityType, and timestamp are required.' });
        }

        let userName = "Unknown"; // Default if user not found or name not set
        if (usersCollection) {
            const user = await usersCollection.findOne({ uid: uid });
            if (user && user.name) {
                userName = user.name;
            } else {
                console.warn(`Activity tracking: User name not found for UID: ${uid}. Storing activity with name 'Unknown'.`);
            }
        } else {
            console.warn("Activity tracking: usersCollection not available. Storing activity with name 'Unknown'.");
        }

        const newActivity = {
            uid,
            name: userName, // Add the user's name
            activityType,
            details: details || {},
            timestamp: new Date(timestamp), // Ensure it's a Date object
            url: url || ''
        };

        await userActivitiesCollection.insertOne(newActivity);
        res.status(201).json({ message: 'Activity tracked successfully.' });

    } catch (error) {
        console.error("Error tracking activity:", error);
        res.status(500).json({ error: "Failed to track activity due to server error." });
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

// --- Temp Email API Routes ---
const TEMPMAIL_API_KEY = '793fcf57-8820-40ea-b34e-7addd227e2e6';

app.get('/api/tempmail/create', async (req, res) => {
    const apiUrl = `https://kaiz-apis.gleeze.com/api/tempmail-create?apikey=${TEMPMAIL_API_KEY}`;
    try {
        const apiResponse = await fetch(apiUrl);
        const responseText = await apiResponse.text(); // Get text first for better error handling

        if (!apiResponse.ok) {
            let errorJson = { error: `API externe (tempmail-create) Erreur: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `API externe (tempmail-create) Erreur: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            console.error("Erreur de l'API tempmail-create:", errorJson);
            return res.status(apiResponse.status).json(errorJson);
        }
        const data = JSON.parse(responseText); // Assume response is JSON if OK
        res.json(data);
    } catch (error) {
        console.error('Erreur serveur lors de l\'appel à tempmail-create:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création de l\'e-mail temporaire.' });
    }
});

app.get('/api/tempmail/inbox', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ error: 'Le paramètre "token" est requis.' });
    }
    const apiUrl = `https://kaiz-apis.gleeze.com/api/tempmail-inbox?token=${encodeURIComponent(token)}&apikey=${TEMPMAIL_API_KEY}`;
    try {
        const apiResponse = await fetch(apiUrl);
        const responseText = await apiResponse.text(); // Get text first

        if (!apiResponse.ok) {
            let errorJson = { error: `API externe (tempmail-inbox) Erreur: ${apiResponse.status} ${apiResponse.statusText}`, details: responseText };
            try { errorJson = JSON.parse(responseText); if(!errorJson.error && !errorJson.message) { errorJson.error = `API externe (tempmail-inbox) Erreur: ${apiResponse.status} ${apiResponse.statusText}`; } } catch (e) { /* Not JSON */ }
            console.error("Erreur de l'API tempmail-inbox:", errorJson);
            return res.status(apiResponse.status).json(errorJson);
        }
        const data = JSON.parse(responseText); // Assume response is JSON if OK
        res.json(data);
    } catch (error) {
        console.error('Erreur serveur lors de l\'appel à tempmail-inbox:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération de la boîte de réception.' });
    }
});
// --- Fin des routes API Temp Email ---


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
