const crypto = require('crypto');
const csvParser = require('../services/csvParser.service');
const crmExtraction = require('../services/crmExtraction.service');
const env = require('../config/env');

/**
 * Handles CSV upload and starts the background AI parsing process.
 */
const uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file uploaded. Please upload a valid CSV lead file.',
          code: 'NO_FILE_UPLOADED'
        }
      });
    }

    const filename = req.file.originalname;
    
    // Auth parse server side
    let parsedRows;
    try {
      parsedRows = csvParser.parseCsv(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({
        error: {
          message: parseErr.message,
          code: 'CSV_PARSING_FAILED'
        }
      });
    }

    if (parsedRows.length === 0) {
      return res.status(400).json({
        error: {
          message: 'The uploaded CSV file is empty.',
          code: 'EMPTY_CSV_FILE'
        }
      });
    }

    // Generate batchId
    const batchId = crypto.randomUUID ? crypto.randomUUID() : `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchSize = env.LLM_BATCH_SIZE;
    const totalBatches = Math.ceil(parsedRows.length / batchSize);

    // Kick off async extraction (non-blocking)
    crmExtraction.startExtraction(batchId, filename, parsedRows);

    // Respond immediately with batch information
    return res.status(202).json({
      batchId,
      status: 'processing',
      filename,
      totalRows: parsedRows.length,
      totalBatches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Poll or fetch status and details of an import batch.
 */
const getBatchStatus = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const batch = await crmExtraction.getBatchDetails(batchId);

    if (!batch) {
      return res.status(404).json({
        error: {
          message: `Import batch with ID "${batchId}" not found.`,
          code: 'BATCH_NOT_FOUND'
        }
      });
    }

    return res.status(200).json({
      batchId: batch.batchId,
      filename: batch.filename,
      totalRows: batch.totalRows,
      totalImported: batch.totalImported,
      totalSkipped: batch.totalSkipped,
      status: batch.status,
      errorMessage: batch.errorMessage || null,
      records: batch.records || [],
      skipped: batch.skipped || []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCsv,
  getBatchStatus,
};
