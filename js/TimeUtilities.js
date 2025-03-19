// TimeUtilities.gs
/**
 * Converts Unix timestamp to IST.
 * @param {number|string} unixTimestampMs - Unix timestamp in milliseconds.
 * @param {string} [formatStr] - Date format (default: "yyyy-MM-dd HH:mm:ss").
 * @returns {string} Formatted IST date or error.
 */
function UNIXTOIST(unixTimestampMs, formatStr) {
  try {
    var timestamp = parseInt(unixTimestampMs, 10);
    if (isNaN(timestamp)) return "Invalid Timestamp";
    var date = new Date(timestamp);
    return Utilities.formatDate(date, 'Asia/Kolkata', formatStr || "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    return "Error: " + error.message;
  }
}

/**
 * Converts selected timestamps and inserts results in a new column.
 * @returns {Object} Result with count of conversions.
 */
function convertAndInsertTimestamps() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var selection = sheet.getActiveRange();
  var values = selection.getValues();
  var convertedCount = 0;
  var convertedValues = [];

  var startInsertCol = selection.getColumn() + selection.getNumColumns();

  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      var timestamp = values[i][j];
      var convertedValue = timestamp && !isNaN(Number(timestamp)) 
        ? UNIXTOIST(timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp), "MMM dd, yyyy HH:mm:ss")
        : "No valid timestamp";
      if (!convertedValue.startsWith("Error") && !convertedValue.startsWith("Invalid")) convertedCount++;
      convertedValues.push([convertedValue]);
    }
  }

  if (convertedValues.length > 0) {
    sheet.insertColumnsAfter(startInsertCol - 1, 1);
    sheet.getRange(1, startInsertCol).setValue("Date (IST)").setFontWeight("bold");
    sheet.getRange(selection.getRow(), startInsertCol, convertedValues.length, 1).setValues(convertedValues);
    sheet.autoResizeColumn(startInsertCol);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(convertedCount + UI_MESSAGES.TIMESTAMP_CONVERT_INSERT_SUCCESS_TOAST, UI_MESSAGES.REPORT_SUCCESS, 5);
  return { count: convertedCount };
}
