const express = require('express');
const axios = require('axios');
const router = express.Router();

// Redirect to GitHub for authorization
router.get('/github', (req, res) => {
    const GITHUB_CLIENT_ID = req.app.locals.GITHUB_CLIENT_ID;
    const githubAuthUrl = \`https://github.com/login/oauth/authorize?client_id=\${GITHUB_CLIENT_ID}&scope=repo,user:email\`;
    res.redirect(githubAuthUrl);
});

// GitHub callback
router.get('/github/callback', async (req, res) => {
    const code = req.query.code;
    const GITHUB_CLIENT_ID = req.app.locals.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = req.app.locals.GITHUB_CLIENT_SECRET;

    if (!code) {
        return res.status(400).send('Error: No code received from GitHub.');
    }

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
        }, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            console.error('GitHub OAuth Error: No access token received.', tokenResponse.data);
            return res.status(500).send('Error: Could not obtain access token from GitHub. ' + (tokenResponse.data.error_description || ''));
        }
        req.session.githubAccessToken = accessToken;

        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': \`token \${accessToken}\`
            }
        });
        req.session.user = { login: userResponse.data.login, avatar_url: userResponse.data.avatar_url };

        res.redirect('/repos');
    } catch (error) {
        console.error('Error during GitHub OAuth callback:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred during GitHub authentication.');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

module.exports = router;
