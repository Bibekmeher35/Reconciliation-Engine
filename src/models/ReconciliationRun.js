const mongoose = require('mongoose');

const reconciliationRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true,
  },
  config: {
    timeToleranceMins: { type: Number, default: 5 },
    quantityTolerancePercent: { type: Number, default: 0.01 },
  },
  summary: {
    matched: { type: Number, default: 0 },
    conflicting: { type: Number, default: 0 },
    unmatchedUser: { type: Number, default: 0 },
    unmatchedExchange: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('ReconciliationRun', reconciliationRunSchema);
