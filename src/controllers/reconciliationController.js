const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { createObjectCsvStringifier } = require('csv-writer');
const ReconciliationRun = require('../models/ReconciliationRun');
const ReconciliationResult = require('../models/ReconciliationResult');
const IngestionService = require('../services/IngestionService');
const MatchingEngineService = require('../services/MatchingEngineService');

// Hardcoded paths for the assignment, assuming they run from project root
const USER_CSV_PATH = path.join(__dirname, '../../user_transactions.csv');
const EXCHANGE_CSV_PATH = path.join(__dirname, '../../exchange_transactions.csv');

exports.triggerReconciliation = async (req, res) => {
  try {
    const { timeToleranceMins = 5, quantityTolerancePercent = 0.01 } = req.body;
    const runId = uuidv4();

    // Create a run record
    await ReconciliationRun.create({
      runId,
      config: { timeToleranceMins, quantityTolerancePercent },
    });

    // 1. Ingestion
    await IngestionService.process(runId, USER_CSV_PATH, EXCHANGE_CSV_PATH);

    // 2. Matching
    const { summary } = await MatchingEngineService.runMatching(runId);

    return res.status(200).json({
      message: 'Reconciliation completed successfully',
      runId,
      summary,
    });
  } catch (error) {
    console.error('Error in triggerReconciliation:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getReportCsv = async (req, res) => {
  try {
    const { runId } = req.params;
    const results = await ReconciliationResult.find({ runId }).lean();

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No report found for this runId' });
    }

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'category', title: 'Category' },
        { id: 'reason', title: 'Reason' },
        { id: 'userTxId', title: 'User Tx ID' },
        { id: 'userTimestamp', title: 'User Timestamp' },
        { id: 'userType', title: 'User Type' },
        { id: 'userAsset', title: 'User Asset' },
        { id: 'userQuantity', title: 'User Quantity' },
        { id: 'exchangeTxId', title: 'Exchange Tx ID' },
        { id: 'exchangeTimestamp', title: 'Exchange Timestamp' },
        { id: 'exchangeType', title: 'Exchange Type' },
        { id: 'exchangeAsset', title: 'Exchange Asset' },
        { id: 'exchangeQuantity', title: 'Exchange Quantity' },
      ],
    });

    const records = results.map(result => {
      const ur = result.userRow || {};
      const er = result.exchangeRow || {};
      return {
        category: result.category,
        reason: result.reason,
        userTxId: ur.transaction_id || '',
        userTimestamp: ur.timestamp || '',
        userType: ur.type || '',
        userAsset: ur.asset || '',
        userQuantity: ur.quantity || '',
        exchangeTxId: er.transaction_id || '',
        exchangeTimestamp: er.timestamp || '',
        exchangeType: er.type || '',
        exchangeAsset: er.asset || '',
        exchangeQuantity: er.quantity || '',
      };
    });

    const csvOutput = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reconciliation_report_${runId}.csv"`);
    res.status(200).send(csvOutput);
  } catch (error) {
    console.error('Error in getReportCsv:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await ReconciliationRun.findOne({ runId }).lean();

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    return res.status(200).json(run.summary);
  } catch (error) {
    console.error('Error in getSummary:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getUnmatched = async (req, res) => {
  try {
    const { runId } = req.params;
    const unmatched = await ReconciliationResult.find({
      runId,
      category: { $in: ['UNMATCHED_USER', 'UNMATCHED_EXCHANGE'] },
    }).lean();

    return res.status(200).json({ count: unmatched.length, data: unmatched });
  } catch (error) {
    console.error('Error in getUnmatched:', error);
    return res.status(500).json({ error: error.message });
  }
};
