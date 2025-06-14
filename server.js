require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const app = express();

// --- Config ---
app.use(express.static('public'));
app.use('/site', express.static('sites'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// --- Passport GitHub Strategy ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback",
  scope: ['repo']
}, (accessToken, refreshToken, profile, done) => {
  profile.token = accessToken;
  return done(null, profile);
}));

// --- Routes ---
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.get('/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Non connecté' });
  res.json({ user: req.user });
});

app.post('/deploy', express.json(), async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Non connecté' });
  const { repoUrl } = req.body;

  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
  if (!match) return res.status(400).json({ error: 'URL invalide' });

  const [_, owner, repo] = match;
  const cloneUrl = `https://${req.user.token}@github.com/${owner}/${repo}.git`;
  const dest = path.join(__dirname, 'sites', `${owner}-${repo}`);

  try {
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });
    await simpleGit().clone(cloneUrl, dest);
    res.json({ success: true, url: `/site/${owner}-${repo}/` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur de déploiement' });
  }
});

// --- Démarrage ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Mini Render lancé sur http://localhost:" + PORT);
});
