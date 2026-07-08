const multer = require('multer');
const path = require('path');
const env = require('../config/env');

// Set up memory storage (no disk writes)
const storage = multer.memoryStorage();

// Dynamic file size calculation
const maxSizeBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Accept standard CSV MIME types and extensions
  const isCsvMime = [
    'text/csv',
    'application/csv',
    'text/comma-separated-values',
    'application/vnd.ms-excel',
    'application/octet-stream' // fallback sometimes used by browser
  ].includes(file.mimetype);

  const isCsvExt = fileExt === '.csv';

  if (isCsvExt || isCsvMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV files (.csv) are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxSizeBytes,
  },
  fileFilter: fileFilter,
}).single('file');

/**
 * Wrapper middleware to intercept Multer errors (e.g. file size exceeded) 
 * and return user-friendly error responses.
 */
const csvUploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: {
              message: `File too large. Maximum allowed size is ${env.MAX_UPLOAD_SIZE_MB}MB.`,
              code: 'FILE_TOO_LARGE'
            }
          });
        }
        return res.status(400).json({
          error: {
            message: `Upload error: ${err.message}`,
            code: 'MULTER_ERROR'
          }
        });
      }
      return res.status(400).json({
        error: {
          message: err.message,
          code: 'INVALID_FILE_TYPE'
        }
      });
    }
    next();
  });
};

module.exports = csvUploadMiddleware;
