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
            { id: 'gemini', name: 'Gemini (Google)', description: 'Best for general knowledge and assistant tasks' },
            { id: 'llama', name: 'Llama (Meta)', description: 'Excels at reasoning and complex problem solving' }
        ],
        maxHistoryItems: 50,
        defaultModel: 'gemini'
    },
    
    // Current state
    state: {
        messages: [],
        selectedModel: null,
        isWaiting: false,
        endpointUrl: '',
        apiKey: '',
        context: '', // Optional context to include with each message
    },
    
    /**
     * Initialize the AI Chat module
     */
    init: function() {
        // Load settings from storage
        this.loadSettings();
        
        // Load conversation history
        this.loadHistory();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Display chat messages
        this.renderChatMessages();
        
        // Initialize model selector
        this.initializeModelSelector();
        
        // Setup endpoint configuration
        this.initializeEndpointConfig();
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
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-robot me-2"></i> AI Chat
                                </h5>
                                <button type="button" id="ai-chat-settings-btn" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-cog"></i> Settings
                                </button>
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
                
                <!-- Settings Modal -->
                <div class="modal fade" id="ai-chat-settings-modal" tabindex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="settingsModalLabel">AI Chat Settings</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="ai-settings-form">
                                    <div class="mb-3">
                                        <label for="endpoint-url" class="form-label">API Endpoint URL</label>
                                        <input type="url" class="form-control" id="endpoint-url" placeholder="https://your-api-endpoint.com/chat">
                                        <div class="form-text">The URL where chat requests will be sent</div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="api-key" class="form-label">API Key</label>
                                        <input type="password" class="form-control" id="api-key" placeholder="Your API key">
                                        <div class="form-text">Your API key for authentication (stored locally)</div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="context-input" class="form-label">Default Context</label>
                                        <textarea class="form-control" id="context-input" rows="3" placeholder="Optional context to include with each message"></textarea>
                                        <div class="form-text">This context will be included with each message sent to the AI</div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" id="save-settings-btn" class="btn btn-primary">Save Settings</button>
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
        
        // Settings button
        const settingsBtn = document.getElementById('ai-chat-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }
        
        // Save settings button
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
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
                // Save the selected model in settings
                const settings = DataToolkit.loadFromStorage(DataToolkit.STORAGE_KEYS.CHAT_SETTINGS, {});
                settings.selectedModel = this.state.selectedModel;
                DataToolkit.saveToStorage(DataToolkit.STORAGE_KEYS.CHAT_SETTINGS, settings);
            });
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
     * Initialize endpoint configuration fields in the settings modal
     */
    initializeEndpointConfig: function() {
        const endpointUrlInput = document.getElementById('endpoint-url');
        const apiKeyInput = document.getElementById('api-key');
        const contextInput = document.getElementById('context-input');
        
        if (endpointUrlInput) endpointUrlInput.value = this.state.endpointUrl || '';
        if (apiKeyInput) apiKeyInput.value = this.state.apiKey || '';
        if (contextInput) contextInput.value = this.state.context || '';
    },
    
    /**
     * Handle chat form submission
     */
    handleChatSubmit: function() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        
        // Clear input
        messageInput.value = '';
        
        // Send message to AI
        this.sendMessageToAI(message);
    },
    
    /**
     * Send a message to the AI service
     * @param {string} message - The message to send
     */
    sendMessageToAI: function(message) {
        // Get the selected model
        const model = this.state.selectedModel || this.config.defaultModel;
        
        // Show loading state
        this.state.isWaiting = true;
        this.addLoadingIndicator();
        
        // Prepare context from previous messages
        const conversation = this.prepareConversationContext();
        
        // Prepare the request
        let apiUrl = this.state.endpointUrl;
        
        // If no endpoint is configured, show an error message instead
        if (!apiUrl) {
            this.removeLoadingIndicator();
            this.addMessage('system', 'Please configure your API endpoint in Settings to use the AI chat feature.');
            this.state.isWaiting = false;
            return;
        }
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add API key if provided
        if (this.state.apiKey) {
            headers['Authorization'] = `Bearer ${this.state.apiKey}`;
        }
        
        // Prepare the request body
        const requestBody = {
            model: model,
            message: message,
            conversation: conversation
        };
        
        // If there's context, add it
        if (this.state.context) {
            requestBody.context = this.state.context;
        }
        
        // Make the API request
        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading indicator
            this.removeLoadingIndicator();
            
            // Add AI response to chat
            if (data.response) {
                this.addMessage('ai', data.response, model);
            } else {
                throw new Error('Invalid response format from API');
            }
        })
        .catch(error => {
            // Remove loading indicator
            this.removeLoadingIndicator();
            
            // Add error message
            this.addMessage('system', `Error: ${error.message}`);
            
            // Show error notification
            DataToolkit.notify(`API error: ${error.message}`, 'error');
        })
        .finally(() => {
            this.state.isWaiting = false;
        });
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
     * Add loading indicator to chat
     */
    addLoadingIndicator: function() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const loadingHtml = `
            <div id="loading-indicator" class="message-bubble ai-message loading-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', loadingHtml);
        this.scrollToBottom();
    },
    
    /**
     * Remove loading indicator
     */
    removeLoadingIndicator: function() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
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
     * Open the settings modal
     */
    openSettingsModal: function() {
        const endpointUrlInput = document.getElementById('endpoint-url');
        const apiKeyInput = document.getElementById('api-key');
        const contextInput = document.getElementById('context-input');
        
        // Set current values
        if (endpointUrlInput) endpointUrlInput.value = this.state.endpointUrl || '';
        if (apiKeyInput) apiKeyInput.value = this.state.apiKey || '';
        if (contextInput) contextInput.value = this.state.context || '';
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('ai-chat-settings-modal'));
        modal.show();
    },
    
    /**
     * Save settings from the modal
     */
    saveSettings: function() {
        const endpointUrlInput = document.getElementById('endpoint-url');
        const apiKeyInput = document.getElementById('api-key');
        const contextInput = document.getElementById('context-input');
        
        // Update state
        if (endpointUrlInput) this.state.endpointUrl = endpointUrlInput.value.trim();
        if (apiKeyInput) this.state.apiKey = apiKeyInput.value.trim();
        if (contextInput) this.state.context = contextInput.value.trim();
        
        // Save to localStorage
        const settings = {
            endpointUrl: this.state.endpointUrl,
            apiKey: this.state.apiKey,
            context: this.state.context,
            selectedModel: this.state.selectedModel || this.config.defaultModel
        };
        
        DataToolkit.saveToStorage(DataToolkit.STORAGE_KEYS.CHAT_SETTINGS, settings);
        
        // Hide the modal
        const modalElement = document.getElementById('ai-chat-settings-modal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        
        // Show success notification
        DataToolkit.notify('Settings saved successfully', 'success');
    },
    
    /**
     * Load settings from localStorage
     */
    loadSettings: function() {
        const settings = DataToolkit.loadFromStorage(DataToolkit.STORAGE_KEYS.CHAT_SETTINGS, {});
        
        this.state.endpointUrl = settings.endpointUrl || '';
        this.state.apiKey = settings.apiKey || '';
        this.state.context = settings.context || '';
        this.state.selectedModel = settings.selectedModel || this.config.defaultModel;
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
    },
    
    /**
     * Prepare conversation context from message history
     * @returns {Array} Formatted conversation history for the AI
     */
    prepareConversationContext: function() {
        // Filter out system messages and format for the API
        return this.state.messages
            .filter(msg => msg.sender !== 'system')
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
    }
};