const { parse } = require('csv-parse/sync');

/**
 * Parses CSV buffer or string into an array of objects.
 * Columns are automatically determined from the first line.
 * 
 * @param {Buffer|string} csvContent 
 * @returns {Array<Object>} Array of records
 */
const parseCsv = (csvContent) => {
  try {
    const content = Buffer.isBuffer(csvContent) ? csvContent.toString('utf8') : csvContent;
    
    // Parse using csv-parse sync API
    const records = parse(content, {
      columns: true,            // Interpret the first row as column names
      skip_empty_lines: true,   // Ignore empty rows
      trim: true,               // Trim whitespaces around headers and fields
      bom: true,                 // Detect and strip UTF-8 BOM
    });
    
    return records;
  } catch (error) {
    console.error('CSV Parsing Error:', error.message);
    throw new Error(`Failed to parse CSV file: ${error.message}`);
  }
};

module.exports = {
  parseCsv,
};
