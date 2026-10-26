import express from 'express';
import {
  getAttendanceRecords,
  bulkImportAttendance,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceMonths,
  getCorrectionRequests,
  submitCorrectionRequest,
  reviewCorrectionRequest,
} from '../controllers/attendanceController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/months', getAttendanceMonths);

router
  .route('/')
  .get(getAttendanceRecords)
  .post(adminOnly, saveAttendanceRecord);

router.delete('/:id', adminOnly, deleteAttendanceRecord);

router.post('/bulk-import', adminOnly, bulkImportAttendance);

router
  .route('/corrections')
  .get(getCorrectionRequests)
  .post(submitCorrectionRequest);

router.put('/corrections/:id', adminOnly, reviewCorrectionRequest);

export default router;
