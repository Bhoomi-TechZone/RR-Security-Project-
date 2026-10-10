import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getOvertimeRecords,
  createOvertime,
  updateOvertimeStatus,
  deleteOvertime,
  getOvertimeAnalytics,
} from '../controllers/overtimeController.js';

const router = express.Router();

router.use(protect);

router.get('/', getOvertimeRecords);
router.get('/analytics', getOvertimeAnalytics);
router.post('/', authorize('superadmin', 'admin', 'hr', 'manager', 'employee'), createOvertime);
router.patch('/:id/status', authorize('superadmin', 'admin', 'hr', 'manager'), updateOvertimeStatus);
router.delete('/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteOvertime);

export default router;
