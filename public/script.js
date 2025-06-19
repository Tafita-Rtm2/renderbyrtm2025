document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Weather and Admin Logic ---
    const weatherDisplay = document.getElementById('weather-display');
    const adminLoginIcon = document.getElementById('admin-login-icon');

    async function fetchWeather(location) {
        if (!weatherDisplay) { return; }
        weatherDisplay.innerHTML = '<p>Fetching weather...</p>';
        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            displayWeather(data);
        } catch (error) {
            console.error('Error fetching weather:', error);
            weatherDisplay.innerHTML = `<p>Could not load weather: ${error.message}</p>`;
        }
    }
    function displayWeather(data) {
        if (!weatherDisplay) { return; }
        if (data && data.current) {
            weatherDisplay.innerHTML = `
                <p><strong>${data.location.name}</strong></p>
                <p>${data.current.skytext}, ${data.current.temperature}°${data.location.degreetype}</p>
                <p>Feels like: ${data.current.feelslike}°${data.location.degreetype}</p>
            `;
        } else if (data && data.error) { weatherDisplay.innerHTML = `<p>Error: ${data.error}</p>`; }
        else { weatherDisplay.innerHTML = '<p>Weather data unavailable.</p>'; }
    }
    if (adminLoginIcon) {
        adminLoginIcon.addEventListener('click', () => {
            const code = prompt('Enter admin code:');
            if (code === '121206') { alert('Admin access granted (simulation)'); }
            else if (code !== null) { alert('Incorrect code.'); }
        });
    }
    fetchWeather('Antananarivo');

    // --- Navigation Logic ---
    const bottomMenu = document.getElementById('bottom-menu');
    const bottomMenuButtons = document.querySelectorAll('.bottom-menu-button');
    const floatingMenuBtn = document.getElementById('floating-menu-btn');
    const verticalScrollMenu = document.getElementById('vertical-scroll-menu');
    const verticalMenuLinks = document.querySelectorAll('#vertical-scroll-menu ul li a');
    const views = {
        home: document.getElementById('home-view'),
        chat: document.getElementById('chat-view'),
        imageGenerator: document.getElementById('image-generator-view'),
        historyGenerator: document.getElementById('history-generator-view'),
        vip: document.getElementById('vip-view')
    };

    function getViewKey(viewId) {
        if (viewId) { return viewId.replace('-view', ''); } return null;
    }

    // Store current view to manage chat history loading
    let currentViewId = 'home-view';

    function showView(viewIdToShow) {
        const viewKeyToShow = getViewKey(viewIdToShow);
        for (const key in views) {
            if (views[key]) {
                views[key].style.display = (key === viewKeyToShow) ? 'block' : 'none';
            }
        }
        if (viewKeyToShow === 'home') {
            if (bottomMenu) bottomMenu.style.display = 'flex';
            if (floatingMenuBtn) floatingMenuBtn.style.display = 'none';
        } else if (viewKeyToShow !== null) {
            if (bottomMenu) bottomMenu.style.display = 'none';
            if (floatingMenuBtn) floatingMenuBtn.style.display = 'block';
        }

        // If switching to chat view, load history
        if (viewIdToShow === 'chat-view' && currentViewId !== 'chat-view') {
            loadChatHistory();
        }
        currentViewId = viewIdToShow;
    }
    showView('home-view');
    bottomMenuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewId = button.getAttribute('data-view');
            if (viewId) {
                showView(viewId);
                if (bottomMenu) bottomMenu.style.display = 'none';
                if (floatingMenuBtn) floatingMenuBtn.style.display = 'block';
                if (verticalScrollMenu) verticalScrollMenu.classList.remove('visible');
            }
        });
    });
    if (floatingMenuBtn) {
        floatingMenuBtn.addEventListener('click', () => {
            if (verticalScrollMenu) verticalScrollMenu.classList.toggle('visible');
        });
    }
    verticalMenuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const viewId = link.getAttribute('data-view');
            if (viewId) {
                showView(viewId);
                if (verticalScrollMenu) verticalScrollMenu.classList.remove('visible');
            }
        });
    });
    document.addEventListener('click', (event) => {
        if (verticalScrollMenu && verticalScrollMenu.classList.contains('visible')) {
            if (!verticalScrollMenu.contains(event.target) && !floatingMenuBtn.contains(event.target)) {
                verticalScrollMenu.classList.remove('visible');
            }
        }
    });

    // --- AI Chat Logic (Phase 2A, 2C) ---
    const chatMessagesDiv = document.getElementById('chat-messages');
    const chatInputText = document.getElementById('chat-input-text');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const webSearchToggle = document.getElementById('web-search-toggle');
    const userIconSVG = `<svg class="icon icon-user" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
    const aiIconSVG = `<svg class="icon icon-ai" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.965 8.521C19.988 8.354 20 8.175 20 8c0-2.209-1.791-4-4-4s-4 1.791-4 4c0 .175.012.354.035.521C11.437 8.191 11 7.456 11 6.5 11 4.57 9.43 3 7.5 3S4 4.57 4 6.5C4 7.456 4.563 8.191 5.168 8.521A3.993 3.993 0 004 11.5C4 13.43 5.57 15 7.5 15s3.5-1.57 3.5-3.5a3.993 3.993 0 00-.602-2.004c.65-.34 1.155-.895 1.423-1.539.268.644.773 1.199 1.423 1.539A3.993 3.993 0 0012.5 11.5c0 .754.211 1.453.579 2.061.002.004.005.007.007.011L12 15.348V17h9v-2c0-1.93-1.57-3.5-3.5-3.5-.614 0-1.191.157-1.686.428.11-.415.186-.849.186-1.299 0-.175-.012-.354-.035-.521zm-1.465.995C18.823 9.242 19 8.646 19 8c0-1.654-1.346-3-3-3s-3 1.346-3 3c0 .646.177 1.242.499 1.726.01.016.027.026.034.044.496.838 1.358 1.407 2.307 1.551.105.016.211.023.317.023.303 0 .598-.057.873-.165a3.488 3.488 0 00.435-.21zM7.5 13C6.673 13 6 12.327 6 11.5S6.673 10 7.5 10s1.5.673 1.5 1.5S8.327 13 7.5 13zm0-5C6.673 8 6 7.327 6 6.5S6.673 5 7.5 5s1.5.673 1.5 1.5S8.327 8 7.5 8z"/></svg>`;

    function getOrCreateUID() {
        let uid = localStorage.getItem('chatUID');
        if (!uid) {
            uid = Date.now().toString(36) + Math.random().toString(36).substring(2);
            localStorage.setItem('chatUID', uid);
        }
        return uid;
    }
    const chatUID = getOrCreateUID();

    function saveMessageToHistory(text, sender) {
        if (!chatMessagesDiv) return; // No place to display, probably no need to save
        let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        // Limit history size to prevent LocalStorage from filling up too much
        const maxHistoryItems = 50;
        history.push({ text, sender, timestamp: new Date().toISOString() });
        if (history.length > maxHistoryItems) {
            history = history.slice(history.length - maxHistoryItems);
        }
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    function appendMessage(text, sender, saveToHistoryFlag = true) {
        if (!chatMessagesDiv) return;
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper', `${sender}-wrapper`);
        const iconDiv = document.createElement('div');
        iconDiv.classList.add('message-icon');
        iconDiv.innerHTML = sender === 'user' ? userIconSVG : aiIconSVG;
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble', `${sender}-bubble`);
        messageBubble.textContent = text; // Using textContent for security

        messageWrapper.appendChild(sender === 'user' ? messageBubble : iconDiv);
        messageWrapper.appendChild(sender === 'user' ? iconDiv : messageBubble);
        chatMessagesDiv.appendChild(messageWrapper);
        if (chatMessagesDiv.parentElement && chatMessagesDiv.parentElement.id === 'chat-messages-container') {
             chatMessagesDiv.parentElement.scrollTop = chatMessagesDiv.parentElement.scrollHeight;
        } else {
            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
        }


        if (saveToHistoryFlag) {
            saveMessageToHistory(text, sender);
        }
    }

    function loadChatHistory() {
        if (!chatMessagesDiv) return;
        chatMessagesDiv.innerHTML = ''; // Clear existing messages
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history.forEach(msg => appendMessage(msg.text, msg.sender, false)); // Don't re-save when loading
    }


    async function handleSendMessage() {
        if (!chatInputText || !chatMessagesDiv) return;
        const messageText = chatInputText.value.trim();
        if (messageText === '') return;

        appendMessage(messageText, 'user');
        chatInputText.value = '';

        const currentWebSearchState = webSearchToggle ? webSearchToggle.checked : false;

        // Temporary AI thinking message
        const thinkingMsgDiv = document.createElement('div');
        thinkingMsgDiv.classList.add('message-wrapper', `ai-wrapper`, 'thinking');
        const thinkingIconDiv = document.createElement('div');
        thinkingIconDiv.classList.add('message-icon');
        thinkingIconDiv.innerHTML = aiIconSVG;
        const thinkingBubble = document.createElement('div');
        thinkingBubble.classList.add('message-bubble', `ai-bubble`);
        thinkingBubble.textContent = "Thinking...";
        thinkingMsgDiv.appendChild(thinkingIconDiv);
        thinkingMsgDiv.appendChild(thinkingBubble);
        chatMessagesDiv.appendChild(thinkingMsgDiv);
        if (chatMessagesDiv.parentElement && chatMessagesDiv.parentElement.id === 'chat-messages-container') {
             chatMessagesDiv.parentElement.scrollTop = chatMessagesDiv.parentElement.scrollHeight;
        } else {
            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
        }


        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ask: messageText,
                    uid: chatUID,
                    webSearch: currentWebSearchState
                }),
            });

            // Remove thinking message
            const thinkingDiv = chatMessagesDiv.querySelector('.message-wrapper.thinking');
            if(thinkingDiv) thinkingDiv.remove();

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ response: "Error: Could not parse error response from server."}));
                throw new Error(errorData.response || errorData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            if (data.response) {
                appendMessage(data.response, 'ai');
            } else {
                appendMessage("Sorry, I received an unexpected response.", 'ai');
            }

        } catch (error) {
             // Remove thinking message if it's still there on error
            const thinkingDiv = chatMessagesDiv.querySelector('.message-wrapper.thinking');
            if(thinkingDiv) thinkingDiv.remove();
            console.error('Error calling chat API:', error);
            appendMessage(`Error: ${error.message || "Could not connect to AI. Please try again."}`, 'ai');
        }
    }

    if (chatSendBtn) chatSendBtn.addEventListener('click', handleSendMessage);
    if (chatInputText) chatInputText.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });

    if (webSearchToggle) {
        const savedWebSearch = localStorage.getItem('webSearchEnabled');
        if (savedWebSearch !== null) webSearchToggle.checked = savedWebSearch === 'true';
        webSearchToggle.addEventListener('change', () => {
            localStorage.setItem('webSearchEnabled', webSearchToggle.checked);
        });
    }

    // Initial load of chat history if chat view is default (or becomes visible)
    // This is now handled by showView logic
});
