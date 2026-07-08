const express = require('express');
const importController = require('../controllers/import.controller');
const csvUploadMiddleware = require('../middleware/upload.middleware');

const router = express.Router();

// Step 3 Confirmation - Upload and start parsing CSV
router.post('/upload', csvUploadMiddleware, importController.uploadCsv);

// Step 3 / Step 4 - Get details / progress of a specific batch
router.get('/:batchId', importController.getBatchStatus);

module.exports = router;
