/**
 * Timestamp Tool Module
 *
 * This module handles timestamp conversion, calculation, and batch processing.
 */

const TimestampTool = {
    activeMode: 'standard', // 'standard', 'calculator', 'batch'
    batchResults: [], // Store results for download

    /**
     * Get the HTML template for the timestamp tool
     */
    getHtml: function () {
        // Note: Calendar button, CSV upload are disabled placeholders
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Timestamp Tool</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-light me-2 mode-toggle-btn" id="toggleCalculatorBtn" data-mode="calculator">Calculate Difference</button>
                        <button class="btn btn-sm btn-outline-light mode-toggle-btn" id="toggleBatchBtn" data-mode="batch">Batch Mode</button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Standard Mode Container -->
                    <div id="standardModeContainer" class="mode-container">
                        <!-- Input Section -->
                        <div class="mb-4">
                            <h5>Input</h5>
                            <div class="mb-3">
                                <label for="inputTimestamp" class="form-label">Timestamp</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="inputTimestamp" placeholder="Enter timestamp or date string">
                                    <button class="btn btn-outline-secondary" type="button" id="calendarBtn" title="Select Date (Coming Soon)" disabled><i class="fas fa-calendar-alt"></i></button>
                                    <button class="btn btn-primary" type="button" id="nowBtn">Now</button>
                                </div>
                                <small class="form-text text-muted">Examples: 1710000000, 2025-03-15 14:30:00, March 15 2025</small>
                            </div>
                            <div class="mb-3">
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

                        <!-- Output Section -->
                        <div class="mb-4">
                            <h5>Output</h5>
                            <div class="row g-3 mb-3" id="outputFormatsContainer">
                                <!-- Output cards will be dynamically inserted here -->
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="card-subtitle mb-2 text-muted">Unix Timestamp (seconds)</h6>
                                                    <code id="outputUnix">-</code>
                                                </div>
                                                <button class="btn btn-sm btn-outline-secondary copy-btn" data-target="outputUnix" title="Copy">
                                                    <i class="far fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="card-subtitle mb-2 text-muted">ISO 8601</h6>
                                                    <code id="outputIso">-</code>
                                                </div>
                                                <button class="btn btn-sm btn-outline-secondary copy-btn" data-target="outputIso" title="Copy">
                                                    <i class="far fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="card-subtitle mb-2 text-muted">Human Readable</h6>
                                                    <code id="outputHuman">-</code>
                                                </div>
                                                <button class="btn btn-sm btn-outline-secondary copy-btn" data-target="outputHuman" title="Copy">
                                                    <i class="far fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="card-subtitle mb-2 text-muted">RFC 2822</h6>
                                                    <code id="outputRfc">-</code>
                                                </div>
                                                <button class="btn btn-sm btn-outline-secondary copy-btn" data-target="outputRfc" title="Copy">
                                                    <i class="far fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row g-3 align-items-end">
                                 <div class="col-md-6">
                                     <label for="additionalOutputFormat" class="form-label">Additional Output Formats</label>
                                     <select class="form-select" id="additionalOutputFormat">
                                         <option value="">Select format...</option>
                                         <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                         <option value="relative">Relative Time</option>
                                         <option value="date_string">Locale Date String</option>
                                         <option value="time_string">Locale Time String</option>
                                         <option value="utc_string">UTC String</option>
                                         <option value="custom">Custom Format</option>
                                     </select>
                                 </div>
                                 <div class="col-md-6" id="customFormatContainer" style="display: none;">
                                     <label for="customFormat" class="form-label">Custom Format</label>
                                     <input type="text" class="form-control" id="customFormat" placeholder="YYYY-MM-DD HH:mm:ss">
                                 </div>
                                 <div class="col-12 mt-3" id="additionalOutputContainer" style="display: none;">
                                     <div class="card bg-light">
                                         <div class="card-body">
                                             <div class="d-flex justify-content-between align-items-center">
                                                 <code id="outputAdditional">-</code>
                                                 <button class="btn btn-sm btn-outline-primary copy-btn" data-target="outputAdditional" title="Copy">
                                                     <i class="far fa-copy"></i>
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                            </div>
                            <div class="mt-3 text-end">
                                 <button class="btn btn-primary" id="copyAllBtn">Copy All Formats</button>
                            </div>
                        </div>

                        <!-- Current Time -->
                        <div class="mt-4 border-top pt-3">
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
                    </div> <!-- End Standard Mode Container -->

                    <!-- Calculator Mode Container -->
                    <div id="calculatorModeContainer" class="mode-container" style="display: none;">
                        <h5>Calculate Difference</h5>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label for="calcTimestamp1" class="form-label">Timestamp 1</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="calcTimestamp1" placeholder="Enter first timestamp">
                                    <button class="btn btn-outline-secondary calc-now-btn" type="button" data-target="calcTimestamp1">Now</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label for="calcTimestamp2" class="form-label">Timestamp 2</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="calcTimestamp2" placeholder="Enter second timestamp">
                                     <button class="btn btn-outline-secondary calc-now-btn" type="button" data-target="calcTimestamp2">Now</button>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary mb-3" id="calculateDiffBtn">Calculate</button>
                        <div id="calculatorResultContainer" style="display: none;">
                            <h6>Difference:</h6>
                            <ul class="list-group mb-3">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Seconds: <span id="diffSeconds" class="badge bg-secondary rounded-pill">-</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Minutes: <span id="diffMinutes" class="badge bg-secondary rounded-pill">-</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Hours: <span id="diffHours" class="badge bg-secondary rounded-pill">-</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Days: <span id="diffDays" class="badge bg-secondary rounded-pill">-</span>
                                </li>
                                <li class="list-group-item">
                                    Human Readable: <span id="diffHuman">-</span>
                                </li>
                            </ul>
                            <!-- Timeline Placeholder -->
                            <div id="timelineContainer" class="mt-3" style="display: none;">
                                <h6>Timeline (Difference < 30 days)</h6>
                                <div class="progress" style="height: 20px;">
                                     <div id="timelineProgress" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <div class="d-flex justify-content-between mt-1">
                                     <small id="timelineStartLabel">Start</small>
                                     <small id="timelineEndLabel">End</small>
                                </div>
                            </div>
                        </div>
                    </div> <!-- End Calculator Mode Container -->

                     <!-- Batch Mode Container -->
                    <div id="batchModeContainer" class="mode-container" style="display: none;">
                        <h5>Batch Conversion</h5>
                        <div class="mb-3">
                            <label for="batchInput" class="form-label">Enter Timestamps (one per line)</label>
                            <textarea class="form-control" id="batchInput" rows="5" placeholder="1710000000\n2025-03-15 14:30:00\n..."></textarea>
                        </div>
                         <div class="mb-3">
                            <label for="batchInputFormat" class="form-label">Input Format</label>
                            <select class="form-select" id="batchInputFormat">
                                <option value="auto">Auto-detect</option>
                                <option value="unix">Unix Timestamp (seconds)</option>
                                <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                <option value="iso">ISO 8601</option>
                                <option value="rfc">RFC 2822</option>
                                <option value="date">Date String</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="batchOutputFormat" class="form-label">Output Format</label>
                            <select class="form-select" id="batchOutputFormat">
                                <option value="iso">ISO 8601</option>
                                <option value="unix">Unix Timestamp (seconds)</option>
                                <option value="unix_ms">Unix Timestamp (milliseconds)</option>
                                <option value="rfc">RFC 2822</option>
                                <option value="human">Human Readable (Local)</option>
                                <option value="custom">Custom Format</option>
                            </select>
                        </div>
                        <div class="mb-3" id="batchCustomFormatContainer" style="display: none;">
                             <label for="batchCustomFormat" class="form-label">Custom Output Format</label>
                             <input type="text" class="form-control" id="batchCustomFormat" placeholder="YYYY-MM-DD HH:mm:ss">
                        </div>
                        <div class="mb-3">
                            <label for="batchCsvUpload" class="form-label">Or Upload CSV</label>
                            <input class="form-control" type="file" id="batchCsvUpload" accept=".csv" disabled title="CSV Upload Coming Soon">
                        </div>
                        <button class="btn btn-primary me-2" id="processBatchBtn">Process Batch</button>
                        <button class="btn btn-success" id="downloadBatchBtn" style="display: none;">Download Results (CSV)</button>
                        <div id="batchResultContainer" class="mt-3" style="display: none;">
                            <h6>Results:</h6>
                            <pre id="batchResultOutput" style="max-height: 200px; overflow-y: auto; background-color: var(--light-bg); padding: 10px; border-radius: 4px;"></pre>
                        </div>
                    </div> <!-- End Batch Mode Container -->

                </div>
            </div>
        `;
    },

    /**
     * Initialize the timestamp tool
     */
    init: function () {
        this.activeMode = 'standard'; // Default mode
        this.setupEventListeners();
        this.startTimeUpdate();
        this.updateOutput(); // Initial update for standard mode
        this.switchMode(this.activeMode); // Set initial visibility
    },

    /**
     * Switch between modes (standard, calculator, batch)
     */
    switchMode: function(newMode) {
        if (this.activeMode === newMode) return; // No change

        this.activeMode = newMode;

        // Hide all containers
        document.querySelectorAll('.mode-container').forEach(container => {
            container.style.display = 'none';
        });

        // Show the active container
        const activeContainer = document.getElementById(`${newMode}ModeContainer`);
        if (activeContainer) {
            activeContainer.style.display = 'block';
        }

        // Update button active states
        document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
            if (btn.dataset.mode === newMode) {
                btn.classList.add('active', 'btn-light'); // Use btn-light for active state
                btn.classList.remove('btn-outline-light');
            } else {
                btn.classList.remove('active', 'btn-light');
                btn.classList.add('btn-outline-light');
            }
        });

        // Reset specific mode elements if needed when switching
        if (newMode === 'standard') {
            this.updateOutput(); // Refresh standard output
        } else if (newMode === 'calculator') {
            // Optionally clear calculator fields/results
        } else if (newMode === 'batch') {
            // Optionally clear batch fields/results
        }
    },


    /**
     * Set up event listeners
     */
    setupEventListeners: function () {
        const toolContainer = document.getElementById('timestamp-tool'); // Main container for delegation

        // --- Mode Switching ---
        const toggleCalculatorBtn = document.getElementById('toggleCalculatorBtn');
        const toggleBatchBtn = document.getElementById('toggleBatchBtn');

        if (toggleCalculatorBtn) {
            toggleCalculatorBtn.addEventListener('click', () => this.switchMode('calculator'));
        }
        if (toggleBatchBtn) {
            toggleBatchBtn.addEventListener('click', () => this.switchMode('batch'));
        }
        // Add listener to switch back to standard if needed (e.g., clicking the header/logo?)
        // For now, switching is only via the mode buttons.

        // --- Standard Mode Listeners ---
        const inputTimestamp = document.getElementById('inputTimestamp');
        const inputFormat = document.getElementById('inputFormat');
        const nowBtn = document.getElementById('nowBtn');
        const additionalOutputFormat = document.getElementById('additionalOutputFormat');
        const customFormatInput = document.getElementById('customFormat');
        const copyAllBtn = document.getElementById('copyAllBtn');

        if (inputTimestamp) inputTimestamp.addEventListener('input', () => this.updateOutput());
        if (inputFormat) inputFormat.addEventListener('change', () => this.updateOutput());
        if (nowBtn) {
            nowBtn.addEventListener('click', () => {
                inputTimestamp.value = Date.now();
                inputFormat.value = 'unix_ms';
                this.updateOutput();
            });
        }
        if (additionalOutputFormat) {
            additionalOutputFormat.addEventListener('change', () => {
                const customFormatContainer = document.getElementById('customFormatContainer');
                const additionalOutputContainer = document.getElementById('additionalOutputContainer');
                const isCustom = additionalOutputFormat.value === 'custom';
                const isSelected = additionalOutputFormat.value !== '';
                customFormatContainer.style.display = isCustom ? 'block' : 'none';
                additionalOutputContainer.style.display = isSelected ? 'block' : 'none';
                if (!isSelected) document.getElementById('outputAdditional').textContent = '-';
                else this.updateOutput();
            });
        }
        if (customFormatInput) {
            customFormatInput.addEventListener('input', () => {
                if (additionalOutputFormat.value === 'custom') this.updateOutput();
            });
        }
        if (copyAllBtn) copyAllBtn.addEventListener('click', () => this.copyAllFormats());

        // --- Calculator Mode Listeners ---
        const calculateDiffBtn = document.getElementById('calculateDiffBtn');
        if (calculateDiffBtn) calculateDiffBtn.addEventListener('click', () => this.calculateDifference());

        document.querySelectorAll('.calc-now-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const targetInputId = event.target.dataset.target;
                const targetInput = document.getElementById(targetInputId);
                if (targetInput) {
                    targetInput.value = Date.now(); // Use ms for consistency
                }
            });
        });


        // --- Batch Mode Listeners ---
        const batchOutputFormatSelect = document.getElementById('batchOutputFormat');
        const batchCustomFormatContainer = document.getElementById('batchCustomFormatContainer');
        const processBatchBtn = document.getElementById('processBatchBtn');
        const downloadBatchBtn = document.getElementById('downloadBatchBtn');

        if (batchOutputFormatSelect) {
            batchOutputFormatSelect.addEventListener('change', () => {
                batchCustomFormatContainer.style.display = batchOutputFormatSelect.value === 'custom' ? 'block' : 'none';
            });
        }
        if (processBatchBtn) processBatchBtn.addEventListener('click', () => this.processBatch());
        if (downloadBatchBtn) downloadBatchBtn.addEventListener('click', () => this.downloadBatchResults());
        // CSV Upload listener would go here if enabled


        // --- Delegated Copy Button Listener ---
         if (toolContainer) {
            toolContainer.addEventListener('click', (event) => {
                const button = event.target.closest('.copy-btn');
                if (button) {
                    const targetId = button.dataset.target;
                    const outputElement = document.getElementById(targetId);
                    if (outputElement) {
                        const outputText = outputElement.textContent;
                        if (outputText && outputText !== '-' && outputText !== 'Invalid') {
                            this.copyToClipboard(outputText, button);
                        }
                    }
                }
            });
        }
    },

    /**
     * Start updating current time display (Only visible in standard mode)
     */
    startTimeUpdate: function () {
        const updateTime = () => {
            const now = new Date();
            const localTimeEl = document.getElementById('localTime');
            const utcTimeEl = document.getElementById('utcTime');
            // Only update if elements exist (they are only in standard mode HTML)
            if (localTimeEl) localTimeEl.textContent = now.toLocaleString();
            if (utcTimeEl) utcTimeEl.textContent = now.toUTCString();
        };

        updateTime();
        // Clear previous interval if exists
        if (this.timeInterval) clearInterval(this.timeInterval);
        this.timeInterval = setInterval(updateTime, 1000);
    },

    /**
     * Update output based on input (Standard Mode)
     */
    updateOutput: function () {
        if (this.activeMode !== 'standard') return; // Only run in standard mode

        const input = document.getElementById('inputTimestamp')?.value;
        const outputUnix = document.getElementById('outputUnix');
        const outputIso = document.getElementById('outputIso');
        const outputHuman = document.getElementById('outputHuman');
        const outputRfc = document.getElementById('outputRfc');
        const outputAdditional = document.getElementById('outputAdditional');

        const resetOutputs = () => {
            if (outputUnix) outputUnix.textContent = '-';
            if (outputIso) outputIso.textContent = '-';
            if (outputHuman) outputHuman.textContent = '-';
            if (outputRfc) outputRfc.textContent = '-';
            if (outputAdditional && document.getElementById('additionalOutputFormat')?.value !== '') {
                 outputAdditional.textContent = '-';
            }
        };

        if (!input) {
            resetOutputs();
            return;
        }

        try {
            const date = this.parseInput(input, document.getElementById('inputFormat')?.value);
            if (isNaN(date.getTime())) throw new Error('Invalid Date');

            const formats = this.formatAllOutputs(date);
            if (outputUnix) outputUnix.textContent = formats.unix;
            if (outputIso) outputIso.textContent = formats.iso;
            if (outputHuman) outputHuman.textContent = formats.human;
            if (outputRfc) outputRfc.textContent = formats.rfc;

            const additionalFormat = document.getElementById('additionalOutputFormat')?.value;
            if (additionalFormat && outputAdditional) {
                 outputAdditional.textContent = this.formatOutput(date, additionalFormat);
            } else if (outputAdditional) {
                 outputAdditional.textContent = '-';
            }

        } catch (error) {
            console.error("Timestamp parsing/formatting error:", error);
            resetOutputs();
             if (outputUnix) outputUnix.textContent = 'Invalid';
        }
    },

    /**
     * Parse input timestamp - generalized
     */
    parseInput: function (input, formatHint = 'auto') {
        let date;
        input = input.trim();

        switch (formatHint) {
            case 'unix':
                if (/^\d{1,10}$/.test(input)) date = new Date(parseInt(input) * 1000);
                else if (/^\d{11,13}$/.test(input)) date = new Date(parseInt(input)); // Assume ms if > 10 digits
                else throw new Error('Invalid Unix format');
                break;
            case 'unix_ms':
                 if (/^\d{10,13}$/.test(input)) date = new Date(parseInt(input));
                 else throw new Error('Invalid Unix (milliseconds) format');
                break;
            case 'iso':
            case 'rfc':
            case 'date':
            case 'auto':
            default:
                date = new Date(input);
                if (isNaN(date.getTime()) && /^\d+$/.test(input)) {
                    if (input.length > 10 && input.length <= 13) date = new Date(parseInt(input)); // Try ms
                    else if (input.length <= 10) date = new Date(parseInt(input) * 1000); // Try seconds
                }
                break;
        }

        if (!(date instanceof Date) || isNaN(date.getTime())) {
             throw new Error(`Could not parse input date: "${input}" with hint: "${formatHint}"`);
        }
        return date;
    },

    /**
     * Format all primary output timestamps (Standard Mode)
     */
     formatAllOutputs: function(date) {
         return {
             unix: this.formatOutput(date, 'unix'),
             iso: this.formatOutput(date, 'iso'),
             human: this.formatOutput(date, 'human'),
             rfc: this.formatOutput(date, 'rfc')
         };
     },

    /**
     * Format output timestamp based on selected format type
     */
    formatOutput: function (date, formatType) {
        if (!(date instanceof Date) || isNaN(date.getTime())) return '-';

        switch (formatType) {
            case 'unix': return Math.floor(date.getTime() / 1000).toString();
            case 'unix_ms': return date.getTime().toString();
            case 'iso': return date.toISOString();
            case 'rfc': return date.toUTCString();
            case 'human':
                 return date.toLocaleString(undefined, {
                     dateStyle: 'full', timeStyle: 'medium' // More comprehensive human format
                 });
            case 'relative': return this.getRelativeTime(date);
            case 'date_string': return date.toLocaleDateString();
            case 'time_string': return date.toLocaleTimeString();
            case 'utc_string': return date.toUTCString();
            case 'custom':
                const customFormatId = this.activeMode === 'batch' ? 'batchCustomFormat' : 'customFormat';
                const customFormat = document.getElementById(customFormatId)?.value || 'YYYY-MM-DD HH:mm:ss';
                return this.formatCustom(date, customFormat);
            default: return date.toString();
        }
    },

    /**
     * Get relative time string using Intl.RelativeTimeFormat
     */
    getRelativeTime: function (date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.round(diff / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        const weeks = Math.round(days / 7);
        const months = Math.round(days / 30.44);
        const years = Math.round(days / 365.25);

        try {
            const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
            if (Math.abs(seconds) < 60) return rtf.format(-seconds, 'second');
            if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
            if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
            if (Math.abs(days) < 7) return rtf.format(-days, 'day');
            if (Math.abs(weeks) < 5) return rtf.format(-weeks, 'week');
            if (Math.abs(months) < 12) return rtf.format(-months, 'month');
            return rtf.format(-years, 'year');
        } catch (e) {
            // Fallback for browsers that might not support RelativeTimeFormat fully
            return date.toLocaleString();
        }
    },

    /**
     * Format date using custom format string
     */
    formatCustom: function (date, format) {
        const pad = (num, length = 2) => String(num).padStart(length, '0');
        return format
            .replace('YYYY', date.getFullYear())
            .replace('MM', pad(date.getMonth() + 1))
            .replace('DD', pad(date.getDate()))
            .replace('HH', pad(date.getHours()))
            .replace('mm', pad(date.getMinutes()))
            .replace('ss', pad(date.getSeconds()))
            .replace('SSS', pad(date.getMilliseconds(), 3));
    },

    /**
     * Calculate and display difference between two timestamps (Calculator Mode)
     */
    calculateDifference: function() {
        if (this.activeMode !== 'calculator') return;

        const input1El = document.getElementById('calcTimestamp1');
        const input2El = document.getElementById('calcTimestamp2');
        const resultContainer = document.getElementById('calculatorResultContainer');
        const timelineContainer = document.getElementById('timelineContainer');

        const val1 = input1El?.value;
        const val2 = input2El?.value;

        const resetCalcOutputs = () => {
            document.getElementById('diffSeconds').textContent = '-';
            document.getElementById('diffMinutes').textContent = '-';
            document.getElementById('diffHours').textContent = '-';
            document.getElementById('diffDays').textContent = '-';
            document.getElementById('diffHuman').textContent = '-';
            if (resultContainer) resultContainer.style.display = 'none';
            if (timelineContainer) timelineContainer.style.display = 'none';
        };

        if (!val1 || !val2) {
            this.showError("Please enter both timestamps.");
            resetCalcOutputs();
            return;
        }

        try {
            // Use 'auto' format hint for calculator inputs
            const date1 = this.parseInput(val1, 'auto');
            const date2 = this.parseInput(val2, 'auto');

            if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
                throw new Error('Invalid date input');
            }

            const diffMs = Math.abs(date1.getTime() - date2.getTime());
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            document.getElementById('diffSeconds').textContent = diffSeconds.toLocaleString();
            document.getElementById('diffMinutes').textContent = diffMinutes.toLocaleString();
            document.getElementById('diffHours').textContent = diffHours.toLocaleString();
            document.getElementById('diffDays').textContent = diffDays.toLocaleString();

            // Human readable difference (simple version)
            let humanDiff = '';
            if (diffDays > 0) humanDiff += `${diffDays} day${diffDays > 1 ? 's' : ''} `;
            const remainingHours = diffHours % 24;
            if (remainingHours > 0) humanDiff += `${remainingHours} hour${remainingHours > 1 ? 's' : ''} `;
            const remainingMinutes = diffMinutes % 60;
            if (remainingMinutes > 0) humanDiff += `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} `;
            const remainingSeconds = diffSeconds % 60;
            if (remainingSeconds > 0 || humanDiff === '') humanDiff += `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`; // Show seconds if it's the only unit or non-zero
            document.getElementById('diffHuman').textContent = humanDiff.trim();


            if (resultContainer) resultContainer.style.display = 'block';

            // Update Timeline
            this.updateTimeline(diffMs, date1, date2);

        } catch (error) {
            console.error("Calculation error:", error);
            this.showError(`Calculation failed: ${error.message}`);
            resetCalcOutputs();
        }
    },

    /**
     * Update the visual timeline (Calculator Mode)
     */
     updateTimeline: function(diffMs, date1, date2) {
         const timelineContainer = document.getElementById('timelineContainer');
         const timelineProgress = document.getElementById('timelineProgress');
         const startLabel = document.getElementById('timelineStartLabel');
         const endLabel = document.getElementById('timelineEndLabel');
         const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

         if (!timelineContainer || !timelineProgress || !startLabel || !endLabel) return;

         if (diffMs < thirtyDaysInMs && diffMs > 0) {
             const startDate = date1 < date2 ? date1 : date2;
             const endDate = date1 > date2 ? date1 : date2;

             // Simple percentage based on 30 days max
             const percentage = Math.min(100, (diffMs / thirtyDaysInMs) * 100);

             timelineProgress.style.width = `${percentage}%`;
             timelineProgress.setAttribute('aria-valuenow', percentage);
             timelineProgress.textContent = `${Math.round(percentage)}%`; // Optional: show percentage text

             startLabel.textContent = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
             endLabel.textContent = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

             timelineContainer.style.display = 'block';
         } else {
             timelineContainer.style.display = 'none'; // Hide if difference is 0 or >= 30 days
         }
     },

    /**
     * Process batch timestamp conversions (Batch Mode)
     */
    processBatch: function() {
        if (this.activeMode !== 'batch') return;

        const batchInput = document.getElementById('batchInput')?.value;
        const inputFormat = document.getElementById('batchInputFormat')?.value;
        const outputFormat = document.getElementById('batchOutputFormat')?.value;
        const resultOutput = document.getElementById('batchResultOutput');
        const resultContainer = document.getElementById('batchResultContainer');
        const downloadBtn = document.getElementById('downloadBatchBtn');

        if (!batchInput || !resultOutput || !resultContainer || !downloadBtn) return;

        const lines = batchInput.trim().split('\n');
        this.batchResults = []; // Clear previous results
        let outputText = 'Input,Output,Status\n'; // CSV Header

        lines.forEach(line => {
            const input = line.trim();
            if (!input) return; // Skip empty lines

            let output = '';
            let status = 'Success';
            try {
                const date = this.parseInput(input, inputFormat);
                if (isNaN(date.getTime())) throw new Error('Invalid Date');
                output = this.formatOutput(date, outputFormat);
            } catch (error) {
                output = 'Error';
                status = error.message || 'Failed to parse/format';
                console.warn(`Batch processing error for input "${input}":`, error);
            }
            this.batchResults.push({ input, output, status });
            // Escape commas in input/output for CSV
            const csvInput = `"${input.replace(/"/g, '""')}"`;
            const csvOutput = `"${output.replace(/"/g, '""')}"`;
            const csvStatus = `"${status.replace(/"/g, '""')}"`;
            outputText += `${csvInput},${csvOutput},${csvStatus}\n`;
        });

        resultOutput.textContent = outputText;
        resultContainer.style.display = 'block';
        downloadBtn.style.display = this.batchResults.length > 0 ? 'inline-block' : 'none';

        if (this.batchResults.length === 0) {
            this.showNotification("No valid inputs found in batch.", "warning");
        }
    },

    /**
     * Trigger download of batch results as CSV (Batch Mode)
     */
    downloadBatchResults: function() {
        if (this.activeMode !== 'batch' || this.batchResults.length === 0) return;

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Input,Output,Status\n'; // Header row

        this.batchResults.forEach(row => {
            const input = `"${row.input.replace(/"/g, '""')}"`;
            const output = `"${row.output.replace(/"/g, '""')}"`;
            const status = `"${row.status.replace(/"/g, '""')}"`;
            csvContent += `${input},${output},${status}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'timestamp_batch_results.csv');
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
    },


    /**
     * Copy text to clipboard and provide feedback
     */
    copyToClipboard: function (text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = buttonElement.innerHTML;
            const originalTitle = buttonElement.title;
            buttonElement.innerHTML = '<i class="fas fa-check text-success"></i>';
            buttonElement.title = 'Copied!';
            setTimeout(() => {
                buttonElement.innerHTML = originalIcon;
                buttonElement.title = originalTitle;
            }, 1500);
        }).catch((err) => {
            console.error('Failed to copy:', err);
            this.showError('Failed to copy to clipboard');
        });
    },

    /**
     * Copy all displayed formats (Standard Mode)
     */
     copyAllFormats: function() {
         if (this.activeMode !== 'standard') return; // Only for standard mode

         const formats = [
             { label: "Unix Timestamp (seconds)", id: "outputUnix" },
             { label: "ISO 8601", id: "outputIso" },
             { label: "Human Readable", id: "outputHuman" },
             { label: "RFC 2822", id: "outputRfc" }
         ];
         const additionalFormatSelect = document.getElementById('additionalOutputFormat');
         const additionalOutput = document.getElementById('outputAdditional');
         if (additionalFormatSelect?.value && additionalOutput) {
             const selectedOption = additionalFormatSelect.options[additionalFormatSelect.selectedIndex];
             formats.push({ label: selectedOption.text, id: "outputAdditional" });
         }

         let textToCopy = "";
         formats.forEach(format => {
             const element = document.getElementById(format.id);
             const value = element?.textContent;
             if (value && value !== '-' && value !== 'Invalid') {
                 textToCopy += `${format.label}: ${value}\n`;
             }
         });

         if (textToCopy) {
             navigator.clipboard.writeText(textToCopy.trim()).then(() => {
                 this.showNotification('All formats copied to clipboard');
             }).catch((err) => {
                 console.error('Failed to copy all:', err);
                 this.showError('Failed to copy all formats');
             });
         } else {
             this.showNotification('No valid outputs to copy', 'warning');
         }
     },

    /** Show error/notification messages (implementation unchanged) */
    showError: function (message) { this.showNotification(message, 'danger'); },
    showNotification: function (message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) { console.warn("Notification container not found."); return; }
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show notification`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        container.appendChild(notification);
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getInstance(notification);
            if (bsAlert) bsAlert.close(); else notification.remove();
        }, 3000);
     },

     // Cleanup interval on unload
     cleanup: function() {
         if (this.timeInterval) clearInterval(this.timeInterval);
     }
};

// Add cleanup listener
window.addEventListener('beforeunload', () => TimestampTool.cleanup());

// Assuming app.js calls init after inserting HTML
