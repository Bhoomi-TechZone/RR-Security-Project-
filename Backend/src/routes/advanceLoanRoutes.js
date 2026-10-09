import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getAdvanceLoanRequests,
  getAdvanceLoanRequestById,
  createAdvanceLoanRequest,
  updateAdvanceLoanRequest,
  deleteAdvanceLoanRequest,
  approveAdvanceLoanRequest,
  rejectAdvanceLoanRequest,
  getDeductionSchedules,
  getDeductionHistory,
  recordDeductionPayment,
  getAdvanceLoanStats
} from '../controllers/advanceLoanController.js';

const router = express.Router();

router.use(protect);

// Stats
router.get('/stats', getAdvanceLoanStats);

// Schedules & History
router.get('/schedules', getDeductionSchedules);
router.get('/history', getDeductionHistory);
router.post('/deductions/record', recordDeductionPayment);

// Main Requests CRUD & Actions
router.route('/')
  .get(getAdvanceLoanRequests)
  .post(createAdvanceLoanRequest);

router.route('/:id')
  .get(getAdvanceLoanRequestById)
  .put(updateAdvanceLoanRequest)
  .delete(deleteAdvanceLoanRequest);

router.post('/:id/approve', approveAdvanceLoanRequest);
router.post('/:id/reject', rejectAdvanceLoanRequest);

export default router;
