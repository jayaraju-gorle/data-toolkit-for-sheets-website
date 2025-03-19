/**
 * AI Chat Interface Module
 * 
 * This module provides a user interface for interacting with different AI models,
 * saving conversation history, and managing chat contexts.
 */

// AI Chat module namespace
const AiChat = {
    // Module configuration
    config: {
        models: [
            { 
                id: 'gemini', 
                name: 'Gemini (Google)', 
                description: 'Best for general knowledge and assistant tasks',
                endpoint: 'https://script.google.com/macros/s/AKfycbzoQy8MpT95ibQ2w61by5oOsJRlzqkqoNu9zB-1adBTsiKqkYIN2pc6fpk3QGdlU_FiZg/exec',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            { 
                id: 'llama', 
                name: 'Llama (Meta)', 
                description: 'Excels at reasoning and complex problem solving',
                endpoint: 'https://script.google.com/macros/s/AKfycbzoQy8MpT95ibQ2w61by5oOsJRlzqkqoNu9zB-1adBTsiKqkYIN2pc6fpk3QGdlU_FiZg/exec',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ],
        maxHistoryItems: 50,
        defaultModel: 'gemini'
    },
    
    // Current state
    state: {
        messages: [],
        selectedModel: null,
        isWaiting: false
    },
    
    /**
     * Initialize the AI Chat module
     */
    init: function() {
        // Load conversation history
        this.loadHistory();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Display chat messages
        this.renderChatMessages();
        
        // Initialize model selector
        this.initializeModelSelector();
    },
    
    /**
     * Generate the HTML for the AI Chat interface
     * @returns {string} HTML markup for the interface
     */
    getHtml: function() {
        return `
            <div class="container-fluid">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-robot me-2"></i> AI Chat
                                </h5>
                            </div>
                            <div class="card-body p-0">
                                <div class="chat-container">
                                    <div id="chat-messages" class="chat-messages">
                                        <!-- Messages will be rendered here -->
                                    </div>
                                    <div class="p-3 border-top">
                                        <form id="chat-form" class="d-flex">
                                            <div class="input-group">
                                                <select id="model-selector" class="form-select flex-shrink-1" style="max-width: 180px;">
                                                    <!-- Model options will be added dynamically -->
                                                </select>
                                                <input type="text" id="message-input" class="form-control" placeholder="Type your message..." required>
                                                <button type="submit" class="btn btn-primary">
                                                    <i class="fas fa-paper-plane"></i>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-history me-2"></i> Conversation History
                                </h5>
                                <div>
                                    <button type="button" id="clear-conversation-btn" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-trash"></i> Clear
                                    </button>
                                    <button type="button" id="export-conversation-btn" class="btn btn-sm btn-outline-secondary ms-1">
                                        <i class="fas fa-download"></i> Export
                                    </button>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <ul id="conversation-history" class="list-group list-group-flush">
                                    <!-- Conversation history will be rendered here -->
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners: function() {
        // Chat form submission
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleChatSubmit();
            });
        }
        
        // Clear conversation button
        const clearConversationBtn = document.getElementById('clear-conversation-btn');
        if (clearConversationBtn) {
            clearConversationBtn.addEventListener('click', () => {
                this.clearConversation();
            });
        }
        
        // Export conversation button
        const exportConversationBtn = document.getElementById('export-conversation-btn');
        if (exportConversationBtn) {
            exportConversationBtn.addEventListener('click', () => {
                this.exportConversation();
            });
        }
        
        // Model selector change
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', () => {
                this.state.selectedModel = modelSelector.value;
            });
        }
    },
    
    /**
     * Handle chat form submission
     */
    handleChatSubmit: async function() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message || this.state.isWaiting) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        messageInput.value = '';
        
        // Get selected model
        const selectedModel = this.config.models.find(m => m.id === this.state.selectedModel) || 
                            this.config.models.find(m => m.id === this.config.defaultModel);
        
        if (!selectedModel) {
            this.addMessage('ai', 'Error: No model selected');
            return;
        }
        
        this.state.isWaiting = true;
        
        try {
            const response = await fetch(selectedModel.endpoint, {
                method: 'POST',
                headers: selectedModel.headers,
                body: JSON.stringify({
                    message: message,
                    model: selectedModel.id
                })
            });
            
            const data = await response.json();
            this.addMessage('ai', data.response || 'Sorry, I encountered an error processing your request.');
        } catch (error) {
            this.addMessage('ai', 'Sorry, I encountered an error processing your request.');
        } finally {
            this.state.isWaiting = false;
        }
    },
    
    /**
     * Initialize the model selector dropdown
     */
    initializeModelSelector: function() {
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector) return;
        
        // Clear existing options
        modelSelector.innerHTML = '';
        
        // Add options for each model
        this.config.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            option.title = model.description;
            modelSelector.appendChild(option);
        });
        
        // Set selected model
        if (this.state.selectedModel) {
            modelSelector.value = this.state.selectedModel;
        }
    },
    
    /**
     * Add a new message to the chat
     * @param {string} sender - 'user', 'ai', or 'system'
     * @param {string} text - The message text
     * @param {string} model - The AI model used (only for 'ai' sender)
     */
    addMessage: function(sender, text, model = '') {
        // Create a new message object
        const message = {
            timestamp: new Date().toISOString(),
            sender: sender,
            text: text,
            model: model
        };
        
        // Add to state
        this.state.messages.push(message);
        
        // Limit the number of messages in state
        if (this.state.messages.length > this.config.maxHistoryItems) {
            this.state.messages = this.state.messages.slice(-this.config.maxHistoryItems);
        }
        
        // Save to storage
        this.saveHistory();
        
        // Render the new message
        this.renderMessage(message);
        
        // Scroll to bottom
        this.scrollToBottom();
    },
    
    /**
     * Render a single message in the chat
     * @param {Object} message - The message object to render
     */
    renderMessage: function(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        let messageClass = '';
        let senderLabel = '';
        let modelBadge = '';
        
        // Determine message styling based on sender
        if (message.sender === 'user') {
            messageClass = 'user-message';
            senderLabel = '<small class="text-white-50 d-block mb-1">You</small>';
        } else if (message.sender === 'ai') {
            messageClass = 'ai-message';
            senderLabel = '<small class="text-muted d-block mb-1">AI Assistant</small>';
            if (message.model) {
                modelBadge = `<span class="badge bg-secondary float-end ms-2">${message.model}</span>`;
            }
        } else { // system message
            messageClass = 'ai-message';
            senderLabel = '<small class="text-muted d-block mb-1">System</small>';
        }
        
        // Format the message text
        let formattedText = message.text;
        
        // Check for code blocks and format them
        if (formattedText.includes('```')) {
            formattedText = this.formatCodeBlocks(formattedText);
        }
        
        // Create the message HTML
        const messageHtml = `
            <div class="message-bubble ${messageClass}">
                ${senderLabel}
                ${modelBadge}
                <div class="message-content">
                    ${formattedText}
                </div>
            </div>
        `;
        
        // Add to chat
        chatMessages.insertAdjacentHTML('beforeend', messageHtml);
    },
    
    /**
     * Format code blocks in message text
     * @param {string} text - Message text potentially containing code blocks
     * @returns {string} Formatted text with code blocks
     */
    formatCodeBlocks: function(text) {
        let formattedText = text;
        const codeBlockRegex = /```(?:([a-z]+)\n)?([\s\S]*?)```/g;
        
        formattedText = formattedText.replace(codeBlockRegex, (match, language, code) => {
            language = language || '';
            return `<pre class="bg-light p-2 rounded"><code class="language-${language}">${this.escapeHtml(code)}</code></pre>`;
        });
        
        return formattedText;
    },
    
    /**
     * Escape HTML entities
     * @param {string} text - The text to escape
     * @returns {string} Escaped text
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },
    
    /**
     * Render all chat messages
     */
    renderChatMessages: function() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Clear existing messages
        chatMessages.innerHTML = '';
        
        // Render welcome message if no messages
        if (this.state.messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-robot fa-4x text-muted mb-3"></i>
                    <h5>Welcome to AI Chat</h5>
                    <p class="text-muted">Send a message to start a conversation with an AI assistant.</p>
                </div>
            `;
            return;
        }
        
        // Render each message
        this.state.messages.forEach(message => {
            this.renderMessage(message);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    },
    
    /**
     * Render conversation history
     */
    renderConversationHistory: function() {
        const historyElement = document.getElementById('conversation-history');
        if (!historyElement) return;
        
        // Clear existing items
        historyElement.innerHTML = '';
        
        // Show message if no history
        if (this.state.messages.length === 0) {
            historyElement.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    No conversation history
                </li>
            `;
            return;
        }
        
        // Group messages by conversation "sessions"
        // A session starts with a user message followed by an AI response
        let sessions = [];
        let currentSession = { messages: [] };
        let lastSender = null;
        
        this.state.messages.forEach((message, index) => {
            // If this is a user message after an AI response, start a new session
            if (message.sender === 'user' && lastSender === 'ai') {
                sessions.push(currentSession);
                currentSession = { messages: [] };
            }
            
            // Add message to current session
            currentSession.messages.push(message);
            lastSender = message.sender;
            
            // If this is the last message, add the current session
            if (index === this.state.messages.length - 1) {
                sessions.push(currentSession);
            }
        });
        
        // Render each session as a history item
        sessions.forEach((session, index) => {
            if (session.messages.length === 0) return;
            
            // Find first user message for the preview
            const userMessage = session.messages.find(m => m.sender === 'user');
            if (!userMessage) return;
            
            // Find timestamp of first message
            const timestamp = new Date(session.messages[0].timestamp);
            const formattedDate = this.formatDate(timestamp);
            
            const historyItemHtml = `
                <li class="list-group-item history-item" data-session-index="${index}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="me-2">
                            <div class="text-truncate" style="max-width: 250px;">${userMessage.text}</div>
                            <small class="text-muted">${formattedDate}</small>
                        </div>
                        <span class="badge bg-primary rounded-pill">${session.messages.length}</span>
                    </div>
                </li>
            `;
            
            historyElement.insertAdjacentHTML('afterbegin', historyItemHtml);
        });
        
        // Add event listeners to history items
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            item.addEventListener('click', () => {
                const sessionIndex = parseInt(item.getAttribute('data-session-index'));
                // TODO: Implement session viewing or restoration if needed
            });
        });
    },
    
    /**
     * Format a date for display
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDate: function(date) {
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && 
                      date.getMonth() === now.getMonth() && 
                      date.getFullYear() === now.getFullYear();
        
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                   ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    },
    
    /**
     * Scroll the chat messages container to the bottom
     */
    scrollToBottom: function() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    },
    
    /**
     * Load conversation history from localStorage
     */
    loadHistory: function() {
        this.state.messages = DataToolkit.loadFromStorage(DataToolkit.STORAGE_KEYS.CHAT_HISTORY, []);
        this.renderConversationHistory();
    },
    
    /**
     * Save conversation history to localStorage
     */
    saveHistory: function() {
        DataToolkit.saveToStorage(DataToolkit.STORAGE_KEYS.CHAT_HISTORY, this.state.messages);
        this.renderConversationHistory();
    },
    
    /**
     * Clear the conversation history
     */
    clearConversation: function() {
        if (confirm('Are you sure you want to clear the conversation history? This cannot be undone.')) {
            this.state.messages = [];
            this.saveHistory();
            this.renderChatMessages();
            DataToolkit.notify('Conversation history cleared', 'success');
        }
    },
    
    /**
     * Export conversation history as JSON
     */
    exportConversation: function() {
        if (this.state.messages.length === 0) {
            DataToolkit.notify('No conversation to export', 'warning');
            return;
        }
        
        try {
            const exportData = JSON.stringify(this.state.messages, null, 2);
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `ai-chat-export-${timestamp}.json`;
            
            // Create a download link
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            DataToolkit.notify('Conversation exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting conversation:', error);
            DataToolkit.notify('Error exporting conversation: ' + error.message, 'error');
        }
    }
};