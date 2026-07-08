const llmClient = require('./llmClient');
const leadValidator = require('./leadValidator.service');
const Lead = require('../models/Lead');
const ImportBatch = require('../models/ImportBatch');
const db = require('../config/db');
const env = require('../config/env');

// In-memory fallback cache for batches (when DB is disconnected)
const inMemoryBatches = new Map();

const systemPrompt = `You are a CRM data-mapping engine for GrowEasy. You will receive an array of raw lead
records extracted from an arbitrary CSV (unknown column names, unknown layout — could be
a Facebook Lead export, Google Ads export, Excel dump, real-estate CRM export, sales
report, or manually made spreadsheet).

For every input record, map whatever fields are available onto this exact CRM schema:
created_at, name, email, country_code, mobile_without_country_code, company, city,
state, country, lead_owner, crm_status, crm_note, data_source, possession_time,
description.

Rules you MUST follow:
1. crm_status: use ONLY one of GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
   If nothing in the row confidently maps to one of these, leave it blank — never invent one.
2. data_source: use ONLY one of leads_on_demand, meridian_tower, eden_park, varah_swamy,
   sarjapur_plots. If nothing matches confidently, leave it blank.
3. created_at: output a value parseable by JavaScript's \`new Date(created_at)\`.
4. crm_note: put remarks, follow-up notes, extra comments, extra phone numbers, and extra
   email addresses here — anything useful that doesn't fit another field.
5. If a record has multiple emails, use the first as \`email\` and append the rest into
   \`crm_note\`. If it has multiple mobile numbers, use the first as
   \`mobile_without_country_code\` and append the rest into \`crm_note\`.
6. Keep every record as a single flat JSON object — never introduce literal newlines inside
   a field; escape them as \\n if unavoidable.
7. If a record has neither an email nor a mobile number anywhere in its original columns,
   omit it from the output and instead list it in a separate "skipped" array with a short
   reason.
8. Return ONLY valid JSON in this exact shape, nothing else, no markdown fences, no prose:
{
  "records": [ { "created_at": "...", "name": "...", ... }, ... ],
  "skipped": [ { "originalRow": <int index within this batch>, "reason": "..." }, ... ]
}`;

/**
 * Helper sleep function for backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * LLM Call with exponential backoff retry mechanism.
 */
const callLlmWithRetry = async (userPayload, retriesLeft = env.LLM_MAX_RETRIES, delay = 1000) => {
  try {
    const rawResult = await llmClient.getLlmResponse({
      systemPrompt,
      userPayload,
    });
    return JSON.parse(rawResult);
  } catch (error) {
    if (retriesLeft <= 0) {
      throw error;
    }
    console.warn(`LLM batch processing failed. Retrying in ${delay}ms... Error: ${error.message}`);
    await sleep(delay);
    return callLlmWithRetry(userPayload, retriesLeft - 1, delay * 2);
  }
};

/**
 * Persists an import batch status update to DB or in-memory fallback.
 */
const saveBatchUpdate = async (batchId, updateData) => {
  const isDbConnected = db.getDbStatus();
  
  if (isDbConnected) {
    try {
      await ImportBatch.findOneAndUpdate({ batchId }, updateData, { new: true, upsert: true });
    } catch (err) {
      console.error('Failed to save batch status in MongoDB:', err.message);
    }
  }
  
  // Always update in-memory cache as well
  const current = inMemoryBatches.get(batchId) || { batchId, records: [] };
  const updated = {
    ...current,
    ...updateData,
    // Merge arrays if updated
    skipped: updateData.skipped ? [...(current.skipped || []), ...updateData.skipped] : current.skipped,
    records: updateData.records ? [...(current.records || []), ...updateData.records] : current.records,
  };
  inMemoryBatches.set(batchId, updated);
};

/**
 * Retrieves the batch info (leads and skipped logs) from DB or in-memory fallback.
 */
const getBatchDetails = async (batchId) => {
  const isDbConnected = db.getDbStatus();
  
  if (isDbConnected) {
    try {
      const batchDoc = await ImportBatch.findOne({ batchId });
      if (batchDoc) {
        const leads = await Lead.find({ batchId });
        return {
          batchId: batchDoc.batchId,
          filename: batchDoc.filename,
          totalRows: batchDoc.totalRows,
          totalImported: batchDoc.totalImported,
          totalSkipped: batchDoc.totalSkipped,
          status: batchDoc.status,
          skipped: batchDoc.skipped,
          records: leads,
          errorMessage: batchDoc.errorMessage,
        };
      }
    } catch (err) {
      console.error('Failed to retrieve batch from MongoDB, trying memory fallback:', err.message);
    }
  }
  
  return inMemoryBatches.get(batchId) || null;
};

/**
 * Processes lead extraction in asynchronous batches.
 * 
 * @param {string} batchId - Unique session ID
 * @param {string} filename - Filename of upload
 * @param {Array<Object>} rows - Full parsed CSV objects
 */
const startExtraction = async (batchId, filename, rows) => {
  const importTimestamp = new Date();
  const totalRows = rows.length;

  // Initialize batch status
  await saveBatchUpdate(batchId, {
    filename,
    totalRows,
    totalImported: 0,
    totalSkipped: 0,
    status: 'processing',
    skipped: [],
    records: [],
  });

  // Run asynchronously
  (async () => {
    try {
      const batchSize = env.LLM_BATCH_SIZE;
      let totalImported = 0;
      let totalSkipped = 0;
      const allSkipped = [];
      const allValidatedLeads = [];

      for (let i = 0; i < totalRows; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const payloadString = JSON.stringify(chunk);
        
        let llmResult;
        try {
          llmResult = await callLlmWithRetry(payloadString);
        } catch (error) {
          console.error(`AI batch processing permanently failed after retries for index range ${i} to ${i + chunk.length}:`, error.message);
          // Mark all items in this chunk as skipped
          chunk.forEach((_, subIdx) => {
            const rowIndex = i + subIdx;
            allSkipped.push({
              rowIndex,
              reason: 'AI extraction failed permanently after retries',
            });
            totalSkipped++;
          });
          
          // Update status update intermediate
          await saveBatchUpdate(batchId, {
            totalImported,
            totalSkipped,
            skipped: allSkipped.slice(-chunk.length),
          });
          continue;
        }

        // Map LLM result back to original rows and validate
        const llmSkipped = llmResult.skipped || [];
        const llmRecords = llmResult.records || [];
        
        // Identify skipped index sets in batch
        const llmSkippedIndices = new Set(llmSkipped.map(item => Number(item.originalRow)));
        const batchSkippedMap = new Map(llmSkipped.map(item => [Number(item.originalRow), item.reason]));
        
        let recordPointer = 0;
        const currentBatchSkipped = [];
        const currentBatchLeads = [];

        for (let subIdx = 0; subIdx < chunk.length; subIdx++) {
          const globalRowIndex = i + subIdx;
          
          if (llmSkippedIndices.has(subIdx)) {
            // Skipped by LLM
            const reason = batchSkippedMap.get(subIdx) || 'Skipped by AI mapping engine';
            currentBatchSkipped.push({
              rowIndex: globalRowIndex,
              reason,
            });
            totalSkipped++;
          } else {
            // Map to LLM-processed record
            const rawRecord = llmRecords[recordPointer++];
            if (!rawRecord) {
              currentBatchSkipped.push({
                rowIndex: globalRowIndex,
                reason: 'AI engine mapping mismatch: omitted record in output',
              });
              totalSkipped++;
              continue;
            }

            // Run deterministic validator
            const validation = leadValidator.validateAndSanitizeLead(rawRecord, importTimestamp);
            if (validation.isValid) {
              const leadObj = {
                ...validation.record,
                batchId,
              };
              
              currentBatchLeads.push(leadObj);
              allValidatedLeads.push(leadObj);
              totalImported++;
            } else {
              currentBatchSkipped.push({
                rowIndex: globalRowIndex,
                reason: validation.reason || 'Failed server-side validation checks',
              });
              totalSkipped++;
            }
          }
        }

        // Save valid leads of this batch to MongoDB if connected
        if (db.getDbStatus() && currentBatchLeads.length > 0) {
          try {
            await Lead.insertMany(currentBatchLeads);
          } catch (dbErr) {
            console.error('Failed to insert leads into MongoDB:', dbErr.message);
          }
        }

        // Add skipped rows
        allSkipped.push(...currentBatchSkipped);

        // Update intermediate progress
        await saveBatchUpdate(batchId, {
          totalImported,
          totalSkipped,
          skipped: currentBatchSkipped,
          records: currentBatchLeads, // will append in cache
        });
      }

      // Mark batch processing complete
      await saveBatchUpdate(batchId, {
        status: 'completed',
        totalImported,
        totalSkipped,
      });
      console.log(`Batch ${batchId} completed. Imported: ${totalImported}, Skipped: ${totalSkipped}`);

    } catch (criticalErr) {
      console.error(`Critical failure during async batch parsing on batch ${batchId}:`, criticalErr);
      await saveBatchUpdate(batchId, {
        status: 'failed',
        errorMessage: criticalErr.message,
      });
    }
  })();
};

module.exports = {
  startExtraction,
  getBatchDetails,
};
