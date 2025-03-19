/**
 * Timestamp Tool Module
 * 
 * This module provides functionality for converting between different timestamp formats
 * and time zones.
 */

const TimestampTool = {
    // Current state
    state: {
        inputTimestamp: '',
        inputFormat: 'unix',
        outputFormat: 'ist',
        result: ''
    },
    
    /**
     * Initialize the Timestamp Tool module
     */
    init: function() {
        // Set up event listeners
        this.setupEventListeners();
    },
    
    /**
     * Get the HTML content for this module
     * @returns {string} HTML markup for the interface
     */
    getHtml: function() {
        return `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-4 shadow-sm">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-clock me-2"></i>Timestamp Converter
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="input-format" class="form-label">Input Format</label>
                                    <select id="input-format" class="form-select">
                                        <option value="unix">Unix Timestamp (seconds)</option>
                                        <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                        <option value="iso">ISO 8601</option>
                                        <option value="date">Date String</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="input-timestamp" class="form-label">Input Timestamp</label>
                                    <input type="text" id="input-timestamp" class="form-control" placeholder="Enter timestamp...">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="output-format" class="form-label">Output Format</label>
                                    <select id="output-format" class="form-select">
                                        <option value="ist">Indian Standard Time (IST)</option>
                                        <option value="utc">UTC</option>
                                        <option value="unix">Unix Timestamp (seconds)</option>
                                        <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                        <option value="iso">ISO 8601</option>
                                    </select>
                                </div>
                                
                                <button id="convert-timestamp" class="btn btn-primary">
                                    <i class="fas fa-sync-alt me-2"></i>Convert
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card mb-4 shadow-sm">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-calendar me-2"></i>Result
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="result" class="form-label">Converted Timestamp</label>
                                    <input type="text" id="result" class="form-control" readonly>
                                </div>
                                
                                <button id="copy-result" class="btn btn-outline-secondary">
                                    <i class="fas fa-copy me-2"></i>Copy to Clipboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners: function() {
        // Convert button
        const convertBtn = document.getElementById('convert-timestamp');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                this.convertTimestamp();
            });
        }
        
        // Copy result button
        const copyBtn = document.getElementById('copy-result');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyResult();
            });
        }
    },
    
    /**
     * Convert the timestamp based on selected formats
     */
    convertTimestamp: function() {
        const inputTimestamp = document.getElementById('input-timestamp').value.trim();
        const inputFormat = document.getElementById('input-format').value;
        const outputFormat = document.getElementById('output-format').value;
        
        if (!inputTimestamp) {
            DataToolkit.notify('Please enter a timestamp', 'error');
            return;
        }
        
        try {
            let date;
            
            // Parse input based on format
            switch (inputFormat) {
                case 'unix':
                    date = new Date(parseInt(inputTimestamp) * 1000);
                    break;
                case 'unix_ms':
                    date = new Date(parseInt(inputTimestamp));
                    break;
                case 'iso':
                    date = new Date(inputTimestamp);
                    break;
                case 'date':
                    date = new Date(inputTimestamp);
                    break;
            }
            
            if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp format');
            }
            
            // Format output based on selected format
            let result;
            switch (outputFormat) {
                case 'ist':
                    result = this.formatToIST(date);
                    break;
                case 'utc':
                    result = date.toISOString();
                    break;
                case 'unix':
                    result = Math.floor(date.getTime() / 1000).toString();
                    break;
                case 'unix_ms':
                    result = date.getTime().toString();
                    break;
                case 'iso':
                    result = date.toISOString();
                    break;
            }
            
            // Display result
            const resultInput = document.getElementById('result');
            if (resultInput) {
                resultInput.value = result;
            }
            
            DataToolkit.notify('Timestamp converted successfully', 'success');
        } catch (error) {
            DataToolkit.notify('Error converting timestamp: ' + error.message, 'error');
        }
    },
    
    /**
     * Format date to IST
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string in IST
     */
    formatToIST: function(date) {
        const options = {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        return date.toLocaleString('en-IN', options);
    },
    
    /**
     * Copy the result to clipboard
     */
    copyResult: function() {
        const resultInput = document.getElementById('result');
        if (resultInput && resultInput.value) {
            navigator.clipboard.writeText(resultInput.value)
                .then(() => {
                    DataToolkit.notify('Result copied to clipboard', 'success');
                })
                .catch(() => {
                    DataToolkit.notify('Failed to copy result', 'error');
                });
        }
    }
};
