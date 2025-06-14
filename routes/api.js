const express = require('express');
const axios = require('axios'); // Keep for /repos
const router = express.Router();

// Middleware to check for authentication (can be used by specific routes)
const ensureAuthenticated = (req, res, next) => {
    if (req.session.githubAccessToken && req.session.user) { // Check for user session as well
        return next();
    }
    res.status(401).json({ error: 'User not authenticated' });
};

// GET /api/user - to check current user session
router.get('/user', (req, res) => {
    if (req.session.githubAccessToken && req.session.user) {
        res.json({
            isAuthenticated: true,
            user: req.session.user // Contains { login: 'username', avatar_url: '...' }
        });
    } else {
        res.json({
            isAuthenticated: false,
            user: null
        });
    }
});

// Fetch user repositories (existing route, ensure it uses ensureAuthenticated)
router.get('/repos', ensureAuthenticated, async (req, res) => {
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
        res.json(reposData);
    } catch (error) {
        console.error('Error fetching repositories from GitHub:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch repositories from GitHub' });
    }
});

module.exports = router;
