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
        if (data && data.current && data.location) { // Ensure location is also present
            let weatherHTML = `<p class="location-name"><strong>${data.location.name}</strong></p>`;

            const weatherIcon = document.createElement('img');
            weatherIcon.alt = data.current.skytext; // Alt text for accessibility
            weatherIcon.className = 'weather-condition-icon';

            if (data.current.imageUrl) {
                weatherIcon.src = data.current.imageUrl;
                 // Prepend icon to weatherHTML string or handle layout with flexbox in CSS
            } else {
                // Fallback if no imageUrl, maybe just display skytext prominently
                weatherIcon.style.display = 'none'; // Hide img if no src
            }

            // Constructing the HTML. Icon will be first, then text.
            weatherDisplay.innerHTML = ''; // Clear previous content

            const iconContainer = document.createElement('div');
            iconContainer.className = 'weather-icon-container';
            iconContainer.appendChild(weatherIcon);
            weatherDisplay.appendChild(iconContainer);

            const textContainer = document.createElement('div');
            textContainer.className = 'weather-text-container';
            textContainer.innerHTML = `
                <p class="location-name"><strong>${data.location.name}</strong></p>
                <p class="temperature">${data.current.temperature}°${data.location.degreetype}</p>
                <p class="skytext">${data.current.skytext}</p>
                <p class="feelslike">Feels like: ${data.current.feelslike}°${data.location.degreetype}</p>
            `;
            weatherDisplay.appendChild(textContainer);

        } else if (data && data.error) {
            weatherDisplay.innerHTML = `<p>Error: ${data.error}</p>`;
        } else {
            weatherDisplay.innerHTML = '<p>Weather data unavailable.</p>';
        }
    }
    if (adminLoginIcon) {
        adminLoginIcon.addEventListener('click', () => {
            const code = prompt('Enter admin code:');
            if (code === '121206') {
                // alert('Admin access granted (simulation)'); // Original
                showView('admin-view'); // Show admin view on successful login
            }
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
        vip: document.getElementById('vip-view'),
        admin: document.getElementById('admin-view') // Added admin view
    };

    let initialAdminCommentsLoaded = false; // Flag for admin comments
    let initialCommentsLoaded = false; // Renaming for clarity for public comments

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
        // If switching to image generator view, load prompt history
        if (viewIdToShow === 'image-generator-view' && currentViewId !== 'image-generator-view') {
            loadPromptHistory();
        }
        // If switching to image generator view, load prompt history
        if (viewIdToShow === 'image-generator-view' && currentViewId !== 'image-generator-view') {
            if (typeof loadPromptHistory === 'function') loadPromptHistory(); // Ensure function exists
        }
        // If switching to history generator view, load story topic history
        if (viewIdToShow === 'history-generator-view' && currentViewId !== 'history-generator-view') {
            if (typeof loadStoryTopicHistory === 'function') loadStoryTopicHistory();
        }
        // If switching to admin view, load admin comments
        if (viewIdToShow === 'admin-view' && (currentViewId !== 'admin-view' || !initialAdminCommentsLoaded)) {
            if (typeof fetchAdminComments === 'function') {
                fetchAdminComments();
                initialAdminCommentsLoaded = true; // Set flag after first load
            }
        }
        // If switching to home view, load public comments
        if (viewIdToShow === 'home-view' && (currentViewId !== 'home-view' || !initialCommentsLoaded)) {
            if (typeof fetchAndDisplayComments === 'function') { // Check if function exists
                fetchAndDisplayComments();
                initialCommentsLoaded = true; // Set flag after first load
            }
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

    // --- Image Generator UI Logic (Update for Phase 3C) ---
    const imagePromptInput = document.getElementById('image-prompt-input');
    const generateImageBtn = document.getElementById('generate-image-btn');
    const generatedImageContainer = document.getElementById('generated-image-container');
    const downloadImageBtn = document.getElementById('download-image-btn');
    const imagePromptHistoryList = document.getElementById('image-prompt-history-list');

    let lastGeneratedImageUrl = null; // Object URL for the current image
    let currentImageBlob = null; // To store the blob for download with correct type
    let currentImageFilename = 'generated_image.png'; // Default filename

    function addPromptToHistory(prompt) {
        if (!imagePromptHistoryList || !prompt) return;
        const listItem = document.createElement('li');
        listItem.textContent = prompt;
        // Add to the top of the list
        imagePromptHistoryList.insertBefore(listItem, imagePromptHistoryList.firstChild);
        // Limit history size
        while (imagePromptHistoryList.children.length > 5) { // Keep last 5 prompts
            imagePromptHistoryList.removeChild(imagePromptHistoryList.lastChild);
        }
    }

    function loadPromptHistory() {
        if (!imagePromptHistoryList) return;
        imagePromptHistoryList.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('imagePromptHistory')) || [];
        history.forEach(prompt => {
            const listItem = document.createElement('li');
            listItem.textContent = prompt;
            imagePromptHistoryList.appendChild(listItem);
        });
    }
    // Ensure showView calls loadPromptHistory for 'image-generator-view'
    // (Handled by the modification to showView above)
    // Initial call for safety if image-generator-view is the default or accessed before showView runs for it.
    if (document.getElementById('image-generator-view') && document.getElementById('image-generator-view').style.display !== 'none') {
        loadPromptHistory();
    }


    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', async () => { // Make async
            if (!imagePromptInput || !generatedImageContainer) return;
            const prompt = imagePromptInput.value.trim();
            if (prompt === '') {
                alert('Please enter a prompt for the image.');
                return;
            }

            // Revoke previous object URL if it exists
            if (lastGeneratedImageUrl) {
                URL.revokeObjectURL(lastGeneratedImageUrl);
                lastGeneratedImageUrl = null;
                currentImageBlob = null;
            }

            generatedImageContainer.innerHTML = '<p>Generating image, please wait...</p>'; // Real generation now
            if (downloadImageBtn) downloadImageBtn.style.display = 'none';

            try {
                const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: prompt }),
                });

                if (!response.ok) {
                    // Try to parse error as JSON, then fallback
                    let errorMsg = `Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorData.message || errorMsg;
                    } catch (e) { /* Not a JSON error response */ }
                    throw new Error(errorMsg);
                }

                currentImageBlob = await response.blob();
                lastGeneratedImageUrl = URL.createObjectURL(currentImageBlob);

                const imgElement = document.createElement('img');
                imgElement.src = lastGeneratedImageUrl;
                imgElement.alt = prompt;

                generatedImageContainer.innerHTML = ''; // Clear "Generating..."
                generatedImageContainer.appendChild(imgElement);

                if (downloadImageBtn) downloadImageBtn.style.display = 'inline-flex';

                // Update filename based on content type if possible (though API might not vary it much)
                const contentType = currentImageBlob.type || 'image/png'; // Default to png
                const extension = contentType.split('/')[1] || 'png';
                currentImageFilename = `${prompt.substring(0, 20).replace(/\s+/g, '_') || 'generated'}.${extension}`;


                // Add to prompt history (and save to LocalStorage)
                let history = JSON.parse(localStorage.getItem('imagePromptHistory')) || [];
                history.unshift(prompt);
                if (history.length > 5) history = history.slice(0, 5);
                localStorage.setItem('imagePromptHistory', JSON.stringify(history));
                addPromptToHistory(prompt);

            } catch (error) {
                console.error('Error generating image:', error);
                generatedImageContainer.innerHTML = `<p>Failed to generate image: ${error.message}</p>`;
                if (downloadImageBtn) downloadImageBtn.style.display = 'none';
            }
        });
    }

    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', () => {
            if (lastGeneratedImageUrl && currentImageBlob) {
                const link = document.createElement('a');
                link.href = lastGeneratedImageUrl; // Object URL
                link.download = currentImageFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Note: Object URL will be revoked when a new image is generated or view changes (if implemented)
            } else {
                alert('No image available to download or image data is missing.');
            }
        });
    }

    // --- History Generator UI Logic (Phase 3A) ---
    const historyTopicInput = document.getElementById('history-topic-input');
    const generateHistoryBtn = document.getElementById('generate-history-btn');
    const generatedHistoryDisplay = document.getElementById('generated-history-display');
    const storyTopicHistoryList = document.getElementById('story-topic-history-list');
    // const chatUID = getOrCreateUID(); // UID should already be available from chat feature

    function addStoryTopicToHistory(topic) {
        if (!storyTopicHistoryList || !topic) return;
        const listItem = document.createElement('li');
        listItem.textContent = topic;
        storyTopicHistoryList.insertBefore(listItem, storyTopicHistoryList.firstChild);
        while (storyTopicHistoryList.children.length > 5) { // Keep last 5 topics
            storyTopicHistoryList.removeChild(storyTopicHistoryList.lastChild);
        }
    }

    function loadStoryTopicHistory() {
        if (!storyTopicHistoryList) return;
        storyTopicHistoryList.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('storyTopicHistory')) || [];
        history.forEach(topic => {
            const listItem = document.createElement('li');
            listItem.textContent = topic;
            storyTopicHistoryList.appendChild(listItem);
        });
    }
    // Ensure showView calls loadStoryTopicHistory for 'history-generator-view'
    // (Handled by the modification to showView above)
    // Call once at init if the view might be active or to pre-populate.
    // Ensure showView calls loadStoryTopicHistory for 'history-generator-view'
    // (Handled by the modification to showView above)
    // Call once at init if the view might be active or to pre-populate.
    if (document.getElementById('history-generator-view') && document.getElementById('history-generator-view').style.display !== 'none') {
        loadStoryTopicHistory();
    }


    if (generateHistoryBtn) {
        generateHistoryBtn.addEventListener('click', async () => { // Make async
            if (!historyTopicInput || !generatedHistoryDisplay) return;
            const topic = historyTopicInput.value.trim();
            if (topic === '') {
                alert('Please enter a topic for the history/story.');
                return;
            }

            generatedHistoryDisplay.innerHTML = '<p>Generating story, please wait...</p>';

            // Craft a specific prompt for story generation
            const storyPrompt = `You are a creative storyteller. Please write a short, engaging history or story about the following topic: "${topic}". Ensure it has a clear narrative.`;
            const currentUID = getOrCreateUID(); // Use existing UID function

            try {
                const response = await fetch('/api/chat', { // Reusing the chat API endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ask: storyPrompt,
                        uid: currentUID,
                        webSearch: 'off' // Typically web search is not needed for creative story writing
                    }),
                });

                if (!response.ok) {
                    let errorMsg = `Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorData.message || errorMsg;
                    } catch (e) { /* Not a JSON error response */ }
                    throw new Error(errorMsg);
                }

                const data = await response.json();
                if (data.response) {
                    // Sanitize or carefully display HTML if AI might return it. For now, textContent or pre-formatted.
                    // To display paragraphs, split by newline and wrap in <p> or use CSS white-space: pre-wrap.
                    generatedHistoryDisplay.innerHTML = ''; // Clear loading message
                    const storyContent = data.response;
                    storyContent.split('\n\n').forEach(paragraph => { // Handle double newlines as paragraph breaks
                        const p = document.createElement('p');
                        p.textContent = paragraph.replace(/\n/g, ' '); // Replace single newlines with spaces within a paragraph
                        generatedHistoryDisplay.appendChild(p);
                    });
                     if (generatedHistoryDisplay.innerHTML.trim() === '') { // If splitting resulted in nothing
                        generatedHistoryDisplay.textContent = storyContent; // Fallback to raw text
                     }

                } else {
                    generatedHistoryDisplay.textContent = "Sorry, I received an unexpected response for the story.";
                }

                // Add to story topic history (and save to LocalStorage)
                let topicHistory = JSON.parse(localStorage.getItem('storyTopicHistory')) || [];
                topicHistory.unshift(topic);
                if (topicHistory.length > 5) topicHistory = topicHistory.slice(0, 5);
                localStorage.setItem('storyTopicHistory', JSON.stringify(topicHistory));
                addStoryTopicToHistory(topic);

            } catch (error) {
                console.error('Error generating story:', error);
                generatedHistoryDisplay.innerHTML = `<p>Failed to generate story: ${error.message}</p>`;
            }
        });
    }

    // --- Public Comment System (Phase 4C) ---
    const commentForm = document.getElementById('comment-form');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');
    const commentsDisplay = document.getElementById('comments-display');

    async function fetchAndDisplayComments() {
        if (!commentsDisplay) return;
        commentsDisplay.innerHTML = '<p>Loading comments...</p>'; // Loading state

        try {
            const response = await fetch('/api/comments');
            if (!response.ok) {
                let errorMsg = `Failed to fetch comments. Status: ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errData.message || errorMsg;
                } catch(e) { /* ignore if error response not json */ }
                throw new Error(errorMsg);
            }
            const comments = await response.json();

            commentsDisplay.innerHTML = ''; // Clear loading/previous comments

            if (comments.length === 0) {
                commentsDisplay.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
                return;
            }

            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.classList.add('comment-item');

                const nameEl = document.createElement('strong');
                nameEl.classList.add('comment-name');
                nameEl.textContent = comment.name;

                const dateEl = document.createElement('span');
                dateEl.classList.add('comment-date');
                dateEl.textContent = new Date(comment.createdAt).toLocaleString();

                const textEl = document.createElement('p');
                textEl.classList.add('comment-text');
                textEl.textContent = comment.text; // Use textContent for security

                const headerEl = document.createElement('div');
                headerEl.classList.add('comment-header');
                headerEl.appendChild(nameEl);
                headerEl.appendChild(dateEl);

                commentDiv.appendChild(headerEl);
                commentDiv.appendChild(textEl);
                commentsDisplay.appendChild(commentDiv);
            });

        } catch (error) {
            console.error('Error fetching comments:', error);
            if (commentsDisplay) commentsDisplay.innerHTML = `<p style="color: red;">Error loading comments: ${error.message}</p>`;
        }
    }

    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!commentNameInput || !commentTextInput) return;

            const name = commentNameInput.value.trim();
            const text = commentTextInput.value.trim();

            if (!name || !text) {
                alert('Please enter both your name and a comment.');
                return;
            }

            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, text }),
                });

                if (!response.ok) {
                    let errorMsg = `Failed to post comment. Status: ${response.status}`;
                    try {
                        const errData = await response.json();
                        errorMsg = errData.error || errData.message || errorMsg;
                    } catch(e) { /* ignore if error response not json */ }
                    throw new Error(errorMsg);
                }

                // Clear form and refresh comments
                commentNameInput.value = '';
                commentTextInput.value = '';
                fetchAndDisplayComments(); // Refresh the list

            } catch (error) {
                console.error('Error posting comment:', error);
                alert(`Error posting comment: ${error.message}`);
            }
        });
    }

    // --- Admin Comment Management Logic (Phase 4D) ---
    const adminCommentsListDiv = document.getElementById('admin-comments-list');
    // initialAdminCommentsLoaded is defined with other view flags

    async function fetchAdminComments() {
        if (!adminCommentsListDiv) return;
        adminCommentsListDiv.innerHTML = '<p>Loading comments for admin...</p>';

        try {
            const response = await fetch('/api/comments'); // Same endpoint as public comments
            if (!response.ok) {
                let errorMsg = `Failed to fetch comments. Status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch(e) { /* ignore */ }
                throw new Error(errorMsg);
            }
            const comments = await response.json();
            adminCommentsListDiv.innerHTML = ''; // Clear loading message

            if (comments.length === 0) {
                adminCommentsListDiv.innerHTML = '<p>No comments to display.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.className = 'admin-comments-ul';
            comments.forEach(comment => {
                const li = document.createElement('li');
                li.className = 'admin-comment-item';
                li.innerHTML = `
                    <div class="admin-comment-header">
                        <strong class="admin-comment-name">${comment.name}</strong>
                        <span class="admin-comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="admin-comment-text">${comment.text}</p>
                    <button class="admin-delete-comment-btn icon-button" data-comment-id="${comment._id}" title="Delete Comment">
                        <svg class="icon icon-delete" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                `;
                ul.appendChild(li);
            });
            adminCommentsListDiv.appendChild(ul);

        } catch (error) {
            console.error('Error fetching admin comments:', error);
            if (adminCommentsListDiv) adminCommentsListDiv.innerHTML = `<p style="color: red;">Error loading comments: ${error.message}</p>`;
        }
    }

    // Event delegation for delete buttons
    if (adminCommentsListDiv) {
        adminCommentsListDiv.addEventListener('click', async (event) => {
            if (event.target.closest('.admin-delete-comment-btn')) {
                const button = event.target.closest('.admin-delete-comment-btn');
                const commentId = button.dataset.commentId;

                if (!commentId) return;

                if (confirm('Are you sure you want to delete this comment?')) {
                    try {
                        const response = await fetch(`/api/comments/${commentId}`, {
                            method: 'DELETE',
                        });

                        if (!response.ok) {
                            let errorMsg = `Failed to delete comment. Status: ${response.status}`;
                            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch(e) { /* ignore */ }
                            throw new Error(errorMsg);
                        }
                        // Refresh the comments list in admin view
                        fetchAdminComments();
                        alert('Comment deleted successfully.');

                    } catch (error) {
                        console.error('Error deleting comment:', error);
                        alert(`Error deleting comment: ${error.message}`);
                    }
                }
            }
        });
    }

    // Initial load of comments if home view is active by default
    if (document.getElementById('home-view') && document.getElementById('home-view').style.display !== 'none' && commentsDisplay) {
        fetchAndDisplayComments();
        initialCommentsLoaded = true;
    }
    // Initial load for admin view if it's somehow default (less likely)
    if (document.getElementById('admin-view') && document.getElementById('admin-view').style.display !== 'none' && adminCommentsListDiv) {
       fetchAdminComments();
       initialAdminCommentsLoaded = true;
    }
});
