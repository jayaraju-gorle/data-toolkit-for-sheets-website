/**
 * API Tool Module
 *
 * This module handles the API testing functionality, including
 * making HTTP requests and managing request history.
 */

const ApiTool = {
  /**
   * Initialize the API tool
   */
  init: function() {
    // Call other initialization methods if needed
    this.initPublicApis();
    this.setupEventListeners(); // Ensure event listeners are set up
    this.loadHistory(); // Load history on init
  },

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

    // Clear existing options first
    select.innerHTML = '<option value="">-- Select an API --</option>';

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
      const descriptionEl = document.getElementById('apiDescription');
      const methodEl = document.getElementById('requestMethod');
      const urlEl = document.getElementById('requestUrl');
      const headersEl = document.getElementById('requestHeaders');
      const bodyEl = document.getElementById('requestBody');

      if (selectedIndex === '') {
        if(descriptionEl) descriptionEl.textContent = '';
        if(methodEl) methodEl.value = 'GET';
        if(urlEl) urlEl.value = '';
        if(headersEl) headersEl.value = '';
        if(bodyEl) bodyEl.value = '';
        return;
      }

      const api = this.publicApis[selectedIndex];
      
      // Update form fields
      if(methodEl) methodEl.value = api.method;
      if(urlEl) urlEl.value = api.url;
      if(headersEl) headersEl.value = 'Content-Type: application/json';
      if(bodyEl) bodyEl.value = '';
      if(descriptionEl) descriptionEl.textContent = api.description;

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
    // This function should return the HTML structure for the API tool section
    // It was present in the original file content provided earlier.
    // Restoring it here:
    return `
      <div class="row">
        <!-- Left Column: Request Form -->
        <div class="col-md-5">
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
              <div class="mb-3">
                <select class="form-select" id="publicApiSelect">
                  <option value="">-- Select an API --</option>
                </select>
                <div id="apiDescription" class="form-text"></div>
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
                  <i class="fas fa-file-import me-1"></i> Import cURL
                </button>
                <button class="btn btn-sm btn-secondary" id="exportCurl">
                  <i class="fas fa-file-export me-1"></i> Export cURL
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
                   <button class="btn btn-sm btn-outline-primary" id="exportCsv" title="Export as CSV">
                     <i class="fas fa-file-csv"></i>
                   </button>
                   <!-- Hiding Export to Sheets Button -->
                   <!-- <button class="btn btn-sm btn-outline-success" id="exportSheets" title="Export to Google Sheets">
                     <i class="fas fa-table"></i>
                   </button> -->
                   <button class="btn btn-sm btn-outline-secondary" id="copyResponse" title="Copy Response">
                     <i class="fas fa-copy"></i>
                   </button>
                   <button class="btn btn-sm btn-outline-danger" id="clearResponse" title="Clear Response">
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
   * Set up event listeners
   */
  setupEventListeners: function() {
    const sendButton = document.getElementById('sendRequest');
    const importCurlButton = document.getElementById('importCurl');
    const exportCurlButton = document.getElementById('exportCurl');
    const copyResponseButton = document.getElementById('copyResponse');
    const clearResponseButton = document.getElementById('clearResponse');
    const exportCsvButton = document.getElementById('exportCsv');
    // const exportSheetsButton = document.getElementById('exportSheets'); // Removed

    if (sendButton) sendButton.addEventListener('click', () => this.sendRequest());
    if (importCurlButton) importCurlButton.addEventListener('click', () => this.importCurl());
    if (exportCurlButton) exportCurlButton.addEventListener('click', () => this.exportCurl());
    if (copyResponseButton) copyResponseButton.addEventListener('click', () => this.copyResponse());
    if (clearResponseButton) clearResponseButton.addEventListener('click', () => this.clearResponse());
    
    // Add listeners for new export buttons
    if (exportCsvButton) exportCsvButton.addEventListener('click', () => {
        const responseBody = document.getElementById('responseBody')?.textContent;
        if (responseBody) {
            try {
                const data = JSON.parse(responseBody);
                this.exportToCsv(data);
            } catch (e) {
                this.showNotification('Response is not valid JSON for CSV export.', 'error');
            }
        } else {
            this.showNotification('No response data to export.', 'warning');
        }
    });
    // if (exportSheetsButton) exportSheetsButton.addEventListener('click', () => { // Removed
    //     const responseBody = document.getElementById('responseBody')?.textContent;
    //      if (responseBody) {
    //         try {
    //             const data = JSON.parse(responseBody);
    //              this.exportToGoogleSheets(data);
    //         } catch (e) {
    //             this.showNotification('Response is not valid JSON for Sheets export.', 'error');
    //         }
    //     } else {
    //         this.showNotification('No response data to export.', 'warning');
    //     }
    // });

    // Listener for history items (needs to be delegated as items are dynamic)
    const historyContainer = document.getElementById('requestHistory');
    if (historyContainer) {
        historyContainer.addEventListener('click', (event) => {
            const historyItem = event.target.closest('.history-item');
            if (historyItem && historyItem.dataset.index) {
                this.loadHistoryItem(parseInt(historyItem.dataset.index));
            }
        });
    }
  },

  /**
   * Send the API request
   */
  sendRequest: async function() {
    const method = document.getElementById('requestMethod').value;
    const url = document.getElementById('requestUrl').value;
    const headersStr = document.getElementById('requestHeaders').value;
    const body = document.getElementById('requestBody').value;
    
    const headers = this.parseHeaders(headersStr);

    this.toggleLoading(true);
    this.clearResponseDisplay(); // Clear previous response before sending new one

    try {
      const startTime = performance.now();
      
      // Preflight request (optional, for CORS debugging)
      try {
        await fetch(url, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': Object.keys(headers).join(',') } });
      } catch (preflightError) {
        console.warn('Preflight request failed (this might be expected):', preflightError);
      }

      // Main request
      const response = await fetch(url, {
        method,
        headers,
        body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
        mode: 'cors', 
        credentials: 'omit' 
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const contentType = response.headers.get('content-type');
      let responseDataText;

      if (contentType && contentType.includes('application/json')) {
        responseDataText = await response.text(); // Get raw text first
      } else if (contentType && contentType.includes('image')) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        responseDataText = JSON.stringify({ 
            message: 'Image received', 
            url: imageUrl, 
            preview: `<img src="${imageUrl}" alt="API Image" style="max-width: 100%; height: auto; margin-top: 10px;">` 
        });
      } else {
        responseDataText = await response.text();
      }

      this.updateResponseDisplay(response.status, responseTime, responseDataText);
      this.visualizeResponse(responseDataText); // Visualize after display update

      // Add to history
      this.addToHistory({
        method,
        url,
        headers,
        body,
        response: {
          status: response.status,
          time: responseTime,
          data: responseDataText // Store raw text data
        }
      });

    } catch (error) {
      console.error('Request failed:', error);
      let errorMessage = `Request failed: ${error.message}\n`;
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage += '\nPossible causes:\n- CORS policy blocking the request\n- Network connectivity issues\n- Server is unreachable\n\nTry checking the browser console for more details.';
      }
      this.updateResponseDisplay('ERROR', 0, errorMessage, true);
    } finally {
      this.toggleLoading(false);
    }
  },

  /**
   * Toggle loading spinner and disable send button
   */
  toggleLoading: function(show) {
    const spinner = document.getElementById('loadingSpinner');
    const sendButton = document.getElementById('sendRequest');
    
    if (spinner) spinner.classList.toggle('d-none', !show);
    if (sendButton) sendButton.disabled = show;
  },

  /**
   * Clear the response display areas
   */
   clearResponseDisplay: function() {
        const statusEl = document.getElementById('responseStatus');
        const timeEl = document.getElementById('responseTime');
        const bodyEl = document.getElementById('responseBody');
        const prettyEl = document.getElementById('jsonTree');
        const visualEl = document.getElementById('visualizationContainer');

        if (statusEl) {
            statusEl.textContent = '-';
            statusEl.className = 'badge bg-secondary';
        }
        if (timeEl) timeEl.textContent = '0 ms';
        if (bodyEl) bodyEl.textContent = '';
        if (prettyEl) prettyEl.innerHTML = '';
        if (visualEl) visualEl.innerHTML = '';
   },

  /**
   * Update the response display area
   */
  updateResponseDisplay: function(status, time, dataText, isError = false) {
      const statusEl = document.getElementById('responseStatus');
      const timeEl = document.getElementById('responseTime');
      const bodyEl = document.getElementById('responseBody');

      if (statusEl) {
          statusEl.textContent = status;
          statusEl.className = `badge ${isError ? 'bg-danger' : this.getStatusBadgeClass(status)}`;
      }
      if (timeEl) timeEl.textContent = `${time} ms`;
      if (bodyEl) {
          // Display raw text or formatted JSON in the 'Raw' tab
          bodyEl.textContent = isError ? dataText : this.formatResponse(dataText);
      }
  },

  /**
   * Copy response to clipboard
   */
  copyResponse: function() {
    const responseBody = document.getElementById('responseBody')?.textContent;
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
   * Clear response display and visualization
   */
  clearResponse: function() {
    this.clearResponseDisplay();
    this.showNotification('Response cleared');
  },

  /**
   * Parse headers string into object
   */
  parseHeaders: function(headersStr) {
    const headers = {};
    if (!headersStr) return headers;
    headersStr.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key) {
          headers[key] = value;
        }
      }
    });
    return headers;
  },

  /**
   * Format response for display (Pretty print JSON)
   */
  formatResponse: function(response) {
    try {
      const parsed = JSON.parse(response);
      // Special handling for image previews generated earlier
      if (parsed && parsed.preview && typeof parsed.preview === 'string' && parsed.preview.startsWith('<img')) {
         // Keep the preview structure for visualization, but format the rest
         const { preview, ...rest } = parsed;
         return JSON.stringify(rest, null, 2); 
      }
      return JSON.stringify(parsed, null, 2); // Pretty print
    } catch {
      return response; // Return as is if not JSON
    }
  },

  /**
   * Get badge class for status code
   */
  getStatusBadgeClass: function(status) {
    if (status >= 500) return 'bg-danger';
    if (status >= 400) return 'bg-warning';
    if (status >= 300) return 'bg-info';
    if (status >= 200) return 'bg-success';
    return 'bg-secondary';
  },

  /**
   * Add request to history
   */
  addToHistory: function(request) {
    const history = this.getHistory();
    history.unshift(request);
    if (history.length > 10) history.pop(); // Limit history size
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
    if (!historyContainer) return;
    const history = this.getHistory();
    
    historyContainer.innerHTML = history.map((item, index) => `
      <div class="list-group-item history-item" data-index="${index}">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="badge ${this.getMethodBadgeClass(item.method)} me-2">${item.method}</span>
            <span class="history-url">${item.url.length > 50 ? item.url.substring(0, 50) + '...' : item.url}</span>
          </div>
          <small class="text-muted">${item.response?.time || 0} ms</small> 
        </div>
      </div>
    `).join('');
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
   * Load history item into form and response display
   */
  loadHistoryItem: function(index) {
    const history = this.getHistory();
    const item = history[index];
    if (!item) return;

    document.getElementById('requestMethod').value = item.method;
    document.getElementById('requestUrl').value = item.url;
    document.getElementById('requestHeaders').value = Object.entries(item.headers || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    document.getElementById('requestBody').value = item.body || '';

    // Update response display
    if (item.response) {
        this.updateResponseDisplay(item.response.status, item.response.time, item.response.data);
        this.visualizeResponse(item.response.data);
    } else {
        this.clearResponseDisplay();
    }
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
      this.showNotification('cURL command imported successfully.');
    } catch (error) {
      this.showError(`Invalid cURL command: ${error.message}`);
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

    Object.entries(headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });

    if (body && method !== 'GET' && method !== 'HEAD') {
      // Escape single quotes in the body for the -d argument
      const escapedBody = body.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${escapedBody}'`;
    }

    navigator.clipboard.writeText(curl).then(() => {
      this.showNotification('cURL command copied to clipboard');
    }).catch(() => {
      this.showError('Failed to copy cURL command to clipboard');
    });
  },

  /**
   * Parse cURL command (basic implementation)
   */
  parseCurl: function(curl) {
    const result = {
      method: 'GET',
      url: '',
      headers: {},
      body: ''
    };

    // Remove 'curl ' prefix and line breaks
    curl = curl.trim().replace(/^curl\s+/, '').replace(/\\\n\s*/g, ' ');

    // Extract URL (first non-option argument, potentially quoted)
    const urlMatch = curl.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
    if (urlMatch) {
        for (const part of urlMatch) {
            if (!part.startsWith('-')) {
                result.url = part.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
                // Remove the URL part from the string for easier parsing of options
                curl = curl.replace(part, '').trim();
                break;
            }
        }
    }
     if (!result.url) {
        throw new Error('Could not parse URL.');
    }


    // Extract method (-X or --request)
    const methodMatch = curl.match(/(?:-X|--request)\s+([^\s]+)/);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
    }

    // Extract headers (-H or --header)
    const headerMatches = curl.matchAll(/(?:-H|--header)\s+(['"])(.*?)\1/g);
    for (const match of headerMatches) {
      const headerLine = match[2];
      const [key, ...valueParts] = headerLine.split(':');
      if (key && valueParts.length) {
        result.headers[key.trim()] = valueParts.join(':').trim();
      }
    }

    // Extract data (-d or --data or --data-raw)
    const dataMatch = curl.match(/(?:-d|--data|--data-raw)\s+(['"])(.*?)\1/);
     if (dataMatch) {
        result.body = dataMatch[2];
        // If method wasn't explicitly set and data is present, default to POST
        if (!methodMatch && result.method === 'GET') {
            result.method = 'POST';
        }
    }


    return result;
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
    if (!container) {
        console.log(`Notification (${type}): ${message}`); // Fallback to console
        return;
    }
    const notification = document.createElement('div');
    // Use Bootstrap alert classes
    notification.className = `alert alert-${type} alert-dismissible fade show notification`; 
    notification.setAttribute('role', 'alert');
    notification.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    notification.appendChild(closeButton);
    
    container.appendChild(notification);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      // Use Bootstrap's alert('close') method if available, otherwise remove directly
      const bsAlert = bootstrap?.Alert?.getInstance(notification);
      if (bsAlert) {
        bsAlert.close();
      } else {
         notification.classList.remove('show');
         // Allow fade out animation before removing
         setTimeout(() => notification.remove(), 300);
      }
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
      if (visualContainer) visualContainer.innerHTML = '';
      if (prettyContainer) prettyContainer.innerHTML = '';

      // Create pretty view using JSON tree
      if (prettyContainer) this.createJsonTree(jsonData, prettyContainer);

      // Create appropriate visualization based on data type
      if (visualContainer) {
          if (jsonData && jsonData.preview && typeof jsonData.preview === 'string' && jsonData.preview.startsWith('<img')) {
             // Handle image preview specifically
             visualContainer.innerHTML = jsonData.preview;
          } else if (Array.isArray(jsonData)) {
            if (jsonData.length > 0) {
              if (typeof jsonData[0] === 'object' && jsonData[0] !== null) {
                this.createDataTable(jsonData, visualContainer);
              } else {
                this.createList(jsonData, visualContainer);
              }
            } else {
                 visualContainer.textContent = 'Empty array';
            }
          } else if (typeof jsonData === 'object' && jsonData !== null) {
            this.createKeyValuePairs(jsonData, visualContainer);
          } else {
             // Handle primitive types or null
             visualContainer.textContent = String(jsonData);
          }
      }

    } catch (error) {
      console.error('Visualization error:', error);
       const visualContainer = document.getElementById('visualizationContainer');
       if (visualContainer) visualContainer.textContent = 'Could not visualize response. Invalid JSON or unsupported format.';
       const prettyContainer = document.getElementById('jsonTree');
       if (prettyContainer) prettyContainer.textContent = 'Invalid JSON.';
    }
  },

  /**
   * Create an interactive JSON tree view
   */
  createJsonTree: function(data, container) {
    // Basic implementation - consider a library for full features
    const createNode = (key, value, depth = 0) => {
      const node = document.createElement('div');
      node.style.marginLeft = `${depth * 15}px`;

      const keySpan = document.createElement('span');
      keySpan.style.color = '#a52a2a'; // Dark red for keys
      keySpan.style.fontWeight = 'bold';
      keySpan.textContent = key ? `"${key}": ` : '';

      let valueSpan;
      if (typeof value === 'object' && value !== null) {
        valueSpan = document.createElement('span');
        const isArray = Array.isArray(value);
        const bracket = isArray ? '[' : '{';
        valueSpan.textContent = bracket;
        
        const toggle = document.createElement('span');
        toggle.textContent = ' ▶ ';
        toggle.style.cursor = 'pointer';
        toggle.style.color = '#999';
        
        const childContainer = document.createElement('div');
        childContainer.style.display = 'none'; // Collapsed by default

        toggle.onclick = (e) => {
            e.stopPropagation(); // Prevent parent toggles
            const isCollapsed = childContainer.style.display === 'none';
            childContainer.style.display = isCollapsed ? 'block' : 'none';
            toggle.textContent = isCollapsed ? ' ▼ ' : ' ▶ ';
        };

        node.appendChild(toggle);
        node.appendChild(keySpan);
        node.appendChild(valueSpan);
        node.appendChild(childContainer);

        Object.entries(value).forEach(([k, v]) => {
          childContainer.appendChild(createNode(k, v, depth + 1));
        });

        const closingBracket = document.createElement('div');
        closingBracket.style.marginLeft = `${depth * 15}px`;
        closingBracket.textContent = isArray ? ']' : '}';
        node.appendChild(closingBracket); // Append closing bracket after children

      } else {
        valueSpan = document.createElement('span');
        if (typeof value === 'string') {
          valueSpan.style.color = '#008000'; // Green for strings
          valueSpan.textContent = `"${value}"`;
        } else if (typeof value === 'number') {
          valueSpan.style.color = '#0000ff'; // Blue for numbers
          valueSpan.textContent = value;
        } else if (typeof value === 'boolean') {
          valueSpan.style.color = '#ff8c00'; // Orange for booleans
          valueSpan.textContent = value;
        } else if (value === null) {
          valueSpan.style.color = '#808080'; // Gray for null
          valueSpan.textContent = 'null';
        }
        node.appendChild(keySpan);
        node.appendChild(valueSpan);
      }
      
      return node;
    };

    container.innerHTML = ''; // Clear previous tree
    container.appendChild(createNode('', data)); // Start tree creation
  },

  /**
   * Create a data table for array of objects
   */
  createDataTable: function(data, container) {
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
        container.textContent = 'Data is not an array of objects.';
        return;
    }
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover table-sm'; // Use Bootstrap table classes

    // Create headers
    const headers = Array.from(new Set(data.flatMap(item => Object.keys(item)))); // Get all unique keys
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
        const value = item[header];
        // Handle objects/arrays within cells - display as JSON string
        if (typeof value === 'object' && value !== null) {
            td.textContent = JSON.stringify(value);
        } else {
            td.textContent = value !== undefined && value !== null ? String(value) : '';
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = ''; // Clear previous content
    container.appendChild(table);
  },

  /**
   * Create a list for array of primitives
   */
  createList: function(data, container) {
     if (!Array.isArray(data)) {
        container.textContent = 'Data is not an array.';
        return;
    }
    const list = document.createElement('ul');
    list.className = 'list-group'; // Use Bootstrap list group

    data.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.textContent = String(item);
      list.appendChild(li);
    });

    container.innerHTML = ''; // Clear previous content
    container.appendChild(list);
  },

  /**
   * Create key-value pairs display
   */
  createKeyValuePairs: function(data, container) {
     if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        container.textContent = 'Data is not a simple object.';
        return;
    }
    const dl = document.createElement('dl');
    dl.className = 'row'; // Use Bootstrap row for layout

    Object.entries(data).forEach(([key, value]) => {
      const dt = document.createElement('dt');
      dt.className = 'col-sm-3';
      dt.textContent = key;

      const dd = document.createElement('dd');
      dd.className = 'col-sm-9';

      // Handle image preview specifically if present
      if (key === 'preview' && typeof value === 'string' && value.startsWith('<img')) {
        dd.innerHTML = value; // Safely insert the image tag
      } else if (typeof value === 'object' && value !== null) {
        dd.textContent = JSON.stringify(value); // Display nested objects/arrays as JSON
      } else {
        dd.textContent = String(value);
      }

      dl.appendChild(dt);
      dl.appendChild(dd);
    });

    container.innerHTML = ''; // Clear previous content
    container.appendChild(dl);
  },

  /**
   * Export API response data as CSV file
   */
  exportToCsv: function(data, filename = 'data.csv') {
    let dataToExport = data;
    // If data is an object with a primary array (e.g., randomuser.me results)
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        const arrayKey = keys.find(k => Array.isArray(data[k]));
        if (arrayKey) {
            dataToExport = data[arrayKey];
        } else {
             // Handle single object export
             dataToExport = [data];
        }
    }

    if (!Array.isArray(dataToExport) || dataToExport.length === 0) {
      this.showNotification('No suitable array data found to export as CSV.', 'warning');
      return;
    }
    
    // Ensure all items are objects for consistent header generation
    if (dataToExport.some(item => typeof item !== 'object' || item === null)) {
        this.showNotification('CSV export requires an array of objects.', 'error');
        return;
    }


    try {
        // Get all unique headers from all objects
        const headers = Array.from(new Set(dataToExport.flatMap(item => Object.keys(item))));
        
        const csvRows = [
          headers.join(','), // Header row
          ...dataToExport.map(row => 
            headers.map(header => {
              let value = row[header];
              // Stringify objects/arrays within cells
              if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value);
              }
              // Escape quotes and handle commas/newlines within values
              const stringValue = value !== undefined && value !== null ? String(value) : '';
              return `"${stringValue.replace(/"/g, '""')}"`; 
            }).join(',')
          )
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up blob URL
        
        this.showNotification('CSV exported successfully', 'success');
    } catch (error) {
         console.error("CSV Export Error:", error);
         this.showNotification(`CSV export failed: ${error.message}`, 'danger');
    }
  },

  /**
   * Export API response data to Google Sheets (Placeholder)
   */
  exportToGoogleSheets: function(data) {
     let dataToExport = data;
     // Similar logic as CSV to find the primary array if needed
     if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        const arrayKey = keys.find(k => Array.isArray(data[k]));
        if (arrayKey) {
            dataToExport = data[arrayKey];
        } else {
             dataToExport = [data]; // Treat single object as an array of one
        }
    }

    if (!Array.isArray(dataToExport) || dataToExport.length === 0) {
      this.showNotification('No suitable array data found to export to Sheets.', 'warning');
      return;
    }
    
     if (dataToExport.some(item => typeof item !== 'object' || item === null)) {
        this.showNotification('Sheets export requires an array of objects.', 'error');
        return;
    }


    this.showNotification('Preparing Google Sheets export...', 'info');
    
    // TODO: Implement actual Google Sheets API call here
    // This would involve:
    // 1. Setting up Google Cloud Project & Sheets API credentials.
    // 2. Implementing OAuth 2.0 flow for user authorization (can be complex client-side).
    // 3. Using the Google Sheets API (gapi client library or direct REST calls) to:
    //    a. Create a new spreadsheet or select an existing one.
    //    b. Format the data (headers + rows). Handle nested objects if necessary.
    //    c. Use spreadsheets.values.update or append to write data.
    
    console.log("Data for Sheets:", dataToExport); // Log data for now
    
    this.showNotification(
      'Google Sheets export is not fully implemented. Data logged to console.',
      'info'
    );
  }
};
