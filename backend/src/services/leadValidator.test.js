const { validateAndSanitizeLead } = require('./leadValidator.service');

describe('leadValidator.service', () => {
  const fallbackDate = new Date('2026-01-01T00:00:00.000Z');

  test('should validate and pass a correct lead', () => {
    const rawLead = {
      name: 'John Doe',
      email: 'john@example.com',
      mobile_without_country_code: '9876543210',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'leads_on_demand',
      created_at: '2026-05-10T12:00:00.000Z',
      company: 'Test Corp',
    };

    const result = validateAndSanitizeLead(rawLead, fallbackDate);

    expect(result.isValid).toBe(true);
    expect(result.record.name).toBe('John Doe');
    expect(result.record.email).toBe('john@example.com');
    expect(result.record.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(result.record.data_source).toBe('leads_on_demand');
    expect(result.record.created_at.toISOString()).toBe('2026-05-10T12:00:00.000Z');
  });

  test('should fallback invalid crm_status and data_source to empty strings', () => {
    const rawLead = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      crm_status: 'NOT_A_VALID_STATUS',
      data_source: 'not_a_valid_source',
    };

    const result = validateAndSanitizeLead(rawLead, fallbackDate);

    expect(result.isValid).toBe(true);
    expect(result.record.crm_status).toBe('');
    expect(result.record.data_source).toBe('');
  });

  test('should fallback created_at date to default timestamp if unparseable', () => {
    const rawLead = {
      name: 'Test Date Fallback',
      email: 'date@example.com',
      created_at: 'invalid-date-string',
    };

    const result = validateAndSanitizeLead(rawLead, fallbackDate);

    expect(result.isValid).toBe(true);
    expect(result.record.created_at).toEqual(fallbackDate);
  });

  test('should fail validation and skip lead if BOTH email and mobile are missing', () => {
    const rawLead = {
      name: 'No Contacts Lead',
      company: 'Ghost LLC',
      crm_status: 'BAD_LEAD',
    };

    const result = validateAndSanitizeLead(rawLead, fallbackDate);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Both email and mobile number are missing');
  });

  test('should escape stray newlines inside fields to keep CSV alignment', () => {
    const rawLead = {
      name: 'Newline\nName',
      email: 'newline@example.com',
      description: 'Line 1\r\nLine 2\rLine 3',
    };

    const result = validateAndSanitizeLead(rawLead, fallbackDate);

    expect(result.isValid).toBe(true);
    expect(result.record.name).toBe('Newline\\nName');
    expect(result.record.description).toBe('Line 1\\nLine 2\\nLine 3');
  });
});
