const express = require('express');
const session = require('express-session');
const path = require('path');
// axios is still needed for auth callback, but not for rendering views server-side anymore
const axios = require('axios');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api'); // apiRoutes will be expanded

const app = express();
const PORT = process.env.PORT || 3000;

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liN9VcfABHu7Lqi9';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'bce085f1031ba6deb2d839b64fe944aee3004601';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_super_secure_wow_CHANGE_ME';

if (GITHUB_CLIENT_ID === 'Ov23liN9VcfABHu7Lqi9' || GITHUB_CLIENT_SECRET === 'bce085f1031ba6deb2d839b64fe944aee3004601') {
    console.warn("WARNING: Using default GitHub OAuth credentials. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.");
}
if (SESSION_SECRET === 'your_very_secret_key_super_secure_wow_CHANGE_ME') {
    console.warn("WARNING: Using default session secret. Please set SESSION_SECRET environment variable.");
}

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

// API and Authentication Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes); // This will include /api/repos and the new /api/user

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
