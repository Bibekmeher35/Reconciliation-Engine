const express = require('express');
const router = express.Router();
const {
  triggerReconciliation,
  getReportCsv,
  getSummary,
  getUnmatched,
} = require('../controllers/reconciliationController');

router.post('/reconcile', triggerReconciliation);
router.get('/report/:runId', getReportCsv);
router.get('/report/:runId/summary', getSummary);
router.get('/report/:runId/unmatched', getUnmatched);

module.exports = router;
