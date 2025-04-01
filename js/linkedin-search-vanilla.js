// LinkedIn Search Component - Vanilla JavaScript Version
document.addEventListener('DOMContentLoaded', function() {
  // API Configuration
  const API_BASE_URL = 'https://linkedin-scraper-backend-772545827002.asia-south1.run.app/api';
  
  // State management object
  const state = {
    cookieString: '',
    cookieLabel: '',
    savedCookies: {},
    selectedCookieLabel: '',
    searchMethod: 'term', // 'term' or 'url'
    searchInput: '',
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
    eventSource: null
  };

  // DOM Elements cache
  const elements = {};

  // Initialize the application
  function init() {
    loadSavedCookies();
    loadSearchHistory();
    cacheDOM();
    bindEvents();
    renderInitialState();
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
    }
  }

  // Cache DOM elements for better performance
  function cacheDOM() {
    // Cookie management elements
    elements.cookieString = document.getElementById('cookie-string');
    elements.cookieLabel = document.getElementById('cookie-label');
    elements.saveCookieBtn = document.getElementById('save-cookie-btn');
    elements.cookieSelect = document.getElementById('cookie-select');
    elements.deleteCookieBtn = document.getElementById('delete-cookie-btn');
    
    // Search criteria elements
    elements.searchTermRadio = document.getElementById('search-term-radio');
    elements.searchUrlRadio = document.getElementById('search-url-radio');
    elements.searchInput = document.getElementById('search-input');
    elements.searchInputLabel = document.getElementById('search-input-label');
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
    elements.resultsTableBody = document.getElementById('results-table-body');
    elements.exportCsvBtn = document.getElementById('export-csv-btn');
    elements.returnToCurrentBtn = document.getElementById('return-to-current-btn');
    elements.noResults = document.getElementById('no-results');
    elements.waitingMessage = document.getElementById('waiting-message');
    
    // History elements
    elements.historyTable = document.getElementById('history-table');
    elements.historyTableBody = document.getElementById('history-table-body');
    elements.clearHistoryBtn = document.getElementById('clear-history-btn');
    elements.noHistory = document.getElementById('no-history');
  }

  // Bind event listeners
  function bindEvents() {
    // Cookie management events
    elements.saveCookieBtn.addEventListener('click', saveCookie);
    elements.cookieSelect.addEventListener('change', function() {
      loadCookie(this.value);
    });
    elements.deleteCookieBtn.addEventListener('click', deleteCookie);
    
    // Search criteria events
    elements.searchTermRadio.addEventListener('change', function() {
      if (this.checked) {
        state.searchMethod = 'term';
        updateSearchInputLabel();
      }
    });
    
    elements.searchUrlRadio.addEventListener('change', function() {
      if (this.checked) {
        state.searchMethod = 'url';
        updateSearchInputLabel();
      }
    });
    
    elements.startSearchBtn.addEventListener('click', startSearch);
    elements.cancelSearchBtn.addEventListener('click', cancelSearch);
    
    // Results events
    elements.exportCsvBtn.addEventListener('click', function() {
      exportToCsv();
    });
    elements.returnToCurrentBtn.addEventListener('click', returnToCurrentResults);
    
    // History events
    elements.clearHistoryBtn.addEventListener('click', clearAllHistory);
    
    // Form input events to update state
    elements.cookieString.addEventListener('input', function() {
      state.cookieString = this.value;
      updateButtonStates();
    });
    
    elements.cookieLabel.addEventListener('input', function() {
      state.cookieLabel = this.value;
      updateButtonStates();
    });
    
    elements.searchInput.addEventListener('input', function() {
      state.searchInput = this.value;
      updateButtonStates();
    });
    
    elements.maxPages.addEventListener('input', function() {
      state.maxPages = Math.min(100, Math.max(1, parseInt(this.value) || 1));
      this.value = state.maxPages; // Set the input value to the clamped value
    });
  }

  // Render the initial state of the application
  function renderInitialState() {
    updateCookieSelect();
    updateButtonStates();
    updateSearchInputLabel();
    renderProgressBar();
    renderStatusMessages();
    renderHistoryTable();
    toggleHistoricalView();
  }

  // Save a cookie to localStorage
  function saveCookie() {
    if (!state.cookieString.trim() || !state.cookieLabel.trim()) {
      alert('Please provide both a cookie string and a label');
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
      alert(`Cookie saved with label: ${state.cookieLabel}`);
      state.cookieLabel = '';
      elements.cookieLabel.value = '';
      updateCookieSelect();
    } catch (error) {
      console.error('Error saving cookie:', error);
      alert('Error saving cookie. LocalStorage may be full.');
    }
  }

  // Load a saved cookie
  function loadCookie(label) {
    if (state.savedCookies[label]) {
      state.cookieString = state.savedCookies[label];
      state.selectedCookieLabel = label;
      elements.cookieString.value = state.cookieString;
      updateButtonStates();
    }
  }

  // Delete a saved cookie
  function deleteCookie() {
    if (!state.selectedCookieLabel) {
      alert('Please select a cookie to delete');
      return;
    }
    
    const updatedCookies = { ...state.savedCookies };
    delete updatedCookies[state.selectedCookieLabel];
    
    try {
      localStorage.setItem('linkedInCookies', JSON.stringify(updatedCookies));
      state.savedCookies = updatedCookies;
      state.selectedCookieLabel = '';
      state.cookieString = '';
      elements.cookieString.value = '';
      alert(`Cookie with label "${state.selectedCookieLabel}" deleted`);
      updateCookieSelect();
      updateButtonStates();
    } catch (error) {
      console.error('Error deleting cookie:', error);
    }
  }

  // Update the cookie select dropdown
  function updateCookieSelect() {
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

  // Update the label for the search input field
  function updateSearchInputLabel() {
    elements.searchInputLabel.textContent = state.searchMethod === 'term' 
      ? 'Search Term' 
      : 'LinkedIn Search URL';
    
    elements.searchInput.placeholder = state.searchMethod === 'term' 
      ? 'e.g., Software Engineer Fintech London' 
      : 'e.g., https://www.linkedin.com/search/results/people/?keywords=...';
  }

  // Update the enabled/disabled state of buttons
  function updateButtonStates() {
    elements.saveCookieBtn.disabled = state.isSearching || !state.cookieString || !state.cookieLabel;
    elements.deleteCookieBtn.disabled = state.isSearching || !state.selectedCookieLabel;
    elements.startSearchBtn.disabled = state.isSearching || !state.cookieString || !state.searchInput;
    elements.cancelSearchBtn.disabled = !state.isSearching;
    elements.exportCsvBtn.disabled = state.isSearching || state.searchResults.length === 0;
  }

// Validate that the cookie string contains required LinkedIn cookies
function validateCookieString(cookieString) {
  if (!cookieString) {
    return { valid: false, message: 'Cookie string is empty' };
  }
  
  // Skip detailed validation and trust the backend
  return { valid: true };
}

function startSearch() {
  if (!state.cookieString.trim()) {
    alert('Please provide a LinkedIn cookie string');
    return;
  }
  
  if (!state.searchInput.trim()) {
    alert('Please provide a search term or URL');
    return;
  }
  
  // Validate the cookie string
  const cookieValidation = validateCookieString(state.cookieString);
  if (!cookieValidation.valid) {
    alert(`Cookie validation failed: ${cookieValidation.message}`);
    addStatusMessage(`Cookie validation failed: ${cookieValidation.message}`, 'error');
    return;
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
  
  // Update UI
  updateButtonStates();
  renderProgressBar();
  renderStatusMessages();
  renderResultsTable();
  toggleHistoricalView();
  
  // Construct base API URL
  let apiUrl = `${API_BASE_URL}/linkedin-search?`;
  
  // Add cookies parameter
  apiUrl += `cookies=${state.cookieString}`;
  
  // Add maxPages parameter
  apiUrl += `&maxPages=${state.maxPages}`;
  
  // Add search parameter based on method
  if (state.searchMethod === 'term') {
    // For search terms, simple encoding is fine
    apiUrl += `&q=${encodeURIComponent(state.searchInput)}`;
  } else {
    // For URLs, validate before sending
    try {
      // Check if it's a valid URL first
      new URL(state.searchInput);
      // If valid, add it as searchUrl parameter
      apiUrl += `&searchUrl=${encodeURIComponent(state.searchInput)}`;
    } catch (e) {
      // Not a valid URL
      alert('Please enter a valid LinkedIn search URL');
      addStatusMessage('Invalid LinkedIn search URL provided', 'error');
      state.isSearching = false;
      updateButtonStates();
      return;
    }
  }
  
  // Log the final URL for debugging
  console.log('API URL:', apiUrl);
  
  // Create EventSource for SSE connection
  const eventSource = new EventSource(apiUrl);
  state.eventSource = eventSource;
  
  // Add a status message for search start
  addStatusMessage('Search started. Connecting to LinkedIn...', 'info');
  
  // Handle incoming events
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('SSE message:', data);
      
      // Add status message
      addStatusMessage(data.message || 'No message provided', data.status);
      
      // Handle different status types
      switch (data.status) {
        case 'validated':
          if (data.userInfo) {
            state.currentUserInfo = data.userInfo;
            renderUserInfo();
          }
          break;
          
        case 'extracting_progress':
          if (data.progress) {
            state.progress = data.progress;
            renderProgressBar();
          }
          break;
          
        case 'done':
          if (data.results && Array.isArray(data.results)) {
            state.searchResults = data.results;
            state.resultsCount = data.resultsCount || data.results.length;
            renderResultsTable();
            
            // Default search label if user doesn't provide one
            const defaultLabel = state.searchMethod === 'term' 
              ? `"${state.searchInput}" - ${new Date().toLocaleDateString()}`
              : `URL Search - ${new Date().toLocaleDateString()}`;
            
            state.searchLabel = defaultLabel;
            
            // Prompt for search label after completion
            setTimeout(() => {
              const userLabel = prompt('Enter a label for this search (or cancel for default):', defaultLabel);
              saveSearchToHistory(data.results, userLabel || defaultLabel);
            }, 500);
          }
          
          // Close the EventSource
          eventSource.close();
          state.eventSource = null;
          state.isSearching = false;
          updateButtonStates();
          break;
          
        case 'error':
          alert(`Search Error: ${data.message}`);
          eventSource.close();
          state.eventSource = null;
          state.isSearching = false;
          updateButtonStates();
          break;
          
        default:
          // Handle progress for page navigation
          if (data.status === 'navigating' && data.page) {
            // Estimate progress based on pages
            const estimatedProgress = (data.page / state.maxPages) * 100;
            state.progress = Math.min(estimatedProgress, 99);
            renderProgressBar();
          }
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error, event.data);
      addStatusMessage(`Error parsing server message: ${error.message}`, 'error');
    }
  };
  
  // Handle EventSource errors
  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    addStatusMessage('Connection to server failed or was terminated', 'error');
    
    eventSource.close();
    state.eventSource = null;
    state.isSearching = false;
    updateButtonStates();
  };
}

  // Add a status message
  function addStatusMessage(message, status = 'info') {
    state.statusMessages.push({ 
      timestamp: new Date().toISOString(),
      message: message,
      status: status
    });
    
    renderStatusMessages();
  }

  // Cancel an ongoing search
  function cancelSearch() {
    if (state.eventSource) {
      state.eventSource.close();
      state.eventSource = null;
      
      addStatusMessage('Search cancelled by user', 'cancelled');
      
      state.isSearching = false;
      updateButtonStates();
    }
  }

  // Export search results to CSV
  function exportToCsv(resultsToExport = state.searchResults) {
    if (!resultsToExport || resultsToExport.length === 0) {
      alert('No results to export');
      return;
    }
    
    try {
      // Get headers from first result object
      const headers = Object.keys(resultsToExport[0]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add data rows
      resultsToExport.forEach(profile => {
        const row = headers.map(header => {
          const value = profile[header] || '';
          // Escape value if it contains commas, quotes, or newlines
          return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',');
        
        csvContent += row + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const filename = `linkedin-search-${new Date().toISOString()}.csv`;
      
      // Use FileSaver.js if available, otherwise fallback to custom download
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
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error creating CSV file');
    }
  }

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
    } catch (error) {
      console.error('Error saving search to history:', error);
      alert('Error saving search to history. LocalStorage may be full.');
    }
  }

  // View a historical search from history
  function viewHistoricalSearch(historyItem) {
    state.searchResults = historyItem.results;
    state.resultsCount = historyItem.resultsCount;
    state.viewingHistorical = true;
    state.viewingHistoryId = historyItem.id;
    
    renderResultsTable();
    toggleHistoricalView();
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
          renderResultsTable();
          toggleHistoricalView();
        }
        
        renderHistoryTable();
      } catch (error) {
        console.error('Error deleting history item:', error);
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
          renderResultsTable();
          toggleHistoricalView();
        }
        
        renderHistoryTable();
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  }

  // Return to current results from historical view
  function returnToCurrentResults() {
    state.viewingHistorical = false;
    state.viewingHistoryId = null;
    renderResultsTable();
    toggleHistoricalView();
  }

  // Render the progress bar
  function renderProgressBar() {
    elements.progressBar.style.width = `${state.progress}%`;
    elements.progressText.textContent = `${Math.round(state.progress)}%`;
  }

  // Render the user info
  function renderUserInfo() {
    if (state.currentUserInfo) {
      elements.userInfo.innerHTML = `<p>Logged in as: <strong>${state.currentUserInfo.displayName}</strong></p>`;
      elements.userInfo.style.display = 'block';
    } else {
      elements.userInfo.style.display = 'none';
    }
  }

  // Render status messages
  function renderStatusMessages() {
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

  // Render results table
  function renderResultsTable() {
    // Update heading based on historical view
    if (state.viewingHistorical) {
      const historyItem = state.searchHistory.find(item => item.id === state.viewingHistoryId);
      elements.resultsHeading.textContent = `Historical Results: ${historyItem?.label || 'Unknown'}`;
    } else {
      elements.resultsHeading.textContent = 'Search Results';
    }
    
    // Update results count
    elements.resultsCount.textContent = state.resultsCount;
    
    // Show/hide appropriate elements
    if (state.searchResults.length === 0) {
      elements.resultsTable.style.display = 'none';
      
      if (state.isSearching) {
        elements.waitingMessage.style.display = 'block';
        elements.noResults.style.display = 'none';
      } else {
        elements.waitingMessage.style.display = 'none';
        elements.noResults.style.display = 'block';
      }
    } else {
      elements.resultsTable.style.display = 'table';
      elements.waitingMessage.style.display = 'none';
      elements.noResults.style.display = 'none';
      
      // Clear existing rows
      elements.resultsTableBody.innerHTML = '';
      
      // Add rows for each result
      state.searchResults.forEach((profile, index) => {
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
        
        elements.resultsTableBody.appendChild(row);
      });
    }
  }

  // Render history table
  function renderHistoryTable() {
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
    if (state.viewingHistorical) {
      elements.returnToCurrentBtn.style.display = 'block';
    } else {
      elements.returnToCurrentBtn.style.display = 'none';
    }
  }

  // Initialize the app
  init();
});