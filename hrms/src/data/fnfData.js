// NovaSpark HRMS — Full and Final Settlement (FnF) Data & Calculations
// Manages employee separation calculations, clearances, and settlement statements

export const SEPARATION_REASONS = [
  'Resignation (Personal Reasons)',
  'Resignation (Better Career Opportunity)',
  'Resignation (Health / Medical Issues)',
  'Relocation / Family Relocation',
  'Contract Expiry / Non-Renewal',
  'Mutual Separation Agreement',
  'Superannuation / Retirement',
  'Termination (Performance / Operational)',
  'Termination (Disciplinary / Conduct)',
  'Absconding / Desertion'
];

export const SETTLEMENT_STATUSES = [
  'All',
  'Pending Clearance',
  'Calculation Ready',
  'Approved',
  'Settled'
];

export const INITIAL_FNF_RECORDS = [
  {
    id: 'fnf-001',
    settlementId: 'FNF-2026-001',
    employeeId: 'e003',
    employeeCode: 'RR-304',
    employeeName: 'Vikramaditya Rathore',
    avatar: null,
    designation: 'Armed Guard / Gunman',
    client: 'DLF CyberCity Tech Park',
    site: 'Tower 3 Cash Transit Desk',
    department: 'Security Operations',
    dateOfJoining: '2023-04-12',
    resignationDate: '2026-09-30',
    lastWorkingDay: '2026-10-31',
    separationReason: 'Resignation (Personal Reasons)',
    monthlyGrossSalary: 25000,
    perDayWage: 961.54,
    unpaidWorkDays: 18,
    unpaidSalary: 17308,
    leaveBalanceDays: 12,
    leaveEncashment: 11538,
    tenureYears: 3.5,
    gratuityAmount: 0,
    bonusOrArrears: 2500,
    totalEarnings: 31346,
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 30,
    noticePayRecovery: 0,
    assetDamageRecovery: 0,
    loanAdvanceDeduction: 3000,
    totalDeductions: 3000,
    netSettlementAmount: 28346,
    assetClearanceStatus: 'Cleared',
    managerClearanceStatus: 'Cleared',
    financeClearanceStatus: 'Approved',
    settlementStatus: 'Approved',
    paymentMode: 'Bank Transfer (NEFT)',
    settlementDate: '2026-11-02',
    remarks: 'Gun license verification, guard gear, and daily post registers checked. Advance of ₹3,000 adjusted.'
  },
  {
    id: 'fnf-002',
    settlementId: 'FNF-2026-002',
    employeeId: 'e002',
    employeeCode: 'RR-219',
    employeeName: 'Sanjay Pratap Singh',
    avatar: null,
    designation: 'Field Supervisor',
    client: 'Advant Navis Business Park',
    site: 'Sector 142 Campus',
    department: 'Field Supervision',
    dateOfJoining: '2020-02-10',
    resignationDate: '2026-09-15',
    lastWorkingDay: '2026-10-15',
    separationReason: 'Resignation (Better Career Opportunity)',
    monthlyGrossSalary: 32000,
    perDayWage: 1230.77,
    unpaidWorkDays: 15,
    unpaidSalary: 18462,
    leaveBalanceDays: 12,
    leaveEncashment: 14769,
    tenureYears: 6.7,
    gratuityAmount: 55385,
    bonusOrArrears: 0,
    totalEarnings: 88616,
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 30,
    noticePayRecovery: 0,
    assetDamageRecovery: 0,
    loanAdvanceDeduction: 0,
    totalDeductions: 0,
    netSettlementAmount: 88616,
    assetClearanceStatus: 'Cleared',
    managerClearanceStatus: 'Cleared',
    financeClearanceStatus: 'Approved',
    settlementStatus: 'Settled',
    paymentMode: 'Bank Transfer (RTGS)',
    settlementDate: '2026-10-20',
    remarks: 'Completed 6+ years. Full gratuity credited with no-dues certificate issued.'
  },
  {
    id: 'fnf-003',
    settlementId: 'FNF-2026-003',
    employeeId: 'e005',
    employeeCode: 'RR-512',
    employeeName: 'Mahesh Chandra',
    avatar: null,
    designation: 'Security Guard',
    client: 'DLF CyberCity Tech Park',
    site: 'Main Entrance Gate',
    department: 'Physical Security',
    dateOfJoining: '2024-06-01',
    resignationDate: '2026-10-10',
    lastWorkingDay: '2026-10-25',
    separationReason: 'Relocation / Family Relocation',
    monthlyGrossSalary: 19000,
    perDayWage: 730.77,
    unpaidWorkDays: 18,
    unpaidSalary: 13154,
    leaveBalanceDays: 5,
    leaveEncashment: 3654,
    tenureYears: 2.3,
    gratuityAmount: 0,
    bonusOrArrears: 0,
    totalEarnings: 16808,
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 15,
    noticePayRecovery: 3654,
    assetDamageRecovery: 1200,
    loanAdvanceDeduction: 2000,
    totalDeductions: 6854,
    netSettlementAmount: 9954,
    assetClearanceStatus: 'Pending Return',
    managerClearanceStatus: 'Cleared',
    financeClearanceStatus: 'Pending Review',
    settlementStatus: 'Pending Clearance',
    paymentMode: 'Pending',
    settlementDate: '',
    remarks: '1 Security cap missing and 5 days notice shortfall recovery applied. Awaiting store clearance.'
  },
  {
    id: 'fnf-004',
    settlementId: 'FNF-2026-004',
    employeeId: 'e008',
    employeeCode: 'RR-408',
    employeeName: 'Pooja Sharma',
    avatar: null,
    designation: 'Housekeeping Attendant',
    client: 'Logix Cyber Park',
    site: 'Tower B Facility Area',
    department: 'Facility Management',
    dateOfJoining: '2025-01-15',
    resignationDate: '2026-10-18',
    lastWorkingDay: '2026-10-31',
    separationReason: 'Mutual Separation Agreement',
    monthlyGrossSalary: 16500,
    perDayWage: 634.62,
    unpaidWorkDays: 26,
    unpaidSalary: 16500,
    leaveBalanceDays: 5,
    leaveEncashment: 3173,
    tenureYears: 1.8,
    gratuityAmount: 0,
    bonusOrArrears: 0,
    totalEarnings: 19673,
    noticePeriodRequiredDays: 15,
    noticePeriodServedDays: 15,
    noticePayRecovery: 0,
    assetDamageRecovery: 0,
    loanAdvanceDeduction: 0,
    totalDeductions: 0,
    netSettlementAmount: 19673,
    assetClearanceStatus: 'Cleared',
    managerClearanceStatus: 'Cleared',
    financeClearanceStatus: 'Approved',
    settlementStatus: 'Calculation Ready',
    paymentMode: 'Bank Transfer (NEFT)',
    settlementDate: '',
    remarks: 'Mutual separation on contract completion. All uniform and badge assets returned in good condition.'
  }
];

const STORAGE_KEY = 'novaspark_fnf_records';

export function getStoredFnF() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading FnF storage:', err);
  }
  // Initialize with initial records if empty
  saveStoredFnF(INITIAL_FNF_RECORDS);
  return INITIAL_FNF_RECORDS;
}

export function saveStoredFnF(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving FnF storage:', err);
  }
}

export function calculateFnFMetrics(records = []) {
  const totalSettlements = records.length;
  const pendingClearance = records.filter(
    (r) => r.settlementStatus === 'Pending Clearance' || r.assetClearanceStatus === 'Pending Return'
  ).length;
  const approvedReady = records.filter(
    (r) => r.settlementStatus === 'Approved' || r.settlementStatus === 'Calculation Ready'
  ).length;
  const settledCount = records.filter((r) => r.settlementStatus === 'Settled').length;
  const totalSettledAmount = records
    .filter((r) => r.settlementStatus === 'Settled')
    .reduce((sum, r) => sum + (Number(r.netSettlementAmount) || 0), 0);
  const pendingSettlementAmount = records
    .filter((r) => r.settlementStatus !== 'Settled')
    .reduce((sum, r) => sum + (Number(r.netSettlementAmount) || 0), 0);

  return {
    totalSettlements,
    pendingClearance,
    approvedReady,
    settledCount,
    totalSettledAmount,
    pendingSettlementAmount
  };
}

