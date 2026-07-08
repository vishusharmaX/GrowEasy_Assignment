const { parseCsv } = require('./csvParser.service');

describe('csvParser.service', () => {
  test('should parse standard CSV string into array of objects', () => {
    const csvData = `Full Name,Email Address,Phone,Company Name
John Doe,john@example.com,9876543210,GrowEasy
Jane Smith,jane@example.com,1234567890,Inc Corp`;

    const result = parseCsv(csvData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      'Full Name': 'John Doe',
      'Email Address': 'john@example.com',
      'Phone': '9876543210',
      'Company Name': 'GrowEasy',
    });
    expect(result[1]).toEqual({
      'Full Name': 'Jane Smith',
      'Email Address': 'jane@example.com',
      'Phone': '1234567890',
      'Company Name': 'Inc Corp',
    });
  });

  test('should trim header keys and value columns', () => {
    const csvData = `  Full Name  ,  Email  
  John Doe  ,  john@example.com  `;

    const result = parseCsv(csvData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      'Full Name': 'John Doe',
      'Email': 'john@example.com',
    });
  });

  test('should skip empty lines in the CSV', () => {
    const csvData = `Name,Email

John Doe,john@example.com

Jane Doe,jane@example.com
`;

    const result = parseCsv(csvData);

    expect(result).toHaveLength(2);
  });

  test('should handle UTF-8 BOM characters in header', () => {
    const bomCsv = Buffer.from('\uFEFFName,Email\nJohn,john@example.com', 'utf8');
    const result = parseCsv(bomCsv);

    expect(result).toHaveLength(1);
    expect(Object.keys(result[0])).toEqual(['Name', 'Email']);
  });
});
