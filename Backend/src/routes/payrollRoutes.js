import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getPayrollRecords,
  saveSalaryStructure,
  runPayrollCalculation,
  approvePayroll,
  generateSalarySlips,
  getSalarySlips,
  deleteSalarySlip,
  getRateRevisions,
  saveRateRevision,
  deleteRateRevision,
  getArrears,
  saveArrear,
  deleteArrear,
} from '../controllers/payrollController.js';

const router = express.Router();

router.use(protect);

// Dynamic Payroll Records
router.get('/', getPayrollRecords);
router.post('/structure', authorize('superadmin', 'admin', 'hr', 'manager'), saveSalaryStructure);
router.put('/structure', authorize('superadmin', 'admin', 'hr', 'manager'), saveSalaryStructure);
router.post('/run', authorize('superadmin', 'admin', 'hr', 'manager'), runPayrollCalculation);
router.post('/approve', authorize('superadmin', 'admin', 'hr', 'manager'), approvePayroll);

// Salary Slips
router.post('/generate-slips', authorize('superadmin', 'admin', 'hr', 'manager'), generateSalarySlips);
router.get('/salary-slips', getSalarySlips);
router.delete('/salary-slips/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteSalarySlip);

// Rate Revisions
router.get('/rate-revisions', getRateRevisions);
router.post('/rate-revisions', authorize('superadmin', 'admin', 'hr', 'manager'), saveRateRevision);
router.delete('/rate-revisions/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteRateRevision);

// Arrears
router.get('/arrears', getArrears);
router.post('/arrears', authorize('superadmin', 'admin', 'hr', 'manager'), saveArrear);
router.delete('/arrears/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteArrear);

export default router;
