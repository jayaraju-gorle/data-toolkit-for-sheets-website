// LinkedIn Search Component - Enhanced Vanilla JavaScript Version
document.addEventListener('DOMContentLoaded', function() {
  // API Configuration
  const API_CONFIG = {
    development: 'http://localhost:3001/api',
    production: 'https://linkedin-scraper-backend-772545827002.asia-south1.run.app/api'
  }

  // ===== EXPORT FUNCTIONS =====

  // Export search results to CSV
  function exportToCsv(resultsToExport = state.searchResults, options = {}) {
    if (!resultsToExport || resultsToExport.length === 0) {
      showToast('No results to export', 'warning');
      return;
    }
    
    // Show export options modal if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal && !options.skipModal) {
      showExportOptionsModal(resultsToExport);
      return;
    }
    
    try {
      // Define default columns to export
      const defaultColumns = [
        { key: 'name', header: 'Full Name' },
        { key: 'title', header: 'Title' },
        { key: 'company', header: 'Company', getValue: (profile) => {
          // Extract company from title if possible
          const title = profile.title || '';
          if (title.includes(' at ')) {
            return title.split(' at ')[1].trim();
          }
          return '';
        }},
        { key: 'location', header: 'Location' },
        { key: 'connectionDegree', header: 'Connection' },
        { key: 'profileUrl', header: 'Profile URL' },
        { key: 'linkedinId', header: 'LinkedIn ID', getValue: (profile) => {
          // Extract ID from URL if available
          const url = profile.profileUrl || '';
          if (url.includes('/in/')) {
            return url.split('/in/')[1].split('/')[0];
          }
          return profile.linkedinId || '';
        }},
        { key: 'isAnonymous', header: 'Is Anonymous', getValue: (profile) => {
          return profile.isAnonymous ? 'Yes' : 'No';
        }}
      ];
      
      // Use provided columns or defaults
      const columnsToExport = options.columns || defaultColumns;
      
      // Create CSV header row
      const headers = columnsToExport.map(col => col.header);
      let csvContent = headers.join(',') + '\n';
      
      // Process each profile
      resultsToExport.forEach(profile => {
        // Apply any filter if specified
        if (options.filter && !options.filter(profile)) {
          return; // Skip this profile
        }
        
        // Create a row with values for each column
        const row = columnsToExport.map(column => {
          // Use custom getter if provided, otherwise use direct property
          const value = column.getValue 
            ? column.getValue(profile) 
            : (profile[column.key] || '');
          
          // Escape CSV special characters
          return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',');
        
        csvContent += row + '\n';
      });
      
      // Generate file name with date for uniqueness
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      
      let filename = options.filename || `linkedin-search-${dateStr}.csv`;
      
      // Make sure it has .csv extension
      if (!filename.toLowerCase().endsWith('.csv')) {
        filename += '.csv';
      }
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      
      // Use FileSaver.js if available, otherwise fallback
      if (typeof saveAs === 'function') {
        saveAs(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
      
      showToast(`Exported ${resultsToExport.length} profiles to ${filename}`, 'success');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      showToast('Error creating CSV file', 'error');
    }
  }
  
  // Show export options modal
  function showExportOptionsModal(resultsToExport) {
    // Create modal if it doesn't exist
    let exportModal = document.getElementById('exportOptionsModal');
    
    if (!exportModal) {
      exportModal = document.createElement('div');
      exportModal.className = 'modal fade';
      exportModal.id = 'exportOptionsModal';
      exportModal.setAttribute('tabindex', '-1');
      exportModal.setAttribute('aria-labelledby', 'exportOptionsModalLabel');
      exportModal.setAttribute('aria-hidden', 'true');
      
      exportModal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exportOptionsModalLabel">Export Options</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label for="export-filename">Filename</label>
                <div class="input-group">
                  <input type="text" class="form-control" id="export-filename" value="linkedin-search-${new Date().toISOString().split('T')[0]}.csv">
                  <span class="input-group-text">.csv</span>
                </div>
              </div>
              
              <div class="form-group mb-3">
                <label>Columns to Export</label>
                <div class="export-columns-container">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="name" id="export-col-name" checked>
                    <label class="form-check-label" for="export-col-name">Full Name</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="title" id="export-col-title" checked>
                    <label class="form-check-label" for="export-col-title">Title</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="company" id="export-col-company" checked>
                    <label class="form-check-label" for="export-col-company">Company</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="location" id="export-col-location" checked>
                    <label class="form-check-label" for="export-col-location">Location</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="connectionDegree" id="export-col-connection" checked>
                    <label class="form-check-label" for="export-col-connection">Connection Degree</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="profileUrl" id="export-col-url" checked>
                    <label class="form-check-label" for="export-col-url">Profile URL</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="linkedinId" id="export-col-id" checked>
                    <label class="form-check-label" for="export-col-id">LinkedIn ID</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="isAnonymous" id="export-col-anonymous" checked>
                    <label class="form-check-label" for="export-col-anonymous">Is Anonymous</label>
                  </div>
                </div>
              </div>
              
              <div class="form-group mb-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" value="1" id="export-filtered-only">
                  <label class="form-check-label" for="export-filtered-only">
                    Export only filtered results
                  </label>
                </div>
              </div>
              
              <div class="alert alert-info">
                <strong>${resultsToExport.length} profiles</strong> will be exported.
                <span id="filtered-count-message" style="display: none;">
                  After filtering: <strong id="filtered-count">0</strong> profiles.
                </span>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirm-export">Export CSV</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(exportModal);
      
      // Add event listeners for export modal
      document.getElementById('export-filtered-only').addEventListener('change', function() {
        const filteredCountElement = document.getElementById('filtered-count');
        const filteredMessageElement = document.getElementById('filtered-count-message');
        
        if (this.checked) {
          // Count how many profiles pass current filters
          const filteredCount = resultsToExport.filter(profilePassesFilter).length;
          filteredCountElement.textContent = filteredCount;
          filteredMessageElement.style.display = 'inline';
        } else {
          filteredMessageElement.style.display = 'none';
        }
      });
      
      // Add event listener for export button
      document.getElementById('confirm-export').addEventListener('click', function() {
        // Get filename
        const filename = document.getElementById('export-filename').value;
        
        // Get selected columns
        const columns = [];
        document.querySelectorAll('.export-columns-container input:checked').forEach(checkbox => {
          switch(checkbox.value) {
            case 'name':
              columns.push({ key: 'name', header: 'Full Name' }); 
              break;
            case 'title':
              columns.push({ key: 'title', header: 'Title' });
              break;
            case 'company':
              columns.push({ 
                key: 'company', 
                header: 'LinkedIn ID',
                getValue: (profile) => {
                  const url = profile.profileUrl || '';
                  if (url.includes('/in/')) {
                    return url.split('/in/')[1].split('/')[0];
                  }
                  return profile.linkedinId || '';
                }
              });
              break;
            case 'isAnonymous':
              columns.push({ 
                key: 'isAnonymous', 
                header: 'Is Anonymous',
                getValue: (profile) => profile.isAnonymous ? 'Yes' : 'No'
              });
              break;
          }
        });
        
        // Check if we should filter
        const exportFilteredOnly = document.getElementById('export-filtered-only').checked;
        
        // Build export options
        const options = {
          filename,
          columns,
          skipModal: true // Prevent recursive modal showing
        };
        
        // Add filter if needed
        if (exportFilteredOnly) {
          options.filter = profilePassesFilter;
        }
        
        // Close the modal
        const modalInstance = bootstrap.Modal.getInstance(exportModal);
        modalInstance.hide();
        
        // Do the export
        exportToCsv(resultsToExport, options);
      });
    } else {
      // Update existing modal if needed
      document.getElementById('export-filename').value = `linkedin-search-${new Date().toISOString().split('T')[0]}.csv`;
      
      const countElement = exportModal.querySelector('.alert-info strong');
      if (countElement) {
        countElement.textContent = `${resultsToExport.length} profiles`;
      }
      
      // Reset filtered message
      document.getElementById('filtered-count-message').style.display = 'none';
      document.getElementById('export-filtered-only').checked = false;
    }
    
    // Show the modal
    const modalInstance = new bootstrap.Modal(exportModal);
    modalInstance.show();
  }

  // ===== HISTORY FUNCTIONS =====

  // Save search to history
  function saveSearchToHistory(results, label) {
    try {
      const newHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        label: label,
        searchMethod: state.searchMethod,
        searchInput: state.searchInput,
        maxPages: state.maxPages,
        resultsCount: results.length,
        results: results
      };
      
      const updatedHistory = [newHistoryEntry, ...state.searchHistory];
      
      // Save to localStorage
      localStorage.setItem('linkedInSearchHistory', JSON.stringify(updatedHistory));
      state.searchHistory = updatedHistory;
      renderHistoryTable();
      
      showToast(`Search saved to history as "${label}"`, 'success');
    } catch (error) {
      console.error('Error saving search to history:', error);
      showToast('Error saving search to history. LocalStorage may be full.', 'error');
    }
  }

  // View a historical search from history
  function viewHistoricalSearch(historyItem) {
    state.searchResults = historyItem.results;
    state.resultsCount = historyItem.resultsCount;
    state.viewingHistorical = true;
    state.viewingHistoryId = historyItem.id;
    
    // Show filters if we have results
    if (elements.resultsFilters && state.searchResults.length > 0) {
      elements.resultsFilters.style.display = 'block';
    }
    
    // Reset filters when viewing historical results
    state.filters = {
      name: '',
      title: '',
      location: '',
      connectionDegree: ''
    };
    
    // Update filter UI elements if they exist
    if (elements.nameFilter) elements.nameFilter.value = '';
    if (elements.titleFilter) elements.titleFilter.value = '';
    if (elements.locationFilter) elements.locationFilter.value = '';
    if (elements.connectionFilter) elements.connectionFilter.value = '';
    
    renderResultsTable();
    toggleHistoricalView();
    
    showToast(`Viewing historical search: ${historyItem.label}`, 'info');
  }

  // Delete a search from history
  function deleteHistoryItem(id) {
    if (window.confirm('Are you sure you want to delete this search history item?')) {
      try {
        const updatedHistory = state.searchHistory.filter(item => item.id !== id);
        localStorage.setItem('linkedInSearchHistory', JSON.stringify(updatedHistory));
        state.searchHistory = updatedHistory;
        
        // If currently viewing the deleted item, clear results
        if (state.viewingHistoryId === id) {
          state.searchResults = [];
          state.resultsCount = 0;
          state.viewingHistorical = false;
          state.viewingHistoryId = null;
          
          // Hide filters
          if (elements.resultsFilters) {
            elements.resultsFilters.style.display = 'none';
          }
          
          renderResultsTable();
          toggleHistoricalView();
        }
        
        renderHistoryTable();
        showToast('Search history item deleted', 'success');
      } catch (error) {
        console.error('Error deleting history item:', error);
        showToast('Error deleting history item', 'error');
      }
    }
  }

  // Clear all search history
  function clearAllHistory() {
    if (window.confirm('Are you sure you want to clear your entire search history? This cannot be undone.')) {
      try {
        localStorage.removeItem('linkedInSearchHistory');
        state.searchHistory = [];
        
        // Clear results view if showing historical data
        if (state.viewingHistorical) {
          state.searchResults = [];
          state.resultsCount = 0;
          state.viewingHistorical = false;
          state.viewingHistoryId = null;
          
          // Hide filters
          if (elements.resultsFilters) {
            elements.resultsFilters.style.display = 'none';
          }
          
          renderResultsTable();
          toggleHistoricalView();
        }
        
        renderHistoryTable();
        showToast('All search history cleared', 'info');
      } catch (error) {
        console.error('Error clearing history:', error);
        showToast('Error clearing history', 'error');
      }
    }
  }

  // Return to current results from historical view
  function returnToCurrentResults() {
    state.viewingHistorical = false;
    state.viewingHistoryId = null;
    renderResultsTable();
    toggleHistoricalView();
    
    // Reset filters
    state.filters = {
      name: '',
      title: '',
      location: '',
      connectionDegree: ''
    };
    
    // Update filter UI elements if they exist
    if (elements.nameFilter) elements.nameFilter.value = '';
    if (elements.titleFilter) elements.titleFilter.value = '';
    if (elements.locationFilter) elements.locationFilter.value = '';
    if (elements.connectionFilter) elements.connectionFilter.value = '';
    
    showToast('Returned to current search results', 'info');
  }
  
  // Automatically select API based on hostname
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? API_CONFIG.development
    : API_CONFIG.production;
  
  // State management object
  const state = {
    cookieString: '',
    cookieLabel: '',
    savedCookies: {},
    selectedCookieLabel: '',
    searchMethod: 'term', // 'term', 'url', or 'builder'
    searchInput: '',
    builderParams: {
      keywords: '',
      firstName: '',
      lastName: '',
      title: '',
      company: '',
      school: '',
      location: '',
      industry: '',
      connectionDegree: ''
    },
    generatedUrl: '',
    maxPages: 100,
    isSearching: false,
    statusMessages: [],
    progress: 0,
    currentUserInfo: null,
    searchResults: [],
    resultsCount: 0,
    searchHistory: [],
    viewingHistorical: false,
    viewingHistoryId: null,
    searchLabel: '',
    eventSource: null,
    darkMode: false,
    sortConfig: {
      column: null,
      direction: 'ascending'
    },
    filters: {
      name: '',
      title: '',
      location: '',
      connectionDegree: ''
    }
  };

  // DOM Elements cache
  const elements = {};

  // ===== INITIALIZATION FUNCTIONS =====

  // Initialize the application
  function init() {
    loadSavedCookies();
    loadSearchHistory();
    loadUserPreferences();
    cacheDOM();
    bindEvents();
    renderInitialState();
    setupTooltips();
    setupModals();
  }

  // Load saved cookies from localStorage
  function loadSavedCookies() {
    try {
      const cookies = localStorage.getItem('linkedInCookies');
      if (cookies) {
        state.savedCookies = JSON.parse(cookies);
      }
    } catch (error) {
      console.error('Error loading saved cookies:', error);
      showToast('Error loading saved cookies', 'error');
    }
  }

  // Load search history from localStorage
  function loadSearchHistory() {
    try {
      const history = localStorage.getItem('linkedInSearchHistory');
      if (history) {
        state.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
      showToast('Error loading search history', 'error');
    }
  }

  // Load user preferences from localStorage
  function loadUserPreferences() {
    try {
      // Load dark mode preference
      const darkMode = localStorage.getItem('linkedInSearchDarkMode');
      if (darkMode !== null) {
        state.darkMode = darkMode === 'true';
        updateDarkMode();
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  // Cache DOM elements
  function cacheDOM() {
    // Cookie management elements
    elements.cookieString = document.getElementById('cookie-string');
    elements.cookieLabel = document.getElementById('cookie-label');
    elements.saveCookieBtn = document.getElementById('save-cookie-btn');
    elements.cookieSelect = document.getElementById('cookie-select');
    elements.deleteCookieBtn = document.getElementById('delete-cookie-btn');
    elements.cookieHelpBtn = document.getElementById('cookie-help-btn');
    
    // Search criteria elements
    elements.searchTermRadio = document.getElementById('search-term-radio');
    elements.searchUrlRadio = document.getElementById('search-url-radio');
    elements.searchBuilderRadio = document.getElementById('search-builder-radio');
    elements.searchInput = document.getElementById('search-input');
    elements.searchInputLabel = document.getElementById('search-input-label');
    elements.standardSearchContainer = document.getElementById('standard-search-container');
    elements.searchBuilderContainer = document.getElementById('search-builder-container');
    elements.generateSearchUrlBtn = document.getElementById('generate-search-url-btn');
    
    // Search builder fields
    elements.searchKeywords = document.getElementById('search-keywords');
    elements.searchFirstName = document.getElementById('search-first-name');
    elements.searchLastName = document.getElementById('search-last-name');
    elements.searchTitle = document.getElementById('search-title');
    elements.searchCompany = document.getElementById('search-company');
    elements.searchSchool = document.getElementById('search-school');
    elements.searchLocation = document.getElementById('search-location');
    elements.searchIndustry = document.getElementById('search-industry');
    elements.searchConnections = document.getElementById('search-connections');
    
    elements.maxPages = document.getElementById('max-pages');
    elements.startSearchBtn = document.getElementById('start-search-btn');
    elements.cancelSearchBtn = document.getElementById('cancel-search-btn');
    
    // Progress elements
    elements.userInfo = document.getElementById('user-info');
    elements.progressBar = document.getElementById('progress-bar');
    elements.progressText = document.getElementById('progress-text');
    elements.statusMessages = document.getElementById('status-messages');
    
    // Results elements
    elements.resultsHeading = document.getElementById('results-heading');
    elements.resultsCount = document.getElementById('results-count');
    elements.resultsTable = document.getElementById('results-table');
    elements.resultsTableHead = document.querySelector('#results-table thead tr');
    elements.resultsTableBody = document.getElementById('results-table-body');
    elements.exportCsvBtn = document.getElementById('export-csv-btn');
    elements.returnToCurrentBtn = document.getElementById('return-to-current-btn');
    elements.noResults = document.getElementById('no-results');
    elements.waitingMessage = document.getElementById('waiting-message');
    elements.resultsFilters = document.querySelector('.results-filters');
    
    // Filter elements
    elements.nameFilter = document.getElementById('name-filter');
    elements.titleFilter = document.getElementById('title-filter');
    elements.locationFilter = document.getElementById('location-filter');
    elements.connectionFilter = document.getElementById('connection-filter');
    
    // History elements
    elements.historyTable = document.getElementById('history-table');
    elements.historyTableBody = document.getElementById('history-table-body');
    elements.clearHistoryBtn = document.getElementById('clear-history-btn');
    elements.noHistory = document.getElementById('no-history');
    
    // Preference elements
    elements.darkModeToggle = document.getElementById('dark-mode-toggle');
  }

  // Bind event listeners
  function bindEvents() {
    // Cookie management events
    if (elements.saveCookieBtn) elements.saveCookieBtn.addEventListener('click', saveCookie);
    if (elements.cookieSelect) {
      elements.cookieSelect.addEventListener('change', function() {
        loadCookie(this.value);
      });
    }
    if (elements.deleteCookieBtn) elements.deleteCookieBtn.addEventListener('click', deleteCookie);
    if (elements.cookieHelpBtn) elements.cookieHelpBtn.addEventListener('click', showCookieHelpModal);
    
    // Search criteria events
    if (elements.searchTermRadio) {
      elements.searchTermRadio.addEventListener('change', function() {
        if (this.checked) {
          state.searchMethod = 'term';
          updateSearchInputDisplay();
        }
      });
    }
    
    if (elements.searchUrlRadio) {
      elements.searchUrlRadio.addEventListener('change', function() {
        if (this.checked) {
          state.searchMethod = 'url';
          updateSearchInputDisplay();
        }
      });
    }
    
    if (elements.searchBuilderRadio) {
      elements.searchBuilderRadio.addEventListener('change', function() {
        if (this.checked) {
          state.searchMethod = 'builder';
          updateSearchInputDisplay();
        }
      });
    }
    
    // Handle search builder
    if (elements.generateSearchUrlBtn) {
      elements.generateSearchUrlBtn.addEventListener('click', generateSearchUrlFromBuilder);
    }
    
    // Collect input from all builder fields
    const builderFields = [
      { element: elements.searchKeywords, property: 'keywords' },
      { element: elements.searchFirstName, property: 'firstName' },
      { element: elements.searchLastName, property: 'lastName' },
      { element: elements.searchTitle, property: 'title' },
      { element: elements.searchCompany, property: 'company' },
      { element: elements.searchSchool, property: 'school' },
      { element: elements.searchLocation, property: 'location' },
      { element: elements.searchIndustry, property: 'industry' },
      { element: elements.searchConnections, property: 'connectionDegree' }
    ];
    
    builderFields.forEach(field => {
      if (field.element) {
        field.element.addEventListener('input', function() {
          state.builderParams[field.property] = this.value;
        });
      }
    });
    
    if (elements.startSearchBtn) elements.startSearchBtn.addEventListener('click', startSearch);
    if (elements.cancelSearchBtn) elements.cancelSearchBtn.addEventListener('click', cancelSearch);
    
    // Results events
    if (elements.exportCsvBtn) {
      elements.exportCsvBtn.addEventListener('click', function() {
        exportToCsv();
      });
    }
    if (elements.returnToCurrentBtn) elements.returnToCurrentBtn.addEventListener('click', returnToCurrentResults);
    
    // Add event listeners for table sorting if headers exist
    if (elements.resultsTableHead) {
      const headers = elements.resultsTableHead.querySelectorAll('th');
      headers.forEach(header => {
        if (header.hasAttribute('data-column')) {
          header.addEventListener('click', function() {
            handleSort(header.getAttribute('data-column'));
          });
        }
      });
    }
    
    // Add filter event listeners
    const filterElements = [
      { element: elements.nameFilter, property: 'name' },
      { element: elements.titleFilter, property: 'title' },
      { element: elements.locationFilter, property: 'location' },
      { element: elements.connectionFilter, property: 'connectionDegree' }
    ];
    
    filterElements.forEach(filter => {
      if (filter.element) {
        filter.element.addEventListener('input', function() {
          state.filters[filter.property] = this.value;
          applyFilters();
        });
      }
    });
    
    // History events
    if (elements.clearHistoryBtn) elements.clearHistoryBtn.addEventListener('click', clearAllHistory);
    
    // Preference events
    if (elements.darkModeToggle) {
      elements.darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Form input events to update state
    if (elements.cookieString) {
      elements.cookieString.addEventListener('input', function() {
        state.cookieString = this.value;
        updateButtonStates();
      });
    }
    
    if (elements.cookieLabel) {
      elements.cookieLabel.addEventListener('input', function() {
        state.cookieLabel = this.value;
        updateButtonStates();
      });
    }
    
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', function() {
        state.searchInput = this.value;
        updateButtonStates();
      });
    }
    
    if (elements.maxPages) {
      elements.maxPages.addEventListener('input', function() {
        state.maxPages = Math.min(100, Math.max(1, parseInt(this.value) || 1));
        this.value = state.maxPages; // Set the input value to the clamped value
      });
    }

    // Window events
    window.addEventListener('beforeunload', function(e) {
      // If a search is in progress, prompt for confirmation
      if (state.isSearching) {
        e.preventDefault();
        e.returnValue = 'You have a search in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }

  // Render the progress bar
  function renderProgressBar() {
    if (!elements.progressBar || !elements.progressText) return;
    
    elements.progressBar.style.width = `${state.progress}%`;
    elements.progressText.textContent = `${Math.round(state.progress)}%`;
  }

  // Render status messages
  function renderStatusMessages() {
    if (!elements.statusMessages) return;
    
    elements.statusMessages.innerHTML = '';
    
    if (state.statusMessages.length === 0) {
      elements.statusMessages.innerHTML = '<p class="no-messages">No messages yet. Start a search to see updates.</p>';
    } else {
      state.statusMessages.forEach((status, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message ${status.status === 'error' ? 'error' : ''}`;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'status-time';
        timeSpan.textContent = `[${new Date(status.timestamp).toLocaleTimeString()}]`;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'status-text';
        textSpan.textContent = status.message;
        
        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(textSpan);
        
        elements.statusMessages.appendChild(messageDiv);
      });
      
      // Scroll to bottom
      elements.statusMessages.scrollTop = elements.statusMessages.scrollHeight;
    }
  }

  // Render history table
  function renderHistoryTable() {
    if (!elements.historyTable || !elements.historyTableBody || !elements.noHistory || !elements.clearHistoryBtn) return;
    
    if (state.searchHistory.length === 0) {
      elements.historyTable.style.display = 'none';
      elements.noHistory.style.display = 'block';
      elements.clearHistoryBtn.style.display = 'none';
    } else {
      elements.historyTable.style.display = 'table';
      elements.noHistory.style.display = 'none';
      elements.clearHistoryBtn.style.display = 'inline-block';
      
      // Clear existing rows
      elements.historyTableBody.innerHTML = '';
      
      // Add rows for each history item
      state.searchHistory.forEach(item => {
        const row = document.createElement('tr');
        if (state.viewingHistoryId === item.id) {
          row.className = 'active-history';
        }
        
        // Label cell
        const labelCell = document.createElement('td');
        labelCell.textContent = item.label;
        row.appendChild(labelCell);
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(item.timestamp).toLocaleString();
        row.appendChild(dateCell);
        
        // Search criteria cell
        const criteriaCell = document.createElement('td');
        criteriaCell.textContent = item.searchMethod === 'term' ? 
          `Term: "${item.searchInput}"` : 'URL Search';
        row.appendChild(criteriaCell);
        
        // Results count cell
        const countCell = document.createElement('td');
        countCell.textContent = item.resultsCount;
        row.appendChild(countCell);
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.className = 'history-item-actions';
        
        // View button
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', () => viewHistoricalSearch(item));
        actionsCell.appendChild(viewBtn);
        
        // Export button
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export';
        exportBtn.addEventListener('click', () => exportToCsv(item.results));
        actionsCell.appendChild(exportBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteHistoryItem(item.id));
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        
        elements.historyTableBody.appendChild(row);
      });
    }
  }

  // Toggle the display of historical view elements
  function toggleHistoricalView() {
    if (!elements.returnToCurrentBtn) return;
    
    if (state.viewingHistorical) {
      elements.returnToCurrentBtn.style.display = 'block';
      
      // If viewing historical results, update heading
      if (elements.resultsHeading) {
        const historyItem = state.searchHistory.find(item => item.id === state.viewingHistoryId);
        if (historyItem) {
          elements.resultsHeading.textContent = `Historical Results: ${historyItem.label || 'Unknown'}`;
        }
      }
    } else {
      elements.returnToCurrentBtn.style.display = 'none';
      
      // Reset heading if not viewing historical results
      if (elements.resultsHeading) {
        elements.resultsHeading.textContent = 'Search Results';
      }
    }
  }

  // Render the initial state
  function renderInitialState() {
    updateCookieSelect();
    updateButtonStates();
    updateSearchInputDisplay();
    renderProgressBar();
    renderStatusMessages();
    renderHistoryTable();
    toggleHistoricalView();
    
    // Initialize filter elements if they exist
    if (elements.nameFilter) {
      elements.nameFilter.value = state.filters.name;
    }
    if (elements.titleFilter) {
      elements.titleFilter.value = state.filters.title;
    }
    if (elements.locationFilter) {
      elements.locationFilter.value = state.filters.location;
    }
    if (elements.connectionFilter) {
      elements.connectionFilter.value = state.filters.connectionDegree;
    }
  }

  // Setup Bootstrap tooltips
  function setupTooltips() {
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
      });
    }
  }

  // Setup Bootstrap modals
  function setupModals() {
    // Make sure the cookieHelpModal is available
    const cookieHelpModal = document.getElementById('cookieHelpModal');
    if (cookieHelpModal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      // Create a Bootstrap modal instance
      window.cookieHelpModalInstance = new bootstrap.Modal(cookieHelpModal);
    }
  }

  // ===== UI UTILITY FUNCTIONS =====

  // Show cookie help modal
  function showCookieHelpModal() {
    if (window.cookieHelpModalInstance) {
      window.cookieHelpModalInstance.show();
    } else {
      alert("Cookie help information: Please open developer tools (F12), go to Application tab, select Cookies, and copy the li_at cookie value.");
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    updateDarkMode();
    
    // Save preference to localStorage
    localStorage.setItem('linkedInSearchDarkMode', state.darkMode);
  }

  // Update dark mode based on state
  function updateDarkMode() {
    if (state.darkMode) {
      document.body.classList.add('dark-theme');
      if (elements.darkModeToggle) {
        elements.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
      }
    } else {
      document.body.classList.remove('dark-theme');
      if (elements.darkModeToggle) {
        elements.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
      }
    }
  }

  // Update button states
  function updateButtonStates() {
    if (elements.saveCookieBtn) {
      elements.saveCookieBtn.disabled = state.isSearching || !state.cookieString || !state.cookieLabel;
    }
    if (elements.deleteCookieBtn) {
      elements.deleteCookieBtn.disabled = state.isSearching || !state.selectedCookieLabel;
    }
    
    // For start search button, check the search method
    let searchInputMissing = false;
    if (state.searchMethod === 'builder') {
      // For builder, at least one field must be filled
      searchInputMissing = Object.values(state.builderParams).every(value => !value);
    } else {
      // For term or URL, input field must be filled
      searchInputMissing = !state.searchInput;
    }
    
    if (elements.startSearchBtn) {
      elements.startSearchBtn.disabled = state.isSearching || !state.cookieString || searchInputMissing;
    }
    if (elements.cancelSearchBtn) {
      elements.cancelSearchBtn.disabled = !state.isSearching;
    }
    if (elements.exportCsvBtn) {
      elements.exportCsvBtn.disabled = state.isSearching || state.searchResults.length === 0;
    }
  }
  
  // Show toast notification
  function showToast(message, type = 'info') {
    // If Bootstrap toast functionality is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      // Create toast container if it doesn't exist
      let toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
      }
      
      // Create toast element
      const toastEl = document.createElement('div');
      toastEl.className = `toast align-items-center text-white bg-${type === 'info' ? 'primary' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'}`;
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('aria-live', 'assertive');
      toastEl.setAttribute('aria-atomic', 'true');
      
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      
      toastContainer.appendChild(toastEl);
      
      // Create and show the toast
      const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
      toast.show();
      
      // Remove the toast element after it's hidden
      toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
      });
    } else {
      // Fallback to console for environments without Bootstrap
      const consoleMethod = 
        type === 'info' ? console.info :
        type === 'success' ? console.log :
        type === 'warning' ? console.warn :
        console.error;
      
      consoleMethod(`[${type.toUpperCase()}] ${message}`);
      
      // Maybe show a basic alert for important messages
      if (type === 'error' || type === 'warning') {
        alert(`${type.toUpperCase()}: ${message}`);
      }
    }
  }

  // ===== COOKIE MANAGEMENT FUNCTIONS =====

  // Save a cookie to localStorage
  function saveCookie() {
    if (!state.cookieString.trim() || !state.cookieLabel.trim()) {
      showToast('Please provide both a cookie string and a label', 'warning');
      return;
    }
    
    // Validate cookie - at minimum look for li_at
    if (!validateCookieString(state.cookieString).valid) {
      showToast('Cookie appears to be invalid. Make sure it contains the li_at cookie.', 'warning');
      return;
    }
    
    const updatedCookies = {
      ...state.savedCookies,
      [state.cookieLabel]: state.cookieString
    };
    
    try {
      localStorage.setItem('linkedInCookies', JSON.stringify(updatedCookies));
      state.savedCookies = updatedCookies;
      state.selectedCookieLabel = state.cookieLabel;
      showToast(`Cookie saved with label: ${state.cookieLabel}`, 'success');
      state.cookieLabel = '';
      if (elements.cookieLabel) {
        elements.cookieLabel.value = '';
      }
      updateCookieSelect();
    } catch (error) {
      console.error('Error saving cookie:', error);
      showToast('Error saving cookie. LocalStorage may be full.', 'error');
    }
  }

  // Load a saved cookie
  function loadCookie(label) {
    if (state.savedCookies[label]) {
      state.cookieString = state.savedCookies[label];
      state.selectedCookieLabel = label;
      if (elements.cookieString) {
        elements.cookieString.value = state.cookieString;
      }
      updateButtonStates();
      showToast(`Loaded cookie: ${label}`, 'info');
    }
  }

  // Delete a saved cookie
  function deleteCookie() {
    if (!state.selectedCookieLabel) {
      showToast('Please select a cookie to delete', 'warning');
      return;
    }
    
    const cookieToDelete = state.selectedCookieLabel;
    const updatedCookies = { ...state.savedCookies };
    delete updatedCookies[state.selectedCookieLabel];
    
    try {
      localStorage.setItem('linkedInCookies', JSON.stringify(updatedCookies));
      state.savedCookies = updatedCookies;
      state.selectedCookieLabel = '';
      state.cookieString = '';
      if (elements.cookieString) {
        elements.cookieString.value = '';
      }
      showToast(`Cookie with label "${cookieToDelete}" deleted`, 'success');
      updateCookieSelect();
      updateButtonStates();
    } catch (error) {
      console.error('Error deleting cookie:', error);
      showToast('Error deleting cookie', 'error');
    }
  }

  // Update the cookie select dropdown
  function updateCookieSelect() {
    if (!elements.cookieSelect) return;
    
    // Clear the existing options except the placeholder
    while (elements.cookieSelect.options.length > 1) {
      elements.cookieSelect.remove(1);
    }
    
    // Add options for each saved cookie
    Object.keys(state.savedCookies).forEach(label => {
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      elements.cookieSelect.appendChild(option);
    });
    
    // Set the selected value
    if (state.selectedCookieLabel) {
      elements.cookieSelect.value = state.selectedCookieLabel;
    } else {
      elements.cookieSelect.selectedIndex = 0;
    }
  }

  // Validate that the cookie string contains required LinkedIn cookies
  function validateCookieString(cookieString) {
    if (!cookieString) {
      return { valid: false, message: 'Cookie string is empty' };
    }
    
    // Look for the essential LinkedIn auth cookie (li_at)
    const hasLiAt = cookieString.includes('li_at=') || 
                   cookieString.includes('"li_at"') ||
                   cookieString.match(/\bli_at\b/);
    
    if (!hasLiAt) {
      return { 
        valid: false, 
        message: 'Missing essential LinkedIn authentication cookie (li_at). Please make sure you\'re logged in to LinkedIn.'
      };
    }
    
    // Look for additional helpful cookies
    const hasJsessionId = cookieString.includes('JSESSIONID=') || 
                         cookieString.includes('"JSESSIONID"');
    
    const hasLidc = cookieString.includes('lidc=') ||
                   cookieString.includes('"lidc"');
    
    let cookieQuality = 'basic';
    if (hasJsessionId && hasLidc) {
      cookieQuality = 'excellent';
    } else if (hasJsessionId || hasLidc) {
      cookieQuality = 'good';
    }
    
    return { 
      valid: true, 
      message: `Cookie validation successful (${cookieQuality} quality)`,
      quality: cookieQuality
    };
  }

  // ===== SEARCH BUILDER FUNCTIONS =====

  // Update the search input display based on search method
  function updateSearchInputDisplay() {
    if (!elements.searchInputLabel || !elements.searchInput) return;
    
    // First update input label for standard search
    elements.searchInputLabel.textContent = state.searchMethod === 'term' 
      ? 'Search Term' 
      : 'LinkedIn Search URL';
    
    elements.searchInput.placeholder = state.searchMethod === 'term' 
      ? 'e.g., Software Engineer Fintech Hyderabad' 
      : 'e.g., https://www.linkedin.com/search/results/people/?keywords=...';
    
    // Toggle visibility of containers
    if (elements.standardSearchContainer && elements.searchBuilderContainer) {
      if (state.searchMethod === 'builder') {
        elements.standardSearchContainer.style.display = 'none';
        elements.searchBuilderContainer.style.display = 'block';
      } else {
        elements.standardSearchContainer.style.display = 'block';
        elements.searchBuilderContainer.style.display = 'none';
      }
    }
  }

  // Generate search URL from builder parameters
  function generateSearchUrlFromBuilder() {
    // Base URL for LinkedIn people search
    const baseUrl = 'https://www.linkedin.com/search/results/people/?';
    
    // Collect parameters that have values
    const params = new URLSearchParams();
    
    // Add basic search parameters
    if (state.builderParams.keywords) {
      params.append('keywords', state.builderParams.keywords);
    }
    
    // Add name parameters
    if (state.builderParams.firstName) {
      params.append('firstName', state.builderParams.firstName);
    }
    if (state.builderParams.lastName) {
      params.append('lastName', state.builderParams.lastName);
    }
    
    // Add job parameters
    if (state.builderParams.title) {
      params.append('title', state.builderParams.title);
    }
    if (state.builderParams.company) {
      params.append('company', state.builderParams.company);
    }
    
    // Add school parameter
    if (state.builderParams.school) {
      params.append('school', state.builderParams.school);
    }
    
    // Add location parameter
    if (state.builderParams.location) {
      params.append('geoUrn', `["${state.builderParams.location}"]`);
    }
    
    // Add industry parameter
    if (state.builderParams.industry) {
      params.append('industryUrn', `["${state.builderParams.industry}"]`);
    }
    
    // Add connection degree parameter
    if (state.builderParams.connectionDegree) {
      params.append('network', `["${state.builderParams.connectionDegree}"]`);
    }
    
    // Other optional parameters
    params.append('origin', 'FACETED_SEARCH');
    
    // Construct the full URL
    const searchUrl = baseUrl + params.toString();
    
    // Update the state and UI
    state.generatedUrl = searchUrl;
    state.searchInput = searchUrl;
    state.searchMethod = 'url';
    
    // Update UI to reflect the change
    if (elements.searchUrlRadio && elements.searchInput) {
      elements.searchUrlRadio.checked = true;
      elements.searchInput.value = searchUrl;
      updateSearchInputDisplay();
    }
    
    // Show a success message
    showToast('Search URL generated successfully', 'success');
    
    return searchUrl;
  }

  // ===== SEARCH FUNCTIONS =====

  // Start a search
  function startSearch() {
    // Get search input based on search method
    let searchInputToUse = '';
    
    if (state.searchMethod === 'builder') {
      // Generate URL from builder
      searchInputToUse = generateSearchUrlFromBuilder();
    } else {
      searchInputToUse = state.searchInput.trim();
    }
    
    if (!state.cookieString.trim()) {
      showToast('Please provide a LinkedIn cookie string', 'warning');
      return;
    }
    
    if (!searchInputToUse) {
      showToast('Please provide search criteria', 'warning');
      return;
    }
    
    // Validate the cookie string
    const cookieValidation = validateCookieString(state.cookieString);
    if (!cookieValidation.valid) {
      showToast(`Cookie validation failed: ${cookieValidation.message}`, 'error');
      addStatusMessage(`Cookie validation failed: ${cookieValidation.message}`, 'error');
      return;
    } else {
      // Show cookie quality information
      if (cookieValidation.quality !== 'excellent') {
        addStatusMessage(`Cookie validation passed with ${cookieValidation.quality} quality. Some additional cookies may improve results.`, 'info');
      } else {
        addStatusMessage(`Cookie validation passed with excellent quality.`, 'info');
      }
    }
    
    // Reset state for new search
    state.isSearching = true;
    state.statusMessages = [];
    state.progress = 0;
    state.searchResults = [];
    state.resultsCount = 0;
    state.currentUserInfo = null;
    state.viewingHistorical = false;
    state.viewingHistoryId = null;
    
    // Reset filters
    state.filters = {
      name: '',
      title: '',
      location: '',
      connectionDegree: ''
    };
    
    // Update filter UI elements if they exist
    if (elements.nameFilter) elements.nameFilter.value = '';
    if (elements.titleFilter) elements.titleFilter.value = '';
    if (elements.locationFilter) elements.locationFilter.value = '';
    if (elements.connectionFilter) elements.connectionFilter.value = '';
    
    // Hide filters until we have results
    if (elements.resultsFilters) {
      elements.resultsFilters.style.display = 'none';
    }
    
    // Update UI
    updateButtonStates();
    renderProgressBar();
    renderStatusMessages();
    renderResultsTable();
    toggleHistoricalView();
    
    // Construct base API URL
    let apiUrl = `${API_BASE_URL}/linkedin-search?`;
    
    // Encode cookies parameter using proper encoding
    apiUrl += `cookies=${encodeURIComponent(state.cookieString)}`;
    
    // Add maxPages parameter with validation
    const maxPages = Math.min(100, Math.max(1, parseInt(state.maxPages) || 1));
    apiUrl += `&maxPages=${maxPages}`;
    
    // Add search parameter based on method
    if (state.searchMethod === 'term') {
      // For search terms, simple encoding is fine
      apiUrl += `&q=${encodeURIComponent(searchInputToUse)}`;
    } else {
      // For URLs, validate before sending
      try {
        // Check if it's a valid URL first
        const url = new URL(searchInputToUse);
        
        // Make sure it's a LinkedIn URL
        if (!url.hostname.includes('linkedin.com')) {
          throw new Error('Not a LinkedIn URL');
        }
        
        // If valid, add it as searchUrl parameter
        apiUrl += `&searchUrl=${encodeURIComponent(searchInputToUse)}`;
      } catch (e) {
        // Not a valid URL
        showToast('Please enter a valid LinkedIn search URL', 'warning');
        addStatusMessage('Invalid LinkedIn search URL provided', 'error');
        state.isSearching = false;
        updateButtonStates();
        return;
      }
    }
    
    // Log the final URL for debugging
    console.log('API URL:', apiUrl);
    
    // Add a status message for search start
    addStatusMessage('Search started. Connecting to LinkedIn...', 'info');
    
    // Create EventSource for SSE connection with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    function connectEventSource() {
      // Show connecting message if it's a retry
      if (retryCount > 0) {
        addStatusMessage(`Reconnecting to server (attempt ${retryCount})...`, 'info');
      }
      
      // Create new EventSource
      const eventSource = new EventSource(apiUrl);
      state.eventSource = eventSource;
      
      // Handle incoming events
      eventSource.onmessage = (event) => {
        try {
          if (event.data === ':heartbeat') {
            // Handle heartbeat message silently
            console.log('Received heartbeat from server');
            return;
          }
          
          const data = JSON.parse(event.data);
          console.log('SSE message:', data);
          
          // Reset retry count on successful message
          retryCount = 0;
          
          // Add status message (only if not heartbeat)
          if (data.message) {
            addStatusMessage(data.message || 'No message provided', data.status);
          }
          
          // Handle different status types
          switch (data.status) {
            case 'validated':
              if (data.userInfo) {
                state.currentUserInfo = data.userInfo;
                renderUserInfo();
                
                // Show user info in a toast
                const userName = data.userInfo.displayName || 'LinkedIn User';
                showToast(`Connected as: ${userName}`, 'success');
              }
              break;
              
            case 'extracting_progress':
              if (data.progress) {
                state.progress = data.progress;
                renderProgressBar();
                
                // If this includes profile data, show it
                if (data.currentProfile) {
                  // Update document title to show progress
                  document.title = `LinkedIn Search (${Math.round(data.progress)}%)`;
                }
              }
              break;
              
            case 'done':
              if (data.results && Array.isArray(data.results)) {
                state.searchResults = data.results;
                state.resultsCount = data.resultsCount || data.results.length;
                renderResultsTable();
                
                // Show filters if we have results
                if (elements.resultsFilters && state.searchResults.length > 0) {
                  elements.resultsFilters.style.display = 'block';
                }
                
                // Reset document title
                document.title = 'LinkedIn People Search & Export - Data Toolkit for Sheets';
                
                // Show completion toast
                showToast(`Search completed: Found ${state.resultsCount} profiles`, 'success');
                
                // Default search label if user doesn't provide one
                const searchTermForLabel = state.searchMethod === 'term' 
                  ? state.searchInput 
                  : (state.searchMethod === 'builder' ? 'Advanced Search' : 'URL Search');
                
                const defaultLabel = `${searchTermForLabel} - ${new Date().toLocaleDateString()}`;
                
                state.searchLabel = defaultLabel;
                
                // Show save dialog with modal if Bootstrap is available
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                  showSaveSearchModal(defaultLabel, data.results);
                } else {
                  // Fallback to prompt
                  setTimeout(() => {
                    const userLabel = prompt('Enter a label for this search (or cancel for default):', defaultLabel);
                    saveSearchToHistory(data.results, userLabel || defaultLabel);
                  }, 500);
                }
              }
              
              // Close the EventSource
              eventSource.close();
              state.eventSource = null;
              state.isSearching = false;
              updateButtonStates();
              break;
              
            case 'error':
              showToast(`Search Error: ${data.message}`, 'error');
              eventSource.close();
              state.eventSource = null;
              state.isSearching = false;
              updateButtonStates();
              break;
              
            case 'profile':
              // If a single profile is sent, add it to results
              if (data.profile) {
                // Avoid duplicates
                const existingIndex = state.searchResults.findIndex(
                  p => p.profileUrl === data.profile.profileUrl
                );
                
                if (existingIndex >= 0) {
                  // Update existing profile
                  state.searchResults[existingIndex] = { 
                    ...state.searchResults[existingIndex],
                    ...data.profile 
                  };
                } else {
                  // Add new profile
                  state.searchResults.push(data.profile);
                }
                
                // Update the results table without full re-render
                updateResultsTableWithProfile(data.profile);
                
                // Show filters if we have at least a few results
                if (elements.resultsFilters && state.searchResults.length >= 5 && elements.resultsFilters.style.display === 'none') {
                  elements.resultsFilters.style.display = 'block';
                }
                
                // Update result count
                state.resultsCount = state.searchResults.length;
                if (elements.resultsCount) {
                  elements.resultsCount.textContent = state.resultsCount;
                }
              }
              break;
              
            default:
              // Handle progress for page navigation
              if (data.status === 'navigating' && data.page) {
                // Update progress bar for page navigation
                const estimatedProgress = (data.page / state.maxPages) * 100;
                state.progress = Math.min(estimatedProgress, 99);
                renderProgressBar();
                
                // Update document title to show progress
                document.title = `LinkedIn Search - Page ${data.page}/${state.maxPages}`;
              }
              
              // Handle partial results reception
              if (data.pageResults && Array.isArray(data.pageResults) && data.pageResults.length > 0) {
                // Merge the page results into the main results array
                data.pageResults.forEach(profile => {
                  // Check if this profile already exists
                  const existingIndex = state.searchResults.findIndex(
                    p => p.profileUrl === profile.profileUrl
                  );
                  
                  if (existingIndex >= 0) {
                    // Update existing profile
                    state.searchResults[existingIndex] = { 
                      ...state.searchResults[existingIndex],
                      ...profile 
                    };
                  } else {
                    // Add new profile
                    state.searchResults.push(profile);
                  }
                });
                
                // Update the table
                renderResultsTable();
                
                // Show filters if we have at least a page of results
                if (elements.resultsFilters && state.searchResults.length >= 10 && elements.resultsFilters.style.display === 'none') {
                  elements.resultsFilters.style.display = 'block';
                }
                
                // Update result count
                state.resultsCount = state.searchResults.length;
                if (elements.resultsCount) {
                  elements.resultsCount.textContent = state.resultsCount;
                }
              }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error, event.data);
          addStatusMessage(`Error parsing server message: ${error.message}`, 'error');
        }
      };
      
      // Handle EventSource errors with retry logic
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        
        // Close the current connection
        eventSource.close();
        
        // Decide whether to retry
        if (retryCount < maxRetries && state.isSearching) {
          retryCount++;
          addStatusMessage(`Connection to server lost. Retrying (${retryCount}/${maxRetries})...`, 'warning');
          
          // Wait before retrying (exponential backoff)
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setTimeout(connectEventSource, retryDelay);
        } else {
          // No more retries or search was cancelled
          addStatusMessage('Connection to server failed or was terminated. Please try again.', 'error');
          showToast('Connection to server failed. Search stopped.', 'error');
          
          state.eventSource = null;
          state.isSearching = false;
          updateButtonStates();
        }
      };
    }
    
    // Start the initial connection
    connectEventSource();
  }

  // Show modal for saving search to history
  function showSaveSearchModal(defaultLabel, results) {
    // Create modal if it doesn't exist
    let saveModal = document.getElementById('saveSearchModal');
    
    if (!saveModal) {
      // Create the modal structure
      saveModal = document.createElement('div');
      saveModal.className = 'modal fade';
      saveModal.id = 'saveSearchModal';
      saveModal.setAttribute('tabindex', '-1');
      saveModal.setAttribute('aria-labelledby', 'saveSearchModalLabel');
      saveModal.setAttribute('aria-hidden', 'true');
      
      saveModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="saveSearchModalLabel">Save Search Results</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="search-label">Enter a label for this search:</label>
                <input type="text" class="form-control" id="search-label-input" value="${defaultLabel}">
              </div>
              <p class="mt-3">
                <strong>${results.length} profiles</strong> will be saved to your search history.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirm-save-search">Save Search</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(saveModal);
      
      // Add event listener for save button
      document.getElementById('confirm-save-search').addEventListener('click', function() {
        const label = document.getElementById('search-label-input').value || defaultLabel;
        saveSearchToHistory(results, label);
        
        // Hide modal
        const modalInstance = bootstrap.Modal.getInstance(saveModal);
        modalInstance.hide();
      });
    } else {
      // Update existing modal content
      document.getElementById('search-label-input').value = defaultLabel;
      const countElement = saveModal.querySelector('.modal-body p strong');
      if (countElement) {
        countElement.textContent = `${results.length} profiles`;
      }
    }
    
    // Show the modal
    const modalInstance = new bootstrap.Modal(saveModal);
    modalInstance.show();
  }

  // Cancel an ongoing search
  function cancelSearch() {
    if (state.eventSource) {
      addStatusMessage('Cancelling search...', 'warning');
      
      // Close the EventSource connection
      state.eventSource.close();
      state.eventSource = null;
      
      addStatusMessage('Search cancelled by user', 'cancelled');
      showToast('Search cancelled', 'warning');
      
      state.isSearching = false;
      updateButtonStates();
      
      // Reset document title
      document.title = 'LinkedIn People Search & Export - Data Toolkit for Sheets';
    }
  }

  // ===== RESULTS MANAGEMENT FUNCTIONS =====

  // Add a status message
  function addStatusMessage(message, status = 'info') {
    state.statusMessages.push({ 
      timestamp: new Date().toISOString(),
      message: message,
      status: status
    });
    
    renderStatusMessages();
  }

  // Sort function for results
  function handleSort(column) {
    // If clicked on the same column, toggle direction
    if (state.sortConfig.column === column) {
      state.sortConfig.direction = state.sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    } else {
      // Otherwise, switch to the new column with ascending direction
      state.sortConfig.column = column;
      state.sortConfig.direction = 'ascending';
    }
    
    // Render the sorted table
    renderResultsTable();
    
    // Update sort indicator on header
    updateSortIndicator();
  }
  
  // Update sort indicator on table header
  function updateSortIndicator() {
    if (!elements.resultsTableHead) return;
    
    // First remove all sort indicators
    const headers = elements.resultsTableHead.querySelectorAll('th');
    headers.forEach(header => {
      header.classList.remove('sorted-asc', 'sorted-desc');
      
      // Remove existing indicators
      const icons = header.querySelectorAll('.sort-icon');
      icons.forEach(icon => icon.remove());
    });
    
    // If we have a sort column, add the indicator
    if (state.sortConfig.column) {
      const activeHeader = Array.from(headers).find(h => 
        h.getAttribute('data-column') === state.sortConfig.column
      );
      
      if (activeHeader) {
        // Add class for styling
        activeHeader.classList.add(
          state.sortConfig.direction === 'ascending' ? 'sorted-asc' : 'sorted-desc'
        );
        
        // Add icon
        const icon = document.createElement('i');
        icon.className = `fas fa-sort-${state.sortConfig.direction === 'ascending' ? 'up' : 'down'} sort-icon ml-1`;
        activeHeader.appendChild(icon);
      }
    }
  }
  
  // Apply filters to search results
  function applyFilters() {
    // Render table which will apply the current filters
    renderResultsTable();
    
    // Update filtered count
    if (!elements.resultsTableBody || !elements.resultsCount) return;
    
    const filteredCount = elements.resultsTableBody.querySelectorAll('tr:not(.hidden)').length;
    elements.resultsCount.textContent = `${filteredCount} (filtered from ${state.searchResults.length})`;
  }
  
  // Determine if a profile passes the filter
  function profilePassesFilter(profile) {
    const filters = state.filters;
    
    // Check each filter
    if (filters.name && !profile.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    
    if (filters.title && !profile.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false;
    }
    
    if (filters.location && !profile.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    if (filters.connectionDegree && !profile.connectionDegree.toLowerCase().includes(filters.connectionDegree.toLowerCase())) {
      return false;
    }
    
    return true;
  }

  // Update results table with a single profile
  function updateResultsTableWithProfile(profile) {
    if (!elements.resultsTable || !elements.resultsTableBody) return;
    
    // First check if results table is visible
    if (elements.resultsTable.style.display !== 'table') {
      elements.resultsTable.style.display = 'table';
      if (elements.waitingMessage) elements.waitingMessage.style.display = 'none';
      if (elements.noResults) elements.noResults.style.display = 'none';
    }
    
    // Check if we already have this profile in the table
    const existingRow = Array.from(elements.resultsTableBody.querySelectorAll('tr')).find(row => {
      const link = row.querySelector('a[href]');
      return link && link.href === profile.profileUrl;
    });
    
    if (existingRow) {
      // Update existing row
      const cells = existingRow.querySelectorAll('td');
      if (cells[0]) cells[0].textContent = profile.name || 'N/A';
      if (cells[1]) cells[1].textContent = profile.title || 'N/A';
      if (cells[2]) cells[2].textContent = profile.location || 'N/A';
      if (cells[3]) cells[3].textContent = profile.connectionDegree || 'N/A';
      return;
    }
    
    // If we reach here, we need to add a new row
    const row = document.createElement('tr');
    
    // Name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = profile.name || 'N/A';
    row.appendChild(nameCell);
    
    // Title cell
    const titleCell = document.createElement('td');
    titleCell.textContent = profile.title || 'N/A';
    row.appendChild(titleCell);
    
    // Location cell
    const locationCell = document.createElement('td');
    locationCell.textContent = profile.location || 'N/A';
    row.appendChild(locationCell);
    
    // Connection degree cell
    const degreeCell = document.createElement('td');
    degreeCell.textContent = profile.connectionDegree || 'N/A';
    row.appendChild(degreeCell);
    
    // Profile URL cell
    const urlCell = document.createElement('td');
    if (profile.profileUrl) {
      const link = document.createElement('a');
      link.href = profile.profileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'View Profile';
      urlCell.appendChild(link);
    } else {
      urlCell.textContent = 'N/A';
    }
    row.appendChild(urlCell);
    
    // Add animation class
    row.classList.add('new-profile');
    
    // Add to table
    elements.resultsTableBody.appendChild(row);
    
    // Remove animation class after animation completes
    setTimeout(() => {
      row.classList.remove('new-profile');
    }, 2000);
  }

  // Initialize the app
  init();

  // Render results table
  function renderResultsTable() {
    if (!elements.resultsTable || !elements.resultsTableBody) return;
    
    // Clear existing rows
    elements.resultsTableBody.innerHTML = '';
    
    // Show/hide appropriate elements
    if (state.searchResults.length === 0) {
      elements.resultsTable.style.display = 'none';
      
      if (state.isSearching) {
        if (elements.waitingMessage) elements.waitingMessage.style.display = 'block';
        if (elements.noResults) elements.noResults.style.display = 'none';
      } else {
        if (elements.waitingMessage) elements.waitingMessage.style.display = 'none';
        if (elements.noResults) elements.noResults.style.display = 'block';
      }
      
      // Update results count
      if (elements.resultsCount) {
        elements.resultsCount.textContent = '0';
      }
      
      return;
    }
    
    // Apply sorting if a column is selected
    let resultsToDisplay = [...state.searchResults];
    if (state.sortConfig.column) {
      resultsToDisplay.sort((a, b) => {
        const aValue = a[state.sortConfig.column] || '';
        const bValue = b[state.sortConfig.column] || '';
        
        // Compare values with case-insensitive string comparison
        const comparison = aValue.toString().localeCompare(bValue.toString(), undefined, { sensitivity: 'base' });
        
        // Reverse for descending order
        return state.sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    
    // Filter results
    resultsToDisplay = resultsToDisplay.filter(profilePassesFilter);
    
    // Show table and hide other elements
    elements.resultsTable.style.display = 'table';
    if (elements.waitingMessage) elements.waitingMessage.style.display = 'none';
    if (elements.noResults) elements.noResults.style.display = 'none';
    
    // Update results count
    if (elements.resultsCount) {
      const totalResults = state.searchResults.length;
      const filteredResults = resultsToDisplay.length;
      elements.resultsCount.textContent = 
        filteredResults === totalResults 
          ? filteredResults 
          : `${filteredResults} (filtered from ${totalResults})`;
    }
    
    // Render the rows
    resultsToDisplay.forEach(profile => {
      const row = document.createElement('tr');
      
      // Profile Image cell
      const imageCell = document.createElement('td');
      if (profile.profileImage && profile.profileImage.src) {
        const img = document.createElement('img');
        img.src = profile.profileImage.src;
        img.alt = profile.profileImage.alt || profile.name;
        img.width = profile.profileImage.width || 48;
        img.height = profile.profileImage.height || 48;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        imageCell.appendChild(img);
      } else {
        // Fallback for no image
        imageCell.textContent = 'N/A';
      }
      row.appendChild(imageCell);
      
      // Name cell
      const nameCell = document.createElement('td');
      nameCell.textContent = profile.name || 'LinkedIn Member';
      row.appendChild(nameCell);
      
      // Title cell
      const titleCell = document.createElement('td');
      titleCell.textContent = profile.title || 'N/A';
      row.appendChild(titleCell);
      
      // Location cell - improve location parsing
      const locationCell = document.createElement('td');
      let formattedLocation = profile.location || 'N/A';
      
      // Try to parse more specific location information
      const locationParts = formattedLocation.split(',').map(part => part.trim());
      if (locationParts.length > 1) {
        // Typically, the format is "City, Country/Region"
        // Or "City, State, Country"
        formattedLocation = locationParts.length > 2 
          ? `${locationParts[0]}, ${locationParts[locationParts.length - 1]}` 
          : formattedLocation;
      }
      
      locationCell.textContent = formattedLocation;
      row.appendChild(locationCell);
      
      // Connection degree cell
      const degreeCell = document.createElement('td');
      degreeCell.textContent = profile.connectionDegree || 'N/A';
      row.appendChild(degreeCell);
      
      // Profile URL cell
      const urlCell = document.createElement('td');
      if (profile.profileUrl) {
        const link = document.createElement('a');
        link.href = profile.profileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'View Profile';
        urlCell.appendChild(link);
      } else {
        urlCell.textContent = 'N/A';
      }
      row.appendChild(urlCell);
      
      // Add to table body
      elements.resultsTableBody.appendChild(row);
    });
    
    // Update sort indicator
    updateSortIndicator();
  }

  // Render the user info
  function renderUserInfo() {
    if (!elements.userInfo) return;
    
    if (state.currentUserInfo && state.currentUserInfo.displayName) {
      // Create HTML for user info
      let userInfoHTML = `<p>Logged in as: <strong>`;
      
      // Add profile link if available
      if (state.currentUserInfo.profileUrl) {
        userInfoHTML += `<a href="${state.currentUserInfo.profileUrl}" target="_blank" rel="noopener noreferrer">`;
      }
      
      userInfoHTML += `${state.currentUserInfo.displayName}`;
      
      if (state.currentUserInfo.profileUrl) {
        userInfoHTML += `</a>`;
      }
      
      userInfoHTML += `</strong></p>`;
      
      // Set the HTML and show the element
      elements.userInfo.innerHTML = userInfoHTML;
      elements.userInfo.style.display = 'block';
    } else {
      // Hide user info if no valid data
      elements.userInfo.style.display = 'none';
    }
  }
});