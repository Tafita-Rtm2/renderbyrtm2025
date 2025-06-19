// Contents of public/script.js should be structured like this:
document.addEventListener('DOMContentLoaded', () => {
    // ===== START OF EXISTING CODE (Weather, Admin Icon) =====
    const weatherDisplay = document.getElementById('weather-display');
    const adminLoginIcon = document.getElementById('admin-login-icon');

    async function fetchWeather(location) {
        if (!weatherDisplay) {
            // console.error('Weather display element not found'); // Already logged by worker if issue
            return;
        }
        weatherDisplay.textContent = 'Fetching weather...';
        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayWeather(data);
        } catch (error) {
            // console.error('Error fetching weather:', error); // Already logged by worker if issue
            weatherDisplay.textContent = 'Could not load weather data.';
        }
    }

    function displayWeather(data) {
        if (!weatherDisplay) {
            // console.error('Weather display element not found for displaying data');
            return;
        }
        if (data && data.current) {
            weatherDisplay.innerHTML = `
                <p><strong>${data.location.name}</strong></p>
                <p>${data.current.skytext}, ${data.current.temperature}°${data.location.degreetype}</p>
                <p>Feels like: ${data.current.feelslike}°${data.location.degreetype}</p>
            `;
        } else if (data && data.error) {
            weatherDisplay.textContent = `Error: ${data.error}`;
        } 
        else {
            weatherDisplay.textContent = 'Weather data unavailable.';
        }
    }

    if (adminLoginIcon) {
        adminLoginIcon.addEventListener('click', () => {
            const code = prompt('Enter admin code:');
            if (code === '121206') {
                alert('Admin access granted (simulation)');
            } else if (code !== null) { 
                alert('Incorrect code.');
            }
        });
    } else {
        // console.error('Admin login icon not found'); // Already logged by worker if issue
    }

    fetchWeather('Antananarivo'); // Initial weather call
    // ===== END OF EXISTING CODE =====


    // ===== START OF NEW AI CHAT CODE =====
    const chatInterface = document.getElementById('chat-interface');
    const btnChat = document.getElementById('btn-ai-chat'); // Bottom menu button for the new full-screen chat
    
    // Ensure the new chat interface specific elements are selected correctly
    const chatMessagesContainer = document.querySelector('#chat-interface #chat-messages-container');
    const chatMessagesDiv = document.querySelector('#chat-interface #chat-messages');
    const chatInput = document.querySelector('#chat-interface #chat-input'); // Specific to new chat interface
    const chatSendBtn = document.getElementById('chat-send-btn'); // Specific to new chat interface
    const chatWebSearchToggle = document.getElementById('chat-web-search-toggle'); // Specific to new chat interface
    const chatInterfaceFloatingMenuBtn = document.querySelector('#chat-interface #floating-menu-btn'); //The one inside chat header


    const topMenu = document.getElementById('top-menu');
    const bottomMenu = document.getElementById('bottom-menu');
    const defaultPageContainer = document.getElementById('default-page-container'); 

    let userID = localStorage.getItem('userID');
    if (!userID) {
        userID = `user-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('userID', userID);
    }

    let webSearchActive = localStorage.getItem('chatWebSearchPreference') === 'false' ? false : true;

    function updateWebSearchToggleVisual() {
        if(chatWebSearchToggle) { 
            if (webSearchActive) {
                chatWebSearchToggle.textContent = '[Web On]'; 
                chatWebSearchToggle.classList.add('active');
            } else {
                chatWebSearchToggle.textContent = '[Web Off]'; 
                chatWebSearchToggle.classList.remove('active');
            }
        }
    }
    if(chatInterface) updateWebSearchToggleVisual();

    function loadConversationHistory() {
        if (!chatMessagesDiv) return;
        const history = JSON.parse(localStorage.getItem(`chatHistory_${userID}`)) || [];
        chatMessagesDiv.innerHTML = ''; 
        history.forEach(msg => appendMessage(msg.text, msg.type, false)); 
        // Add initial welcome message only if history is empty or as desired
        if (history.length === 0) {
            appendMessage("Welcome to AI Chat! How can I help you today?", "system", false); 
        }
    }

    function saveMessageToHistory(text, type) {
        if (type !== 'user' && type !== 'ai') { // Only save user and AI messages to history
            return;
        }
        const currentHistory = JSON.parse(localStorage.getItem(`chatHistory_${userID}`)) || [];
        currentHistory.push({ text, type, timestamp: new Date().toISOString() });
        localStorage.setItem(`chatHistory_${userID}`, JSON.stringify(currentHistory));
    }
    
    function appendMessage(text, type, saveToHist = true) {
        if (!chatMessagesDiv || !chatMessagesContainer) return;

        const messageElement = document.createElement('p');
        messageElement.classList.add('chat-message', `${type}-message`);
        messageElement.textContent = text;
        chatMessagesDiv.appendChild(messageElement);
        // Ensure scroll happens after message is added and DOM might have updated
        setTimeout(() => {
             chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }, 0);


        if (saveToHist) {
            saveMessageToHistory(text, type);
        }
    }

    // Listener for the main AI Chat button in the bottom menu
    if (btnChat && chatInterface && defaultPageContainer && topMenu && bottomMenu) {
        btnChat.addEventListener('click', () => {
            defaultPageContainer.style.display = 'none';
            chatInterface.style.display = 'flex'; 
            topMenu.style.display = 'none'; 
            bottomMenu.style.display = 'none'; 
            if(chatInterfaceFloatingMenuBtn) chatInterfaceFloatingMenuBtn.style.display = 'block'; 
            loadConversationHistory();
            if(chatInput) chatInput.focus();
        });
    }
    
    // Listener for the floating menu button INSIDE the chat interface
    if (chatInterfaceFloatingMenuBtn) {
        chatInterfaceFloatingMenuBtn.addEventListener('click', () => {
            if (chatInterface) chatInterface.style.display = 'none';
            if (defaultPageContainer) defaultPageContainer.style.display = 'block'; 
            if (topMenu) topMenu.style.display = 'flex'; 
            if (bottomMenu) bottomMenu.style.display = 'flex'; 
            // chatInterfaceFloatingMenuBtn itself is part of chatInterface, so it will be hidden.
        });
    }

    if (chatWebSearchToggle) {
        chatWebSearchToggle.addEventListener('click', () => {
            webSearchActive = !webSearchActive;
            localStorage.setItem('chatWebSearchPreference', webSearchActive);
            updateWebSearchToggleVisual();
            appendMessage(`Web search ${webSearchActive ? 'enabled' : 'disabled'}.`, 'system', false); 
        });
    }

    async function handleSendMessage() {
        if (!chatInput || !chatSendBtn) return;
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        appendMessage(messageText, 'user'); 
        chatInput.value = '';
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        if (chatWebSearchToggle) chatWebSearchToggle.disabled = true;
        
        const thinkingMsg = document.createElement('p');
        thinkingMsg.classList.add('chat-message', 'ai-message', 'thinking');
        thinkingMsg.textContent = 'AI is thinking...';
        if (chatMessagesDiv) chatMessagesDiv.appendChild(thinkingMsg);
        if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ ask: messageText, uid: userID, webSearch: webSearchActive }),
            });

            if (chatMessagesDiv && chatMessagesDiv.contains(thinkingMsg)) chatMessagesDiv.removeChild(thinkingMsg);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Server error", details: "Response not in JSON format." }));
                const errorMsg = `Error: ${errorData.error || response.statusText}. ${errorData.details ? (typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)) : '' }`;
                appendMessage(errorMsg, 'system', false); 
                return;
            }

            const data = await response.json();
            if (data.response) {
                appendMessage(data.response, 'ai'); 
            } else {
                appendMessage('Received an empty or unexpected response from AI.', 'system', false); 
            }

        } catch (error) {
            if (chatMessagesDiv && chatMessagesDiv.contains(thinkingMsg)) chatMessagesDiv.removeChild(thinkingMsg);
            appendMessage('Error sending message. Please check your connection or console for details.', 'system', false); 
        } finally {
            if(chatInput) chatInput.disabled = false;
            if(chatSendBtn) chatSendBtn.disabled = false;
            if (chatWebSearchToggle) chatWebSearchToggle.disabled = false;
            if(chatInput) chatInput.focus();
        }
    }

    if (chatSendBtn) chatSendBtn.addEventListener('click', handleSendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); 
                handleSendMessage();
            }
        });
    }
    // ===== END OF NEW AI CHAT CODE =====

    // Keep any other existing JS code below if it was outside the "NEW AI CHAT CODE" block
    // For example, the old navigation logic and chat-view logic if it was separate.
    // Based on the read_files output, the old navigation and chat-view logic was:

    const views = document.querySelectorAll('.view'); // These are inside #main-content-area
    const bottomNavItems = document.querySelectorAll('#bottom-menu button:not(#btn-ai-chat)'); // Exclude the new chat button
    
    // This is the general floating menu button at the top-left of the page, not the one in chat-interface
    const generalFloatingMenuBtn = document.getElementById('floating-menu-btn'); 
    const verticalScrollMenu = document.getElementById('vertical-scroll-menu');
    const verticalMenuItems = document.querySelectorAll('#vertical-scroll-menu .vertical-menu-item');

    function handleGeneralNavigation(targetViewId) {
        views.forEach(view => {
            view.style.display = 'none';
        });

        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.style.display = 'block'; // Or 'flex' if needed
        } else {
            // console.error(`View with ID ${targetViewId} not found.`);
            const portfolioView = document.getElementById('portfolio-view');
            if (portfolioView) portfolioView.style.display = 'block';
        }
        
        // This logic is for the general floating menu button vs the old bottom menu items
        // The new full-screen chat has its own show/hide logic triggered by btn-ai-chat
        if (targetViewId === 'portfolio-view' || targetViewId === 'chat-view' || targetViewId === 'image-gen-view' || targetViewId === 'history-gen-view' || targetViewId === 'vip-view' ) {
             if(generalFloatingMenuBtn) generalFloatingMenuBtn.style.display = 'block'; // Show general menu for main views
        } else {
             if(generalFloatingMenuBtn) generalFloatingMenuBtn.style.display = 'none';
        }
        if (verticalScrollMenu) verticalScrollMenu.style.display = 'none'; // Always hide vertical menu on nav
    }
    
    // Attach listeners to old bottom menu buttons (excluding the new chat button)
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.id.replace('btn-', '').replace('-gen', '-gen-view').replace('-menu', '-view'); // e.g. btn-main-menu -> portfolio-view
            let targetViewId = viewId;
            if(item.id === "btn-main-menu") targetViewId = "portfolio-view";
            else if(item.id === "btn-image-gen") targetViewId = "image-gen-view";
            else if(item.id === "btn-history-gen") targetViewId = "history-gen-view";
            else if(item.id === "btn-vip") targetViewId = "vip-view";
            // btn-ai-chat is handled by the new logic above.
            
            if (targetViewId) {
                 // Ensure the main page container is visible for these views
                if(defaultPageContainer) defaultPageContainer.style.display = 'block';
                if(chatInterface) chatInterface.style.display = 'none';
                if(topMenu) topMenu.style.display = 'flex';
                if(bottomMenu) bottomMenu.style.display = 'flex';

                handleGeneralNavigation(targetViewId);
            }
        });
    });

    if (generalFloatingMenuBtn) {
        generalFloatingMenuBtn.addEventListener('click', () => {
            if (verticalScrollMenu) {
                verticalScrollMenu.style.display = verticalScrollMenu.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    verticalMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.getAttribute('data-view-id');
            if (viewId) {
                if(defaultPageContainer) defaultPageContainer.style.display = 'block';
                if(chatInterface) chatInterface.style.display = 'none';
                if(topMenu) topMenu.style.display = 'flex';
                if(bottomMenu) bottomMenu.style.display = 'flex';
                handleGeneralNavigation(viewId);
            }
        });
    });
    
    // Old chat view logic (inside #main-content-area)
    const oldChatView = document.getElementById('chat-view');
    const oldChatMessagesContainer = document.querySelector('#chat-view #chat-messages-container');
    const oldChatMessagesDiv = document.querySelector('#chat-view #chat-messages');
    const oldChatInput = document.querySelector('#chat-view #chat-input');
    const oldChatSendButton = document.querySelector('#chat-view #chat-send');
    const oldChatWebSearchCheckbox = document.querySelector('#chat-view #chat-web-search');

    if (oldChatSendButton && oldChatInput) {
        oldChatSendButton.addEventListener('click', async () => { /* ... old send logic ... */ });
        oldChatInput.addEventListener('keypress', (event) => { /* ... old keypress logic ... */ });
    }
    
    if (oldChatView) { // Observer for the old chat view
        const oldChatObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (oldChatView.style.display === 'block' || oldChatView.style.display === 'flex') {
                        // Load history for old chat view if needed
                        // loadChatHistory(); // This would need to be adapted for old chat's specific elements
                        // loadWebSearchPreference(); // Same here
                    }
                }
            }
        });
        oldChatObserver.observe(oldChatView, { attributes: true });
    }
    
    // Initial page setup
    if(defaultPageContainer) defaultPageContainer.style.display = 'block';
    if(chatInterface) chatInterface.style.display = 'none';
    if(topMenu) topMenu.style.display = 'flex';
    if(bottomMenu) bottomMenu.style.display = 'flex';
    handleGeneralNavigation('portfolio-view'); // Default view
});
