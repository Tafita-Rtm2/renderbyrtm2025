document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('theme-checkbox');
    const bodyElement = document.body;

    function applyTheme(theme) {
        if (theme === 'dark') {
            bodyElement.classList.add('dark-mode');
            if (themeCheckbox) themeCheckbox.checked = true;
        } else {
            bodyElement.classList.remove('dark-mode');
            if (themeCheckbox) themeCheckbox.checked = false;
        }
    }

    function toggleTheme() {
        if (themeCheckbox && bodyElement) {
            if (themeCheckbox.checked) {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            }
        }
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', toggleTheme);
    }

    // Load saved theme or set based on preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light'); // Default to light if no preference or saved theme
        }
    }

    // AI CHAT ELEMENT SELECTION (CRITICAL DIAGNOSTIC LOGS)
    const chatInputBarForCheck = document.getElementById('chat-input-bar');
    const chatInputFieldForCheck = document.getElementById('chat-input-field');
    const chatSendButtonForCheck = document.getElementById('chat-send-button');
    const webSearchToggleForCheck = document.getElementById('web-search-toggle');
    const webSearchContainerForCheck = document.querySelector('#ai-chat-view .web-search-container');

    console.log('[AI CHAT DIAGNOSTIC] chatInputBar selected on DOMContentLoaded:', chatInputBarForCheck);
    console.log('[AI CHAT DIAGNOSTIC] chatInputField selected on DOMContentLoaded:', chatInputFieldForCheck);
    console.log('[AI CHAT DIAGNOSTIC] chatSendButton selected on DOMContentLoaded:', chatSendButtonForCheck);
    console.log('[AI CHAT DIAGNOSTIC] webSearchToggle selected on DOMContentLoaded:', webSearchToggleForCheck);
    console.log('[AI CHAT DIAGNOSTIC] webSearchContainer selected on DOMContentLoaded:', webSearchContainerForCheck);

    // --- Global Navigation Elements ---
    const allViewElements = document.querySelectorAll('.view');
    const homeBottomAppIcons = document.getElementById('home-bottom-app-icons');
    const subViewMenuTrigger = document.getElementById('sub-view-menu-trigger');
    const sideMenu = document.getElementById('side-menu');
    const homeMenuTriggerIcon = document.getElementById('home-menu-trigger-icon');

    // --- Centralized showView Function ---
    window.showView = function(viewIdToShow, bypassAdminCheck = false) {
        if (viewIdToShow === 'admin-panel-view' && !bypassAdminCheck) {
            const enteredCode = prompt('Enter admin code:');
            if (enteredCode) {
                fetch('/api/verify-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ adminCode: enteredCode }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.showView('admin-panel-view', true);
                    } else {
                        alert(data.message || 'Invalid admin code.');
                    }
                })
                .catch(error => {
                    console.error('Error verifying admin code:', error);
                    alert('Error verifying admin code. Please try again.');
                });
            } else if (enteredCode === null) {
                // User cancelled the prompt, do nothing or show a message
                // console.log('Admin code prompt cancelled.');
            } else {
                // User entered empty string
                alert('Admin code is required to access this panel.');
            }
            return; // Stop further execution in this call
        }

        // --- Existing showView logic starts here ---
        allViewElements.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        // Explicitly hide or manage AI chat components when not the target view
        const aiChatView = document.getElementById('ai-chat-view');
        const chatInputBar = document.getElementById('chat-input-bar'); // Assuming this is the correct ID

        if (viewIdToShow !== 'ai-chat-view') {
            if (aiChatView && aiChatView.style.display !== 'none') { // Check if it's not already none
                // This is a safeguard; the main loop should handle hiding aiChatView itself.
                // aiChatView.style.display = 'none'; // Redundant if main loop is effective
            }
            if (chatInputBar) {
                // Specifically target the chat input bar to ensure it's hidden
                chatInputBar.style.display = 'none';
            }
        } else { // When 'ai-chat-view' IS being shown
            // Ensure chatInputBar is visible. Its display is part of aiChatView's flex layout.
            // If aiChatView is set to display:flex, child elements with default display (block/flex) will show.
            // If chatInputBar was explicitly set to display:none, it needs to be reset.
            if (chatInputBar) {
                 chatInputBar.style.display = 'flex'; // Or 'block' if that's its natural state in the layout
            }
        }

        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.style.display = 'block'; // Use 'block' or 'flex' as appropriate for the view's CSS
            viewToShow.classList.add('active');
        } else {
            console.warn(`View with ID "${viewIdToShow}" not found. Defaulting to home-view.`);
            const homeView = document.getElementById('home-view');
            if (homeView) {
                homeView.style.display = 'block';
                homeView.classList.add('active');
            }
            viewIdToShow = 'home-view';
        }
         // Special display handling for flex views
        if (viewIdToShow === 'ai-chat-view' || viewIdToShow === 'vip-view') { // vip-view might also be flex
            if(viewToShow) viewToShow.style.display = 'flex';
        }


        if (viewIdToShow === 'home-view') {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'flex';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'none';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'inline-flex'; // or 'block'
            if (sideMenu && sideMenu.classList.contains('visible')) sideMenu.classList.remove('visible');
        } else {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'none';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'inline-flex'; // or 'block'
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'none';
        }

        // Feature-specific load calls
        if (viewIdToShow === 'home-view' && typeof loadComments === 'function') loadComments();
        else if (viewIdToShow === 'ai-chat-view') {
            console.log('[AI CHAT DIAGNOSTIC] showView called for ai-chat-view.');
            // Logs for checking elements when ai-chat-view is shown
            console.log('[AI CHAT DIAGNOSTIC] Checking #chat-input-bar in DOM:', document.getElementById('chat-input-bar'));
            console.log('[AI CHAT DIAGNOSTIC] Checking #chat-input-field in DOM:', document.getElementById('chat-input-field'));
            console.log('[AI CHAT DIAGNOSTIC] Checking #chat-send-button in DOM:', document.getElementById('chat-send-button'));
            console.log('[AI CHAT DIAGNOSTIC] Checking #web-search-toggle in DOM:', document.getElementById('web-search-toggle'));
            console.log('[AI CHAT DIAGNOSTIC] Checking .web-search-container in DOM (within #ai-chat-view):', document.querySelector('#ai-chat-view .web-search-container'));

            if (typeof loadChatHistory === 'function') loadChatHistory();
            if (typeof loadWebSearchToggleState === 'function') loadWebSearchToggleState();
        } else if (viewIdToShow === 'image-generator-view' && typeof loadImagePromptHistory === 'function') loadImagePromptHistory();
        else if (viewIdToShow === 'story-generator-view') {
            if (typeof loadStoryHistory === 'function') loadStoryHistory();
            const sgDisplay = document.getElementById('generated-story-display');
            if(sgDisplay) sgDisplay.innerHTML = '<p>Your generated story will appear here.</p>'; // Reset display
            currentGeneratedStoryContent = "";
            currentGeneratedStoryTheme = "";
            if(typeof updateStoryVipControlsVisibility === 'function') updateStoryVipControlsVisibility();
        } else if (viewIdToShow === 'box-movie-view') {
            // Placeholder for when Box Movie view is shown
            // For example, load popular movies by default
            if (typeof fetchPopularMovies === 'function') {
                fetchPopularMovies();
            }
        } else if (viewIdToShow === 'weather-view') {
            const weatherView = document.getElementById('weather-view');
            if (currentWeatherData) { // If data is already fetched
                displayDetailedWeather(currentWeatherData);
            } else {
                if(weatherView) weatherView.innerHTML = '<p class="weather-loading">Loading detailed weather...</p>';
                initWeatherDisplay(); // Attempt to fetch it if not available
            }
        } else if (viewIdToShow === 'admin-panel-view') {
            const adminPanel = document.getElementById('admin-panel-view');
            if (adminPanel) {
                const commentsTabButton = adminPanel.querySelector('.admin-tab-button[data-tab="comments-admin"]');
                const commentsTabContent = adminPanel.querySelector('#comments-admin-tab');
                const analyticsTabButton = adminPanel.querySelector('.admin-tab-button[data-tab="analytics-admin"]');
                const analyticsTabContent = adminPanel.querySelector('#analytics-admin-tab');

                let analyticsWasActive = analyticsTabButton && analyticsTabButton.classList.contains('active');

                // Reset all tabs
                adminPanel.querySelectorAll('.admin-tab-button').forEach(b => b.classList.remove('active'));
                adminPanel.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

                // Set the previously active tab or default to comments
                if (analyticsWasActive && analyticsTabContent) {
                    analyticsTabButton.classList.add('active');
                    analyticsTabContent.classList.add('active');
                    if (typeof loadAdminAnalytics === 'function') loadAdminAnalytics();
                } else { // Default to comments tab
                    if (commentsTabButton) commentsTabButton.classList.add('active');
                    if (commentsTabContent) commentsTabContent.classList.add('active');
                    if (typeof loadAdminComments === 'function') loadAdminComments();
                }
            } else { // Fallback if adminPanel not found, try loading default
                 if (typeof loadAdminComments === 'function') loadAdminComments();
            }
        } else if (viewIdToShow === 'user-history-view') {
            if (typeof loadUserActivityHistory === 'function') {
                loadUserActivityHistory();
            }
        } else if (viewIdToShow === 'comments-view') { // Added for dedicated comments page
            if (typeof loadAllCommentsPage === 'function') loadAllCommentsPage();
        }
        else if (viewIdToShow === 'gemini-chat-view') {
            // Initialize Gemini Chat specific elements or load history if needed
            console.log('[GEMINI CHAT DIAGNOSTIC] showView called for gemini-chat-view.');
            if (typeof loadGeminiChatHistory === "function") { // Will be defined later
                loadGeminiChatHistory();
            }
            // Ensure input bar elements are correctly displayed for Gemini chat
            const geminiChatInputBar = document.getElementById('gemini-chat-input-bar');
            if (geminiChatInputBar) {
                geminiChatInputBar.style.display = 'flex'; // Or its default display style
            }
            const geminiChatView = document.getElementById('gemini-chat-view');
             if (geminiChatView) {
                geminiChatView.style.display = 'flex';
            }
        } else if (viewIdToShow === 'gpt4o-chat-view') {
            console.log('[GPT4O CHAT DIAGNOSTIC] showView called for gpt4o-chat-view.');
            if (typeof loadGpt4oChatHistory === "function") { // Will be defined later
                loadGpt4oChatHistory();
            }
            const gpt4oChatInputBar = document.getElementById('gpt4o-chat-input-bar');
            if (gpt4oChatInputBar) {
                gpt4oChatInputBar.style.display = 'flex';
            }
            const gpt4oChatView = document.getElementById('gpt4o-chat-view');
            if (gpt4oChatView) {
                gpt4oChatView.style.display = 'flex';
            }
        }

        // Track view visit at the end of showView, after all specific view logic
        if(typeof trackActivity === 'function') trackActivity('view_visit', { view: viewIdToShow });
    };

    // --- Navigation Event Listeners ---
    if (homeBottomAppIcons) {
        homeBottomAppIcons.querySelectorAll('.home-app-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = button.dataset.view;
                if (viewId) { // Removed VIP direct redirect
                    window.showView(viewId);
                }
            });
        });
    }
    function toggleSideMenu() { if (sideMenu) sideMenu.classList.toggle('visible'); }
    if (homeMenuTriggerIcon) homeMenuTriggerIcon.addEventListener('click', toggleSideMenu);
    if (subViewMenuTrigger) subViewMenuTrigger.addEventListener('click', toggleSideMenu);
    if (sideMenu) {
        sideMenu.querySelectorAll('ul li a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) { // Removed VIP direct redirect
                    window.showView(viewId);
                    sideMenu.classList.remove('visible');
                }
            });
        });
    }
    document.addEventListener('click', (event) => {
        if (sideMenu && sideMenu.classList.contains('visible')) {
            const isClickInsideSideMenu = sideMenu.contains(event.target);
            const homeMenuIconContainer = document.getElementById('top-left-menu-icon-container');
            const isClickOnHomeMenuTrigger = homeMenuIconContainer && homeMenuIconContainer.contains(event.target.closest('#top-left-menu-icon-container'));
            const isClickOnSubViewMenuTrigger = subViewMenuTrigger && subViewMenuTrigger.contains(event.target);
            if (!isClickInsideSideMenu && !isClickOnHomeMenuTrigger && !isClickOnSubViewMenuTrigger) {
                sideMenu.classList.remove('visible');
            }
        }
    });

    let chatUID = null;
    function getOrCreateUID() {
        let uid = localStorage.getItem('chatPortfolioUID');
        if (!uid) { uid = Date.now().toString(36) + Math.random().toString(36).substr(2); localStorage.setItem('chatPortfolioUID', uid); }
        return uid;
    }
    chatUID = getOrCreateUID();

    // --- User Activity Tracking ---
    async function trackActivity(activityType, detailsObject = {}) {
        if (!chatUID) {
            console.warn("User UID still not available. Activity not tracked.");
            return;
        }
        const activityData = {
            uid: chatUID,
            activityType: activityType,
            details: detailsObject,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        try {
            const response = await fetch('/api/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to track activity:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error sending activity data:', error);
        }
    }

    // --- WEATHER DISPLAY LOGIC ---
    const weatherDisplayContainerRef = document.getElementById('weather-display-container');
    const sunnySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 5c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1zm0 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1zM5.22 6.22l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0L4.51 5.51c-.2.2-.2.51 0 .71.2.19.51.19.71 0zm12.73 12.73l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0l-1.41 1.41c-.2.2-.2.51 0 .71.2.2.51.2.71 0zM4 12c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1zm14 0c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1zm-9.19-6.07L6.22 4.51c-.2-.2-.51-.2-.71 0s-.2.51 0 .71l1.41 1.41c.2.2.51.2.71 0s.2-.51 0-.71zm11.31 11.31l-1.41 1.41c-.2.2-.51-.2-.71 0s-.2-.51 0-.71l1.41-1.41c.2-.2.51-.2.71 0s.2.51 0 .71zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>';
    const cloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>';
    const rainySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 4C9.17 4 6.71 5.32 5.12 7.24C5.08 7.21 5.04 7.19 5 7.17C3.08 7.57 1.5 9.31 1.5 11.5C1.5 13.98 3.52 16 6 16h.5v-1.5H6c-1.38 0-2.5-1.12-2.5-2.5S4.62 9.5 6 9.5h.28l.6-1.38C7.79 6.01 9.78 5 12 5c2.76 0 5 2.24 5 5v.5h1.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-1V18h1c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.46 0-.9.08-1.32.23C16.28 7.29 14.31 5.5 12 5.5V4zm-1 14.5v-4.5h-2L12 10l3 4.5h-2v4.5H11z"/></svg>';
    const snowySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19 13h-2V9h-2v4H9V9H7v4H5l7 7 7-7zm-8 2h2v2H9v-2zm4 0h2v2h-2v-2zm-4-4h2v2H9v-2zm4 0h2v2h-2v-2zm2-2V7H7v2h10zM5.41 6.12L4 7.54l3.03 3.03L12 5.59 8.97 2.56 7.55 4l2.04 2.04L5.41 6.12zM19.99 6.12L15.96 2.08 14.55 3.5l3.03 3.03L12 11.59l4.97-4.97L18.59 5l-2.04-2.04 4.48 4.48c.78.78.78 2.05 0 2.83l-4.48 4.48 2.04 2.04 1.41-1.41-3.03-3.03L20 8.96l-4.97 4.97-1.41-1.41 3.03-3.03c.78-.78.78-2.05 0-2.83l-2.04-2.04z"/></svg>';
    const partlyCloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M17.52 10.31C17.16 7.33 14.83 5 12 5c-2.32 0-4.35 1.32-5.31 3.24C4.32 8.64 2.5 10.61 2.5 13c0 2.48 2.02 4.5 4.5 4.5h10.5c2.21 0 4-1.79 4-4 0-2.06-1.54-3.78-3.48-3.96zM12 7c1.89 0 3.47 1.21 4.01 2.87l.23.67.73.03C17.56 10.6 18 11.03 18 11.5c0 .83-.67 1.5-1.5 1.5H7.21c-.49 0-.9-.35-1.02-.82-.01-.05-.02-.1-.02-.15 0-.74.55-1.36 1.27-1.48l.65-.11.28-.6C8.92 8.47 10.35 7 12 7z"/></svg>';
    const defaultWeatherSvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';

    let currentWeatherData = null;

    function getWeatherSvgIcon(skytext) {
        if (!skytext) return defaultWeatherSvg; const lowerSkytext = skytext.toLowerCase();
        if (lowerSkytext.includes("sun") || lowerSkytext.includes("clear")) return sunnySvg;
        if (lowerSkytext.includes("partly cloudy") || lowerSkytext.includes("mostly clear") || lowerSkytext.includes("partly sunny")) return partlyCloudySvg;
        if (lowerSkytext.includes("cloudy") || lowerSkytext.includes("overcast") || lowerSkytext.includes("mostly cloudy")) return cloudySvg;
        if (lowerSkytext.includes("rain") || lowerSkytext.includes("shower")) return rainySvg;
        if (lowerSkytext.includes("snow") || lowerSkytext.includes("flurr")) return snowySvg; return defaultWeatherSvg;
    }
    function displayWeather(data) {
        if (!weatherDisplayContainerRef) return;
        if (!data || !data.current || !data.location) { weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather data unavailable.</p>`; return; }
        const iconSvg = getWeatherSvgIcon(data.current.skytext);
        const weatherHTML = `${iconSvg}<div class="weather-text"><p class="weather-temp">${data.current.temperature}°${data.location.degreetype}</p><p class="weather-location">${data.location.name.split(',')[0]}</p></div>`;
        weatherDisplayContainerRef.innerHTML = weatherHTML;
    }
    async function fetchWeather(location) {
        if (!weatherDisplayContainerRef) {
            console.warn("Top bar weather display container not found, but fetching weather for detailed view.");
        } else {
            weatherDisplayContainerRef.innerHTML = `<p class="weather-loading">Loading...</p>`;
        }

        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! ${response.statusText}` }));
                throw new Error(errorData.error || `Weather API Error: ${response.statusText}`);
            }
            const data = await response.json();

            currentWeatherData = data;

            if (weatherDisplayContainerRef) {
                displayWeather(currentWeatherData);
            }

            // If the detailed weather view is active, update it too
            const weatherViewActive = document.getElementById('weather-view');
            if (weatherViewActive && weatherViewActive.classList.contains('active')) {
                displayDetailedWeather(currentWeatherData);
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            if (weatherDisplayContainerRef) {
                weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather unavailable</p>`;
            }
            const weatherView = document.getElementById('weather-view');
            if (weatherView && weatherView.classList.contains('active')) {
                weatherView.innerHTML = `<p class="weather-error">Failed to fetch weather: ${error.message}</p>`;
            }
        }
    }
    function initWeatherDisplay() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => { console.log('Geolocation successful. Using default city.'); fetchWeather('Antananarivo'); },
                (error) => { console.error(`Geolocation error: ${error.message}. Using default.`); fetchWeather('Antananarivo'); }
            );
        } else { console.log("Geolocation not supported. Using default."); fetchWeather('Antananarivo'); }
    }
    initWeatherDisplay();
    // --- END OF WEATHER DISPLAY LOGIC ---

    // --- DETAILED WEATHER VIEW FUNCTION ---
    function displayDetailedWeather(data) {
        const weatherView = document.getElementById('weather-view');
        if (!weatherView || !data || !data.current || !data.location) {
            if(weatherView) weatherView.innerHTML = '<p class="weather-error">Detailed weather data is currently unavailable.</p>';
            return;
        }
        const getDayName = (dateString) => {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString(undefined, { weekday: 'long' });
        };
        let forecastHTML = '<p>No forecast data available.</p>';
        if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
            forecastHTML = data.forecast.slice(0, 5).map(day => `
                <div class="forecast-day">
                    <div>${getDayName(day.date)}</div>
                    ${getWeatherSvgIcon(day.skytextday)}
                    <div>${day.high}° / ${day.low}°${data.location.degreetype}</div>
                    <div>${day.skytextday}</div>
                </div>
            `).join('');
        }
        const detailedWeatherHTML = `
            <div class="weather-location-title">Weather in ${data.location.name}</div>
            <div class="current-conditions">
                <div class="current-temp">${data.current.temperature}°${data.location.degreetype}</div>
                <div class="current-sky">${data.current.skytext}</div>
                ${getWeatherSvgIcon(data.current.skytext)}
            </div>
            <div class="weather-details-grid">
                <div>Feels Like: ${data.current.feelslike}°${data.location.degreetype}</div>
                <div>Humidity: ${data.current.humidity}%</div>
                <div>Wind: ${data.current.winddisplay}</div>
                ${data.current.pressure ? `<div>Pressure: ${data.current.pressure} mb</div>` : ''}
                ${data.current.visibility ? `<div>Visibility: ${data.current.visibility} km</div>` : ''}
                <div>Day/Time: ${data.current.day}, ${data.current.observationtime}</div>
            </div>
            <div class="weather-forecast">
                <h4>5-Day Forecast</h4>
                <div class="forecast-grid">
                    ${forecastHTML}
                </div>
            </div>
        `;
        weatherView.innerHTML = detailedWeatherHTML;
    }

    // --- COMMENTS SECTION LOGIC ---
    const commentForm = document.getElementById('comment-form');
    const commentsDisplayArea = document.getElementById('comments-display-area'); // For home page
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');

    // For home page comments
    async function loadComments() {
        if (!commentsDisplayArea) return;
        commentsDisplayArea.innerHTML = '<p>Loading comments...</p>';
        let errorMessage = '';
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                errorMessage = errData?.error || `Failed to fetch comments: ${response.statusText}`;
                throw new Error(errorMessage);
            }
            const comments = await response.json();
            commentsDisplayArea.innerHTML = '';
            if (comments.length === 0) {
                commentsDisplayArea.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            } else {
                 // Display only a few recent comments on home, e.g., latest 5
                const recentComments = comments.slice(0, 5);
                recentComments.forEach(comment => {
                    const item = document.createElement('div');
                    item.className = 'comment-item';
                    item.dataset.commentId = comment._id;
                    const nameEl = document.createElement('strong');
                    nameEl.textContent = escapeHTML(comment.name);
                    const textEl = document.createElement('p');
                    textEl.textContent = escapeHTML(comment.text);
                    const timeEl = document.createElement('small');
                    timeEl.className = 'comment-timestamp';
                    timeEl.textContent = new Date(comment.createdAt).toLocaleString();
                    item.append(nameEl, textEl, timeEl);
                    if (comment.adminReplyText && comment.adminReplyText.trim() !== "") {
                        const replyDiv = document.createElement('div');
                        replyDiv.className = 'admin-reply-public';
                        const replyStrong = document.createElement('strong');
                        replyStrong.textContent = 'Admin Reply:';
                        const replyTextP = document.createElement('p');
                        replyTextP.style.margin = '5px 0 0 0';
                        replyTextP.textContent = escapeHTML(comment.adminReplyText);
                        replyDiv.appendChild(replyStrong);
                        replyDiv.appendChild(replyTextP);
                        if (comment.adminReplyTimestamp) {
                            const replyTimeEl = document.createElement('small');
                            replyTimeEl.className = 'comment-timestamp';
                            replyTimeEl.textContent = new Date(comment.adminReplyTimestamp).toLocaleString();
                            replyDiv.appendChild(replyTimeEl);
                        }
                        item.appendChild(replyDiv);
                    }
                    // No like/dislike buttons on home page comment display for now
                    commentsDisplayArea.appendChild(item);
                });
                 if (comments.length > 5) {
                    const seeMoreLink = document.createElement('a');
                    seeMoreLink.href = '#';
                    seeMoreLink.textContent = 'See all comments...';
                    seeMoreLink.classList.add('see-all-comments-link');
                    seeMoreLink.onclick = (e) => {
                        e.preventDefault();
                        window.showView('comments-view');
                    };
                    commentsDisplayArea.appendChild(seeMoreLink);
                }
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsDisplayArea.innerHTML = `<p class="error-message">${errorMessage || 'Could not load comments. Please try again later.'}</p>`;
        }
    }

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = commentNameInput.value.trim();
            const text = commentTextInput.value.trim();
            const submitButton = commentForm.querySelector('button[type="submit"]');
            let originalButtonText = '';
            if(submitButton) {
                originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
            }
            const existingError = commentForm.querySelector('.error-message');
            if (existingError) existingError.remove();
            if (!name || !text) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Name and comment are required.';
                commentForm.appendChild(errorDiv);
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                return;
            }
            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, text })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    const errorMsg = errData?.error || `Failed to submit comment: ${response.statusText}`;
                    throw new Error(errorMsg);
                }
                commentNameInput.value = '';
                commentTextInput.value = '';
                loadComments(); // Reload home page comments
                // If currently on comments-view, reload that too
                if (document.getElementById('comments-view')?.classList.contains('active') && typeof loadAllCommentsPage === 'function') {
                    loadAllCommentsPage();
                }
                trackActivity('comment_posted', { nameLength: name.length, textLength: text.length });
            } catch (error) {
                console.error('Error submitting comment:', error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = error.message || 'Could not submit comment. Please try again.';
                commentForm.appendChild(errorDiv);
            } finally {
                 if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }
    // --- END OF HOME PAGE COMMENTS SECTION LOGIC ---

    // --- DEDICATED COMMENTS PAGE LOGIC (Phase 4.2) ---
    async function loadAllCommentsPage() {
        const container = document.getElementById('all-comments-list-container');
        if (!container) return;
        container.innerHTML = '<p>Loading all comments...</p>';
        if (!chatUID) {
            console.warn("User UID not available for comment interactions.");
        }

        try {
            const response = await fetch('/api/comments');
            if (!response.ok) throw new Error('Failed to fetch comments.');
            const comments = await response.json();

            container.innerHTML = '';
            if (comments.length === 0) {
                container.innerHTML = '<p>No comments found on the site yet.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.className = 'all-comments-list-ul';
            comments.forEach(comment => {
                const li = document.createElement('li');
                li.className = 'all-comment-item';
                li.dataset.commentId = comment._id;

                const likes = comment.likes || { count: 0, users: [] };
                const dislikes = comment.dislikes || { count: 0, users: [] };
                const userHasLiked = chatUID ? likes.users.includes(chatUID) : false;
                const userHasDisliked = chatUID ? dislikes.users.includes(chatUID) : false;

                let commentHTML = `
                    <div class="comment-content">
                        <strong>${escapeHTML(comment.name)}</strong> (${new Date(comment.createdAt).toLocaleString()}):
                        <p>${escapeHTML(comment.text)}</p>
                    </div>
                `;
                if (comment.adminReplyText && comment.adminReplyText.trim() !== "") {
                    commentHTML += `
                        <div class="admin-reply-public" style="margin-left: 20px; margin-top: 5px;">
                             <p class="admin-reply-public-text">
                                <strong>Admin Reply (${new Date(comment.adminReplyTimestamp || Date.now()).toLocaleString()}):</strong>
                                ${escapeHTML(comment.adminReplyText)}
                            </p>
                        </div>`;
                }
                commentHTML += `
                    <div class="comment-actions">
                        <button class="like-btn ${userHasLiked ? 'active' : ''}" title="Like" ${!chatUID ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" class="icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                            <span class="like-count">${likes.count}</span>
                        </button>
                        <button class="dislike-btn ${userHasDisliked ? 'active' : ''}" title="Dislike" ${!chatUID ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" class="icon"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path></svg>
                            <span class="dislike-count">${dislikes.count}</span>
                        </button>
                    </div>
                `;
                li.innerHTML = commentHTML;
                ul.appendChild(li);

                if(chatUID){ // Only add listeners if UID exists
                    const likeButton = li.querySelector('.like-btn');
                    const dislikeButton = li.querySelector('.dislike-btn');
                    likeButton.addEventListener('click', () => handleCommentVote(comment._id, 'like', li));
                    dislikeButton.addEventListener('click', () => handleCommentVote(comment._id, 'dislike', li));
                }
            });
            container.appendChild(ul);

        } catch (error) {
            console.error('Error loading all comments:', error);
            container.innerHTML = `<p class="error-message">Could not load comments: ${error.message}</p>`;
        }
    }

    async function handleCommentVote(commentId, voteType, commentElement) {
        if (!chatUID) {
            alert("User ID is missing. Cannot vote."); // Should ideally not happen if buttons are disabled
            return;
        }
        try {
            const response = await fetch(`/api/comments/${commentId}/${voteType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: chatUID })
            });
            if (!response.ok) {
                const errData = await response.json().catch(()=>({error:"Failed to vote"}));
                throw new Error(errData.error);
            }
            const updatedComment = await response.json();

            const likes = updatedComment.likes || { count: 0, users: [] };
            const dislikes = updatedComment.dislikes || { count: 0, users: [] };
            commentElement.querySelector('.like-count').textContent = likes.count;
            commentElement.querySelector('.dislike-count').textContent = dislikes.count;

            const likeBtn = commentElement.querySelector('.like-btn');
            const dislikeBtn = commentElement.querySelector('.dislike-btn');
            likeBtn.classList.toggle('active', likes.users.includes(chatUID));
            dislikeBtn.classList.toggle('active', dislikes.users.includes(chatUID));

        } catch (error) {
            console.error(`Error ${voteType}ing comment:`, error);
            alert(`Error ${voteType}ing: ${error.message}`);
        }
    }
    // --- END OF DEDICATED COMMENTS PAGE LOGIC ---


    // --- AI CHAT INTERFACE LOGIC ---
    const chatMessagesArea = document.getElementById('chat-messages-area');
    const chatInputField = document.getElementById('chat-input-field');
    const chatSendButton = document.getElementById('chat-send-button');
    const webSearchToggle = document.getElementById('web-search-toggle');
    const userAvatarSvg = '<svg viewBox="0 0 24 24" class="icon icon-chat-user"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>';
    const aiAvatarSvg = '<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.57-.5 5.07-1.34L20.67 22l-1.41-1.41L17.66 19.07A9.932 9.932 0 0022 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 9c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/></svg>';
    const typingIndicatorHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    let currentTypingIndicator = null;
    function addMessageToChat(message, sender, isTyping = false) {
        if (!chatMessagesArea) return;
        const messageWrapper = document.createElement('div'); messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');
        const avatarContainer = document.createElement('div'); avatarContainer.classList.add('chat-avatar-container'); avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : aiAvatarSvg;
        const messageBubble = document.createElement('div'); messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'typing-indicator-message';
            currentTypingIndicator = messageWrapper;
        } else {
            messageBubble.innerHTML = formatTextContent(message);
        }

        messageWrapper.append(avatarContainer, messageBubble); chatMessagesArea.appendChild(messageWrapper);
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
    function removeTypingIndicator() { if (currentTypingIndicator && currentTypingIndicator.parentNode) { currentTypingIndicator.parentNode.removeChild(currentTypingIndicator); currentTypingIndicator = null;}}
    function loadChatHistory() {
        if(!chatMessagesArea || !chatUID) return; chatMessagesArea.innerHTML = "";
        const historyKey = `chatHistory_${chatUID}`; let history = [];
        try{ const stored = localStorage.getItem(historyKey); if(stored) history = JSON.parse(stored); } catch(e){ console.error(e); }
        if(history.length === 0) addMessageToChat("Welcome to AI Chat! How can I help you today?", "ai");
        else history.forEach(item => addMessageToChat(item.message, item.sender));
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
    function saveMessageToHistory(message, sender) {
        if(!chatUID) return; const historyKey = `chatHistory_${chatUID}`; let history = [];
        try{ const stored = localStorage.getItem(historyKey); if(stored) history = JSON.parse(stored); } catch(e){ console.error(e); }
        history.push({message, sender, timestamp: new Date().toISOString()});
        if(history.length > 50) history = history.slice(history.length - 50);
        try{ localStorage.setItem(historyKey, JSON.stringify(history)); } catch(e){ console.error(e); }
    }
    async function handleSendMessage() {
        if (!chatInputField || !chatUID) return; const messageText = chatInputField.value.trim(); if (!messageText) return;
        addMessageToChat(messageText, 'user'); saveMessageToHistory(messageText, 'user');
        trackActivity('ai_chat_message_sent', { messageLength: messageText.length, webSearch: webSearchToggle ? webSearchToggle.checked : false });
        chatInputField.value = '';
        chatInputField.disabled = true; if(chatSendButton) chatSendButton.disabled = true;
        removeTypingIndicator(); addMessageToChat(null, 'ai', true);
        try {
            const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ask: messageText, uid: chatUID, webSearch: webSearchToggle ? webSearchToggle.checked : false }) });
            removeTypingIndicator();
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}`})); throw new Error(errorData.error || `API request failed: ${response.status}`); }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) { addMessageToChat(aiResponse.response, 'ai'); saveMessageToHistory(aiResponse.response, 'ai'); }
            else { throw new Error("Invalid response structure from AI."); }
        } catch (error) { console.error('Error sending message:', error); removeTypingIndicator(); addMessageToChat(`Error: ${error.message || 'Could not connect to AI.'}`, 'ai');
        } finally { chatInputField.disabled = false; if(chatSendButton) chatSendButton.disabled = false; chatInputField.focus(); }
    }
    if (chatSendButton) chatSendButton.addEventListener('click', handleSendMessage);
    if (chatInputField) chatInputField.addEventListener('keypress', e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }});
    const webSearchToggleKey = 'chatWebSearchEnabled';
    function loadWebSearchToggleState() { if (!webSearchToggle) return; webSearchToggle.checked = localStorage.getItem(webSearchToggleKey) === 'true';}
    if (webSearchToggle) webSearchToggle.addEventListener('change', () => localStorage.setItem(webSearchToggleKey, webSearchToggle.checked));
    // --- END OF AI CHAT INTERFACE LOGIC ---

    // --- IMAGE GENERATOR INTERFACE LOGIC ---
    const imagePromptField = document.getElementById('image-prompt-field');
    const generateImageButton = document.getElementById('generate-image-button');
    const imageDisplayArea = document.getElementById('image-display-area');
    const downloadImageButton = document.getElementById('download-image-button');
    const imageHistoryGallery = document.getElementById('image-history-gallery');
    let currentImageUrl = null;
    let currentImagePrompt = "";
    let currentImageBlob = null;
    const imageHistoryKey = 'portfolioImageHistory';

    async function handleImageGeneration() {
        if (!imagePromptField || !imageDisplayArea || !generateImageButton || !downloadImageButton) return;
        const promptValue = imagePromptField.value.trim();
        if (!promptValue) { alert('Please enter a prompt.'); return; }
        trackActivity('image_generation_requested', { promptLength: promptValue.length });
        imageDisplayArea.innerHTML = '<p class="image-loading">Generating image...</p>';
        generateImageButton.disabled = true; imagePromptField.disabled = true; downloadImageButton.style.display = 'none';

        if (currentImageUrl) { URL.revokeObjectURL(currentImageUrl); currentImageUrl = null; }
        currentImageBlob = null;

        try {
            const response = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: promptValue }) });
            if (!response.ok) {
                let errorMsg = `Error: ${response.status} ${response.statusText}`;
                try { const err = await response.json(); errorMsg = err.error || err.message || errorMsg; } catch(e){ /* Ignore if error response not JSON */ }
                throw new Error(errorMsg);
            }

            currentImageBlob = await response.blob();
            currentImageUrl = URL.createObjectURL(currentImageBlob);
            currentImagePrompt = promptValue;

            const img = document.createElement('img');
            img.src = currentImageUrl;
            img.alt = promptValue;
            img.onload = () => {
                saveImagePromptToHistory(promptValue);
                loadImagePromptHistory();
            };
            imageDisplayArea.innerHTML = '';
            imageDisplayArea.appendChild(img);
            downloadImageButton.style.display = 'inline-flex';
        } catch (error) {
            console.error('Image generation error:', error);
            imageDisplayArea.innerHTML = `<p class="image-error">Image generation failed: ${error.message}</p>`;
        } finally {
            generateImageButton.disabled = false;
            imagePromptField.disabled = false;
            if (imagePromptField) imagePromptField.focus();
        }
    }

    function handleImageDownload() {
        if (!currentImageBlob || !currentImagePrompt) {
            alert('No image has been generated yet, or the prompt is missing to name the file.');
            return;
        }
        const temporaryDownloadUrl = URL.createObjectURL(currentImageBlob);
        const a = document.createElement('a');
        a.href = temporaryDownloadUrl;
        let filename = currentImagePrompt.replace(/[^a-z0-9_]/gi, '_').substring(0,30).trim() || 'generated_image';
        const extension = currentImageBlob.type.split('/')[1] || 'png';
        a.download = `${filename}.${extension}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(temporaryDownloadUrl);
    }

    function saveImagePromptToHistory(prompt) {
        if (!localStorage) return;
        let history = JSON.parse(localStorage.getItem(imageHistoryKey)) || [];
        if(history.length > 0 && history[0].prompt === prompt) return;

        history.unshift({ prompt, timestamp: new Date().toISOString() });
        const maxHistoryItems = 10;
        if (history.length > maxHistoryItems) {
            history = history.slice(0, maxHistoryItems);
        }
        localStorage.setItem(imageHistoryKey, JSON.stringify(history));
    }

    function loadImagePromptHistory() {
        if (!imageHistoryGallery || !localStorage) return;

        const titleElement = imageHistoryGallery.querySelector('h4');
        const existingList = imageHistoryGallery.querySelector('.image-history-list');
        if (existingList) existingList.remove();
        const existingEmptyMsg = imageHistoryGallery.querySelector('.history-empty-message');
        if (existingEmptyMsg) existingEmptyMsg.remove();

        let history = JSON.parse(localStorage.getItem(imageHistoryKey)) || [];
        if (history.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No image generation history yet.';
            p.classList.add('history-empty-message');
            if (titleElement) titleElement.insertAdjacentElement('afterend', p); else imageHistoryGallery.appendChild(p);
            return;
        }

        const list = document.createElement('ul');
        list.classList.add('image-history-list');
        history.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add('image-history-item');

            const promptText = document.createElement('span');
            promptText.textContent = item.prompt;
            promptText.title = `Generated on: ${new Date(item.timestamp).toLocaleString()}`;

            const regenerateButton = document.createElement('button');
            regenerateButton.textContent = 'Regenerate';
            regenerateButton.classList.add('btn-history-regenerate');
            regenerateButton.onclick = () => {
                if(imagePromptField) imagePromptField.value = item.prompt;
                handleImageGeneration();
            };

            listItem.appendChild(promptText);
            listItem.appendChild(regenerateButton);
            list.appendChild(listItem);
        });
        imageHistoryGallery.appendChild(list);
    }

    if (generateImageButton) generateImageButton.addEventListener('click', handleImageGeneration);
    if (downloadImageButton) downloadImageButton.addEventListener('click', handleImageDownload);
    // --- END OF IMAGE GENERATOR INTERFACE LOGIC ---

    // --- STORY GENERATOR INTERFACE LOGIC ---
    const storyThemeField = document.getElementById('story-theme-field');
    const generateStoryButton = document.getElementById('generate-story-button');
    const generatedStoryDisplay = document.getElementById('generated-story-display');
    const storyHistoryList = document.getElementById('story-history-list');
    const storyVipControls = document.getElementById('story-vip-controls');
    const storyListenButton = document.getElementById('story-listen-button');
    const storyStopSpeechButton = document.getElementById('story-stop-speech-button'); // Get the new button
    const storyTranslateButton = document.getElementById('story-translate-button');
    const storyDownloadButton = document.getElementById('story-download-button-text');
    const storyHistoryKey = 'portfolioStoryHistory';
    let currentGeneratedStoryContent = "";
    let currentGeneratedStoryTheme = "";

    // --- TRAILER MODAL Elements ---
    const trailerModal = document.getElementById('trailer-modal');
    const trailerIframe = document.getElementById('trailer-iframe');
    const modalCloseButton = document.querySelector('#trailer-modal .modal-close-button');

    // --- TRAILER MODAL Functions ---
    function openTrailerModal(youtubeVideoId) {
        if (!trailerModal || !trailerIframe) {
            console.error('Trailer modal elements not found!');
            // Fallback to new tab if modal elements are missing for some reason
            window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank');
            return;
        }
        trailerIframe.src = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`; // Added autoplay & rel=0
        trailerModal.classList.add('visible');
        // Consider focusing on the modal or iframe for accessibility, though iframe focus can be tricky.
        // For now, the visual cue is the primary feedback.
    }

    function closeTrailerModal() {
        if (!trailerModal || !trailerIframe) return;
        trailerIframe.src = ''; // Clear src to stop video playback
        trailerModal.classList.remove('visible');
    }

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeTrailerModal);
    }

    if (trailerModal) {
        // Close modal if user clicks on the overlay (outside the modal-content)
        trailerModal.addEventListener('click', (event) => {
            if (event.target === trailerModal) { // Check if the click is directly on the overlay
                closeTrailerModal();
            }
        });
    }
    // Add keyboard accessibility for closing modal (Escape key)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && trailerModal && trailerModal.classList.contains('visible')) {
            closeTrailerModal();
        }
    });
    // --- END OF TRAILER MODAL ---

    // --- BOX MOVIE Elements ---
    const boxMovieSearchField = document.getElementById('box-movie-search-field');
    const boxMovieSearchButton = document.getElementById('box-movie-search-button');
    const boxMoviePopularGrid = document.getElementById('box-movie-popular-grid');
    const boxMovieSearchGrid = document.getElementById('box-movie-search-grid');
    const boxMoviePopularSection = document.getElementById('box-movie-popular-section');
    const boxMovieSearchResultsSection = document.getElementById('box-movie-search-results-section');
    const boxMovieDetailsSection = document.getElementById('box-movie-details-section');
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // For posters

    // --- BOX MOVIE Functions ---
    async function fetchFromTMDB(endpoint, params = {}) {
        const baseUrl = '/api/movies'; // Using our backend proxy
        // Construct the full URL using window.location.origin to ensure it's absolute
        const fullUrl = new URL(`${baseUrl}${endpoint}`, window.location.origin);
        Object.keys(params).forEach(key => fullUrl.searchParams.append(key, params[key]));

        try {
            const response = await fetch(fullUrl); // Use the full URL
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                console.error(`Error fetching ${endpoint}:`, errorData.message);
                throw new Error(errorData.message || `Failed to fetch data for ${endpoint}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Network or parsing error fetching ${endpoint}:`, error);
            throw error; // Re-throw to be caught by caller
        }
    }

    async function fetchPopularMovies() {
        if (!boxMoviePopularGrid || !boxMoviePopularSection) return;
        boxMoviePopularGrid.innerHTML = '<p class="loading-movies">Loading popular movies...</p>';
        boxMoviePopularSection.style.display = 'block';
        if (boxMovieSearchResultsSection) boxMovieSearchResultsSection.style.display = 'none';
        if (boxMovieDetailsSection) boxMovieDetailsSection.style.display = 'none';

        try {
            const data = await fetchFromTMDB('/popular');
            renderMovies(data.results, boxMoviePopularGrid);
        } catch (error) {
            boxMoviePopularGrid.innerHTML = `<p class="error-movies">Could not load popular movies: ${error.message}</p>`;
        }
    }

    async function searchMovies(query) {
        if (!query || !boxMovieSearchGrid || !boxMovieSearchResultsSection) return;
        boxMovieSearchGrid.innerHTML = '<p class="loading-movies">Searching movies...</p>';
        if (boxMoviePopularSection) boxMoviePopularSection.style.display = 'none';
        boxMovieSearchResultsSection.style.display = 'block';
        if (boxMovieDetailsSection) boxMovieDetailsSection.style.display = 'none';

        try {
            const data = await fetchFromTMDB('/search', { query });
            renderMovies(data.results, boxMovieSearchGrid);
             if (data.results && data.results.length === 0) {
                boxMovieSearchGrid.innerHTML = `<p class="info-movies">No movies found for "${escapeHTML(query)}".</p>`;
            }
        } catch (error) {
            boxMovieSearchGrid.innerHTML = `<p class="error-movies">Could not perform search: ${error.message}</p>`;
        }
    }

    async function getMovieDetails(movieId) {
        if (!movieId || !boxMovieDetailsSection) return;
        boxMovieDetailsSection.innerHTML = '<p class="loading-movies">Loading movie details...</p>';
        if (boxMoviePopularSection) boxMoviePopularSection.style.display = 'none';
        if (boxMovieSearchResultsSection) boxMovieSearchResultsSection.style.display = 'none';
        boxMovieDetailsSection.style.display = 'block';

        try {
            const movie = await fetchFromTMDB(`/details/${movieId}`);
            renderMovieDetails(movie, boxMovieDetailsSection);
        } catch (error) {
            boxMovieDetailsSection.innerHTML = `<p class="error-movies">Could not load movie details: ${error.message}</p>`;
        }
    }

    function renderMovies(movies, gridElement) {
        if (!movies || !gridElement) return;
        gridElement.innerHTML = ''; // Clear previous content or loading message
        if (movies.length === 0 && gridElement.id === 'box-movie-search-grid') {
            // This case is handled in searchMovies specifically for better message with query
            return;
        } else if (movies.length === 0) {
            gridElement.innerHTML = '<p class="info-movies">No movies to display.</p>';
            return;
        }

        movies.forEach(movie => {
            if (!movie.poster_path) return; // Skip movies without posters for a cleaner look

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.dataset.movieId = movie.id;
            movieCard.innerHTML = `
                <img src="${TMDB_IMAGE_BASE_URL}${movie.poster_path}" alt="${escapeHTML(movie.title)} Poster">
                <div class="movie-card-info">
                    <h4>${escapeHTML(movie.title)} ${movie.release_date ? '(' + movie.release_date.substring(0,4) + ')' : ''}</h4>
                    <p class="movie-rating">Rating: ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} <span class="star-icon">★</span></p>
                </div>
            `;
            movieCard.addEventListener('click', () => getMovieDetails(movie.id));
            gridElement.appendChild(movieCard);
        });
    }

    function renderMovieDetails(movie, detailElement) {
        if (!movie || !detailElement) return;
        const genres = movie.genres && movie.genres.map(g => escapeHTML(g.name)).join(', ');
        const productionCompanies = movie.production_companies && movie.production_companies.slice(0, 3).map(pc => escapeHTML(pc.name)).join(', ');

        detailElement.innerHTML = `
            <button id="box-movie-back-button" class="icon-button box-movie-back-btn">&larr; Back to list</button>
            <div class="movie-detail-header">
                <img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750.png?text=No+Poster'}" alt="${escapeHTML(movie.title)} Poster" class="movie-detail-poster">
                <div class="movie-detail-title-group">
                    <h1>${escapeHTML(movie.title)}</h1>
                    <p class="tagline"><em>${escapeHTML(movie.tagline || '')}</em></p>
                    <p><strong>Release Date:</strong> ${escapeHTML(movie.release_date || 'N/A')}</p>
                    <p><strong>Rating:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} (${movie.vote_count} votes) <span class="star-icon">★</span></p>
                    <p><strong>Runtime:</strong> ${movie.runtime ? movie.runtime + ' minutes' : 'N/A'}</p>
                    <p><strong>Genres:</strong> ${genres || 'N/A'}</p>
                </div>
            </div>
            <div class="movie-detail-overview">
                <h3>Overview</h3>
                <p>${escapeHTML(movie.overview || 'No overview available.')}</p>
            </div>
            <div class="movie-detail-meta">
                <p><strong>Status:</strong> ${escapeHTML(movie.status || 'N/A')}</p>
                <p><strong>Original Language:</strong> ${escapeHTML(movie.original_language ? movie.original_language.toUpperCase() : 'N/A')}</p>
                <p><strong>Budget:</strong> ${movie.budget ? '$' + movie.budget.toLocaleString() : 'N/A'}</p>
                <p><strong>Revenue:</strong> ${movie.revenue ? '$' + movie.revenue.toLocaleString() : 'N/A'}</p>
                <p><strong>Production Companies:</strong> ${productionCompanies || 'N/A'}</p>
            </div>

            <div class="movie-actions">
                <button id="watch-trailer-button-${movie.id}" class="btn-action-movie watch-trailer-btn" data-movie-id="${movie.id}">Watch Trailer</button>
                <button class="btn-action-movie download-movie-btn" title="Functionality not yet implemented" disabled>Download Movie</button>
            </div>
        `;
        const backButton = detailElement.querySelector('#box-movie-back-button');
        const watchTrailerButton = detailElement.querySelector(`#watch-trailer-button-${movie.id}`);

        if (watchTrailerButton) {
            watchTrailerButton.addEventListener('click', (e) => {
                const movieId = e.currentTarget.dataset.movieId;
                fetchAndDisplayTrailer(movieId);
            });
        }
        if (backButton) {
            backButton.addEventListener('click', () => {
                detailElement.style.display = 'none';
                detailElement.innerHTML = '';
                // Show the previously active list (popular or search)
                if (boxMovieSearchGrid && boxMovieSearchGrid.innerHTML !== '' && boxMovieSearchResultsSection && boxMovieSearchResultsSection.style.display === 'block') {
                    // Search results were visible, do nothing to explicitly re-show them as they are already block
                } else if (boxMoviePopularGrid && boxMoviePopularGrid.innerHTML !== '' && boxMoviePopularSection) {
                    boxMoviePopularSection.style.display = 'block';
                } else { // Fallback if neither list has content or popular section isn't found
                    fetchPopularMovies();
                }
            });
        }
    }

    if (boxMovieSearchButton && boxMovieSearchField) {
        boxMovieSearchButton.addEventListener('click', () => {
            const query = boxMovieSearchField.value.trim();
            if (query) {
                searchMovies(query);
            } else {
                fetchPopularMovies(); // If search is empty, show popular movies
            }
        });
        boxMovieSearchField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = boxMovieSearchField.value.trim();
                if (query) {
                    searchMovies(query);
                } else {
                    fetchPopularMovies(); // If search is empty on Enter, show popular movies
                }
            }
        });
    }

    async function fetchAndDisplayTrailer(movieId) {
        if (!movieId) return;
        console.log(`Fetching trailer for movie ID: ${movieId}`);
        try {
            // Note: The backend endpoint should be /api/movies/:id/videos or similar
            const videoData = await fetchFromTMDB(`/details/${movieId}/videos`); // Adjusted to match typical RESTful collection/item/subcollection
            if (videoData && videoData.results && videoData.results.length > 0) {
                const officialTrailer = videoData.results.find(video =>
                    video.type === 'Trailer' && video.site === 'YouTube' && video.official === true
                );
                const trailer = officialTrailer || videoData.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
                const teaser = videoData.results.find(video => video.type === 'Teaser' && video.site === 'YouTube');

                let videoToPlay = null;
                if (trailer) {
                    videoToPlay = trailer;
                } else if (teaser) {
                    videoToPlay = teaser;
                } else if (videoData.results[0] && videoData.results[0].site === 'YouTube') { // Fallback to first YouTube video
                    videoToPlay = videoData.results[0];
                }

                if (videoToPlay && videoToPlay.site === 'YouTube') {
                    // const youtubeUrl = `https://www.youtube.com/watch?v=${videoToPlay.key}`;
                    // window.open(youtubeUrl, '_blank'); // Old method
                    openTrailerModal(videoToPlay.key); // New method: open in modal
                } else {
                    alert('No suitable YouTube trailer found for this movie.');
                    console.log('Available videos:', videoData.results);
                }
            } else {
                alert('No trailers or video information found for this movie.');
            }
        } catch (error) {
            console.error('Error fetching or displaying trailer:', error);
            alert(`Could not fetch trailer information: ${error.message}`);
        }
    }
    // --- END OF BOX MOVIE ---

    // --- GEMINI CHAT ELEMENTS ---
    const geminiChatMessagesArea = document.getElementById('gemini-chat-messages-area');
    const geminiChatInputField = document.getElementById('gemini-chat-input-field');
    const geminiChatSendButton = document.getElementById('gemini-chat-send-button');
    const geminiChatImageUpload = document.getElementById('gemini-chat-image-upload');
    const geminiChatAttachImageButton = document.getElementById('gemini-chat-attach-image-button');
    const geminiImagePreviewContainer = document.getElementById('gemini-image-preview-container');
    const geminiChatImageUrlField = document.getElementById('gemini-chat-image-url-field');
    let currentGeminiSelectedFile = null;
    // let currentGeminiSelectedImageUrl = ""; // This variable is less relevant now with direct file upload for Gemini

    // --- GPT-4o CHAT ELEMENTS ---
    const gpt4oChatMessagesArea = document.getElementById('gpt4o-chat-messages-area');
    const gpt4oChatInputField = document.getElementById('gpt4o-chat-input-field');
    const gpt4oChatSendButton = document.getElementById('gpt4o-chat-send-button');
    const gpt4oChatImageUpload = document.getElementById('gpt4o-chat-image-upload');
    const gpt4oChatAttachImageButton = document.getElementById('gpt4o-chat-attach-image-button');
    const gpt4oImagePreviewContainer = document.getElementById('gpt4o-image-preview-container');
    let currentGpt4oSelectedFile = null; // To hold the selected file object for GPT-4o

    function checkVIPStatus() { // This function now checks localStorage
        return localStorage.getItem('isUserVIP') === 'true';
    }

    function updateStoryVipControlsVisibility() {
        if (!storyVipControls) return;
        // VIP status is no longer determined locally by 'isUserVIP' in localStorage
        // For now, hide story VIP controls by default.
        // If there's another mechanism to enable them, it would go here.
        storyVipControls.style.display = 'none';

        // Original logic that depended on checkVIPStatus() and currentGeneratedStoryContent:
        // if (checkVIPStatus() && currentGeneratedStoryContent) {
        //     storyVipControls.style.display = 'flex';
        // } else {
        //     storyVipControls.style.display = 'none';
        // }
    }

    function formatTextContent(text) {
        if (typeof text !== 'string') return ''; // Ensure input is a string
        let resultText = text;

        // 1. Headings (most specific structure)
        resultText = resultText.replace(/^### (.*$)/gim, '<h3>$1</h3>'); // For ### Title
        resultText = resultText.replace(/^## (.*$)/gim, '<h4>$1</h4>');   // For ## Subtitle

        // 2. Bold text using **double asterisks** (as per user's specific mention)
        // This is the primary fix required for this subtask.
        resultText = resultText.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

        // 3. Optional: Handle single asterisks for bold *if* this was the previous intent and is still desired.
        //    This rule is secondary to the ** rule and should not interfere.
        //    If single asterisks are for italics, this rule should be for <em>.
        //    Based on " **Bold Text** or *Bold Text* -> <strong>", we assume single * also means bold.
        //    The regex `\*([^*]+)\*` is used to avoid issues with already processed `<strong>**text**</strong>`
        //    and to ensure it doesn't just match a single literal asterisk.
        resultText = resultText.replace(/\*([^*]+)\*/gim, '<strong>$1</strong>');

        // Note: No other markdown features (like lists, blockquotes, or complex italics) are requested here.
        // The focus is solely on ensuring '###', '##', and critically '**text**' (and optionally '*text*') are handled.

        return resultText;
    }

    async function handleStoryGeneration() {
        if (!storyThemeField || !generatedStoryDisplay || !generateStoryButton) return;
        const theme = storyThemeField.value.trim();
        if (!theme) { alert('Please enter a theme or title for your story.'); return; }
        trackActivity('story_generation_requested', { themeLength: theme.length });
        generatedStoryDisplay.innerHTML = '<p class="story-loading">Crafting your tale... Please hold on.</p>';
        generateStoryButton.disabled = true; storyThemeField.disabled = true;
        currentGeneratedStoryContent = "";
        currentGeneratedStoryTheme = theme;
        updateStoryVipControlsVisibility();

        const storyPrompt = `Create a short story about: ${theme}`;
        if (!chatUID) chatUID = getOrCreateUID();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: storyPrompt, uid: chatUID, webSearch: 'off', isStoryRequestFlag: true })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `Story generation failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                currentGeneratedStoryContent = aiResponse.response;
                generatedStoryDisplay.innerHTML = formatTextContent(currentGeneratedStoryContent);
                saveStoryToHistory(currentGeneratedStoryTheme, currentGeneratedStoryContent);
                loadStoryHistory();
                updateStoryVipControlsVisibility();
            } else {
                throw new Error("Invalid response structure from story AI. Missing 'response' field.");
            }
        } catch (error) {
            console.error('Error generating story:', error);
            generatedStoryDisplay.innerHTML = `<p class="story-error">Error: ${error.message}</p>`;
            currentGeneratedStoryContent = "";
        } finally {
            generateStoryButton.disabled = false; storyThemeField.disabled = false;
            if(storyThemeField) storyThemeField.focus();
        }
    }

    function saveStoryToHistory(theme, content) {
        if (!localStorage) return;
        let history = JSON.parse(localStorage.getItem(storyHistoryKey)) || [];
        if (history.some(item => item.theme === theme && item.content === content)) return;
        history.unshift({ theme, content, timestamp: new Date().toISOString() });
        const maxStoryHistoryItems = 10;
        if (history.length > maxStoryHistoryItems) history = history.slice(0, maxStoryHistoryItems);
        localStorage.setItem(storyHistoryKey, JSON.stringify(history));
    }

    function loadStoryHistory() {
        if (!storyHistoryList || !localStorage) return;
        const storyHistoryArea = document.getElementById('story-history-area');
        if (!storyHistoryArea) return;
        storyHistoryList.innerHTML = '';
        let history = JSON.parse(localStorage.getItem(storyHistoryKey)) || [];
        if (history.length === 0) {
            storyHistoryList.innerHTML = '<p class="history-empty-message">No stories in your collection yet.</p>';
            return;
        }
        history.forEach((story) => {
            const storyItem = document.createElement('div');
            storyItem.classList.add('story-history-item');
            const themeText = document.createElement('span');
            themeText.textContent = story.theme;
            themeText.title = `Saved on: ${new Date(story.timestamp).toLocaleString()}`;
            storyItem.appendChild(themeText);
            storyItem.addEventListener('click', () => {
                if(generatedStoryDisplay) {
                    currentGeneratedStoryContent = story.content;
                    generatedStoryDisplay.innerHTML = formatTextContent(story.content);
                    currentGeneratedStoryTheme = story.theme;
                    if(storyThemeField) storyThemeField.value = story.theme;
                    updateStoryVipControlsVisibility();
                }
            });
            storyHistoryList.appendChild(storyItem);
        });
    }

    if (generateStoryButton) generateStoryButton.addEventListener('click', handleStoryGeneration);
    if (storyListenButton && storyStopSpeechButton) { // Ensure both buttons exist
        storyListenButton.addEventListener('click', () => {
            if (!currentGeneratedStoryContent) {
                alert('No story to listen to.');
                return;
            }
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech before starting a new one
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(currentGeneratedStoryContent);

                utterance.onstart = () => {
                    console.log('Speech started...');
                    storyStopSpeechButton.style.display = 'inline-flex'; // Show stop button
                    storyListenButton.disabled = true; // Disable listen button while speaking
                };

                utterance.onend = () => {
                    console.log('Speech ended...');
                    storyStopSpeechButton.style.display = 'none';   // Hide stop button
                    storyListenButton.disabled = false; // Re-enable listen button
                };

                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event.error);
                    alert('Could not play the story.');
                    storyStopSpeechButton.style.display = 'none';   // Hide stop button on error
                    storyListenButton.disabled = false; // Re-enable listen button
                };

                window.speechSynthesis.speak(utterance);
            } else {
                alert('Sorry, your browser does not support text-to-speech.');
            }
        });

        // Add event listener for the new stop button
        storyStopSpeechButton.addEventListener('click', () => {
            if ('speechSynthesis' in window) {
                console.log('Stop speech button clicked.');
                window.speechSynthesis.cancel(); // Stop any ongoing speech
                // The onend event of the utterance will handle hiding the stop button and re-enabling listen.
            }
        });
    }
    if(storyTranslateButton) {
        storyTranslateButton.addEventListener('click', async () => {
            if (!currentGeneratedStoryContent) { alert('No story to translate.'); return; }
            const targetLanguage = prompt("Enter target language (e.g., French, Spanish, German):");
            if (!targetLanguage || targetLanguage.trim() === "") return;
            const translatePrompt = `Translate the following story into ${targetLanguage.trim()}:\n\n"${currentGeneratedStoryContent}"`;
            if(generatedStoryDisplay) generatedStoryDisplay.innerHTML = `<p class="story-loading">Translating story to ${targetLanguage.trim()}...</p>`;
            if (!chatUID) chatUID = getOrCreateUID();
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ask: translatePrompt, uid: chatUID, webSearch: 'off' })
                });
                if (!response.ok) { const err = await response.json().catch(()=>{}); throw new Error(err?.error || `Translation failed: ${response.status}`);}
                const aiResponse = await response.json();
                if (aiResponse && aiResponse.response) {
                    if(generatedStoryDisplay) generatedStoryDisplay.textContent = aiResponse.response; // No formatTextContent for direct translation
                } else { throw new Error("Invalid response structure from translation AI."); }
            } catch (error) { console.error('Error translating story:', error); if(generatedStoryDisplay) generatedStoryDisplay.innerHTML = `<p class="story-error">Translation error: ${error.message}</p>`; }
        });
    }
    if(storyDownloadButton) {
        storyDownloadButton.addEventListener('click', () => {
            if (!currentGeneratedStoryContent || !currentGeneratedStoryTheme) { alert('No story content or theme.'); return; }
            const filename = (currentGeneratedStoryTheme.replace(/[^a-z0-9_]/gi, '_').substring(0,30).trim() || "generated_story") + ".txt";
            const blob = new Blob([currentGeneratedStoryContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = filename; document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        });
    }
    // --- END OF STORY GENERATOR INTERFACE LOGIC ---

    // --- GEMINI CHAT LOGIC (Initialisation Part) ---
    if (geminiChatAttachImageButton && geminiChatImageUpload) {
        geminiChatAttachImageButton.addEventListener('click', () => {
            geminiChatImageUpload.click(); // Trigger the hidden file input
        });

        geminiChatImageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                currentGeminiSelectedFile = file;
                // Display image preview
                if (geminiImagePreviewContainer) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        geminiImagePreviewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 50px; border-radius: 4px;">`;
                    };
                    reader.readAsDataURL(file);
                }
                // For now, we make the URL input field visible to ask the user for a URL.
                // Later, this part would be replaced by an actual image upload service call.
                if (geminiChatImageUrlField) {
                    // This field is now being phased out for input, ensure it's hidden or remove from HTML later
                    geminiChatImageUrlField.style.display = 'none';
                }
                // currentGeminiSelectedImageUrl = ""; // Not needed as we send the file directly
            } else {
                currentGeminiSelectedFile = null;
                if (geminiImagePreviewContainer) geminiImagePreviewContainer.innerHTML = "";
                if (geminiChatImageUrlField) geminiChatImageUrlField.style.display = 'none';
            }
        });
    }

    // Remove or comment out the logic that shows geminiChatImageUrlField on image selection,
    // as it's not the primary way to send images anymore.
    // The alert asking user to paste URL is also removed.

    let geminiTypingIndicator = null;

    function addGeminiMessageToChat(message, sender, imageUrl = null, isTyping = false) {
        if (!geminiChatMessagesArea) return;

        // Remove existing typing indicator before adding a new message or indicator
        if (geminiTypingIndicator && geminiTypingIndicator.parentNode) {
            geminiTypingIndicator.remove();
            geminiTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai'); // Re-use existing chat-message-wrapper styles

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        if (sender === 'user') {
            avatarContainer.innerHTML = userAvatarSvg;
        } else { // AI (Gemini)
            avatarContainer.innerHTML = `<img src="https://www.gstatic.com/images/branding/product/2x/gemini_48dp.png" alt="Gemini" class="gemini-avatar-logo">`;
        }

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble'); // Re-use

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML; // Re-use existing typing_indicator HTML
            messageWrapper.id = 'gemini-typing-indicator-message'; // Unique ID if needed
            geminiTypingIndicator = messageWrapper;
        } else {
            // Sanitize and format message text
            let formattedMessage = message ? formatTextContent(message) : ''; // formatTextContent from existing chat

            if (imageUrl) {
                // Simple image display, can be enhanced with CSS
                formattedMessage += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            messageBubble.innerHTML = formattedMessage;
        }

        messageWrapper.append(avatarContainer, messageBubble);
        geminiChatMessagesArea.appendChild(messageWrapper);
        geminiChatMessagesArea.scrollTop = geminiChatMessagesArea.scrollHeight;
    }


    async function handleGeminiSendMessage() {
        if (!geminiChatInputField || !chatUID) return;

        const messageText = geminiChatInputField.value.trim();
        // currentGeminiSelectedFile holds the File object if one was selected

        if (!messageText && !currentGeminiSelectedFile) {
            alert("Please type a message or select an image.");
            return;
        }

        // Display user's message in chat - if image selected, create a temporary object URL for display
        let tempPreviewUrl = null;
        if (currentGeminiSelectedFile) {
            tempPreviewUrl = URL.createObjectURL(currentGeminiSelectedFile);
        }
        addGeminiMessageToChat(messageText, 'user', tempPreviewUrl);
        // Note: We save tempPreviewUrl to history for local display. The actual image data is sent to backend.
        saveGeminiMessageToHistory(messageText, 'user', tempPreviewUrl);


        // Track activity
        trackActivity('gemini_chat_message_sent', {
            messageLength: messageText.length,
            hasImage: !!currentGeminiSelectedFile
        });

        const formData = new FormData();
        formData.append('uid', chatUID);
        if (messageText) {
            formData.append('q', messageText);
        }
        if (currentGeminiSelectedFile) {
            formData.append('imageFile', currentGeminiSelectedFile, currentGeminiSelectedFile.name);
        }

        // Clear inputs
        geminiChatInputField.value = '';
        // geminiChatImageUrlField is no longer used for input, so no need to clear or hide it if it's removed from HTML or permanently hidden
        if (geminiChatImageUrlField) geminiChatImageUrlField.style.display = 'none'; // Ensure it's hidden
        if (geminiImagePreviewContainer) geminiImagePreviewContainer.innerHTML = "";
        const oldSelectedFile = currentGeminiSelectedFile; // Keep reference for potential revokeObjectURL
        currentGeminiSelectedFile = null;


        // Disable input while waiting for response
        geminiChatInputField.disabled = true;
        if (geminiChatSendButton) geminiChatSendButton.disabled = true;
        if (geminiChatAttachImageButton) geminiChatAttachImageButton.disabled = true;

        addGeminiMessageToChat(null, 'gemini', null, true); // Show typing indicator for Gemini

        try {
            // const payload = { // Payload is now FormData
            //     q: messageText,
            //     uid: chatUID,
            // };
            // if (currentGeminiSelectedImageUrl) { // This logic is now part of FormData
            //     payload.imageUrl = currentGeminiSelectedImageUrl;
            // }

            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                // headers: { 'Content-Type': 'application/json' }, // Not for FormData
                body: formData // Send FormData directly
            });

            if (geminiTypingIndicator) geminiTypingIndicator.remove();

            // Revoke the object URL for the displayed user image after sending, if one was created
            if (tempPreviewUrl) {
                URL.revokeObjectURL(tempPreviewUrl);
            }
            if (oldSelectedFile && tempPreviewUrl) { // Double check, oldSelectedFile might be more reliable here
                 // URL.revokeObjectURL(URL.createObjectURL(oldSelectedFile)); // This would create a new one
            }


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addGeminiMessageToChat(aiResponse.response, 'gemini');
                // Assuming Gemini response does not contain an image URL to save with its own message
                saveGeminiMessageToHistory(aiResponse.response, 'gemini', null); // Save AI message
            } else {
                throw new Error("Invalid response structure from Gemini AI.");
            }

        } catch (error) {
            console.error('Error sending Gemini message:', error);
            if (geminiTypingIndicator) geminiTypingIndicator.remove();
            addGeminiMessageToChat(`Error: ${error.message || 'Could not connect to Gemini.'}`, 'gemini');
        } finally {
            geminiChatInputField.disabled = false;
            if (geminiChatSendButton) geminiChatSendButton.disabled = false;
            if (geminiChatAttachImageButton) geminiChatAttachImageButton.disabled = false;
            if (geminiChatInputField) geminiChatInputField.focus();
            currentGeminiSelectedImageUrl = ""; // Reset for the next message
        }
    }

    if (geminiChatSendButton) {
        geminiChatSendButton.addEventListener('click', handleGeminiSendMessage);
    }
    if (geminiChatInputField) {
        geminiChatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGeminiSendMessage();
            }
        });
    }

    // --- END OF GEMINI CHAT LOGIC (Initialisation Part) ---

    // --- GEMINI CHAT LOGIC (Part 3: History) ---
    const geminiHistoryKeyPrefix = 'geminiChatHistory_';

    function saveGeminiMessageToHistory(message, sender, imageUrl = null) {
        if (!chatUID) return; // Ensure UID is available
        const historyKey = `${geminiHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing Gemini chat history from localStorage:", e);
            // Potentially clear corrupted history: localStorage.removeItem(historyKey);
        }

        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString() });

        // Limit history size (e.g., to last 50 messages)
        if (history.length > 50) {
            history = history.slice(history.length - 50);
        }

        try {
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) {
            console.error("Error saving Gemini chat history to localStorage:", e);
            // This can happen if localStorage is full
        }
    }

    function loadGeminiChatHistory() {
        if (!geminiChatMessagesArea || !chatUID) return;
        geminiChatMessagesArea.innerHTML = ""; // Clear current messages

        const historyKey = `${geminiHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing Gemini chat history from localStorage on load:", e);
            // localStorage.removeItem(historyKey); // Option: Clear corrupted history
        }

        if (history.length === 0) {
            // Display a welcome message if history is empty
            addGeminiMessageToChat("Welcome to Gemini Chat! Ask me anything or send an image.", 'gemini');
        } else {
            history.forEach(item => {
                addGeminiMessageToChat(item.message, item.sender, item.imageUrl);
            });
        }
        if (geminiChatMessagesArea) geminiChatMessagesArea.scrollTop = geminiChatMessagesArea.scrollHeight;
    }

    // Integrate history saving into handleGeminiSendMessage
    // (This requires modifying the existing handleGeminiSendMessage function)

    // --- END OF GEMINI CHAT LOGIC (Part 3: History) ---

    // --- GPT-4o CHAT LOGIC ---
    let gpt4oTypingIndicator = null;
    const gpt4oHistoryKeyPrefix = 'gpt4oChatHistory_';

    // Placeholder SVG for GPT icon (until gpt.jpg is used)
    const gptAvatarSvg = `<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.57-.5 5.07-1.34L20.67 22l-1.41-1.41L17.66 19.07A9.932 9.932 0 0022 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 9c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/></svg>`;


    function addGpt4oMessageToChat(message, sender, imageUrl = null, isTyping = false) {
        if (!gpt4oChatMessagesArea) return;

        if (gpt4oTypingIndicator && gpt4oTypingIndicator.parentNode) {
            gpt4oTypingIndicator.remove();
            gpt4oTypingIndicator = null;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        if (sender === 'user') {
            avatarContainer.innerHTML = userAvatarSvg;
        } else { // AI (GPT-4o)
            // Replace with <img src="/gpt.jpg" alt="GPT" class="gpt4o-avatar-logo"> when gpt.jpg is available
            avatarContainer.innerHTML = `<img src="/gpt.jpg" alt="GPT" class="gpt4o-avatar-logo" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.innerHTML = '${gptAvatarSvg}'">`;
        }

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML;
            messageWrapper.id = 'gpt4o-typing-indicator-message';
            gpt4oTypingIndicator = messageWrapper;
        } else {
            let formattedMessage = message ? formatTextContent(message) : '';
            if (imageUrl) {
                formattedMessage += `<br><img src="${escapeHTML(imageUrl)}" alt="Chat Image" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">`;
            }
            messageBubble.innerHTML = formattedMessage;
        }

        messageWrapper.append(avatarContainer, messageBubble);
        gpt4oChatMessagesArea.appendChild(messageWrapper);
        gpt4oChatMessagesArea.scrollTop = gpt4oChatMessagesArea.scrollHeight;
    }

    async function handleGpt4oSendMessage() {
        if (!gpt4oChatInputField || !chatUID) return;

        const messageText = gpt4oChatInputField.value.trim();
        if (!messageText && !currentGpt4oSelectedFile) {
            alert("Please type a message or select an image for GPT-4o chat.");
            return;
        }

        let tempPreviewUrl = null;
        if (currentGpt4oSelectedFile) {
            tempPreviewUrl = URL.createObjectURL(currentGpt4oSelectedFile);
        }
        addGpt4oMessageToChat(messageText, 'user', tempPreviewUrl);
        saveGpt4oMessageToHistory(messageText, 'user', tempPreviewUrl);

        trackActivity('gpt4o_chat_message_sent', {
            messageLength: messageText.length,
            hasImage: !!currentGpt4oSelectedFile
        });

        const formData = new FormData();
        formData.append('uid', chatUID);
        if (messageText) formData.append('q', messageText); // API uses 'ask', but backend route /api/gpt4o-chat expects 'q' from form for consistency with Gemini route
        if (currentGpt4oSelectedFile) {
            formData.append('imageFile', currentGpt4oSelectedFile, currentGpt4oSelectedFile.name);
        }

        gpt4oChatInputField.value = '';
        if (gpt4oImagePreviewContainer) gpt4oImagePreviewContainer.innerHTML = "";
        currentGpt4oSelectedFile = null;

        gpt4oChatInputField.disabled = true;
        if (gpt4oChatSendButton) gpt4oChatSendButton.disabled = true;
        if (gpt4oChatAttachImageButton) gpt4oChatAttachImageButton.disabled = true;

        addGpt4oMessageToChat(null, 'ai', null, true); // Show typing indicator for GPT-4o

        try {
            const response = await fetch('/api/gpt4o-chat', {
                method: 'POST',
                body: formData
            });

            if (gpt4oTypingIndicator) gpt4oTypingIndicator.remove();
            if (tempPreviewUrl) URL.revokeObjectURL(tempPreviewUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `GPT-4o API request failed: ${response.status}`);
            }

            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addGpt4oMessageToChat(aiResponse.response, 'ai');
                saveGpt4oMessageToHistory(aiResponse.response, 'ai', null);
            } else {
                throw new Error("Invalid response structure from GPT-4o AI.");
            }
        } catch (error) {
            console.error('Error sending GPT-4o message:', error);
            if (gpt4oTypingIndicator) gpt4oTypingIndicator.remove();
            addGpt4oMessageToChat(`Error: ${error.message || 'Could not connect to GPT-4o.'}`, 'ai');
        } finally {
            gpt4oChatInputField.disabled = false;
            if (gpt4oChatSendButton) gpt4oChatSendButton.disabled = false;
            if (gpt4oChatAttachImageButton) gpt4oChatAttachImageButton.disabled = false;
            if (gpt4oChatInputField) gpt4oChatInputField.focus();
        }
    }

    if (gpt4oChatAttachImageButton && gpt4oChatImageUpload) {
        gpt4oChatAttachImageButton.addEventListener('click', () => gpt4oChatImageUpload.click());
        gpt4oChatImageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                currentGpt4oSelectedFile = file;
                if (gpt4oImagePreviewContainer) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        gpt4oImagePreviewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 50px; border-radius: 4px;">`;
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                currentGpt4oSelectedFile = null;
                if (gpt4oImagePreviewContainer) gpt4oImagePreviewContainer.innerHTML = "";
            }
        });
    }

    if (gpt4oChatSendButton) gpt4oChatSendButton.addEventListener('click', handleGpt4oSendMessage);
    if (gpt4oChatInputField) {
        gpt4oChatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGpt4oSendMessage();
            }
        });
    }

    function saveGpt4oMessageToHistory(message, sender, imageUrl = null) {
        if (!chatUID) return;
        const historyKey = `${gpt4oHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) { console.error("Error parsing GPT-4o chat history:", e); }
        history.push({ message, sender, imageUrl, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(history.length - 50);
        try {
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) { console.error("Error saving GPT-4o chat history:", e); }
    }

    function loadGpt4oChatHistory() {
        if (!gpt4oChatMessagesArea || !chatUID) return;
        gpt4oChatMessagesArea.innerHTML = "";
        const historyKey = `${gpt4oHistoryKeyPrefix}${chatUID}`;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) { console.error("Error parsing GPT-4o history on load:", e); }

        if (history.length === 0) {
            addGpt4oMessageToChat("Welcome to GPT-4o Chat! How can I assist you today?", 'ai');
        } else {
            history.forEach(item => addGpt4oMessageToChat(item.message, item.sender, item.imageUrl));
        }
        if (gpt4oChatMessagesArea) gpt4oChatMessagesArea.scrollTop = gpt4oChatMessagesArea.scrollHeight;
    }
    // --- END OF GPT-4o CHAT LOGIC ---

    // --- VIP AREA LOGIC (REMOVED) ---
    // const vipAccessArea = document.getElementById('vip-access-area'); // Element will be removed from HTML
    // const vipCodeInput = document.getElementById('vip-code-input');
    // const vipCodeSubmit = document.getElementById('vip-code-submit');
    // const vipStatusMessage = document.getElementById('vip-status-message');
    // const vipIframeContainer = document.getElementById('vip-iframe-container'); // Element will be removed

    // function handleVipAccess() { ... } // REMOVED
    // function checkInitialVipStatus() { ... } // REMOVED
    // Event listeners for vipCodeSubmit and vipCodeInput also removed as elements will be gone.
    // --- END OF VIP AREA LOGIC ---


    // --- PREMIUM AI TOOLS (VIP SECTION) LOGIC ---
    // This section might be removed if vip-tools-container is fully removed from HTML
    // For now, keeping it but it might not be reachable if the iframe takes over the VIP view.
    const vipAiTools = [
        { name: 'gemini', inputId: 'gemini-input', buttonId: 'gemini-send-btn', responseId: 'gemini-response' },
        { name: 'claude-haiku', inputId: 'claude-haiku-input', buttonId: 'claude-haiku-send-btn', responseId: 'claude-haiku-response' },
        { name: 'deepseek', inputId: 'deepseek-input', buttonId: 'deepseek-send-btn', responseId: 'deepseek-response' },
        { name: 'rtm-ai', inputId: 'rtm-ai-input', buttonId: 'rtm-ai-send-btn', responseId: 'rtm-ai-response' }
    ];
    async function handleVipAiRequest(aiName, inputEl, responseEl, buttonEl) {
        // ... (rest of the function remains the same, but consider if it's needed)
    }
    vipAiTools.forEach(tool => {
        // ... (event listeners remain the same, but consider if needed)
    });
    // --- END OF PREMIUM AI TOOLS (VIP SECTION) LOGIC ---

    // --- VIP FILE READER TOOL LOGIC ---
    // This section also might be removed/unreachable.
    const fileReaderInput = document.getElementById('file-reader-input');
    // ... (rest of file reader logic, consider if needed)
    // --- END OF VIP FILE READER TOOL LOGIC ---

    // --- Helper function to escape HTML for security ---
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    }

    // --- Admin Panel Logic ---
    async function loadAdminAnalytics() {
        const summaryDiv = document.getElementById('admin-analytics-summary');
        const recentActivitiesDiv = document.getElementById('admin-recent-activities');
        if (!summaryDiv || !recentActivitiesDiv) {
            console.warn("Analytics display elements not found.");
            return;
        }
        summaryDiv.innerHTML = '<p>Loading analytics...</p>';
        recentActivitiesDiv.innerHTML = '<p>Loading recent activities...</p>';
        try {
            const response = await fetch('/api/activities?limit=15');
            if (!response.ok) {
                const errData = await response.json().catch(()=>null);
                throw new Error(errData?.error || `Failed to fetch analytics: ${response.statusText}`);
            }
            const data = await response.json();
            summaryDiv.innerHTML = `
                <p><strong>Total Unique Visitors:</strong> ${data.uniqueVisitors !== undefined ? data.uniqueVisitors : 'N/A'}</p>
                <p><strong>Total Tracked Activities:</strong> ${data.totalActivities}</p>
            `;
            if (data.activities && data.activities.length > 0) {
                let activitiesHTML = '<ul>';
                data.activities.forEach(activity => {
                    activitiesHTML += `
                        <li>
                            <strong>${escapeHTML(activity.activityType)}</strong> by user <span class="activity-uid">${escapeHTML(activity.uid.slice(0,8))}...</span>
                            <br><span class="activity-details">Details: ${escapeHTML(JSON.stringify(activity.details))}</span>
                            <br><span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                            <br><span class="activity-time">URL: ${escapeHTML(activity.url)}</span>
                        </li>`;
                });
                activitiesHTML += '</ul>';
                recentActivitiesDiv.innerHTML = activitiesHTML;
            } else {
                recentActivitiesDiv.innerHTML = '<p>No recent activities found.</p>';
            }
        } catch (error) {
            console.error('Error loading admin analytics:', error);
            if(summaryDiv) summaryDiv.innerHTML = `<p class="error-message">Error loading summary: ${error.message}</p>`;
            if(recentActivitiesDiv) recentActivitiesDiv.innerHTML = `<p class="error-message">Error loading activities: ${error.message}</p>`;
        }
    }

    async function loadAdminComments() {
        const adminCommentsList = document.getElementById('admin-comments-list');
        if (!adminCommentsList) return;
        adminCommentsList.innerHTML = '<p>Loading comments...</p>';
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || `Failed to fetch comments: ${response.statusText}`);
            }
            const comments = await response.json();
            if (comments.length === 0) {
                adminCommentsList.innerHTML = '<p>No comments to display.</p>';
                return;
            }
            adminCommentsList.innerHTML = '';
            comments.forEach(comment => {
                const item = document.createElement('div');
                item.className = 'admin-comment-item';
                item.dataset.commentId = comment._id;
                const replyTimestamp = comment.adminReplyTimestamp ? new Date(comment.adminReplyTimestamp).toLocaleString() : '';
                const existingReplyText = comment.adminReplyText || '';
                item.innerHTML = `
                    <div class="comment-header">
                        <strong>${escapeHTML(comment.name)}</strong> -
                        <span class="comment-timestamp">${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="comment-text-admin">${escapeHTML(comment.text)}</p>
                    <div class="admin-reply-display">
                        ${existingReplyText ? `<p class="admin-reply-text"><strong>Admin Reply (${replyTimestamp}):</strong> ${escapeHTML(existingReplyText)}</p>` : '<p>No admin reply yet.</p>'}
                    </div>
                    <div class="admin-actions">
                        <textarea class="admin-reply-input" placeholder="Type your reply...">${escapeHTML(existingReplyText)}</textarea>
                        <button class="btn-admin-reply icon-button" title="Save Reply">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M21 3H3c-1.11 0-2 .89-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 16H5V7h14v12zm-2-7H7v-2h10v2z"></path></svg>
                        </button>
                        <button class="btn-admin-delete icon-button" title="Delete Comment">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </button>
                    </div>
                    <hr>
                `;
                adminCommentsList.appendChild(item);
                item.querySelector('.btn-admin-reply').addEventListener('click', async () => {
                    const replyInput = item.querySelector('.admin-reply-input');
                    const replyText = replyInput.value;
                    try {
                        const replyResponse = await fetch(`/api/comments/${comment._id}/reply`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ replyText: replyText })
                        });
                        if (!replyResponse.ok) {
                            const errData = await replyResponse.json().catch(()=>null);
                            throw new Error(errData?.error || `Failed to save reply: ${replyResponse.statusText}`);
                        }
                        loadAdminComments();
                    } catch (err) {
                        console.error('Error saving reply:', err);
                        alert(`Error saving reply: ${err.message}`);
                    }
                });
                item.querySelector('.btn-admin-delete').addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
                        return;
                    }
                    try {
                        const deleteResponse = await fetch(`/api/comments/${comment._id}`, { method: 'DELETE' });
                        if (!deleteResponse.ok) {
                             const errData = await deleteResponse.json().catch(()=>null);
                            throw new Error(errData?.error || `Failed to delete comment: ${deleteResponse.statusText}`);
                        }
                        loadAdminComments();
                    } catch (err) {
                        console.error('Error deleting comment:', err);
                        alert(`Error deleting comment: ${err.message}`);
                    }
                });
            });
        } catch (error) {
            console.error('Failed to load admin comments:', error);
            adminCommentsList.innerHTML = `<p class="weather-error">Error loading comments: ${error.message}</p>`;
        }
    }

    const adminPanel = document.getElementById('admin-panel-view');
    if (adminPanel) {
        const tabButtons = adminPanel.querySelectorAll('.admin-tab-button');
        const tabContents = adminPanel.querySelectorAll('.admin-tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const tabId = button.dataset.tab;
                tabContents.forEach(content => {
                    if (content.id === tabId + '-tab') {
                        content.classList.add('active');
                        if (tabId === 'analytics-admin' && typeof loadAdminAnalytics === 'function') {
                            loadAdminAnalytics();
                        }
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
    }

    const adminLoginTrigger = document.getElementById('admin-login-trigger-icon');
    if (adminLoginTrigger) {
        adminLoginTrigger.addEventListener('click', () => {
            window.showView('admin-panel-view'); // This will now use the updated showView with the prompt
        });
    }

    async function loadUserActivityHistory() {
        const activityListContainer = document.getElementById('user-activity-list-container');
        if (!activityListContainer) {
            console.error("User activity list container not found.");
            return;
        }
        if (!chatUID) {
            activityListContainer.innerHTML = '<p>User ID not found. Cannot load history.</p>';
            return;
        }
        activityListContainer.innerHTML = '<p>Loading your activity...</p>';
        try {
            const response = await fetch(`/api/activities?uid=${encodeURIComponent(chatUID)}&limit=100`);
            if (!response.ok) {
                const errData = await response.json().catch(()=>null);
                throw new Error(errData?.error || `Failed to fetch your activity: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.activities && data.activities.length > 0) {
                let activitiesHTML = '<ul>';
                data.activities.forEach(activity => {
                    let detailsStr = '';
                    if (activity.details && typeof activity.details === 'object' && Object.keys(activity.details).length > 0) {
                        detailsStr = Object.entries(activity.details)
                                         .map(([key, value]) => `${escapeHTML(key)}: ${escapeHTML(String(value))}`)
                                         .join(', ');
                        detailsStr = ` (${detailsStr})`;
                    } else if (activity.details && typeof activity.details === 'string' && activity.details.trim() !== '') {
                        detailsStr = ` (${escapeHTML(activity.details)})`;
                    }
                    activitiesHTML += `
                        <li>
                            <span class="user-activity-type">${escapeHTML(activity.activityType.replace(/_/g, ' '))}</span>
                            <span class="user-activity-details">${detailsStr}</span>
                            <div class="user-activity-meta">
                                <span class="user-activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                                <span class="user-activity-url">on ${escapeHTML(activity.url.replace(window.location.origin, '')) || '/'}</span>
                            </div>
                        </li>`;
                });
                activitiesHTML += '</ul>';
                activityListContainer.innerHTML = activitiesHTML;
            } else {
                activityListContainer.innerHTML = '<p>No activities recorded for you yet.</p>';
            }
        } catch (error) {
            console.error('Error loading user activity history:', error);
            activityListContainer.innerHTML = `<p class="error-message">Could not load your activity: ${error.message}</p>`;
        }
    }

    window.showView('home-view');
});
