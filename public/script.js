document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const allViews = document.querySelectorAll('.view');
    const bottomNavButtons = document.querySelectorAll('.bottom-nav-btn');
    const bottomNavBar = document.getElementById('bottom-navigation-bar');

    const floatingMenuTrigger = document.getElementById('floating-menu-trigger');
    const floatingMenu = document.getElementById('floating-menu');
    const floatingMenuItems = floatingMenu ? floatingMenu.querySelectorAll('ul li a') : [];

    // Chat UI Elements
    const chatMessagesArea = document.getElementById('chat-messages-area');
    const chatInputField = document.getElementById('chat-input-field');
    const chatSendButton = document.getElementById('chat-send-button');
    const webSearchToggle = document.getElementById('web-search-toggle');
    let chatUID = localStorage.getItem('chatPortfolioUID');
    if (!chatUID) {
        chatUID = 'uid-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatPortfolioUID', chatUID);
    }

    // Image Generator UI Elements
    const imagePromptField = document.getElementById('image-prompt-field');
    const generateImageButton = document.getElementById('generate-image-button');
    const imageDisplayArea = document.getElementById('image-display-area');
    const downloadImageButton = document.getElementById('download-image-button');
    // const imageHistoryArea = document.getElementById('image-history-area'); // For later

    let currentImageBlob = null;
    let currentImagePromptForDownload = "";

    // --- Initial State ---
    let currentViewId = 'home-view'; // Default view

    // --- Image Generator Functions ---
    async function handleImageGeneration() {
        if (!imagePromptField || !imageDisplayArea || !generateImageButton || !downloadImageButton) {
            console.warn("Image generator UI elements not all found.");
            return;
        }
        const promptValue = imagePromptField.value.trim();
        if (!promptValue) {
            alert('Please enter a prompt for the image.');
            return;
        }

        imageDisplayArea.innerHTML = '<p>Generating your masterpiece... Please wait.</p>';
        generateImageButton.disabled = true;
        imagePromptField.disabled = true;
        downloadImageButton.style.display = 'none';
        currentImageBlob = null;

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptValue })
            });

            if (!response.ok) {
                let errorMsg = `Error: ${response.status} ${response.statusText}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errData.message || errorMsg;
                } catch (e) { /* Ignore if error response isn't JSON */ }
                throw new Error(errorMsg);
            }

            currentImageBlob = await response.blob();
            currentImagePromptForDownload = promptValue;
            const imageUrl = URL.createObjectURL(currentImageBlob);

            imageDisplayArea.innerHTML = `<img src="${imageUrl}" alt="Generated image for: ${promptValue}" style="max-width:100%; max-height:400px; display:block; margin:auto;">`;
            downloadImageButton.style.display = 'inline-block';

            saveImagePromptToHistory(promptValue);
            // loadImagePromptHistory(); // Call if/when history display is implemented
        } catch (error) {
            console.error('Image generation error:', error);
            imageDisplayArea.innerHTML = `<p style="color:red;">Image generation failed: ${error.message}</p>`;
        } finally {
            generateImageButton.disabled = false;
            imagePromptField.disabled = false;
        }
    }

    function handleImageDownload() {
        if (!currentImageBlob) {
            alert('No image has been generated or the image data is missing.');
            return;
        }
        const sanitizedPrompt = currentImagePromptForDownload.replace(/[^a-z0-9_]/gi, '_').substring(0, 50);
        const filename = `${sanitizedPrompt || 'generated_image'}.${currentImageBlob.type.split('/')[1] || 'png'}`;

        const tempAnchor = document.createElement('a');
        tempAnchor.href = URL.createObjectURL(currentImageBlob);
        tempAnchor.download = filename;

        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        document.body.removeChild(tempAnchor);
        URL.revokeObjectURL(tempAnchor.href); // Clean up the object URL
    }

    const imagePromptHistoryKey = 'imagePromptHistory';
    function saveImagePromptToHistory(prompt) {
        let history = [];
        try {
            const stored = localStorage.getItem(imagePromptHistoryKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) { console.error('Error parsing image prompt history:', e); }

        // Add to front, remove duplicates if any, limit size
        history = history.filter(item => item !== prompt);
        history.unshift(prompt);
        if (history.length > 15) history = history.slice(0, 15);

        try {
            localStorage.setItem(imagePromptHistoryKey, JSON.stringify(history));
        } catch (e) { console.error('Error saving image prompt history:', e); }
    }

    // function loadImagePromptHistory() { /* Implement when UI for history is ready */ }

    if (generateImageButton) {
        generateImageButton.addEventListener('click', handleImageGeneration);
    }
    if (downloadImageButton) {
        downloadImageButton.addEventListener('click', handleImageDownload);
    }

    // --- AI Chat Functions ---
    function addMessageToChatDisplay(message, sender) {
        if (!chatMessagesArea) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');

        // Simple text display, can be enhanced with icons/avatars later
        messageElement.textContent = `${sender === 'user' ? 'You' : 'AI'}: ${message}`;

        chatMessagesArea.appendChild(messageElement);
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }

    function loadChatHistory() {
        if (!chatMessagesArea || !chatUID) return;
        // chatMessagesArea.innerHTML = ''; // Clear before loading - moved to showView
        const historyKey = 'aiChatHistory_' + chatUID;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing chat history:', e);
            localStorage.removeItem(historyKey); // Clear corrupted history
        }
        history.forEach(item => addMessageToChatDisplay(item.message, item.sender));
    }

    function saveMessageToHistory(message, sender) {
        if (!chatUID) return;
        const historyKey = 'aiChatHistory_' + chatUID;
        let history = [];
        try {
            const stored = localStorage.getItem(historyKey);
            if (stored) history = JSON.parse(stored);
        } catch (e) { console.error('Error parsing chat history for saving:', e); }

        history.push({ message, sender, timestamp: new Date().toISOString() });
        if (history.length > 50) history = history.slice(history.length - 50); // Keep last 50

        try {
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) {
            console.error('Error saving chat history:', e);
        }
    }

    async function handleSendMessage() {
        if (!chatInputField || !chatUID) return;
        const messageText = chatInputField.value.trim();
        if (!messageText) return;

        addMessageToChatDisplay(messageText, 'user');
        saveMessageToHistory(messageText, 'user');
        chatInputField.value = '';

        if (chatSendButton) chatSendButton.disabled = true;
        if (chatInputField) chatInputField.disabled = true;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ask: messageText,
                    uid: chatUID,
                    webSearch: webSearchToggle ? webSearchToggle.checked : false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `API request failed: ${response.statusText}`);
            }
            const aiResponse = await response.json();
            if (aiResponse && aiResponse.response) {
                addMessageToChatDisplay(aiResponse.response, 'ai');
                saveMessageToHistory(aiResponse.response, 'ai');
            } else {
                throw new Error("Invalid response structure from AI.");
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChatDisplay(`Error: ${error.message || 'Could not connect to AI.'}`, 'ai');
        } finally {
            if (chatSendButton) chatSendButton.disabled = false;
            if (chatInputField) chatInputField.disabled = false;
            if (chatInputField) chatInputField.focus();
        }
    }

    const webSearchToggleKey = 'chatWebSearchEnabled';
    function loadWebSearchToggleState() {
        if (!webSearchToggle) return;
        webSearchToggle.checked = localStorage.getItem(webSearchToggleKey) === 'true';
    }

    if (webSearchToggle) {
        webSearchToggle.addEventListener('change', () => {
            localStorage.setItem(webSearchToggleKey, webSearchToggle.checked);
        });
    }

    if (chatSendButton) {
        chatSendButton.addEventListener('click', handleSendMessage);
    }
    if (chatInputField) {
        chatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    // --- Core Navigation Function ---
    function showView(viewId) {
        allViews.forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active');
        });

        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
            viewToShow.classList.add('active');
            currentViewId = viewId;
        } else {
            console.warn(`View with ID "${viewId}" not found. Defaulting to home-view.`);
            const homeView = document.getElementById('home-view');
            if (homeView) {
                homeView.style.display = 'block';
                homeView.classList.add('active');
            }
            currentViewId = 'home-view';
        }

        // Show/Hide bottom navigation bar
        if (bottomNavBar) {
            if (currentViewId === 'home-view') { // Or any other view you want the bottom bar on
                bottomNavBar.style.display = 'flex';
            } else {
                bottomNavBar.style.display = 'none';
            }
        }

        // Hide floating menu when a view is selected from it
        if (floatingMenu && floatingMenu.style.display === 'block') {
            floatingMenu.style.display = 'none';
        }

        // --- Feature-specific load calls (Placeholders for now) ---
        if (viewId === 'ai-chat-view') {
            if (chatMessagesArea) chatMessagesArea.innerHTML = ''; // Clear previous messages
            if (typeof loadChatHistory === 'function') loadChatHistory();
            if (typeof loadWebSearchToggleState === 'function') loadWebSearchToggleState();
        } else if (viewId === 'vip-view') {
            if (typeof checkInitialVipStatus === 'function') checkInitialVipStatus();
        } else if (viewId === 'image-generator-view') {
            if(imageDisplayArea && !imageDisplayArea.querySelector('img')) { // If no image is loaded
                 imageDisplayArea.innerHTML = '<p>Enter a prompt above and click Generate.</p>';
            }
            // if (typeof loadImagePromptHistory === 'function') loadImagePromptHistory(); // When history UI is ready
        }
        // Add other view-specific initializations here
        console.log(`Switched to view: ${currentViewId}`);
    }

    // --- Event Listeners ---

    // Bottom Navigation Buttons
    if (bottomNavButtons && bottomNavBar) {
        bottomNavButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = button.dataset.view;
                if (viewId) {
                    showView(viewId);
                }
            });
        });
    } else {
        console.warn('Bottom navigation elements not found.');
    }

    // Top-Left Floating Menu Trigger
    if (floatingMenuTrigger && floatingMenu) {
        floatingMenuTrigger.addEventListener('click', () => {
            floatingMenu.style.display = (floatingMenu.style.display === 'none' || floatingMenu.style.display === '') ? 'block' : 'none';
        });
    } else {
        console.warn('Floating menu trigger or container not found.');
    }

    // Floating Menu Item Clicks
    if (floatingMenuItems) {
        floatingMenuItems.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) {
                    showView(viewId);
                    // Floating menu is hidden by showView() itself
                } else if (link.id === 'admin-zone-link') {
                    // Special handling for admin zone link if it's not a direct view
                    console.log("Admin zone link clicked - implement access logic");
                    // For now, let's assume it tries to show a view called 'admin-zone-view'
                    showView('admin-zone-view');
                }
            });
        });
    } else {
        console.warn('Floating menu items not found.');
    }

    // --- VIP Zone Access Logic (Simplified from previous, to be integrated properly) ---
    const vipCodeInput = document.getElementById('vip-code-input');
    const vipCodeSubmitButton = document.getElementById('vip-code-submit');
    const vipStatusMessage = document.getElementById('vip-status-message');
    const vipAccessArea = document.getElementById('vip-access-area');
    const vipToolsContainer = document.getElementById('vip-tools-container');
    const HARDCODED_VIP_CODE = "VIP123"; // Per original script, user mentioned 121206 for admin

    function handleVipAccess() {
        if (!vipCodeInput || !vipStatusMessage || !vipAccessArea || !vipToolsContainer) return;
        if (vipCodeInput.value === HARDCODED_VIP_CODE) { // This is the old VIP code, admin is 121206
            localStorage.setItem('isUserVIP', 'true');
            if(vipAccessArea) vipAccessArea.style.display = 'none';
            if(vipToolsContainer) vipToolsContainer.style.display = 'block'; // Or 'grid' based on its styling
            if(vipStatusMessage) {
                vipStatusMessage.textContent = 'Access granted!';
                vipStatusMessage.className = 'vip-status-success'; // For styling
                vipStatusMessage.style.display = 'block';
            }
        } else {
            localStorage.setItem('isUserVIP', 'false');
            if(vipStatusMessage) {
                vipStatusMessage.textContent = 'Invalid VIP code.';
                vipStatusMessage.className = 'vip-status-error'; // For styling
                vipStatusMessage.style.display = 'block';
            }
            if(vipToolsContainer) vipToolsContainer.style.display = 'none';
        }
        if(vipCodeInput) vipCodeInput.value = '';
        setTimeout(() => { if(vipStatusMessage) vipStatusMessage.style.display = 'none'; }, 3000);
    }

    if (vipCodeSubmitButton) {
        vipCodeSubmitButton.addEventListener('click', handleVipAccess);
    }
    // Call checkInitialVipStatus if navigating to vip-view
    // This will be handled by a more generic "on view show" event later if needed.
    function checkInitialVipStatus() {
        if (!vipAccessArea || !vipToolsContainer) return;
        const isVIP = localStorage.getItem('isUserVIP') === 'true';
        if(vipAccessArea) vipAccessArea.style.display = isVIP ? 'none' : 'block';
        if(vipToolsContainer) vipToolsContainer.style.display = isVIP ? 'block' : 'none'; // or 'grid'
    }
    // Example: in showView, if viewId === 'vip-view', call checkInitialVipStatus()

    // --- Weather Display Function ---
    async function fetchAndDisplayWeather(location = 'Antananarivo') {
        const weatherSectionMenu = document.getElementById('weather-section-menu');
        if (!weatherSectionMenu) {
            console.warn('Weather section in menu not found.');
            return;
        }
        weatherSectionMenu.innerHTML = '<p>Loading weather...</p>'; // Initial loading message

        try {
            const response = await fetch(`/api/weather?q=${encodeURIComponent(location)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to fetch weather: ${response.statusText}`);
            }
            const data = await response.json();

            if (data && data.current && data.location) {
                const imageUrl = data.current.imageUrl; // API provides this directly
                const temp = data.current.temperature;
                const degreeType = data.location.degreetype;
                const city = data.location.name.split(',')[0]; // Get main city name
                const skytext = data.current.skytext;

                let weatherHTML = '';
                if (imageUrl) {
                    weatherHTML += `<img src="${imageUrl}" alt="${skytext || 'Weather icon'}" style="width:30px; height:30px; vertical-align:middle; margin-right: 5px;">`;
                }
                weatherHTML += `<span style="font-weight:bold;">${temp}°${degreeType}</span> in ${city}`;
                if (skytext && !imageUrl) { // Show skytext if no image or as additional info
                    weatherHTML += ` - <span style="font-style:italic;">${skytext}</span>`;
                }
                weatherSectionMenu.innerHTML = weatherHTML;
            } else {
                throw new Error('Weather data structure is invalid.');
            }
        } catch (error) {
            console.error('Error fetching or displaying weather:', error);
            weatherSectionMenu.innerHTML = `<p style="color:orange;">Weather unavailable: ${error.message}</p>`;
        }
    }

    // --- Admin Zone Access (Placeholder for code 121206) ---
    // Logic for admin password (121206) will be added here or within admin-zone-link handler
    // For now, clicking the "Admin Zone" link in floating menu shows the 'admin-zone-view' div.
    // Proper password protection will be part of Admin Zone implementation steps.


    // --- Initialize Default View ---
    showView(currentViewId); // Show the initial default view
    fetchAndDisplayWeather(); // Fetch weather on initial load

    console.log('Futuristic Portfolio Script Loaded!');
});
