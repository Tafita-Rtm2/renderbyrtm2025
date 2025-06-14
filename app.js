const express = require('express');
const session = require('express-session');
const path = require('path');
const axios = require('axios');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// GitHub App Credentials - PRIORITIZE ENVIRONMENT VARIABLES
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liN9VcfABHu7Lqi9'; // Fallback for convenience
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'bce085f1031ba6deb2d839b64fe944aee3004601'; // Fallback for convenience

// Session Secret - PRIORITIZE ENVIRONMENT VARIABLE
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_super_secure_wow_CHANGE_ME';

if (GITHUB_CLIENT_ID === 'Ov23liN9VcfABHu7Lqi9' || GITHUB_CLIENT_SECRET === 'bce085f1031ba6deb2d839b64fe944aee3004601') {
    console.warn("WARNING: Using default GitHub OAuth credentials. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables for your own GitHub OAuth App.");
}
if (SESSION_SECRET === 'your_very_secret_key_super_secure_wow_CHANGE_ME') {
    console.warn("WARNING: Using default session secret. Please set SESSION_SECRET environment variable to a strong random string.");
}

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set secure cookies in production
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to pass GitHub Client ID and auth status to templates
// Client ID is passed to construct auth URL on client if needed, but auth itself is server-side.
app.use((req, res, next) => {
    // No longer passing GITHUB_CLIENT_ID directly to all templates by default unless specifically needed.
    // The auth routes themselves will use the configured GITHUB_CLIENT_ID.
    res.locals.isAuthenticated = !!req.session.githubAccessToken;
    res.locals.user = req.session.user;
    next();
});

app.get('/', (req, res) => {
    res.render('index');
});

// Pass GITHUB_CLIENT_ID to auth routes via app.locals or directly
app.locals.GITHUB_CLIENT_ID = GITHUB_CLIENT_ID;
app.locals.GITHUB_CLIENT_SECRET = GITHUB_CLIENT_SECRET; // For auth callback logic

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/repos', async (req, res) => {
    if (!req.session.githubAccessToken) {
        return res.redirect('/');
    }
    try {
        const reposResponse = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': \`token \${req.session.githubAccessToken}\`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const reposData = reposResponse.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private,
            html_url: repo.html_url,
            description: repo.description,
            updated_at: repo.updated_at
        }));
        res.render('repos', { repos: reposData });
    } catch (error) { // Corrected the try-catch block's syntax error
        console.error('Error fetching repositories for /repos page:', error.response ? error.response.data : error.message);
        res.render('repos', { repos: [], error: 'Failed to load repositories.' });
    }
});

app.listen(PORT, () => {
    console.log(\`Server is running on http://localhost:\${PORT}\`);
});
