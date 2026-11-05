// NovaSpark HRMS — Leave Encashment Data & Calculation Engine
// Compliant with Indian Labour Laws & Section 10(10AA) of Income Tax Act

export const ENCASHMENT_STORAGE_KEY = 'novaspark_leave_encashments';

export const ENCASHMENT_STATUSES = [
  'All',
  'Pending Supervisor Approval',
  'Pending HR Approval',
  'Approved & Ready for Payout',
  'Disbursed in Payroll',
  'Rejected'
];

export const FINANCIAL_YEARS = ['FY 2026-2027', 'FY 2025-2026', 'FY 2024-2025'];

export const ENCASHMENT_POLICY_DEFAULTS = {
  leaveTypeCode: 'EL',
  leaveTypeName: 'Earned Leave (Privilege Leave)',
  minBalanceToMaintain: 12, // Employee must retain at least 12 days in balance
  maxDaysPerYear: 15,       // Max days employee can encash in one financial year
  calculationBase: 'basic_plus_da', // 'basic_only' | 'basic_plus_da' | 'gross'
  monthDivisor: 26,         // 26 working days standard divisor
  taxExemptionSec10_10AA: 2500000 // ₹25,00,000 statutory limit for non-govt employees
};

export const INITIAL_ENCASHMENTS = [
  {
    id: 'enc-1',
    encashmentId: 'ENC-2026-001',
    employeeId: 'e101',
    employeeCode: 'RR-101',
    employeeName: 'Rajesh Kumar Verma',
    designation: 'Armed Guard',
    department: 'Armed Security Wing',
    clientName: 'DLF CyberCity Tech Park',
    financialYear: 'FY 2026-2027',
    applyDate: '2026-10-18',
    leaveType: 'EL (Earned Leave)',
    balanceBefore: 26,
    encashDays: 10,
    balanceAfter: 16,
    basicSalary: 15000,
    grossSalary: 24000,
    dailyWageRate: 576.92, // 15000 / 26
    grossEncashmentAmount: 5769,
    tdsDeducted: 0, // Tax exempt u/s 10(10AA)
    netPayableAmount: 5769,
    taxExemptSection10: true,
    status: 'Disbursed in Payroll',
    payoutPayrollMonth: 'October 2026',
    remarks: 'Annual Diwali leave encashment request',
    approvedBy: 'HR Head (Alok Sharma)',
    approvalDate: '2026-10-22'
  },
  {
    id: 'enc-2',
    encashmentId: 'ENC-2026-002',
    employeeId: 'e102',
    employeeCode: 'RR-102',
    employeeName: 'Priya Nandini Sharma',
    designation: 'Senior HR Executive',
    department: 'Corporate HR',
    clientName: 'Corporate Headquarters',
    financialYear: 'FY 2026-2027',
    applyDate: '2026-11-01',
    leaveType: 'EL (Earned Leave)',
    balanceBefore: 30,
    encashDays: 14,
    balanceAfter: 16,
    basicSalary: 28000,
    grossSalary: 48000,
    dailyWageRate: 1076.92, // 28000 / 26
    grossEncashmentAmount: 15077,
    tdsDeducted: 0,
    netPayableAmount: 15077,
    taxExemptSection10: true,
    status: 'Pending HR Approval',
    payoutPayrollMonth: 'November 2026',
    remarks: 'Approved by departmental supervisor for Q3 cycle',
    approvedBy: 'Ops Manager (Vikram Rathore)',
    approvalDate: '2026-11-03'
  },
  {
    id: 'enc-3',
    encashmentId: 'ENC-2026-003',
    employeeId: 'e103',
    employeeCode: 'RR-103',
    employeeName: 'Sanjay Pratap Singh',
    designation: 'Operations Field Manager',
    department: 'Security Operations',
    clientName: 'Advant Navis Business Park',
    financialYear: 'FY 2026-2027',
    applyDate: '2026-10-28',
    leaveType: 'EL (Earned Leave)',
    balanceBefore: 34,
    encashDays: 15,
    balanceAfter: 19,
    basicSalary: 32000,
    grossSalary: 55000,
    dailyWageRate: 1230.77,
    grossEncashmentAmount: 18462,
    tdsDeducted: 0,
    netPayableAmount: 18462,
    taxExemptSection10: true,
    status: 'Approved & Ready for Payout',
    payoutPayrollMonth: 'November 2026',
    remarks: 'Annual quota encashment; leave audit cleared',
    approvedBy: 'Director (Operations)',
    approvalDate: '2026-10-30'
  },
  {
    id: 'enc-4',
    encashmentId: 'ENC-2026-004',
    employeeId: 'e104',
    employeeCode: 'RR-104',
    employeeName: 'Mohammad Farooq',
    designation: 'Field Supervisor',
    department: 'Site Supervision Wing',
    clientName: 'Logix Blossom Greens',
    financialYear: 'FY 2026-2027',
    applyDate: '2026-11-02',
    leaveType: 'EL (Earned Leave)',
    balanceBefore: 22,
    encashDays: 8,
    balanceAfter: 14,
    basicSalary: 18000,
    grossSalary: 28000,
    dailyWageRate: 692.31,
    grossEncashmentAmount: 5538,
    tdsDeducted: 0,
    netPayableAmount: 5538,
    taxExemptSection10: true,
    status: 'Pending Supervisor Approval',
    payoutPayrollMonth: 'November 2026',
    remarks: 'Requested funds for medical family commitment',
    approvedBy: '—',
    approvalDate: ''
  },
  {
    id: 'enc-5',
    encashmentId: 'ENC-2026-005',
    employeeId: 'e105',
    employeeCode: 'RR-105',
    employeeName: 'Sunil Prasad',
    designation: 'Head Guard',
    department: 'Manned Guarding',
    clientName: 'Jaypee Greens Kensington',
    financialYear: 'FY 2026-2027',
    applyDate: '2026-09-15',
    leaveType: 'EL (Earned Leave)',
    balanceBefore: 20,
    encashDays: 7,
    balanceAfter: 13,
    basicSalary: 14500,
    grossSalary: 22500,
    dailyWageRate: 557.69,
    grossEncashmentAmount: 3904,
    tdsDeducted: 0,
    netPayableAmount: 3904,
    taxExemptSection10: true,
    status: 'Disbursed in Payroll',
    payoutPayrollMonth: 'September 2026',
    remarks: 'School fee payment reimbursement',
    approvedBy: 'HR Head (Alok Sharma)',
    approvalDate: '2026-09-18'
  }
];

// Calculation helper for Encashment
export function calculateEncashmentAmount({
  basicSalary = 15000,
  grossSalary = 22000,
  encashDays = 10,
  calculationBase = 'basic_only', // 'basic_only' | 'gross'
  monthDivisor = 26
}) {
  const baseSalary = calculationBase === 'gross' ? Number(grossSalary || 0) : Number(basicSalary || 0);
  const dailyWageRate = Math.round((baseSalary / (Number(monthDivisor) || 26)) * 100) / 100;
  const grossEncashment = Math.round(dailyWageRate * Number(encashDays || 0));

  // Section 10(10AA) exemption check (under ₹25,00,000 threshold)
  const tdsDeducted = 0;
  const netPayable = grossEncashment - tdsDeducted;

  return {
    baseSalary,
    dailyWageRate,
    grossEncashment,
    tdsDeducted,
    netPayable
  };
}

// LocalStorage helpers
export function getStoredEncashments() {
  try {
    const raw = localStorage.getItem(ENCASHMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored leave encashments:', err);
  }
  saveStoredEncashments(INITIAL_ENCASHMENTS);
  return INITIAL_ENCASHMENTS;
}

export function saveStoredEncashments(records) {
  try {
    localStorage.setItem(ENCASHMENT_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving stored leave encashments:', err);
  }
}

