/**
 * Data Toolkit for Sheets - API Request Tool Module
 * 
 * This module handles the API request tool functionality, allowing users to
 * configure and execute API requests, view responses, and manage request history.
 */

const ApiTool = {
    // Current request configuration
    currentRequest: {
        method: 'GET',
        url: '',
        headers: {},
        body: '',
        envVars: {}
    },
    
    // Request history
    requestHistory: [],
    
    /**
     * Initialize the API Tool module
     */
    init: function() {
        // Load saved data
        this.loadSavedData();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Update the method selection UI
        this.updateMethodSelection();
        
        // Set up headers UI
        this.setupHeaders();
        
        // Set up environment variables
        this.setupEnvironmentVars();
        
        // Update history list
        this.updateHistoryList();
    },
    
    /**
     * Load saved data from localStorage
     */
    loadSavedData: function() {
        // Load request history
        this.requestHistory = DataToolkit.loadFromStorage(
            DataToolkit.STORAGE_KEYS.API_HISTORY, 
            []
        );
        
        // Load environment variables
        this.currentRequest.envVars = DataToolkit.loadFromStorage(
            DataToolkit.STORAGE_KEYS.API_ENVVARS, 
            {}
        );
        
        // Load current request if available
        const savedRequest = DataToolkit.loadFromStorage(
            DataToolkit.STORAGE_KEYS.API_CURRENT
        );
        
        if (savedRequest) {
            this.currentRequest = {
                ...this.currentRequest,
                ...savedRequest
            };
        }
    },
    
    /**
     * Set up event handlers for the API tool
     */
    setupEventHandlers: function() {
        // Method selection
        document.querySelectorAll('.api-method-selector').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMethod(e.target.dataset.method);
            });
        });
        
        // Execute request button
        document.getElementById('execute-request').addEventListener('click', () => {
            this.executeRequest();
        });
        
        // Clear response button
        document.getElementById('clear-response').addEventListener('click', () => {
            this.clearResponse();
        });
        
        // Copy response button
        document.getElementById('copy-response').addEventListener('click', () => {
            this.copyResponseToClipboard();
        });
        
        // Add header button
        document.getElementById('add-header').addEventListener('click', () => {
            this.addHeaderRow();
        });
        
        // Add environment variable button
        document.getElementById('add-env-var').addEventListener('click', () => {
            this.addEnvVarRow();
        });
        
        // Save environment variables button
        document.getElementById('save-env-vars').addEventListener('click', () => {
            this.saveEnvironmentVars();
        });
        
        // Clear history button
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
        
        // URL input change
        document.getElementById('api-url').addEventListener('input', (e) => {
            this.currentRequest.url = e.target.value;
            this.saveCurrentRequest();
        });
        
        // Request body change
        document.getElementById('request-body').addEventListener('input', (e) => {
            this.currentRequest.body = e.target.value;
            this.saveCurrentRequest();
        });
        
        // Save request button
        document.getElementById('save-request').addEventListener('click', () => {
            this.saveCurrentRequest();
            DataToolkit.notify('Request configuration saved', 'success');
        });
        
        // Clear request button
        document.getElementById('clear-request').addEventListener('click', () => {
            this.clearRequest();
        });
    },
    
    /**
     * Get the HTML content for this module
     * @returns {string} HTML content
     */
    getHtml: function() {
        return `
            <div class="row">
                <!-- Left Column - Request Configuration -->
                <div class="col-lg-6">
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-paper-plane me-2"></i>API Request</h5>
                        </div>
                        <div class="card-body">
                            <!-- HTTP Method Selection -->
                            <div class="btn-group mb-3 w-100" role="group">
                                <button type="button" class="btn api-method-selector btn-outline-secondary" data-method="GET">GET</button>
                                <button type="button" class="btn api-method-selector btn-outline-secondary" data-method="POST">POST</button>
                                <button type="button" class="btn api-method-selector btn-outline-secondary" data-method="PUT">PUT</button>
                                <button type="button" class="btn api-method-selector btn-outline-secondary" data-method="DELETE">DELETE</button>
                                <button type="button" class="btn api-method-selector btn-outline-secondary" data-method="PATCH">PATCH</button>
                            </div>
                            
                            <!-- URL Input -->
                            <div class="mb-3">
                                <label for="api-url" class="form-label">URL</label>
                                <input type="url" class="form-control" id="api-url" placeholder="https://api.example.com/endpoint">
                            </div>
                            
                            <!-- Headers -->
                            <div class="mb-3">
                                <label class="form-label d-flex justify-content-between">
                                    <span>Headers</span>
                                    <button id="add-header" class="btn btn-sm btn-outline-primary">
                                        <i class="fas fa-plus"></i> Add Header
                                    </button>
                                </label>
                                <div id="headers-container" class="mb-2">
                                    <!-- Header rows will be added here dynamically -->
                                </div>
                            </div>
                            
                            <!-- Request Body -->
                            <div class="mb-3">
                                <label for="request-body" class="form-label">Request Body</label>
                                <textarea class="form-control" id="request-body" rows="5" placeholder="{\n  \"key\": \"value\"\n}"></textarea>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="d-flex justify-content-between">
                                <button id="execute-request" class="btn btn-primary">
                                    <i class="fas fa-play me-2"></i>Execute Request
                                </button>
                                <div>
                                    <button id="save-request" class="btn btn-outline-secondary">
                                        <i class="fas fa-save me-1"></i>Save
                                    </button>
                                    <button id="clear-request" class="btn btn-outline-secondary">
                                        <i class="fas fa-times me-1"></i>Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Environment Variables -->
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-wrench me-2"></i>Environment Variables</h5>
                        </div>
                        <div class="card-body">
                            <p class="small text-muted mb-3">Use {{variable_name}} syntax in your requests to insert these values.</p>
                            
                            <div id="env-vars-container" class="mb-3">
                                <!-- Environment variables will be added here dynamically -->
                            </div>
                            
                            <div class="d-flex justify-content-between">
                                <button id="add-env-var" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-plus me-1"></i>Add Variable
                                </button>
                                <button id="save-env-vars" class="btn btn-sm btn-success">
                                    <i class="fas fa-save me-1"></i>Save Variables
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column - Response & History -->
                <div class="col-lg-6">
                    <!-- Response Section -->
                    <div class="card mb-4 shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-reply me-2"></i>Response</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <span id="response-status" class="badge bg-secondary">Status: --</span>
                                        <span id="response-time" class="badge bg-secondary ms-2">Time: --</span>
                                    </div>
                                    <div>
                                        <button id="copy-response" class="btn btn-sm btn-outline-secondary">
                                            <i class="fas fa-copy me-1"></i>Copy
                                        </button>
                                        <button id="clear-response" class="btn btn-sm btn-outline-secondary">
                                            <i class="fas fa-times me-1"></i>Clear
                                        </button>
                                    </div>
                                </div>
                                <div class="border rounded">
                                    <pre id="response-container" class="p-3 mb-0" style="max-height: 300px; overflow-y: auto;">No response yet</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- History Section -->
                    <div class="card shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-history me-2"></i>Request History
                                <button id="clear-history" class="btn btn-sm btn-outline-danger float-end">
                                    <i class="fas fa-trash me-1"></i>Clear
                                </button>
                            </h5>
                        </div>
                        <div class="card-body p-0">
                            <div id="history-container" class="list-group list-group-flush" style="max-height: 300px; overflow-y: auto;">
                                <!-- History items will be added here dynamically -->
                                <div class="list-group-item text-center text-muted py-3">No history yet</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
,

    /**
     * Update the method selection UI
     */
    updateMethodSelection: function() {
        const currentMethod = this.currentRequest.method;
        const buttons = document.querySelectorAll('.api-method-selector');
        
        buttons.forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('method-get', 'method-post', 'method-put', 'method-delete', 'method-patch');
            
            if (btn.dataset.method === currentMethod) {
                btn.classList.add('active');
                btn.classList.add('method-' + currentMethod.toLowerCase());
            }
        });
        
        // Update request body visibility based on method
        const requestBodySection = document.getElementById('request-body').closest('.mb-3');
        if (currentMethod === 'GET' || currentMethod === 'DELETE') {
            requestBodySection.style.display = 'none';
        } else {
            requestBodySection.style.display = 'block';
        }

        // Update URL field with current value
        document.getElementById('api-url').value = this.currentRequest.url || '';
        
        // Update request body field with current value
        document.getElementById('request-body').value = this.currentRequest.body || '';
    },
    
    /**
     * Set the HTTP method
     * @param {string} method - The HTTP method to set
     */
    setMethod: function(method) {
        this.currentRequest.method = method;
        this.updateMethodSelection();
        this.saveCurrentRequest();
    },
    
    /**
     * Save the current request configuration to localStorage
     */
    saveCurrentRequest: function() {
        DataToolkit.saveToStorage(
            DataToolkit.STORAGE_KEYS.API_CURRENT, 
            this.currentRequest
        );
    },
    
    /**
     * Clear the current request configuration
     */
    clearRequest: function() {
        this.currentRequest = {
            method: 'GET',
            url: '',
            headers: {},
            body: '',
            envVars: this.currentRequest.envVars // Keep environment variables
        };
        
        // Update UI
        document.getElementById('api-url').value = '';
        document.getElementById('request-body').value = '';
        this.updateMethodSelection();
        this.setupHeaders();
        
        // Save the cleared state
        this.saveCurrentRequest();
        
        DataToolkit.notify('Request configuration cleared', 'info');
    },
    
    /**
     * Set up the environment variables UI
     */
    setupEnvironmentVars: function() {
        const container = document.getElementById('env-vars-container');
        container.innerHTML = '';
        
        // Add existing variables
        Object.entries(this.currentRequest.envVars).forEach(([key, value]) => {
            this.addEnvVarRow(key, value);
        });
        
        // Add one empty row if no variables exist
        if (Object.keys(this.currentRequest.envVars).length === 0) {
            this.addEnvVarRow();
        }
    },
    
    /**
     * Set up the headers UI
     */
    setupHeaders: function() {
        const container = document.getElementById('headers-container');
        container.innerHTML = '';
        
        // Add existing headers
        Object.entries(this.currentRequest.headers).forEach(([key, value]) => {
            this.addHeaderRow(key, value);
        });
        
        // Add one empty row if no headers exist
        if (Object.keys(this.currentRequest.headers).length === 0) {
            this.addHeaderRow();
        }
    },
    
    /**
     * Add a new header row to the UI
     * @param {string} key - Optional key to pre-fill
     * @param {string} value - Optional value to pre-fill
     */
    addHeaderRow: function(key = '', value = '') {
        const container = document.getElementById('headers-container');
        const rowId = 'header-row-' + Date.now();
        
        const rowHtml = `
            <div id="${rowId}" class="input-group mb-2">
                <input type="text" class="form-control header-key" placeholder="Header Name" value="${key}">
                <input type="text" class="form-control header-value" placeholder="Value" value="${value}">
                <button class="btn btn-outline-danger" onclick="ApiTool.removeHeaderRow('${rowId}')"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', rowHtml);
    },
    
    /**
     * Remove a header row from the UI
     * @param {string} rowId - The ID of the row to remove
     */
    removeHeaderRow: function(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
        }
    },
    
    /**
     * Add a new environment variable row to the UI
     * @param {string} key - Optional key to pre-fill
     * @param {string} value - Optional value to pre-fill
     */
    addEnvVarRow: function(key = '', value = '') {
        const container = document.getElementById('env-vars-container');
        const rowId = 'env-row-' + Date.now();
        
        const rowHtml = `
            <div id="${rowId}" class="input-group mb-2">
                <input type="text" class="form-control env-key" placeholder="Variable Name" value="${key}">
                <input type="text" class="form-control env-value" placeholder="Value" value="${value}">
                <button class="btn btn-outline-danger" onclick="ApiTool.removeEnvVarRow('${rowId}')"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', rowHtml);
    },
    
    /**
     * Remove an environment variable row from the UI
     * @param {string} rowId - The ID of the row to remove
     */
    removeEnvVarRow: function(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
        }
    }
,

    /**
     * Save the environment variables from the UI
     */
    saveEnvironmentVars: function() {
        const envVars = {};
        
        document.querySelectorAll('#env-vars-container .input-group').forEach(row => {
            const keyInput = row.querySelector('.env-key');
            const valueInput = row.querySelector('.env-value');
            
            if (keyInput && valueInput && keyInput.value.trim()) {
                envVars[keyInput.value.trim()] = valueInput.value;
            }
        });
        
        this.currentRequest.envVars = envVars;
        DataToolkit.saveToStorage(
            DataToolkit.STORAGE_KEYS.API_ENVVARS, 
            envVars
        );
        
        DataToolkit.notify('Environment variables saved', 'success');
    },
    
    /**
     * Collect headers from the UI
     * @returns {Object} Headers object
     */
    collectHeaders: function() {
        const headers = {};
        
        document.querySelectorAll('#headers-container .input-group').forEach(row => {
            const keyInput = row.querySelector('.header-key');
            const valueInput = row.querySelector('.header-value');
            
            if (keyInput && valueInput && keyInput.value.trim()) {
                headers[keyInput.value.trim()] = valueInput.value;
            }
        });
        
        return headers;
    },
    
    /**
     * Process the URL and body with environment variables
     * @param {string} text - The text to process
     * @returns {string} The processed text
     */
    processWithEnvVars: function(text) {
        if (!text) return text;
        
        let processed = text;
        const envVars = this.currentRequest.envVars;
        
        // Replace {{variable}} with its value
        processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
            return envVars[varName] !== undefined ? envVars[varName] : match;
        });
        
        return processed;
    },
    
    /**
     * Execute the API request
     */
    executeRequest: function() {
        try {
            // Show loading state
            const executeButton = document.getElementById('execute-request');
            executeButton.disabled = true;
            executeButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Executing...';
            
            // Clear previous response
            this.clearResponse();
            
            // Collect headers
            const headers = this.collectHeaders();
            this.currentRequest.headers = headers;
            
            // Process URL and body with environment variables
            const url = this.processWithEnvVars(this.currentRequest.url);
            let body = this.processWithEnvVars(this.currentRequest.body);
            
            // Validate URL
            if (!url || !url.trim()) {
                throw new Error('URL is required');
            }
            
            // Make the request
            this.makeApiRequest(url, this.currentRequest.method, headers, body)
                .then(response => {
                    // Display response
                    this.displayResponse(response);
                    
                    // Add to history
                    this.addToHistory({
                        method: this.currentRequest.method,
                        url: url,
                        headers: headers,
                        body: body,
                        timestamp: new Date().toISOString(),
                        status: response.status,
                        response: response.data
                    });
                })
                .catch(error => {
                    // Display error
                    this.displayError(error);
                })
                .finally(() => {
                    // Reset button state
                    executeButton.disabled = false;
                    executeButton.innerHTML = '<i class="fas fa-play me-2"></i>Execute Request';
                });
        } catch (error) {
            DataToolkit.notify(error.message, 'error');
            
            // Reset button state
            const executeButton = document.getElementById('execute-request');
            executeButton.disabled = false;
            executeButton.innerHTML = '<i class="fas fa-play me-2"></i>Execute Request';
        }
    },
    
    /**
     * Make the actual API request
     * @param {string} url - The URL to request
     * @param {string} method - The HTTP method
     * @param {Object} headers - The request headers
     * @param {string} body - The request body
     * @returns {Promise} A promise that resolves to the response
     */
    makeApiRequest: async function(url, method, headers, body) {
        const startTime = Date.now();
        
        // Prepare fetch options
        const fetchOptions = {
            method: method,
            headers: headers,
            mode: 'cors',
        };
        
        // Add body for methods that support it
        if (method !== 'GET' && method !== 'DELETE' && body) {
            fetchOptions.body = body;
        }
        
        try {
            // Make the request
            const response = await fetch(url, fetchOptions);
            const endTime = Date.now();
            
            // Get response data as text first
            const responseText = await response.text();
            let responseData;
            
            // Try to parse as JSON if possible
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = responseText;
            }
            
            // Return formatted response
            return {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: responseData,
                time: endTime - startTime
            };
        } catch (error) {
            const endTime = Date.now();
            throw {
                error: error.message,
                time: endTime - startTime
            };
        }
    },
    
    /**
     * Display API response in the UI
     * @param {Object} response - The response object
     */
    displayResponse: function(response) {
        // Update status badges
        const statusBadge = document.getElementById('response-status');
        statusBadge.textContent = `Status: ${response.status} ${response.statusText || ''}`;
        
        // Set badge color based on status code
        statusBadge.className = 'badge';
        if (response.status >= 200 && response.status < 300) {
            statusBadge.classList.add('bg-success');
        } else if (response.status >= 300 && response.status < 400) {
            statusBadge.classList.add('bg-info');
        } else if (response.status >= 400 && response.status < 500) {
            statusBadge.classList.add('bg-warning');
        } else {
            statusBadge.classList.add('bg-danger');
        }
        
        // Update time badge
        document.getElementById('response-time').textContent = `Time: ${response.time}ms`;
        document.getElementById('response-time').classList.remove('bg-secondary');
        document.getElementById('response-time').classList.add('bg-info');
        
        // Display response content
        const responseContainer = document.getElementById('response-container');
        
        // Format response based on type
        if (typeof response.data === 'object') {
            // JSON response
            const formattedJson = JSON.stringify(response.data, null, 2);
            const highlighted = DataToolkit.formatJsonWithSyntaxHighlighting(formattedJson);
            responseContainer.innerHTML = highlighted;
        } else {
            // Text response
            responseContainer.textContent = response.data;
        }
    },
    
    /**
     * Display an error in the response section
     * @param {Object} error - The error object
     */
    displayError: function(error) {
        // Update status badge
        const statusBadge = document.getElementById('response-status');
        statusBadge.textContent = 'Error';
        statusBadge.className = 'badge bg-danger';
        
        // Update time badge if available
        if (error.time) {
            document.getElementById('response-time').textContent = `Time: ${error.time}ms`;
            document.getElementById('response-time').classList.remove('bg-secondary');
            document.getElementById('response-time').classList.add('bg-info');
        }
        
        // Display error message
        const responseContainer = document.getElementById('response-container');
        responseContainer.innerHTML = `<div class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>${error.error || 'Request failed'}</div>`;
        
        // Show notification
        DataToolkit.notify(DataToolkit.UI_MESSAGES.API_REQUEST_ERROR + (error.error || 'Request failed'), 'error');
    },
    
    /**
     * Clear the response section
     */
    clearResponse: function() {
        // Reset status badges
        document.getElementById('response-status').textContent = 'Status: --';
        document.getElementById('response-status').className = 'badge bg-secondary';
        document.getElementById('response-time').textContent = 'Time: --';
        document.getElementById('response-time').className = 'badge bg-secondary';
        
        // Clear response container
        document.getElementById('response-container').textContent = 'No response yet';
    },
    
    /**
     * Copy response to clipboard
     */
    copyResponseToClipboard: function() {
        const responseContainer = document.getElementById('response-container');
        let text = responseContainer.textContent;
        
        // Create a temporary textarea element to copy from
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                DataToolkit.notify('Response copied to clipboard', 'success');
            } else {
                DataToolkit.notify('Failed to copy response', 'error');
            }
        } catch (err) {
            DataToolkit.notify('Failed to copy: ' + err, 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    },
    
    /**
     * Add a request to the history
     * @param {Object} requestData - The request data to add
     */
    addToHistory: function(requestData) {
        // Add to the beginning of the history array
        this.requestHistory.unshift(requestData);
        
        // Limit history size to 50 items
        if (this.requestHistory.length > 50) {
            this.requestHistory.pop();
        }
        
        // Save to localStorage
        DataToolkit.saveToStorage(
            DataToolkit.STORAGE_KEYS.API_HISTORY, 
            this.requestHistory
        );
        
        // Update the history UI
        this.updateHistoryList();
    },
    
    /**
     * Clear the request history
     */
    clearHistory: function() {
        if (confirm('Are you sure you want to clear the request history?')) {
            this.requestHistory = [];
            
            // Save to localStorage
            DataToolkit.saveToStorage(
                DataToolkit.STORAGE_KEYS.API_HISTORY, 
                this.requestHistory
            );
            
            // Update the history UI
            this.updateHistoryList();
            
            DataToolkit.notify('Request history cleared', 'info');
        }
    },
    
    /**
     * Update the history list in the UI
     */
    updateHistoryList: function() {
        const container = document.getElementById('history-container');
        
        if (this.requestHistory.length === 0) {
            container.innerHTML = '<div class="list-group-item text-center text-muted py-3">No history yet</div>';
            return;
        }
        
        container.innerHTML = '';
        
        this.requestHistory.forEach((item, index) => {
            const date = new Date(item.timestamp);
            const timeString = date.toLocaleTimeString();
            const dateString = date.toLocaleDateString();
            
            const itemHtml = `
                <div class="list-group-item history-item" data-index="${index}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge method-${item.method.toLowerCase()}">${item.method}</span>
                            <small class="ms-2">${this.truncateUrl(item.url, 30)}</small>
                        </div>
                        <small class="text-muted">${timeString}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <small class="text-muted">${dateString}</small>
                        <span class="badge ${this.getStatusBadgeClass(item.status)}">Status: ${item.status}</span>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        // Add click handlers to history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                this.loadRequestFromHistory(index);
            });
        });
    },
    
    /**
     * Load a request from history
     * @param {number} index - The index of the history item to load
     */
    loadRequestFromHistory: function(index) {
        const historyItem = this.requestHistory[index];
        if (!historyItem) return;
        
        this.currentRequest.method = historyItem.method;
        this.currentRequest.url = historyItem.url;
        this.currentRequest.headers = historyItem.headers;
        this.currentRequest.body = historyItem.body;
        
        // Update UI
        this.updateMethodSelection();
        this.setupHeaders();
        
        // Save the current request
        this.saveCurrentRequest();
        
        DataToolkit.notify('Request loaded from history', 'success');
    },
    
    /**
     * Get the appropriate badge class for a status code
     * @param {number} status - The HTTP status code
     * @returns {string} The badge class
     */
    getStatusBadgeClass: function(status) {
        if (status >= 200 && status < 300) return 'bg-success';
        if (status >= 300 && status < 400) return 'bg-info';
        if (status >= 400 && status < 500) return 'bg-warning';
        return 'bg-danger';
    },
    
    /**
     * Truncate a URL to a maximum length
     * @param {string} url - The URL to truncate
     * @param {number} maxLength - Maximum length before truncation
     * @returns {string} The truncated URL
     */
    truncateUrl: function(url, maxLength) {
        if (!url) return '';
        if (url.length <= maxLength) return url;
        
        return url.substring(0, maxLength - 3) + '...';
    }
};
