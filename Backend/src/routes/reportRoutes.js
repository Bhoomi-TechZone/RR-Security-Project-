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
  getFormIVOvertimeReport,
  getEmployeePayslipReport,
  getFormIIDeductionsDamageReport,
  getFormIFinesReport,
  getSalarySheetFormat1Report,
  getSalarySheetFormat2Report,
  getEsiForm7Report,
  getEsiChallanReport,
  getEsiForm1Report,
  getEsiSummaryEmployeeReport,
  getEsiSummaryLocationReport,
  getEsicForm3Report,
  getEsicForm5Report,
  getForm11AccidentBookReport,
  getEpfForm11Report,
  getPfChallanReport,
  getPfForm3AReport,
  getPfForm5Report,
  getPfForm6AReport,
  getPfForm10Report,
  getPfForm12AReport,
  getPfEcrReport,
  getPfReportEmployeeWise,
  getPfReportLocationWise,
  getPfForm2Report,
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
router.get('/overtime-register-form-iv', getFormIVOvertimeReport);
router.get('/overtime-register-salary', getFormIVOvertimeReport);
router.get('/overtime-register', getFormIVOvertimeReport);
router.get('/form-iv-overtime', getFormIVOvertimeReport);
router.get('/form-iv', getFormIVOvertimeReport);
router.get('/employee-payslip', getEmployeePayslipReport);
router.get('/payslip', getEmployeePayslipReport);
router.get('/register-deductions-damage-salary', getFormIIDeductionsDamageReport);
router.get('/form-ii-damage-loss', getFormIIDeductionsDamageReport);
router.get('/form-ii', getFormIIDeductionsDamageReport);
router.get('/register-fines-employer-salary', getFormIFinesReport);
router.get('/form-i-fines', getFormIFinesReport);
router.get('/salary-sheet-format-1', getSalarySheetFormat1Report);
router.get('/salary-sheet-1', getSalarySheetFormat1Report);
router.get('/wage-salary-register', getSalarySheetFormat1Report);
router.get('/salary-sheet-format-2', getSalarySheetFormat2Report);
router.get('/salary-sheet-2', getSalarySheetFormat2Report);
router.get('/register-payment-wages', getSalarySheetFormat2Report);
router.get('/esi-form-7-opt1', getEsiForm7Report);
router.get('/esi-form-7-opt2', getEsiForm7Report);
router.get('/esi-form-7', getEsiForm7Report);
router.get('/form-7-esi', getEsiForm7Report);
router.get('/form-7', getEsiForm7Report);
router.get('/esi-challan', getEsiChallanReport);
router.get('/esi-form-1', getEsiForm1Report);
router.get('/esi-summary-employee', getEsiSummaryEmployeeReport);
router.get('/esi-summary-employee-pdf', getEsiSummaryEmployeeReport);
router.get('/esi-summary-employee-xls', getEsiSummaryEmployeeReport);
router.get('/esi-summary-location', getEsiSummaryLocationReport);
router.get('/esi-summary-location-pdf', getEsiSummaryLocationReport);
router.get('/esi-summary-location-xls', getEsiSummaryLocationReport);
router.get('/esic-form-3', getEsicForm3Report);
router.get('/form-3-esic', getEsicForm3Report);
router.get('/esic-returns-form-5', getEsicForm5Report);
router.get('/esic-form-5', getEsicForm5Report);
router.get('/form-5-esic', getEsicForm5Report);
router.get('/form-11-accident-book', getForm11AccidentBookReport);
router.get('/accident-book-form-11', getForm11AccidentBookReport);
router.get('/epf-form-11', getEpfForm11Report);
router.get('/epf-form-11-declaration', getEpfForm11Report);
router.get('/form-11-epf', getEpfForm11Report);
router.get('/pf-challan', getPfChallanReport);
router.get('/epf-challan', getPfChallanReport);
router.get('/pf-form-3a', getPfForm3AReport);
router.get('/form-3a', getPfForm3AReport);
router.get('/epf-form-3a', getPfForm3AReport);
router.get('/pf-form-5', getPfForm5Report);
router.get('/form-5-epf', getPfForm5Report);
router.get('/epf-form-5', getPfForm5Report);
router.get('/pf-form-6a', getPfForm6AReport);
router.get('/form-6a-epf', getPfForm6AReport);
router.get('/epf-form-6a', getPfForm6AReport);
router.get('/pf-form-10', getPfForm10Report);
router.get('/form-10-epf', getPfForm10Report);
router.get('/epf-form-10', getPfForm10Report);
router.get('/pf-form-12a', getPfForm12AReport);
router.get('/form-12a-epf', getPfForm12AReport);
router.get('/epf-form-12a', getPfForm12AReport);
router.get('/pf-ecr', getPfEcrReport);
router.get('/pf-ecr-excel', getPfEcrReport);
router.get('/pf-report-employee-wise', getPfReportEmployeeWise);
router.get('/pf-employee-wise', getPfReportEmployeeWise);
router.get('/pf-report-location-wise', getPfReportLocationWise);
router.get('/pf-location-wise', getPfReportLocationWise);
router.get('/pf-summary-report', getPfReportLocationWise);
router.get('/pf-summary', getPfReportLocationWise);
router.get('/pf-form-2', getPfForm2Report);
router.get('/pf-form-2-revised', getPfForm2Report);
router.get('/form-2-revised', getPfForm2Report);
router.get('/form-2-epf', getPfForm2Report);

export default router;


