/**
 * Timestamp Tool Module
 * 
 * This module handles timestamp conversion functionality.
 */

const TimestampTool = {
    /**
     * Get the HTML template for the timestamp tool
     */
    getHtml: function() {
        return `
            <div class="card">
                <div class="card-body">
                    <!-- Input Section -->
                    <div class="mb-4">
                        <h5>Input</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="inputTimestamp" class="form-label">Timestamp</label>
                                <input type="text" class="form-control" id="inputTimestamp" placeholder="Enter timestamp or date string">
                            </div>
                            <div class="col-md-6">
                                <label for="inputFormat" class="form-label">Input Format</label>
                                <select class="form-select" id="inputFormat">
                                    <option value="auto">Auto-detect</option>
                                    <option value="unix">Unix Timestamp (seconds)</option>
                                    <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                    <option value="iso">ISO 8601</option>
                                    <option value="rfc">RFC 2822</option>
                                    <option value="date">Date String</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Output Section -->
                    <div class="mb-4">
                        <h5>Output</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="outputFormat" class="form-label">Output Format</label>
                                <select class="form-select" id="outputFormat">
                                    <option value="unix">Unix Timestamp (seconds)</option>
                                    <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                    <option value="iso">ISO 8601</option>
                                    <option value="rfc">RFC 2822</option>
                                    <option value="relative">Relative Time</option>
                                    <option value="custom">Custom Format</option>
                                </select>
                            </div>
                            <div class="col-md-6" id="customFormatContainer" style="display: none;">
                                <label for="customFormat" class="form-label">Custom Format</label>
                                <input type="text" class="form-control" id="customFormat" placeholder="YYYY-MM-DD HH:mm:ss">
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <code id="outputTimestamp">-</code>
                                        <button class="btn btn-sm btn-outline-primary" id="copyOutput">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Current Time -->
                    <div>
                        <h5>Current Time</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <small class="text-muted">Local Time</small>
                                        <div id="localTime" class="mt-1">-</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <small class="text-muted">UTC Time</small>
                                        <div id="utcTime" class="mt-1">-</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Initialize the timestamp tool
     */
    init: function() {
        this.setupEventListeners();
        this.startTimeUpdate();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Input timestamp change
        document.getElementById('inputTimestamp').addEventListener('input', () => this.updateOutput());
        
        // Format changes
        document.getElementById('inputFormat').addEventListener('change', () => this.updateOutput());
        document.getElementById('outputFormat').addEventListener('change', () => {
            const customFormatContainer = document.getElementById('customFormatContainer');
            customFormatContainer.style.display = 
                document.getElementById('outputFormat').value === 'custom' ? 'block' : 'none';
            this.updateOutput();
        });
        
        // Custom format change
        document.getElementById('customFormat').addEventListener('input', () => this.updateOutput());
        
        // Copy button
        document.getElementById('copyOutput').addEventListener('click', () => {
            const output = document.getElementById('outputTimestamp').textContent;
            navigator.clipboard.writeText(output).then(() => {
                this.showNotification('Copied to clipboard');
            }).catch(() => {
                this.showError('Failed to copy to clipboard');
            });
        });
    },
    
    /**
     * Start updating current time display
     */
    startTimeUpdate: function() {
        const updateTime = () => {
            const now = new Date();
            document.getElementById('localTime').textContent = now.toLocaleString();
            document.getElementById('utcTime').textContent = now.toUTCString();
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    },
    
    /**
     * Update output based on input
     */
    updateOutput: function() {
        const input = document.getElementById('inputTimestamp').value;
        if (!input) {
            document.getElementById('outputTimestamp').textContent = '-';
            return;
        }
        
        try {
            const date = this.parseInput(input);
            const output = this.formatOutput(date);
            document.getElementById('outputTimestamp').textContent = output;
        } catch (error) {
            document.getElementById('outputTimestamp').textContent = 'Invalid input';
        }
    },
    
    /**
     * Parse input timestamp
     */
    parseInput: function(input) {
        const inputFormat = document.getElementById('inputFormat').value;
        
        switch (inputFormat) {
            case 'unix':
                return new Date(parseInt(input) * 1000);
            case 'unix_ms':
                return new Date(parseInt(input));
            case 'iso':
            case 'rfc':
            case 'date':
            case 'auto':
                return new Date(input);
            default:
                throw new Error('Invalid input format');
        }
    },
    
    /**
     * Format output timestamp
     */
    formatOutput: function(date) {
        const outputFormat = document.getElementById('outputFormat').value;
        
        switch (outputFormat) {
            case 'unix':
                return Math.floor(date.getTime() / 1000).toString();
            case 'unix_ms':
                return date.getTime().toString();
            case 'iso':
                return date.toISOString();
            case 'rfc':
                return date.toUTCString();
            case 'relative':
                return this.getRelativeTime(date);
            case 'custom':
                return this.formatCustom(date, document.getElementById('customFormat').value);
            default:
                return date.toString();
        }
    },
    
    /**
     * Get relative time string
     */
    getRelativeTime: function(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(Math.abs(diff) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (diff < 0) {
            if (seconds < 60) return 'in ' + seconds + ' seconds';
            if (minutes < 60) return 'in ' + minutes + ' minutes';
            if (hours < 24) return 'in ' + hours + ' hours';
            return 'in ' + days + ' days';
        } else {
            if (seconds < 60) return seconds + ' seconds ago';
            if (minutes < 60) return minutes + ' minutes ago';
            if (hours < 24) return hours + ' hours ago';
            return days + ' days ago';
        }
    },
    
    /**
     * Format date using custom format string
     */
    formatCustom: function(date, format) {
        const pad = (num) => String(num).padStart(2, '0');
        
        return format
            .replace('YYYY', date.getFullYear())
            .replace('MM', pad(date.getMonth() + 1))
            .replace('DD', pad(date.getDate()))
            .replace('HH', pad(date.getHours()))
            .replace('mm', pad(date.getMinutes()))
            .replace('ss', pad(date.getSeconds()))
            .replace('SSS', String(date.getMilliseconds()).padStart(3, '0'));
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
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};
