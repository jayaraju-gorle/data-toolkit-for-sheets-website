/**************************************************
 *  Main Application Module
 *
 *  This module handles the initialization and coordination of all tools
 *  in the Data Toolkit for Sheets application.
 */

const App = {
    /**
      * Initialize the application
      */
    init: function() {
        // Initialize all tools
        this.initializeTools();

        // Set up tab change event listener
        this.setupTabChangeListener();
    },

    /**
      * Initialize all tools
      */
    initializeTools: function() {
        // Initialize API Tool
        const apiToolContainer = document.getElementById('api-tool');
        if (apiToolContainer) {
            apiToolContainer.innerHTML = ApiTool.getHtml();
            ApiTool.init();
        }

        // Initialize AI Chat
        const aiChatContainer = document.getElementById('ai-chat');
        if (aiChatContainer) {
            aiChatContainer.innerHTML = AiChat.getHtml();
            AiChat.init();
        }

        // Initialize Timestamp Tool
        const timestampToolContainer = document.getElementById('timestamp-tool');
        if (timestampToolContainer) {
            timestampToolContainer.innerHTML = TimestampTool.getHtml();
            TimestampTool.init();
        }
    },

    /**
      * Set up tab change event listener
      */
    setupTabChangeListener: function() {
        const toolTabs = document.getElementById('toolTabs');
        if (toolTabs) {
            toolTabs.addEventListener('shown.bs.tab', (event) => {
                // Update active state
                const tabs = toolTabs.querySelectorAll('.nav-link');
                tabs.forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');

                // Update content visibility
                const panes = document.querySelectorAll('.tab-pane');
                panes.forEach(pane => {
                    pane.classList.remove('show', 'active');
                    if (pane.id === event.target.getAttribute('data-bs-target').substring(1)) {
                        pane.classList.add('show', 'active');
                    }
                });
            });
        }
    }
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
