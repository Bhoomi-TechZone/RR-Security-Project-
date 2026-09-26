import express from 'express';
import {
  getAttendanceRecords,
  bulkImportAttendance,
  saveAttendanceRecord,
  getCorrectionRequests,
  submitCorrectionRequest,
  reviewCorrectionRequest,
} from '../controllers/attendanceController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAttendanceRecords)
  .post(adminOnly, saveAttendanceRecord);

router.post('/bulk-import', adminOnly, bulkImportAttendance);

router
  .route('/corrections')
  .get(getCorrectionRequests)
  .post(submitCorrectionRequest);

router.put('/corrections/:id', adminOnly, reviewCorrectionRequest);

export default router;
