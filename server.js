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

// MongoDB Connection (can be here)
const mongoUri = "mongodb+srv://rtmtafita:tafitaniaina1206@rtmchat.pzebpqh.mongodb.net/?retryWrites=true&w=majority&appName=rtmchat";
const client = new MongoClient(mongoUri);

let portfolioDb;
let commentsCollection;
let userActivitiesCollection; // Added for user activity tracking

async function connectDB() {
    try {
        await client.connect();
        portfolioDb = client.db("portfolioDb");
        commentsCollection = portfolioDb.collection("comments");
        userActivitiesCollection = portfolioDb.collection("userActivities"); // Initialize collection
        console.log("Successfully connected to MongoDB Atlas!");

        await commentsCollection.createIndex({ createdAt: -1 });
        console.log("Indexes ensured for comments collection.");

        await userActivitiesCollection.createIndex({ uid: 1 });
        await userActivitiesCollection.createIndex({ timestamp: -1 });
        await userActivitiesCollection.createIndex({ activityType: 1 });
        console.log("Indexes ensured for userActivities collection.");
    } catch (err) {
        console.error("Failed to connect to MongoDB Atlas or ensure indexes", err);
        process.exit(1);
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
            createdAt: new Date(),
            likes: { count: 0, users: [] },      // Initialize likes
            dislikes: { count: 0, users: [] }   // Initialize dislikes
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

        const newActivity = {
            uid,
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
