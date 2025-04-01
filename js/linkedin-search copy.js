console.log("Loading LinkedInSearch component definition...");
// LinkedInSearch component for LinkedIn People Search & Export
const LinkedInSearch = () => {
    // State for form inputs
    const [cookieString, setCookieString] = React.useState('');
    const [cookieLabel, setCookieLabel] = React.useState('');
    const [savedCookies, setSavedCookies] = React.useState({});
    const [selectedCookieLabel, setSelectedCookieLabel] = React.useState('');
    const [searchMethod, setSearchMethod] = React.useState('term'); // 'term' or 'url'
    const [searchInput, setSearchInput] = React.useState('');
    const [maxPages, setMaxPages] = React.useState(100);
    
    // State for search execution
    const [isSearching, setIsSearching] = React.useState(false);
    const [statusMessages, setStatusMessages] = React.useState([]);
    const [progress, setProgress] = React.useState(0);
    const [currentUserInfo, setCurrentUserInfo] = React.useState(null);
    
    // State for results
    const [searchResults, setSearchResults] = React.useState([]);
    const [resultsCount, setResultsCount] = React.useState(0);
    const [searchHistory, setSearchHistory] = React.useState([]);
    const [viewingHistorical, setViewingHistorical] = React.useState(false);
    const [viewingHistoryId, setViewingHistoryId] = React.useState(null);
    const [searchLabel, setSearchLabel] = React.useState('');
    
    // Refs
    const eventSourceRef = React.useRef(null);
    
    // Load saved cookies and search history from localStorage on component mount
    React.useEffect(() => {
      const loadSavedCookies = () => {
        try {
          const cookies = localStorage.getItem('linkedInCookies');
          if (cookies) {
            setSavedCookies(JSON.parse(cookies));
          }
        } catch (error) {
          console.error('Error loading saved cookies:', error);
        }
      };
      
      const loadSearchHistory = () => {
        try {
          const history = localStorage.getItem('linkedInSearchHistory');
          if (history) {
            setSearchHistory(JSON.parse(history));
          }
        } catch (error) {
          console.error('Error loading search history:', error);
        }
      };
      
      loadSavedCookies();
      loadSearchHistory();
    }, []);
    
    // Save a cookie to localStorage
    const saveCookie = () => {
      if (!cookieString.trim() || !cookieLabel.trim()) {
        alert('Please provide both a cookie string and a label');
        return;
      }
      
      const updatedCookies = {
        ...savedCookies,
        [cookieLabel]: cookieString
      };
      
      try {
        localStorage.setItem('linkedInCookies', JSON.stringify(updatedCookies));
        setSavedCookies(updatedCookies);
        setSelectedCookieLabel(cookieLabel);
        alert(`Cookie saved with label: ${cookieLabel}`);
        setCookieLabel('');
      } catch (error) {
        console.error('Error saving cookie:', error);
        alert('Error saving cookie. LocalStorage may be full.');
      }
    };
    
    // Load a saved cookie
    const loadCookie = (label) => {
      if (savedCookies[label]) {
        setCookieString(savedCookies[label]);
        setSelectedCookieLabel(label);
      }
    };
    
    // Delete a saved cookie
    const deleteCookie = () => {
      if (!selectedCookieLabel) {
        alert('Please select a cookie to delete');
        return;
      }
      
      const updatedCookies = { ...savedCookies };
      delete updatedCookies[selectedCookieLabel];
      
      try {
        localStorage.setItem('linkedInCookies', JSON.stringify(updatedCookies));
        setSavedCookies(updatedCookies);
        setSelectedCookieLabel('');
        setCookieString('');
        alert(`Cookie with label "${selectedCookieLabel}" deleted`);
      } catch (error) {
        console.error('Error deleting cookie:', error);
      }
    };
    
    // Start a LinkedIn search
    const startSearch = () => {
      if (!cookieString.trim()) {
        alert('Please provide a LinkedIn cookie string');
        return;
      }
      
      if (!searchInput.trim()) {
        alert('Please provide a search term or URL');
        return;
      }
      
      // Reset state for new search
      setIsSearching(true);
      setStatusMessages([]);
      setProgress(0);
      setSearchResults([]);
      setResultsCount(0);
      setCurrentUserInfo(null);
      setViewingHistorical(false);
      setViewingHistoryId(null);
      
      // Construct API URL
      let apiUrl = '/api/linkedin-search?';
      
      // Add cookies parameter (raw, unencoded)
      apiUrl += `cookies=${cookieString}`;
      
      // Add search parameter based on method
      if (searchMethod === 'term') {
        apiUrl += `&q=${searchInput}`;
      } else {
        apiUrl += `&searchUrl=${searchInput}`;
      }
      
      // Add maxPages parameter
      apiUrl += `&maxPages=${maxPages}`;
      
      // Create EventSource for SSE connection
      const eventSource = new EventSource(apiUrl);
      eventSourceRef.current = eventSource;
      
      // Handle incoming events
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE message:', data);
          
          // Add status message
          setStatusMessages(prev => [...prev, { 
            timestamp: new Date().toISOString(),
            message: data.message || 'No message provided',
            status: data.status
          }]);
          
          // Handle different status types
          switch (data.status) {
            case 'validated':
              if (data.userInfo) {
                setCurrentUserInfo(data.userInfo);
              }
              break;
              
            case 'extracting_progress':
              if (data.progress) {
                setProgress(data.progress);
              }
              break;
              
            case 'done':
              if (data.results && Array.isArray(data.results)) {
                setSearchResults(data.results);
                setResultsCount(data.resultsCount || data.results.length);
                
                // Default search label if user doesn't provide one
                const defaultLabel = searchMethod === 'term' 
                  ? `"${searchInput}" - ${new Date().toLocaleDateString()}`
                  : `URL Search - ${new Date().toLocaleDateString()}`;
                
                setSearchLabel(defaultLabel);
                
                // Prompt for search label after completion
                setTimeout(() => {
                  const userLabel = prompt('Enter a label for this search (or cancel for default):', defaultLabel);
                  saveSearchToHistory(data.results, userLabel || defaultLabel);
                }, 500);
              }
              
              // Close the EventSource
              eventSource.close();
              setIsSearching(false);
              break;
              
            case 'error':
              alert(`Search Error: ${data.message}`);
              eventSource.close();
              setIsSearching(false);
              break;
              
            default:
              // Handle progress for page navigation
              if (data.status === 'navigating' && data.page) {
                // Estimate progress based on pages
                const estimatedProgress = (data.page / maxPages) * 100;
                setProgress(Math.min(estimatedProgress, 99));
              }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error, event.data);
        }
      };
      
      // Handle EventSource errors
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setStatusMessages(prev => [...prev, { 
          timestamp: new Date().toISOString(),
          message: 'Connection to server failed or was terminated',
          status: 'error'
        }]);
        
        eventSource.close();
        setIsSearching(false);
      };
    };
    
    // Cancel an ongoing search
    const cancelSearch = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        
        setStatusMessages(prev => [...prev, { 
          timestamp: new Date().toISOString(),
          message: 'Search cancelled by user',
          status: 'cancelled'
        }]);
        
        setIsSearching(false);
      }
    };
    
    // Export search results to CSV
    const exportToCsv = (resultsToExport = searchResults) => {
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
        
        // Create and download file using FileSaver.js
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const filename = `linkedin-search-${new Date().toISOString()}.csv`;
        saveAs(blob, filename);
      } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Error creating CSV file');
      }
    };
    
    // Save search to history
    const saveSearchToHistory = (results, label) => {
      try {
        const newHistoryEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          label: label,
          searchMethod: searchMethod,
          searchInput: searchInput,
          maxPages: maxPages,
          resultsCount: results.length,
          results: results
        };
        
        const updatedHistory = [newHistoryEntry, ...searchHistory];
        
        // Save to localStorage
        localStorage.setItem('linkedInSearchHistory', JSON.stringify(updatedHistory));
        setSearchHistory(updatedHistory);
      } catch (error) {
        console.error('Error saving search to history:', error);
        alert('Error saving search to history. LocalStorage may be full.');
      }
    };
    
    // View a historical search from history
    const viewHistoricalSearch = (historyItem) => {
      setSearchResults(historyItem.results);
      setResultsCount(historyItem.resultsCount);
      setViewingHistorical(true);
      setViewingHistoryId(historyItem.id);
    };
    
    // Delete a search from history
    const deleteHistoryItem = (id) => {
      if (window.confirm('Are you sure you want to delete this search history item?')) {
        try {
          const updatedHistory = searchHistory.filter(item => item.id !== id);
          localStorage.setItem('linkedInSearchHistory', JSON.stringify(updatedHistory));
          setSearchHistory(updatedHistory);
          
          // If currently viewing the deleted item, clear results
          if (viewingHistoryId === id) {
            setSearchResults([]);
            setResultsCount(0);
            setViewingHistorical(false);
            setViewingHistoryId(null);
          }
        } catch (error) {
          console.error('Error deleting history item:', error);
        }
      }
    };
    
    // Clear all search history
    const clearAllHistory = () => {
      if (window.confirm('Are you sure you want to clear your entire search history? This cannot be undone.')) {
        try {
          localStorage.removeItem('linkedInSearchHistory');
          setSearchHistory([]);
          
          // Clear results view if showing historical data
          if (viewingHistorical) {
            setSearchResults([]);
            setResultsCount(0);
            setViewingHistorical(false);
            setViewingHistoryId(null);
          }
        } catch (error) {
          console.error('Error clearing history:', error);
        }
      }
    };
    
    // Render component
    return (
      <div className="linkedin-search-container">
        <h1>LinkedIn People Search & Export</h1>
        
        {/* Configuration Section */}
        <section className="config-section">
          <h2>Search Configuration</h2>
          
          {/* Cookie Management */}
          <div className="cookie-management">
            <h3>LinkedIn Cookie Management</h3>
            
            <div className="security-warning">
              <p><strong>⚠️ Security Warning:</strong> Your LinkedIn cookie provides full access to your account. 
              Store cookies only on trusted devices. We store cookies in your browser's local storage and 
              never transmit them to our servers except when performing a search.</p>
            </div>
            
            <div className="cookie-input-row">
              <div className="form-group">
                <label htmlFor="cookie-string">LinkedIn Cookie String</label>
                <textarea 
                  id="cookie-string"
                  className="cookie-textarea"
                  placeholder="Paste your LinkedIn cookie string here (li_at cookie required)"
                  value={cookieString}
                  onChange={(e) => setCookieString(e.target.value)}
                  disabled={isSearching}
                />
                <small>
                  How to get cookies: Open LinkedIn.com &gt; Developer Tools (F12) &gt; 
                  Application tab &gt; Cookies &gt; www.linkedin.com &gt; Copy the entire 
                  cookie string with values.
                </small>
              </div>
            </div>
            
            <div className="cookie-actions">
              <div className="save-cookie">
                <input 
                  type="text"
                  placeholder="Cookie Label (e.g., 'Work Account')"
                  value={cookieLabel}
                  onChange={(e) => setCookieLabel(e.target.value)}
                  disabled={isSearching}
                />
                <button 
                  onClick={saveCookie}
                  disabled={isSearching || !cookieString || !cookieLabel}
                >
                  Save Cookie
                </button>
              </div>
              
              <div className="cookie-select">
                <select 
                  value={selectedCookieLabel}
                  onChange={(e) => loadCookie(e.target.value)}
                  disabled={isSearching}
                >
                  <option value="">-- Select a saved cookie --</option>
                  {Object.keys(savedCookies).map(label => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
                
                <button 
                  onClick={deleteCookie}
                  disabled={isSearching || !selectedCookieLabel}
                >
                  Delete Cookie
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Criteria */}
          <div className="search-criteria">
            <h3>Search Criteria</h3>
            
            <div className="search-method">
              <label>
                <input 
                  type="radio"
                  name="search-method"
                  value="term"
                  checked={searchMethod === 'term'}
                  onChange={() => setSearchMethod('term')}
                  disabled={isSearching}
                />
                Search Term
              </label>
              
              <label>
                <input 
                  type="radio"
                  name="search-method"
                  value="url"
                  checked={searchMethod === 'url'}
                  onChange={() => setSearchMethod('url')}
                  disabled={isSearching}
                />
                Full Search URL
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="search-input">
                {searchMethod === 'term' ? 'Search Term' : 'LinkedIn Search URL'}
              </label>
              <input 
                type="text"
                id="search-input"
                placeholder={searchMethod === 'term' 
                  ? 'e.g., Software Engineer Fintech London' 
                  : 'e.g., https://www.linkedin.com/search/results/people/?keywords=...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isSearching}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="max-pages">Maximum Pages to Scrape (1-100)</label>
              <input 
                type="number"
                id="max-pages"
                min="1"
                max="100"
                value={maxPages}
                onChange={(e) => setMaxPages(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={isSearching}
              />
              <small>Each page contains approximately 10 profiles. LinkedIn has a practical limit of ~100 pages.</small>
            </div>
            
            <div className="search-actions">
              <button 
                className="start-search-btn"
                onClick={startSearch}
                disabled={isSearching || !cookieString || !searchInput}
              >
                Start Search
              </button>
              
              <button 
                className="cancel-search-btn"
                onClick={cancelSearch}
                disabled={!isSearching}
              >
                Cancel Search
              </button>
            </div>
          </div>
        </section>
        
        {/* Search Execution Section */}
        <section className="execution-section">
          <h2>Search Progress</h2>
          
          {currentUserInfo && (
            <div className="user-info">
              <p>Logged in as: <strong>{currentUserInfo.displayName}</strong></p>
            </div>
          )}
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </div>
          
          <div className="status-log">
            <h3>Status Log</h3>
            <div className="status-messages">
              {statusMessages.length === 0 ? (
                <p className="no-messages">No messages yet. Start a search to see updates.</p>
              ) : (
                statusMessages.map((status, index) => (
                  <div 
                    key={index} 
                    className={`status-message ${status.status === 'error' ? 'error' : ''}`}
                  >
                    <span className="status-time">
                      [{new Date(status.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="status-text">{status.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Results Section */}
        <section className="results-section">
          <h2>
            {viewingHistorical 
              ? `Historical Results: ${searchHistory.find(item => item.id === viewingHistoryId)?.label || 'Unknown'}`
              : 'Search Results'}
          </h2>
          
          {viewingHistorical && (
            <button 
              className="return-to-current-btn"
              onClick={() => {
                setViewingHistorical(false);
                setViewingHistoryId(null);
                // Show current results if available
                if (searchResults.length > 0 && !isSearching) {
                  // Keep current results
                } else {
                  // Clear results if no current search
                  setSearchResults([]);
                  setResultsCount(0);
                }
              }}
            >
              Return to Current Results
            </button>
          )}
          
          {(resultsCount > 0 || viewingHistorical) && (
            <div className="results-actions">
              <p><strong>{resultsCount}</strong> profiles found</p>
              <button 
                className="export-csv-btn"
                onClick={() => exportToCsv()}
                disabled={isSearching || searchResults.length === 0}
              >
                Export as CSV
              </button>
            </div>
          )}
          
          <div className="results-table-container">
            {searchResults.length === 0 ? (
              isSearching ? (
                <p className="waiting-message">Waiting for results...</p>
              ) : (
                <p className="no-results">No results to display. Start a search to see results here.</p>
              )
            ) : (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Connection Degree</th>
                    <th>Profile URL</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((profile, index) => (
                    <tr key={index}>
                      <td>{profile.name || 'N/A'}</td>
                      <td>{profile.title || 'N/A'}</td>
                      <td>{profile.location || 'N/A'}</td>
                      <td>{profile.connectionDegree || 'N/A'}</td>
                      <td>
                        {profile.profileUrl ? (
                          <a 
                            href={profile.profileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Profile
                          </a>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        
        {/* Search History Section */}
        <section className="history-section">
          <h2>Search History</h2>
          
          {searchHistory.length === 0 ? (
            <p className="no-history">No search history yet. Complete a search to save it here.</p>
          ) : (
            <>
              <div className="history-actions">
                <button 
                  className="clear-history-btn"
                  onClick={clearAllHistory}
                >
                  Clear All History
                </button>
              </div>
              
              <div className="history-list">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Date</th>
                      <th>Search Criteria</th>
                      <th>Results</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchHistory.map(item => (
                      <tr 
                        key={item.id}
                        className={viewingHistoryId === item.id ? 'active-history' : ''}
                      >
                        <td>{item.label}</td>
                        <td>{new Date(item.timestamp).toLocaleString()}</td>
                        <td>
                          {item.searchMethod === 'term' ? (
                            <span>Term: "{item.searchInput}"</span>
                          ) : (
                            <span>URL Search</span>
                          )}
                        </td>
                        <td>{item.resultsCount}</td>
                        <td className="history-item-actions">
                          <button onClick={() => viewHistoricalSearch(item)}>
                            View
                          </button>
                          <button onClick={() => exportToCsv(item.results)}>
                            Export
                          </button>
                          <button onClick={() => deleteHistoryItem(item.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    );
  };

// Add this at the end of the file to ensure the component is globally available
try {
    // Make LinkedInSearch globally available
    window.LinkedInSearch = LinkedInSearch;
    console.log("LinkedInSearch component exposed globally");
    } catch (error) {
    console.error("Failed to expose LinkedInSearch globally:", error);
}

console.log("LinkedInSearch component defined successfully");
