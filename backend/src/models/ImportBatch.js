const mongoose = require('mongoose');

const SkippedRowSchema = new mongoose.Schema({
  rowIndex: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
}, { _id: false });

const ImportBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    totalImported: {
      type: Number,
      default: 0,
    },
    totalSkipped: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    skipped: [SkippedRowSchema],
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.ImportBatch || mongoose.model('ImportBatch', ImportBatchSchema);
