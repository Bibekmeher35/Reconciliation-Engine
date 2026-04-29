import mongoose from 'mongoose';

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

export default mongoose.model('ReconciliationRun', reconciliationRunSchema);
