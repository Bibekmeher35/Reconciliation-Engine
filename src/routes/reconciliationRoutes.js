import express from 'express';
const router = express.Router();
import {
  triggerReconciliation,
  getReportCsv,
  getSummary,
  getUnmatched,
} from '../controllers/reconciliationController.js';

router.post('/reconcile', triggerReconciliation);
router.get('/report/:runId', getReportCsv);
router.get('/report/:runId/summary', getSummary);
router.get('/report/:runId/unmatched', getUnmatched);

export default router;
