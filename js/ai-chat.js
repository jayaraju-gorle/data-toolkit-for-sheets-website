/**
 * ai-chat.js
 *
 * Handles the AI Chat interface, interaction, API calls, and history management.
 * NO Feedback functionality included in this version.
 *
 * Dependencies:
 * - Font Awesome (for icons)
 * - A global `App` object with an `App.showNotification(message, type)` method (optional, for better user feedback)
 *
 * Initialization:
 * - The HTML returned by `getHtml()` must be added to the DOM *before* calling `AiChat.init()`.
 * - Call `AiChat.init()` once the relevant DOM container is ready.
 */
const AiChat = {
    apiEndpoint: 'https://ai-tools-backend-772545827002.asia-south1.run.app/text', // Replace with your actual backend endpoint

    models: {
        gemini: {
            name: 'Gemini',
            icon: 'fas fa-brain'
        }
        // Add other models here if needed
    },

    currentModel: 'gemini',
    history: [], // Stores conversation history {id, message, type, timestamp}
    maxHistory: 50, // Maximum messages to store in sessionStorage
    isProcessing: false, // Flag to track if AI is processing

    // Suggestion lists
    suggestedQueriesList: [
       "How to use VLOOKUP",
       "Format data in Sheets",
       "Create a pivot table",
    ],
    moreSuggestionsList: [
       "Calculate SUM in a range",
       "Sort data alphabetically",
       "Conditional formatting",
       "Create charts",
       "Use IF function",
       "Import data from CSV",
       "Freeze panes"
    ],

    /**
     * Get the HTML template for the AI chat interface.
     */
    getHtml: function() {
        // Removed Feedback Modal HTML
        return `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">AI Chat</h5>
                <div>
                    <button class="btn btn-outline-secondary btn-sm me-2" id="exportChatBtn">
                        <i class="fas fa-download me-1"></i> Export
                    </button>
                    <button class="btn btn-outline-danger btn-sm" id="clearChatBtn">
                        <i class="fas fa-trash-alt me-1"></i> Clear Chat
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Suggested Queries Container -->
                <div id="suggestedQueriesContainer" class="mb-3" style="display: none;">
                    <!-- Suggestions chips will be added here by JS -->
                </div>

                <!-- Chat Messages -->
                <div class="chat-container mb-3">
                    <div class="chat-messages" id="chatMessages">
                        <!-- Messages will be added here -->
                    </div>
                </div>

                <!-- Input Area -->
                <div class="input-group">
                    <textarea class="form-control" id="userInput" rows="2" placeholder="Type your message..."></textarea>
                    <button class="btn btn-primary" id="sendMessageBtn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
        // --- End of HTML ---
    },

    /**
     * Initialize the AI chat. Must be called after getHtml() is added to the DOM.
     */
    init: function() {
        console.log("AiChat: Initializing...");
        this.loadHistory(); // Load history first
        this.setupEventListeners();
        if (this.history.length === 0) { // Only add welcome and suggestions if history is empty
            this.addWelcomeMessage();
            this.showInitialSuggestions();
        }
        console.log("AiChat: Initialization complete.");
    },

    /**
     * Load history from sessionStorage and display it.
     */
    loadHistory: function() {
        const storedHistory = sessionStorage.getItem('aiChatHistory');
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) {
            console.error("AiChat Error: chatMessages container not found during loadHistory.");
            return;
        }
        messagesContainer.innerHTML = ''; // Clear existing messages

        if (storedHistory) {
            try { // Add try-catch for robust JSON parsing
                this.history = JSON.parse(storedHistory);
                this.history.forEach(msg => {
                    // Don't re-add typing indicators or suggestions from history
                    if (msg.type !== 'typing' && msg.type !== 'suggestions') {
                        // Generate ID if missing from old history for some reason
                        const messageId = msg.id || `msg-${Date.now()}-${Math.random()}`;
                        // Pass undefined for feedbackGiven as it's no longer tracked
                        this.addMessageToDOM(msg.message, msg.type, messageId);
                    }
                });
                // Scroll to bottom after loading history
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } catch (e) {
                console.error("AiChat Error: Failed to parse chat history from sessionStorage.", e);
                sessionStorage.removeItem('aiChatHistory'); // Clear corrupted data
                this.history = []; // Reset history
                this.showError("Could not load previous chat history."); // Notify user
            }
        } else {
            this.history = [];
        }

        // Hide/show suggestions container based on history
        const suggestionsContainer = document.getElementById('suggestedQueriesContainer');
        if (suggestionsContainer) {
           suggestionsContainer.style.display = this.history.length > 0 ? 'none' : 'block';
           if (this.history.length > 0) {
               suggestionsContainer.innerHTML = ''; // Clear stale suggestions if history exists
           }
        } else {
            console.warn("AiChat Warning: suggestedQueriesContainer not found during loadHistory.");
        }
    },

    /**
     * Save history to sessionStorage.
     */
    saveHistory: function() {
        // Filter out non-persistent message types
        const historyToSave = this.history.filter(msg => msg.type !== 'suggestions' && msg.type !== 'typing');
        // Limit history size
        while (historyToSave.length > this.maxHistory) {
            historyToSave.shift(); // Remove the oldest message
        }
        try {
            // Store only id, message, type, timestamp
            const simplifiedHistory = historyToSave.map(msg => ({
                id: msg.id,
                message: msg.message,
                type: msg.type,
                timestamp: msg.timestamp
            }));
            sessionStorage.setItem('aiChatHistory', JSON.stringify(simplifiedHistory));
        } catch (e) {
            console.error("AiChat Error: Failed to save chat history to sessionStorage.", e);
            this.showError("Could not save chat history.");
        }
    },

    /**
     * Clear chat history from memory, sessionStorage, and DOM.
     */
    clearHistory: function() {
        this.history = [];
        sessionStorage.removeItem('aiChatHistory');
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
           messagesContainer.innerHTML = ''; // Clear messages from DOM
        } else {
           console.error("AiChat Error: chatMessages container not found during clearHistory.");
        }
        this.addWelcomeMessage(); // Add welcome message back
        this.showInitialSuggestions(); // Show suggestions again
        console.log("AiChat: History cleared.");
    },

    /**
     * Display initial suggested query chips.
     */
    showInitialSuggestions: function() {
        const suggestionsContainer = document.getElementById('suggestedQueriesContainer');
        if (!suggestionsContainer) {
            console.warn("AiChat Warning: suggestedQueriesContainer not found for initial suggestions.");
            return;
        }

        suggestionsContainer.innerHTML = ''; // Clear previous suggestions
        suggestionsContainer.style.display = 'block'; // Make sure it's visible

        this.suggestedQueriesList.forEach(query => {
            suggestionsContainer.appendChild(this.createSuggestionChip(query));
        });

        // Add "More suggestions" button
        const moreButton = document.createElement('button');
        moreButton.className = 'btn btn-outline-secondary btn-sm suggestion-chip';
        moreButton.textContent = 'More suggestions';
        moreButton.style.marginLeft = '8px';
        moreButton.addEventListener('click', () => this.showMoreSuggestions());
        suggestionsContainer.appendChild(moreButton);

        // Scroll down to ensure suggestions are visible
        this.scrollToBottom();
    },

    /**
     * Display more suggested query chips, replacing the initial ones.
     */
    showMoreSuggestions: function() {
        const suggestionsContainer = document.getElementById('suggestedQueriesContainer');
        if (!suggestionsContainer) {
            console.warn("AiChat Warning: suggestedQueriesContainer not found for more suggestions.");
            return;
        }

        suggestionsContainer.innerHTML = ''; // Clear existing chips

        this.moreSuggestionsList.forEach(query => {
            suggestionsContainer.appendChild(this.createSuggestionChip(query));
        });

        this.scrollToBottom();
    },

     /**
      * Create a single suggestion chip element.
      */
     createSuggestionChip: function(query) {
        const chip = document.createElement('button');
        chip.className = 'btn btn-light btn-sm me-2 mb-2 suggestion-chip';
        chip.textContent = query;
        chip.type = 'button';
        chip.addEventListener('click', () => {
            const userInput = document.getElementById('userInput');
            const suggestionsContainer = document.getElementById('suggestedQueriesContainer');

            if (userInput) {
                userInput.value = query; // Populate input
                userInput.focus(); // Focus input
            } else {
                console.error("AiChat Error: userInput element not found when clicking suggestion.");
            }

            // Hide suggestions after one is clicked
            if (suggestionsContainer) {
               suggestionsContainer.style.display = 'none';
            }
            // Optional: Automatically send the message by uncommenting the line below
            // this.sendMessage();
        });
        return chip;
     },


    /**
     * Set up event listeners for chat controls. Ensures elements exist first.
     */
    setupEventListeners: function() {
        const sendButton = document.getElementById('sendMessageBtn');
        const userInput = document.getElementById('userInput');
        const clearButton = document.getElementById('clearChatBtn');
        const exportButton = document.getElementById('exportChatBtn');
        // Removed feedback button listener setup

        // Send message button
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        } else {
            console.error("AiChat Error: sendMessageBtn not found during setup.");
        }

        // Enter key in textarea
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent newline
                    this.sendMessage();
                }
            });
        } else {
            console.error("AiChat Error: userInput not found during setup.");
        }

        // Clear chat button
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearHistory());
        } else {
            console.error("AiChat Error: clearChatBtn not found during setup.");
        }

        // Export Chat button
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportChat());
        } else {
            console.error("AiChat Error: exportChatBtn not found during setup.");
        }
    },

    /**
     * Adds the initial welcome message to the DOM.
     */
    addWelcomeMessage: function() {
        const welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?";
        // Give welcome message a unique ID but DON'T add to persistent history
        this.addMessageToDOM(welcomeMessage, 'ai', `msg-welcome-${Date.now()}`);
    },

    /**
     * Handles sending a user message: adds to DOM/history, calls API, handles response/error.
     */
    sendMessage: async function() {
        if (this.isProcessing) return; // Prevent multiple sends

        const input = document.getElementById('userInput');
        const sendButton = document.getElementById('sendMessageBtn');
        if (!input || !sendButton) {
            console.error("AiChat Error: Input or Send button not found for sending message.");
            return;
        }
        const message = input.value.trim();

        if (!message) return; // Don't send empty messages

        // Hide suggestions when a message is sent
        const suggestionsContainer = document.getElementById('suggestedQueriesContainer');
        if (suggestionsContainer) {
           suggestionsContainer.style.display = 'none';
        }

        this.isProcessing = true;
        input.disabled = true;
        sendButton.disabled = true;
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) chatContainer.classList.add('processing'); // Visual indication

        // Add user message to DOM and history
        const userMessageId = `msg-user-${Date.now()}-${Math.random()}`;
        this.addMessage(message, 'user', userMessageId);

        // Clear input
        input.value = '';

        this.showTypingIndicator();

        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            const aiMessageId = `msg-ai-${Date.now()}-${Math.random()}`;
            // Add AI response to DOM and history
            this.addMessage(response, 'ai', aiMessageId);
        } catch (error) {
            console.error("AiChat Error: Failed to get AI response.", error);
            this.hideTypingIndicator();
            this.showError(`AI Error: ${error.message || 'An unknown error occurred.'}`);
            // Optionally add an error message to the chat interface:
            // this.addMessage(`Sorry, I encountered an error. Please try again. (${error.message})`, 'error', `msg-error-${Date.now()}`);
        } finally {
              this.isProcessing = false;
              input.disabled = false;
              sendButton.disabled = false;
              if (chatContainer) chatContainer.classList.remove('processing');
        }
    },

    /**
     * Fetches the AI response from the backend API.
     */
    getAIResponse: async function(message) {
        // Construct payload - potentially include history for context if API supports it
        const payload = {
            text: message,
            // Example context (if needed):
            // conversationHistory: this.history.filter(m => m.type === 'user' || m.type === 'ai').slice(-10).map(m => ({ role: m.type, content: m.message }))
        };

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorBody = 'Could not retrieve error details.';
            try {
                errorBody = await response.text();
            } catch(e) { /* ignore */ }
            console.error('AiChat Error: API Response not OK.', response.status, errorBody);
            throw new Error(`Failed to get AI response (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log('AI Response Data:', data); // Debug log

        if (data.error) {
            console.error('AiChat Error: API returned an error message.', data.error);
            throw new Error(data.error);
        }

        // Assuming the response has a 'result' property containing the text
        return data.result || 'No response content received from AI.';
    },

    /**
     * Adds a message to the internal history array and saves it.
     * Does not add 'typing' or 'suggestions' types.
     */
    addMessageToHistory: function(message, type, id) {
        if (type === 'typing' || type === 'suggestions') return; // Don't persist these

        this.history.push({
            id: id,
            message: message,
            type: type, // 'user' or 'ai'
            timestamp: new Date().toISOString()
            // Removed feedbackGiven property
        });
        this.saveHistory(); // Save after adding
    },

    /**
     * Adds a message bubble to the chat DOM.
     * Removed feedback button creation.
     */
    addMessageToDOM: function(message, type, id) { // Removed feedbackGiven parameter
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) {
            console.error(`AiChat Error: chatMessages container not found when adding message ID ${id}.`);
            return; // Exit if container not found
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${type}-wrapper`;
        messageWrapper.id = id; // Assign the unique ID

        const messageElement = document.createElement('div');
        messageElement.className = `message-bubble ${type}-message`;

        // Basic text content. Consider escaping or using innerText if message source isn't fully trusted.
        messageElement.textContent = message;

        messageWrapper.appendChild(messageElement);

        // Removed feedback button addition

        messagesContainer.appendChild(messageWrapper);
        this.scrollToBottom(); // Scroll to the new message
    },

    /**
     * Add message to both DOM and history (if applicable type).
     */
    addMessage: function(message, type, id) {
        this.addMessageToDOM(message, type, id);
        // Only add user and AI messages to persistent history
        if (type === 'user' || type === 'ai') {
            this.addMessageToHistory(message, type, id);
        }
    },

    // Removed createFeedbackButtons function
    // Removed handleFeedback function
    // Removed submitFeedback function
    // Removed sendFeedbackToServer function

    /**
     * Export chat history as a formatted text file.
     * Removed feedback status from export.
     */
    exportChat: function() {
        let chatContent = `AI Chat Conversation\nModel: ${this.models[this.currentModel]?.name || this.currentModel}\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;

        // Filter out non-user/ai messages and format
        const relevantHistory = this.history.filter(msg => msg.type === 'user' || msg.type === 'ai');

        if (relevantHistory.length === 0) {
            this.showError("Nothing to export.");
            return;
        }

        relevantHistory.forEach(msg => {
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const prefix = msg.type === 'user' ? 'You' : 'AI';
            chatContent += `[${timestamp}] ${prefix}:\n${msg.message}\n`;
            // Removed feedback status line
            chatContent += "\n---\n\n"; // Separator
        });

        try {
            // Create a blob and trigger download
            const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const dateStamp = new Date().toISOString().split('T')[0];
            link.download = `ai-chat-history-${dateStamp}.txt`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href); // Clean up blob URL

             // Show success notification
             if (typeof App !== 'undefined' && typeof App.showNotification === 'function') {
                App.showNotification("Chat history exported.", 'success');
            } else {
                console.log("AiChat: Chat history exported (notification unavailable).");
                // alert("Chat history exported."); // Fallback
            }

        } catch (e) {
            console.error("AiChat Error: Failed to create or download chat export.", e);
            this.showError("Failed to export chat history.");
        }
    },


    /**
     * Shows a visual typing indicator in the chat.
     */
    showTypingIndicator: function() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Remove existing indicator first (safety check)
        this.hideTypingIndicator();

        const indicatorWrapper = document.createElement('div');
        indicatorWrapper.className = 'message-wrapper ai-wrapper'; // Style like an AI message
        indicatorWrapper.id = 'typingIndicator'; // ID for easy removal

        const indicator = document.createElement('div');
        // Reuse ai-message for styling, add loading class
        indicator.className = 'message-bubble ai-message loading-indicator';
        // Simple dot animation (requires CSS)
        indicator.innerHTML = '<span></span><span></span><span></span>';

        indicatorWrapper.appendChild(indicator);
        messagesContainer.appendChild(indicatorWrapper);
        this.scrollToBottom();
    },

    /**
     * Removes the typing indicator from the chat.
     */
    hideTypingIndicator: function() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    },

    /**
     * Scrolls the chat message container to the bottom.
     */
    scrollToBottom: function() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },

    /**
     * Show error message using the notification system or fallback alert.
     */
    showError: function(message) {
        console.error("AiChat Error Displayed:", message); // Log all errors shown to user
        // Use App.showNotification if available
        if (typeof App !== 'undefined' && typeof App.showNotification === 'function') {
            App.showNotification(message, 'danger'); // Use 'danger' type for errors
        } else {
            // Fallback alert if notification system isn't available
            alert(`Error: ${message}`);
        }
    }
};

// ==========================================================================
// == Initialization Notes ==
// ==========================================================================
// REMEMBER:
// 1. Ensure the HTML from AiChat.getHtml() is inserted into your page's DOM.
// 2. Call AiChat.init() *AFTER* the HTML is present in the DOM.
//    Example using DOMContentLoaded (if this script runs early):
//    document.addEventListener('DOMContentLoaded', () => {
//        // Assuming you have a container div with id="aiChatContainer"
//        const chatContainer = document.getElementById('aiChatContainer');
//        if (chatContainer) {
//           chatContainer.innerHTML = AiChat.getHtml();
//           AiChat.init();
//        } else {
//           console.error("AiChat container not found in DOM.");
//        }
//    });
// ==========================================================================