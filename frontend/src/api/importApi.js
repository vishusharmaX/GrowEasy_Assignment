const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Uploads a CSV file to kick off the CRM import.
 * 
 * @param {File} file 
 * @returns {Promise<Object>} The API response containing batchId
 */
export const uploadCsvFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${baseUrl}/api/import/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to upload CSV file');
  }

  return data;
};

/**
 * Fetches progress and final details of a specific batch.
 * 
 * @param {string} batchId 
 * @returns {Promise<Object>} The API response containing status, totals, and records
 */
export const fetchBatchStatus = async (batchId) => {
  const response = await fetch(`${baseUrl}/api/import/${batchId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Failed to fetch batch with ID ${batchId}`);
  }

  return data;
};
