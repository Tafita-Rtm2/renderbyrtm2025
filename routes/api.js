const express = require('express');
const axios = require('axios');
const router = express.Router();

// Middleware to check for authentication
const ensureAuthenticated = (req, res, next) => {
    if (req.session.githubAccessToken) {
        return next();
    }
    res.status(401).json({ error: 'User not authenticated' });
};

// Fetch user repositories
router.get('/repos', ensureAuthenticated, async (req, res) => {
    try {
        const reposResponse = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': \`token \${req.session.githubAccessToken}\`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        // Send back a simplified list of repos
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
