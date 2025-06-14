document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    let state = {
        isAuthenticated: false,
        user: null,
        repos: [],
        isLoading: true,
        error: null,
        currentView: 'loading' // loading, login, repos
    };

    // --- API Helper Functions ---
    async function fetchApi(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 401) { // Handle unauthorized specifically for session checks
                    return { error: 'Unauthorized', status: 401 };
                }
                throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
            }
            return await response.json();
        } catch (err) {
            console.error('Fetch API error:', err);
            return { error: err.message, status: 'FETCH_ERROR' };
        }
    }

    async function checkUserSession() {
        updateState({ isLoading: true });
        const data = await fetchApi('/api/user');
        if (data && !data.error) {
            updateState({
                isAuthenticated: data.isAuthenticated,
                user: data.user,
                isLoading: false
            });
        } else {
            updateState({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                // error: data.error // Optionally set an error
            });
        }
    }

    async function fetchUserRepos() {
        if (!state.isAuthenticated) return;
        updateState({ isLoading: true });
        const data = await fetchApi('/api/repos');
        if (data && !data.error) {
            updateState({ repos: data, isLoading: false });
        } else {
            updateState({ repos: [], isLoading: false, error: data.error || 'Failed to fetch repositories.' });
        }
    }

    // --- State Management ---
    function updateState(newState) {
        state = { ...state, ...newState };
        renderApp(); // Re-render whenever state changes
    }

    // --- Rendering Functions ---
    function renderNavbar() {
        if (!state.isAuthenticated) {
            return \`
                <nav class="main-nav">
                    <a href="#/" class="nav-logo">GitHub Deployer</a>
                </nav>
            \`;
        }
        return \`
            <nav class="main-nav">
                <a href="#/" class="nav-logo">GitHub Deployer</a>
                <div class="nav-links">
                    <a href="#/repos">Repositories</a>
                    <span>Welcome, \${state.user.login}!</span>
                    <img src="\${state.user.avatar_url}" alt="\${state.user.login} avatar" class="nav-avatar">
                    <a href="/auth/logout" id="logout-btn" class="btn btn-secondary">Logout</a>
                </div>
            </nav>
        \`;
    }

    function renderLoginView() {
        return \`
            <div class="view-container login-view">
                <h1>Connect Your GitHub</h1>
                <p>Link your GitHub account to view your repositories and simulate deployment.</p>
                <a href="/auth/github" class="btn btn-primary btn-login">Login with GitHub</a>
            </div>
        \`;
    }

    function renderReposView() {
        if (state.isLoading && state.repos.length === 0) return renderLoading('Fetching repositories...');
        if (state.error && state.currentView === 'repos') return renderError(state.error);
        if (state.repos.length === 0) {
            return \`
                <div class="view-container repos-view">
                    <h2>Your Repositories</h2>
                    <p>No repositories found, or you haven't fetched them yet.</p>
                    <button id="fetch-repos-again-btn" class="btn">Refresh Repositories</button>
                </div>
            \`;
        }

        let reposHtml = state.repos.map(repo => \`
            <li>
                <div class="repo-info">
                    <h3><a href="\${repo.html_url}" target="_blank" title="View on GitHub">\${repo.name}</a></h3>
                    <p>\${repo.description ? repo.description : 'No description provided.'}</p>
                    <small>Last updated: \${new Date(repo.updated_at).toLocaleDateString()}</small>
                </div>
                <button class="btn deploy-btn" data-repo-name="\${repo.name}">Deploy</button>
            </li>
        \`).join('');

        return \`
            <div class="view-container repos-view">
                <h2>Your Repositories</h2>
                <div id="deployment-status-client" class="deployment-status"></div>
                <ul>\${reposHtml}</ul>
            </div>
        \`;
    }

    function renderLoading(message = 'Loading...') {
        return \`<div class="loading-container"><p>\${message}</p><div class="spinner"></div></div>\`;
    }

    function renderError(message = 'An error occurred.') {
        return \`<div class="error-container"><p>\${message}</p></div>\`;
    }

    function renderApp() {
        if (state.isLoading && state.currentView === 'loading') {
            appRoot.innerHTML = renderLoading('Initializing application...');
            return;
        }

        let currentViewHtml = '';
        const hash = window.location.hash || '#/';

        if (!state.isAuthenticated) {
            // If not authenticated, always show login view, regardless of hash,
            // unless the auth callback is happening (which server handles by redirect)
            currentViewHtml = renderLoginView();
        } else {
            // Authenticated users
            if (hash === '#/repos') {
                currentViewHtml = renderReposView();
                if(state.repos.length === 0 && !state.isLoading && !state.error) { // Auto-fetch if repos view and no repos
                    fetchUserRepos();
                }
            } else { // Default to repos view if authenticated and hash is not #/repos or some other known route
                 window.location.hash = '#/repos'; // redirect to repos view
                 return; // renderApp will be called again by hash change
            }
        }

        const navbarHtml = renderNavbar();
        appRoot.innerHTML = navbarHtml + currentViewHtml;
        attachEventListeners();
    }

    // --- Event Listeners ---
    function attachEventListeners() {
        // Deploy buttons
        const deployButtons = document.querySelectorAll('.deploy-btn');
        deployButtons.forEach(button => {
            button.addEventListener('click', handleDeployClick);
        });

        // Logout button (if it exists)
        // Note: Logout is a direct link now, but if it were a button triggering JS:
        // const logoutButton = document.getElementById('logout-btn');
        // if (logoutButton) {
        //     logoutButton.addEventListener('click', async (e) => {
        //         e.preventDefault();
        //         await fetchApi('/auth/logout', { method: 'GET' }); // Or POST
        //         updateState({ isAuthenticated: false, user: null, repos: [] });
        //         window.location.hash = '#/'; // Go to login
        //     });
        // }
        const fetchReposAgainBtn = document.getElementById('fetch-repos-again-btn');
        if(fetchReposAgainBtn) {
            fetchReposAgainBtn.addEventListener('click', fetchUserRepos);
        }
    }

    function handleDeployClick(event) {
        const repoName = event.target.dataset.repoName;
        const deployStatusDiv = document.getElementById('deployment-status-client');

        event.target.disabled = true;
        event.target.textContent = 'Deploying...';
        if(deployStatusDiv) {
            deployStatusDiv.textContent = \`Initiating deployment for \${repoName}...\`;
            deployStatusDiv.className = 'deployment-status status-blue'; // Use CSS classes for styling
        }

        setTimeout(() => {
            event.target.disabled = false;
            event.target.textContent = 'Deploy';
            if(deployStatusDiv) {
                deployStatusDiv.textContent = \`✅ Successfully initiated deployment for \${repoName}!\`;
                deployStatusDiv.className = 'deployment-status status-green';
            }
            setTimeout(() => {
                if(deployStatusDiv) {
                    deployStatusDiv.textContent = '';
                    deployStatusDiv.className = 'deployment-status';
                }
            }, 5000);
        }, 2500);
    }

    // --- Routing ---
    function handleRouteChange() {
        // If authenticated and trying to go to '#/', redirect to '#/repos'
        if (state.isAuthenticated && window.location.hash === '#/') {
            window.location.hash = '#/repos';
            return; // renderApp will be called by the hash change listener
        }
        // If not authenticated and trying to go to '#/repos', redirect to '#/' (login)
        if (!state.isAuthenticated && window.location.hash === '#/repos') {
            window.location.hash = '#/';
            return;
        }
        renderApp(); // Re-render based on new hash or state
    }

    window.addEventListener('hashchange', handleRouteChange);

    // --- Initialization ---
    async function init() {
        updateState({ currentView: 'loading', isLoading: true });
        await checkUserSession(); // Check session first

        // Initial route handling based on authentication status and current hash
        const currentHash = window.location.hash || '#/';
        if (state.isAuthenticated) {
            if (currentHash === '#/' || currentHash === '#/login') { // If auth'd and on login/root, go to repos
                window.location.hash = '#/repos';
            } else if (currentHash === '#/repos' && state.repos.length === 0) { // If on repos and no repos data, fetch
                await fetchUserRepos();
            }
        } else {
            // If not authenticated, ensure they are on a view that doesn't require auth (login)
            if (currentHash === '#/repos') {
                window.location.hash = '#/';
            }
        }
        // Set current view based on hash after potential redirections
        const finalHash = window.location.hash || '#/';
        if (!state.isAuthenticated) {
            updateState({ currentView: 'login', isLoading: false });
        } else {
            if (finalHash === '#/repos') {
                updateState({ currentView: 'repos', isLoading: false });
            } else {
                 // Should not happen if logic above is correct, default to repos if somehow lost
                updateState({ currentView: 'repos', isLoading: false });
                 if(window.location.hash !== '#/repos') window.location.hash = '#/repos';
            }
        }
        // Final render based on resolved state and view
        renderApp();
    }

    init();
});
