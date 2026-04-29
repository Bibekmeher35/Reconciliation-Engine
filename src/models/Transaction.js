const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['USER', 'EXCHANGE'],
    required: true,
  },
  runId: {
    type: String, // To group transactions by reconciliation run
    required: true,
  },
  transaction_id: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: null, // Null if invalid
  },
  type: {
    type: String,
    default: '',
  },
  asset: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    default: 0,
  },
  price_usd: {
    type: Number,
    default: null,
  },
  fee: {
    type: Number,
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
  originalRow: {
    type: mongoose.Schema.Types.Mixed, // The raw CSV row object
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  issues: [{
    type: String,
  }],
}, { timestamps: true });

// Create compound index for fast querying during matching
transactionSchema.index({ runId: 1, source: 1, asset: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
