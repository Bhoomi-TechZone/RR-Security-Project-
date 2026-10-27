import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Database,
  Download,
  FileBarChart,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { reportService } from '../../services/reportService';
import { masterService } from '../../services/masterService';
import { generateReportPdf } from '../../utils/pdfExportUtil';
import { generateReportExcel } from '../../utils/excelExportUtil';
import { downloadElementAsPdf } from '../../utils/domPdfExportUtil';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import { downloadFnfSettlementPdf } from '../../utils/fnfSettlementExport';
import { downloadForm16Pdf } from '../../utils/form16Export';
import { downloadFormFPdf } from '../../utils/formFExport';
import { downloadSalaryCertificatePdf } from '../../utils/salaryCertificateExport';
import { downloadEmployeeIdCardPdf } from '../../utils/idCardExport';
import {
  downloadBonusRegisterExcel,
  downloadBonusRegisterPdf,
} from '../../utils/bonusRegisterExport';
import {
  downloadEmploymentCardPdf,
  downloadEmploymentCardExcel,
} from '../../utils/employmentCardExport';
import {
  downloadMusterRollExcel,
  downloadMusterRollPdf,
} from '../../utils/musterRollExport';
import {
  downloadAdvancesRegisterExcel,
  downloadAdvancesRegisterPdf,
} from '../../utils/advancesRegisterExport';
import {
  downloadDeductionsDamageExcel,
  downloadDeductionsDamagePdf,
} from '../../utils/deductionsDamageExport';
import {
  downloadFinesRegisterExcel,
  downloadFinesRegisterPdf,
} from '../../utils/finesRegisterExport';
import {
  downloadOvertimeRegisterExcel,
  downloadOvertimeRegisterPdf,
} from '../../utils/overtimeRegisterExport';
import {
  downloadWagesRegisterExcel,
  downloadWagesRegisterPdf,
} from '../../utils/wagesRegisterExport';
import {
  downloadWorkmanRegisterExcel,
  downloadWorkmanRegisterPdf,
} from '../../utils/workmanRegisterExport';
import {
  downloadBankTransferLetterPdf,
  downloadBankTransferLetterExcel,
  downloadBankTransferLetterWord,
} from '../../utils/bankTransferLetterExport';
import {
  downloadBankTransferReportExcel,
  downloadBankTransferReportCsv,
  downloadBankTransferReportPdf,
} from '../../utils/bankTransferReportExport';
import {
  downloadLeaveRegisterExcel,
  downloadLeaveRegisterCsv,
  downloadLeaveRegisterPdf,
} from '../../utils/leaveRegisterExport';
import {
  downloadFormILeaveExcel,
  downloadFormILeaveCsv,
  downloadFormILeavePdf,
} from '../../utils/formILeaveExport';
import EmployeeProfileReportView from '../../components/reports/EmployeeProfileReportView';
import FnfSettlementReportView from '../../components/reports/FnfSettlementReportView';
import Form16ReportView from '../../components/reports/Form16ReportView';
import FormFReportView from '../../components/reports/FormFReportView';
import SalaryCertificateReportView from '../../components/reports/SalaryCertificateReportView';
import EmployeeIdCardReportView from '../../components/reports/EmployeeIdCardReportView';
import BonusRegisterFormCView from '../../components/reports/BonusRegisterFormCView';
import EmploymentCardFormXIVReportView from '../../components/reports/EmploymentCardFormXIVReportView';
import MusterRollFormXVIReportView from '../../components/reports/MusterRollFormXVIReportView';
import AdvancesRegisterFormXXIIReportView from '../../components/reports/AdvancesRegisterFormXXIIReportView';
import DeductionsDamageFormXXReportView from '../../components/reports/DeductionsDamageFormXXReportView';
import FinesRegisterFormXXIReportView from '../../components/reports/FinesRegisterFormXXIReportView';
import OvertimeRegisterFormXXIIIReportView from '../../components/reports/OvertimeRegisterFormXXIIIReportView';
import WagesRegisterFormXVIILReportView from '../../components/reports/WagesRegisterFormXVIILReportView';
import WorkmanRegisterFormXIIIReportView from '../../components/reports/WorkmanRegisterFormXIIIReportView';
import BankTransferLetterReportView from '../../components/reports/BankTransferLetterReportView';
import BankTransferReportView from '../../components/reports/BankTransferReportView';
import LeaveRegisterReportView from '../../components/reports/LeaveRegisterReportView';
import FormILeaveReportView from '../../components/reports/FormILeaveReportView';
import OvertimeRegisterFormIVReportView from '../../components/reports/OvertimeRegisterFormIVReportView';
import EmployeePayslipReportView from '../../components/reports/EmployeePayslipReportView';
import {
  downloadFormIVOvertimeExcel,
  downloadFormIVOvertimeCsv,
  downloadFormIVOvertimePdf,
} from '../../utils/formIVOvertimeExport';
import { downloadEmployeePayslipPdf } from '../../utils/employeePayslipExport';
import DeductionsDamageFormIIReportView from '../../components/reports/DeductionsDamageFormIIReportView';
import {
  downloadFormIIDeductionsDamageExcel,
  downloadFormIIDeductionsDamageCsv,
  downloadFormIIDeductionsDamagePdf,
} from '../../utils/deductionsDamageFormIIExport';
import FinesFormIReportView from '../../components/reports/FinesFormIReportView';
import {
  downloadFormIFinesExcel,
  downloadFormIFinesCsv,
  downloadFormIFinesPdf,
} from '../../utils/finesFormIExport';
import SalarySheetFormat1View from '../../components/reports/SalarySheetFormat1View';
import {
  downloadSalarySheetFormat1Excel,
  downloadSalarySheetFormat1Csv,
  downloadSalarySheetFormat1Pdf,
} from '../../utils/salarySheetFormat1Export';
import SalarySheetFormat2View from '../../components/reports/SalarySheetFormat2View';
import {
  downloadSalarySheetFormat2Excel,
  downloadSalarySheetFormat2Csv,
  downloadSalarySheetFormat2Pdf,
} from '../../utils/salarySheetFormat2Export';
import EsiForm7ReportView from '../../components/reports/EsiForm7ReportView';
import {
  downloadEsiForm7Excel,
  downloadEsiForm7Csv,
  downloadEsiForm7Pdf,
} from '../../utils/esiForm7Export';
import EsiForm7Option2ReportView from '../../components/reports/EsiForm7Option2ReportView';
import {
  downloadEsiForm7Option2Excel,
  downloadEsiForm7Option2Csv,
  downloadEsiForm7Option2Pdf,
} from '../../utils/esiForm7Option2Export';
import EsiChallanReportView from '../../components/reports/EsiChallanReportView';
import {
  downloadEsiChallanExcel,
  downloadEsiChallanCsv,
  downloadEsiChallanPdf,
} from '../../utils/esiChallanExport';
import EsiForm1ReportView from '../../components/reports/EsiForm1ReportView';
import {
  downloadEsiForm1Excel,
  downloadEsiForm1Csv,
  downloadEsiForm1Pdf,
} from '../../utils/esiForm1Export';
import EsiSummaryEmployeeReportView from '../../components/reports/EsiSummaryEmployeeReportView';
import {
  downloadEsiSummaryEmployeeExcel,
  downloadEsiSummaryEmployeeCsv,
  downloadEsiSummaryEmployeePdf,
} from '../../utils/esiSummaryEmployeeExport';
import EsiSummaryLocationReportView from '../../components/reports/EsiSummaryLocationReportView';
import {
  downloadEsiSummaryLocationExcel,
  downloadEsiSummaryLocationCsv,
  downloadEsiSummaryLocationPdf,
} from '../../utils/esiSummaryLocationExport';
import EsicForm3ReportView from '../../components/reports/EsicForm3ReportView';
import {
  downloadEsicForm3Excel,
  downloadEsicForm3Csv,
  downloadEsicForm3Pdf,
} from '../../utils/esicForm3Export';
import EsicForm5ReportView from '../../components/reports/EsicForm5ReportView';
import {
  downloadEsicForm5Excel,
  downloadEsicForm5Csv,
  downloadEsicForm5Pdf,
} from '../../utils/esicForm5Export';
import Form11AccidentBookReportView from '../../components/reports/Form11AccidentBookReportView';
import {
  downloadForm11AccidentBookExcel,
  downloadForm11AccidentBookCsv,
  downloadForm11AccidentBookPdf,
} from '../../utils/form11AccidentBookExport';
import EpfForm11ReportView from '../../components/reports/EpfForm11ReportView';
import { downloadEpfForm11Pdf } from '../../utils/epfForm11Export';
import PfChallanReportView from '../../components/reports/PfChallanReportView';
import { downloadPfChallanPdf, downloadPfChallanExcel } from '../../utils/pfChallanExport';
import PfForm3AReportView from '../../components/reports/PfForm3AReportView';
import { downloadPfForm3APdf, downloadPfForm3AExcel } from '../../utils/pfForm3AExport';
import PfForm5ReportView from '../../components/reports/PfForm5ReportView';
import {
  downloadPfForm5Pdf,
  downloadPfForm5Excel,
  downloadPfForm5Csv,
} from '../../utils/pfForm5Export';
import PfForm6AReportView from '../../components/reports/PfForm6AReportView';
import {
  downloadPfForm6APdf,
  downloadPfForm6AExcel,
  downloadPfForm6ACsv,
} from '../../utils/pfForm6AExport';
import PfForm10ReportView from '../../components/reports/PfForm10ReportView';
import { downloadPfForm10Pdf } from '../../utils/pfForm10Export';
import PfForm12AReportView from '../../components/reports/PfForm12AReportView';
import { downloadPfForm12APdf } from '../../utils/pfForm12AExport';
import PfEcrReportView from '../../components/reports/PfEcrReportView';
import { downloadPfEcrExcel } from '../../utils/pfEcrExport';
import PfEmployeeWiseReportView from '../../components/reports/PfEmployeeWiseReportView';
import { downloadPfEmployeeWiseExcel } from '../../utils/pfEmployeeWiseExport';
import PfLocationWiseReportView from '../../components/reports/PfLocationWiseReportView';
import { downloadPfLocationWiseExcel } from '../../utils/pfLocationWiseExport';
import PfSummaryReportView from '../../components/reports/PfSummaryReportView';
import { downloadPfSummaryReportPdf } from '../../utils/pfSummaryReportExport';
import PfForm2ReportView from '../../components/reports/PfForm2ReportView';
import { downloadPfForm2Pdf } from '../../utils/pfForm2Export';
import styles from './Reports.module.css';

const PAGE_SIZE = 10;

const getCurrentMonthStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatCurrency = (value) => {
  if (typeof value === 'object' && value !== null) {
    value = value.amount ?? value.value ?? value.total ?? 0;
  }
  const num = Number(value);
  if (!isNaN(num) && typeof value !== 'boolean' && value !== '' && value !== null) {
    return currencyFormatter.format(num);
  }
  if (!value) return '₹0';
  return String(value);
};

const formatDate = (value) => {
  if (typeof value === 'object' && value !== null) {
    value = value.date || value.value || '';
  }
  if (!value) return '—';
  const str = String(value);
  const date = new Date(str.includes('T') ? str : `${str}T00:00:00`);
  if (Number.isNaN(date.getTime())) return str;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const statusClassName = (status) => {
  const normalized = String(typeof status === 'object' ? (status?.name || status?.label || '') : (status || '')).toLowerCase();
  if (['approved', 'processed', 'completed', 'good', 'active'].includes(normalized)) return styles.statusApproved;
  if (['pending', 'average', 'low stock'].includes(normalized)) return styles.statusPending;
  if (['rejected', 'low', 'inactive', 'out of stock'].includes(normalized)) return styles.statusRejected;
  return styles.statusNeutral;
};

const reportCategoryConfigs = [
  {
    id: 'payroll',
    name: 'Payroll & Wage Register',
    description: 'Statutory Wage & Salary Register with attendance breakdown, wage rates, earnings & deductions.',
    accent: 'green',
    icon: BarChart3
  },
  {
    id: 'attendance',
    name: 'Attendance Muster Roll',
    description: 'View employee attendance records, duty hours, leaves, and attendance percentage summary.',
    accent: 'blue',
    icon: FileBarChart
  },
  {
    id: 'billing',
    name: 'Company Billing Statement',
    description: 'View billing information grouped by client/company with deployed workforce and overtime.',
    accent: 'purple',
    icon: Building2
  },
  {
    id: 'employee',
    name: 'Employee Master Register',
    description: 'View complete employee master profiles, statutory numbers (PF/ESI/UAN) and bank details.',
    accent: 'indigo',
    icon: FileCheck
  },
  {
    id: 'inventory',
    name: 'Inventory & Asset Register',
    description: 'View inventory stock, issued uniforms, assets, damaged/lost items and total valuations.',
    accent: 'amber',
    icon: Database
  }
];

const reportMeta = {
  payroll: {
    title: 'Wage & Salary Register',
    description: 'Statutory employee wage, attendance, earnings, deductions and net payable register.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  attendance: {
    title: 'Attendance Report',
    description: 'Employee attendance muster roll for the selected period.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee name or ID...'
  },
  billing: {
    title: 'Company-wise Billing Report',
    description: 'View monthly billing statements and contract hours grouped by client company.',
    filters: ['month', 'company'],
    placeholder: 'Search client or company...'
  },
  employee: {
    title: 'Employee Master Report',
    description: 'Complete employee master register, statutory numbers and bank details.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee, designation, department...'
  },
  'employee-profile': {
    title: 'Employee Profile',
    description: 'Complete individual employee profile and personal details.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'fnf-settlement': {
    title: 'F&F Settlement Payslip',
    description: 'Full and final salary settlement statement on exit, pay summary, earnings, deductions and clearance acknowledgment.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'fnf-settlement-payslip': {
    title: 'F&F Settlement Payslip',
    description: 'Full and final salary settlement statement on exit, pay summary, earnings, deductions and clearance acknowledgment.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'form-16': {
    title: 'Form 16 (Part B)',
    description: 'Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source from income chargeable under the head "Salaries".',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, PAN...'
  },
  'form-16-part-b': {
    title: 'Form 16 (Part B)',
    description: 'Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source from income chargeable under the head "Salaries".',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, PAN...'
  },
  'form-f-gratuity-nomination': {
    title: "Form 'F' - Gratuity Nomination Form",
    description: '[See sub-rule (1) of Rule 6] - Statutory nomination form under Payment of Gratuity Act, 1972.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'form-f': {
    title: "Form 'F' - Gratuity Nomination Form",
    description: '[See sub-rule (1) of Rule 6] - Statutory nomination form under Payment of Gratuity Act, 1972.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'salary-certificate': {
    title: 'Salary Certificate',
    description: 'Official employee salary certificate for banks, loans, visa and employment verification.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'salary-certificate-report': {
    title: 'Salary Certificate',
    description: 'Official employee salary certificate for banks, loans, visa and employment verification.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'employee-id-card': {
    title: 'Employee ID Card',
    description: 'Printable employee identity card with photo, guard badge, emergency contacts and verification QR code.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation, phone...'
  },
  'employee-id-card-report': {
    title: 'Employee ID Card',
    description: 'Printable employee identity card with photo, guard badge, emergency contacts and verification QR code.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation, phone...'
  },
  'bonus-register-form-c': {
    title: 'Form C - Bonus Paid to Employees',
    description: '[See Rule 4(C)] - Statutory Bonus paid to employees for the accounting year under Payment of Bonus Act, 1965.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'form-c-bonus-paid': {
    title: 'Form C - Bonus Paid to Employees',
    description: '[See Rule 4(C)] - Statutory Bonus paid to employees for the accounting year under Payment of Bonus Act, 1965.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'employment-card-form-xiv': {
    title: 'Employment Card (Form XIV)',
    description: '[See Rule 76] Statutory Employment Card issued to contract workmen under Contract Labour (Regulation & Abolition) Act.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'employment-card': {
    title: 'Employment Card (Form XIV)',
    description: '[See Rule 76] Statutory Employment Card issued to contract workmen under Contract Labour (Regulation & Abolition) Act.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'muster-roll-form-xvi': {
    title: 'Muster Roll (Form XVI)',
    description: '[See Rule 78(1)(a)(i)] Statutory Muster Roll and workman attendance register under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, father name...'
  },
  'form-xvi': {
    title: 'Muster Roll (Form XVI)',
    description: '[See Rule 78(1)(a)(i)] Statutory Muster Roll and workman attendance register under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, father name...'
  },
  'muster-roll': {
    title: 'Muster Roll (Form XVI)',
    description: '[See Rule 78(1)(a)(i)] Statutory Muster Roll and workman attendance register under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, father name...'
  },
  'register-advances-form-xxii': {
    title: 'Register of Advances (Form XXII)',
    description: '[See Rule 78(1)(a)(ii)] Statutory Register of Advances given to contract workmen and details of recovery/instalments under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, purpose...'
  },
  'form-xxii': {
    title: 'Register of Advances (Form XXII)',
    description: '[See Rule 78(1)(a)(ii)] Statutory Register of Advances given to contract workmen and details of recovery/instalments under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, purpose...'
  },
  'register-advances': {
    title: 'Register of Advances (Form XXII)',
    description: '[See Rule 78(1)(a)(ii)] Statutory Register of Advances given to contract workmen and details of recovery/instalments under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, purpose...'
  },
  'register-deduction-damage-form-xx': {
    title: 'Register of Deductions for Damage or Loss (Form XX)',
    description: '[FORM XX ,See Rule- 78 (1) (a) (ii)] Statutory Register of Deductions for Damage or Loss caused to employer under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, damage particulars...'
  },
  'form-xx': {
    title: 'Register of Deductions for Damage or Loss (Form XX)',
    description: '[FORM XX ,See Rule- 78 (1) (a) (ii)] Statutory Register of Deductions for Damage or Loss caused to employer under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, damage particulars...'
  },
  'register-deductions-damage': {
    title: 'Register of Deductions for Damage or Loss (Form XX)',
    description: '[FORM XX ,See Rule- 78 (1) (a) (ii)] Statutory Register of Deductions for Damage or Loss caused to employer under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, damage particulars...'
  },
  'register-fines-form-xxi': {
    title: 'Register of Fines (Form XXI)',
    description: '[FORM XXI,See Rule-78 (1) (a) (ii)] Statutory Register of Fines imposed on contract workmen under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, offence particulars...'
  },
  'form-xxi': {
    title: 'Register of Fines (Form XXI)',
    description: '[FORM XXI,See Rule-78 (1) (a) (ii)] Statutory Register of Fines imposed on contract workmen under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, offence particulars...'
  },
  'register-fines': {
    title: 'Register of Fines (Form XXI)',
    description: '[FORM XXI,See Rule-78 (1) (a) (ii)] Statutory Register of Fines imposed on contract workmen under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, offence particulars...'
  },
  'register-overtime-form-xxiii': {
    title: 'Register of Overtime (Form XXIII)',
    description: '[FORM XXIII, See Rule 78 (1) (a) (iii)] Statutory Register of Overtime duty hours and overtime wage calculations under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'form-xxiii': {
    title: 'Register of Overtime (Form XXIII)',
    description: '[FORM XXIII, See Rule 78 (1) (a) (iii)] Statutory Register of Overtime duty hours and overtime wage calculations under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'register-overtime': {
    title: 'Register of Overtime (Form XXIII)',
    description: '[FORM XXIII, See Rule 78 (1) (a) (iii)] Statutory Register of Overtime duty hours and overtime wage calculations under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'overtime-register-salary': {
    title: 'Overtime Register (Form IV)',
    description: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports module).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'overtime-register': {
    title: 'Overtime Register (Form IV)',
    description: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports module).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'overtime-register-form-iv': {
    title: 'Overtime Register (Form IV)',
    description: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports module).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'form-iv': {
    title: 'Overtime Register (Form IV)',
    description: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports module).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'form-iv-overtime': {
    title: 'Overtime Register (Form IV)',
    description: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports module).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'salary-overtime': {
    title: 'Overtime Register (Form IV)',
    description: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports module).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation...'
  },
  'employee-payslip': {
    title: 'Employee Payslip',
    description: 'Monthly employee salary payslip with earnings breakdown, deductions, and net payable summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'payslip': {
    title: 'Employee Payslip',
    description: 'Monthly employee salary payslip with earnings breakdown, deductions, and net payable summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'register-deductions-damage-salary': {
    title: 'Register of Deductions for Damage or Loss (Form II)',
    description: '[FORM II, Rules 21 (4)] Register of deductions for damage or loss caused to the employer by the neglect or default of the employed persons.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, damage particulars...'
  },
  'form-ii-damage-loss': {
    title: 'Register of Deductions for Damage or Loss (Form II)',
    description: '[FORM II, Rules 21 (4)] Register of deductions for damage or loss caused to the employer by the neglect or default of the employed persons.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, damage particulars...'
  },
  'form-ii': {
    title: 'Register of Deductions for Damage or Loss (Form II)',
    description: '[FORM II, Rules 21 (4)] Register of deductions for damage or loss caused to the employer by the neglect or default of the employed persons.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, damage particulars...'
  },
  'register-fines-employer-salary': {
    title: 'Register of Fines (Employer)',
    description: '[FORM I, Rule 21(4)] Register of fines imposed and recovered by employer (Minimum Wages Rules).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, offence particulars...'
  },
  'form-i-fines': {
    title: 'Register of Fines (Employer)',
    description: '[FORM I, Rule 21(4)] Register of fines imposed and recovered by employer (Minimum Wages Rules).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, offence particulars...'
  },
  'salary-sheet-format-1': {
    title: 'Wage/Salary Register (Salary Sheet Format 1)',
    description: 'Statutory Wage/Salary Register with attendance metrics, base wage rates, PF/ESI wages, and PF/ESI/PT summaries.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'salary-sheet-1': {
    title: 'Wage/Salary Register (Salary Sheet Format 1)',
    description: 'Statutory Wage/Salary Register with attendance metrics, base wage rates, PF/ESI wages, and PF/ESI/PT summaries.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'salary-sheet-format-2': {
    title: 'Register of Payment of Wages (Salary Sheet Format 2)',
    description: 'FORM - IV [Payment of Wages Rules, 1971] Statutory Register of Payment of Wages with full employee profile, attendance, wage rates, and PF/ESI/LWF summaries.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'salary-sheet-2': {
    title: 'Register of Payment of Wages (Salary Sheet Format 2)',
    description: 'FORM - IV [Payment of Wages Rules, 1971] Statutory Register of Payment of Wages with full employee profile, attendance, wage rates, and PF/ESI/LWF summaries.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  'esi-form-7-opt1': {
    title: 'ESI - Form 7 - Half Yearly Report (Option 1)',
    description: 'FORM 7 [REGULATION - 32, APPENDIX - F] Statutory Register of Employees & Half-Yearly Return of ESI Contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, insurance number, department, designation...'
  },
  'esi-form-7-opt2': {
    title: 'ESI - Form 7 - Half Yearly Report (Option-2)',
    description: 'FORM 7 [REGULATION 32] Branch-wise Statutory Register of Employees & Half-Yearly Return of ESI Contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, insurance number, department, designation...'
  },
  'esi-challan': {
    title: 'ESI Challan',
    description: "Monthly ESIC Pay-in-Slip & Bank Payment Challan for Employee's State Insurance Fund Account No. 1.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, insurance number...'
  },
  'esi-form-1': {
    title: 'ESI Form 1 Declaration Form',
    description: 'FORM - 1 [REGULATION 11 & 12, ESI REGULATIONS, 1950] Statutory Employee Declaration Form & Temporary Identity Card (TIC).',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, insurance number...'
  },
  'esi-summary-employee-pdf': {
    title: 'ESI Summry Employee Wise',
    description: 'Statutory Employee Wise Monthly ESI Report with working days, ESI wages, 0.75% deductions, exempted wages and contribution summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, code, ESI code...'
  },
  'esi-summary-employee-xls': {
    title: 'ESI Summry Employee Wise (Excel)',
    description: 'Statutory Employee Wise Monthly ESI calculation spreadsheet with wage breakdown and 4% contribution summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, code, ESI code...'
  },
  'esi-summary-employee': {
    title: 'ESI Summry Employee Wise',
    description: 'Statutory Employee Wise Monthly ESI Report with working days, ESI wages, 0.75% deductions, exempted wages and contribution summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, code, ESI code...'
  },
  'esi-summary-location': {
    title: 'ESI Summry Location Wise',
    description: 'Location-wise statutory ESI summary report with employee counts, working days, ESI wages and contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location / client / site name...'
  },
  'esi-summary-location-pdf': {
    title: 'ESI Summry Location Wise',
    description: 'Location-wise statutory ESI summary report with employee counts, working days, ESI wages and contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location / client / site name...'
  },
  'esi-summary-location-xls': {
    title: 'ESI Summry Location Wise',
    description: 'Location-wise statutory ESI summary report with employee counts, working days, ESI wages and contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location / client / site name...'
  },
  'esic-form-3': {
    title: 'ESIC Form3 Return Declaration',
    description: 'FORM 3 [REGULATION 14, ESI REGULATIONS, 1950] Return of Declaration Form for registering insured persons with ESIC in duplicate.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, insurance number...'
  },
  'form-3-esic': {
    title: 'ESIC Form3 Return Declaration',
    description: 'FORM 3 [REGULATION 14, ESI REGULATIONS, 1950] Return of Declaration Form for registering insured persons with ESIC in duplicate.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, insurance number...'
  },
  'esic-returns-form-5': {
    title: 'ESIC-Returns-Form-5',
    description: 'FORM 5 [REGULATION 26, ESI REGULATIONS, 1950] Statutory Return of Contributions for contribution period with Principal Employer particulars, 6-Month Challans and 10-column insured persons table.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, ID, insurance number, dispensary...'
  },
  'esic-form-5': {
    title: 'ESIC-Returns-Form-5',
    description: 'FORM 5 [REGULATION 26, ESI REGULATIONS, 1950] Statutory Return of Contributions for contribution period with Principal Employer particulars, 6-Month Challans and 10-column insured persons table.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, ID, insurance number, dispensary...'
  },
  'form-5-esic': {
    title: 'ESIC-Returns-Form-5',
    description: 'FORM 5 [REGULATION 26, ESI REGULATIONS, 1950] Statutory Return of Contributions for contribution period with Principal Employer particulars, 6-Month Challans and 10-column insured persons table.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, ID, insurance number, dispensary...'
  },
  'form-11-accident-book': {
    title: 'Form 11 Accident Book',
    description: 'FORM 11 ACCIDENT BOOK [REGULATION 66, EMPLOYEES\' STATE INSURANCE CORPORATION] Statutory Register of notices of accidents and workplace injury.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search by injured person name, insurance number, injury details...'
  },
  'accident-book-form-11': {
    title: 'Form 11 Accident Book',
    description: 'FORM 11 ACCIDENT BOOK [REGULATION 66, EMPLOYEES\' STATE INSURANCE CORPORATION] Statutory Register of notices of accidents and workplace injury.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search by injured person name, insurance number, injury details...'
  },
  'epf-form-11': {
    title: 'EPF Form 11 - Declaration Form',
    description: 'New Form : 11 - Declaration Form [Paragraphs 34 & 57 of EPF Scheme, 1952 and Paragraph 24 of EPS, 1995]. Statutory declaration by a person taking up employment in establishment.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN, PF number, designation...'
  },
  'epf-form-11-declaration': {
    title: 'EPF Form 11 - Declaration Form',
    description: 'New Form : 11 - Declaration Form [Paragraphs 34 & 57 of EPF Scheme, 1952 and Paragraph 24 of EPS, 1995]. Statutory declaration by a person taking up employment in establishment.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN, PF number, designation...'
  },
  'pf-challan': {
    title: 'PF Challan',
    description: 'PROVISIONAL CHALLAN FOR WAGE MONTH [EMPLOYEES\' PROVIDENT FUND ORGANISATION] Monthly statutory PF contribution, EPS, EDLI and admin charges challan.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search subscriber by name, employee ID, UAN, PF number...',
  },
  'epf-challan': {
    title: 'PF Challan',
    description: 'PROVISIONAL CHALLAN FOR WAGE MONTH [EMPLOYEES\' PROVIDENT FUND ORGANISATION] Monthly statutory PF contribution, EPS, EDLI and admin charges challan.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search subscriber by name, employee ID, UAN, PF number...',
  },
  'pf-form-3a': {
    title: 'PF - Form 3A',
    description: 'FORM - 3A (REVISED) [EMPLOYEES\' PROVIDENT FUND ORGANISATION, PARAS 35 & 42 OF EPF SCHEME, 1952 AND PARA 19 OF EPS, 1995] Annual Member Contribution Card with EPF & EPS monthly deductions breakdown.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search member by name, employee ID, account number, father name...'
  },
  'form-3a': {
    title: 'PF - Form 3A',
    description: 'FORM - 3A (REVISED) [EMPLOYEES\' PROVIDENT FUND ORGANISATION, PARAS 35 & 42 OF EPF SCHEME, 1952 AND PARA 19 OF EPS, 1995] Annual Member Contribution Card with EPF & EPS monthly deductions breakdown.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search member by name, employee ID, account number, father name...'
  },
  'pf-form-5': {
    title: 'PF - Form 5',
    description: "FORM 5 [Paragraph 36(2)(a) of EPF Scheme, 1952 & Paragraph 20(4) of EPS, 1995] Return of Employees qualifying for membership of the Employees' Provident Fund, Pension Fund & EDLI for the first time during the month.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, Account No, UAN...'
  },
  'form-5-epf': {
    title: 'PF - Form 5',
    description: "FORM 5 [Paragraph 36(2)(a) of EPF Scheme, 1952 & Paragraph 20(4) of EPS, 1995] Return of Employees qualifying for membership of the Employees' Provident Fund, Pension Fund & EDLI for the first time during the month.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, Account No, UAN...'
  },
  'pf-form-6a': {
    title: 'PF - Form 6A (Revised)',
    description: "FORM 6A (REVISED) [Paragraph 43 of EPF Scheme, 1952 & Paragraph 20(4) of EPS, 1995] Consolidated Annual Statement of Contribution and Reconciliation of Remittances.",
    filters: ['financialYear', 'month', 'company', 'department', 'employee'],
    placeholder: 'Search member by name, ID, Account No, UAN...'
  },
  'form-6a-epf': {
    title: 'PF - Form 6A (Revised)',
    description: "FORM 6A (REVISED) [Paragraph 43 of EPF Scheme, 1952 & Paragraph 20(4) of EPS, 1995] Consolidated Annual Statement of Contribution and Reconciliation of Remittances.",
    filters: ['financialYear', 'month', 'company', 'department', 'employee'],
    placeholder: 'Search member by name, ID, Account No, UAN...'
  },
  'pf-form-10': {
    title: 'PF - Form 10',
    description: "FORM 10 [Paragraph 36(2)(a) & (b) of EPF Scheme, 1952 & Paragraph 20(2) of EPS, 1995] Return of the members leaving service during the month.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search leaving member by name, ID, Account No, UAN...'
  },
  'form-10-epf': {
    title: 'PF - Form 10',
    description: "FORM 10 [Paragraph 36(2)(a) & (b) of EPF Scheme, 1952 & Paragraph 20(2) of EPS, 1995] Return of the members leaving service during the month.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search leaving member by name, ID, Account No, UAN...'
  },
  'pf-form-12a': {
    title: 'PF - Form 12A (Revised)',
    description: "FORM 12-A (REVISED) [EMPLOYEES' PROVIDENT FUND AND MISC. PRO. ACT 1952 - EMPLOYEES' PENSION SCHEME 1995, PARA 20(4)] Monthly statement of EPF, EPS, and EDLI payments & subscribers movement.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN, PF number...'
  },
  'form-12a-epf': {
    title: 'PF - Form 12A (Revised)',
    description: "FORM 12-A (REVISED) [EMPLOYEES' PROVIDENT FUND AND MISC. PRO. ACT 1952 - EMPLOYEES' PENSION SCHEME 1995, PARA 20(4)] Monthly statement of EPF, EPS, and EDLI payments & subscribers movement.",
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN, PF number...'
  },
  'pf-ecr': {
    title: 'PF ECR',
    description: 'Statutory 11-column Electronic Challan cum Return (ECR) Excel format with employee UAN and statutory wage breakdown.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, UAN, ID...'
  },
  'pf-ecr-excel': {
    title: 'PF ECR',
    description: 'Statutory 11-column Electronic Challan cum Return (ECR) Excel format with employee UAN and statutory wage breakdown.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, UAN, ID...'
  },
  'pf-report-employee-wise': {
    title: 'PF Peport Employee Wise',
    description: 'Employee-wise monthly statutory PF gross wages, employee 12% deduction, employer EPF 3.67%, EPS 8.33%, EDLI 0.5%, Admin charges 0.5%, and account reconciliation statement.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, code, UAN, ID...'
  },
  'pf-employee-wise': {
    title: 'PF Peport Employee Wise',
    description: 'Employee-wise monthly statutory PF gross wages, employee 12% deduction, employer EPF 3.67%, EPS 8.33%, EDLI 0.5%, Admin charges 0.5%, and account reconciliation statement.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, code, UAN, ID...'
  },
  'pf-report-location-wise': {
    title: 'PF Report Loction Wise',
    description: 'Branch and site-wise statutory PF liability summary with employee count, attendance, wages, and contribution breakdown.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location by name...'
  },
  'pf-location-wise': {
    title: 'PF Report Loction Wise',
    description: 'Branch and site-wise statutory PF liability summary with employee count, attendance, wages, and contribution breakdown.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location by name...'
  },
  'pf-summary-report': {
    title: 'PF Summry Report',
    description: 'Consolidated monthly PF statutory liability summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location by name...'
  },
  'pf-summary': {
    title: 'PF Summry Report',
    description: 'Consolidated monthly PF statutory liability summary.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search location by name...'
  },
  'pf-form-2-revised': {
    title: 'PF-Form-2_Revised_',
    description: 'Nomination and declaration form for EPF & EPS schemes under Paragraph 33, 61(1) of EPF Scheme, 1952 & Paragraph 18 of EPS, 1995.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN...'
  },
  'form-2-revised': {
    title: 'PF-Form-2_Revised_',
    description: 'Nomination and declaration form for EPF & EPS schemes under Paragraph 33, 61(1) of EPF Scheme, 1952 & Paragraph 18 of EPS, 1995.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN...'
  },
  'pf-form-2': {
    title: 'PF-Form-2_Revised_',
    description: 'Nomination and declaration form for EPF & EPS schemes under Paragraph 33, 61(1) of EPF Scheme, 1952 & Paragraph 18 of EPS, 1995.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, UAN...'
  },
  'esi-form-7': {
    title: 'ESI - Form 7 - Half Yearly Report (Option 1)',
    description: 'FORM 7 [REGULATION - 32, APPENDIX - F] Statutory Register of Employees & Half-Yearly Return of ESI Contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, insurance number, department, designation...'
  },
  'form-7-esi': {
    title: 'ESI - Form 7 - Half Yearly Report (Option 1)',
    description: 'FORM 7 [REGULATION - 32, APPENDIX - F] Statutory Register of Employees & Half-Yearly Return of ESI Contributions.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search insured person by name, insurance number, department, designation...'
  },
  'wages-register-form-xvii': {
    title: 'Register of Wages (Form XVII)',
    description: '[FORM XVII, See Rule 78 (1) (a) (i)] Statutory Register of Wages under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation, establishment...'
  },
  'form-xvii': {
    title: 'Register of Wages (Form XVII)',
    description: '[FORM XVII, See Rule 78 (1) (a) (i)] Statutory Register of Wages under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation, establishment...'
  },
  'wages-register': {
    title: 'Register of Wages (Form XVII)',
    description: '[FORM XVII, See Rule 78 (1) (a) (i)] Statutory Register of Wages under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search workman by name, ID, designation, establishment...'
  },
  'workman-register-form-xiii': {
    title: 'Register of Workmen Employed by Contractor (Form XIII)',
    description: '[FORM XIII, See Rule 75] Statutory Register of Workmen Employed by Contractor under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['company', 'department', 'employee', 'status'],
    placeholder: 'Search workman by name, ID, designation, address...'
  },
  'form-xiii': {
    title: 'Register of Workmen Employed by Contractor (Form XIII)',
    description: '[FORM XIII, See Rule 75] Statutory Register of Workmen Employed by Contractor under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['company', 'department', 'employee', 'status'],
    placeholder: 'Search workman by name, ID, designation, address...'
  },
  'workman-register': {
    title: 'Register of Workmen Employed by Contractor (Form XIII)',
    description: '[FORM XIII, See Rule 75] Statutory Register of Workmen Employed by Contractor under Contract Labour (Regulation & Abolition) Central Rules, 1971.',
    filters: ['company', 'department', 'employee', 'status'],
    placeholder: 'Search workman by name, ID, designation, address...'
  },
  'bank-transfer-letter': {
    title: 'Bank Transfer Letter',
    description: 'Official bank advice letter for employee salary disbursement with attached beneficiary account list.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, bank account...'
  },
  'bank-transfer-report': {
    title: 'Bank Transfer Report',
    description: 'Corporate salary disbursement sheet matching CMS/NEFT bank upload format (Remitter A/c, IFSC, Amount, Beneficiary A/c & Name).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search beneficiary name, account number, IFSC...'
  },
  leave: {
    title: 'Register of Leave',
    description: 'Statutory Register of Leave under Delhi Shops & Establishments Act (Form I) / Factories Rules (Form XXV).',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, leave type...'
  },
  'form-xxv-register-of-leave': {
    title: 'Register of Leave (Form XXV)',
    description: 'Statutory register of annual leave with wages.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, leave type...'
  },
  'register-of-leave-se-delhi': {
    title: 'Register of Leave - Form I (Delhi S&E Act)',
    description: '[FORM I, See Rule 14] Statutory Register of Leave (Casual or Sickness Leave & Privilege Leave) maintained under Delhi Shops and Establishments Act, 1954.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, leave type...'
  },
  inventory: {
    title: 'Inventory & Asset Report',
    description: 'View inventory stock, issued uniforms, assets, returns and valuations.',
    filters: ['category', 'itemType', 'status'],
    placeholder: 'Search item name, code, brand, category or location...'
  }
};

const REPORT_CATEGORIES = [
  { id: 'all', label: 'All Reports' },
  { id: 'attendance', label: 'Attendance Report' },
  { id: 'payroll', label: 'Payroll Report' },
  { id: 'salary', label: 'Salary Reports' },
  { id: 'billing', label: 'Billing Report' },
  { id: 'employee', label: 'Employee Reports' },
  { id: 'inventory', label: 'Inventory Report' },
  { id: 'pf', label: 'PF Reports' },
  { id: 'esi', label: 'ESI Reports' },
  { id: 'labour-laws', label: 'Labour Laws Reports' }
];

const ALL_REPORTS_CATALOG = [
  // --- Core HRMS Reports ---
  {
    id: 'attendance',
    title: 'Attendance Report',
    desc: 'Daily muster roll, work hours, and leave summary.',
    category: 'attendance',
    targetTab: 'attendance',
    formats: ['excel', 'pdf']
  },
  {
    id: 'payroll',
    title: 'Payroll Report',
    desc: 'Wage register with earnings and deductions breakdown.',
    category: 'payroll',
    targetTab: 'payroll',
    formats: ['excel', 'pdf']
  },
  {
    id: 'billing',
    title: 'Billing Report',
    desc: 'Client-wise deployed workforce and billing summary.',
    category: 'billing',
    targetTab: 'billing',
    formats: ['excel', 'pdf']
  },
  {
    id: 'employee',
    title: 'Employee Master Report',
    desc: 'Employee master profiles, statutory IDs, and bank details.',
    category: 'employee',
    targetTab: 'employee',
    formats: ['excel', 'pdf']
  },
  {
    id: 'inventory',
    title: 'Inventory Report',
    desc: 'Stock levels, issued assets, and item valuations.',
    category: 'inventory',
    targetTab: 'inventory',
    formats: ['excel', 'pdf']
  },

  // --- PF Reports ---
  {
    id: 'epf-form-11',
    title: 'EPF Form 11 - Declaration Form',
    desc: 'Declaration form submitted by employees on joining.',
    category: 'pf',
    targetTab: 'epf-form-11',
    formats: ['pdf']
  },
  {
    id: 'pf-challan',
    title: 'PF challan',
    desc: 'Monthly EPFO payment challan and payment receipt.',
    category: 'pf',
    targetTab: 'pf-challan',
    formats: ['pdf', 'excel']
  },
  {
    id: 'pf-form-3a',
    title: 'PF - Form 3A',
    desc: 'Annual contribution card with EPF & EPS deductions.',
    category: 'pf',
    targetTab: 'pf-form-3a',
    formats: ['pdf', 'excel']
  },
  {
    id: 'pf-form-5',
    title: 'PF - Form 5',
    desc: 'Return of employees qualifying for EPF membership.',
    category: 'pf',
    targetTab: 'pf-form-5',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'pf-form-6a',
    title: 'PF - Form 6A -',
    desc: 'Consolidated annual member contribution statement.',
    category: 'pf',
    targetTab: 'pf-form-6a',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'pf-form-10',
    title: 'PF - Form 10 -',
    desc: 'Return of employees leaving service during the month.',
    category: 'pf',
    targetTab: 'pf-form-10',
    formats: ['pdf']
  },
  {
    id: 'pf-form-12a',
    title: 'PF - Form 12A -',
    desc: 'Monthly statement of EPF, EPS, and EDLI payments.',
    category: 'pf',
    targetTab: 'pf-form-12a',
    formats: ['pdf']
  },
  {
    id: 'pf-ecr-excel',
    title: 'PF ECR',
    desc: 'ECR Excel format with employee wage breakdown.',
    category: 'pf',
    targetTab: 'pf-ecr-excel',
    formats: ['excel']
  },
  {
    id: 'pf-report-employee-wise',
    title: 'PF Peport Employee Wise',
    desc: 'Employee-wise PF gross wages and contribution sheet.',
    category: 'pf',
    targetTab: 'pf-report-employee-wise',
    formats: ['excel']
  },
  {
    id: 'pf-report-location-wise',
    title: 'PF Report Loction Wise',
    desc: 'Branch and site-wise statutory PF liability summary.',
    category: 'pf',
    targetTab: 'pf-report-location-wise',
    formats: ['excel']
  },
  {
    id: 'pf-summary-report',
    title: 'PF Summry Report',
    desc: 'Consolidated monthly PF statutory liability summary.',
    category: 'pf',
    targetTab: 'pf-summary-report',
    formats: ['pdf']
  },
  {
    id: 'pf-form-2-revised',
    title: 'PF-Form-2_Revised_',
    desc: 'Nomination and declaration form for EPF & EPS schemes.',
    category: 'pf',
    targetTab: 'pf-form-2-revised',
    formats: ['pdf']
  },

  // --- ESI Reports ---
  {
    id: 'esi-form-7-opt1',
    title: 'ESI - Form 7 - Half Yearly Report (option-1)',
    desc: 'Half-yearly return of ESI contributions (Option 1).',
    category: 'esi',
    targetTab: 'esi-form-7-opt1',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'esi-form-7-opt2',
    title: 'ESI - Form 7 - Half Yearly Report(Option-2)',
    desc: 'Branch-wise half-yearly contribution statement (Option 2).',
    category: 'esi',
    targetTab: 'esi-form-7-opt2',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'esi-challan',
    title: 'ESI Challan',
    desc: 'Monthly ESIC payment challan and bank receipt.',
    category: 'esi',
    targetTab: 'esi-challan',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'esi-form-1',
    title: 'ESI Form 1 Declaration Form',
    desc: 'Declaration form for registering new insured employees and Temporary Identity Card (TIC).',
    category: 'esi',
    targetTab: 'esi-form-1',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'esi-summary-employee',
    title: 'ESI Summry Employee Wise',
    desc: 'Employee-wise statutory ESI gross wages, 0.75% deductions, exempted wages and contribution summary.',
    category: 'esi',
    targetTab: 'esi-summary-employee-pdf',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'esi-summary-location',
    title: 'ESI Summry Location Wise',
    desc: 'Location-wise distribution of ESI contributions and wages summary (PDF & Excel).',
    category: 'esi',
    targetTab: 'esi-summary-location',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'esic-form-3',
    title: 'ESIC Form3 Return Declaration',
    desc: 'Return of declaration form for insured persons.',
    category: 'esi',
    targetTab: 'esic-form-3',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'esic-returns-form-5',
    title: 'ESIC-Returns-Form-5',
    desc: 'Statutory half-yearly return of ESIC contributions (Regulation 26).',
    category: 'esi',
    targetTab: 'esic-returns-form-5',
    formats: ['pdf', 'excel', 'csv']
  },
  {
    id: 'form-11-accident-book',
    title: 'Form 11 Accident Book',
    desc: 'Register of notices of accidents and workplace injury (Regulation 66).',
    category: 'esi',
    targetTab: 'form-11-accident-book',
    formats: ['pdf', 'excel', 'csv']
  },

  // --- Labour Laws Reports ---
  {
    id: 'bonus-register-form-c',
    title: 'Bonus Register (Form C)',
    desc: 'Register of annual bonus paid to employees.',
    category: 'labour-laws',
    targetTab: 'bonus-register-form-c',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'employment-card-form-xiv',
    title: 'Employment Card (Form XIV)',
    desc: 'Statutory employment cards issued to workmen.',
    category: 'labour-laws',
    targetTab: 'employment-card-form-xiv',
    formats: ['pdf', 'excel']
  },
  {
    id: 'muster-roll-form-xvi',
    title: 'Muster Roll (Form XVI)',
    desc: 'Daily muster roll and worker attendance register.',
    category: 'labour-laws',
    targetTab: 'muster-roll-form-xvi',
    formats: ['excel', 'pdf']
  },
  {
    id: 'register-advances-form-xxii',
    title: 'Register of Advances (Form XXII)',
    desc: 'Record of salary advances and repayments.',
    category: 'labour-laws',
    targetTab: 'register-advances-form-xxii',
    formats: ['excel', 'pdf']
  },
  {
    id: 'register-deduction-damage-form-xx',
    title: 'Register of Deductions for Damage or Loss (Form XX)',
    desc: 'Deductions recorded for damage or loss.',
    category: 'labour-laws',
    targetTab: 'register-deduction-damage-form-xx',
    formats: ['excel', 'pdf']
  },
  {
    id: 'register-fines-form-xxi',
    title: 'Register of Fines (Form XXI)',
    desc: 'Record of fines imposed on workmen.',
    category: 'labour-laws',
    targetTab: 'register-fines-form-xxi',
    formats: ['excel', 'pdf']
  },
  {
    id: 'register-overtime-form-xxiii',
    title: 'Register of Overtime (Form XXIII)',
    desc: 'Overtime duty hours and wage calculations.',
    category: 'labour-laws',
    targetTab: 'register-overtime-form-xxiii',
    formats: ['excel', 'pdf']
  },
  {
    id: 'wages-register',
    title: 'Wages Register',
    desc: 'Monthly employee wages, earnings, and deductions.',
    category: 'labour-laws',
    targetTab: 'wages-register-form-xvii',
    formats: ['excel', 'pdf']
  },
  {
    id: 'workman-register-form-xiii',
    title: 'Workman Register (Form XIII)',
    desc: 'Contract workmen master records and details.',
    category: 'labour-laws',
    targetTab: 'workman-register-form-xiii',
    formats: ['excel', 'pdf']
  },

  // --- Salary Reports ---
  {
    id: 'bank-transfer-letter',
    title: 'Bank Transfer Letter',
    desc: 'Official bank advice letter for employee salary disbursement.',
    category: 'salary',
    targetTab: 'bank-transfer-letter',
    formats: ['pdf', 'word', 'excel']
  },
  {
    id: 'bank-transfer-report',
    title: 'Bank Transfer Report',
    desc: 'Account-wise net salary credit list for bank disbursement.',
    category: 'salary',
    targetTab: 'bank-transfer-report',
    formats: ['excel', 'csv', 'pdf']
  },
  {
    id: 'form-c-bonus-paid',
    title: 'Form C - Bonus Paid to Employees',
    desc: 'Statutory bonus paid return under Payment of Bonus Act.',
    category: 'salary',
    targetTab: 'bonus-register-form-c',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'form-xxv-register-of-leave',
    title: 'Register of Leave (Form XXV)',
    desc: 'Statutory register of annual leave with wages.',
    category: 'salary',
    targetTab: 'form-xxv-register-of-leave',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'register-of-leave-se-delhi',
    title: 'Register of Leave - Form I (Delhi S&E Act)',
    desc: 'Leave register maintained under Delhi Shops & Establishment Act.',
    category: 'salary',
    targetTab: 'register-of-leave-se-delhi',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'overtime-register-salary',
    title: 'Overtime Register',
    desc: '[FORM IV, Rules 25 (2)] Overtime register for workers (Salary Reports).',
    category: 'salary',
    targetTab: 'overtime-register-salary',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'employee-payslip',
    title: 'Employee Payslip',
    desc: 'Monthly salary payslip with earnings, deductions, and net pay.',
    category: 'salary',
    targetTab: 'employee-payslip',
    formats: ['pdf']
  },
  {
    id: 'register-deductions-damage-salary',
    title: 'Register of Deductions for Damage or Loss',
    desc: '[FORM II, Rules 21 (4)] Record of deductions made from wages for damages or loss.',
    category: 'salary',
    targetTab: 'register-deductions-damage-salary',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'register-fines-employer-salary',
    title: 'Register of Fines (Employer)',
    desc: '[FORM I, Rule 21(4)] Register of fines imposed and recovered by employer.',
    category: 'salary',
    targetTab: 'register-fines-employer-salary',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'salary-sheet-format-1',
    title: 'Salary Sheet (Format 1)',
    desc: 'Statutory Wage/Salary Register with attendance, earnings, PF/ESI bases, and summary grids.',
    category: 'salary',
    targetTab: 'salary-sheet-format-1',
    formats: ['excel', 'pdf', 'csv']
  },
  {
    id: 'salary-sheet-format-2',
    title: 'Salary Sheet (Format 2)',
    desc: 'FORM - IV [Payment of Wages Rules, 1971] Register of Payment of Wages with full wage breakdown.',
    category: 'salary',
    targetTab: 'salary-sheet-format-2',
    formats: ['excel', 'pdf', 'csv']
  },

  // --- Employee Reports ---
  {
    id: 'employee-profile-report',
    title: 'Employee Profile',
    desc: 'Complete individual employee profile and personal details.',
    category: 'employee',
    targetTab: 'employee-profile',
    formats: ['pdf']
  },
  {
    id: 'fnf-settlement-payslip',
    title: 'F&F Settlement Payslip',
    desc: 'Full and final salary settlement statement on exit.',
    category: 'employee',
    targetTab: 'fnf-settlement',
    formats: ['pdf']
  },
  {
    id: 'form-16-part-b',
    title: 'Form 16 (Part B)',
    desc: 'TDS certificate with salary and tax deduction details.',
    category: 'employee',
    targetTab: 'form-16',
    formats: ['pdf']
  },
  {
    id: 'form-f-gratuity-nomination',
    title: 'Form F - Gratuity Nomination Form',
    desc: 'Statutory nomination form under Payment of Gratuity Act.',
    category: 'employee',
    targetTab: 'form-f-gratuity-nomination',
    formats: ['pdf']
  },
  {
    id: 'employee-id-card-report',
    title: 'Employee ID Card',
    desc: 'Printable employee identity card with photo and details.',
    category: 'employee',
    targetTab: 'employee-id-card',
    formats: ['pdf']
  },
  {
    id: 'employee-payslip-report',
    title: 'Employee Payslip',
    desc: 'Monthly salary payslip with gross wages and deductions.',
    category: 'employee',
    targetTab: 'payroll',
    formats: ['pdf']
  },
  {
    id: 'salary-certificate-report',
    title: 'Salary Certificate',
    desc: 'Official employee salary certificate for banks and verification.',
    category: 'employee',
    targetTab: 'salary-certificate',
    formats: ['pdf']
  }
];

/* =========================================================
   1. Wage / Salary Register Table (Matching Image 2 Layout)
   ========================================================= */
function WageSalaryRegisterTable({ reportData }) {
  const records = reportData?.records || [];
  const company = reportData?.companyInfo || {};
  const period = reportData?.period || {};
  const totals = reportData?.totals || {};

  return (
    <div className={styles.registerPaper}>
      {/* Official Header */}
      <div className={styles.officialHeader}>
        <div className={styles.officialCompanyInfo}>
          <h2 className={styles.officialCompanyName}>{company.name || 'RR Security & Facilities'}</h2>
          <p className={styles.officialCompanyAddress}>{company.address || 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044'}</p>
        </div>
        <div className={styles.officialStatutoryRules}>
          <span>(1) Form under Rule - 5 of Equal Remuneration Rules 1976.</span>
          <span>(2) Form under Rule - 21(4) 25(2) 26(1) and 26(2) of Gujarat Minimum Wages Rules 1961</span>
          <span>(3) Form under Rule - 6 of Payment of Wages (Gujarat) Rules 1963.</span>
          <span>(4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Central/Gujarat Rules 1972</span>
          <span>(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981</span>
        </div>
      </div>

      {/* Sub Bar */}
      <div className={styles.officialSubBar}>
        <div className={styles.officialMetaLeft}>
          <div><strong>PF No :-</strong> {company.pfNo || company.employerPfCode || '—'}</div>
          <div><strong>ESI No :-</strong> {company.esiNo || company.employerEsiCode || '—'}</div>
        </div>
        <div className={styles.officialMetaCenter}>
          Wage/Salary Register
        </div>
        <div className={styles.officialMetaRight}>
          <div><strong>For The Month Of :</strong> {period.monthLabel || period.month || 'Current Month'}</div>
          <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
            Date of Payment :- {formatDate(period.toDate || new Date().toISOString().slice(0, 10))}
          </div>
        </div>
      </div>

      {/* Multi-Tier Register Table */}
      <div className={styles.registerTableWrap}>
        <table className={styles.registerTable}>
          <thead>
            <tr>
              <th rowSpan="2" style={{ width: '32px' }}>Sr.<br />No.</th>
              <th rowSpan="2" style={{ minWidth: '170px' }}>Employee Name<br /><span style={{ fontWeight: 'normal', fontSize: '9px' }}>Designation / Department</span></th>
              <th rowSpan="2" style={{ width: '60px' }}>Emp. ID</th>
              <th rowSpan="2" style={{ minWidth: '100px' }}>Details<br />of<br />Attendance</th>
              <th rowSpan="2" style={{ minWidth: '110px' }}>Rate of<br />Wages</th>
              <th colSpan="4" style={{ background: '#f1f5f9' }}>Earnings</th>
              <th rowSpan="2" style={{ minWidth: '85px' }}>Gross<br />Salary</th>
              <th colSpan="4" style={{ background: '#f1f5f9' }}>Deduction</th>
              <th rowSpan="2" style={{ minWidth: '65px' }}>Gross<br />Deduct.</th>
              <th rowSpan="2" style={{ minWidth: '85px' }}>Net<br />Payable</th>
              <th rowSpan="2" style={{ minWidth: '120px' }}>Signature</th>
            </tr>
            <tr>
              {/* Earnings Sub-headers */}
              <th style={{ minWidth: '55px', fontSize: '9px' }}>BASIC<br />DA</th>
              <th style={{ minWidth: '55px', fontSize: '9px' }}>HRA<br />OTH.All</th>
              <th style={{ minWidth: '45px', fontSize: '9px' }}>CONV</th>
              <th style={{ minWidth: '55px', fontSize: '9px' }}>SP.All<br />OT/PIB</th>

              {/* Deduction Sub-headers */}
              <th style={{ minWidth: '50px', fontSize: '9px' }}>P.F<br />ESI</th>
              <th style={{ minWidth: '50px', fontSize: '9px' }}>P.T.<br />I.T.<br />LWF</th>
              <th style={{ minWidth: '50px', fontSize: '9px' }}>Advance<br />LOAN<br />Food</th>
              <th style={{ minWidth: '50px', fontSize: '9px' }}>Oth.Ded<br />E/Mbill</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, index) => {
              const att = row.attendance || {};
              const rate = row.rateOfWages || {};
              const earn = row.earnings || {};
              const ded = row.deductions || {};

              return (
                <tr key={row.employeeId ? `${row.employeeId}-${index}` : `wage-${index}`}>
                  {/* 1. Sr. No. */}
                  <td className={styles.textCenter}><strong>{row.srNo || index + 1}</strong></td>

                  {/* 2. Employee Details */}
                  <td className={styles.empDetailsCell}>
                    <div className={styles.empNameMain}>{row.name}</div>
                    <div className={styles.empSubText}>{row.designation}</div>
                    <div className={styles.empSubText} style={{ fontWeight: 600 }}>{row.department}</div>
                    <div className={styles.empSubText}>UAN No: {row.uan || '-'}</div>
                    <div className={styles.empSubText}>PF No: {row.pfNo || '-'}</div>
                    <div className={styles.empSubText}>ESI No: {row.esiNo || '-'}</div>
                  </td>

                  {/* 3. Emp. ID */}
                  <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                    {row.employeeId}
                  </td>

                  {/* 4. Details of Attendance */}
                  <td>
                    <div className={styles.stackedMetrics}>
                      <div className={styles.stackedMetricRow}><span>WD</span><span>{att.wd || '30.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>WO</span><span>{att.wo || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>PH</span><span>{att.ph || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>PD</span><span>{att.pd || '30.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>PL</span><span>{att.pl || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>CL</span><span>{att.cl || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>S.L.</span><span>{att.sl || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>ML/Adj</span><span>{att.mlAdj || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow} style={{ borderTop: '1px solid #000', fontWeight: 800 }}>
                        <span>TOT</span><span>{att.tot || '30.00'}</span>
                      </div>
                    </div>
                  </td>

                  {/* 5. Rate of Wages */}
                  <td className={styles.rateWageCell}>
                    <div className={styles.stackedMetrics}>
                      <div className={styles.stackedMetricRow}><span>BASIC</span><span>{rate.basic || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>DA</span><span>{rate.da || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>HRA</span><span>{rate.hra || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>CONV</span><span>{rate.conv || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>SP.All</span><span>{rate.spAll || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>OTH.All</span><span>{rate.othAll || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow} style={{ borderTop: '1px solid #000', fontWeight: 800 }}>
                        <span>Total</span><span>{rate.total || '0.00'}</span>
                      </div>
                    </div>
                  </td>

                  {/* 6. Earnings (Col 1: Basic / DA) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.basic ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{earn.da ?? 0}</div>
                  </td>

                  {/* 7. Earnings (Col 2: HRA / Oth.All) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.hra ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{earn.othAll ?? 0}</div>
                  </td>

                  {/* 8. Earnings (Col 3: Conv) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.conv ?? 0}</div>
                  </td>

                  {/* 9. Earnings (Col 4: Sp.All / OT) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.spAll ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{earn.otPib ?? 0}</div>
                  </td>

                  {/* 10. Gross Salary */}
                  <td className={styles.grossCell}>
                    <div className={styles.grossMain}>{row.grossSalary?.toLocaleString('en-IN')}</div>
                    <div className={styles.grossBreakdown}>P {rate.total || row.grossSalary}</div>
                    <div className={styles.grossBreakdown}>E {row.grossSalary?.toLocaleString('en-IN')}</div>
                  </td>

                  {/* 11. Deductions (Col 1: PF / ESI) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.pf ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.esi ?? 0}</div>
                  </td>

                  {/* 12. Deductions (Col 2: PT / IT / LWF) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.pt ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.it ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.lwf ?? 0}</div>
                  </td>

                  {/* 13. Deductions (Col 3: Advance / Loan / Food) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.advance ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.loan ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.food ?? 0}</div>
                  </td>

                  {/* 14. Deductions (Col 4: Oth.Ded / E/Mbill) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.othDed ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.eMbill ?? 0}</div>
                  </td>

                  {/* 15. Gross Deduct. */}
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {row.grossDeduct?.toLocaleString('en-IN')}
                  </td>

                  {/* 16. Net Payable */}
                  <td className={styles.netPayableCell}>
                    {row.netPayable || Number(row.netPayableNumber || 0).toFixed(2)}
                  </td>

                  {/* 17. Signature / Bank Details */}
                  <td className={styles.signatureCell}>
                    <div style={{ color: '#64748b', fontSize: '9px' }}>Bank</div>
                    <div className={styles.signatureBank}>{row.bankName || '—'}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9.5px' }}>{row.bankAccountNo || '—'}</div>
                    <div className={styles.signatureLine}>Sign / Thumb</div>
                  </td>
                </tr>
              );
            })}

            {/* Grand Total Row */}
            {records.length > 0 && (
              <tr className={styles.registerTotalRow}>
                <td colSpan="3" className={styles.textCenter}><strong>TOTAL ({records.length} EMPLOYEES)</strong></td>
                <td className={styles.textCenter}>—</td>
                <td className={styles.textCenter}>—</td>
                <td className={styles.textRight}>{totals.grandBasic ? totals.grandBasic.toLocaleString('en-IN') : '—'}</td>
                <td className={styles.textRight}>{totals.grandHra ? totals.grandHra.toLocaleString('en-IN') : '—'}</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}><strong>₹{totals.grandGross ? totals.grandGross.toLocaleString('en-IN') : '0'}</strong></td>
                <td className={styles.textRight}>{totals.grandPf ? totals.grandPf.toLocaleString('en-IN') : '0'}</td>
                <td className={styles.textRight}>{totals.grandPt ? totals.grandPt.toLocaleString('en-IN') : '0'}</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}><strong>₹{totals.grandDeductions ? totals.grandDeductions.toLocaleString('en-IN') : '0'}</strong></td>
                <td className={styles.textRight} style={{ fontSize: '13px', color: '#166534' }}>
                  <strong>₹{totals.grandNet ? totals.grandNet.toLocaleString('en-IN') : '0'}</strong>
                </td>
                <td className={styles.textCenter}>Verified & Approved</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   2. Attendance Table
   ========================================================= */
function AttendanceTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Company / Site</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Working Days</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Leave</th>
            <th>Attendance %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const empName = typeof item.employeeName === 'object' ? item.employeeName?.name : (item.employeeName || '—');
            const clientTitle = typeof item.clientName === 'object' ? item.clientName?.name : (item.clientName || 'RR Security & Facilities');
            const dept = typeof item.department === 'object' ? item.department?.name : (item.department || 'Operations');
            const desig = typeof item.designation === 'object' ? item.designation?.name : (item.designation || 'Staff');
            const status = typeof item.status === 'object' ? item.status?.name : (item.status || 'Good');

            return (
              <tr key={item.employeeId ? `${item.employeeId}-${idx}` : `att-${idx}`}>
                <td>{item.srNo || idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{empName}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.employeeId}</td>
                <td>{clientTitle}</td>
                <td>{dept}</td>
                <td>{desig}</td>
                <td>{item.workingDays}</td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>{item.presentDays}</td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>{item.absentDays}</td>
                <td>{item.leaveDays}</td>
                <td style={{ fontWeight: 700 }}>
                  {typeof item.attendancePercentage === 'number' ? `${item.attendancePercentage.toFixed(1)}%` : item.attendancePercentage}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassName(status)}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   3. Billing Table
   ========================================================= */
function BillingTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Client / Company</th>
            <th>Deployed Workforce</th>
            <th>Billing Period</th>
            <th>Total Man-Days</th>
            <th>Overtime Amount</th>
            <th>Gross Billing</th>
            <th>Deductions / Taxes</th>
            <th>Net Billing</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const companyName = typeof item.companyName === 'object'
              ? (item.companyName?.name || item.companyName?.clientName || 'Unnamed Client')
              : (item.companyName || item.clientName || 'Unnamed Client');

            const totalEmployees = typeof item.totalEmployees === 'object'
              ? (item.totalEmployees?.count || item.totalEmployees?.value || 0)
              : (Number(item.totalEmployees) || 0);

            const billingPeriod = typeof item.billingPeriod === 'object'
              ? (item.billingPeriod?.label || item.billingPeriod?.monthLabel || '—')
              : (item.billingPeriod || '—');

            const totalAttendance = typeof item.totalAttendance === 'object'
              ? (item.totalAttendance?.count || item.totalAttendance?.value || 0)
              : (item.totalAttendance ?? 0);

            const status = typeof item.status === 'object'
              ? (item.status?.name || item.status?.label || 'Approved')
              : (item.status || 'Approved');

            const rowKey = item.id || item._id ? `${item.id || item._id}-${idx}` : `billing-${idx}-${companyName}`;

            return (
              <tr key={rowKey}>
                <td style={{ fontWeight: 600 }}>{companyName}</td>
                <td>{totalEmployees} Guards</td>
                <td>{billingPeriod}</td>
                <td>{totalAttendance}</td>
                <td>{formatCurrency(item.overtimeAmount)}</td>
                <td>{formatCurrency(item.grossBilling)}</td>
                <td>{formatCurrency(item.deductions)}</td>
                <td style={{ fontWeight: 700, color: '#166534' }}>{formatCurrency(item.netBilling)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassName(status)}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   4. Employee Master Table
   ========================================================= */
function EmployeeMasterTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Emp. ID</th>
            <th>Father / Husband</th>
            <th>Company / Client</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Joining Date</th>
            <th>Contact</th>
            <th>Bank & A/C</th>
            <th>UAN / PF No</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const name = typeof item.name === 'object' ? item.name?.name : (item.name || '—');
            const comp = typeof item.companyName === 'object' ? item.companyName?.name : (item.companyName || '—');
            const dept = typeof item.department === 'object' ? item.department?.name : (item.department || '—');
            const desig = typeof item.designation === 'object' ? item.designation?.name : (item.designation || '—');
            const status = typeof item.status === 'object' ? item.status?.name : (item.status || 'Active');

            return (
              <tr key={item.id || item.employeeId ? `${item.id || item.employeeId}-${idx}` : `emp-${idx}`}>
                <td style={{ fontWeight: 600 }}>{name}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.employeeId}</td>
                <td>{item.fatherHusbandName || '—'}</td>
                <td>{comp}</td>
                <td>{dept}</td>
                <td>{desig}</td>
                <td>{formatDate(item.joiningDate)}</td>
                <td>{item.contact}</td>
                <td style={{ fontSize: '11px' }}>
                  <div><strong>{item.bankName || 'Bank'}</strong></div>
                  <div style={{ fontFamily: 'monospace' }}>{item.accountNumber || '—'}</div>
                </td>
                <td style={{ fontSize: '11px' }}>
                  <div>UAN: {item.uan || '—'}</div>
                  <div>PF: {item.pfNo || '—'}</div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassName(status)}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   5. Inventory Table
   ========================================================= */
function InventoryTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>Sr.</th>
            <th>Item Name & Brand</th>
            <th>Item Code</th>
            <th>Type & Category</th>
            <th>Allocated Site / Location</th>
            <th style={{ textAlign: 'right' }}>Unit Rate</th>
            <th style={{ textAlign: 'center' }}>Total Stock</th>
            <th style={{ textAlign: 'center' }}>Available</th>
            <th style={{ textAlign: 'center' }}>Issued</th>
            <th style={{ textAlign: 'center' }}>Damaged / Lost</th>
            <th style={{ textAlign: 'right' }}>Total Valuation</th>
            <th style={{ textAlign: 'center' }}>Stock Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => (
            <tr key={item.itemId ? `${item.itemId}-${idx}` : `inv-${idx}`}>
              <td style={{ textAlign: 'center' }}>{item.srNo || idx + 1}</td>
              <td>
                <div style={{ fontWeight: 700 }}>{item.item || item.itemName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Brand: {item.brand || '—'} | Unit: {item.unit || 'Pcs'}</div>
              </td>
              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.itemCode || item.itemId}</td>
              <td>
                <div><span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{item.itemType || 'ASSET'}</span></div>
                <div style={{ fontSize: '12px', marginTop: '3px' }}>{item.category}</div>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{item.client}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.location}</div>
              </td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(item.unitRate || 0)}
              </td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.totalQuantity}</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{item.available}</td>
              <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>{item.issued}</td>
              <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{(item.damaged || 0) + (item.lost || 0)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                {formatCurrency(item.totalValue || ((item.totalQuantity || 0) * (item.unitRate || 0)))}
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className={`${styles.statusBadge} ${statusClassName(item.status)}`}>
                  {item.status || 'In Stock'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   Report Filters Bar
   ========================================================= */
function ReportFilters({
  selectedReport,
  filters,
  filterOptions,
  setFilter,
  onGenerateReport,
  onResetFilters,
  isLoading
}) {
  const meta = reportMeta[selectedReport] || reportMeta.payroll;
  const showMonth = meta.filters.includes('month');
  const showCompany = meta.filters.includes('company');
  const showSite = meta.filters.includes('site') || meta.filters.includes('sites') || meta.filters.includes('department');
  const showEmployee = meta.filters.includes('employee');
  const showCategory = meta.filters.includes('category');
  const showItemType = meta.filters.includes('itemType');
  const showStatus = meta.filters.includes('status');

  const categories = filterOptions.inventoryCategories || ['Uniform', 'Asset', 'Equipment', 'Security Gear'];

  // Resolve selected client object if any
  const selectedClientObj = useMemo(() => {
    if (!filters.company || filters.company === 'All Companies' || filters.company === 'All Clients') return null;
    const target = String(filters.company).trim().toLowerCase();
    return (filterOptions.clients || []).find((c) => {
      const cName = String(c.name || c.clientName || '').trim().toLowerCase();
      const cId = String(c.clientId || c.id || c._id || '').trim().toLowerCase();
      return cName === target || cId === target || cName.includes(target) || target.includes(cName);
    });
  }, [filterOptions.clients, filters.company]);

  // Extract distinct sites dynamically based on selected Client strictly from Sites Management
  const siteOptions = useMemo(() => {
    // When a specific client is selected in the Client dropdown:
    if (filters.company && filters.company !== 'All Companies' && filters.company !== 'All Clients') {
      const selName = String(filters.company).trim().toLowerCase();
      const selId = String(selectedClientObj?.clientId || selectedClientObj?.id || selectedClientObj?._id || '').trim().toLowerCase();

      // Official Sites configured in Master Sites (Sites Management) for this client
      const fromMasterSites = (filterOptions.siteRecords || [])
        .filter((s) => {
          const sCliName = String(s.clientName || '').trim().toLowerCase();
          const sCliId = String(s.clientId || s.client || '').trim().toLowerCase();
          return (
            (selId && sCliId && sCliId === selId) ||
            (sCliName && selName && (sCliName === selName || sCliName.includes(selName) || selName.includes(sCliName)))
          );
        })
        .map((s) => (s.name || s.siteName || '').trim())
        .filter(Boolean);

      return Array.from(new Set(fromMasterSites));
    }

    // When "All Clients" is selected, show official master sites across organization
    if (filterOptions.siteRecords && filterOptions.siteRecords.length > 0) {
      return Array.from(new Set(filterOptions.siteRecords.map((s) => (s.name || s.siteName || '').trim()).filter(Boolean)));
    }

    const fromApiSites = (filterOptions.sites || []).map((s) => (typeof s === 'string' ? s : s.name || '').trim()).filter(Boolean);
    return Array.from(new Set(fromApiSites));
  }, [filterOptions.sites, filterOptions.siteRecords, filters.company, selectedClientObj]);

  // If site filter is selected but no longer valid in the newly filtered siteOptions, reset to 'All Sites'
  useEffect(() => {
    if (filters.site && filters.site !== 'All Sites') {
      if (!siteOptions.includes(filters.site)) {
        setFilter('site', 'All Sites');
      }
    }
  }, [siteOptions, filters.site, setFilter]);

  // Filter employees dynamically based on the selected Client and Site
  const filteredEmployees = useMemo(() => {
    const list = filterOptions.employees || [];
    const selectedComp = filters.company;
    const selectedSite = filters.site;

    return list.filter((emp) => {
      // 1. Client filter
      if (selectedComp && selectedComp !== 'All Companies' && selectedComp !== 'All Clients' && selectedComp !== 'All Companies & Clients') {
        const selectedCompLower = String(selectedComp).trim().toLowerCase();
        const empClient = String(emp.clientName || '').trim().toLowerCase();
        const empClientId = String(emp.clientId || '').trim().toLowerCase();
        const empComp = String(emp.companyName || '').trim().toLowerCase();
        const empSite = String(emp.site || '').trim().toLowerCase();
        const empSiteLoc = String(emp.siteLocation || '').trim().toLowerCase();

        const matchesClient =
          empClient === selectedCompLower ||
          empClientId === selectedCompLower ||
          empComp === selectedCompLower ||
          (empClient && selectedCompLower.includes(empClient)) ||
          (selectedCompLower && empClient.includes(selectedCompLower)) ||
          (!empClient && empSite === selectedCompLower) ||
          (!empClient && empSiteLoc === selectedCompLower);

        if (!matchesClient) return false;
      }

      // 2. Site filter
      if (selectedSite && selectedSite !== 'All Sites') {
        const siteLower = String(selectedSite).trim().toLowerCase();
        const empSite = String(emp.site || '').trim().toLowerCase();
        const empSiteLoc = String(emp.siteLocation || '').trim().toLowerCase();

        const matchesSite =
          empSite === siteLower ||
          empSiteLoc === siteLower ||
          (empSite && (empSite.includes(siteLower) || siteLower.includes(empSite))) ||
          (empSiteLoc && (empSiteLoc.includes(siteLower) || siteLower.includes(empSiteLoc)));

        if (!matchesSite) return false;
      }

      return true;
    });
  }, [filterOptions.employees, filters.company, filters.site]);

  // If currently selected employee does not exist in the filtered list, reset to 'All Employees'
  useEffect(() => {
    if (filters.employee && filters.employee !== 'All Employees') {
      const exists = filteredEmployees.some(
        (emp) => emp.label === filters.employee || emp.name === filters.employee || emp.employeeId === filters.employee
      );
      if (!exists) {
        setFilter('employee', 'All Employees');
      }
    }
  }, [filteredEmployees, filters.employee, setFilter]);

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <div className={styles.filterTitleWrap}>
          <Filter size={16} />
          <h3>Report Filters</h3>
        </div>
      </div>

      <div className={styles.filterGrid}>
        {showMonth && (
          <div className={styles.fieldGroup}>
            <label>Report Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilter('month', e.target.value)}
            />
          </div>
        )}

        {showCompany && (
          <div className={styles.fieldGroup}>
            <label>Client</label>
            <select
              value={filters.company}
              onChange={(e) => {
                const newComp = e.target.value;
                setFilter('company', newComp);
                setFilter('site', 'All Sites');
                setFilter('employee', 'All Employees');
              }}
            >
              <option value="All Companies">All Clients</option>
              {filterOptions.clients && filterOptions.clients.length > 0 && (
                filterOptions.clients.map((cli) => {
                  const clientName = cli.name || cli.clientName || '';
                  const locationInfo = cli.location || cli.address ? ` (${cli.location || cli.address})` : '';
                  return (
                    <option key={`cli-${cli.clientId || cli._id || clientName}`} value={clientName}>
                      {clientName}{locationInfo}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        )}

        {showSite && (
          <div className={styles.fieldGroup}>
            <label>
              Sites
              {filters.company && filters.company !== 'All Companies' && filters.company !== 'All Clients' && (
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '6px' }}>
                  ({siteOptions.length})
                </span>
              )}
            </label>
            <select
              value={filters.site || 'All Sites'}
              onChange={(e) => {
                setFilter('site', e.target.value);
                setFilter('employee', 'All Employees');
              }}
            >
              <option value="All Sites">
                {filters.company && filters.company !== 'All Companies' && filters.company !== 'All Clients'
                  ? siteOptions.length > 0 ? `All Sites (${siteOptions.length})` : 'No Sites Configured'
                  : 'All Sites'}
              </option>
              {siteOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {showEmployee && (
          <div className={styles.fieldGroup}>
            <label>
              Employee
              {((filters.company && filters.company !== 'All Companies' && filters.company !== 'All Clients') ||
                (filters.site && filters.site !== 'All Sites')) && (
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '6px' }}>
                  ({filteredEmployees.length})
                </span>
              )}
            </label>
            <select
              value={filters.employee}
              onChange={(e) => setFilter('employee', e.target.value)}
            >
              <option value="All Employees">
                {(filters.company && filters.company !== 'All Companies' && filters.company !== 'All Clients') ||
                (filters.site && filters.site !== 'All Sites')
                  ? `All Employees (${filteredEmployees.length})`
                  : 'All Employees'}
              </option>
              {filteredEmployees.map((emp) => (
                <option key={emp.employeeId || emp.id} value={emp.label || emp.name}>
                  {emp.label || emp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCategory && (
          <div className={styles.fieldGroup}>
            <label>Item Category</label>
            <select
              value={filters.category || 'All Categories'}
              onChange={(e) => setFilter('category', e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {showItemType && (
          <div className={styles.fieldGroup}>
            <label>Item Type</label>
            <select
              value={filters.itemType || 'All Types'}
              onChange={(e) => setFilter('itemType', e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="uniform">Uniform</option>
              <option value="asset">Asset</option>
            </select>
          </div>
        )}

        {showStatus && (
          <div className={styles.fieldGroup}>
            <label>Stock Status</label>
            <select
              value={filters.status || 'All Statuses'}
              onChange={(e) => setFilter('status', e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        )}

        <div className={styles.fieldGroup} style={{ alignSelf: 'flex-end', minWidth: 'max-content' }}>
          <label style={{ visibility: 'hidden', height: '17px', margin: 0 }}>&nbsp;</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onGenerateReport}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '42px',
                whiteSpace: 'nowrap',
                padding: '0 16px',
              }}
            >
              <RefreshCw size={14} className={isLoading ? styles.spinIcon : ''} />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onResetFilters}
              disabled={isLoading}
              style={{ height: '42px', padding: '0 14px' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Report Body
   ========================================================= */
function ReportBody({
  activeReport,
  searchTerm,
  filters,
  filterOptions,
  setFilter,
  reportData,
  isLoading,
  onGenerateReport,
  onResetFilters,
  isExporting = false,
  activeCompany: passedCompany = null,
  isReportGenerated = false,
}) {
  const companyCtx = typeof useCompany === 'function' ? useCompany() : null;
  const activeCompany = passedCompany || companyCtx?.activeCompany || null;
  const meta = reportMeta[activeReport] || reportMeta.payroll;
  const summaryCards = reportData?.summaryCards || [];
  const records = reportData?.records || [];

  // Filter records by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm) return records;
    const query = searchTerm.toLowerCase();
    return records.filter((row) => {
      const haystack = JSON.stringify(row).toLowerCase();
      return haystack.includes(query);
    });
  }, [records, searchTerm]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = filteredRows.length;
  const paginatedRows = useMemo(() => {
    // When exporting PDF, or for WageSalaryRegister, EmployeeProfile, Full & Final Settlement, and ESI Form 7, show all matching records
    if (isExporting || activeReport === 'payroll' || activeReport === 'employee-profile' || activeReport === 'fnf-settlement' || activeReport === 'fnf-settlement-payslip' || activeReport === 'esi-form-7-opt1' || activeReport === 'esi-form-7' || activeReport === 'form-7-esi' || activeReport === 'form-7') return filteredRows;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage, activeReport, isExporting]);

  const renderTable = () => {
    if (activeReport === 'payroll') {
      return <WageSalaryRegisterTable reportData={{ ...reportData, records: filteredRows }} />;
    }
    if (activeReport === 'attendance') return <AttendanceTable rows={paginatedRows} />;
    if (activeReport === 'billing') return <BillingTable rows={paginatedRows} />;
    if (activeReport === 'employee-profile') {
      return (
        <EmployeeProfileReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          filters={filters}
          onExportEmployeePdf={(emp, comp) => {
            downloadEmployeeProfile(emp, comp || reportData?.companyInfo, { mode: 'download' });
          }}
          onPrintEmployeePdf={(emp, comp) => {
            downloadEmployeeProfile(emp, comp || reportData?.companyInfo, { mode: 'print' });
          }}
          onExportAllPdfs={async (empList, comp) => {
            for (const emp of empList) {
              await downloadEmployeeProfile(emp, comp || reportData?.companyInfo, { mode: 'download' });
            }
          }}
        />
      );
    }
    if (activeReport === 'fnf-settlement' || activeReport === 'fnf-settlement-payslip') {
      return (
        <FnfSettlementReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          filters={filters}
          onExportPdf={(rec, comp) => {
            downloadFnfSettlementPdf(rec, comp || reportData?.companyInfo, { mode: 'download' });
          }}
          onPrintPdf={(rec, comp) => {
            downloadFnfSettlementPdf(rec, comp || reportData?.companyInfo, { mode: 'print' });
          }}
        />
      );
    }
    if (activeReport === 'form-16' || activeReport === 'form-16-part-b') {
      return (
        <Form16ReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          filters={filters}
        />
      );
    }
    if (activeReport === 'form-f-gratuity-nomination' || activeReport === 'form-f') {
      return (
        <FormFReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          filters={filters}
        />
      );
    }
    if (activeReport === 'salary-certificate' || activeReport === 'salary-certificate-report') {
      return (
        <SalaryCertificateReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          filters={filters}
        />
      );
    }
    if (activeReport === 'employee-id-card' || activeReport === 'employee-id-card-report') {
      const effectiveCompany = {
        ...(activeCompany || {}),
        ...(reportData?.companyInfo || {}),
        name: reportData?.companyInfo?.name || reportData?.companyInfo?.companyName || activeCompany?.name || activeCompany?.companyName,
        address: reportData?.companyInfo?.address || activeCompany?.address || activeCompany?.registeredAddress,
        phone: reportData?.companyInfo?.phone || activeCompany?.phone || activeCompany?.contactNumber,
        email: reportData?.companyInfo?.email || activeCompany?.email,
        logo: reportData?.companyInfo?.logo || activeCompany?.logo || activeCompany?.logoUrl,
      };
      return (
        <EmployeeIdCardReportView
          records={filteredRows}
          companyInfo={effectiveCompany}
          period={reportData?.period}
          filters={filters}
        />
      );
    }
    if (activeReport === 'bonus-register-form-c' || activeReport === 'form-c-bonus-paid') {
      return (
        <BonusRegisterFormCView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'employment-card-form-xiv' || activeReport === 'employment-card') {
      return (
        <EmploymentCardFormXIVReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          filters={filters}
        />
      );
    }
    if (activeReport === 'muster-roll-form-xvi' || activeReport === 'form-xvi' || activeReport === 'muster-roll') {
      return (
        <MusterRollFormXVIReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'register-advances-form-xxii' || activeReport === 'form-xxii' || activeReport === 'register-advances') {
      return (
        <AdvancesRegisterFormXXIIReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'register-deduction-damage-form-xx' || activeReport === 'form-xx' || activeReport === 'register-deductions-damage') {
      return (
        <DeductionsDamageFormXXReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'register-fines-form-xxi' || activeReport === 'form-xxi' || activeReport === 'register-fines') {
      return (
        <FinesRegisterFormXXIReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'register-overtime-form-xxiii' || activeReport === 'form-xxiii' || activeReport === 'register-overtime') {
      return (
        <OvertimeRegisterFormXXIIIReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'overtime-register-salary' ||
      activeReport === 'overtime-register-form-iv' ||
      activeReport === 'overtime-register' ||
      activeReport === 'form-iv' ||
      activeReport === 'form-iv-overtime' ||
      activeReport === 'salary-overtime'
    ) {
      return (
        <OvertimeRegisterFormIVReportView
          records={reportData?.records || filteredRows}
          companyInfo={reportData?.contractor || reportData?.companyInfo}
          establishmentInfo={reportData?.establishment || reportData?.establishmentInfo}
          contractor={reportData?.contractor}
          establishment={reportData?.establishment}
          period={reportData?.period}
          totals={reportData?.totals}
          emptyMessage={reportData?.emptyMessage}
          hasOvertime={reportData?.hasOvertime}
          filters={filters}
        />
      );
    }
    if (activeReport === 'employee-payslip' || activeReport === 'payslip') {
      return (
        <EmployeePayslipReportView
          records={reportData?.records || filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          selectedEmployeeData={reportData?.selectedEmployeeData}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'register-deductions-damage-salary' ||
      activeReport === 'form-ii-damage-loss' ||
      activeReport === 'form-ii'
    ) {
      return (
        <DeductionsDamageFormIIReportView
          records={reportData?.records || filteredRows}
          employer={reportData?.employer}
          employerInfo={reportData?.employerInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          hasDamage={reportData?.hasDamage}
          emptyMessage={reportData?.emptyMessage}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'register-fines-employer-salary' ||
      activeReport === 'form-i-fines'
    ) {
      return (
        <FinesFormIReportView
          records={reportData?.records || filteredRows}
          employer={reportData?.employer}
          employerInfo={reportData?.employerInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          hasFines={reportData?.hasFines}
          emptyMessage={reportData?.emptyMessage}
          filters={filters}
        />
      );
    }
    if (activeReport === 'salary-sheet-format-1' || activeReport === 'salary-sheet-1') {
      const effectiveCompany = {
        ...activeCompany,
        ...reportData?.companyInfo,
        employerPfCode: reportData?.companyInfo?.employerPfCode || activeCompany?.employerPfCode || activeCompany?.pfCode,
        employerEsiCode: reportData?.companyInfo?.employerEsiCode || activeCompany?.employerEsiCode || activeCompany?.esiCode,
        pfNo: reportData?.companyInfo?.pfNo || activeCompany?.employerPfCode || activeCompany?.pfCode,
        esiNo: reportData?.companyInfo?.esiNo || activeCompany?.employerEsiCode || activeCompany?.esiCode,
      };
      return (
        <SalarySheetFormat1View
          records={reportData?.records || filteredRows}
          companyInfo={effectiveCompany}
          clientInfo={reportData?.clientInfo}
          establishmentInfo={reportData?.establishmentInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          pfSummary={reportData?.pfSummary}
          esiSummary={reportData?.esiSummary}
          ptSummary={reportData?.ptSummary}
          earningSummary={reportData?.earningSummary}
          deductionSummary={reportData?.deductionSummary}
          filters={filters}
        />
      );
    }
    if (activeReport === 'salary-sheet-format-2' || activeReport === 'salary-sheet-2') {
      const effectiveCompany = {
        ...activeCompany,
        ...reportData?.companyInfo,
        employerPfCode: reportData?.companyInfo?.employerPfCode || activeCompany?.employerPfCode || activeCompany?.pfCode,
        employerEsiCode: reportData?.companyInfo?.employerEsiCode || activeCompany?.employerEsiCode || activeCompany?.esiCode,
        pfNo: reportData?.companyInfo?.pfNo || activeCompany?.employerPfCode || activeCompany?.pfCode,
        esiNo: reportData?.companyInfo?.esiNo || activeCompany?.employerEsiCode || activeCompany?.esiCode,
      };
      return (
        <SalarySheetFormat2View
          records={reportData?.records || filteredRows}
          companyInfo={effectiveCompany}
          clientInfo={reportData?.clientInfo}
          establishmentInfo={reportData?.establishmentInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          pfSummary={reportData?.pfSummary}
          esiSummary={reportData?.esiSummary}
          lwfSummary={reportData?.lwfSummary}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'esi-summary-employee-pdf' ||
      activeReport === 'esi-summary-employee-xls' ||
      activeReport === 'esi-summary-employee'
    ) {
      return (
        <EsiSummaryEmployeeReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'esi-summary-location' ||
      activeReport === 'esi-summary-location-pdf' ||
      activeReport === 'esi-summary-location-xls'
    ) {
      return (
        <EsiSummaryLocationReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'esic-form-3' || activeReport === 'form-3-esic') {
      return (
        <EsicForm3ReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'esic-returns-form-5' ||
      activeReport === 'esic-form-5' ||
      activeReport === 'form-5-esic'
    ) {
      return (
        <EsicForm5ReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'form-11-accident-book' ||
      activeReport === 'accident-book-form-11'
    ) {
      return (
        <Form11AccidentBookReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'epf-form-11' || activeReport === 'epf-form-11-declaration') {
      return (
        <EpfForm11ReportView
          reportData={reportData || {}}
          filters={filters}
          onSelectEmployee={(empId) => setFilter('employee', empId)}
        />
      );
    }
    if (activeReport === 'pf-challan' || activeReport === 'epf-challan') {
      return (
        <PfChallanReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'pf-form-3a' || activeReport === 'form-3a') {
      return (
        <PfForm3AReportView
          reportData={reportData || {}}
          filters={filters}
          onSelectEmployee={(empId) => setFilter('employee', empId)}
        />
      );
    }
    if (activeReport === 'pf-form-5' || activeReport === 'form-5-epf') {
      return (
        <PfForm5ReportView
          reportData={reportData || {}}
          filters={filters}
          onScopeChange={() => fetchActiveReportData()}
        />
      );
    }
    if (activeReport === 'pf-form-6a' || activeReport === 'form-6a-epf') {
      return (
        <PfForm6AReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'pf-form-10' || activeReport === 'form-10-epf') {
      return (
        <PfForm10ReportView
          reportData={reportData || {}}
          filters={filters}
          onScopeChange={() => fetchActiveReportData()}
        />
      );
    }
    if (activeReport === 'pf-form-12a' || activeReport === 'form-12a-epf') {
      return (
        <PfForm12AReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'pf-ecr-excel' || activeReport === 'pf-ecr') {
      return (
        <PfEcrReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'pf-report-employee-wise' || activeReport === 'pf-employee-wise') {
      return (
        <PfEmployeeWiseReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'pf-report-location-wise' || activeReport === 'pf-location-wise') {
      return (
        <PfLocationWiseReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (activeReport === 'pf-summary-report' || activeReport === 'pf-summary') {
      return (
        <PfSummaryReportView
          reportData={reportData || {}}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'pf-form-2-revised' ||
      activeReport === 'form-2-revised' ||
      activeReport === 'pf-form-2'
    ) {
      return (
        <PfForm2ReportView
          reportData={reportData || {}}
          filters={filters}
          onSelectEmployee={(empId) => setFilter('employee', empId)}
        />
      );
    }
    if (activeReport === 'esi-form-1') {
      return (
        <EsiForm1ReportView
          reportData={reportData}
          filters={filters}
          onSelectEmployee={(empId) => setFilter('employee', empId)}
        />
      );
    }
    if (activeReport === 'esi-challan') {
      return (
        <EsiChallanReportView
          reportData={reportData}
          filters={filters}
        />
      );
    }
    if (activeReport === 'esi-form-7-opt2') {
      return (
        <EsiForm7Option2ReportView
          records={reportData?.records || filteredRows}
          companyInfo={reportData?.companyInfo}
          clientInfo={reportData?.clientInfo}
          establishmentInfo={reportData?.establishmentInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          monthlySummaries={reportData?.monthlySummaries}
          filters={filters}
        />
      );
    }
    if (
      activeReport === 'esi-form-7-opt1' ||
      activeReport === 'esi-form-7' ||
      activeReport === 'form-7-esi' ||
      activeReport === 'form-7'
    ) {
      return (
        <EsiForm7ReportView
          records={reportData?.records || filteredRows}
          companyInfo={reportData?.companyInfo}
          clientInfo={reportData?.clientInfo}
          establishmentInfo={reportData?.establishmentInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          monthlySummaries={reportData?.monthlySummaries}
          filters={filters}
        />
      );
    }
    if (activeReport === 'wages-register-form-xvii' || activeReport === 'form-xvii' || activeReport === 'wages-register') {
      return (
        <WagesRegisterFormXVIILReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          establishmentInfo={reportData?.establishmentInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          pfSummary={reportData?.pfSummary}
          esiSummary={reportData?.esiSummary}
          filters={filters}
        />
      );
    }
    if (activeReport === 'workman-register-form-xiii' || activeReport === 'form-xiii' || activeReport === 'workman-register') {
      return (
        <WorkmanRegisterFormXIIIReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          establishmentInfo={reportData?.establishmentInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'bank-transfer-letter') {
      return (
        <BankTransferLetterReportView
          records={filteredRows}
          letterInfo={reportData?.letterInfo}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'bank-transfer-report') {
      return (
        <BankTransferReportView
          records={filteredRows}
          remitterInfo={reportData?.remitterInfo}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'register-of-leave-se-delhi') {
      return (
        <FormILeaveReportView
          records={reportData?.records || filteredRows}
          selectedEmployeeData={reportData?.selectedEmployeeData}
          employees={reportData?.employees}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          filters={filters}
        />
      );
    }
    if (activeReport === 'leave' || activeReport === 'form-xxv-register-of-leave') {
      return (
        <LeaveRegisterReportView
          records={filteredRows}
          companyInfo={reportData?.companyInfo}
          period={reportData?.period}
          totals={reportData?.totals}
          statutoryNotes={reportData?.statutoryNotes}
          filters={filters}
        />
      );
    }
    if (activeReport === 'employee') {
      return <EmployeeMasterTable rows={paginatedRows} />;
    }
    if (activeReport === 'inventory') return <InventoryTable rows={paginatedRows} />;
    return null;
  };

  return (
    <section className={styles.reportPanel}>
      {/* Report Filter Controls (Always at top) */}
      <ReportFilters
        selectedReport={activeReport}
        filters={filters}
        filterOptions={filterOptions}
        setFilter={setFilter}
        onGenerateReport={onGenerateReport}
        onResetFilters={onResetFilters}
        isLoading={isLoading}
      />

      {/* If Report is NOT generated yet, show clean call-to-action placeholder */}
      {!isReportGenerated || !reportData ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          margin: '20px 0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <FileBarChart size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
            Report Ready to Generate
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
            Configure your filters above and click <strong>"Generate Report"</strong> to query database records and render the {meta.title}.
          </p>
        </div>
      ) : (
        <>
          {/* Search Toolbar */}
          <div className={styles.toolbarRow}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setFilter('searchTerm', event.target.value)}
                placeholder={meta.placeholder}
              />
            </div>
          </div>

      {/* Table / Register Render */}
      {isLoading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Generating {meta.title} from MongoDB...</p>
        </div>
      ) : (filteredRows.length > 0 ||
          activeReport === 'form-11-accident-book' ||
          activeReport === 'accident-book-form-11' ||
          activeReport === 'epf-form-11' ||
          activeReport === 'epf-form-11-declaration' ||
          activeReport === 'pf-challan' ||
          activeReport === 'epf-challan' ||
          activeReport === 'pf-form-3a' ||
          activeReport === 'form-3a' ||
          activeReport === 'pf-form-5' ||
          activeReport === 'form-5-epf' ||
          activeReport === 'pf-form-6a' ||
          activeReport === 'form-6a-epf' ||
          activeReport === 'pf-form-10' ||
          activeReport === 'form-10-epf' ||
          activeReport === 'esic-returns-form-5' ||
          activeReport === 'esic-form-5' ||
          activeReport === 'form-5-esic' ||
          activeReport === 'esic-form-3' ||
          activeReport === 'form-3-esic' ||
          activeReport === 'esi-summary-location' ||
          activeReport === 'esi-summary-location-pdf' ||
          activeReport === 'esi-summary-location-xls' ||
          activeReport === 'esi-summary-employee-pdf' ||
          activeReport === 'esi-summary-employee-xls' ||
          activeReport === 'esi-summary-employee' ||
          activeReport === 'esi-form-1' ||
          activeReport === 'esi-challan' ||
          activeReport === 'esi-form-7-opt2' ||
          activeReport === 'salary-sheet-format-1' ||
          activeReport === 'salary-sheet-1' ||
          activeReport === 'salary-sheet-format-2' ||
          activeReport === 'salary-sheet-2' ||
          activeReport === 'register-fines-employer-salary' ||
          activeReport === 'form-i-fines' ||
          activeReport === 'register-deductions-damage-salary' ||
          activeReport === 'form-ii-damage-loss' ||
          activeReport === 'form-ii' ||
          activeReport === 'employee-profile' ||
          activeReport === 'fnf-settlement' ||
          activeReport === 'fnf-settlement-payslip' ||
          activeReport === 'form-16' ||
          activeReport === 'form-16-part-b' ||
          activeReport === 'form-f-gratuity-nomination' ||
          activeReport === 'form-f' ||
          activeReport === 'salary-certificate' ||
          activeReport === 'salary-certificate-report' ||
          activeReport === 'employee-id-card' ||
          activeReport === 'employee-id-card-report' ||
          activeReport === 'bonus-register-form-c' ||
          activeReport === 'form-c-bonus-paid' ||
          activeReport === 'employment-card-form-xiv' ||
          activeReport === 'employment-card' ||
          activeReport === 'muster-roll-form-xvi' ||
          activeReport === 'form-xvi' ||
          activeReport === 'muster-roll' ||
          activeReport === 'register-advances-form-xxii' ||
          activeReport === 'form-xxii' ||
          activeReport === 'register-advances' ||
          activeReport === 'register-deduction-damage-form-xx' ||
          activeReport === 'form-xx' ||
          activeReport === 'register-deductions-damage' ||
          activeReport === 'register-fines-form-xxi' ||
          activeReport === 'form-xxi' ||
          activeReport === 'register-fines' ||
          activeReport === 'register-overtime-form-xxiii' ||
          activeReport === 'form-xxiii' ||
          activeReport === 'register-overtime' ||
          activeReport === 'overtime-register-salary' ||
          activeReport === 'overtime-register-form-iv' ||
          activeReport === 'wages-register-form-xvii' ||
          activeReport === 'form-xvii' ||
          activeReport === 'wages-register' ||
          activeReport === 'workman-register-form-xiii' ||
          activeReport === 'form-xiii' ||
          activeReport === 'workman-register' ||
          activeReport === 'bank-transfer-letter' ||
          activeReport === 'bank-transfer-report' ||
          activeReport === 'leave' ||
          activeReport === 'form-xxv-register-of-leave' ||
          activeReport === 'register-of-leave-se-delhi' ||
          activeReport === 'esi-form-7-opt1' ||
          activeReport === 'esi-form-7' ||
          activeReport === 'form-7-esi' ||
          activeReport === 'form-7') ? (
        <>
          <div id="report-preview-capture-area" className={styles.reportPreviewCaptureArea}>
            {(activeReport === 'attendance' || activeReport === 'billing' || activeReport === 'employee' || activeReport === 'inventory') && (
              <div className={styles.standardReportDocHeader}>
                <div className={styles.standardReportHeaderTop}>
                  <div className={styles.standardReportCompanyBlock}>
                    <h2 className={styles.standardReportCompanyName}>{reportData?.companyInfo?.name || 'RR SECURITY & FACILITIES'}</h2>
                    <p className={styles.standardReportCompanyAddress}>{reportData?.companyInfo?.address || 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044'}</p>
                    <div className={styles.standardReportStatutoryRow}>
                      <span>PF No: {reportData?.companyInfo?.pfNo || reportData?.companyInfo?.employerPfCode || activeCompany?.employerPfCode || '—'}</span>
                      <span>ESI No: {reportData?.companyInfo?.esiNo || reportData?.companyInfo?.esicNo || reportData?.companyInfo?.employerEsiCode || activeCompany?.employerEsiCode || '—'}</span>
                    </div>
                  </div>
                  <div className={styles.standardReportTitleBlock}>
                    <h3 className={styles.standardReportDocTitle}>{meta.title.toUpperCase()}</h3>
                    <div className={styles.standardReportPeriodBadge}>
                      For The Period: {reportData?.period?.monthLabel || filters.month || 'Current Month'}
                    </div>
                    <div className={styles.standardReportDateStamp}>
                      Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className={styles.standardReportSummaryBar}>
                  <div><strong>Company / Client:</strong> {filters.company || 'All Clients'}</div>
                  <div><strong>Site:</strong> {filters.site || 'All Sites'}</div>
                  <div><strong>Total Records:</strong> {filteredRows.length}</div>
                </div>
              </div>
            )}
            {renderTable()}
          </div>
          {activeReport !== 'payroll' &&
            activeReport !== 'form-11-accident-book' &&
            activeReport !== 'accident-book-form-11' &&
            activeReport !== 'epf-form-11' &&
            activeReport !== 'epf-form-11-declaration' &&
            activeReport !== 'pf-challan' &&
            activeReport !== 'epf-challan' &&
            activeReport !== 'pf-form-3a' &&
            activeReport !== 'form-3a' &&
            activeReport !== 'pf-form-5' &&
            activeReport !== 'form-5-epf' &&
            activeReport !== 'pf-form-6a' &&
            activeReport !== 'form-6a-epf' &&
            activeReport !== 'pf-form-10' &&
            activeReport !== 'form-10-epf' &&
            activeReport !== 'pf-form-12a' &&
            activeReport !== 'form-12a-epf' &&
            activeReport !== 'pf-ecr-excel' &&
            activeReport !== 'pf-ecr' &&
            activeReport !== 'pf-report-employee-wise' &&
            activeReport !== 'pf-employee-wise' &&
            activeReport !== 'pf-report-location-wise' &&
            activeReport !== 'pf-location-wise' &&
            activeReport !== 'pf-summary-report' &&
            activeReport !== 'pf-summary' &&
            activeReport !== 'pf-form-2-revised' &&
            activeReport !== 'form-2-revised' &&
            activeReport !== 'pf-form-2' &&
            activeReport !== 'esic-returns-form-5' &&
            activeReport !== 'esic-form-5' &&
            activeReport !== 'form-5-esic' &&
            activeReport !== 'esic-form-3' &&
            activeReport !== 'form-3-esic' &&
            activeReport !== 'esi-summary-location' &&
            activeReport !== 'esi-summary-location-pdf' &&
            activeReport !== 'esi-summary-location-xls' &&
            activeReport !== 'esi-summary-employee-pdf' &&
            activeReport !== 'esi-summary-employee-xls' &&
            activeReport !== 'esi-summary-employee' &&
            activeReport !== 'esi-form-1' &&
            activeReport !== 'esi-challan' &&
            activeReport !== 'esi-form-7-opt2' &&
            activeReport !== 'salary-sheet-format-1' &&
            activeReport !== 'salary-sheet-1' &&
            activeReport !== 'salary-sheet-format-2' &&
            activeReport !== 'salary-sheet-2' &&
            activeReport !== 'register-fines-employer-salary' &&
            activeReport !== 'form-i-fines' &&
            activeReport !== 'register-deductions-damage-salary' &&
            activeReport !== 'form-ii-damage-loss' &&
            activeReport !== 'form-ii' &&
            activeReport !== 'employee-profile' &&
            activeReport !== 'fnf-settlement' &&
            activeReport !== 'fnf-settlement-payslip' &&
            activeReport !== 'form-16' &&
            activeReport !== 'form-16-part-b' &&
            activeReport !== 'form-f-gratuity-nomination' &&
            activeReport !== 'form-f' &&
            activeReport !== 'salary-certificate' &&
            activeReport !== 'salary-certificate-report' &&
            activeReport !== 'employee-id-card' &&
            activeReport !== 'employee-id-card-report' &&
            activeReport !== 'bonus-register-form-c' &&
            activeReport !== 'form-c-bonus-paid' &&
            activeReport !== 'employment-card-form-xiv' &&
            activeReport !== 'employment-card' &&
            activeReport !== 'muster-roll-form-xvi' &&
            activeReport !== 'form-xvi' &&
            activeReport !== 'muster-roll' &&
            activeReport !== 'register-advances-form-xxii' &&
            activeReport !== 'form-xxii' &&
            activeReport !== 'register-advances' &&
            activeReport !== 'register-deduction-damage-form-xx' &&
            activeReport !== 'form-xx' &&
            activeReport !== 'register-deductions-damage' &&
            activeReport !== 'register-fines-form-xxi' &&
            activeReport !== 'form-xxi' &&
            activeReport !== 'register-fines' &&
            activeReport !== 'register-overtime-form-xxiii' &&
            activeReport !== 'form-xxiii' &&
            activeReport !== 'register-overtime' &&
            activeReport !== 'overtime-register-salary' &&
            activeReport !== 'overtime-register-form-iv' &&
            activeReport !== 'wages-register-form-xvii' &&
            activeReport !== 'form-xvii' &&
            activeReport !== 'wages-register' &&
            activeReport !== 'workman-register-form-xiii' &&
            activeReport !== 'form-xiii' &&
            activeReport !== 'workman-register' &&
            activeReport !== 'bank-transfer-letter' &&
            activeReport !== 'bank-transfer-report' &&
            activeReport !== 'leave' &&
            activeReport !== 'form-xxv-register-of-leave' &&
            activeReport !== 'register-of-leave-se-delhi' &&
            activeReport !== 'esi-form-7-opt1' &&
            activeReport !== 'esi-form-7' &&
            activeReport !== 'form-7-esi' &&
            activeReport !== 'form-7' &&
            totalItems > PAGE_SIZE && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
              label="records"
            />
          )}
        </>
      ) : (
        <div className={styles.emptyStateCard}>
          <h3>No report records found.</h3>
          <p>Try selecting a different month or adjusting your filters.</p>
        </div>
      )}
        </>
      )}
    </section>
  );
}

/* =========================================================
   Export Report Modal (PDF & Excel download)
   ========================================================= */
function ExportReportModal({
  isOpen,
  onClose,
  selectedReport,
  reportData,
  filters,
  onExportSuccess,
  onStartExport,
  onEndExport
}) {
  const [format, setFormat] = useState(
    selectedReport === 'bonus-register-form-c' ||
    selectedReport === 'form-c-bonus-paid' ||
    selectedReport === 'register-deduction-damage-form-xx' ||
    selectedReport === 'form-xx' ||
    selectedReport === 'register-deductions-damage' ||
    selectedReport === 'register-fines-form-xxi' ||
    selectedReport === 'form-xxi' ||
    selectedReport === 'register-fines' ||
    selectedReport === 'register-overtime-form-xxiii' ||
    selectedReport === 'form-xxiii' ||
    selectedReport === 'register-overtime' ||
    selectedReport === 'wages-register-form-xvii' ||
    selectedReport === 'form-xvii' ||
    selectedReport === 'wages-register' ||
    selectedReport === 'workman-register-form-xiii' ||
    selectedReport === 'form-xiii' ||
    selectedReport === 'workman-register' ||
    selectedReport === 'bank-transfer-report' ||
    selectedReport === 'leave' ||
    selectedReport === 'form-xxv-register-of-leave' ||
    selectedReport === 'register-of-leave-se-delhi' ||
    selectedReport === 'overtime-register-salary' ||
    selectedReport === 'overtime-register-form-iv' ||
    selectedReport === 'esi-form-7-opt1' ||
    selectedReport === 'esi-form-7-opt2' ||
    selectedReport === 'esi-challan' ||
    selectedReport === 'esi-form-1' ||
    selectedReport === 'esi-form-7' ||
    selectedReport === 'form-7-esi' ||
    selectedReport === 'form-7' ||
    selectedReport === 'pf-ecr-excel' ||
    selectedReport === 'pf-ecr' ||
    selectedReport === 'pf-report-employee-wise' ||
    selectedReport === 'pf-employee-wise' ||
    selectedReport === 'pf-report-location-wise' ||
    selectedReport === 'pf-location-wise'
      ? 'Excel'
      : 'PDF'
  );
  const [profileScope, setProfileScope] = useState('single');
  if (!isOpen) return null;

  const reportName = reportMeta[selectedReport]?.title || 'HRMS Report';
  const isProfileReport = selectedReport === 'employee-profile';
  const isFnfReport = selectedReport === 'fnf-settlement' || selectedReport === 'fnf-settlement-payslip';
  const isForm16Report = selectedReport === 'form-16' || selectedReport === 'form-16-part-b';
  const isFormFReport = selectedReport === 'form-f-gratuity-nomination' || selectedReport === 'form-f';
  const isSalaryCertReport = selectedReport === 'salary-certificate' || selectedReport === 'salary-certificate-report';
  const isIdCardReport = selectedReport === 'employee-id-card' || selectedReport === 'employee-id-card-report';
  const isBonusReport = selectedReport === 'bonus-register-form-c' || selectedReport === 'form-c-bonus-paid';
  const isEmploymentCardReport = selectedReport === 'employment-card-form-xiv' || selectedReport === 'employment-card';
  const isMusterRollReport = selectedReport === 'muster-roll-form-xvi' || selectedReport === 'form-xvi' || selectedReport === 'muster-roll';
  const isAdvancesReport = selectedReport === 'register-advances-form-xxii' || selectedReport === 'form-xxii' || selectedReport === 'register-advances';
  const isDeductionsDamageReport = selectedReport === 'register-deduction-damage-form-xx' || selectedReport === 'form-xx' || selectedReport === 'register-deductions-damage';
  const isFinesReport = selectedReport === 'register-fines-form-xxi' || selectedReport === 'form-xxi' || selectedReport === 'register-fines';
  const isOvertimeReport = selectedReport === 'register-overtime-form-xxiii' || selectedReport === 'form-xxiii' || selectedReport === 'register-overtime';
  const isOvertimeFormIVReport =
    selectedReport === 'overtime-register-salary' ||
    selectedReport === 'overtime-register-form-iv' ||
    selectedReport === 'overtime-register' ||
    selectedReport === 'form-iv' ||
    selectedReport === 'form-iv-overtime' ||
    selectedReport === 'salary-overtime';
  const isEmployeePayslipReport = selectedReport === 'employee-payslip' || selectedReport === 'payslip';
  const isDamageFormIIReport =
    selectedReport === 'register-deductions-damage-salary' ||
    selectedReport === 'form-ii-damage-loss' ||
    selectedReport === 'form-ii';
  const isFinesFormIReport =
    selectedReport === 'register-fines-employer-salary' ||
    selectedReport === 'form-i-fines';
  const isWagesReport = selectedReport === 'wages-register-form-xvii' || selectedReport === 'form-xvii' || selectedReport === 'wages-register';
  const isWorkmanRegisterReport = selectedReport === 'workman-register-form-xiii' || selectedReport === 'form-xiii' || selectedReport === 'workman-register';
  const isBankTransferLetterReport = selectedReport === 'bank-transfer-letter';
  const isBankTransferReport = selectedReport === 'bank-transfer-report';
  const isFormIReport = selectedReport === 'register-of-leave-se-delhi';
  const isLeaveReport = selectedReport === 'leave' || selectedReport === 'form-xxv-register-of-leave';
  const isSalarySheet1Report =
    selectedReport === 'salary-sheet-format-1' ||
    selectedReport === 'salary-sheet-1';
  const isSalarySheet2Report =
    selectedReport === 'salary-sheet-format-2' ||
    selectedReport === 'salary-sheet-2';
  const isEsiForm7Report =
    selectedReport === 'esi-form-7-opt1' ||
    selectedReport === 'esi-form-7' ||
    selectedReport === 'form-7-esi' ||
    selectedReport === 'form-7';
  const isEsiForm7Opt2Report = selectedReport === 'esi-form-7-opt2';
  const isEsiChallanReport = selectedReport === 'esi-challan';
  const isEsiForm1Report = selectedReport === 'esi-form-1';
  const isEsiSummaryEmployeeReport =
    selectedReport === 'esi-summary-employee-pdf' ||
    selectedReport === 'esi-summary-employee-xls' ||
    selectedReport === 'esi-summary-employee';
  const isEsiSummaryLocationReport =
    selectedReport === 'esi-summary-location' ||
    selectedReport === 'esi-summary-location-pdf' ||
    selectedReport === 'esi-summary-location-xls';
  const isEsicForm3Report =
    selectedReport === 'esic-form-3' ||
    selectedReport === 'form-3-esic';
  const isEsicForm5Report =
    selectedReport === 'esic-returns-form-5' ||
    selectedReport === 'esic-form-5' ||
    selectedReport === 'form-5-esic';
  const isForm11AccidentBookReport =
    selectedReport === 'form-11-accident-book' ||
    selectedReport === 'accident-book-form-11';
  const isEpfForm11Report =
    selectedReport === 'epf-form-11' ||
    selectedReport === 'epf-form-11-declaration';
  const isPfChallanReport =
    selectedReport === 'pf-challan' ||
    selectedReport === 'epf-challan';
  const isPfForm3AReport =
    selectedReport === 'pf-form-3a' ||
    selectedReport === 'form-3a';
  const isPfForm5Report =
    selectedReport === 'pf-form-5' ||
    selectedReport === 'form-5-epf';
  const isPfForm6AReport =
    selectedReport === 'pf-form-6a' ||
    selectedReport === 'form-6a-epf';
  const isPfForm10Report =
    selectedReport === 'pf-form-10' ||
    selectedReport === 'form-10-epf';
  const isPfForm12AReport =
    selectedReport === 'pf-form-12a' ||
    selectedReport === 'form-12a-epf';
  const isPfEcrReport =
    selectedReport === 'pf-ecr-excel' ||
    selectedReport === 'pf-ecr';
  const isPfEmployeeWiseReport =
    selectedReport === 'pf-report-employee-wise' ||
    selectedReport === 'pf-employee-wise';
  const isPfLocationWiseReport =
    selectedReport === 'pf-report-location-wise' ||
    selectedReport === 'pf-location-wise';
  const isPfSummaryReport =
    selectedReport === 'pf-summary-report' ||
    selectedReport === 'pf-summary';
  const isPfForm2Report =
    selectedReport === 'pf-form-2-revised' ||
    selectedReport === 'form-2-revised' ||
    selectedReport === 'pf-form-2';
  const records = reportData?.records || reportData?.cards || [];

  const targetEmp = filters?.employee && filters.employee !== 'All Employees'
    ? (records.find(r => r.name === filters.employee || r.employeeName === filters.employee || r.employeeId === filters.employee || r.employeeCode === filters.employee || (r.name && filters.employee.includes(r.name)) || (r.employeeName && filters.employee.includes(r.employeeName)) || (r.employeeId && filters.employee.includes(r.employeeId))) || records[0])
    : records[0];

  const handleExportSubmit = async () => {
    if (!records.length && !isForm11AccidentBookReport && !isPfChallanReport && !isPfForm3AReport && !isPfForm5Report && !isPfForm6AReport && !isPfForm10Report && !isPfForm12AReport && !isPfEcrReport && !isPfEmployeeWiseReport && !isPfLocationWiseReport && !isPfSummaryReport && !isPfForm2Report) {
      onExportSuccess('No records available to export.');
      onClose();
      return;
    }

    // Capture the live preview DOM for 100% exact layout, colors, table lines, cards and typography parity!
    if (format === 'PDF') {
      const captureEl = document.querySelector('#report-preview-capture-area');
      if (captureEl) {
        if (onStartExport) onStartExport();
        await new Promise((r) => setTimeout(r, 120));

        const cleanPeriodStr = (reportData?.period?.monthLabel || filters?.month || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${reportName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cleanPeriodStr}.pdf`;

        const ok = await downloadElementAsPdf(captureEl, {
          filename,
          title: reportName,
          mode: 'download',
        });

        if (onEndExport) onEndExport();

        if (ok) {
          onExportSuccess(`✓ ${reportName} PDF downloaded successfully with exact preview layout.`);
          onClose();
          return;
        }
      }
    }

    // Special handling for Employee Profile report -> generates the exact official Employee Profile PDF
    if (isProfileReport) {
      if (profileScope === 'all' && records.length > 1) {
        for (const emp of records) {
          await downloadEmployeeProfile(emp, reportData?.companyInfo, { mode: 'download' });
        }
        onExportSuccess(`✓ Downloaded all ${records.length} Employee Profiles successfully.`);
      } else {
        await downloadEmployeeProfile(targetEmp, reportData?.companyInfo, { mode: 'download' });
        onExportSuccess(`✓ Employee Profile PDF (${targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Full & Final Settlement report -> generates the exact official F&F PDF
    if (isFnfReport) {
      if (profileScope === 'all' && records.length > 1) {
        for (const emp of records) {
          await downloadFnfSettlementPdf(emp, reportData?.companyInfo, { mode: 'download' });
        }
        onExportSuccess(`✓ Downloaded all ${records.length} Full & Final Settlement statements successfully.`);
      } else {
        await downloadFnfSettlementPdf(targetEmp, reportData?.companyInfo, { mode: 'download' });
        onExportSuccess(`✓ Full & Final Settlement PDF (${targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Form 16 (Part B) report -> generates the exact official Form 16 PDF
    if (isForm16Report) {
      const exportOptions = {
        mode: 'download',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      };
      if (profileScope === 'all' && records.length > 1) {
        await downloadForm16Pdf(records, reportData?.companyInfo, reportData?.period, exportOptions);
        onExportSuccess(`✓ Downloaded all ${records.length} Form 16 (Part B) certificates successfully.`);
      } else {
        await downloadForm16Pdf(targetEmp, reportData?.companyInfo, reportData?.period, exportOptions);
        onExportSuccess(`✓ Form 16 (Part B) PDF (${targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Form F Gratuity Nomination report -> generates the exact official Form F PDF
    if (isFormFReport) {
      const exportOptions = {
        mode: 'download',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      };
      if (profileScope === 'all' && records.length > 1) {
        await downloadFormFPdf(records, reportData?.companyInfo, exportOptions);
        onExportSuccess(`✓ Downloaded all ${records.length} Form F Gratuity Nomination forms successfully.`);
      } else {
        await downloadFormFPdf(targetEmp, reportData?.companyInfo, exportOptions);
        onExportSuccess(`✓ Form F Gratuity Nomination PDF (${targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Salary Certificate report -> generates the exact official Salary Certificate PDF
    if (isSalaryCertReport) {
      const exportOptions = {
        mode: 'download',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      };
      if (profileScope === 'all' && records.length > 1) {
        await downloadSalaryCertificatePdf(records, reportData?.companyInfo, exportOptions);
        onExportSuccess(`✓ Downloaded all ${records.length} Salary Certificates successfully.`);
      } else {
        await downloadSalaryCertificatePdf(targetEmp, reportData?.companyInfo, exportOptions);
        onExportSuccess(`✓ Salary Certificate PDF (${targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Employee ID Card report -> generates the exact official ID Card PDF
    if (isIdCardReport) {
      const effectiveCompany = {
        ...(reportData?.companyInfo || {}),
        name: reportData?.companyInfo?.name || reportData?.companyInfo?.companyName,
        address: reportData?.companyInfo?.address,
        phone: reportData?.companyInfo?.phone,
        email: reportData?.companyInfo?.email,
        logo: reportData?.companyInfo?.logo,
      };
      const exportOptions = {
        mode: 'download',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      };
      if (profileScope === 'all' && records.length > 1) {
        await downloadEmployeeIdCardPdf(records, effectiveCompany, exportOptions);
        onExportSuccess(`✓ Downloaded all ${records.length} Employee ID Cards successfully.`);
      } else {
        await downloadEmployeeIdCardPdf(targetEmp, effectiveCompany, exportOptions);
        onExportSuccess(`✓ Employee ID Card PDF (${targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Employee Payslip report -> generates the exact official Employee Payslip PDF
    if (isEmployeePayslipReport) {
      if (profileScope === 'all' && records.length > 1) {
        for (const slip of records) {
          downloadEmployeePayslipPdf(slip, reportData?.companyInfo, reportData?.period || filters, { mode: 'download' });
        }
        onExportSuccess(`✓ Downloaded all ${records.length} Employee Payslips successfully.`);
      } else {
        downloadEmployeePayslipPdf(targetEmp, reportData?.companyInfo, reportData?.period || filters, { mode: 'download' });
        onExportSuccess(`✓ Employee Payslip PDF (${targetEmp?.employeeName || targetEmp?.name || 'Employee'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Bonus Register (Form C) -> generates the exact official Form C Excel / PDF
    if (isBonusReport) {
      if (format === 'PDF') {
        downloadBonusRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Bonus Register (Form C) PDF downloaded successfully.`);
      } else {
        downloadBonusRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Bonus Register (Form C) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Employment Card (Form XIV)
    if (isEmploymentCardReport) {
      if (format === 'Excel') {
        if (profileScope === 'all' && records.length > 1) {
          downloadEmploymentCardExcel(records, reportData?.companyInfo);
          onExportSuccess(`✓ Downloaded all ${records.length} Employment Cards (.xlsx) successfully.`);
        } else {
          downloadEmploymentCardExcel(targetEmp, reportData?.companyInfo);
          onExportSuccess(`✓ Employment Card Excel (${targetEmp?.workmanName || targetEmp?.name || 'Workman'}) downloaded successfully.`);
        }
      } else {
        if (profileScope === 'all' && records.length > 1) {
          await downloadEmploymentCardPdf(records, reportData?.companyInfo, { mode: 'download' });
          onExportSuccess(`✓ Downloaded all ${records.length} Employment Cards (Form XIV) successfully.`);
        } else {
          await downloadEmploymentCardPdf(targetEmp, reportData?.companyInfo, { mode: 'download' });
          onExportSuccess(`✓ Employment Card PDF (${targetEmp?.workmanName || targetEmp?.name || 'Workman'}) downloaded successfully.`);
        }
      }
      onClose();
      return;
    }

    // Special handling for Muster Roll (Form XVI) -> generates the exact statutory Form XVI Excel / PDF
    if (isMusterRollReport) {
      if (format === 'PDF') {
        downloadMusterRollPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Muster Roll (Form XVI) PDF downloaded successfully.`);
      } else {
        downloadMusterRollExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Muster Roll (Form XVI) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Advances (Form XXII) -> generates statutory Form XXII Excel / PDF
    if (isAdvancesReport) {
      if (format === 'PDF') {
        downloadAdvancesRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Advances (Form XXII) PDF downloaded successfully.`);
      } else {
        downloadAdvancesRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Advances (Form XXII) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Deductions for Damage or Loss (Form XX) -> generates statutory Form XX Excel / PDF
    if (isDeductionsDamageReport) {
      if (format === 'PDF') {
        downloadDeductionsDamagePdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Deductions for Damage or Loss (Form XX) PDF downloaded successfully.`);
      } else {
        downloadDeductionsDamageExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Deductions for Damage or Loss (Form XX) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Deductions for Damage or Loss (Form II) -> generates statutory Form II Excel / PDF / CSV
    if (isDamageFormIIReport) {
      if (format === 'PDF') {
        downloadFormIIDeductionsDamagePdf(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Deductions for Damage or Loss (Form II) PDF downloaded successfully.`);
      } else if (format === 'CSV') {
        downloadFormIIDeductionsDamageCsv(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Deductions for Damage or Loss (Form II) CSV spreadsheet downloaded successfully.`);
      } else {
        downloadFormIIDeductionsDamageExcel(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Deductions for Damage or Loss (Form II) Excel spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Fines (Employer) Form I -> generates statutory Form I Excel / PDF / CSV
    if (isFinesFormIReport) {
      if (format === 'PDF') {
        downloadFormIFinesPdf(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Fines (Form I) PDF downloaded successfully.`);
      } else if (format === 'CSV') {
        downloadFormIFinesCsv(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Fines (Form I) CSV spreadsheet downloaded successfully.`);
      } else {
        downloadFormIFinesExcel(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Fines (Form I) Excel spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Salary Sheet (Format 1) -> generates statutory Wage/Salary Register Excel / PDF / CSV
    if (isSalarySheet1Report) {
      if (format === 'PDF') {
        downloadSalarySheetFormat1Pdf(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.pfSummary,
          reportData?.esiSummary,
          reportData?.ptSummary,
          reportData?.earningSummary,
          reportData?.deductionSummary,
          { mode: 'download', clientInfo: reportData?.clientInfo, filters }
        );
        onExportSuccess(`✓ Wage/Salary Register (Salary Sheet Format 1) PDF downloaded successfully.`);
      } else if (format === 'CSV') {
        downloadSalarySheetFormat1Csv(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.pfSummary,
          reportData?.esiSummary,
          reportData?.ptSummary,
          reportData?.earningSummary,
          reportData?.deductionSummary,
          { clientInfo: reportData?.clientInfo, filters }
        );
        onExportSuccess(`✓ Wage/Salary Register (Salary Sheet Format 1) CSV spreadsheet downloaded successfully.`);
      } else {
        downloadSalarySheetFormat1Excel(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.pfSummary,
          reportData?.esiSummary,
          reportData?.ptSummary,
          reportData?.earningSummary,
          reportData?.deductionSummary,
          { format: 'xlsx', clientInfo: reportData?.clientInfo, filters }
        );
        onExportSuccess(`✓ Wage/Salary Register (Salary Sheet Format 1) Excel spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Salary Sheet (Format 2) -> generates statutory Form IV Register of Payment of Wages Excel / PDF / CSV
    if (isSalarySheet2Report) {
      if (format === 'PDF') {
        downloadSalarySheetFormat2Pdf(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.pfSummary,
          reportData?.esiSummary,
          reportData?.lwfSummary,
          { mode: 'download', clientInfo: reportData?.clientInfo, filters }
        );
        onExportSuccess(`✓ Register of Payment of Wages (Salary Sheet Format 2) PDF downloaded successfully.`);
      } else if (format === 'CSV') {
        downloadSalarySheetFormat2Csv(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.pfSummary,
          reportData?.esiSummary,
          reportData?.lwfSummary,
          { clientInfo: reportData?.clientInfo, filters }
        );
        onExportSuccess(`✓ Register of Payment of Wages (Salary Sheet Format 2) CSV spreadsheet downloaded successfully.`);
      } else {
        downloadSalarySheetFormat2Excel(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.pfSummary,
          reportData?.esiSummary,
          reportData?.lwfSummary,
          { format: 'xlsx', clientInfo: reportData?.clientInfo, filters }
        );
        onExportSuccess(`✓ Register of Payment of Wages (Salary Sheet Format 2) Excel spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for ESI Summry Employee Wise
    if (isEsiSummaryEmployeeReport) {
      if (format === 'PDF') {
        downloadEsiSummaryEmployeePdf(reportData, { mode: 'download' });
        onExportSuccess('✓ ESI Summary Employee Wise PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadEsiSummaryEmployeeCsv(reportData);
        onExportSuccess('✓ ESI Summary Employee Wise CSV downloaded successfully.');
      } else {
        downloadEsiSummaryEmployeeExcel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ ESI Summary Employee Wise Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for ESI Summry Location Wise
    if (isEsiSummaryLocationReport) {
      if (format === 'PDF') {
        downloadEsiSummaryLocationPdf(reportData, { mode: 'download' });
        onExportSuccess('✓ ESI Summary Location Wise PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadEsiSummaryLocationCsv(reportData);
        onExportSuccess('✓ ESI Summary Location Wise CSV downloaded successfully.');
      } else {
        downloadEsiSummaryLocationExcel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ ESI Summary Location Wise Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for ESIC Form 3 Return Declaration
    if (isEsicForm3Report) {
      if (format === 'PDF') {
        await downloadEsicForm3Pdf(reportData, { mode: 'download' });
        onExportSuccess('✓ ESIC Form 3 Return Declaration PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadEsicForm3Csv(reportData);
        onExportSuccess('✓ ESIC Form 3 Return Declaration CSV downloaded successfully.');
      } else {
        downloadEsicForm3Excel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ ESIC Form 3 Return Declaration Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for ESIC Form 5 Return of Contributions (Regulation 26)
    if (isEsicForm5Report) {
      if (format === 'PDF') {
        await downloadEsicForm5Pdf(reportData, { mode: 'download' });
        onExportSuccess('✓ ESIC Form 5 Return of Contributions PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadEsicForm5Csv(reportData);
        onExportSuccess('✓ ESIC Form 5 Return CSV downloaded successfully.');
      } else {
        downloadEsicForm5Excel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ ESIC Form 5 Return Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for Form 11 Accident Book (Regulation 66)
    if (isForm11AccidentBookReport) {
      if (format === 'PDF') {
        downloadForm11AccidentBookPdf(reportData, { mode: 'download' });
        onExportSuccess('✓ Form 11 Accident Book PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadForm11AccidentBookCsv(reportData);
        onExportSuccess('✓ Form 11 Accident Book CSV downloaded successfully.');
      } else {
        downloadForm11AccidentBookExcel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ Form 11 Accident Book Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for EPF Form 11 - Declaration Form (PDF only, NO LOGO)
    if (isEpfForm11Report) {
      await downloadEpfForm11Pdf(records, reportData?.companyInfo, { mode: 'download' });
      onExportSuccess('✓ EPF Form 11 - Declaration Form PDF downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF Challan (Provisional Challan for Wage Month - NO LOGO)
    if (isPfChallanReport) {
      if (format === 'PDF') {
        await downloadPfChallanPdf(reportData, { mode: 'download' });
        onExportSuccess('✓ Provisional PF Challan PDF downloaded successfully.');
      } else {
        downloadPfChallanExcel(reportData);
        onExportSuccess('✓ Provisional PF Challan Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for PF Form 3A (Revised) Contribution Card (NO LOGO)
    if (isPfForm3AReport) {
      if (format === 'PDF') {
        await downloadPfForm3APdf(reportData, { mode: 'download', scope: profileScope });
        onExportSuccess('✓ PF Form 3A (Revised) Contribution Card PDF downloaded successfully.');
      } else {
        downloadPfForm3AExcel(reportData);
        onExportSuccess('✓ PF Form 3A Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for ESI Form 1 Declaration Form
    if (isEsiForm1Report) {
      if (format === 'PDF') {
        downloadEsiForm1Pdf(reportData, { mode: 'download' });
        onExportSuccess('✓ ESI Form 1 Declaration Form PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadEsiForm1Csv(reportData);
        onExportSuccess('✓ ESI Form 1 Declaration Form CSV spreadsheet downloaded successfully.');
      } else {
        downloadEsiForm1Excel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ ESI Form 1 Declaration Form Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for ESI Challan
    if (isEsiChallanReport) {
      if (format === 'PDF') {
        downloadEsiChallanPdf(reportData, { mode: 'download' });
        onExportSuccess('✓ ESI Challan PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadEsiChallanCsv(reportData);
        onExportSuccess('✓ ESI Challan CSV spreadsheet downloaded successfully.');
      } else {
        downloadEsiChallanExcel(reportData, { format: 'xlsx' });
        onExportSuccess('✓ ESI Challan Excel workbook downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for ESI Form 7 Half-Yearly Report (Option 2)
    if (isEsiForm7Opt2Report) {
      if (format === 'PDF') {
        downloadEsiForm7Option2Pdf(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.monthlySummaries,
          { mode: 'download' }
        );
        onExportSuccess(`✓ ESI Form 7 (Option-2) PDF downloaded successfully.`);
      } else if (format === 'CSV') {
        downloadEsiForm7Option2Csv(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.monthlySummaries
        );
        onExportSuccess(`✓ ESI Form 7 (Option-2) CSV spreadsheet downloaded successfully.`);
      } else {
        downloadEsiForm7Option2Excel(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.monthlySummaries,
          { format: 'xlsx' }
        );
        onExportSuccess(`✓ ESI Form 7 (Option-2) Excel spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for ESI Form 7 Half-Yearly Report (Option 1)
    if (isEsiForm7Report) {
      if (format === 'PDF') {
        downloadEsiForm7Pdf(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.monthlySummaries,
          { mode: 'download' }
        );
        onExportSuccess(`✓ ESI Form 7 Half-Yearly Report PDF downloaded successfully.`);
      } else if (format === 'CSV') {
        downloadEsiForm7Csv(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.monthlySummaries
        );
        onExportSuccess(`✓ ESI Form 7 Half-Yearly Report CSV spreadsheet downloaded successfully.`);
      } else {
        downloadEsiForm7Excel(
          records,
          reportData?.companyInfo,
          reportData?.period || filters,
          reportData?.totals,
          reportData?.monthlySummaries,
          { format: 'xlsx' }
        );
        onExportSuccess(`✓ ESI Form 7 Half-Yearly Report Excel spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Fines (Form XXI) -> generates statutory Form XXI Excel / PDF
    if (isFinesReport) {
      if (format === 'PDF') {
        downloadFinesRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Fines (Form XXI) PDF downloaded successfully.`);
      } else {
        downloadFinesRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Fines (Form XXI) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Overtime (Form XXIII) -> generates statutory Form XXIII Excel / PDF
    if (isOvertimeReport) {
      if (format === 'PDF') {
        downloadOvertimeRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Register of Overtime (Form XXIII) PDF downloaded successfully.`);
      } else {
        downloadOvertimeRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Overtime (Form XXIII) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Overtime Register for Workers (Form IV) -> generates statutory Form IV Excel / CSV / PDF
    if (isOvertimeFormIVReport) {
      if (format === 'PDF') {
        downloadFormIVOvertimePdf(records, reportData?.contractor || reportData?.companyInfo, reportData?.establishment || reportData?.establishmentInfo, reportData?.period || filters, reportData?.totals);
        onExportSuccess(`✓ Overtime Register for Workers (Form IV) PDF downloaded successfully.`);
      } else {
        downloadFormIVOvertimeExcel(records, reportData?.contractor || reportData?.companyInfo, reportData?.establishment || reportData?.establishmentInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Overtime Register for Workers (Form IV) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Wages (Form XVII) -> generates statutory Form XVII Excel / PDF
    if (isWagesReport) {
      if (format === 'PDF') {
        downloadWagesRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, reportData?.pfSummary, reportData?.esiSummary, reportData?.establishmentInfo);
        onExportSuccess(`✓ Register of Wages (Form XVII) PDF downloaded successfully.`);
      } else {
        downloadWagesRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, reportData?.pfSummary, reportData?.esiSummary, reportData?.establishmentInfo, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Wages (Form XVII) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Workmen (Form XIII) -> generates statutory Form XIII Excel / PDF
    if (isWorkmanRegisterReport) {
      if (format === 'PDF') {
        downloadWorkmanRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, reportData?.establishmentInfo);
        onExportSuccess(`✓ Register of Workmen (Form XIII) PDF downloaded successfully.`);
      } else {
        downloadWorkmanRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, reportData?.establishmentInfo, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Workmen (Form XIII) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Bank Transfer Letter -> generates official Advice Letter PDF / Word / Excel
    if (isBankTransferLetterReport) {
      if (format === 'Word') {
        downloadBankTransferLetterWord(reportData?.letterInfo, records, reportData?.companyInfo);
        onExportSuccess(`✓ Bank Transfer Letter Word document (.doc) downloaded successfully.`);
      } else if (format === 'Excel') {
        downloadBankTransferLetterExcel(reportData?.letterInfo, records, reportData?.companyInfo);
        onExportSuccess(`✓ Bank Transfer Report Excel spreadsheet (.xlsx) downloaded successfully.`);
      } else {
        downloadBankTransferLetterPdf(reportData?.letterInfo, records, reportData?.companyInfo);
        onExportSuccess(`✓ Bank Transfer Letter PDF downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Bank Transfer Report -> generates exact CMS Excel / CSV / PDF matching reference
    if (isBankTransferReport) {
      if (format === 'CSV') {
        downloadBankTransferReportCsv(reportData?.remitterInfo, records, reportData?.period || filters);
        onExportSuccess(`✓ Bank Transfer Report CSV (.csv) downloaded successfully.`);
      } else if (format === 'PDF') {
        downloadBankTransferReportPdf(reportData?.remitterInfo, records, reportData?.period || filters, reportData?.totals, reportData?.companyInfo, { mode: 'download' });
        onExportSuccess(`✓ Bank Transfer Report PDF (.pdf) downloaded successfully.`);
      } else {
        downloadBankTransferReportExcel(reportData?.remitterInfo, records, reportData?.period || filters);
        onExportSuccess(`✓ Bank Transfer Report Excel (.xlsx) downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Leave - Form I (Delhi S&E Act) -> generates statutory Form I Excel / CSV / PDF
    if (isFormIReport) {
      const empData = reportData?.selectedEmployeeData || { rows: records, ...reportData?.companyInfo };
      if (format === 'PDF') {
        downloadFormILeavePdf(empData, reportData?.companyInfo, reportData?.period || filters, { mode: 'download' });
        onExportSuccess(`✓ Register of Leave - Form I (Delhi S&E Act) PDF downloaded successfully.`);
      } else {
        downloadFormILeaveExcel(empData, reportData?.companyInfo, reportData?.period || filters, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Leave - Form I ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for Register of Leave (Form XXV) -> generates statutory Excel / CSV / PDF
    if (isLeaveReport) {
      if (format === 'PDF') {
        downloadLeaveRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, { mode: 'download' });
        onExportSuccess(`✓ Register of Leave (Form XXV) PDF downloaded successfully.`);
      } else {
        downloadLeaveRegisterExcel(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
          format: format === 'CSV' ? 'csv' : 'xlsx'
        });
        onExportSuccess(`✓ Register of Leave (Form XXV) ${format} spreadsheet downloaded successfully.`);
      }
      onClose();
      return;
    }

    // Special handling for PF Form 5 -> generates exact official Form 5 PDF / Excel / CSV
    if (isPfForm5Report) {
      if (format === 'PDF') {
        downloadPfForm5Pdf(reportData, { mode: 'download' });
        onExportSuccess('✓ PF Form 5 PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadPfForm5Csv(reportData);
        onExportSuccess('✓ PF Form 5 CSV downloaded successfully.');
      } else {
        downloadPfForm5Excel(reportData);
        onExportSuccess('✓ PF Form 5 Excel spreadsheet downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for PF Form 6A -> generates exact official Form 6A PDF / Excel / CSV
    if (isPfForm6AReport) {
      if (format === 'PDF') {
        downloadPfForm6APdf(reportData, { mode: 'download' });
        onExportSuccess('✓ PF Form 6A (Revised) PDF downloaded successfully.');
      } else if (format === 'CSV') {
        downloadPfForm6ACsv(reportData);
        onExportSuccess('✓ PF Form 6A CSV downloaded successfully.');
      } else {
        downloadPfForm6AExcel(reportData);
        onExportSuccess('✓ PF Form 6A Excel spreadsheet downloaded successfully.');
      }
      onClose();
      return;
    }

    // Special handling for PF Form 10 -> PDF ONLY per explicit user specification
    if (isPfForm10Report) {
      downloadPfForm10Pdf(reportData, { mode: 'download' });
      onExportSuccess('✓ PF Form 10 PDF downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF Form 12A -> PDF ONLY per explicit user specification
    if (isPfForm12AReport) {
      downloadPfForm12APdf(reportData, { mode: 'download' });
      onExportSuccess('✓ PF Form 12A (Revised) PDF downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF ECR -> Excel ONLY per explicit user specification
    if (isPfEcrReport) {
      downloadPfEcrExcel(reportData);
      onExportSuccess('✓ PF ECR Excel workbook downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF Report Employee Wise -> Excel ONLY per explicit user specification
    if (isPfEmployeeWiseReport) {
      downloadPfEmployeeWiseExcel(reportData);
      onExportSuccess('✓ Employee Wise Monthly PF Report Excel workbook downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF Report Location Wise -> Excel ONLY per explicit user specification
    if (isPfLocationWiseReport) {
      downloadPfLocationWiseExcel(reportData);
      onExportSuccess('✓ Location Wise Monthly PF Report Excel workbook downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF Summry Report -> PDF ONLY per explicit user specification
    if (isPfSummaryReport) {
      downloadPfSummaryReportPdf(reportData, { mode: 'download' });
      onExportSuccess('✓ PF Summary Report PDF downloaded successfully.');
      onClose();
      return;
    }

    // Special handling for PF Form 2 (Revised) -> PDF ONLY per explicit user specification
    if (isPfForm2Report) {
      if (profileScope === 'all' && records.length > 1) {
        await downloadPfForm2Pdf(records, reportData?.companyInfo, { mode: 'download' });
        onExportSuccess(`✓ Downloaded all ${records.length} PF Form 2 (Revised) PDFs successfully.`);
      } else {
        await downloadPfForm2Pdf(targetEmp, reportData?.companyInfo, { mode: 'download' });
        onExportSuccess(`✓ PF Form 2 (Revised) PDF (${targetEmp?.name || 'Member'}) downloaded successfully.`);
      }
      onClose();
      return;
    }

    if (format === 'PDF') {
      generateReportPdf({
        reportType: selectedReport,
        title: reportMeta[selectedReport]?.title,
        period: reportData?.period || filters,
        companyInfo: reportData?.companyInfo,
        records: reportData?.records || [],
        totals: reportData?.totals,
        statutoryRules: reportData?.statutoryRules,
        mode: 'download',
      });
      onExportSuccess(`✓ ${reportName} PDF downloaded successfully.`);
    } else {
      generateReportExcel({
        reportType: selectedReport,
        title: reportMeta[selectedReport]?.title,
        period: reportData?.period || filters,
        companyInfo: reportData?.companyInfo,
        records: reportData?.records || [],
        totals: reportData?.totals,
        format: format === 'CSV' ? 'csv' : 'xlsx',
      });
      onExportSuccess(`✓ ${reportName} downloaded as ${format} successfully.`);
    }

    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Export Report</h3>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label>Report</label>
            <input type="text" value={reportName} readOnly />
          </div>

          {isProfileReport || isFnfReport || isForm16Report || isFormFReport || isSalaryCertReport || isIdCardReport || isEmploymentCardReport || isEmployeePayslipReport ? (
            <>
              <div className={styles.fieldGroup}>
                <label>Active Workman / Employee</label>
                <input
                  type="text"
                  value={targetEmp ? `${targetEmp.employeeName || targetEmp.workmanName || targetEmp.name} (${targetEmp.employeeCode || targetEmp.employeeId})` : 'All Filtered'}
                  readOnly
                />
              </div>

              {records.length > 1 && (
                <div className={styles.fieldGroup}>
                  <label>Export Scope</label>
                  <select value={profileScope} onChange={(e) => setProfileScope(e.target.value)}>
                    <option value="single">Active Selected Employee ({targetEmp?.employeeName || targetEmp?.workmanName || targetEmp?.name || 'Current'})</option>
                    <option value="all">All Filtered Employees ({records.length} {isEmployeePayslipReport ? 'Payslips' : 'Cards/Forms'})</option>
                  </select>
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label>Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  {isEmploymentCardReport ? (
                    <>
                      <option value="PDF">Official Employment Card Form XIV PDF (.pdf)</option>
                      <option value="Excel">Employment Card Form XIV Excel (.xlsx)</option>
                    </>
                  ) : isEmployeePayslipReport ? (
                    <option value="PDF">Official Employee Payslip PDF (.pdf)</option>
                  ) : (
                    <option value="PDF">{isIdCardReport ? 'Official Employee ID Card PDF (.pdf)' : isSalaryCertReport ? 'Official Salary Certificate PDF (.pdf)' : isFormFReport ? "Form 'F' Gratuity Nomination PDF (.pdf)" : isForm16Report ? 'Form 16 (Part B) Certificate PDF (.pdf)' : isFnfReport ? 'Full & Final Settlement Statement PDF (.pdf)' : 'Official Employee Profile PDF (.pdf)'}</option>
                  )}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className={styles.fieldGroup}>
                <label>Period / Accounting Year</label>
                <input type="text" value={reportData?.period?.accountingYear || reportData?.period?.monthLabel || filters.month || 'Current Year'} readOnly />
              </div>
              <div className={styles.fieldGroup}>
                <label>Company / Site</label>
                <input type="text" value={filters.company || 'All Companies'} readOnly />
              </div>
              <div className={styles.fieldGroup}>
                <label>Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  {isBonusReport ? (
                    <>
                      <option value="Excel">Statutory Form C Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form C Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form C CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isMusterRollReport ? (
                    <>
                      <option value="Excel">Statutory Form XVI Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XVI Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XVI CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isAdvancesReport ? (
                    <>
                      <option value="Excel">Statutory Form XXII Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XXII Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XXII CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isDeductionsDamageReport ? (
                    <>
                      <option value="Excel">Statutory Form XX Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XX Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XX CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isDamageFormIIReport ? (
                    <>
                      <option value="Excel">Statutory Form II Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form II Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form II CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isFinesFormIReport ? (
                    <>
                      <option value="Excel">Statutory Form I Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form I Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form I CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isSalarySheet1Report ? (
                    <>
                      <option value="Excel">Statutory Wage/Salary Register Excel (.xlsx)</option>
                      <option value="PDF">Statutory Wage/Salary Register Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Wage/Salary Register CSV (.csv)</option>
                    </>
                  ) : isSalarySheet2Report ? (
                    <>
                      <option value="Excel">Statutory Form IV Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form IV Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form IV CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isEsicForm5Report ? (
                    <>
                      <option value="PDF">Statutory Form 5 Return Printable PDF (.pdf)</option>
                      <option value="Excel">Statutory Form 5 Return Excel Spreadsheet (.xlsx)</option>
                      <option value="CSV">Statutory Form 5 Return CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isEsiForm7Report ? (
                    <>
                      <option value="Excel">Statutory Form 7 Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form 7 Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form 7 CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isFinesReport ? (
                    <>
                      <option value="Excel">Statutory Form XXI Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XXI Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XXI CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isOvertimeReport ? (
                    <>
                      <option value="Excel">Statutory Form XXIII Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XXIII Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XXIII CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isWagesReport ? (
                    <>
                      <option value="Excel">Statutory Form XVII Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XVII Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XVII CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isWorkmanRegisterReport ? (
                    <>
                      <option value="Excel">Statutory Form XIII Excel Spreadsheet (.xlsx)</option>
                      <option value="PDF">Statutory Form XIII Printable PDF (.pdf)</option>
                      <option value="CSV">Statutory Form XIII CSV Spreadsheet (.csv)</option>
                    </>
                  ) : isBankTransferLetterReport ? (
                    <>
                      <option value="PDF">Official Bank Transfer Advice Letter PDF (.pdf)</option>
                      <option value="Word">Official Bank Transfer Letter Word Document (.doc)</option>
                      <option value="Excel">Beneficiary Account Disbursement Excel (.xlsx)</option>
                    </>
                  ) : isBankTransferReport ? (
                    <>
                      <option value="Excel">Bank Transfer CMS Excel Spreadsheet (.xlsx)</option>
                      <option value="CSV">Bank Transfer CMS CSV Format (.csv)</option>
                      <option value="PDF">Bank Transfer Report Printable PDF (.pdf)</option>
                    </>
                  ) : isPfChallanReport ? (
                    <>
                      <option value="PDF">Statutory Provisional Challan PDF (.pdf)</option>
                      <option value="Excel">Statutory PF Challan & Subscribers Breakdown (.xlsx)</option>
                    </>
                  ) : isPfForm3AReport ? (
                    <>
                      <option value="PDF">Statutory Form 3A (Revised) PDF (.pdf)</option>
                      <option value="Excel">Statutory Form 3A Excel Workbook (.xlsx)</option>
                    </>
                  ) : isPfForm10Report ? (
                    <option value="PDF">Statutory Form 10 PDF Document (.pdf)</option>
                  ) : isPfForm12AReport ? (
                    <option value="PDF">Statutory Form 12A (Revised) PDF Document (.pdf)</option>
                  ) : isPfEcrReport ? (
                    <option value="Excel">Statutory EPFO ECR Excel Workbook (.xlsx)</option>
                  ) : isPfEmployeeWiseReport ? (
                    <option value="Excel">Employee Wise Monthly PF Report (.xlsx)</option>
                  ) : isPfLocationWiseReport ? (
                    <option value="Excel">Location Wise Monthly PF Report (.xlsx)</option>
                  ) : isPfSummaryReport ? (
                    <option value="PDF">Consolidated PF Summary Report PDF (.pdf)</option>
                  ) : isPfForm2Report ? (
                    <option value="PDF">Statutory PF Form 2 (Revised) PDF Document (.pdf)</option>
                  ) : (
                    <>
                      <option value="PDF">Printable PDF / Official Register (.pdf)</option>
                      <option value="Excel">Excel Spreadsheet (.xlsx)</option>
                      <option value="CSV">CSV Spreadsheet (.csv)</option>
                    </>
                  )}
                </select>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleExportSubmit}>
            <Download size={16} /> Download {format === 'PDF' ? 'PDF' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Main Reports Module Component
   ========================================================= */
function Reports() {
  const navigate = useNavigate();
  const { activeCompany, activeCompanyId } = useCompany();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || searchParams.get('type');
  const validReportTypes = [
    'payroll',
    'attendance',
    'billing',
    'employee',
    'employee-profile',
    'fnf-settlement',
    'fnf-settlement-payslip',
    'form-16',
    'form-16-part-b',
    'form-f-gratuity-nomination',
    'form-f',
    'salary-certificate',
    'salary-certificate-report',
    'employee-id-card',
    'employee-id-card-report',
    'bonus-register-form-c',
    'form-c-bonus-paid',
    'employment-card-form-xiv',
    'employment-card',
    'muster-roll-form-xvi',
    'form-xvi',
    'muster-roll',
    'register-advances-form-xxii',
    'form-xxii',
    'register-advances',
    'register-deduction-damage-form-xx',
    'form-xx',
    'register-deductions-damage',
    'register-fines-form-xxi',
    'form-xxi',
    'register-fines',
    'register-overtime-form-xxiii',
    'form-xxiii',
    'register-overtime',
    'overtime-register-salary',
    'overtime-register-form-iv',
    'overtime-register',
    'form-iv',
    'form-iv-overtime',
    'salary-overtime',
    'employee-payslip',
    'payslip',
    'register-deductions-damage-salary',
    'form-ii-damage-loss',
    'form-ii',
    'register-fines-employer-salary',
    'form-i-fines',
    'salary-sheet-format-1',
    'salary-sheet-1',
    'salary-sheet-format-2',
    'salary-sheet-2',
    'esi-form-7-opt1',
    'esi-form-7',
    'form-7-esi',
    'form-7',
    'esi-summary-employee-pdf',
    'esi-summary-employee-xls',
    'esi-summary-employee',
    'esi-summary-location',
    'esi-summary-location-pdf',
    'esi-summary-location-xls',
    'esic-form-3',
    'form-3-esic',
    'esic-returns-form-5',
    'esic-form-5',
    'form-5-esic',
    'form-11-accident-book',
    'accident-book-form-11',
    'epf-form-11',
    'epf-form-11-declaration',
    'pf-challan',
    'epf-challan',
    'pf-form-3a',
    'form-3a',
    'pf-form-5',
    'form-5-epf',
    'pf-form-6a',
    'form-6a-epf',
    'pf-form-10',
    'form-10-epf',
    'pf-form-12a',
    'form-12a-epf',
    'pf-ecr',
    'pf-ecr-excel',
    'pf-report-employee-wise',
    'pf-employee-wise',
    'pf-report-location-wise',
    'pf-location-wise',
    'pf-summary-report',
    'pf-summary',
    'pf-form-2-revised',
    'form-2-revised',
    'pf-form-2',
    'wages-register-form-xvii',
    'form-xvii',
    'wages-register',
    'workman-register-form-xiii',
    'form-xiii',
    'workman-register',
    'bank-transfer-letter',
    'bank-transfer-report',
    'leave',
    'form-xxv-register-of-leave',
    'register-of-leave-se-delhi',
    'inventory'
  ];
  const initialActive = tabParam && (validReportTypes.includes(tabParam) || Boolean(reportMeta[tabParam])) ? tabParam : null;

  const [activeReport, setActiveReport] = useState(initialActive);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explorerCategory, setExplorerCategory] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Dynamic API state
  const [overviewStats, setOverviewStats] = useState({
    stats: {
      availableReports: 5,
      generatedToday: 8,
      totalCompanies: 1,
      totalRecords: 1248
    },
    categories: {
      payroll: 4,
      attendance: 4,
      billing: 4,
      employee: 4,
      inventory: 12
    }
  });

  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    clients: [],
    departments: ['Security', 'Facility', 'Operations', 'Housekeeping', 'Administration', 'HR', 'Accounts'],
    sites: [],
    siteRecords: [],
    employees: []
  });

  const [reportData, setReportData] = useState(null);
  const [isReportGenerated, setIsReportGenerated] = useState(false);

  const [filters, setFilters] = useState({
    month: getCurrentMonthStr(),
    fromDate: '',
    toDate: '',
    company: 'All Companies',
    department: 'All Departments',
    site: 'All Sites',
    employee: 'All Employees',
    category: 'All Categories',
    itemType: 'All Types',
    status: 'All Statuses',
  });

  // Sync activeReport state with URL
  useEffect(() => {
    const currentTab = searchParams.get('tab') || searchParams.get('type');
    if (currentTab && (validReportTypes.includes(currentTab) || Boolean(reportMeta[currentTab]))) {
      setActiveReport((prev) => {
        if (prev !== currentTab) {
          setReportData(null);
          setIsReportGenerated(false);
        }
        return currentTab;
      });
    } else {
      setActiveReport(null);
      setReportData(null);
      setIsReportGenerated(false);
    }
  }, [searchParams]);

  // Fetch overview stats and filter options on mount or company change
  useEffect(() => {
    const loadInit = async () => {
      try {
        const [overviewRes, filterRes, masterSitesRes] = await Promise.all([
          reportService.getOverview(activeCompanyId).catch(() => null),
          reportService.getFilterOptions(activeCompanyId).catch(() => null),
          masterService.getMasters('sites', activeCompanyId).catch(() => [])
        ]);

        if (overviewRes?.stats) {
          setOverviewStats(overviewRes);
        }
        if (filterRes) {
          const directMasterSites = Array.isArray(masterSitesRes) ? masterSitesRes : [];
          const combinedSiteRecords = [
            ...(filterRes.siteRecords || []),
            ...directMasterSites.map((s) => ({
              name: (s.name || s.siteName || '').trim(),
              code: (s.code || '').trim(),
              clientId: (s.clientId || s.client || '').trim(),
              clientName: (s.clientName || '').trim(),
              city: (s.city || '').trim(),
              address: (s.address || '').trim(),
            }))
          ].filter((s) => s.name);

          // Deduplicate by site name + client name
          const uniqueSiteRecords = Array.from(
            new Map(combinedSiteRecords.map((item) => [`${item.name.toLowerCase()}_${item.clientName.toLowerCase()}`, item])).values()
          );

          setFilterOptions({
            companies: filterRes.companies || [],
            clients: filterRes.clients || [],
            departments: filterRes.departments || ['Security', 'Facility', 'Operations', 'Housekeeping', 'Administration', 'HR', 'Accounts'],
            sites: Array.from(new Set([...(filterRes.sites || []), ...uniqueSiteRecords.map((s) => s.name)])),
            siteRecords: uniqueSiteRecords,
            employees: filterRes.employees || []
          });
        }
      } catch (err) {
        console.warn('Init fetch report error:', err);
      }
    };
    loadInit();
  }, [activeCompanyId]);

  // Fetch active report data dynamically from MongoDB
  const fetchActiveReportData = useCallback(async () => {
    if (!activeReport) return;
    setIsLoading(true);

    try {
      let data = null;
      const targetCompId = activeCompanyId || '';
      if (activeReport === 'payroll') {
        data = await reportService.getPayrollReport(targetCompId, filters);
      } else if (activeReport === 'attendance') {
        data = await reportService.getAttendanceReport(targetCompId, filters);
      } else if (activeReport === 'billing') {
        data = await reportService.getBillingReport(targetCompId, filters);
      } else if (activeReport === 'employee' || activeReport === 'employee-profile') {
        data = await reportService.getEmployeeMasterReport(targetCompId, filters);
      } else if (activeReport === 'inventory') {
        data = await reportService.getInventoryReport(targetCompId, filters);
      } else if (activeReport === 'fnf-settlement' || activeReport === 'fnf-settlement-payslip') {
        data = await reportService.getFnfSettlementReport(targetCompId, filters);
      } else if (activeReport === 'form-16' || activeReport === 'form-16-part-b') {
        data = await reportService.getForm16Report(targetCompId, filters);
      } else if (activeReport === 'form-f-gratuity-nomination' || activeReport === 'form-f') {
        data = await reportService.getFormFGratuityReport(targetCompId, filters);
      } else if (activeReport === 'salary-certificate' || activeReport === 'salary-certificate-report') {
        data = await reportService.getSalaryCertificateReport(targetCompId, filters);
      } else if (activeReport === 'employee-id-card' || activeReport === 'employee-id-card-report') {
        data = await reportService.getEmployeeIdCardReport(targetCompId, filters);
      } else if (activeReport === 'bonus-register-form-c' || activeReport === 'form-c-bonus-paid') {
        data = await reportService.getBonusRegisterReport(targetCompId, filters);
      } else if (activeReport === 'employment-card-form-xiv' || activeReport === 'employment-card') {
        data = await reportService.getEmploymentCardReport(targetCompId, filters);
      } else if (activeReport === 'muster-roll-form-xvi' || activeReport === 'form-xvi' || activeReport === 'muster-roll') {
        data = await reportService.getMusterRollReport(targetCompId, filters);
      } else if (activeReport === 'register-advances-form-xxii' || activeReport === 'form-xxii' || activeReport === 'register-advances') {
        data = await reportService.getRegisterOfAdvancesReport(targetCompId, filters);
      } else if (activeReport === 'register-deduction-damage-form-xx' || activeReport === 'form-xx' || activeReport === 'register-deductions-damage') {
        data = await reportService.getDeductionsDamageReport(targetCompId, filters);
      } else if (activeReport === 'register-fines-form-xxi' || activeReport === 'form-xxi' || activeReport === 'register-fines') {
        data = await reportService.getRegisterOfFinesReport(targetCompId, filters);
      } else if (activeReport === 'register-overtime-form-xxiii' || activeReport === 'form-xxiii' || activeReport === 'register-overtime') {
        data = await reportService.getRegisterOfOvertimeReport(targetCompId, filters);
      } else if (
        activeReport === 'overtime-register-salary' ||
        activeReport === 'overtime-register-form-iv' ||
        activeReport === 'overtime-register' ||
        activeReport === 'form-iv' ||
        activeReport === 'form-iv-overtime' ||
        activeReport === 'salary-overtime'
      ) {
        data = await reportService.getFormIVOvertimeReport(targetCompId, filters);
      } else if (activeReport === 'employee-payslip' || activeReport === 'payslip') {
        data = await reportService.getEmployeePayslipReport(targetCompId, filters);
      } else if (
        activeReport === 'register-deductions-damage-salary' ||
        activeReport === 'form-ii-damage-loss' ||
        activeReport === 'form-ii'
      ) {
        data = await reportService.getFormIIDeductionsDamageReport(targetCompId, filters);
      } else if (
        activeReport === 'register-fines-employer-salary' ||
        activeReport === 'form-i-fines'
      ) {
        data = await reportService.getFormIFinesReport(targetCompId, filters);
      } else if (
        activeReport === 'salary-sheet-format-1' ||
        activeReport === 'salary-sheet-1'
      ) {
        data = await reportService.getSalarySheetFormat1Report(targetCompId, filters);
      } else if (
        activeReport === 'salary-sheet-format-2' ||
        activeReport === 'salary-sheet-2'
      ) {
        data = await reportService.getSalarySheetFormat2Report(targetCompId, filters);
      } else if (
        activeReport === 'esi-summary-employee-pdf' ||
        activeReport === 'esi-summary-employee-xls' ||
        activeReport === 'esi-summary-employee'
      ) {
        data = await reportService.getEsiSummaryEmployeeReport('', filters);
      } else if (
        activeReport === 'esi-summary-location' ||
        activeReport === 'esi-summary-location-pdf' ||
        activeReport === 'esi-summary-location-xls'
      ) {
        data = await reportService.getEsiSummaryLocationReport('', filters);
      } else if (activeReport === 'esic-form-3' || activeReport === 'form-3-esic') {
        data = await reportService.getEsicForm3Report('', filters);
      } else if (
        activeReport === 'esic-returns-form-5' ||
        activeReport === 'esic-form-5' ||
        activeReport === 'form-5-esic'
      ) {
        data = await reportService.getEsicForm5Report('', filters);
      } else if (
        activeReport === 'form-11-accident-book' ||
        activeReport === 'accident-book-form-11'
      ) {
        data = await reportService.getForm11AccidentBookReport('', filters);
      } else if (
        activeReport === 'epf-form-11' ||
        activeReport === 'epf-form-11-declaration'
      ) {
        data = await reportService.getEpfForm11Report('', filters);
      } else if (
        activeReport === 'pf-challan' ||
        activeReport === 'epf-challan'
      ) {
        data = await reportService.getPfChallanReport('', filters);
      } else if (
        activeReport === 'pf-form-3a' ||
        activeReport === 'form-3a'
      ) {
        data = await reportService.getPfForm3AReport('', filters);
      } else if (
        activeReport === 'pf-form-5' ||
        activeReport === 'form-5-epf'
      ) {
        data = await reportService.getPfForm5Report('', filters);
      } else if (
        activeReport === 'pf-form-6a' ||
        activeReport === 'form-6a-epf'
      ) {
        data = await reportService.getPfForm6AReport('', filters);
      } else if (
        activeReport === 'pf-form-10' ||
        activeReport === 'form-10-epf'
      ) {
        data = await reportService.getPfForm10Report('', filters);
      } else if (
        activeReport === 'pf-form-12a' ||
        activeReport === 'form-12a-epf'
      ) {
        data = await reportService.getPfForm12AReport('', filters);
      } else if (
        activeReport === 'pf-ecr-excel' ||
        activeReport === 'pf-ecr'
      ) {
        data = await reportService.getPfEcrReport('', filters);
      } else if (
        activeReport === 'pf-report-employee-wise' ||
        activeReport === 'pf-employee-wise'
      ) {
        data = await reportService.getPfReportEmployeeWise('', filters);
      } else if (
        activeReport === 'pf-report-location-wise' ||
        activeReport === 'pf-location-wise'
      ) {
        data = await reportService.getPfReportLocationWise('', filters);
      } else if (
        activeReport === 'pf-summary-report' ||
        activeReport === 'pf-summary'
      ) {
        data = await reportService.getPfSummaryReport('', filters);
      } else if (
        activeReport === 'pf-form-2-revised' ||
        activeReport === 'form-2-revised' ||
        activeReport === 'pf-form-2'
      ) {
        data = await reportService.getPfForm2Report('', filters);
      } else if (activeReport === 'esi-form-1') {
        data = await reportService.getEsiForm1Report('', filters);
      } else if (activeReport === 'esi-challan') {
        data = await reportService.getEsiChallanReport('', filters);
      } else if (activeReport === 'esi-form-7-opt2') {
        data = await reportService.getEsiForm7Option2Report('', filters);
      } else if (
        activeReport === 'esi-form-7-opt1' ||
        activeReport === 'esi-form-7' ||
        activeReport === 'form-7-esi' ||
        activeReport === 'form-7'
      ) {
        data = await reportService.getEsiForm7Report('', filters);
      } else if (activeReport === 'wages-register-form-xvii' || activeReport === 'form-xvii' || activeReport === 'wages-register') {
        data = await reportService.getWagesRegisterReport('', filters);
      } else if (activeReport === 'workman-register-form-xiii' || activeReport === 'form-xiii' || activeReport === 'workman-register') {
        data = await reportService.getWorkmanRegisterReport('', filters);
      } else if (activeReport === 'bank-transfer-letter') {
        data = await reportService.getBankTransferLetterReport('', filters);
      } else if (activeReport === 'bank-transfer-report') {
        data = await reportService.getBankTransferReport('', filters);
      } else if (activeReport === 'register-of-leave-se-delhi') {
        data = await reportService.getFormILeaveReport('', filters);
      } else if (activeReport === 'leave' || activeReport === 'form-xxv-register-of-leave') {
        data = await reportService.getRegisterOfLeaveReport('', filters);
      }

      if (data) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setToastMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, filters]);

  // Only update if report was already explicitly generated by the user
  useEffect(() => {
    if (activeReport && isReportGenerated) {
      fetchActiveReportData();
    }
  }, [
    filters.month,
    filters.company,
    filters.department,
    filters.employee,
    filters.category,
    filters.itemType,
    filters.status,
  ]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSelectReport = (reportId) => {
    setReportData(null);
    setIsReportGenerated(false);
    navigate(`/admin/reports?tab=${reportId}`);
    setSearchTerm('');
  };

  const handleBackToReports = () => {
    navigate('/admin/reports');
    setSearchTerm('');
    setReportData(null);
    setIsReportGenerated(false);
  };

  const handleGenerateReport = async () => {
    setIsReportGenerated(true);
    await fetchActiveReportData();
    setToastMessage('✓ Report dynamically generated from database.');
  };

  const handleResetFilters = () => {
    setFilters({
      month: getCurrentMonthStr(),
      fromDate: '',
      toDate: '',
      company: 'All Companies',
      department: 'All Departments',
      site: 'All Sites',
      employee: 'All Employees',
      category: 'All Categories',
      itemType: 'All Types',
      status: 'All Statuses',
    });
    setSearchTerm('');
    setReportData(null);
    setIsReportGenerated(false);
    setToastMessage('✓ Report filters reset.');
  };

  const handlePrintReport = async () => {
    if (!isReportGenerated || !reportData) {
      alert('Please click "Generate Report" before printing.');
      return;
    }
    // If the live report preview is mounted, print directly with exact preview layout/styling!
    const captureEl = document.querySelector('#report-preview-capture-area');
    if (captureEl) {
      setIsExportingPdf(true);
      await new Promise((r) => setTimeout(r, 120));

      const title = reportMeta[activeReport]?.title || 'Report';
      const cleanPeriodStr = (reportData?.period?.monthLabel || filters?.month || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cleanPeriodStr}.pdf`;

      const ok = await downloadElementAsPdf(captureEl, {
        filename,
        title,
        mode: 'print',
      });

      setIsExportingPdf(false);
      if (ok) return;
    }

    const records = reportData?.records || [];
    if (!records.length) {
      alert('No records available to print.');
      return;
    }
    if (activeReport === 'employee-profile') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.employeeId)) || records[0])
        : records[0];
      if (!targetEmp) {
        alert('No employee available to print profile.');
        return;
      }
      downloadEmployeeProfile(targetEmp, reportData?.companyInfo, { mode: 'print' });
      return;
    }
    if (activeReport === 'fnf-settlement' || activeReport === 'fnf-settlement-payslip') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.employeeId)) || records[0])
        : records[0];
      if (!targetEmp) {
        alert('No employee available to print Full & Final Settlement.');
        return;
      }
      downloadFnfSettlementPdf(targetEmp, reportData?.companyInfo, { mode: 'print' });
      return;
    }
    if (activeReport === 'form-16' || activeReport === 'form-16-part-b') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.employeeId)) || records[0])
        : records;
      if (!targetEmp) {
        alert('No employee available to print Form 16.');
        return;
      }
      downloadForm16Pdf(targetEmp, reportData?.companyInfo, reportData?.period, {
        mode: 'print',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      });
      return;
    }
    if (activeReport === 'form-f-gratuity-nomination' || activeReport === 'form-f') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.employeeId)) || records[0])
        : records;
      if (!targetEmp || (Array.isArray(targetEmp) && targetEmp.length === 0)) {
        alert('No employee available to print Form F.');
        return;
      }
      downloadFormFPdf(targetEmp, reportData?.companyInfo, {
        mode: 'print',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      });
      return;
    }
    if (activeReport === 'salary-certificate' || activeReport === 'salary-certificate-report') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.employeeId)) || records[0])
        : records;
      if (!targetEmp || (Array.isArray(targetEmp) && targetEmp.length === 0)) {
        alert('No employee available to print Salary Certificate.');
        return;
      }
      downloadSalaryCertificatePdf(targetEmp, reportData?.companyInfo, {
        mode: 'print',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      });
      return;
    }
    if (activeReport === 'employee-id-card' || activeReport === 'employee-id-card-report') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.employeeId)) || records[0])
        : records;
      if (!targetEmp || (Array.isArray(targetEmp) && targetEmp.length === 0)) {
        alert('No employee available to print ID Card.');
        return;
      }
      const effectiveCompany = {
        ...(activeCompany || {}),
        ...(reportData?.companyInfo || {}),
        name: reportData?.companyInfo?.name || reportData?.companyInfo?.companyName || activeCompany?.name || activeCompany?.companyName,
        address: reportData?.companyInfo?.address || activeCompany?.address || activeCompany?.registeredAddress,
        phone: reportData?.companyInfo?.phone || activeCompany?.phone || activeCompany?.contactNumber,
        email: reportData?.companyInfo?.email || activeCompany?.email,
        logo: reportData?.companyInfo?.logo || activeCompany?.logo || activeCompany?.logoUrl,
      };
      downloadEmployeeIdCardPdf(targetEmp, effectiveCompany, {
        mode: 'print',
        companyName: filters?.company && filters.company !== 'All Companies' ? filters.company : undefined,
      });
      return;
    }
    if (activeReport === 'bonus-register-form-c' || activeReport === 'form-c-bonus-paid') {
      downloadBonusRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'employment-card-form-xiv' || activeReport === 'employment-card') {
      const targetEmp = filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.name === filters.employee || r.workmanName === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.name) || filters.employee.includes(r.workmanName) || filters.employee.includes(r.employeeId)) || records[0])
        : records;
      if (!targetEmp || (Array.isArray(targetEmp) && targetEmp.length === 0)) {
        alert('No workman available to print Employment Card.');
        return;
      }
      downloadEmploymentCardPdf(targetEmp, reportData?.companyInfo, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'muster-roll-form-xvi' || activeReport === 'form-xvi' || activeReport === 'muster-roll') {
      downloadMusterRollPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'register-advances-form-xxii' || activeReport === 'form-xxii' || activeReport === 'register-advances') {
      downloadAdvancesRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'register-deduction-damage-form-xx' || activeReport === 'form-xx' || activeReport === 'register-deductions-damage') {
      downloadDeductionsDamagePdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (
      activeReport === 'register-deductions-damage-salary' ||
      activeReport === 'form-ii-damage-loss' ||
      activeReport === 'form-ii'
    ) {
      downloadFormIIDeductionsDamagePdf(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (
      activeReport === 'register-fines-employer-salary' ||
      activeReport === 'form-i-fines'
    ) {
      downloadFormIFinesPdf(records, reportData?.employer || filters.company, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (
      activeReport === 'salary-sheet-format-1' ||
      activeReport === 'salary-sheet-1'
    ) {
      downloadSalarySheetFormat1Pdf(
        records,
        reportData?.companyInfo,
        reportData?.period || filters,
        reportData?.totals,
        reportData?.pfSummary,
        reportData?.esiSummary,
        reportData?.ptSummary,
        reportData?.earningSummary,
        reportData?.deductionSummary,
        { mode: 'print', clientInfo: reportData?.clientInfo, filters }
      );
      return;
    }
    if (
      activeReport === 'salary-sheet-format-2' ||
      activeReport === 'salary-sheet-2'
    ) {
      downloadSalarySheetFormat2Pdf(
        records,
        reportData?.companyInfo,
        reportData?.period || filters,
        reportData?.totals,
        reportData?.pfSummary,
        reportData?.esiSummary,
        reportData?.lwfSummary,
        { mode: 'print', clientInfo: reportData?.clientInfo, filters }
      );
      return;
    }
    if (
      activeReport === 'esi-summary-employee-pdf' ||
      activeReport === 'esi-summary-employee-xls' ||
      activeReport === 'esi-summary-employee'
    ) {
      downloadEsiSummaryEmployeePdf(reportData, { mode: 'print' });
      return;
    }
    if (
      activeReport === 'esi-summary-location' ||
      activeReport === 'esi-summary-location-pdf' ||
      activeReport === 'esi-summary-location-xls'
    ) {
      downloadEsiSummaryLocationPdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'esic-form-3' || activeReport === 'form-3-esic') {
      await downloadEsicForm3Pdf(reportData, { mode: 'print' });
      return;
    }
    if (
      activeReport === 'esic-returns-form-5' ||
      activeReport === 'esic-form-5' ||
      activeReport === 'form-5-esic'
    ) {
      await downloadEsicForm5Pdf(reportData, { mode: 'print' });
      return;
    }
    if (
      activeReport === 'form-11-accident-book' ||
      activeReport === 'accident-book-form-11'
    ) {
      downloadForm11AccidentBookPdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'epf-form-11' || activeReport === 'epf-form-11-declaration') {
      downloadEpfForm11Pdf(records, reportData?.companyInfo, { mode: 'print' });
      return;
    }
    if (activeReport === 'pf-challan' || activeReport === 'epf-challan') {
      downloadPfChallanPdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'pf-form-3a' || activeReport === 'form-3a') {
      downloadPfForm3APdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'pf-form-10' || activeReport === 'form-10-epf') {
      downloadPfForm10Pdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'pf-form-12a' || activeReport === 'form-12a-epf') {
      downloadPfForm12APdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'esi-form-1') {
      downloadEsiForm1Pdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'esi-challan') {
      downloadEsiChallanPdf(reportData, { mode: 'print' });
      return;
    }
    if (activeReport === 'esi-form-7-opt2') {
      downloadEsiForm7Option2Pdf(
        records,
        reportData?.companyInfo,
        reportData?.period || filters,
        reportData?.totals,
        reportData?.monthlySummaries,
        { mode: 'print' }
      );
      return;
    }
    if (
      activeReport === 'esi-form-7-opt1' ||
      activeReport === 'esi-form-7' ||
      activeReport === 'form-7-esi' ||
      activeReport === 'form-7'
    ) {
      downloadEsiForm7Pdf(
        records,
        reportData?.companyInfo,
        reportData?.period || filters,
        reportData?.totals,
        reportData?.monthlySummaries,
        { mode: 'print' }
      );
      return;
    }
    if (activeReport === 'register-fines-form-xxi' || activeReport === 'form-xxi' || activeReport === 'register-fines') {
      downloadFinesRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'register-overtime-form-xxiii' || activeReport === 'form-xxiii' || activeReport === 'register-overtime') {
      downloadOvertimeRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (
      activeReport === 'overtime-register-salary' ||
      activeReport === 'overtime-register-form-iv' ||
      activeReport === 'overtime-register' ||
      activeReport === 'form-iv' ||
      activeReport === 'form-iv-overtime' ||
      activeReport === 'salary-overtime'
    ) {
      downloadFormIVOvertimePdf(records, reportData?.contractor || reportData?.companyInfo, reportData?.establishment || reportData?.establishmentInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'employee-payslip' || activeReport === 'payslip') {
      const activeSlip = (filters?.employee && filters.employee !== 'All Employees'
        ? (records.find(r => r.employeeName === filters.employee || r.name === filters.employee || r.employeeId === filters.employee || filters.employee.includes(r.employeeName || '') || filters.employee.includes(r.employeeId || '')) || records[0])
        : records[0]) || reportData?.selectedEmployeeData;
      downloadEmployeePayslipPdf(activeSlip, reportData?.companyInfo, reportData?.period || filters, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'wages-register-form-xvii' || activeReport === 'form-xvii' || activeReport === 'wages-register') {
      downloadWagesRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, reportData?.pfSummary, reportData?.esiSummary, reportData?.establishmentInfo, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'workman-register-form-xiii' || activeReport === 'form-xiii' || activeReport === 'workman-register') {
      downloadWorkmanRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, reportData?.establishmentInfo, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'bank-transfer-letter') {
      downloadBankTransferLetterPdf(reportData?.letterInfo, records, reportData?.companyInfo, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'bank-transfer-report') {
      downloadBankTransferReportPdf(reportData?.remitterInfo, records, reportData?.period || filters, reportData?.totals, reportData?.companyInfo, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'register-of-leave-se-delhi') {
      const empData = reportData?.selectedEmployeeData || { rows: records, ...reportData?.companyInfo };
      downloadFormILeavePdf(empData, reportData?.companyInfo, reportData?.period || filters, {
        mode: 'print',
      });
      return;
    }
    if (activeReport === 'leave' || activeReport === 'form-xxv-register-of-leave') {
      downloadLeaveRegisterPdf(records, reportData?.companyInfo, reportData?.period || filters, reportData?.totals, {
        mode: 'print',
      });
      return;
    }
    const printRecords = searchTerm
      ? records.filter((r) => JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase()))
      : records;

    generateReportPdf({
      reportType: activeReport,
      title: reportMeta[activeReport]?.title,
      period: reportData?.period || filters,
      companyInfo: reportData?.companyInfo,
      records: printRecords,
      totals: reportData?.totals,
      statutoryRules: reportData?.statutoryRules,
      mode: 'print',
    });
  };

  const getCategoryCount = (catId) => {
    if (catId === 'all') return ALL_REPORTS_CATALOG.length;
    return ALL_REPORTS_CATALOG.filter((r) => r.category === catId).length;
  };

  const filteredCatalog = useMemo(() => {
    return ALL_REPORTS_CATALOG.filter((item) => {
      const matchesCategory = explorerCategory === 'all' || item.category === explorerCategory;
      const q = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [explorerCategory, catalogSearch]);

  const activeCategoryObj = REPORT_CATEGORIES.find((c) => c.id === explorerCategory);

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toastMessage && (
          <Toast
            message={toastMessage}
            type="success"
            onClose={() => setToastMessage(null)}
          />
        )}

        {!activeReport ? (
          <>
            {/* Explorer Breadcrumb */}
            <div className={styles.breadcrumb}>
              <span
                onClick={() => navigate('/admin/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                Reports
              </span>
              <span>/</span>
              <strong>{activeCategoryObj?.label || 'All Reports'}</strong>
            </div>

            {/* Explorer Page Header */}
            <header className={styles.pageHeader} style={{ marginBottom: '16px' }}>
              <div className={styles.pageHeaderContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BarChart3 size={24} color="#2563eb" />
                  <h1 style={{ margin: 0, fontSize: '22px' }}>Reports</h1>
                </div>
                <p className={styles.pageDescription} style={{ marginTop: '6px' }}>
                  Generate, analyze and export dynamic reports related to attendance, payroll, billing, employee master, PF, ESI and labour laws compliance.
                </p>
              </div>
            </header>

            {/* 2-Column Reports Explorer (Matching Reference Image) */}
            <div className={styles.reportsExplorerLayout}>
              {/* Left Sidebar Filter Panel */}
              <aside className={styles.explorerSidebar}>
                <div className={styles.explorerSearchWrap}>
                  <input
                    type="text"
                    className={styles.explorerSearchInput}
                    placeholder="Search Reports"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                  {catalogSearch ? (
                    <button
                      type="button"
                      className={styles.explorerClearBtn}
                      onClick={() => setCatalogSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <span style={{ position: 'absolute', right: 10, color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
                      <Search size={14} />
                    </span>
                  )}
                </div>

                <ul className={styles.categoryList}>
                  {REPORT_CATEGORIES.map((cat) => {
                    const count = getCategoryCount(cat.id);
                    const isActive = explorerCategory === cat.id;
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                          onClick={() => setExplorerCategory(cat.id)}
                        >
                          <span className={isActive ? styles.sidebarActiveDot : styles.sidebarDot} />
                          <span>{cat.label}</span>
                          <span className={styles.categoryBadge}>{count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              {/* Right Grid of Report Cards */}
              <main style={{ minWidth: 0 }}>
                {filteredCatalog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No reports found matching "{catalogSearch}".</p>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => { setCatalogSearch(''); setExplorerCategory('all'); }}
                      style={{ marginTop: '12px', fontSize: '13px' }}
                    >
                      Show All Reports
                    </button>
                  </div>
                ) : (
                  <div className={styles.explorerCardsGrid}>
                    {filteredCatalog.map((item) => (
                      <div key={item.id} className={styles.referenceReportCard}>
                        <div>
                          <div className={styles.cardFormatIcons}>
                            {item.formats.includes('excel') && (
                              <span title="Excel Spreadsheet (.xlsx)" className={styles.iconExcel} style={{ display: 'inline-flex' }}>
                                <FileSpreadsheet size={16} />
                              </span>
                            )}
                            {item.formats.includes('pdf') && (
                              <span title="Printable PDF (.pdf)" className={styles.iconPdf} style={{ display: 'inline-flex' }}>
                                <FileText size={16} />
                              </span>
                            )}
                            {item.formats.includes('word') && (
                              <span title="Word Document (.docx / .doc)" style={{ display: 'inline-flex', color: '#2563eb' }}>
                                <FileText size={16} />
                              </span>
                            )}
                          </div>
                          <div className={styles.cardBody}>
                            <h4 className={styles.cardTitle}>{item.title}</h4>
                            <p className={styles.cardDesc}>{item.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.cardOpenBtn}
                          onClick={() => handleSelectReport(item.targetTab)}
                        >
                          Open <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </main>
            </div>
          </>
        ) : (
          <>
            {/* Active Report Header & Navigation */}
            <div className={styles.breadcrumb}>
              <span
                onClick={() => navigate('/admin/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                Dashboard
              </span>
              <span>/</span>
              <span
                onClick={handleBackToReports}
                style={{
                  cursor: 'pointer',
                  color: 'var(--primary-color, #2563eb)',
                  fontWeight: 500
                }}
              >
                Reports
              </span>
              <span>/</span>
              <strong>{reportMeta[activeReport]?.title}</strong>
            </div>

            <header className={styles.pageHeader}>
              <div className={styles.pageHeaderContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleBackToReports}
                    className={styles.secondaryButton}
                    style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={15} /> Back to Reports
                  </button>
                  <h1 style={{ margin: 0, fontSize: '22px' }}>{reportMeta[activeReport]?.title}</h1>
                </div>
                <p className={styles.pageDescription} style={{ marginTop: '6px' }}>{reportMeta[activeReport]?.description}</p>
              </div>
            </header>

            <ReportBody
              activeReport={activeReport}
              searchTerm={searchTerm}
              filters={filters}
              filterOptions={filterOptions}
              setFilter={(key, value) => {
                if (key === 'activeReport') {
                  if (value) navigate(`/admin/reports?tab=${value}`);
                  else handleBackToReports();
                } else if (key === 'searchTerm') {
                  setSearchTerm(value);
                } else {
                  updateFilter(key, value);
                }
              }}
              reportData={reportData}
              isLoading={isLoading}
              onGenerateReport={handleGenerateReport}
              onResetFilters={handleResetFilters}
              isExporting={isExportingPdf}
              activeCompany={activeCompany}
              isReportGenerated={isReportGenerated}
            />
          </>
        )}

        <ExportReportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          selectedReport={activeReport}
          reportData={reportData}
          filters={filters}
          onExportSuccess={(msg) => setToastMessage(msg)}
          onStartExport={() => setIsExportingPdf(true)}
          onEndExport={() => setIsExportingPdf(false)}
        />
      </div>
    </AdminLayout>
  );
}

export default Reports;
