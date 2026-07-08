const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    country_code: {
      type: String,
      trim: true,
      default: '',
    },
    mobile_without_country_code: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    lead_owner: {
      type: String,
      trim: true,
      default: '',
    },
    crm_status: {
      type: String,
      enum: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE', ''],
      default: '',
    },
    crm_note: {
      type: String,
      default: '',
    },
    data_source: {
      type: String,
      enum: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', ''],
      default: '',
    },
    possession_time: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times in testing or hot-reload contexts
module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
