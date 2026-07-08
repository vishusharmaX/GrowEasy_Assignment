/**
 * Validates and sanitizes a single lead record returned by the LLM.
 * 
 * Enforces:
 * 1. crm_status: must be one of 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'. Otherwise set to empty string.
 * 2. data_source: must be one of 'leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'. Otherwise set to empty string.
 * 3. created_at: must be parseable by new Date(created_at). If not, fallback to importTimestamp.
 * 4. Discards record (moved to skipped) if BOTH email and mobile_without_country_code are empty.
 * 5. Escapes/strips stray newlines inside any field so the record stays a single logical CSV row.
 * 
 * @param {Object} record - The CRM lead record from LLM mapping
 * @param {Date} importTimestamp - Fallback timestamp
 * @returns {Object} { isValid, record: sanitizedRecord, reason: string }
 */
const validateAndSanitizeLead = (record, importTimestamp = new Date()) => {
  if (!record || typeof record !== 'object') {
    return {
      isValid: false,
      reason: 'Record is empty or invalid object format',
    };
  }

  // Create a copy of the record to sanitize
  const sanitized = { ...record };

  // Helper to safely convert/clean string fields and escape newlines
  const cleanField = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    // Escape newlines as '\n' or strip them
    return str.replace(/\r?\n|\r/g, '\\n');
  };

  // Clean all fields of newlines first
  const fields = [
    'name', 'email', 'country_code', 'mobile_without_country_code',
    'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
    'crm_note', 'data_source', 'possession_time', 'description'
  ];

  fields.forEach(field => {
    sanitized[field] = cleanField(sanitized[field]);
  });

  // 1. Enforce crm_status enum
  const allowedStatuses = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
  if (!allowedStatuses.includes(sanitized.crm_status)) {
    sanitized.crm_status = '';
  }

  // 2. Enforce data_source enum
  const allowedDataSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
  if (!allowedDataSources.includes(sanitized.data_source)) {
    sanitized.data_source = '';
  }

  // 3. Enforce created_at parsing
  let parsedDate = new Date(sanitized.created_at || '');
  if (isNaN(parsedDate.getTime())) {
    parsedDate = importTimestamp;
  }
  sanitized.created_at = parsedDate;

  // 4. Discard if both email and mobile_without_country_code are empty
  const hasEmail = sanitized.email && sanitized.email.length > 0;
  const hasMobile = sanitized.mobile_without_country_code && sanitized.mobile_without_country_code.length > 0;

  if (!hasEmail && !hasMobile) {
    return {
      isValid: false,
      reason: 'Both email and mobile number are missing',
      record: sanitized,
    };
  }

  return {
    isValid: true,
    record: sanitized,
  };
};

module.exports = {
  validateAndSanitizeLead,
};
