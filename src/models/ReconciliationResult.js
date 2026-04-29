const mongoose = require('mongoose');

const reconciliationResultSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['MATCHED', 'CONFLICTING', 'UNMATCHED_USER', 'UNMATCHED_EXCHANGE'],
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  userTx: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
  exchangeTx: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
  // We denormalize original rows here so the report is easy to generate without complex lookups
  userRow: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  exchangeRow: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, { timestamps: true });

reconciliationResultSchema.index({ runId: 1, category: 1 });

module.exports = mongoose.model('ReconciliationResult', reconciliationResultSchema);
