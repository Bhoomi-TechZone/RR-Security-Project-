import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getReportOverview,
  getFilterOptions,
  getPayrollReport,
  getAttendanceReport,
  getBillingReport,
  getEmployeeMasterReport,
  getInventoryReport,
} from '../controllers/reportController.js';

const router = express.Router();

// Allow authenticated requests (with fallback in authMiddleware)
router.use(protect);

router.get('/overview', getReportOverview);
router.get('/filter-options', getFilterOptions);
router.get('/payroll', getPayrollReport);
router.get('/attendance', getAttendanceReport);
router.get('/billing', getBillingReport);
router.get('/employee-master', getEmployeeMasterReport);
router.get('/inventory', getInventoryReport);

export default router;
