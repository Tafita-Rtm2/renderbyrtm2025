document.addEventListener('DOMContentLoaded', () => {
    const bottomNavButtons = document.querySelectorAll('#bottom-nav .nav-button');
    const interfaceSections = document.querySelectorAll('.interface-section');
    const floatingMenuButton = document.getElementById('floating-menu-button');
    const sideScrollMenu = document.getElementById('side-scroll-menu');
    const sideScrollMenuLinks = document.querySelectorAll('#side-scroll-menu a');
    const vipIframe = document.getElementById('vip-iframe');
    const vipInterfaceId = 'vip-interface'; // ID of the VIP section
    const vipSiteUrl = 'https://sitebymegg.onrender.com'; // URL for the VIP iframe

    const mainInterfaceId = 'main-interface';

    // Admin related elements
    const adminAccessIcon = document.getElementById('admin-access-icon');
    const adminLoginInterface = document.getElementById('admin-login-interface');
    const adminLoginButton = document.getElementById('admin-login-button');
    const adminCodeInput = document.getElementById('admin-code');
    const adminPanelInterface = document.getElementById('admin-panel-interface');

    const floatingAdminMessageIcon = document.getElementById('floating-admin-message-icon');
    const adminChatBox = document.getElementById('admin-chat-box');
    const closeAdminChatButton = document.getElementById('close-admin-chat');

    // Image Generator Elements
    const imagePromptInput = document.getElementById('image-prompt');
    const generateImageButton = document.getElementById('generate-image-button');
    const imageLoadingIndicator = document.getElementById('image-loading-indicator');
    const generatedImageElement = document.getElementById('generated-image');
    const downloadImageButton = document.getElementById('download-image-button');
    const imagePromptHistoryList = document.getElementById('image-prompt-history-list');

    const IMAGE_HISTORY_KEY = 'imagePromptHistory';

    // Chat AI Elements
    const chatMessagesDisplay = document.getElementById('chat-messages-display');
    const chatMessageInput = document.getElementById('chat-message-input');
    const sendChatMessageButton = document.getElementById('send-chat-message-button');
    const webSearchToggle = document.getElementById('web-search-toggle');

    const CHAT_UID_KEY = 'chatUserUniqueId';
    const CHAT_HISTORY_KEY_PREFIX = 'chatHistory_'; // To store history per UID

    let chatUserId = localStorage.getItem(CHAT_UID_KEY);
    if (!chatUserId) {
        chatUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(CHAT_UID_KEY, chatUserId);
    }

    let currentChatHistoryKey = CHAT_HISTORY_KEY_PREFIX + chatUserId;

    // History Generator Elements
    const historyPromptInput = document.getElementById('history-prompt-input');
    const generateHistoryButton = document.getElementById('generate-history-button');
    const historyWebSearchToggle = document.getElementById('history-web-search-toggle');
    const displayedHistoryTitle = document.getElementById('displayed-history-title');
    const displayedHistoryContent = document.getElementById('displayed-history-content');
    const historyLoadingIndicator = document.getElementById('history-loading-indicator');
    const savedHistoriesList = document.getElementById('saved-histories-list');

    const SAVED_HISTORIES_KEY_PREFIX = 'savedHistories_'; // Per user
    let currentSavedHistoriesKey = SAVED_HISTORIES_KEY_PREFIX + chatUserId; // Uses chatUserId

    // Comments Section Elements
    const commentsDisplay = document.getElementById('comments-display');
    const commentForm = document.getElementById('comment-form');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');
    const PUBLIC_COMMENTER_NAME_KEY = 'publicCommenterName';

    // Pre-fill public commenter name if stored
    if (commentNameInput && localStorage.getItem(PUBLIC_COMMENTER_NAME_KEY)) {
        commentNameInput.value = localStorage.getItem(PUBLIC_COMMENTER_NAME_KEY);
    }

    // Admin Panel Elements
    const adminCommentsDisplay = document.getElementById('admin-comments-display');

    // Floating Admin Message Elements (some already defined in "Admin related elements")
    const userMessageNameInput = document.getElementById('user-message-name');
    const userMessageTextInput = document.getElementById('user-message-text');
    const sendAdminMessageButton = document.getElementById('send-admin-message');
    const ADMIN_MESSAGE_USER_NAME_KEY = 'adminMessageUserName';

    // Pre-fill user name if stored for admin message
    if (userMessageNameInput && localStorage.getItem(ADMIN_MESSAGE_USER_NAME_KEY)) {
        userMessageNameInput.value = localStorage.getItem(ADMIN_MESSAGE_USER_NAME_KEY);
    }

    // Event listener for sending admin message
    if (sendAdminMessageButton) {
        sendAdminMessageButton.addEventListener('click', async () => {
            const name = userMessageNameInput.value.trim();
            const message = userMessageTextInput.value.trim();

            if (!name || !message) {
                alert('Votre nom et message sont requis.');
                return;
            }
            if (name.length > 100 || message.length > 1000) {
                alert('Nom ou message trop long (max 100 pour nom, 1000 pour message).');
                return;
            }

            sendAdminMessageButton.disabled = true;
            userMessageTextInput.disabled = true;

            try {
                const response = await fetch('/api/admin-messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, message }),
                });

                if (!response.ok) {
                    let errorMsg = 'Erreur lors de l\'envoi du message.';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) {/*ignore*/}
                    throw new Error(errorMsg);
                }

                alert('Message envoyé à l\'administrateur avec succès !');

                localStorage.setItem(ADMIN_MESSAGE_USER_NAME_KEY, name); // Save name for next time
                userMessageTextInput.value = ''; // Clear message input
                if (adminChatBox) adminChatBox.style.display = 'none'; // Hide chat box

            } catch (error) {
                console.error('Error sending admin message:', error);
                alert(`Erreur: ${error.message}`);
            } finally {
                sendAdminMessageButton.disabled = false;
                userMessageTextInput.disabled = false;
            }
        });
    }

    // Load and display image prompt history
    function loadImagePromptHistory() {
        if (!imagePromptHistoryList) return; // Element might not be on every page/section
        imagePromptHistoryList.innerHTML = ''; // Clear existing list
        const history = JSON.parse(localStorage.getItem(IMAGE_HISTORY_KEY)) || [];
        history.forEach(promptText => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = promptText;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                imagePromptInput.value = promptText;
            });
            listItem.appendChild(link);
            imagePromptHistoryList.appendChild(listItem);
        });
    }

    // Add prompt to history
    function addImagePromptToHistory(promptText) {
        let history = JSON.parse(localStorage.getItem(IMAGE_HISTORY_KEY)) || [];
        if (!history.includes(promptText)) {
            history.unshift(promptText); // Add to the beginning
            if (history.length > 10) { // Keep history to a certain size
                history.pop();
            }
            localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(history));
        }
        loadImagePromptHistory();
    }

    // Event listener for image generation button
    if (generateImageButton) {
        generateImageButton.addEventListener('click', async () => {
            const prompt = imagePromptInput.value.trim();
            if (!prompt) {
                alert('Veuillez entrer une idée pour l\'image.');
                return;
            }

            imageLoadingIndicator.style.display = 'block';
            generatedImageElement.style.display = 'none';
            downloadImageButton.style.display = 'none';

            try {
                const response = await fetch(`/api/generate-image?prompt=${encodeURIComponent(prompt)}`);

                if (!response.ok) {
                    let errorMsg = `Erreur ${response.status}: ${response.statusText}`;
                    try {
                        const errorText = await response.text(); // API might return plain text for errors
                        errorMsg = errorText || errorMsg;
                    } catch(e) { /* ignore */ }
                    throw new Error(errorMsg);
                }

                const imageBlob = await response.blob();
                const imageUrl = URL.createObjectURL(imageBlob);

                generatedImageElement.src = imageUrl;
                generatedImageElement.style.display = 'block';

                downloadImageButton.href = imageUrl;
                // Create a dynamic filename based on prompt, sanitized
                let filename = prompt.substring(0, 30).replace(/[^a-z0-9_]/gi, '_').toLowerCase() || 'generated_image';
                downloadImageButton.download = `${filename}.png`;
                downloadImageButton.style.display = 'block';

                addImagePromptToHistory(prompt);

            } catch (error) {
                console.error('Image generation failed:', error);
                alert(`Erreur lors de la génération de l'image: ${error.message}`);
                generatedImageElement.style.display = 'none'; // Ensure image is hidden on error
            } finally {
                imageLoadingIndicator.style.display = 'none';
            }
        });
    }

    // Function to add a message to the chat display
    function addMessageToChatDisplay(text, type) { // type is 'user' or 'ai' or 'ai-loading'
        if (!chatMessagesDisplay) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', type + '-message');

        const iconDiv = document.createElement('div');
        iconDiv.classList.add('icon');
        // iconDiv.textContent = type === 'user' ? 'U' : 'AI'; // CSS handles this with content property

        const textSpan = document.createElement('span');
        textSpan.textContent = text;

        if (type === 'user') {
            messageDiv.appendChild(textSpan); // Text first for user
            messageDiv.appendChild(iconDiv);
        } else { // 'ai' or 'ai-loading'
            messageDiv.appendChild(iconDiv); // Icon first for AI/loading
            messageDiv.appendChild(textSpan);
        }

        chatMessagesDisplay.appendChild(messageDiv);
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Scroll to bottom
    }

    // Load chat history
    function loadChatHistory() {
        if (!chatMessagesDisplay) return;
        chatMessagesDisplay.innerHTML = ''; // Clear display
        const history = JSON.parse(localStorage.getItem(currentChatHistoryKey)) || [];
        history.forEach(msg => addMessageToChatDisplay(msg.text, msg.type));
    }

    // Save chat history
    function saveChatMessage(text, type) {
        let history = JSON.parse(localStorage.getItem(currentChatHistoryKey)) || [];
        history.push({ text, type, timestamp: new Date().toISOString() });
        // Optional: Limit history size
        // if (history.length > 50) history.splice(0, history.length - 50);
        localStorage.setItem(currentChatHistoryKey, JSON.stringify(history));
    }

    // Event listener for sending chat message
    if (sendChatMessageButton) {
        sendChatMessageButton.addEventListener('click', async () => {
            const messageText = chatMessageInput.value.trim();
            if (!messageText) return;

            addMessageToChatDisplay(messageText, 'user');
            saveChatMessage(messageText, 'user');
            chatMessageInput.value = '';
            chatMessageInput.disabled = true;
            sendChatMessageButton.disabled = true;

            // Placeholder for AI thinking
            addMessageToChatDisplay('...', 'ai-loading');
            const loadingMessageElement = chatMessagesDisplay.lastChild;


            const webSearchStatus = webSearchToggle.checked ? 'on' : 'off';

            try {
                const response = await fetch(`/api/chat?ask=${encodeURIComponent(messageText)}&uid=${encodeURIComponent(chatUserId)}&webSearch=${webSearchStatus}`);

                if (loadingMessageElement && loadingMessageElement.classList.contains('ai-loading-message')) {
                     chatMessagesDisplay.removeChild(loadingMessageElement);
                } else {
                    const lastMsg = chatMessagesDisplay.lastChild;
                    if(lastMsg && lastMsg.textContent === '...' && lastMsg.classList.contains('ai-loading-message')) {
                        chatMessagesDisplay.removeChild(lastMsg);
                    }
                }


                if (!response.ok) {
                    let errorMsg = `Erreur ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch(e) { /* ignore */ }
                    throw new Error(errorMsg);
                }

                const data = await response.json();
                if (data.response) {
                    addMessageToChatDisplay(data.response, 'ai');
                    saveChatMessage(data.response, 'ai');
                } else {
                    throw new Error('Réponse de l\'IA non valide.');
                }

            } catch (error) {
                console.error('Chat failed:', error);
                addMessageToChatDisplay(`Erreur: ${error.message}`, 'ai');
                saveChatMessage(`Erreur: ${error.message}`, 'ai');
            } finally {
                chatMessageInput.disabled = false;
                sendChatMessageButton.disabled = false;
                chatMessageInput.focus();
            }
        });

        // Allow sending with Enter key
        chatMessageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendChatMessageButton.click();
            }
        });
    }

    // Function to display a selected story
    function displaySavedStory(title, content) {
        if (!displayedHistoryTitle || !displayedHistoryContent || !historyLoadingIndicator) return;
        displayedHistoryTitle.textContent = title;
        displayedHistoryTitle.style.display = 'block';
        displayedHistoryContent.textContent = content; // Using textContent to preserve line breaks from pre-wrap
        historyLoadingIndicator.style.display = 'none';
    }

    // Load and display saved histories list
    function loadSavedHistoriesList() {
        if (!savedHistoriesList) return;
        savedHistoriesList.innerHTML = ''; // Clear existing list
        const histories = JSON.parse(localStorage.getItem(currentSavedHistoriesKey)) || [];
        histories.forEach(hist => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = hist.title;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                displaySavedStory(hist.title, hist.story);
            });
            listItem.appendChild(link);
            savedHistoriesList.appendChild(listItem);
        });
    }

    // Add a generated history to local storage
    function addGeneratedHistoryToStorage(title, story) {
        let histories = JSON.parse(localStorage.getItem(currentSavedHistoriesKey)) || [];
        // Avoid duplicate titles, or update if exists? For now, allow multiple with same title.
        histories.unshift({ title, story, timestamp: new Date().toISOString() });
        if (histories.length > 20) { // Keep history to a certain size
            histories.pop();
        }
        localStorage.setItem(currentSavedHistoriesKey, JSON.stringify(histories));
        loadSavedHistoriesList();
    }

    // Event listener for history generation button
    if (generateHistoryButton) {
        generateHistoryButton.addEventListener('click', async () => {
            const userPrompt = historyPromptInput.value.trim();
            if (!userPrompt) {
                alert('Veuillez entrer un titre ou un début d\'histoire.');
                return;
            }

            if (!displayedHistoryTitle || !displayedHistoryContent || !historyLoadingIndicator) return;
            displayedHistoryTitle.style.display = 'none';
            displayedHistoryContent.textContent = ''; // Clear previous story
            historyLoadingIndicator.style.display = 'block';
            generateHistoryButton.disabled = true;
            historyPromptInput.disabled = true;

            const instructionalPrompt = `Génère une histoire (ou un contenu créatif) basée sur le titre/prompt suivant : "${userPrompt}". Assure-toi que la réponse soit uniquement l'histoire elle-même, sans commentaires additionnels avant ou après.`;
            const webSearchStatus = historyWebSearchToggle.checked ? 'on' : 'off';

            try {
                // Using the existing /api/chat endpoint
                const response = await fetch(`/api/chat?ask=${encodeURIComponent(instructionalPrompt)}&uid=${encodeURIComponent(chatUserId)}&webSearch=${webSearchStatus}`);

                if (!response.ok) {
                    let errorMsg = `Erreur ${response.status}`;
                    try {
                        const errorData = await response.json(); // API returns JSON for errors
                        errorMsg = errorData.error || errorMsg;
                    } catch(e) { /* ignore */ }
                    throw new Error(errorMsg);
                }

                const data = await response.json(); // Expected: { response: "AI story" }
                if (data.response) {
                    displaySavedStory(userPrompt, data.response); // Display the new story
                    addGeneratedHistoryToStorage(userPrompt, data.response); // Save it
                } else {
                    throw new Error('Réponse de l\'IA pour l\'histoire non valide.');
                }

            } catch (error) {
                console.error('History generation failed:', error);
                displayedHistoryContent.textContent = `Erreur lors de la génération de l'histoire: ${error.message}`;
            } finally {
                historyLoadingIndicator.style.display = 'none';
                generateHistoryButton.disabled = false;
                historyPromptInput.disabled = false;
            }
        });
    }

    // Function to render comments in the admin panel
    function renderAdminComments(comments) {
        if (!adminCommentsDisplay) return; // Guard clause

        adminCommentsDisplay.innerHTML = ''; // Clear previous
        if (!comments || comments.length === 0) {
            adminCommentsDisplay.innerHTML = '<p>Aucun commentaire à afficher.</p>';
            return;
        }
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment'); // Use existing .comment class from CSS for base
            // Add admin-specific comment structure if needed, or reuse public one
            commentDiv.innerHTML = `
                <p class="comment-author">${comment.name} <span class="comment-timestamp">- ${formatCommentTimestamp(comment.timestamp)}</span></p>
                <p class="comment-message">${comment.message.replace(/\n/g, '<br>')}</p>
                <div class="admin-comment-actions">
                    <button data-comment-id="${comment._id}" class="admin-reply-comment-btn" style="display:none;">Répondre</button> <!-- Hidden for now -->
                    <button data-comment-id="${comment._id}" class="admin-delete-comment-btn" style="display:none;">Supprimer</button> <!-- Hidden for now -->
                </div>
            `;
            adminCommentsDisplay.appendChild(commentDiv);

            // Example: Add event listeners for future reply/delete buttons
            // const replyBtn = commentDiv.querySelector('.admin-reply-comment-btn');
            // if(replyBtn) replyBtn.addEventListener('click', () => handleReplyComment(comment._id));
            // const deleteBtn = commentDiv.querySelector('.admin-delete-comment-btn');
            // if(deleteBtn) deleteBtn.addEventListener('click', () => handleDeleteComment(comment._id));
        });
    }

    // Function to load data for the admin panel
    async function loadAdminData() {
        // 1. Load Comments for Admin View
        if (adminCommentsDisplay) { // Check if the element exists
            adminCommentsDisplay.innerHTML = '<p>Chargement des commentaires...</p>'; // Loading indicator
            try {
                const response = await fetch('/api/comments'); // Reuse existing API endpoint
                if (!response.ok) {
                    throw new Error(`Failed to fetch comments: ${response.statusText}`);
                }
                const comments = await response.json();
                renderAdminComments(comments);
            } catch (error) {
                console.error('Error fetching comments for admin:', error);
                if (adminCommentsDisplay) {
                    adminCommentsDisplay.innerHTML = '<p>Impossible de charger les commentaires.</p>';
                }
            }
        } else {
            console.warn('#admin-comments-display element not found');
        }

        // 2. Placeholder for Analytics (already in HTML)
        // 3. Placeholder for User Messages (already in HTML)
    }

    // Function to format timestamp (optional, for better display)
    function formatCommentTimestamp(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    }

    // Function to render comments
    function renderComments(comments) {
        if (!commentsDisplay) return;
        commentsDisplay.innerHTML = ''; // Clear previous comments
        if (!comments || comments.length === 0) {
            commentsDisplay.innerHTML = '<p>Aucun commentaire pour le moment. Soyez le premier !</p>';
            return;
        }
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment'); // Ensure .comment class is styled in CSS
            commentDiv.innerHTML = `
                <p class="comment-author">${comment.name} <span class="comment-timestamp">- ${formatCommentTimestamp(comment.timestamp)}</span></p>
                <p class="comment-message">${comment.message.replace(/\n/g, '<br>')}</p>
            `; // Added .replace for line breaks
            commentsDisplay.appendChild(commentDiv);
        });
    }

    // Function to fetch comments
    async function fetchComments() {
        if (!commentsDisplay) return; // Don't fetch if the display area isn't on the current page (though it should be on main)
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.statusText}`);
            }
            const comments = await response.json();
            renderComments(comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            commentsDisplay.innerHTML = '<p>Impossible de charger les commentaires pour le moment.</p>';
        }
    }

    // Event listener for comment form submission
    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = commentNameInput.value.trim();
            const message = commentTextInput.value.trim();

            if (!name || !message) {
                alert('Le nom et le message ne peuvent pas être vides.');
                return;
            }
             if (name.length > 50 || message.length > 500) {
                alert('Le nom ou le message est trop long (max 50 pour nom, 500 pour message).');
                return;
            }

            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, message }),
                });

                if (!response.ok) {
                    let errorMsg = 'Erreur lors de la soumission.';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) {/*ignore*/}
                    throw new Error(errorMsg);
                }

                // Save name to local storage
                const submittedName = name;
                if (submittedName) {
                    localStorage.setItem(PUBLIC_COMMENTER_NAME_KEY, submittedName);
                }

                commentNameInput.value = '';
                commentTextInput.value = '';
                fetchComments(); // Refresh comments

                // Re-apply the stored name for the current session after inputs are cleared
                if (commentNameInput && localStorage.getItem(PUBLIC_COMMENTER_NAME_KEY)) {
                    commentNameInput.value = localStorage.getItem(PUBLIC_COMMENTER_NAME_KEY);
                }

            } catch (error) {
                console.error('Error submitting comment:', error);
                alert(`Erreur lors de l'envoi du commentaire: ${error.message}`);
            }
        });
    }

    // Function to switch interfaces
    function showInterface(targetId) {
        interfaceSections.forEach(section => {
            section.style.display = section.id === targetId ? 'block' : 'none';
        });

        // Update active state for bottom nav buttons
        bottomNavButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.target === targetId);
        });

        // Floating menu button visibility
        if (targetId === mainInterfaceId) {
            floatingMenuButton.style.display = 'none';
            sideScrollMenu.classList.remove('open'); // Close side menu if returning to main
            floatingAdminMessageIcon.style.display = 'block'; // Show admin message icon on main
            if (commentsDisplay) fetchComments(); // Fetch comments when main interface is shown
        } else {
            floatingMenuButton.style.display = 'block';
            floatingAdminMessageIcon.style.display = 'none'; // Hide admin message icon on other interfaces
        }

        // Load VIP iframe if VIP section is shown
        if (targetId === vipInterfaceId) {
            if (vipIframe.src !== vipSiteUrl) { // Load only if not already loaded
                vipIframe.src = vipSiteUrl;
            }
        }

        // Hide admin login/panel if navigating away
        if (targetId !== adminLoginInterface.id && targetId !== adminPanelInterface.id) {
            // This ensures that normal navigation hides admin sections
        }

        // Chat specific logic when switching interfaces
        if (targetId === 'ai-chat-interface') {
            loadChatHistory(); // Load history when chat tab becomes active
            if(chatMessageInput) chatMessageInput.focus(); // Focus input field
        }

        // History Generator specific logic
        if (targetId === 'history-generator-interface') {
            currentSavedHistoriesKey = SAVED_HISTORIES_KEY_PREFIX + chatUserId; // Ensure key is updated
            loadSavedHistoriesList();
            if(historyPromptInput) historyPromptInput.focus();
        }
    }

    // Event listeners for bottom navigation
    bottomNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            showInterface(targetId);
        });
    });

    // Event listener for floating menu button
    floatingMenuButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click from closing menu immediately if it bubbles
        sideScrollMenu.classList.toggle('open');
    });

    // Event listeners for side scroll menu links
    sideScrollMenuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.dataset.target;
            showInterface(targetId);
            sideScrollMenu.classList.remove('open'); // Close the menu
        });
    });

    // Close side menu if clicking outside of it
    document.addEventListener('click', (event) => {
        if (sideScrollMenu.classList.contains('open') && !sideScrollMenu.contains(event.target) && event.target !== floatingMenuButton) {
            sideScrollMenu.classList.remove('open');
        }
    });

    // Admin Access Logic
    adminAccessIcon.addEventListener('click', () => {
        showInterface(adminLoginInterface.id);
        floatingMenuButton.style.display = 'block'; // Keep floating menu available
        floatingAdminMessageIcon.style.display = 'none';
    });

    adminLoginButton.addEventListener('click', () => {
        if (adminCodeInput.value === '121206') {
            showInterface(adminPanelInterface.id); // This already hides other sections
            adminCodeInput.value = '';
            loadAdminData(); // Call function to load admin panel content
        } else {
            alert('Code incorrect.');
            adminCodeInput.value = '';
        }
        // floatingMenuButton.style.display = 'block'; // This is already handled by showInterface if not main
    });

    // Floating Admin Message Icon Logic
    floatingAdminMessageIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        adminChatBox.style.display = adminChatBox.style.display === 'block' ? 'none' : 'block';
    });

    closeAdminChatButton.addEventListener('click', () => {
        adminChatBox.style.display = 'none';
    });

    // Hide admin chat box if clicking outside
    document.addEventListener('click', (event) => {
        if (adminChatBox.style.display === 'block' && !adminChatBox.contains(event.target) && event.target !== floatingAdminMessageIcon) {
            adminChatBox.style.display = 'none';
        }
    });


    // Initial setup: Show the main interface by default
    showInterface(mainInterfaceId); // This will also call fetchComments if mainInterfaceId is the one being shown
    // Correctly set initial visibility for floatingAdminMessageIcon based on the main interface
    // floatingAdminMessageIcon.style.display = 'block'; // Already handled by showInterface
    adminChatBox.style.display = 'none'; // Ensure admin chat is hidden initially
    adminAccessIcon.style.display = 'block'; // Ensure admin access icon is always visible

    // Initial fetch of comments if main interface is already visible and not handled by showInterface on first load
    // This is a bit redundant if showInterface(mainInterfaceId) is called right before,
    // but ensures comments load if main-interface is default and showInterface isn't explicitly called for it.
    // However, showInterface IS called, so this specific block might be redundant.
    // Let's rely on the showInterface logic.
    // if (document.getElementById('main-interface') && document.getElementById('main-interface').style.display !== 'none') {
    //      fetchComments();
    // }

    // Image Scroller Logic (basic example for one scroller)
    const initScroller = (scrollerContainerId) => {
        const container = document.getElementById(scrollerContainerId);
        if (!container) return;

        const content = container.querySelector('.scroller-content');
        const btnLeft = container.querySelector('.scroll-btn.left');
        const btnRight = container.querySelector('.scroll-btn.right');

        if (!content || !btnLeft || !btnRight) return;

        btnLeft.addEventListener('click', () => {
            content.scrollBy({ left: -200, behavior: 'smooth' });
        });

        btnRight.addEventListener('click', () => {
            content.scrollBy({ left: 200, behavior: 'smooth' });
        });
    };

    initScroller('free-screenshots');
    initScroller('vip-screenshots'); // Assuming vip-screenshots also has this structure

    async function fetchAndDisplayWeather() {
        const weatherWidget = document.getElementById('weather-widget');
        const weatherIcon = document.getElementById('weather-icon');
        const weatherText = document.getElementById('weather-text');
        let userLocation = 'Antananarivo'; // Default location

        function updateWeatherDisplay(data) {
            if (data.imageUrl) {
                weatherIcon.src = data.imageUrl;
                weatherIcon.alt = data.skytext;
                weatherIcon.style.display = 'inline';
            } else {
                weatherIcon.style.display = 'none';
            }
            weatherText.textContent = `${data.temperature}°C, ${data.skytext} in ${data.location.split(',')[0]}. Feels like: ${data.feelslike}°C. Humidity: ${data.humidity}%`;
        }

        function showError(message) {
            weatherText.textContent = message;
            weatherIcon.style.display = 'none';
        }

        // Option 1: Try to get user's location (and then use a default if it fails)
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                // The Kaizen API seems to prefer city names.
                // For simplicity, we'll continue to use the default 'Antananarivo' or allow user input later.
                // If we were to use lat/lon, the API call would be:
                // userLocation = `${position.coords.latitude},${position.coords.longitude}`;
                // For now, we stick to the default, as the prompt implies direct city input or default.
                // The prompt mentions "on capte le position de l'utilisateur et on mettre ses emplacent et on mettre le meteo varier a ca"
                // This suggests we should try to use it. Let's try passing lat,lon to the 'q' param.
                // Some APIs accept "lat,lon" for the location query.
                userLocation = `${position.coords.latitude},${position.coords.longitude}`;
                // If the API strictly requires a city name, this would require a reverse geocoding step,
                // which is out of scope for this simple integration. Let's assume the API might handle lat,lon.
                // If not, it will likely default or error, and we'll fall back to Antananarivo.
            } catch (error) {
                console.warn('Geolocation failed or denied:', error.message, "Using default location.");
                // userLocation remains 'Antananarivo'
            }
        } else {
            console.warn('Geolocation not supported. Using default location.');
            // userLocation remains 'Antananarivo'
        }

        try {
            // Fetch weather from our backend
            const response = await fetch(`/api/weather?q=${encodeURIComponent(userLocation)}`);
            if (!response.ok) {
                let errorMsg = `Error: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch(e) { /* ignore */ }
                // If fetching with lat,lon failed, try with the default city name
                if (userLocation !== 'Antananarivo') {
                    console.warn(`Fetching weather with ${userLocation} failed. Trying default 'Antananarivo'.`);
                    const fallbackResponse = await fetch(`/api/weather?q=Antananarivo`);
                    if (!fallbackResponse.ok) {
                         let fallbackErrorMsg = `Error: ${fallbackResponse.statusText}`;
                         try {
                            const fallbackErrorData = await fallbackResponse.json();
                            fallbackErrorMsg = fallbackErrorData.error || fallbackErrorMsg;
                         } catch(e) { /* ignore */ }
                         throw new Error(fallbackErrorMsg);
                    }
                    const data = await fallbackResponse.json();
                    updateWeatherDisplay(data);
                } else {
                    throw new Error(errorMsg);
                }
            } else {
                const data = await response.json();
                updateWeatherDisplay(data);
            }
        } catch (error) {
            console.error('Failed to display weather:', error);
            showError(`Weather: ${error.message}`);
            // Attempt to load default if any error occurs with primary attempt
            if (userLocation !== 'Antananarivo') { // Avoid re-fetching if Antananarivo was already the failing one
                try {
                    const fallbackResponse = await fetch(`/api/weather?q=Antananarivo`);
                    if (!fallbackResponse.ok) {
                        let fallbackErrorMsg = `Error: ${fallbackResponse.statusText}`;
                         try {
                            const fallbackErrorData = await fallbackResponse.json();
                            fallbackErrorMsg = fallbackErrorData.error || fallbackErrorMsg;
                         } catch(e) { /* ignore */ }
                         throw new Error(fallbackErrorMsg); // Or handle more gracefully
                    }
                    const data = await fallbackResponse.json();
                    updateWeatherDisplay(data);
                } catch (fallbackError) {
                    console.error('Failed to display weather with fallback:', fallbackError);
                    showError('Weather data unavailable.');
                }
            } else {
                 showError('Weather data unavailable.');
            }
        }
    }

    fetchAndDisplayWeather();
    loadImagePromptHistory(); // Initial load of history for image generator
});
