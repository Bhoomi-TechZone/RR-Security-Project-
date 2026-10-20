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
  getFnfSettlementReport,
  getForm16Report,
  getFormFGratuityReport,
  getSalaryCertificateReport,
  getEmployeeIdCardReport,
  getBonusRegisterReport,
  getEmploymentCardReport,
  getMusterRollReport,
  getRegisterOfAdvancesReport,
  getRegisterOfDeductionsDamageReport,
  getRegisterOfFinesReport,
  getRegisterOfOvertimeReport,
  getWagesRegisterReport,
  getRegisterOfWorkmenReport,
  getBankTransferLetterReport,
  getBankTransferReport,
  getRegisterOfLeaveReport,
  getFormILeaveReport,
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
router.get('/fnf-settlement', getFnfSettlementReport);
router.get('/form-16', getForm16Report);
router.get('/form-f-gratuity', getFormFGratuityReport);
router.get('/salary-certificate', getSalaryCertificateReport);
router.get('/employee-id-card', getEmployeeIdCardReport);
router.get('/bonus-register', getBonusRegisterReport);
router.get('/form-c-bonus', getBonusRegisterReport);
router.get('/form-c-bonus-paid', getBonusRegisterReport);
router.get('/employment-card', getEmploymentCardReport);
router.get('/form-xiv', getEmploymentCardReport);
router.get('/muster-roll', getMusterRollReport);
router.get('/form-xvi', getMusterRollReport);
router.get('/register-advances', getRegisterOfAdvancesReport);
router.get('/form-xxii', getRegisterOfAdvancesReport);
router.get('/register-deductions-damage', getRegisterOfDeductionsDamageReport);
router.get('/form-xx', getRegisterOfDeductionsDamageReport);
router.get('/register-fines', getRegisterOfFinesReport);
router.get('/form-xxi', getRegisterOfFinesReport);
router.get('/register-overtime', getRegisterOfOvertimeReport);
router.get('/form-xxiii', getRegisterOfOvertimeReport);
router.get('/wages-register', getWagesRegisterReport);
router.get('/form-xvii', getWagesRegisterReport);
router.get('/workman-register', getRegisterOfWorkmenReport);
router.get('/form-xiii', getRegisterOfWorkmenReport);
router.get('/bank-transfer-letter', getBankTransferLetterReport);
router.get('/bank-transfer-report', getBankTransferReport);
router.get('/register-of-leave', getRegisterOfLeaveReport);
router.get('/form-xxv-leave', getRegisterOfLeaveReport);
router.get('/form-i-leave', getFormILeaveReport);
router.get('/register-of-leave-form-i', getFormILeaveReport);
router.get('/register-of-leave-se-delhi', getFormILeaveReport);

export default router;

