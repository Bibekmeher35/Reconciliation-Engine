import express from 'express';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
import {
  triggerReconciliation,
  getReportCsv,
  getSummary,
  getUnmatched,
} from '../controllers/reconciliationController.js';

router.post('/reconcile', upload.fields([{ name: 'userFile', maxCount: 1 }, { name: 'exchangeFile', maxCount: 1 }]), triggerReconciliation);
router.get('/report/:runId', getReportCsv);
router.get('/report/:runId/summary', getSummary);
router.get('/report/:runId/unmatched', getUnmatched);

export default router;
