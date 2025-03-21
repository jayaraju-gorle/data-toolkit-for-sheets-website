/**
 * AI Chat Module
 * 
 * This module handles the AI chat functionality using a centralized
 * API endpoint that supports multiple AI models.
 */

const AiChat = {
    apiEndpoint: 'https://ai-tools-backend-772545827002.asia-south1.run.app/text',
    
    models: {
        gemini: {
            name: 'Gemini',
            icon: 'fas fa-brain'
        }
    },
    
    currentModel: 'gemini',
    
    /**
     * Get the HTML template for the AI chat
     */
    getHtml: function() {
        return `
            <div class="card">
                <div class="card-body">
                    <!-- Chat Messages -->
                    <div class="chat-container mb-3">
                        <div class="chat-messages" id="chatMessages">
                            <!-- Messages will be added here -->
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div class="input-group">
                        <textarea class="form-control" id="userInput" rows="2" placeholder="Type your message..."></textarea>
                        <button class="btn btn-primary" id="sendMessage">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Initialize the AI chat
     */
    init: function() {
        this.setupEventListeners();
        this.addWelcomeMessage();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Send message button
        document.getElementById('sendMessage').addEventListener('click', () => this.sendMessage());
        
        // Enter key in textarea
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    },
    
    /**
     * Add welcome message
     */
    addWelcomeMessage: function() {
        const welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?";
        this.addMessage(welcomeMessage, 'ai');
    },
    
    /**
     * Send message to AI
     */
    sendMessage: async function() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            this.showError(error.message);
        }
    },
    
    /**
     * Get AI response from the API endpoint
     */
    getAIResponse: async function(message) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: message
            })
        });
        
        if (!response.ok) {
            console.error('API Response:', response);
            throw new Error('Failed to get AI response');
        }
        
        const data = await response.json();
        console.log('AI Response:', data); // Debug log
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Return the result property from the response
        return data.result || 'No response from AI';
    },
    
    /**
     * Add message to chat
     */
    addMessage: function(message, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message-bubble ${type}-message`;
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    /**
     * Show typing indicator
     */
    showTypingIndicator: function() {
        const indicator = document.createElement('div');
        indicator.className = 'message-bubble ai-message loading-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        indicator.id = 'typingIndicator';
        document.getElementById('chatMessages').appendChild(indicator);
    },
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator: function() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    },
    
    /**
     * Show error message
     */
    showError: function(message) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger notification';
        notification.textContent = message;
        
        container.appendChild(notification);
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};
