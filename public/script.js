document.addEventListener('DOMContentLoaded', () => {
    // --- Global Navigation Elements ---
    const allViewElements = document.querySelectorAll('.view');
    const homeBottomAppIcons = document.getElementById('home-bottom-app-icons');
    const subViewMenuTrigger = document.getElementById('sub-view-menu-trigger');
    const sideMenu = document.getElementById('side-menu');
    const homeMenuTriggerIcon = document.getElementById('home-menu-trigger-icon'); // Main menu icon on top bar for home
    // const mainContent = document.getElementById('main-content'); // Optional for overlay effect

    // --- Loaded Flags for View-Specific Data ---
    // These are examples; actual implementation might vary or be within the load functions.
    let commentsLoaded = false;
    let chatHistoryLoaded = false;
    let imageHistoryLoaded = false;
    let storyHistoryLoaded = false;
    // let vipStatusChecked = false; // checkInitialVipStatus usually runs every time VIP view is shown

    // --- Centralized showView Function (Assigned to window to be globally accessible) ---
    window.showView = function(viewIdToShow) {
        allViewElements.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.style.display = 'block'; // Or 'flex', 'grid' as needed
            viewToShow.classList.add('active');
        } else {
            console.warn(`View with ID "${viewIdToShow}" not found. Defaulting to home-view.`);
            const homeView = document.getElementById('home-view');
            if (homeView) {
                homeView.style.display = 'block';
                homeView.classList.add('active');
            }
            viewIdToShow = 'home-view'; // Update current view ID for logic below
        }

        // Manage visibility of navigation elements
        if (viewIdToShow === 'home-view') {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'flex';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'none';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'inline-flex'; // Or 'block' or 'flex'
            if (sideMenu && sideMenu.classList.contains('visible')) sideMenu.classList.remove('visible');
        } else {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'none';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'inline-flex';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'none';
        }

        // Call feature-specific load/init functions
        if (viewIdToShow === 'home-view') {
            if (typeof loadComments === 'function') loadComments();
        } else if (viewIdToShow === 'ai-chat-view') {
            if (typeof loadChatHistory === 'function') loadChatHistory();
            if (typeof loadWebSearchToggleState === 'function') loadWebSearchToggleState();
        } else if (viewIdToShow === 'image-generator-view') {
            if (typeof loadImageHistory === 'function') loadImageHistory();
        } else if (viewIdToShow === 'story-generator-view') {
            if (typeof loadStoryHistory === 'function') loadStoryHistory();
            if (typeof generatedStoryDisplay !== 'undefined' && generatedStoryDisplay) generatedStoryDisplay.innerHTML = '<p>Your generated story will appear here.</p>';
            if (typeof currentGeneratedStoryContent !== 'undefined') currentGeneratedStoryContent = "";
            if (typeof updateVipControlsVisibility === 'function') updateVipControlsVisibility();
        } else if (viewIdToShow === 'vip-view') {
            if (typeof checkInitialVipStatus === 'function') checkInitialVipStatus();
            if (typeof vipStatusMessage !== 'undefined' && vipStatusMessage) vipStatusMessage.style.display = 'none';
        }
        // Add other view-specific calls like for 'comments-view', 'weather-view' if they have init logic
    };

    // --- Navigation Event Listeners ---
    if (homeBottomAppIcons) {
        const homeAppButtons = homeBottomAppIcons.querySelectorAll('.home-app-btn');
        homeAppButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = button.dataset.view;
                if (viewId) window.showView(viewId);
            });
        });
    }

    function toggleSideMenu() {
        if (sideMenu) sideMenu.classList.toggle('visible');
    }
    if (homeMenuTriggerIcon) homeMenuTriggerIcon.addEventListener('click', toggleSideMenu);
    if (subViewMenuTrigger) subViewMenuTrigger.addEventListener('click', toggleSideMenu);

    if (sideMenu) {
        const sideMenuLinksList = sideMenu.querySelectorAll('ul li a');
        sideMenuLinksList.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) {
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
            const isClickOnHomeMenuTrigger = homeMenuIconContainer && homeMenuIconContainer.contains(event.target);
            const isClickOnSubViewMenuTrigger = subViewMenuTrigger && subViewMenuTrigger.contains(event.target);

            if (!isClickInsideSideMenu && !isClickOnHomeMenuTrigger && !isClickOnSubViewMenuTrigger) {
                sideMenu.classList.remove('visible');
            }
        }
    });

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Navigation Elements ---
    const allViewElements = document.querySelectorAll('.view');
    const homeBottomAppIcons = document.getElementById('home-bottom-app-icons');
    const subViewMenuTrigger = document.getElementById('sub-view-menu-trigger');
    const sideMenu = document.getElementById('side-menu');
    const homeMenuTriggerIcon = document.getElementById('home-menu-trigger-icon');
    // const mainContent = document.getElementById('main-content'); // Optional for overlay

    // --- Loaded Flags for View-Specific Data ---
    let commentsLoaded = false;
    let chatHistoryLoaded = false;
    let imageHistoryLoaded = false;
    let storyHistoryLoaded = false;
    // let vipStatusChecked = false; // Handled by checkInitialVipStatus

    // --- Centralized showView Function ---
    window.showView = function(viewIdToShow) {
        allViewElements.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.style.display = 'block'; // Or 'flex', 'grid' based on view's CSS
            viewToShow.classList.add('active');
        } else {
            console.warn(`View with ID "${viewIdToShow}" not found. Defaulting to home-view.`);
            document.getElementById('home-view').style.display = 'block';
            document.getElementById('home-view').classList.add('active');
            viewIdToShow = 'home-view'; // Correct current view for logic below
        }

        if (viewIdToShow === 'home-view') {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'flex';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'none';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'inline-flex';
            if (sideMenu) sideMenu.classList.remove('visible');
        } else {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'none';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'inline-flex';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'none';
        }

        // Feature-specific load calls
        if (viewIdToShow === 'home-view' && typeof loadComments === 'function') loadComments();
        else if (viewIdToShow === 'ai-chat-view') {
            if (typeof loadChatHistory === 'function') loadChatHistory();
            if (typeof loadWebSearchToggleState === 'function') loadWebSearchToggleState();
        } else if (viewIdToShow === 'image-generator-view' && typeof loadImageHistory === 'function') loadImageHistory();
        else if (viewIdToShow === 'story-generator-view') {
            if (typeof loadStoryHistory === 'function') loadStoryHistory();
            if(typeof generatedStoryDisplay !== 'undefined' && generatedStoryDisplay) generatedStoryDisplay.innerHTML = '<p>Your generated story will appear here.</p>';
            if(typeof currentGeneratedStoryContent !== 'undefined') currentGeneratedStoryContent = "";
            if(typeof updateVipControlsVisibility === 'function') updateVipControlsVisibility();
        } else if (viewIdToShow === 'vip-view') {
            if (typeof checkInitialVipStatus === 'function') checkInitialVipStatus();
            if(typeof vipStatusMessage !== 'undefined' && vipStatusMessage) vipStatusMessage.style.display = 'none';
        }
    };

    // --- Navigation Event Listeners ---
    if (homeBottomAppIcons) {
        homeBottomAppIcons.querySelectorAll('.home-app-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = button.dataset.view;
                if (viewId) window.showView(viewId);
            });
        });
    }

    function toggleSideMenu() {
        if (sideMenu) sideMenu.classList.toggle('visible');
    }
    if (homeMenuTriggerIcon) homeMenuTriggerIcon.addEventListener('click', toggleSideMenu);
    if (subViewMenuTrigger) subViewMenuTrigger.addEventListener('click', toggleSideMenu);

    if (sideMenu) {
        sideMenu.querySelectorAll('ul li a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) {
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

    // --- Initialize UID (globally for AI features) ---
    let chatUID = null;
    function getOrCreateUID() {
        let uid = localStorage.getItem('chatPortfolioUID');
        if (!uid) {
            uid = Date.now().toString(36) + Math.random().toString(36).substr(2);
            localStorage.setItem('chatPortfolioUID', uid);
        }
        return uid;
    }
    chatUID = getOrCreateUID();

    // --- WEATHER DISPLAY LOGIC (Refined) ---
    const weatherDisplayContainerRef = document.getElementById('weather-display-container');
    const sunnySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 5c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1zm0 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1zM5.22 6.22l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0L4.51 5.51c-.2.2-.2.51 0 .71.2.19.51.19.71 0zm12.73 12.73l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0l-1.41 1.41c-.2.2-.2.51 0 .71.2.2.51.2.71 0zM4 12c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1zm14 0c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1zm-9.19-6.07L6.22 4.51c-.2-.2-.51-.2-.71 0s-.2.51 0 .71l1.41 1.41c.2.2.51.2.71 0s.2-.51 0-.71zm11.31 11.31l-1.41 1.41c-.2.2-.51-.2-.71 0s-.2-.51 0-.71l1.41-1.41c.2-.2.51-.2.71 0s.2.51 0 .71zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>';
    const cloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>';
    const rainySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 4C9.17 4 6.71 5.32 5.12 7.24C5.08 7.21 5.04 7.19 5 7.17C3.08 7.57 1.5 9.31 1.5 11.5C1.5 13.98 3.52 16 6 16h.5v-1.5H6c-1.38 0-2.5-1.12-2.5-2.5S4.62 9.5 6 9.5h.28l.6-1.38C7.79 6.01 9.78 5 12 5c2.76 0 5 2.24 5 5v.5h1.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-1V18h1c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.46 0-.9.08-1.32.23C16.28 7.29 14.31 5.5 12 5.5V4zm-1 14.5v-4.5h-2L12 10l3 4.5h-2v4.5H11z"/></svg>';
    const snowySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19 13h-2V9h-2v4H9V9H7v4H5l7 7 7-7zm-8 2h2v2H9v-2zm4 0h2v2h-2v-2zm-4-4h2v2H9v-2zm4 0h2v2h-2v-2zm2-2V7H7v2h10zM5.41 6.12L4 7.54l3.03 3.03L12 5.59 8.97 2.56 7.55 4l2.04 2.04L5.41 6.12zM19.99 6.12L15.96 2.08 14.55 3.5l3.03 3.03L12 11.59l4.97-4.97L18.59 5l-2.04-2.04 4.48 4.48c.78.78.78 2.05 0 2.83l-4.48 4.48 2.04 2.04 1.41-1.41-3.03-3.03L20 8.96l-4.97 4.97-1.41-1.41 3.03-3.03c.78-.78.78-2.05 0-2.83l-2.04-2.04z"/></svg>';
    const partlyCloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M17.52 10.31C17.16 7.33 14.83 5 12 5c-2.32 0-4.35 1.32-5.31 3.24C4.32 8.64 2.5 10.61 2.5 13c0 2.48 2.02 4.5 4.5 4.5h10.5c2.21 0 4-1.79 4-4 0-2.06-1.54-3.78-3.48-3.96zM12 7c1.89 0 3.47 1.21 4.01 2.87l.23.67.73.03C17.56 10.6 18 11.03 18 11.5c0 .83-.67 1.5-1.5 1.5H7.21c-.49 0-.9-.35-1.02-.82-.01-.05-.02-.1-.02-.15 0-.74.55-1.36 1.27-1.48l.65-.11.28-.6C8.92 8.47 10.35 7 12 7z"/></svg>';
    const defaultWeatherSvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';

    function getWeatherSvgIcon(skytext) { /* ... same as before ... */
        if (!skytext) return defaultWeatherSvg;
        const lowerSkytext = skytext.toLowerCase();
        if (lowerSkytext.includes("sun") || lowerSkytext.includes("clear")) return sunnySvg;
        if (lowerSkytext.includes("partly cloudy") || lowerSkytext.includes("mostly clear") || lowerSkytext.includes("partly sunny")) return partlyCloudySvg;
        if (lowerSkytext.includes("cloudy") || lowerSkytext.includes("overcast") || lowerSkytext.includes("mostly cloudy")) return cloudySvg;
        if (lowerSkytext.includes("rain") || lowerSkytext.includes("shower")) return rainySvg;
        if (lowerSkytext.includes("snow") || lowerSkytext.includes("flurr")) return snowySvg;
        return defaultWeatherSvg;
    }
    function displayWeather(data) { /* ... same as before ... */
        if (!weatherDisplayContainerRef) return;
        if (!data || !data.current || !data.location) {
            weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather data unavailable.</p>`; return;
        }
        const iconSvg = getWeatherSvgIcon(data.current.skytext);
        const weatherHTML = `${iconSvg}<div class="weather-text"><p class="weather-temp">${data.current.temperature}°${data.location.degreetype}</p><p class="weather-location">${data.location.name.split(',')[0]}</p></div>`;
        weatherDisplayContainerRef.innerHTML = weatherHTML;
    }
    async function fetchWeather(location) { /* ... same as before ... */
        if (!weatherDisplayContainerRef) return;
        weatherDisplayContainerRef.innerHTML = `<p class="weather-loading">Loading...</p>`;
        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `HTTP error! ${response.statusText}` })); throw new Error(errorData.error || `Weather API Error: ${response.statusText}`);}
            const data = await response.json(); displayWeather(data);
        } catch (error) { console.error('Error fetching weather:', error); if (weatherDisplayContainerRef) weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather unavailable</p>`;}
    }
    function initWeatherDisplay() { /* ... same as before ... */
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => { console.log('Geolocation successful. Using default city.'); fetchWeather('Antananarivo'); },
                (error) => { console.error(`Geolocation error: ${error.message}. Using default.`); fetchWeather('Antananarivo'); }
            );
        } else { console.log("Geolocation not supported. Using default."); fetchWeather('Antananarivo'); }
    }
    initWeatherDisplay();
    // --- END OF WEATHER DISPLAY LOGIC ---

    // --- COMMENTS SECTION LOGIC ---
    const commentForm = document.getElementById('comment-form');
    const commentsDisplayArea = document.getElementById('comments-display-area');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');
    const portfolioCommentsKey = 'portfolioComments';
    function loadComments() { /* ... same as before ... */
        if (!commentsDisplayArea) return; let comments = [];
        try { const stored = localStorage.getItem(portfolioCommentsKey); if (stored) comments = JSON.parse(stored); } catch (e) { console.error(e); }
        commentsDisplayArea.innerHTML = '';
        if (comments.length === 0) { commentsDisplayArea.innerHTML = '<p>No comments yet.</p>'; }
        else {
            comments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(c => {
                const item = document.createElement('div'); item.className = 'comment-item';
                const nameEl = document.createElement('strong'); nameEl.textContent = c.name;
                const textEl = document.createElement('p'); textEl.textContent = c.text;
                const timeEl = document.createElement('small'); timeEl.className = 'comment-timestamp'; timeEl.textContent = new Date(c.timestamp).toLocaleString();
                item.append(nameEl, textEl, timeEl); commentsDisplayArea.appendChild(item);
            });
        }
    }
    if (commentForm) { /* ... same as before ... */
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault(); const name = commentNameInput.value.trim(); const text = commentTextInput.value.trim();
            if(!name || !text){ alert('Name and comment required.'); return; }
            const newComment = {name, text, timestamp: new Date().toISOString()};
            let comments = []; try{ const stored = localStorage.getItem(portfolioCommentsKey); if(stored) comments = JSON.parse(stored); }catch(err){console.error(err);}
            comments.push(newComment);
            try{ localStorage.setItem(portfolioCommentsKey, JSON.stringify(comments)); } catch(err){console.error(err); alert('Error saving.'); return;}
            commentNameInput.value = ''; commentTextInput.value = ''; loadComments();
        });
    }
    // --- END OF COMMENTS SECTION LOGIC ---

    // --- AI CHAT INTERFACE LOGIC (Refined for Avatars & Typing) ---
    const chatMessagesArea = document.getElementById('chat-messages-area');
    const chatInputField = document.getElementById('chat-input-field');
    const chatSendButton = document.getElementById('chat-send-button');
    const webSearchToggle = document.getElementById('web-search-toggle');

    // Placeholder SVGs for chat avatars
    const userAvatarSvg = '<svg viewBox="0 0 24 24" class="icon icon-chat-user"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>';
    const aiAvatarSvg = '<svg viewBox="0 0 24 24" class="icon icon-chat-ai"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.57-.5 5.07-1.34L20.67 22l-1.41-1.41L17.66 19.07A9.932 9.932 0 0022 12c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 9c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/></svg>';
    const typingIndicatorHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>'; // HTML for CSS animation

    let currentTypingIndicator = null; // To keep track of the typing indicator element

    function addMessageToChat(message, sender, isTyping = false) {
        if (!chatMessagesArea) return;

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper', sender === 'user' ? 'user' : 'ai');

        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('chat-avatar-container');
        avatarContainer.innerHTML = sender === 'user' ? userAvatarSvg : aiAvatarSvg;

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (isTyping) {
            messageBubble.innerHTML = typingIndicatorHTML; // Use HTML for typing animation
            messageWrapper.id = 'typing-indicator-message'; // Assign an ID to remove it later
            currentTypingIndicator = messageWrapper; // Store reference
        } else {
            messageBubble.textContent = message;
        }

        messageWrapper.appendChild(avatarContainer);
        messageWrapper.appendChild(messageBubble);
        chatMessagesArea.appendChild(messageWrapper);
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }

    function removeTypingIndicator() {
        if (currentTypingIndicator && currentTypingIndicator.parentNode) {
            currentTypingIndicator.parentNode.removeChild(currentTypingIndicator);
            currentTypingIndicator = null;
        }
    }

    function loadChatHistory() {
        if(!chatMessagesArea || !chatUID) return;
        chatMessagesArea.innerHTML = "";
        const historyKey = `chatHistory_${chatUID}`;
        let history = [];
        try{ const stored = localStorage.getItem(historyKey); if(stored) history = JSON.parse(stored); } catch(e){ console.error(e); }
        if(history.length === 0) addMessageToChat("Welcome to AI Chat! How can I help you today?", "ai");
        else history.forEach(item => addMessageToChat(item.message, item.sender));
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
    function saveMessageToHistory(message, sender) { /* ... same as before ... */
        if(!chatUID) return;
        const historyKey = `chatHistory_${chatUID}`;
        let history = [];
        try{ const stored = localStorage.getItem(historyKey); if(stored) history = JSON.parse(stored); } catch(e){ console.error(e); }
        history.push({message, sender, timestamp: new Date().toISOString()});
        if(history.length > 50) history = history.slice(history.length - 50);
        try{ localStorage.setItem(historyKey, JSON.stringify(history)); } catch(e){ console.error(e); }
    }
    async function handleSendMessage() {
        if (!chatInputField || !chatUID) return;
        const messageText = chatInputField.value.trim();
        if (!messageText) return;

        addMessageToChat(messageText, 'user');
        saveMessageToHistory(messageText, 'user');
        chatInputField.value = '';
        chatInputField.disabled = true;
        if(chatSendButton) chatSendButton.disabled = true;

        removeTypingIndicator(); // Remove any existing typing indicator
        addMessageToChat(null, 'ai', true); // Show new typing indicator

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: messageText, uid: chatUID, webSearch: webSearchToggle ? webSearchToggle.checked : false })
            });

            removeTypingIndicator(); // Remove typing indicator before showing response or error

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}`}));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addMessageToChat(aiResponse.response, 'ai');
                saveMessageToHistory(aiResponse.response, 'ai');
            } else { throw new Error("Invalid response structure from AI."); }
        } catch (error) {
            console.error('Error sending message:', error);
            removeTypingIndicator(); // Ensure indicator is removed on error too
            addMessageToChat(`Error: ${error.message || 'Could not connect to AI.'}`, 'ai');
        } finally {
             chatInputField.disabled = false;
             if(chatSendButton) chatSendButton.disabled = false;
             chatInputField.focus();
        }
    }
    if (chatSendButton) chatSendButton.addEventListener('click', handleSendMessage);
    if (chatInputField) chatInputField.addEventListener('keypress', e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }});

    const webSearchToggleKey = 'chatWebSearchEnabled';
    function loadWebSearchToggleState() {
        if (!webSearchToggle) return;
        webSearchToggle.checked = localStorage.getItem(webSearchToggleKey) === 'true';
    }
    if (webSearchToggle) {
        webSearchToggle.addEventListener('change', () => localStorage.setItem(webSearchToggleKey, webSearchToggle.checked));
    }
    // --- END OF AI CHAT INTERFACE LOGIC ---

    // Stubs for other feature JS to keep the script runnable
    function loadImageHistory() { console.log("loadImageHistory called"); }
    function loadStoryHistory() { console.log("loadStoryHistory called"); }
    function checkInitialVipStatus() { console.log("checkInitialVipStatus called"); }
    function updateVipControlsVisibility() { console.log("updateVipControlsVisibility called"); }
    const imagePromptField = null, generateImageButton = null, imageDisplayArea = null, downloadImageButton = null, imageHistoryGallery = null;
    const storyThemeField = null, generateStoryButton = null, generatedStoryDisplay = null, storyHistoryList = null, storyVipControls = null, storyListenButton = null, storyTranslateButton = null, storyDownloadTextButton = null;
    let currentGeneratedStoryContent = "";
    const vipCodeInput = null, vipCodeSubmitButton = null, vipStatusMessage = null, vipAccessArea = null, vipToolsContainer = null;
    const vipAiTools = [];
    const fileReaderInput = null, fileReaderProcessBtn = null, fileReaderContentDisplay = null, fileReaderQuestionInput = null, fileReaderAskBtn = null, fileReaderAnswerDisplay = null;
    let currentFileText = "";

    // --- Final Initial State Call ---
    window.showView('home-view');
});
