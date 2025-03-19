// Main.gs
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Utilities');

  // Add menu item to open unified sidebar
  menu.addItem('Show Data Toolkit', 'showUnifiedSidebar');

  menu.addToUi();
}

/**
 * Displays the unified Data Toolkit sidebar.
 */
function showUnifiedSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('UnifiedSidebar')
    .setTitle('Data Toolkit')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Shows a toast message in the spreadsheet.
 * @param {string} message - The message to display.
 */
function showToast(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message);
}

/**
 * Gets the currently selected ranges in the active sheet
 * @return {Array} Array of selected ranges
 */
function getSelectedRanges() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const ranges = sheet.getActiveRangeList();
  if (!ranges) return [];
  
  return ranges.getRanges().map(range => {
    return {
      sheetName: sheet.getName(),
      range: range.getA1Notation(),
      values: range.getValues()
    };
  });
}

/**
 * Saves chat history to user properties
 * @param {string} chatHtml - The HTML content of the chat
 * @return {boolean} Success status
 */
function saveChatHistory(chatHtml) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('chatHistory', chatHtml);
    return true;
  } catch (error) {
    Logger.log('Error saving chat history: ' + error);
    return false;
  }
}

/**
 * Gets chat history from user properties
 * @return {string} The HTML content of the chat
 */
function getChatHistory() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    return userProperties.getProperty('chatHistory') || '';
  } catch (error) {
    Logger.log('Error getting chat history: ' + error);
    return '';
  }
}

/**
 * Exports chat history to a new sheet
 * @param {string} messages - The formatted chat messages
 * @return {string} Success message
 */
function exportChatHistory(messages) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH:mm:ss");
    const sheetName = "Chat_Export_" + timestamp;
    
    // Create a new sheet for the export
    const exportSheet = ss.insertSheet(sheetName);
    
    // Set up headers
    exportSheet.getRange("A1:D1").setValues([["Timestamp", "Sender", "Message", "Model"]]);
    exportSheet.getRange("A1:D1").setFontWeight("bold");
    
    // Parse messages (now tab-separated)
    const messageLines = messages.split('\n').filter(line => line.trim());
    const exportData = messageLines.map(line => {
      const [timestamp, sender, message, model] = line.split('\t');
      return [timestamp, sender, message, model];
    });
    
    // Write to sheet
    if (exportData.length > 0) {
      exportSheet.getRange(2, 1, exportData.length, 4).setValues(exportData);
      exportSheet.autoResizeColumns(1, 4);
    }
    
    // Activate the new sheet
    exportSheet.activate();
    
    return "Chat exported to sheet: " + sheetName;
  } catch (error) {
    Logger.log('Error exporting chat: ' + error);
    throw error.toString();
  }
}

/**
 * Sends an API request and returns the response
 * @param {string} url - The API endpoint URL
 * @param {string} method - The HTTP method (GET, POST, etc.)
 * @param {Object} queryParams - Query parameters
 * @param {string|Object} body - Request body (for POST/PUT/PATCH)
 * @param {Object} headers - Custom headers for the request
 * @return {Object} The API response
 */
function sendApiRequest(url, method, queryParams, body, headersStr = '{}') {
  try {
    if (!url) throw new Error('URL is required');

    // Build the full URL with query parameters if provided
    let fullUrl = url;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }

    // Parse headers from string to object
    let headers = {};
    try {
      if (headersStr && headersStr.trim() !== '') {
        headers = JSON.parse(headersStr);
        Logger.log('Parsed headers: ' + JSON.stringify(headers));
      }
    } catch (e) {
      throw new Error('Invalid headers JSON: ' + e.message);
    }

    // Set up request options
    const options = {
      method: method,
      muteHttpExceptions: true,
      headers: headers
    };

    // Add payload for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      try {
        // If body is already an object, stringify it
        if (typeof body === 'object') {
          options.payload = JSON.stringify(body);
        } else {
          // If body is a string, try to parse it as JSON first
          const parsedBody = JSON.parse(body);
          options.payload = JSON.stringify(parsedBody);
        }
      } catch (e) {
        // If body is not JSON, use it as is
        options.payload = body;
      }
    }

    // Log the request details
    Logger.log('Sending request: ' + fullUrl + ' with headers: ' + JSON.stringify(options.headers));
    if (options.payload) {
      Logger.log('Request body: ' + options.payload);
    }

    // Make the API call
    const response = UrlFetchApp.fetch(fullUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    Logger.log('Response: ' + responseCode + ' - ' + responseText);

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    if (responseCode >= 400) {
      throw new Error(`HTTP ${responseCode}: ${responseText}`);
    }

    return responseData;
  } catch (error) {
    Logger.log('API Request Error: ' + error.toString());
    throw error;
  }
}

/**
 * Checks if the active sheet has data
 * @return {boolean} True if the sheet has data, false otherwise
 */
function checkSheetHasData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    return sheet.getLastRow() > 0;
  } catch (error) {
    console.error('Error checking sheet data:', error);
    throw error;
  }
}

/**
 * Adds API response data to the active sheet
 * @param {Object} data - The data to add to the sheet
 * @param {boolean} clearSheet - Whether to clear the sheet before adding data
 * @return {boolean} Success status
 */
function addResponseToSheet(data, clearSheet = false) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Clear the sheet if requested
    if (clearSheet && sheet.getLastRow() > 0) {
      sheet.clear();
    }
    
    // Start from row 1 if sheet was cleared, otherwise append
    const startRow = clearSheet ? 1 : sheet.getLastRow() + 1;
    let currentRow = startRow;
    
    // Function to convert object to key-value rows
    function objectToKeyValueRows(obj, prefix = '') {
      const rows = [];
      
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value === null || value === undefined) {
          rows.push([newKey, '']);
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            // For arrays, create a row with array reference
            rows.push([newKey, `Array of ${value.length} items`]);
          } else {
            // For nested objects, recursively create rows
            const nestedRows = objectToKeyValueRows(value, newKey);
            rows.push(...nestedRows);
          }
        } else {
          rows.push([newKey, value]);
        }
      }
      
      return rows;
    }
    
    // Function to convert array to table format
    function arrayToTableRows(arr, prefix = '') {
      if (arr.length === 0) return [];
      
      // Get all unique keys from all objects in the array
      const allKeys = new Set();
      arr.forEach(item => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });
      
      // Create headers with array index notation
      const headers = Array.from(allKeys).map(key => `${prefix}[].${key}`);
      
      // Create data rows
      const rows = arr.map((item, index) => {
        return headers.map(header => {
          const key = header.split('.').pop();
          return item[key] || '';
        });
      });
      
      return {
        headers: headers,
        rows: rows
      };
    }
    
    // Handle array of objects
    if (Array.isArray(data) && data.length > 0) {
      // Convert array to table format
      const tableData = arrayToTableRows(data);
      
      // Write headers and data
      if (tableData.headers.length > 0) {
        sheet.getRange(currentRow, 1, 1, tableData.headers.length)
          .setValues([tableData.headers]);
        currentRow++;
        
        if (tableData.rows.length > 0) {
          sheet.getRange(currentRow, 1, tableData.rows.length, tableData.headers.length)
            .setValues(tableData.rows);
          currentRow += tableData.rows.length;
        }
      }
    }
    // Handle single object
    else if (typeof data === 'object' && data !== null) {
      // First, write regular key-value pairs
      const keyValueRows = objectToKeyValueRows(data);
      if (keyValueRows.length > 0) {
        sheet.getRange(currentRow, 1, 1, 2).setValues([['Key', 'Value']]);
        currentRow++;
        sheet.getRange(currentRow, 1, keyValueRows.length, 2)
          .setValues(keyValueRows);
        currentRow += keyValueRows.length;
      }
      
      // Then, handle any arrays within the object
      for (const key in data) {
        const value = data[key];
        if (Array.isArray(value) && value.length > 0) {
          // Add a blank row for separation
          currentRow++;
          
          // Convert array to table format
          const tableData = arrayToTableRows(value, key);
          
          // Write headers and data
          if (tableData.headers.length > 0) {
            sheet.getRange(currentRow, 1, 1, tableData.headers.length)
              .setValues([tableData.headers]);
            currentRow++;
            
            if (tableData.rows.length > 0) {
              sheet.getRange(currentRow, 1, tableData.rows.length, tableData.headers.length)
                .setValues(tableData.rows);
              currentRow += tableData.rows.length;
            }
          }
        }
      }
    }
    // Handle simple values
    else {
      sheet.getRange(currentRow, 1, 1, 2).setValues([['Key', 'Value']]);
      currentRow++;
      sheet.getRange(currentRow, 1, 1, 2).setValues([['Value', data]]);
    }
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    return true;
  } catch (error) {
    console.error('Error adding response to sheet:', error);
    throw error;
  }
}

/**
 * Creates a basic visualization of data for the UI
 * @param {Object|Array} data - The data to visualize
 * @return {Object} Object containing visualization info
 */
function createVisualization(data) {
  try {
    // Extract basic statistics about the data
    let stats = {
      dataType: Array.isArray(data) ? 'array' : typeof data,
      itemCount: Array.isArray(data) ? data.length : (typeof data === 'object' ? Object.keys(data).length : 1),
      visualization: 'table', // Default visualization type
      summary: {}
    };
    
    // Add more details based on data type
    if (Array.isArray(data)) {
      // For arrays, analyze the first few items
      stats.isEmpty = data.length === 0;
      stats.firstItemType = data.length > 0 ? typeof data[0] : null;
      stats.isArrayOfObjects = data.length > 0 && typeof data[0] === 'object' && data[0] !== null;
      
      // Generate basic statistics for numeric arrays
      if (data.length > 0 && data.every(item => typeof item === 'number')) {
        const sum = data.reduce((total, num) => total + num, 0);
        stats.summary = {
          min: Math.min(...data),
          max: Math.max(...data),
          average: sum / data.length,
          sum: sum
        };
      }
    } else if (typeof data === 'object' && data !== null) {
      // For objects, include key information
      stats.keys = Object.keys(data);
      stats.nestedObjects = stats.keys
        .filter(key => typeof data[key] === 'object' && data[key] !== null)
        .length;
    }
    
    return stats;
  } catch (error) {
    console.error('Error creating visualization:', error);
    return {
      error: error.toString(),
      dataType: typeof data,
      visualization: 'error'
    };
  }
}

/**
 * Applies an AI-suggested formula to the active cell or selected range
 * @param {string} formula - The formula to apply
 * @return {Object} Result with status and message
 */
function applyAiFormula(formula) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();
    
    if (!range) {
      throw new Error("No active range selected");
    }
    
    // Clean up the formula if needed
    let cleanFormula = formula.trim();
    if (cleanFormula.startsWith('=')) {
      cleanFormula = cleanFormula;
    } else if (!cleanFormula.startsWith('=')) {
      cleanFormula = '=' + cleanFormula;
    }
    
    // Apply formula to the active cell or first cell in range
    range.getCell(1, 1).setFormula(cleanFormula);
    
    return {
      success: true,
      message: "Formula applied successfully"
    };
  } catch (error) {
    Logger.log('Error applying formula: ' + error);
    return {
      success: false,
      message: "Error applying formula: " + error.toString()
    };
  }
}

/**
 * Creates a chart based on AI suggestion
 * @param {Object} chartConfig - Configuration for the chart
 * @return {Object} Result with status and message
 */
function createAiChart(chartConfig) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();
    
    if (!range) {
      throw new Error("No data range selected");
    }
    
    if (!chartConfig || !chartConfig.type) {
      throw new Error("Chart type is required");
    }
    
    // Map chart type to Google Charts type
    const chartTypeMap = {
      'bar': Charts.ChartType.BAR,
      'column': Charts.ChartType.COLUMN,
      'line': Charts.ChartType.LINE,
      'pie': Charts.ChartType.PIE,
      'scatter': Charts.ChartType.SCATTER,
      'area': Charts.ChartType.AREA
    };
    
    const chartType = chartTypeMap[chartConfig.type.toLowerCase()] || Charts.ChartType.COLUMN;
    
    // Create chart
    let chart = sheet.newChart();
    chart.addRange(range)
      .setChartType(chartType)
      .setPosition(range.getLastRow() + 2, 1, 0, 0)
      .setOption('title', chartConfig.title || 'AI Generated Chart')
      .setOption('legend', {position: 'right'})
      .build();
    
    sheet.insertChart(chart);
    
    return {
      success: true,
      message: `${chartConfig.type} chart created successfully`
    };
  } catch (error) {
    Logger.log('Error creating chart: ' + error);
    return {
      success: false,
      message: "Error creating chart: " + error.toString()
    };
  }
}

/**
 * Gets column headers from the active sheet
 * @return {Array} Array of column headers
 */
function getColumnHeaders() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return headerRow.filter(header => header !== "");
  } catch (error) {
    Logger.log('Error getting column headers: ' + error);
    return [];
  }
}

/**
 * Formats selected cells based on AI suggestion
 * @param {Object} formatConfig - Formatting configuration
 * @return {Object} Result with status and message
 */
function applyAiFormatting(formatConfig) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();
    
    if (!range) {
      throw new Error("No range selected");
    }
    
    if (!formatConfig) {
      throw new Error("Format configuration is required");
    }
    
    // Apply formatting
    if (formatConfig.background) {
      range.setBackground(formatConfig.background);
    }
    
    if (formatConfig.fontColor) {
      range.setFontColor(formatConfig.fontColor);
    }
    
    if (formatConfig.fontWeight) {
      if (formatConfig.fontWeight.toLowerCase() === 'bold') {
        range.setFontWeight('bold');
      } else {
        range.setFontWeight('normal');
      }
    }
    
    if (formatConfig.fontSize) {
      range.setFontSize(formatConfig.fontSize);
    }
    
    if (formatConfig.numberFormat) {
      range.setNumberFormat(formatConfig.numberFormat);
    }
    
    return {
      success: true,
      message: "Formatting applied successfully"
    };
  } catch (error) {
    Logger.log('Error applying formatting: ' + error);
    return {
      success: false,
      message: "Error applying formatting: " + error.toString()
    };
  }
}

/**
 * Analyze selected data and return statistics
 * @return {Object} Statistical analysis of selected data
 */
function getDataStatistics() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getActiveRange();
    
    if (!range) {
      throw new Error("No range selected");
    }
    
    const values = range.getValues();
    if (!values.length) {
      throw new Error("No data in selected range");
    }
    
    // Extract numeric values for stats
    const flatValues = [].concat(...values);
    const numericValues = flatValues.filter(val => typeof val === 'number' || !isNaN(Number(val)));
    const transformedNumericValues = numericValues.map(val => Number(val));
    
    if (!transformedNumericValues.length) {
      return {
        success: true,
        stats: {
          type: "non-numeric",
          count: flatValues.length,
          uniqueValues: [...new Set(flatValues)].length,
          isEmpty: flatValues.every(val => val === "" || val === null || val === undefined),
          nonEmptyCount: flatValues.filter(val => val !== "" && val !== null && val !== undefined).length,
          textStats: {
            averageLength: flatValues.filter(val => typeof val === 'string').reduce((sum, val) => sum + val.length, 0) / 
                          flatValues.filter(val => typeof val === 'string').length || 0
          }
        }
      };
    }
    
    // Calculate stats
    const sum = transformedNumericValues.reduce((acc, val) => acc + val, 0);
    const count = transformedNumericValues.length;
    const avg = sum / count;
    transformedNumericValues.sort((a, b) => a - b);
    
    return {
      success: true,
      stats: {
        type: "numeric",
        rowCount: values.length,
        colCount: values[0].length,
        valueCount: flatValues.length,
        numericCount: transformedNumericValues.length,
        min: transformedNumericValues[0],
        max: transformedNumericValues[transformedNumericValues.length - 1],
        sum: sum,
        average: avg,
        median: transformedNumericValues.length % 2 === 0 ? 
                (transformedNumericValues[count/2 - 1] + transformedNumericValues[count/2]) / 2 : 
                transformedNumericValues[Math.floor(count/2)]
      }
    };
  } catch (error) {
    Logger.log('Error getting data statistics: ' + error);
    return {
      success: false,
      message: "Error analyzing data: " + error.toString()
    };
  }
}

/**
 * Shows a dialog to prompt user to select data
 * @param {string} message - The message to display in the dialog
 * @return {Object} Object containing success flag and data selection status
 */
function promptForDataSelection(message) {
  try {
    Logger.log('promptForDataSelection called with message: ' + message);
    
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Data Selection',
      message || 'Please select a range or sheet to analyze.',
      ui.ButtonSet.OK_CANCEL
    );
    
    Logger.log('User response: ' + response);
    
    if (response == ui.Button.OK) {
      // User clicked OK, check if they selected data
      const activeRange = SpreadsheetApp.getActiveRange();
      if (!activeRange) {
        Logger.log('No active range selected, trying to use the entire sheet');
        // No range selected, try to use the entire active sheet
        const activeSheet = SpreadsheetApp.getActiveSheet();
        if (activeSheet) {
          // Use the entire active sheet
          const lastRow = Math.max(1, activeSheet.getLastRow());
          const lastCol = Math.max(1, activeSheet.getLastColumn());
          Logger.log(`Sheet dimensions: ${lastRow} rows x ${lastCol} columns`);
          
          if (lastRow > 1 || lastCol > 1) {
            // There's data in the sheet
            activeSheet.getRange(1, 1, lastRow, lastCol).activate();
            const result = { success: true, dataSelected: true, sheet: activeSheet.getName() };
            Logger.log('Using entire sheet: ' + JSON.stringify(result));
            return result;
          }
        }
        const result = { success: true, dataSelected: false, message: 'No data found in the active sheet.' };
        Logger.log('No data in sheet: ' + JSON.stringify(result));
        return result;
      }
      const result = { success: true, dataSelected: true };
      Logger.log('Using selected range: ' + JSON.stringify(result));
      return result;
    } else {
      // User clicked Cancel
      const result = { success: false, message: 'Selection cancelled.' };
      Logger.log('Selection cancelled: ' + JSON.stringify(result));
      return result;
    }
  } catch (error) {
    Logger.log('Error in promptForDataSelection: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Analyze selected data and generate summary with charts
 * @return {Object} Object containing summary text and chart URLs
 */
function summarizeDataWithCharts() {
  try {
    Logger.log('summarizeDataWithCharts called');
    
    // Get the selected range
    const range = SpreadsheetApp.getActiveRange();
    if (!range) {
      const error = 'No range selected.';
      Logger.log('Error: ' + error);
      throw new Error(error);
    }
    
    Logger.log(`Selected range: ${range.getA1Notation()} in ${range.getSheet().getName()}`);
    
    // Get the data from the range
    const values = range.getValues();
    if (!values || values.length === 0) {
      const error = 'No data found in the selected range.';
      Logger.log('Error: ' + error);
      throw new Error(error);
    }
    
    Logger.log(`Data size: ${values.length} rows x ${values[0].length} columns`);
    
    // Get headers if available (first row)
    const headers = values[0];
    const dataRows = values.slice(1);
    
    Logger.log(`Headers: ${headers.join(', ')}`);
    Logger.log(`Data rows: ${dataRows.length}`);
    
    // Analyze data to determine column types
    const columnTypes = determineColumnTypes(values);
    Logger.log(`Column types determined: ${columnTypes.length} columns`);
    
    // Generate summary statistics
    Logger.log('Generating data summary...');
    const summary = generateDataSummary(values, headers, columnTypes);
    
    // Create charts for the data
    Logger.log('Creating charts...');
    const charts = createDataCharts(values, headers, columnTypes);
    Logger.log(`Created ${charts.length} charts`);
    
    const result = {
      success: true,
      summary: summary,
      charts: charts
    };
    
    Logger.log('summarizeDataWithCharts completed successfully');
    return result;
  } catch (error) {
    Logger.log('Error in summarizeDataWithCharts: ' + error);
    return { 
      success: false,
      summary: 'Error analyzing data: ' + error.toString(),
      charts: []
    };
  }
}

/**
 * Determine the data type of each column
 * @param {Array} values - 2D array of values
 * @return {Array} Array of column type objects
 */
function determineColumnTypes(values) {
  if (!values || values.length <= 1) {
    return [];
  }
  
  const headers = values[0];
  const dataRows = values.slice(1);
  const columnTypes = [];
  
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let textCount = 0;
    let emptyCount = 0;
    
    // Collect unique values for categorical analysis
    const uniqueValues = new Set();
    
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const value = dataRows[rowIndex][colIndex];
      
      // Track unique values
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.add(value.toString());
      }
      
      if (value === null || value === undefined || value === '') {
        emptyCount++;
      } else if (typeof value === 'number' || !isNaN(parseFloat(value))) {
        numericCount++;
      } else if (value instanceof Date || !isNaN(new Date(value).getTime())) {
        dateCount++;
      } else if (value === true || value === false || value === 'TRUE' || value === 'FALSE') {
        booleanCount++;
      } else {
        textCount++;
      }
    }
    
    const totalCells = dataRows.length;
    
    // Determine primary type based on highest count
    let primaryType = 'text';
    if (numericCount > dateCount && numericCount > booleanCount && numericCount > textCount) {
      primaryType = 'numeric';
    } else if (dateCount > numericCount && dateCount > booleanCount && dateCount > textCount) {
      primaryType = 'date';
    } else if (booleanCount > numericCount && booleanCount > dateCount && booleanCount > textCount) {
      primaryType = 'boolean';
    }
    
    // Calculate if this column might be categorical
    const uniqueValueCount = uniqueValues.size;
    const uniqueRatio = totalCells > 0 ? uniqueValueCount / (totalCells - emptyCount) : 0;
    const isCategorical = uniqueRatio < 0.2 && uniqueValueCount <= 20 && uniqueValueCount >= 2;
    
    columnTypes.push({
      header: headers[colIndex],
      type: primaryType,
      uniqueValues: uniqueValueCount,
      emptyCells: emptyCount,
      totalCells: totalCells,
      isCategorical: isCategorical
    });
  }
  
  return columnTypes;
}

/**
 * Generate a summary of the data
 * @param {Array} values - 2D array of values
 * @param {Array} headers - Array of column headers
 * @param {Array} columnTypes - Array of column type objects
 * @return {string} Summary text
 */
function generateDataSummary(values, headers, columnTypes) {
  // Count rows and columns
  const rowCount = values.length - 1; // Subtract header row
  const colCount = headers.length;
  
  // Basic summary
  let summary = `# Data Summary\n\n`;
  summary += `I've analyzed a dataset with ${rowCount} rows and ${colCount} columns.\n\n`;
  
  // Column summaries
  summary += `## Column Analysis\n\n`;
  
  for (let i = 0; i < columnTypes.length; i++) {
    const column = columnTypes[i];
    const emptyPercentage = Math.round((column.emptyCells / column.totalCells) * 100);
    
    summary += `### ${column.header}\n`;
    summary += `- Type: ${column.type.charAt(0).toUpperCase() + column.type.slice(1)}\n`;
    
    // Calculate column-specific statistics based on type
    const colData = extractColumnData(values, i);
    
    if (column.type === 'numeric') {
      const stats = calculateNumericStats(colData);
      summary += `- Min: ${stats.min}\n`;
      summary += `- Max: ${stats.max}\n`;
      summary += `- Average: ${stats.mean.toFixed(2)}\n`;
      summary += `- Median: ${stats.median.toFixed(2)}\n`;
      if (stats.mode !== null) {
        summary += `- Mode: ${stats.mode}\n`;
      }
    } else if (column.type === 'date') {
      const stats = calculateDateStats(colData);
      summary += `- Date Range: ${stats.minDate} to ${stats.maxDate}\n`;
      summary += `- Timespan: ${stats.timespanDays} days\n`;
    } else if (column.isCategorical) {
      const stats = calculateCategoricalStats(colData);
      summary += `- Categories: ${stats.uniqueValues}\n`;
      summary += `- Most Common: ${stats.mostCommon} (${stats.mostCommonCount} occurrences)\n`;
    }
    
    // Data completeness
    summary += `- Completeness: ${100 - emptyPercentage}% (${column.emptyCells} empty cells)\n\n`;
  }
  
  // Overall insights
  summary += `## Insights\n\n`;
  
  // Find correlations between numeric columns
  const numericColumns = columnTypes.filter(col => col.type === 'numeric');
  if (numericColumns.length >= 2) {
    summary += `### Numeric Relationships\n\n`;
    
    // Find strongest correlations
    let correlations = [];
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = headers.indexOf(numericColumns[i].header);
        const col2 = headers.indexOf(numericColumns[j].header);
        
        const col1Data = extractColumnData(values, col1);
        const col2Data = extractColumnData(values, col2);
        
        const correlation = calculateCorrelation(col1Data, col2Data);
        if (!isNaN(correlation)) {
          correlations.push({
            col1: numericColumns[i].header,
            col2: numericColumns[j].header,
            correlation: correlation
          });
        }
      }
    }
    
    // Sort by absolute correlation value
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    
    // Report top 3 correlations
    for (let i = 0; i < Math.min(3, correlations.length); i++) {
      const corr = correlations[i];
      let strength = "weak";
      if (Math.abs(corr.correlation) > 0.7) strength = "strong";
      else if (Math.abs(corr.correlation) > 0.4) strength = "moderate";
      
      summary += `- ${corr.col1} and ${corr.col2} have a ${strength} ${corr.correlation > 0 ? "positive" : "negative"} correlation (${corr.correlation.toFixed(2)}).\n`;
    }
    
    summary += `\n`;
  }
  
  // Find patterns in categorical data
  const categoricalColumns = columnTypes.filter(col => col.isCategorical);
  if (categoricalColumns.length > 0) {
    summary += `### Categorical Patterns\n\n`;
    
    for (let i = 0; i < categoricalColumns.length; i++) {
      const colIndex = headers.indexOf(categoricalColumns[i].header);
      const colData = extractColumnData(values, colIndex);
      const stats = calculateCategoricalStats(colData);
      
      summary += `- ${categoricalColumns[i].header}: ${stats.topCategories.slice(0, 3).map(c => `${c.value} (${c.percentage}%)`).join(', ')}.\n`;
    }
    
    summary += `\n`;
  }
  
  // Data completeness assessment
  const emptyPercentages = columnTypes.map(col => col.emptyCells / col.totalCells);
  const avgEmptyPercentage = emptyPercentages.reduce((sum, val) => sum + val, 0) / emptyPercentages.length;
  
  summary += `### Data Quality\n\n`;
  summary += `- Overall Completeness: ${Math.round((1 - avgEmptyPercentage) * 100)}%\n`;
  
  // Identify columns with most missing data
  const missingDataColumns = columnTypes
    .filter(col => col.emptyCells > 0)
    .sort((a, b) => b.emptyCells - a.emptyCells)
    .slice(0, 3);
  
  if (missingDataColumns.length > 0) {
    summary += `- Columns with most missing data: ${missingDataColumns.map(col => `${col.header} (${Math.round((col.emptyCells / col.totalCells) * 100)}% missing)`).join(', ')}\n`;
  }
  
  summary += `\n## Visualization Summary\n\nI've created visualizations to help you better understand the data patterns and distributions. The charts include:\n`;
  
  // Describe charts that were created
  let chartNumber = 1;
  
  // Numeric column charts
  if (numericColumns.length > 0) {
    summary += `\n${chartNumber}. Distribution charts for numeric columns\n`;
    chartNumber++;
  }
  
  // Categorical column charts
  if (categoricalColumns.length > 0) {
    summary += `\n${chartNumber}. Proportion charts for categorical columns\n`;
    chartNumber++;
  }
  
  // Correlation charts (if applicable)
  if (numericColumns.length >= 2) {
    summary += `\n${chartNumber}. Relationship visualization between key numeric columns\n`;
    chartNumber++;
  }
  
  return summary;
}

/**
 * Create charts for visualization
 * @param {Array} values - 2D array of values
 * @param {Array} headers - Array of column headers
 * @param {Array} columnTypes - Array of column type objects
 * @return {Array} Array of chart URLs
 */
function createDataCharts(values, headers, columnTypes) {
  try {
    const chartUrls = [];
    
    // Create a temporary sheet for chart generation
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let tempSheet = ss.getSheetByName("TempChartSheet");
    
    if (tempSheet) {
      ss.deleteSheet(tempSheet); // Delete if exists
    }
    
    tempSheet = ss.insertSheet("TempChartSheet");
    
    // Copy data to temp sheet
    tempSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    
    // Create charts based on data types
    const numericColumns = columnTypes.filter(col => col.type === 'numeric');
    const categoricalColumns = columnTypes.filter(col => col.isCategorical);
    
    // Create distribution charts for numeric columns
    if (numericColumns.length > 0) {
      // Select up to 3 numeric columns for visualization
      const columnsToChart = numericColumns.slice(0, 3);
      
      // Create a column chart showing comparison
      const comparisonChart = tempSheet.newChart()
        .asColumnChart()
        .addRange(tempSheet.getRange(1, 1, values.length, 1)) // Add header/row labels
        .setTitle("Comparison of Key Metrics")
        .setXAxisTitle("Data Points")
        .setYAxisTitle("Values")
        .setLegendPosition(Charts.Position.BOTTOM)
        .setOption('hAxis', {slantedText: true, slantedTextAngle: 45})
        .setOption('animation', {startup: true, duration: 1000})
        .setOption('vAxis', {minValue: 0});
      
      // Add each column to the chart
      for (let col of columnsToChart) {
        const colIndex = headers.indexOf(col.header) + 1; // 1-based index for sheets
        comparisonChart.addRange(tempSheet.getRange(2, colIndex, values.length - 1, 1));
      }
      
      // Build and insert the chart
      const chartBuilt = comparisonChart.build();
      tempSheet.insertChart(chartBuilt);
      
      // Get the chart image
      Utilities.sleep(1000); // Give chart time to render
      const chartBlob = chartBuilt.getAs('image/png');
      
      // Convert to data URL
      const chartUrl = "data:image/png;base64," + Utilities.base64Encode(chartBlob.getBytes());
      chartUrls.push(chartUrl);
    }
    
    // Create pie/donut charts for categorical columns
    if (categoricalColumns.length > 0) {
      // Select up to 2 categorical columns for visualization
      const columnsToChart = categoricalColumns.slice(0, 2);
      
      for (let col of columnsToChart) {
        const colIndex = headers.indexOf(col.header) + 1; // 1-based index for sheets
        
        // Calculate frequency of each category
        const colData = extractColumnData(values, colIndex - 1); // 0-based for our extraction
        const stats = calculateCategoricalStats(colData);
        
        // Prepare data for chart - take top 5 categories + "Other"
        const chartData = [];
        chartData.push([col.header, "Count"]);
        
        for (let i = 0; i < Math.min(5, stats.topCategories.length); i++) {
          chartData.push([stats.topCategories[i].value.toString(), stats.topCategories[i].count]);
        }
        
        // Add "Other" category for remaining items
        if (stats.topCategories.length > 5) {
          const otherCount = stats.topCategories.slice(5).reduce((sum, cat) => sum + cat.count, 0);
          chartData.push(["Other", otherCount]);
        }
        
        // Insert data for chart
        const chartRange = tempSheet.getRange(values.length + 2, 1, chartData.length, 2);
        chartRange.setValues(chartData);
        
        // Create pie chart
        const pieChart = tempSheet.newChart()
          .asPieChart()
          .addRange(chartRange)
          .setTitle(`Distribution of ${col.header}`)
          .setOption('is3D', true)
          .setOption('pieHole', 0.4) // Makes it a donut chart
          .setOption('animation', {startup: true, duration: 1000})
          .setLegendPosition(Charts.Position.RIGHT);
        
        // Build and insert the chart
        const chartBuilt = pieChart.build();
        tempSheet.insertChart(chartBuilt);
        
        // Get the chart image
        Utilities.sleep(1000); // Give chart time to render
        const chartBlob = chartBuilt.getAs('image/png');
        
        // Convert to data URL
        const chartUrl = "data:image/png;base64," + Utilities.base64Encode(chartBlob.getBytes());
        chartUrls.push(chartUrl);
      }
    }
    
    // Create scatter plot for correlations if we have multiple numeric columns
    if (numericColumns.length >= 2) {
      // Find the two numeric columns with highest correlation
      let highestCorrelation = 0;
      let col1Index = 0;
      let col2Index = 0;
      
      for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
          const colIndex1 = headers.indexOf(numericColumns[i].header);
          const colIndex2 = headers.indexOf(numericColumns[j].header);
          
          const col1Data = extractColumnData(values, colIndex1);
          const col2Data = extractColumnData(values, colIndex2);
          
          const correlation = Math.abs(calculateCorrelation(col1Data, col2Data));
          if (correlation > highestCorrelation) {
            highestCorrelation = correlation;
            col1Index = colIndex1;
            col2Index = colIndex2;
          }
        }
      }
      
      if (highestCorrelation > 0.3) { // Only create correlation chart if there's some correlation
        const scatterData = [];
        scatterData.push([headers[col1Index], headers[col2Index]]);
        
        // Extract paired data for scatter plot
        for (let i = 1; i < values.length; i++) {
          if (!isNaN(values[i][col1Index]) && !isNaN(values[i][col2Index])) {
            scatterData.push([values[i][col1Index], values[i][col2Index]]);
          }
        }
        
        // Insert data for scatter plot
        const scatterRange = tempSheet.getRange(values.length + 10, 1, scatterData.length, 2);
        scatterRange.setValues(scatterData);
        
        // Create scatter plot
        const scatterChart = tempSheet.newChart()
          .asScatterChart()
          .addRange(scatterRange)
          .setTitle(`Relationship: ${headers[col1Index]} vs ${headers[col2Index]}`)
          .setXAxisTitle(headers[col1Index])
          .setYAxisTitle(headers[col2Index])
          .setOption('trendlines', {0: {type: 'linear', color: 'red', lineWidth: 3, opacity: 0.7}})
          .setOption('animation', {startup: true, duration: 1000});
        
        // Build and insert the chart
        const chartBuilt = scatterChart.build();
        tempSheet.insertChart(chartBuilt);
        
        // Get the chart image
        Utilities.sleep(1000); // Give chart time to render
        const chartBlob = chartBuilt.getAs('image/png');
        
        // Convert to data URL
        const chartUrl = "data:image/png;base64," + Utilities.base64Encode(chartBlob.getBytes());
        chartUrls.push(chartUrl);
      }
    }
    
    // Clean up - delete temporary sheet
    ss.deleteSheet(tempSheet);
    
    return chartUrls;
  } catch (error) {
    Logger.log('Error creating charts: ' + error);
    return [];
  }
}

/**
 * Extract data from a specific column
 * @param {Array} values - 2D array of values
 * @param {number} colIndex - Index of the column to extract
 * @return {Array} Array of column values (excluding header)
 */
function extractColumnData(values, colIndex) {
  const data = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][colIndex] !== null && values[i][colIndex] !== undefined && values[i][colIndex] !== '') {
      data.push(values[i][colIndex]);
    }
  }
  return data;
}

/**
 * Calculate numeric statistics for a column
 * @param {Array} data - Array of column values
 * @return {Object} Object containing min, max, mean, median, mode
 */
function calculateNumericStats(data) {
  if (data.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, mode: null };
  }
  
  // Convert all items to numbers
  const numericData = data.map(d => typeof d === 'number' ? d : parseFloat(d))
                          .filter(d => !isNaN(d));
  
  if (numericData.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, mode: null };
  }
  
  // Sort for min, max, median
  numericData.sort((a, b) => a - b);
  
  const min = numericData[0];
  const max = numericData[numericData.length - 1];
  
  // Calculate mean
  const sum = numericData.reduce((acc, val) => acc + val, 0);
  const mean = sum / numericData.length;
  
  // Calculate median
  let median;
  if (numericData.length % 2 === 0) {
    median = (numericData[numericData.length / 2 - 1] + numericData[numericData.length / 2]) / 2;
  } else {
    median = numericData[Math.floor(numericData.length / 2)];
  }
  
  // Calculate mode
  const frequency = {};
  let maxFreq = 0;
  let mode = null;
  
  for (const value of numericData) {
    frequency[value] = (frequency[value] || 0) + 1;
    
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  }
  
  // Only return mode if it occurs more than once
  if (maxFreq <= 1) {
    mode = null;
  }
  
  return { min, max, mean, median, mode };
}

/**
 * Calculate date statistics for a column
 * @param {Array} data - Array of column values
 * @return {Object} Object containing minDate, maxDate, timespanDays
 */
function calculateDateStats(data) {
  if (data.length === 0) {
    return { minDate: 'N/A', maxDate: 'N/A', timespanDays: 0 };
  }
  
  // Convert all items to dates
  const dateData = data.map(d => d instanceof Date ? d : new Date(d))
                        .filter(d => !isNaN(d.getTime()));
  
  if (dateData.length === 0) {
    return { minDate: 'N/A', maxDate: 'N/A', timespanDays: 0 };
  }
  
  // Find min and max dates
  const minDate = new Date(Math.min(...dateData.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dateData.map(d => d.getTime())));
  
  // Calculate timespan in days
  const timespanMs = maxDate.getTime() - minDate.getTime();
  const timespanDays = Math.round(timespanMs / (1000 * 60 * 60 * 24));
  
  return {
    minDate: Utilities.formatDate(minDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    maxDate: Utilities.formatDate(maxDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    timespanDays
  };
}

/**
 * Calculate categorical statistics for a column
 * @param {Array} data - Array of column values
 * @return {Object} Object containing uniqueValues, mostCommon, topCategories
 */
function calculateCategoricalStats(data) {
  if (data.length === 0) {
    return { uniqueValues: 0, mostCommon: 'N/A', mostCommonCount: 0, topCategories: [] };
  }
  
  // Count frequency of each value
  const frequency = {};
  
  for (const value of data) {
    const strValue = value.toString();
    frequency[strValue] = (frequency[strValue] || 0) + 1;
  }
  
  // Find most common value
  let mostCommon = 'N/A';
  let mostCommonCount = 0;
  
  for (const [value, count] of Object.entries(frequency)) {
    if (count > mostCommonCount) {
      mostCommon = value;
      mostCommonCount = count;
    }
  }
  
  // Create array of categories with counts and percentages
  const topCategories = Object.entries(frequency).map(([value, count]) => ({
    value,
    count,
    percentage: Math.round((count / data.length) * 100)
  })).sort((a, b) => b.count - a.count);
  
  return {
    uniqueValues: Object.keys(frequency).length,
    mostCommon,
    mostCommonCount,
    topCategories
  };
}

/**
 * Calculate correlation between two columns
 * @param {Array} col1Data - First column data
 * @param {Array} col2Data - Second column data
 * @return {number} Correlation coefficient
 */
function calculateCorrelation(col1Data, col2Data) {
  // Get paired numeric data
  const pairedData = [];
  
  for (let i = 0; i < col1Data.length; i++) {
    const x = typeof col1Data[i] === 'number' ? col1Data[i] : parseFloat(col1Data[i]);
    const y = typeof col2Data[i] === 'number' ? col2Data[i] : parseFloat(col2Data[i]);
    
    if (!isNaN(x) && !isNaN(y)) {
      pairedData.push([x, y]);
    }
  }
  
  if (pairedData.length < 3) {
    return NaN; // Not enough data for correlation
  }
  
  // Calculate means
  let sumX = 0, sumY = 0;
  for (const [x, y] of pairedData) {
    sumX += x;
    sumY += y;
  }
  
  const meanX = sumX / pairedData.length;
  const meanY = sumY / pairedData.length;
  
  // Calculate correlation
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  for (const [x, y] of pairedData) {
    const diffX = x - meanX;
    const diffY = y - meanY;
    
    numerator += diffX * diffY;
    denominatorX += diffX * diffX;
    denominatorY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denominatorX * denominatorY);
  
  if (denominator === 0) {
    return NaN;
  }
  
  return numerator / denominator;
}

/**
 * Gets data from the active sheet
 * @return {Object} Object with sheet name, range, and values
 */
function getActiveSheetData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    if (!sheet) {
      throw new Error("No active sheet");
    }
    
    const lastRow = Math.max(1, sheet.getLastRow());
    const lastCol = Math.max(1, sheet.getLastColumn());
    
    if (lastRow === 1 && lastCol === 1 && !sheet.getRange(1, 1).getValue()) {
      // Empty sheet
      return {
        sheetName: sheet.getName(),
        range: "A1",
        values: [[""]],
        isEmpty: true
      };
    }
    
    const range = sheet.getRange(1, 1, lastRow, lastCol);
    return {
      sheetName: sheet.getName(),
      range: range.getA1Notation(),
      values: range.getValues(),
      isEmpty: false
    };
  } catch (error) {
    Logger.log('Error getting active sheet data: ' + error);
    throw error;
  }
}

/**
 * Analyzes a data range and provides insights
 * @param {Object} dataRange - The data range to analyze
 * @param {string} prompt - The user's prompt
 * @param {string} model - The AI model to use
 * @return {string} Analysis response
 */
function analyzeDataRange(dataRange, prompt, model) {
  try {
    Logger.log(`Analyzing data range: ${dataRange.sheetName}!${dataRange.range} with model: ${model}`);
    
    // You would typically call your AI service here
    // For now, we'll return a demonstration response
    const rowCount = dataRange.values.length;
    const colCount = dataRange.values[0].length;
    
    // Extract headers (assume first row contains headers)
    const headers = dataRange.values[0];
    
    // Simple statistics about numerical columns
    let stats = {};
    let numericCols = [];
    
    for (let c = 0; c < headers.length; c++) {
      let numValues = [];
      for (let r = 1; r < dataRange.values.length; r++) {
        const val = dataRange.values[r][c];
        if (typeof val === 'number' || !isNaN(parseFloat(val))) {
          numValues.push(typeof val === 'number' ? val : parseFloat(val));
        }
      }
      
      if (numValues.length > 0) {
        numericCols.push(c);
        const sum = numValues.reduce((a, b) => a + b, 0);
        const avg = sum / numValues.length;
        stats[headers[c]] = {
          min: Math.min(...numValues),
          max: Math.max(...numValues),
          avg: avg.toFixed(2),
          count: numValues.length
        };
      }
    }
    
    let response = `# Data Analysis for ${dataRange.sheetName}!${dataRange.range}\n\n`;
    response += `I've analyzed your data, which consists of ${rowCount} rows and ${colCount} columns.\n\n`;
    
    // Add statistics for numeric columns
    if (Object.keys(stats).length > 0) {
      response += `## Numeric Column Statistics\n\n`;
      for (const [col, colStats] of Object.entries(stats)) {
        response += `### ${col}\n`;
        response += `- Min: ${colStats.min}\n`;
        response += `- Max: ${colStats.max}\n`;
        response += `- Average: ${colStats.avg}\n`;
        response += `- Count: ${colStats.count}\n\n`;
      }
    }
    
    // Add insights based on data patterns
    response += `## Key Insights\n\n`;
    
    if (numericCols.length >= 2) {
      response += `- There appear to be ${numericCols.length} numerical columns in this dataset, which could be good candidates for calculation and visualization.\n`;
      response += `- You might want to consider creating a chart to visualize the relationship between ${headers[numericCols[0]]} and ${headers[numericCols[1]]}.\n`;
    } else if (numericCols.length === 1) {
      response += `- Column "${headers[numericCols[0]]}" contains numerical data that could be visualized with a bar or column chart.\n`;
    } else {
      response += `- This dataset doesn't contain many numerical columns, suggesting it might be better suited for categorical analysis.\n`;
    }
    
    // Add recommendations
    response += `\n## Recommendations\n\n`;
    response += `- Consider using the "Create Chart" feature to visualize key metrics.\n`;
    response += `- For further analysis, you might want to filter the data to focus on specific patterns.\n`;
    
    return response;
  } catch (error) {
    Logger.log('Error analyzing data range: ' + error);
    throw error;
  }
}

/**
 * Suggests charts for a data range
 * @param {Object} dataRange - The data range to analyze
 * @param {string} prompt - The user's prompt
 * @param {string} model - The AI model to use
 * @return {string} Chart suggestion response
 */
function suggestChartForData(dataRange, prompt, model) {
  try {
    Logger.log(`Suggesting charts for data range: ${dataRange.sheetName}!${dataRange.range} with model: ${model}`);
    
    // You would typically call your AI service here
    // For now, we'll return a demonstration response
    
    // Extract headers (assume first row contains headers)
    const headers = dataRange.values[0];
    
    // Count numeric columns
    let numericCols = [];
    let categoricalCols = [];
    
    for (let c = 0; c < headers.length; c++) {
      let numValues = [];
      let uniqueValues = new Set();
      
      for (let r = 1; r < dataRange.values.length; r++) {
        const val = dataRange.values[r][c];
        uniqueValues.add(val);
        
        if (typeof val === 'number' || !isNaN(parseFloat(val))) {
          numValues.push(typeof val === 'number' ? val : parseFloat(val));
        }
      }
      
      if (numValues.length > 0 && numValues.length > (dataRange.values.length - 1) * 0.5) {
        numericCols.push({index: c, name: headers[c]});
      }
      
      // Consider columns with few unique values as categorical
      if (uniqueValues.size > 1 && uniqueValues.size <= 10) {
        categoricalCols.push({index: c, name: headers[c]});
      }
    }
    
    let response = `# Chart Recommendations for Your Data\n\n`;
    
    if (numericCols.length >= 2 && categoricalCols.length >= 1) {
      // Scenario: Multiple numeric columns and at least one categorical column
      response += `Based on your data in ${dataRange.sheetName}!${dataRange.range}, I recommend creating a **Column Chart** that shows the relationship between:\n\n`;
      response += `- **X-axis (Categories)**: ${categoricalCols[0].name}\n`;
      response += `- **Y-axis (Values)**: ${numericCols[0].name} and ${numericCols[1].name}\n\n`;
      
      response += `This would allow you to compare ${numericCols[0].name} and ${numericCols[1].name} across different ${categoricalCols[0].name} categories. Column charts are excellent for comparing values across categories.\n\n`;
      
      response += `### Alternative Chart Options\n\n`;
      response += `1. **Bar Chart** - Same as the column chart but with horizontal bars instead of vertical columns. Useful if you have long category names.\n\n`;
      response += `2. **Line Chart** - If your data represents a time series or continuous progression, a line chart would better show the trend.\n\n`;
      response += `3. **Scatter Plot** - If you want to examine the correlation between ${numericCols[0].name} and ${numericCols[1].name}, a scatter plot would be ideal.\n\n`;
      
      response += `To create this chart, select your data range and use Insert > Chart from the Google Sheets menu, or click the "Create Chart" button in the sidebar.`;
      
    } else if (numericCols.length === 1 && categoricalCols.length >= 1) {
      // Scenario: One numeric column and at least one categorical column
      response += `Based on your data in ${dataRange.sheetName}!${dataRange.range}, I recommend creating a **Pie Chart** that shows the distribution of ${numericCols[0].name} across different ${categoricalCols[0].name} categories.\n\n`;
      
      response += `Pie charts are excellent for showing how a single metric is distributed across categories, particularly when you want to emphasize proportions of a whole.\n\n`;
      
      response += `### Alternative Chart Options\n\n`;
      response += `1. **Column Chart** - A column chart would also work well for this data and makes it easier to compare exact values.\n\n`;
      response += `2. **Donut Chart** - Similar to a pie chart but with a hole in the center, which can sometimes be more visually appealing.\n\n`;
      
      response += `To create this chart, select your data range and use Insert > Chart from the Google Sheets menu, or click the "Create Chart" button in the sidebar.`;
      
    } else if (numericCols.length >= 2) {
      // Scenario: Multiple numeric columns but no good categorical columns
      response += `Based on your data in ${dataRange.sheetName}!${dataRange.range}, I recommend creating a **Scatter Plot** that shows the relationship between ${numericCols[0].name} and ${numericCols[1].name}.\n\n`;
      
      response += `Scatter plots are excellent for visualizing correlations between two numeric variables. This would help you identify if there's a relationship between these metrics.\n\n`;
      
      response += `### Alternative Chart Options\n\n`;
      response += `1. **Line Chart** - If your data represents a time series or progression, a line chart would better show the trend.\n\n`;
      response += `2. **Combo Chart** - You could use a combo chart to show ${numericCols[0].name} as columns and ${numericCols[1].name} as a line on a secondary axis.\n\n`;
      
      response += `To create this chart, select your data range and use Insert > Chart from the Google Sheets menu, or click the "Create Chart" button in the sidebar.`;
      
    } else if (numericCols.length === 1) {
      // Scenario: Just one numeric column
      response += `Based on your data in ${dataRange.sheetName}!${dataRange.range}, I recommend creating a **Histogram** for ${numericCols[0].name}.\n\n`;
      
      response += `A histogram would show the distribution of values in ${numericCols[0].name}, helping you understand the range and frequency of values.\n\n`;
      
      response += `### Alternative Chart Options\n\n`;
      response += `1. **Column Chart** - A simple column chart with row numbers or another field as the x-axis could also work.\n\n`;
      
      response += `To create this chart, select your data range and use Insert > Chart from the Google Sheets menu, or click the "Create Chart" button in the sidebar.`;
      
    } else if (categoricalCols.length >= 1) {
      // Scenario: Only categorical data
      response += `Based on your data in ${dataRange.sheetName}!${dataRange.range}, I recommend creating a **Bar Chart** that shows the frequency count of each ${categoricalCols[0].name} category.\n\n`;
      
      response += `Since your data is primarily categorical, a bar chart showing the count of each category would be most informative.\n\n`;
      
      response += `### Alternative Chart Options\n\n`;
      response += `1. **Pie Chart** - A pie chart could also work to show the proportion of each category.\n\n`;
      
      response += `To create this chart, you'll first need to create a summary table that counts the occurrences of each category, then create a chart based on that summary.`;
      
    } else {
      // Scenario: No good columns for charting
      response += `Based on my analysis of your data in ${dataRange.sheetName}!${dataRange.range}, I don't see clear numeric or categorical columns that would make for an effective chart.\n\n`;
      
      response += `Your data might need some preprocessing before visualization. Here are some suggestions:\n\n`;
      response += `1. **Transform text data** to numeric values where appropriate.\n\n`;
      response += `2. **Create summary tables** to aggregate your data into chartable metrics.\n\n`;
      response += `3. **Filter your data** to focus on specific patterns or trends.\n\n`;
      
      response += `Once you've prepared your data, try using the "Create Chart" feature again for better visualization options.`;
    }
    
    return response;
  } catch (error) {
    Logger.log('Error suggesting charts for data range: ' + error);
    throw error;
  }
}

/**
 * Suggests formulas for a data range
 * @param {Object} dataRange - The data range to analyze
 * @param {string} prompt - The user's prompt
 * @param {string} model - The AI model to use
 * @return {string} Formula suggestions response
 */
function suggestFormulas(dataRange, prompt, model) {
  try {
    Logger.log(`Suggesting formulas for data range: ${dataRange.sheetName}!${dataRange.range} with model: ${model}`);
    
    // You would typically call your AI service here
    // For now, we'll return a demonstration response
    
    // Extract headers (assume first row contains headers)
    const headers = dataRange.values[0];
    
    // Identify column types
    let numericCols = [];
    let textCols = [];
    let dateCols = [];
    
    for (let c = 0; c < headers.length; c++) {
      let numCount = 0;
      let textCount = 0;
      let dateCount = 0;
      
      for (let r = 1; r < dataRange.values.length; r++) {
        const val = dataRange.values[r][c];
        
        if (val instanceof Date) {
          dateCount++;
        } else if (typeof val === 'number' || !isNaN(parseFloat(val))) {
          numCount++;
        } else if (typeof val === 'string' && val.trim() !== '') {
          textCount++;
        }
      }
      
      // Determine predominant type
      const totalCells = dataRange.values.length - 1; // Excluding header
      if (numCount > 0.5 * totalCells) {
        numericCols.push({index: c, name: headers[c]});
      } else if (dateCount > 0.5 * totalCells) {
        dateCols.push({index: c, name: headers[c]});
      } else if (textCount > 0.5 * totalCells) {
        textCols.push({index: c, name: headers[c]});
      }
    }
    
    let response = `# Formula Suggestions for Your Data\n\n`;
    response += `Based on my analysis of your data in ${dataRange.sheetName}!${dataRange.range}, here are some useful formulas you could use:\n\n`;
    
    // Numeric column suggestions
    if (numericCols.length > 0) {
      response += `## For Numeric Data (${numericCols.map(col => col.name).join(', ')})\n\n`;
      
      response += `### Basic Statistical Formulas\n`;
      
      if (numericCols.length > 0) {
        const col = numericCols[0];
        const colLetter = columnIndexToLetter(col.index + 1); // 1-based column indexing in A1 notation
        
        response += `- **SUM**: Calculate the total of all values\n`;
        response += `  \`=SUM(${colLetter}2:${colLetter}${dataRange.values.length})\`\n\n`;
        
        response += `- **AVERAGE**: Calculate the average value\n`;
        response += `  \`=AVERAGE(${colLetter}2:${colLetter}${dataRange.values.length})\`\n\n`;
        
        response += `- **MAX/MIN**: Find the highest/lowest values\n`;
        response += `  \`=MAX(${colLetter}2:${colLetter}${dataRange.values.length})\`\n`;
        response += `  \`=MIN(${colLetter}2:${colLetter}${dataRange.values.length})\`\n\n`;
        
        response += `- **COUNTIF**: Count values meeting specific criteria\n`;
        response += `  \`=COUNTIF(${colLetter}2:${colLetter}${dataRange.values.length}, ">100")\`\n\n`;
      }
      
      if (numericCols.length >= 2) {
        response += `### Advanced Analysis\n`;
        
        const col1 = numericCols[0];
        const col2 = numericCols[1];
        const col1Letter = columnIndexToLetter(col1.index + 1);
        const col2Letter = columnIndexToLetter(col2.index + 1);
        
        response += `- **CORREL**: Calculate correlation between ${col1.name} and ${col2.name}\n`;
        response += `  \`=CORREL(${col1Letter}2:${col1Letter}${dataRange.values.length}, ${col2Letter}2:${col2Letter}${dataRange.values.length})\`\n\n`;
        
        response += `- **SUMPRODUCT**: Multiply and sum values from multiple columns\n`;
        response += `  \`=SUMPRODUCT(${col1Letter}2:${col1Letter}${dataRange.values.length}, ${col2Letter}2:${col2Letter}${dataRange.values.length})\`\n\n`;
      }
    }
    
    // Text column suggestions
    if (textCols.length > 0) {
      response += `## For Text Data (${textCols.map(col => col.name).join(', ')})\n\n`;
      
      if (textCols.length > 0) {
        const col = textCols[0];
        const colLetter = columnIndexToLetter(col.index + 1);
        
        response += `- **CONCATENATE**: Combine text from different cells\n`;
        response += `  \`=CONCATENATE(A2, " ", ${colLetter}2)\`\n\n`;
        
        response += `- **LEFT/RIGHT/MID**: Extract portions of text\n`;
        response += `  \`=LEFT(${colLetter}2, 5)\`\n`;
        response += `  \`=RIGHT(${colLetter}2, 3)\`\n`;
        response += `  \`=MID(${colLetter}2, 2, 4)\`\n\n`;
        
        response += `- **PROPER**: Convert to proper case (capitalize first letter of each word)\n`;
        response += `  \`=PROPER(${colLetter}2)\`\n\n`;
        
        response += `- **COUNTUNIQUE**: Count unique values\n`;
        response += `  \`=COUNTUNIQUE(${colLetter}2:${colLetter}${dataRange.values.length})\`\n\n`;
      }
    }
    
    // Date column suggestions
    if (dateCols.length > 0) {
      response += `## For Date Data (${dateCols.map(col => col.name).join(', ')})\n\n`;
      
      if (dateCols.length > 0) {
        const col = dateCols[0];
        const colLetter = columnIndexToLetter(col.index + 1);
        
        response += `- **DATEDIF**: Calculate the difference between dates\n`;
        response += `  \`=DATEDIF(${colLetter}2, TODAY(), "D")\` (days between date and today)\n\n`;
        
        response += `- **MONTH/YEAR/DAY**: Extract components from dates\n`;
        response += `  \`=MONTH(${colLetter}2)\`\n`;
        response += `  \`=YEAR(${colLetter}2)\`\n`;
        response += `  \`=DAY(${colLetter}2)\`\n\n`;
        
        response += `- **WORKDAY**: Calculate workdays\n`;
        response += `  \`=WORKDAY(${colLetter}2, 10)\` (date after 10 workdays)\n\n`;
      }
    }
    
    // Conditional formatting and other useful formulas
    response += `## Other Useful Formulas\n\n`;
    
    response += `- **VLOOKUP**: Look up values in another table\n`;
    response += `  \`=VLOOKUP(A2, Sheet2!A:B, 2, FALSE)\`\n\n`;
    
    response += `- **IF**: Conditional logic\n`;
    response += `  \`=IF(A2>100, "High", "Low")\`\n\n`;
    
    response += `- **ARRAYFORMULA**: Apply formulas to entire columns\n`;
    response += `  \`=ARRAYFORMULA(A2:A${dataRange.values.length}*2)\`\n\n`;
    
    response += `- **QUERY**: SQL-like queries for your data\n`;
    response += `  \`=QUERY(A1:${columnIndexToLetter(headers.length)}${dataRange.values.length}, "SELECT A, B, C WHERE A > 100 ORDER BY C DESC")\`\n\n`;
    
    response += `Would you like me to explain any of these formulas in more detail or suggest formulas for a specific task?`;
    
    return response;
  } catch (error) {
    Logger.log('Error suggesting formulas for data range: ' + error);
    throw error;
  }
}

/**
 * Helper function to convert column index to letter (1 = A, 2 = B, etc.)
 * @param {number} columnIndex - 1-based column index
 * @return {string} Column letter(s)
 */
function columnIndexToLetter(columnIndex) {
  let temp, letter = '';
  while (columnIndex > 0) {
    temp = (columnIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnIndex = (columnIndex - temp - 1) / 26;
  }
  return letter;
}