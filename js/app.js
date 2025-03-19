/**
 * Data Toolkit for Sheets - Main Application Script
 * 
 * This script handles the core functionality of the Data Toolkit for Sheets web application,
 * including module navigation, theme management, and shared utilities.
 */

// Application namespace
const DataToolkit = {
    // Constants
    STORAGE_KEYS: {
        THEME: 'datatoolkit_theme',
        CURRENT_MODULE: 'datatoolkit_current_module',
        // API Tool storage keys
        API_HISTORY: 'datatoolkit_api_history',
        API_ENVVARS: 'datatoolkit_api_envvars',
        API_CURRENT: 'datatoolkit_api_current',
        // AI Chat storage keys
        CHAT_HISTORY: 'datatoolkit_chat_history',
        CHAT_SETTINGS: 'datatoolkit_chat_settings',
        // Timestamp Tool storage keys
        TIMESTAMP_FORMATS: 'datatoolkit_timestamp_formats',
        TIMESTAMP_RECENT: 'datatoolkit_timestamp_recent'
    },
    
    // UI Messages
    UI_MESSAGES: {
        REPORT_SUCCESS: 'Success',
        REPORT_ERROR: 'Error',
        REPORT_WARNING: 'Warning',
        TIMESTAMP_CONVERT_SUCCESS: "Timestamp converted successfully",
        TIMESTAMP_CONVERT_ERROR: "Error converting timestamp",
        API_REQUEST_ERROR: "Error executing API request: ",
        GEMINI_API_ERROR: "Error communicating with AI model: "
    },
    
    // Current active module
    currentModule: 'api-tool',
    
    /**
     * Initialize the application
     */
    init: function() {
        // Apply saved theme if available
        this.applyTheme();
        
        // Set up navigation handlers
        this.setupNavigation();
        
        // Set up theme toggle
        this.setupThemeToggle();
        
        // Load the active module from local storage or default
        const savedModule = localStorage.getItem(this.STORAGE_KEYS.CURRENT_MODULE);
        if (savedModule) {
            this.currentModule = savedModule;
        }
        
        // Update active nav link
        this.updateActiveNav();
        
        // Load the current module content
        this.loadModule(this.currentModule);
    },
    
    /**
     * Set up navigation event handlers
     */
    setupNavigation: function() {
        const navLinks = document.querySelectorAll('.nav-link[data-module]');
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const module = link.getAttribute('data-module');
                this.switchModule(module);
            });
        });
    },
    
    /**
     * Update active navigation link
     */
    updateActiveNav: function() {
        const navLinks = document.querySelectorAll('.nav-link[data-module]');
        navLinks.forEach(link => {
            const module = link.getAttribute('data-module');
            if (module === this.currentModule) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    /**
     * Switch to a different module
     * @param {string} moduleName - The module to switch to
     */
    switchModule: function(moduleName) {
        if (this.currentModule === moduleName) return;
        
        this.currentModule = moduleName;
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_MODULE, moduleName);
        
        // Update active nav link
        this.updateActiveNav();
        
        // Load the new module content
        this.loadModule(moduleName);
    },
    
    /**
     * Load a module's content
     * @param {string} moduleName - The module to load
     */
    loadModule: function(moduleName) {
        const container = document.getElementById('app-container');
        
        // Show loading state
        container.innerHTML = '<div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Generate the module content based on the module name
        switch (moduleName) {
            case 'api-tool':
                // If ApiTool module is defined, initialize it
                if (typeof ApiTool !== 'undefined') {
                    container.innerHTML = ApiTool.getHtml();
                    ApiTool.init();
                } else {
                    container.innerHTML = '<div class="alert alert-warning">API Tool module not loaded</div>';
                }
                break;
                
            case 'ai-chat':
                // If AiChat module is defined, initialize it
                if (typeof AiChat !== 'undefined') {
                    container.innerHTML = AiChat.getHtml();
                    AiChat.init();
                } else {
                    container.innerHTML = '<div class="alert alert-warning">AI Chat module not loaded</div>';
                }
                break;
                
            case 'timestamp':
                // If TimestampTool module is defined, initialize it
                if (typeof TimestampTool !== 'undefined') {
                    container.innerHTML = TimestampTool.getHtml();
                    TimestampTool.init();
                } else {
                    container.innerHTML = '<div class="alert alert-warning">Timestamp Tool module not loaded</div>';
                }
                break;
                
            default:
                container.innerHTML = '<div class="alert alert-danger">Module not found</div>';
        }
    },
    
    /**
     * Set up theme toggle functionality
     */
    setupThemeToggle: function() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },
    
    /**
     * Apply the current theme from localStorage or system preference
     */
    applyTheme: function() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEYS.THEME);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-theme');
            this.updateThemeToggleButton('light');
        } else {
            document.body.classList.remove('dark-theme');
            this.updateThemeToggleButton('dark');
        }
    },
    
    /**
     * Toggle between light and dark themes
     */
    toggleTheme: function() {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem(this.STORAGE_KEYS.THEME, 'light');
            this.updateThemeToggleButton('dark');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem(this.STORAGE_KEYS.THEME, 'dark');
            this.updateThemeToggleButton('light');
        }
    },
    
    /**
     * Update the theme toggle button icon and text
     * @param {string} mode - The mode to switch to ('light' or 'dark')
     */
    updateThemeToggleButton: function(mode) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            if (mode === 'dark') {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            }
        }
    },
    
    /**
     * Display a notification to the user
     * @param {string} message - The notification message
     * @param {string} type - The notification type (success, error, info, warning)
     * @param {number} duration - How long to display the notification in ms
     */
    notify: function(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        const notificationId = 'notification-' + Date.now();
        
        const notificationHtml = `
            <div id="${notificationId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', notificationHtml);
        
        // Use Bootstrap's Toast API
        const toastElement = document.getElementById(notificationId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: duration });
        toast.show();
        
        // Remove the element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    },
    
    /**
     * Get the appropriate icon for a notification type
     * @param {string} type - The notification type
     * @returns {string} The Font Awesome icon name
     */
    getNotificationIcon: function(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-triangle';
            case 'warning': return 'exclamation-circle';
            default: return 'info-circle';
        }
    },
    
    /**
     * Helper function to save data to localStorage with error handling
     * @param {string} key - The storage key
     * @param {any} value - The value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    saveToStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.notify('Failed to save data: ' + error.message, 'error');
            return false;
        }
    },
    
    /**
     * Helper function to load data from localStorage with error handling
     * @param {string} key - The storage key
     * @param {any} defaultValue - Default value to return if key doesn't exist
     * @returns {any} The parsed value or defaultValue
     */
    loadFromStorage: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.notify('Failed to load data: ' + error.message, 'error');
            return defaultValue;
        }
    },
    
    /**
     * Format JSON with syntax highlighting
     * @param {string} jsonString - JSON string to format
     * @returns {string} HTML with syntax highlighting
     */
    formatJsonWithSyntaxHighlighting: function(jsonString) {
        try {
            const obj = JSON.parse(jsonString);
            const formattedJson = JSON.stringify(obj, null, 2);
            
            const highlighted = formattedJson
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/(""|"[^"]*")(:\s*)("[^"]*"|\d+|true|false|null)/g, function (match, key, colon, value) {
                    let cls = 'json-key';
                    key = key.replace(/"/g, '').length === 0 ? '""' : key;
                    
                    let valueClass;
                    if (/^"/.test(value)) {
                        valueClass = 'json-string';
                    } else if (/true|false/.test(value)) {
                        valueClass = 'json-boolean';
                    } else if (/null/.test(value)) {
                        valueClass = 'json-null';
                    } else {
                        valueClass = 'json-number';
                    }
                    
                    return '<span class="' + cls + '">' + key + '</span>' + colon + '<span class="' + valueClass + '">' + value + '</span>';
                });
            
            return highlighted;
        } catch (error) {
            console.error('Error formatting JSON:', error);
            return jsonString;
        }
    }
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    DataToolkit.init();
});