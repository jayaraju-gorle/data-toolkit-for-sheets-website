/**
 * API Tool Module
 * 
 * This module handles the API testing functionality, including
 * making HTTP requests and managing request history.
 */

const ApiTool = {
    /**
     * Public APIs list
     */
    publicApis: [
        {
            name: 'Random User Generator',
            url: 'https://randomuser.me/api/?results=10',
            method: 'GET',
            description: 'Get random user data'
        },
        {
            name: 'JSONPlaceholder Posts',
            url: 'https://jsonplaceholder.typicode.com/posts',
            method: 'GET',
            description: 'Get sample blog posts'
        },
        {
            name: 'JSONPlaceholder Todos',
            url: 'https://jsonplaceholder.typicode.com/todos',
            method: 'GET',
            description: 'Get sample todo items'
        }
    ],

    /**
     * Initialize public APIs dropdown
     */
    initPublicApis: function() {
        const select = document.getElementById('publicApiSelect');
        if (!select) return;

        // Add options for each public API
        this.publicApis.forEach((api, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = api.name;
            select.appendChild(option);
        });

        // Add change event listener
        select.addEventListener('change', () => {
            const selectedIndex = select.value;
            if (selectedIndex === '') {
                document.getElementById('apiDescription').textContent = '';
                return;
            }

            const api = this.publicApis[selectedIndex];
            
            // Update form fields
            document.getElementById('requestMethod').value = api.method;
            document.getElementById('requestUrl').value = api.url;
            document.getElementById('requestHeaders').value = 'Content-Type: application/json';
            document.getElementById('requestBody').value = '';
            document.getElementById('apiDescription').textContent = api.description;

            // If API requires key, show notification
            if (api.url.includes('{{API_KEY}}')) {
                this.showNotification('This API requires an API key. Please replace {{API_KEY}} with your actual API key.', 'warning');
            }
        });
    },

    /**
     * Get the HTML template for the API tool
     */
    getHtml: function() {
        return `
            <div class="row">
                <!-- Left Column: Public APIs and Request Form -->
                <div class="col-md-5">
                    <!-- Public APIs Section -->
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Public APIs</h5>
                            <select class="form-select mb-2" id="publicApiSelect">
                                <option value="">-- Select an API --</option>
                            </select>
                            <small class="text-muted" id="apiDescription"></small>
                        </div>
                    </div>

                    <!-- Request Form Section -->
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="d-flex gap-2 align-items-center flex-grow-1">
                                    <select class="form-select w-auto" id="requestMethod">
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                        <option value="PATCH">PATCH</option>
                                    </select>
                                    <input type="text" class="form-control" id="requestUrl" placeholder="https://api.example.com/endpoint">
                                </div>
                                <button class="btn btn-primary ms-2" id="sendRequest">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>

                            <!-- Collapsible Sections -->
                            <div class="accordion" id="requestAccordion">
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#headersCollapse">
                                            Headers
                                        </button>
                                    </h2>
                                    <div id="headersCollapse" class="accordion-collapse collapse">
                                        <div class="accordion-body">
                                            <textarea class="form-control" id="requestHeaders" rows="3" placeholder="Content-Type: application/json"></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bodyCollapse">
                                            Body
                                        </button>
                                    </h2>
                                    <div id="bodyCollapse" class="accordion-collapse collapse">
                                        <div class="accordion-body">
                                            <textarea class="form-control" id="requestBody" rows="5" placeholder="{}"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="d-flex gap-2 mt-3">
                                <button class="btn btn-sm btn-secondary" id="importCurl">
                                    <i class="fas fa-file-import me-1"></i>Import cURL
                                </button>
                                <button class="btn btn-sm btn-secondary" id="exportCurl">
                                    <i class="fas fa-file-export me-1"></i>Export cURL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Response and Visualizations -->
                <div class="col-md-7">
                    <div class="card">
                        <div class="card-body">
                            <!-- Response Status and Actions -->
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <h5 class="card-title mb-0">Response</h5>
                                    <div class="d-flex align-items-center gap-2">
                                        <span id="responseStatus" class="badge bg-secondary">-</span>
                                        <span id="responseTime" class="text-muted small">0 ms</span>
                                    </div>
                                    <!-- Loading Spinner -->
                                    <div id="loadingSpinner" class="spinner-border spinner-border-sm text-primary d-none" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-outline-secondary" id="copyResponse">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" id="clearResponse">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Response Tabs -->
                            <ul class="nav nav-tabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#rawResponse" type="button">Raw</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#prettyResponse" type="button">Pretty</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#visualResponse" type="button">Visualize</button>
                                </li>
                            </ul>

                            <!-- Response Content -->
                            <div class="tab-content mt-3">
                                <div class="tab-pane fade show active" id="rawResponse">
                                    <pre id="responseBody" class="mb-0"></pre>
                                </div>
                                <div class="tab-pane fade" id="prettyResponse">
                                    <div id="jsonTree"></div>
                                </div>
                                <div class="tab-pane fade" id="visualResponse">
                                    <div id="visualizationContainer"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- History Section -->
                    <div class="card mt-3">
                        <div class="card-body">
                            <h5 class="card-title">History</h5>
                            <div class="list-group" id="requestHistory">
                                <!-- History items will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Initialize the API tool
     */
    init: function() {
        // Get the API tool container
        const apiToolContainer = document.getElementById('api-tool');
        if (!apiToolContainer) return;

        // Load the HTML template
        apiToolContainer.innerHTML = this.getHtml();
        
        // Initialize components
        this.setupEventListeners();
        this.loadHistory();
        this.initPublicApis();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Send Request button
        document.getElementById('sendRequest').addEventListener('click', () => this.sendRequest());
        
        // Import cURL button
        document.getElementById('importCurl').addEventListener('click', () => this.importCurl());
        
        // Export cURL button
        document.getElementById('exportCurl').addEventListener('click', () => this.exportCurl());

        // Copy Response button
        document.getElementById('copyResponse').addEventListener('click', () => this.copyResponse());

        // Clear Response button
        document.getElementById('clearResponse').addEventListener('click', () => this.clearResponse());
    },
    
    /**
     * Send the API request
     */
    sendRequest: async function() {
        const method = document.getElementById('requestMethod').value;
        const url = document.getElementById('requestUrl').value;
        const headers = this.parseHeaders(document.getElementById('requestHeaders').value);
        const body = document.getElementById('requestBody').value;
        
        // Show loading spinner
        this.toggleLoading(true);
        
        // Debug info
        console.log('Request details:', {
            method,
            url,
            headers,
            body: method !== 'GET' ? body : undefined
        });
        
        try {
            const startTime = performance.now();
            
            // First try a preflight request to check CORS
            try {
                console.log('Attempting preflight request to:', url);
                const preflightResponse = await fetch(url, {
                    method: 'OPTIONS',
                    headers: {
                        'Access-Control-Request-Method': method,
                        'Access-Control-Request-Headers': Object.keys(headers).join(',')
                    }
                });
                console.log('Preflight response:', preflightResponse);
            } catch (preflightError) {
                console.warn('Preflight request failed:', preflightError);
                // Continue with main request even if preflight fails
            }
            
            // Main request
            console.log('Sending main request...');
            const response = await fetch(url, {
                method,
                headers,
                body: method !== 'GET' ? body : undefined,
                mode: 'cors',
                credentials: 'omit' // Explicitly omit credentials
            });
            
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries([...response.headers.entries()]),
                time: responseTime
            });
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            
            // Get the content type
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            let responseData;
            
            // Handle different content types
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Raw JSON response:', text);
                responseData = text;
            } else if (contentType && contentType.includes('image')) {
                console.log('Processing image response...');
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                responseData = JSON.stringify({
                    message: 'Image received',
                    url: imageUrl,
                    preview: `<img src="${imageUrl}" alt="API Image" style="max-width: 100%; height: auto; margin-top: 10px;">`
                });
                console.log('Image processed:', imageUrl);
            } else {
                const text = await response.text();
                console.log('Raw text response:', text);
                responseData = text;
            }
            
            const formattedResponse = this.formatResponse(responseData);
            
            // Update response display
            document.getElementById('responseStatus').textContent = response.status;
            document.getElementById('responseStatus').className = `badge ${this.getStatusBadgeClass(response.status)}`;
            document.getElementById('responseTime').textContent = `${responseTime} ms`;
            document.getElementById('responseBody').textContent = formattedResponse;
            
            // Update visualizations
            this.visualizeResponse(responseData);
            
            // Add to history
            this.addToHistory({
                method,
                url,
                headers,
                body,
                response: {
                    status: response.status,
                    time: responseTime,
                    data: responseData
                }
            });
            
        } catch (error) {
            console.error('Request failed:', {
                error,
                message: error.message,
                stack: error.stack,
                type: error.name
            });
            
            // Create a detailed error message
            let errorMessage = `Request failed: ${error.message}\n`;
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                errorMessage += '\nPossible causes:\n';
                errorMessage += '- CORS policy blocking the request\n';
                errorMessage += '- Network connectivity issues\n';
                errorMessage += '- Server is unreachable\n';
                errorMessage += '\nTry checking the browser console for more details.';
            }
            
            this.showError(errorMessage);
            
            // Update response display for error state
            document.getElementById('responseStatus').textContent = 'ERROR';
            document.getElementById('responseStatus').className = 'badge bg-danger';
            document.getElementById('responseTime').textContent = '0 ms';
            document.getElementById('responseBody').textContent = errorMessage;
        } finally {
            // Hide loading spinner
            this.toggleLoading(false);
        }
    },
    
    /**
     * Toggle loading spinner
     */
    toggleLoading: function(show) {
        const spinner = document.getElementById('loadingSpinner');
        const sendButton = document.getElementById('sendRequest');
        
        if (show) {
            spinner.classList.remove('d-none');
            sendButton.disabled = true;
        } else {
            spinner.classList.add('d-none');
            sendButton.disabled = false;
        }
    },

    /**
     * Copy response to clipboard
     */
    copyResponse: function() {
        const responseBody = document.getElementById('responseBody').textContent;
        if (!responseBody) {
            this.showNotification('No response to copy', 'warning');
            return;
        }

        navigator.clipboard.writeText(responseBody).then(() => {
            this.showNotification('Response copied to clipboard');
        }).catch(() => {
            this.showError('Failed to copy response');
        });
    },

    /**
     * Clear response
     */
    clearResponse: function() {
        // Clear response display
        document.getElementById('responseStatus').textContent = '-';
        document.getElementById('responseStatus').className = 'badge bg-secondary';
        document.getElementById('responseTime').textContent = '0 ms';
        document.getElementById('responseBody').textContent = '';
        
        // Clear visualizations
        document.getElementById('visualizationContainer').innerHTML = '';
        document.getElementById('jsonTree').innerHTML = '';
        
        this.showNotification('Response cleared');
    },
    
    /**
     * Parse headers string into object
     */
    parseHeaders: function(headersStr) {
        const headers = {};
        headersStr.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                headers[key] = value;
            }
        });
        return headers;
    },
    
    /**
     * Format response for display
     */
    formatResponse: function(response) {
        try {
            const parsed = JSON.parse(response);
            
            // Special handling for Dog API responses with image URLs
            if (parsed.message && typeof parsed.message === 'string' && parsed.message.startsWith('https://')) {
                // Create a clickable link for the image
                const imageUrl = parsed.message;
                return JSON.stringify({
                    ...parsed,
                    message: imageUrl,
                    preview: `<img src="${imageUrl}" alt="Dog" style="max-width: 100%; height: auto; margin-top: 10px;">`
                }, null, 2);
            }
            
            return JSON.stringify(parsed, null, 2);
        } catch {
            return response;
        }
    },
    
    /**
     * Get badge class for status code
     */
    getStatusBadgeClass: function(status) {
        if (status >= 500) return 'bg-danger';
        if (status >= 400) return 'bg-warning';
        if (status >= 300) return 'bg-info';
        return 'bg-success';
    },
    
    /**
     * Add request to history
     */
    addToHistory: function(request) {
        const history = this.getHistory();
        history.unshift(request);
        if (history.length > 10) history.pop();
        localStorage.setItem('apiToolHistory', JSON.stringify(history));
        this.renderHistory();
    },
    
    /**
     * Load history from localStorage
     */
    loadHistory: function() {
        this.renderHistory();
    },
    
    /**
     * Get history from localStorage
     */
    getHistory: function() {
        const history = localStorage.getItem('apiToolHistory');
        return history ? JSON.parse(history) : [];
    },
    
    /**
     * Render history items
     */
    renderHistory: function() {
        const historyContainer = document.getElementById('requestHistory');
        const history = this.getHistory();
        
        historyContainer.innerHTML = history.map((item, index) => `
            <div class="list-group-item history-item" data-index="${index}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge ${this.getMethodBadgeClass(item.method)} me-2">${item.method}</span>
                        <span>${item.url}</span>
                    </div>
                    <small class="text-muted">${new Date().toLocaleString()}</small>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        historyContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => this.loadHistoryItem(parseInt(item.dataset.index)));
        });
    },
    
    /**
     * Get badge class for HTTP method
     */
    getMethodBadgeClass: function(method) {
        const classes = {
            GET: 'bg-success',
            POST: 'bg-primary',
            PUT: 'bg-warning',
            DELETE: 'bg-danger',
            PATCH: 'bg-info'
        };
        return classes[method] || 'bg-secondary';
    },
    
    /**
     * Load history item into form
     */
    loadHistoryItem: function(index) {
        const history = this.getHistory();
        const item = history[index];
        
        document.getElementById('requestMethod').value = item.method;
        document.getElementById('requestUrl').value = item.url;
        document.getElementById('requestHeaders').value = Object.entries(item.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        document.getElementById('requestBody').value = item.body;
        
        // Update response display
        document.getElementById('responseStatus').textContent = item.response.status;
        document.getElementById('responseStatus').className = `badge ${this.getStatusBadgeClass(item.response.status)}`;
        document.getElementById('responseTime').textContent = `${item.response.time || 0} ms`;
        document.getElementById('responseBody').textContent = this.formatResponse(item.response.data);
        
        // Update visualizations
        this.visualizeResponse(item.response.data);
    },
    
    /**
     * Import cURL command
     */
    importCurl: function() {
        const curl = prompt('Paste your cURL command here:');
        if (!curl) return;
        
        try {
            const parsed = this.parseCurl(curl);
            document.getElementById('requestMethod').value = parsed.method;
            document.getElementById('requestUrl').value = parsed.url;
            document.getElementById('requestHeaders').value = Object.entries(parsed.headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            document.getElementById('requestBody').value = parsed.body;
        } catch (error) {
            this.showError('Invalid cURL command');
        }
    },
    
    /**
     * Export current request as cURL
     */
    exportCurl: function() {
        const method = document.getElementById('requestMethod').value;
        const url = document.getElementById('requestUrl').value;
        const headers = this.parseHeaders(document.getElementById('requestHeaders').value);
        const body = document.getElementById('requestBody').value;
        
        let curl = `curl -X ${method} "${url}"`;
        
        // Add headers
        Object.entries(headers).forEach(([key, value]) => {
            curl += ` \\\n  -H "${key}: ${value}"`;
        });
        
        // Add body if present
        if (body) {
            curl += ` \\\n  -d '${body}'`;
        }
        
        // Copy to clipboard
        navigator.clipboard.writeText(curl).then(() => {
            this.showNotification('cURL command copied to clipboard');
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    },
    
    /**
     * Parse cURL command
     */
    parseCurl: function(curl) {
        const result = {
            method: 'GET',
            url: '',
            headers: {},
            body: ''
        };

        try {
            // Remove 'curl' from the beginning if present
            curl = curl.trim().replace(/^curl\s+/, '');

            // Extract URL (handle both quoted and unquoted)
            const urlMatch = curl.match(/(?:"|'|)((https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?)/i);
            if (urlMatch) {
                result.url = urlMatch[1];
                // Remove the URL from the curl string to make further parsing easier
                curl = curl.replace(urlMatch[0], '');
            } else {
                throw new Error('No valid URL found in cURL command');
            }

            // Extract method
            const methodMatch = curl.match(/-X\s*(['"]?)(\w+)\1/i);
            if (methodMatch) {
                result.method = methodMatch[2].toUpperCase();
            }

            // Extract headers
            const headerMatches = curl.matchAll(/-H\s*(['"])(.*?)\1/g);
            for (const match of headerMatches) {
                const headerLine = match[2];
                const [key, ...valueParts] = headerLine.split(':');
                if (key && valueParts.length) {
                    result.headers[key.trim()] = valueParts.join(':').trim();
                }
            }

            // Extract data/body (handle multiple formats)
            // --data, -d, --data-raw, --data-binary
            const dataFlags = ['--data', '-d', '--data-raw', '--data-binary'];
            for (const flag of dataFlags) {
                const dataMatch = curl.match(new RegExp(`${flag}\\s*(['"])(.*?)\\1`));
                if (dataMatch) {
                    result.body = dataMatch[2];
                    break;
                }
            }

            // Handle data without quotes
            if (!result.body) {
                const dataMatch = curl.match(/-d\s+(\S+)/);
                if (dataMatch) {
                    result.body = dataMatch[1];
                }
            }

            // Try to parse JSON body if it looks like JSON
            if (result.body) {
                try {
                    // If body is URL encoded, decode it
                    if (result.body.includes('=') && result.body.includes('&')) {
                        result.body = this.parseUrlEncodedBody(result.body);
                    }
                    // If body looks like JSON, format it
                    else if ((result.body.startsWith('{') && result.body.endsWith('}')) || 
                            (result.body.startsWith('[') && result.body.endsWith(']'))) {
                        const parsed = JSON.parse(result.body);
                        result.body = JSON.stringify(parsed, null, 2);
                    }
                } catch (e) {
                    // If parsing fails, keep the original body
                }
            }

            return result;
        } catch (error) {
            throw new Error(`Failed to parse cURL command: ${error.message}`);
        }
    },

    /**
     * Parse URL encoded body into formatted JSON
     */
    parseUrlEncodedBody: function(body) {
        const params = {};
        body.split('&').forEach(param => {
            const [key, value] = param.split('=').map(decodeURIComponent);
            if (key) {
                params[key] = value || '';
            }
        });
        return JSON.stringify(params, null, 2);
    },
    
    /**
     * Show error message
     */
    showError: function(message) {
        this.showNotification(message, 'danger');
    },
    
    /**
     * Show notification
     */
    showNotification: function(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Trigger reflow
        notification.offsetHeight;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    /**
     * Format and visualize response data
     */
    visualizeResponse: function(data) {
        try {
            const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
            const visualContainer = document.getElementById('visualizationContainer');
            const prettyContainer = document.getElementById('jsonTree');
            
            // Clear previous visualizations
            visualContainer.innerHTML = '';
            prettyContainer.innerHTML = '';

            // Create pretty view using JSON tree
            this.createJsonTree(jsonData, prettyContainer);

            // Create appropriate visualization based on data type
            if (Array.isArray(jsonData)) {
                if (jsonData.length > 0) {
                    if (typeof jsonData[0] === 'object') {
                        // Create a table for array of objects
                        this.createDataTable(jsonData, visualContainer);
                    } else {
                        // Create a list for array of primitives
                        this.createList(jsonData, visualContainer);
                    }
                }
            } else if (typeof jsonData === 'object') {
                // Create key-value pairs for object
                this.createKeyValuePairs(jsonData, visualContainer);
            }

        } catch (error) {
            console.error('Visualization error:', error);
        }
    },

    /**
     * Create an interactive JSON tree view
     */
    createJsonTree: function(data, container) {
        const createNode = (key, value) => {
            const node = document.createElement('div');
            node.className = 'json-tree-node';
            
            if (typeof value === 'object' && value !== null) {
                const isArray = Array.isArray(value);
                const toggle = document.createElement('span');
                toggle.className = 'json-tree-toggle';
                toggle.textContent = '▶';
                toggle.onclick = () => {
                    toggle.textContent = toggle.textContent === '▶' ? '▼' : '▶';
                    childContainer.style.display = childContainer.style.display === 'none' ? 'block' : 'none';
                };
                
                const keySpan = document.createElement('span');
                keySpan.className = 'json-key';
                keySpan.textContent = key ? `${key}: ` : '';
                
                const typeSpan = document.createElement('span');
                typeSpan.className = 'json-type';
                typeSpan.textContent = isArray ? '[]' : '{}';
                
                const childContainer = document.createElement('div');
                childContainer.className = 'json-tree-children';
                childContainer.style.display = 'none';
                
                node.appendChild(toggle);
                node.appendChild(keySpan);
                node.appendChild(typeSpan);
                node.appendChild(childContainer);
                
                const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
                entries.forEach(([k, v]) => {
                    childContainer.appendChild(createNode(k, v));
                });
            } else {
                const keySpan = document.createElement('span');
                keySpan.className = 'json-key';
                keySpan.textContent = key ? `${key}: ` : '';
                
                const valueSpan = document.createElement('span');
                valueSpan.className = `json-${typeof value}`;
                valueSpan.textContent = value === null ? 'null' : value;
                
                node.appendChild(keySpan);
                node.appendChild(valueSpan);
            }
            
            return node;
        };
        
        container.appendChild(createNode('', data));
    },

    /**
     * Create a data table for array of objects
     */
    createDataTable: function(data, container) {
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Create headers
        const headers = new Set();
        data.forEach(item => Object.keys(item).forEach(key => headers.add(key)));
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = item[header] || '';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
    },

    /**
     * Create a list for array of primitives
     */
    createList: function(data, container) {
        const list = document.createElement('ul');
        list.className = 'list-group';
        
        data.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = item;
            list.appendChild(li);
        });
        
        container.appendChild(list);
    },

    /**
     * Create key-value pairs display
     */
    createKeyValuePairs: function(data, container) {
        const dl = document.createElement('dl');
        dl.className = 'row';
        
        Object.entries(data).forEach(([key, value]) => {
            const dt = document.createElement('dt');
            dt.className = 'col-sm-3';
            dt.textContent = key;
            
            const dd = document.createElement('dd');
            dd.className = 'col-sm-9';
            
            // Special handling for image previews
            if (key === 'preview' && typeof value === 'string' && value.startsWith('<img')) {
                dd.innerHTML = value; // Safely insert the image tag
            } else {
                dd.textContent = typeof value === 'object' ? JSON.stringify(value) : value;
            }
            
            dl.appendChild(dt);
            dl.appendChild(dd);
        });
        
        container.appendChild(dl);
    }
};
