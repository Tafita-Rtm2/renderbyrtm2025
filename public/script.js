document.addEventListener('DOMContentLoaded', () => {
    // --- Global Navigation Elements ---
    const allViewElements = document.querySelectorAll('.view');
    const homeBottomAppIcons = document.getElementById('home-bottom-app-icons');
    const subViewMenuTrigger = document.getElementById('sub-view-menu-trigger');
    const sideMenu = document.getElementById('side-menu');
    const homeMenuTriggerIcon = document.getElementById('home-menu-trigger-icon');

    // --- Centralized showView Function ---
    window.showView = function(viewIdToShow) {
        allViewElements.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.style.display = 'block';
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

        if (viewIdToShow === 'home-view') {
            if (homeBottomAppIcons) homeBottomAppIcons.style.display = 'flex';
            if (subViewMenuTrigger) subViewMenuTrigger.style.display = 'none';
            if (homeMenuTriggerIcon) homeMenuTriggerIcon.style.display = 'inline-flex';
            if (sideMenu && sideMenu.classList.contains('visible')) sideMenu.classList.remove('visible');
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
        } else if (viewIdToShow === 'image-generator-view' && typeof loadImagePromptHistory === 'function') loadImagePromptHistory();
        else if (viewIdToShow === 'story-generator-view') {
            if (typeof loadStoryHistory === 'function') loadStoryHistory();
            const sgDisplay = document.getElementById('generated-story-display');
            if(sgDisplay) sgDisplay.innerHTML = '<p>Your generated story will appear here.</p>';
            currentGeneratedStoryContent = ""; // Reset global var for story content
            currentGeneratedStoryTheme = ""; // Reset global var for story theme
            if(typeof updateStoryVipControlsVisibility === 'function') updateStoryVipControlsVisibility();
        } else if (viewIdToShow === 'vip-view') {
            if (typeof checkInitialVipStatus === 'function') checkInitialVipStatus();
            const vipMsg = document.getElementById('vip-status-message');
            if(vipMsg) vipMsg.style.display = 'none';
        }
    };

    // --- Navigation Event Listeners ---
    if (homeBottomAppIcons) {
        homeBottomAppIcons.querySelectorAll('.home-app-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); const viewId = button.dataset.view; if (viewId) window.showView(viewId);
            });
        });
    }
    function toggleSideMenu() { if (sideMenu) sideMenu.classList.toggle('visible'); }
    if (homeMenuTriggerIcon) homeMenuTriggerIcon.addEventListener('click', toggleSideMenu);
    if (subViewMenuTrigger) subViewMenuTrigger.addEventListener('click', toggleSideMenu);
    if (sideMenu) {
        sideMenu.querySelectorAll('ul li a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); const viewId = link.dataset.view;
                if (viewId) { window.showView(viewId); sideMenu.classList.remove('visible');}
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

    // --- WEATHER DISPLAY LOGIC ---
    const weatherDisplayContainerRef = document.getElementById('weather-display-container');
    const sunnySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 5c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V6c0-.55.45-1 1-1zm0 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1zM5.22 6.22l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0L4.51 5.51c-.2.2-.2.51 0 .71.2.19.51.19.71 0zm12.73 12.73l1.41-1.41c.2-.2.2-.51 0-.71s-.51-.2-.71 0l-1.41 1.41c-.2.2-.2.51 0 .71.2.2.51.2.71 0zM4 12c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1zm14 0c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1zm-9.19-6.07L6.22 4.51c-.2-.2-.51-.2-.71 0s-.2.51 0 .71l1.41 1.41c.2.2.51.2.71 0s.2-.51 0-.71zm11.31 11.31l-1.41 1.41c-.2.2-.51-.2-.71 0s-.2-.51 0-.71l1.41-1.41c.2-.2.51-.2.71 0s.2.51 0 .71zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>';
    const cloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>';
    const rainySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 4C9.17 4 6.71 5.32 5.12 7.24C5.08 7.21 5.04 7.19 5 7.17C3.08 7.57 1.5 9.31 1.5 11.5C1.5 13.98 3.52 16 6 16h.5v-1.5H6c-1.38 0-2.5-1.12-2.5-2.5S4.62 9.5 6 9.5h.28l.6-1.38C7.79 6.01 9.78 5 12 5c2.76 0 5 2.24 5 5v.5h1.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-1V18h1c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.46 0-.9.08-1.32.23C16.28 7.29 14.31 5.5 12 5.5V4zm-1 14.5v-4.5h-2L12 10l3 4.5h-2v4.5H11z"/></svg>';
    const snowySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M19 13h-2V9h-2v4H9V9H7v4H5l7 7 7-7zm-8 2h2v2H9v-2zm4 0h2v2h-2v-2zm-4-4h2v2H9v-2zm4 0h2v2h-2v-2zm2-2V7H7v2h10zM5.41 6.12L4 7.54l3.03 3.03L12 5.59 8.97 2.56 7.55 4l2.04 2.04L5.41 6.12zM19.99 6.12L15.96 2.08 14.55 3.5l3.03 3.03L12 11.59l4.97-4.97L18.59 5l-2.04-2.04 4.48 4.48c.78.78.78 2.05 0 2.83l-4.48 4.48 2.04 2.04 1.41-1.41-3.03-3.03L20 8.96l-4.97 4.97-1.41-1.41 3.03-3.03c.78-.78.78-2.05 0-2.83l-2.04-2.04z"/></svg>';
    const partlyCloudySvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M17.52 10.31C17.16 7.33 14.83 5 12 5c-2.32 0-4.35 1.32-5.31 3.24C4.32 8.64 2.5 10.61 2.5 13c0 2.48 2.02 4.5 4.5 4.5h10.5c2.21 0 4-1.79 4-4 0-2.06-1.54-3.78-3.48-3.96zM12 7c1.89 0 3.47 1.21 4.01 2.87l.23.67.73.03C17.56 10.6 18 11.03 18 11.5c0 .83-.67 1.5-1.5 1.5H7.21c-.49 0-.9-.35-1.02-.82-.01-.05-.02-.1-.02-.15 0-.74.55-1.36 1.27-1.48l.65-.11.28-.6C8.92 8.47 10.35 7 12 7z"/></svg>';
    const defaultWeatherSvg = '<svg viewBox="0 0 24 24" class="weather-condition-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
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
        if (!weatherDisplayContainerRef) return; weatherDisplayContainerRef.innerHTML = `<p class="weather-loading">Loading...</p>`;
        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `HTTP error! ${response.statusText}` })); throw new Error(errorData.error || `Weather API Error: ${response.statusText}`);}
            const data = await response.json(); displayWeather(data);
        } catch (error) { console.error('Error fetching weather:', error); if (weatherDisplayContainerRef) weatherDisplayContainerRef.innerHTML = `<p class="weather-error">Weather unavailable</p>`;}
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

    // --- COMMENTS SECTION LOGIC ---
    const commentForm = document.getElementById('comment-form');
    const commentsDisplayArea = document.getElementById('comments-display-area');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');
    const portfolioCommentsKey = 'portfolioComments';
    function loadComments() {
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
    if (commentForm) {
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
        if (isTyping) { messageBubble.innerHTML = typingIndicatorHTML; messageWrapper.id = 'typing-indicator-message'; currentTypingIndicator = messageWrapper; }
        else { messageBubble.textContent = message; }
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
        addMessageToChat(messageText, 'user'); saveMessageToHistory(messageText, 'user'); chatInputField.value = '';
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
    const storyTranslateButton = document.getElementById('story-translate-button');
    const storyDownloadButton = document.getElementById('story-download-button-text'); // Corrected ID
    const storyHistoryKey = 'portfolioStoryHistory';
    let currentGeneratedStoryContent = "";
    let currentGeneratedStoryTheme = "";

    function checkVIPStatus() { return localStorage.getItem('isUserVIP') === 'true'; }

    function updateStoryVipControlsVisibility() {
        if (!storyVipControls) return;
        if (checkVIPStatus() && currentGeneratedStoryContent) {
            storyVipControls.style.display = 'flex';
        } else {
            storyVipControls.style.display = 'none';
        }
    }

    async function handleStoryGeneration() {
        if (!storyThemeField || !generatedStoryDisplay || !generateStoryButton) return;
        const theme = storyThemeField.value.trim(); if (!theme) { alert('Please enter a theme or title for your story.'); return; }
        generatedStoryDisplay.innerHTML = '<p class="story-loading">Crafting your tale... Please hold on.</p>';
        generateStoryButton.disabled = true; storyThemeField.disabled = true;
        currentGeneratedStoryContent = "";
        currentGeneratedStoryTheme = theme;
        updateStoryVipControlsVisibility();

        const storyPrompt = `Create a short story about the following topic or title: "${theme}". Be creative and engaging.`;
        if (!chatUID) chatUID = getOrCreateUID();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ask: storyPrompt, uid: chatUID, webSearch: 'off' })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `Story generation failed: ${response.status}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                currentGeneratedStoryContent = aiResponse.response;
                generatedStoryDisplay.textContent = currentGeneratedStoryContent;
                saveStoryToHistory(currentGeneratedStoryTheme, currentGeneratedStoryContent);
                loadStoryHistory();
                updateStoryVipControlsVisibility();
            } else {
                throw new Error("Invalid response structure from story AI.");
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
        const titleEl = storyHistoryArea.querySelector('h4'); // Assuming storyHistoryArea is parent of storyHistoryList
        storyHistoryList.innerHTML = ''; // Clear previous items

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
                    generatedStoryDisplay.textContent = story.content;
                    currentGeneratedStoryContent = story.content;
                    currentGeneratedStoryTheme = story.theme;
                    if(storyThemeField) storyThemeField.value = story.theme;
                    updateStoryVipControlsVisibility();
                }
            });
            storyHistoryList.appendChild(storyItem);
        });
    }

    if (generateStoryButton) generateStoryButton.addEventListener('click', handleStoryGeneration);

    if(storyListenButton) {
        storyListenButton.addEventListener('click', () => {
            if (!currentGeneratedStoryContent) { alert('No story to listen to.'); return; }
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(currentGeneratedStoryContent);
                utterance.onerror = (event) => { console.error('Speech synthesis error:', event.error); alert('Could not play the story.'); };
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            } else { alert('Sorry, your browser does not support text-to-speech.'); }
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
                    if(generatedStoryDisplay) generatedStoryDisplay.textContent = aiResponse.response;
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

    // --- VIP AREA LOGIC ---
    const vipCodeInput = document.getElementById('vip-code-input');
    const vipCodeSubmitButton = document.getElementById('vip-code-submit');
    const vipStatusMessage = document.getElementById('vip-status-message');
    const vipAccessArea = document.getElementById('vip-access-area');
    const vipToolsContainer = document.getElementById('vip-tools-container');
    const HARDCODED_VIP_CODE = "VIP123";
    function handleVipAccess() {
        if (!vipCodeInput || !vipStatusMessage || !vipAccessArea || !vipToolsContainer) return;
        const enteredCode = vipCodeInput.value;
        if (enteredCode === HARDCODED_VIP_CODE) {
            localStorage.setItem('isUserVIP', 'true');
            vipAccessArea.style.display = 'none'; vipToolsContainer.style.display = 'grid';
            vipStatusMessage.textContent = 'Access granted!'; vipStatusMessage.className = 'vip-status-success';
            if (typeof updateStoryVipControlsVisibility === 'function') updateStoryVipControlsVisibility();
        } else {
            localStorage.setItem('isUserVIP', 'false');
            vipStatusMessage.textContent = 'Invalid VIP code.'; vipStatusMessage.className = 'vip-status-error';
            vipToolsContainer.style.display = 'none';
             if (typeof updateStoryVipControlsVisibility === 'function') updateStoryVipControlsVisibility(); // Also update if access revoked
        }
        vipStatusMessage.style.display = 'block';
        setTimeout(() => { if(vipStatusMessage) vipStatusMessage.style.display = 'none'; }, 3000);
        vipCodeInput.value = '';
    }
    function checkInitialVipStatus() {
        if (!vipAccessArea || !vipToolsContainer) return;
        const isVIP = localStorage.getItem('isUserVIP') === 'true';
        vipAccessArea.style.display = isVIP ? 'none' : 'block';
        vipToolsContainer.style.display = isVIP ? 'grid' : 'none';
    }
    if (vipCodeSubmitButton) vipCodeSubmitButton.addEventListener('click', handleVipAccess);
    if (vipCodeInput) vipCodeInput.addEventListener('keypress', e => { if(e.key === 'Enter') handleVipAccess(); });
    // --- END OF VIP AREA LOGIC ---

    // --- PREMIUM AI TOOLS (VIP SECTION) LOGIC ---
    const vipAiTools = [
        { name: 'gemini', inputId: 'gemini-input', buttonId: 'gemini-send-btn', responseId: 'gemini-response' },
        { name: 'claude-haiku', inputId: 'claude-haiku-input', buttonId: 'claude-haiku-send-btn', responseId: 'claude-haiku-response' },
        { name: 'deepseek', inputId: 'deepseek-input', buttonId: 'deepseek-send-btn', responseId: 'deepseek-response' },
        { name: 'rtm-ai', inputId: 'rtm-ai-input', buttonId: 'rtm-ai-send-btn', responseId: 'rtm-ai-response' }
    ];
    async function handleVipAiRequest(aiName, inputEl, responseEl, buttonEl) {
        if (!inputEl || !responseEl || !buttonEl) { console.error(`Missing elements for ${aiName}`); return; }
        const prompt = inputEl.value.trim(); if (!prompt) { alert(`Enter prompt for ${aiName}.`); return; }
        responseEl.innerHTML = `<p class="vip-ai-loading">Thinking...</p>`;
        buttonEl.disabled = true; inputEl.disabled = true;
        if(!chatUID) chatUID = getOrCreateUID();
        try {
            const res = await fetch('/api/vip-chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({model: aiName, prompt, uid: chatUID}) });
            if(!res.ok) { const err = await res.json().catch(()=>{}); throw new Error(err?.error || `Error: ${res.statusText}`); }
            const data = await res.json();
            if(data && data.response) responseEl.textContent = data.response;
            else throw new Error("Invalid AI response.");
        } catch(e) { console.error(e); responseEl.innerHTML = `<p class="vip-ai-error">${e.message}</p>`;
        } finally { buttonEl.disabled = false; inputEl.disabled = false; inputEl.focus(); }
    }
    vipAiTools.forEach(tool => {
        const inputElement = document.getElementById(tool.inputId);
        const sendButtonElement = document.getElementById(tool.buttonId);
        const responseElement = document.getElementById(tool.responseId);
        if(sendButtonElement && inputElement && responseElement){
            sendButtonElement.addEventListener('click', () => handleVipAiRequest(tool.name, inputElement, responseElement, sendButtonElement));
            inputElement.addEventListener('keypress', e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleVipAiRequest(tool.name, inputElement, responseElement, sendButtonElement);}});
        } else { console.warn(`UI elements for VIP tool ${tool.name} not fully found.`); }
    });
    // --- END OF PREMIUM AI TOOLS (VIP SECTION) LOGIC ---

    // --- VIP FILE READER TOOL LOGIC ---
    const fileReaderInput = document.getElementById('file-reader-input');
    const fileReaderProcessBtn = document.getElementById('file-reader-process-btn');
    const fileReaderContentDisplay = document.getElementById('file-reader-content-display');
    const fileReaderQuestionInput = document.getElementById('file-reader-question');
    const fileReaderAskBtn = document.getElementById('file-reader-ask-btn');
    const fileReaderAnswerDisplay = document.getElementById('file-reader-answer');
    let currentFileText = "";

    function displayExtractedText(text, filename = "") {
        if (!fileReaderContentDisplay) return;
        if (text) {
            const snippet = text.substring(0, 1000);
            fileReaderContentDisplay.textContent = `Content of ${filename}:\n\n${snippet}${text.length > 1000 ? "\n\n[...truncated...]" : ""}`;
        } else { fileReaderContentDisplay.innerHTML = '<p>No text extracted.</p>'; }
    }
    function handleFileSelection() {
        if (!fileReaderInput || !fileReaderContentDisplay) return;
        const file = fileReaderInput.files[0]; if (!file) { alert("Select a file."); return; }
        fileReaderContentDisplay.innerHTML = `<p class="vip-ai-loading">Processing...</p>`; currentFileText = "";
        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => { currentFileText = e.target.result; displayExtractedText(currentFileText, file.name);
                if(fileReaderQuestionInput) fileReaderQuestionInput.value = ""; if(fileReaderAnswerDisplay) fileReaderAnswerDisplay.innerHTML = "<p>Answer will appear here.</p>";};
            reader.onerror = () => { fileReaderContentDisplay.innerHTML = `<p class="vip-ai-error">Error reading file.</p>`; };
            reader.readAsText(file);
        } else if (file.type === "application/pdf") {
            currentFileText = `Content of PDF "${file.name}" noted. Ask about its general nature.`;
            displayExtractedText(currentFileText, file.name);
            if(fileReaderQuestionInput) fileReaderQuestionInput.value = ""; if(fileReaderAnswerDisplay) fileReaderAnswerDisplay.innerHTML = "<p>Answer will appear here.</p>";
        } else { fileReaderContentDisplay.innerHTML = `<p class="vip-ai-error">Unsupported file. Use .txt or .pdf.</p>`; }
    }
    async function handleFileQuestion() {
        if (!fileReaderQuestionInput || !fileReaderAnswerDisplay || !fileReaderAskBtn) return;
        const question = fileReaderQuestionInput.value.trim(); if (!question) { alert("Enter a question."); return; }
        if (!currentFileText) { alert("Process a file first."); return; }
        fileReaderAnswerDisplay.innerHTML = `<p class="vip-ai-loading">Thinking...</p>`;
        fileReaderAskBtn.disabled = true; fileReaderQuestionInput.disabled = true;
        const contextPrompt = `Document content:\n---\n${currentFileText}\n---\n\nQuestion: "${question}"`;
        if (!chatUID) chatUID = getOrCreateUID();
        try {
            const response = await fetch('/api/vip-chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ model: 'gemini', prompt: contextPrompt, uid: chatUID }) });
            if (!response.ok) { const err = await response.json().catch(()=>{}); throw new Error(err?.error || `Error: ${response.statusText}`); }
            const result = await response.json();
            if (result && result.response) fileReaderAnswerDisplay.textContent = result.response;
            else throw new Error("Invalid AI response for file Q&A.");
        } catch (error) { console.error(error); fileReaderAnswerDisplay.innerHTML = `<p class="vip-ai-error">${error.message}</p>`;
        } finally { fileReaderAskBtn.disabled = false; fileReaderQuestionInput.disabled = false; fileReaderQuestionInput.focus(); }
    }
    if (fileReaderProcessBtn) fileReaderProcessBtn.addEventListener('click', handleFileSelection);
    if (fileReaderAskBtn) fileReaderAskBtn.addEventListener('click', handleFileQuestion);
    if (fileReaderQuestionInput) fileReaderQuestionInput.addEventListener('keypress', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); handleFileQuestion(); }});
    // --- END OF VIP FILE READER TOOL LOGIC ---

    // --- Final Initial State Call ---
    window.showView('home-view');
});
