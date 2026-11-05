// NovaSpark HRMS — Bonus Management Data Engine & Statutory Calculation
// In compliance with Payment of Bonus Act, 1965 & Payment of Bonus Rules, 1975 (Form A, B, C, D)

export const BONUS_CONSTANTS = {
  ACT_NAME: 'Payment of Bonus Act, 1965',
  MIN_BONUS_PERCENT: 8.33, // Minimum statutory bonus rate
  MAX_BONUS_PERCENT: 20.00, // Maximum statutory bonus rate
  WAGE_ELIGIBILITY_CEILING: 21000, // Monthly salary eligibility ceiling (Basic + DA)
  CALCULATION_WAGE_CEILING: 7000, // Statutory monthly calculation wage ceiling
  MIN_WORKING_DAYS_ELIGIBLE: 30, // Minimum 30 days worked in the accounting year
  STANDARD_YEAR_WORKING_DAYS: 300, // Standard working days in a year for security & facilities
  FORM_C_NAME: 'Form C - Register of Bonus Payable to Employees'
};

export const BONUS_TYPES = [
  'Annual Statutory Bonus (Act 1965)',
  'Festive / Diwali Advance Bonus',
  'Performance Ex-Gratia Bonus',
  'Attendance & Loyalty Bonus'
];

export const BONUS_STATUSES = [
  'All',
  'Eligible (Calculated)',
  'Pending Approval',
  'Approved for Payout',
  'Disbursed & Settled',
  'On Hold'
];

export const FINANCIAL_YEARS = [
  'FY 2026-2027 (Current Cycle)',
  'FY 2025-2026 (Audited Cycle)',
  'FY 2024-2025 (Previous Cycle)'
];

/**
 * Statutory Bonus Calculator as per Payment of Bonus Act, 1965
 * Formula:
 * Monthly Calculation Base = Min(BasicSalary, 7000)
 * Annual Wage Base = Monthly Calculation Base * 12 * (WorkedDays / StandardYearDays)
 * Gross Bonus = Annual Wage Base * (BonusPercentage / 100)
 * Net Bonus = Gross Bonus - InterimAdvancePaid
 */
export function calculateBonusDetails({
  monthlyBasic = 15000,
  workedDays = 295,
  bonusPercent = BONUS_CONSTANTS.MIN_BONUS_PERCENT,
  interimAdvance = 0,
  standardYearDays = BONUS_CONSTANTS.STANDARD_YEAR_WORKING_DAYS
}) {
  const basic = Number(monthlyBasic) || 0;
  const days = Math.min(Number(workedDays) || 0, standardYearDays);
  const percent = Math.min(Math.max(Number(bonusPercent) || BONUS_CONSTANTS.MIN_BONUS_PERCENT, 8.33), 20);

  // Eligibility check
  const isWageEligible = basic <= BONUS_CONSTANTS.WAGE_ELIGIBILITY_CEILING;
  const isDaysEligible = days >= BONUS_CONSTANTS.MIN_WORKING_DAYS_ELIGIBLE;
  const isEligible = isWageEligible && isDaysEligible;

  // Calculation wage base: capped at ₹7,000 as per Section 12 of the Act
  const calculationWageMonthly = Math.min(basic, BONUS_CONSTANTS.CALCULATION_WAGE_CEILING);

  // Prorated Annual Wage Base based on actual days worked
  const attendanceRatio = standardYearDays > 0 ? days / standardYearDays : 1;
  const annualCalculationBase = Math.round(calculationWageMonthly * 12 * attendanceRatio);

  // Gross statutory bonus
  let grossBonus = 0;
  if (isEligible) {
    grossBonus = Math.round(annualCalculationBase * (percent / 100));
    // Statutory minimum of ₹100 or 8.33%
    if (grossBonus < 100 && days >= BONUS_CONSTANTS.MIN_WORKING_DAYS_ELIGIBLE) {
      grossBonus = 100;
    }
  }

  const advanceDeduction = Math.min(Number(interimAdvance) || 0, grossBonus);
  const netBonusPayable = Math.max(0, grossBonus - advanceDeduction);

  return {
    isEligible,
    isWageEligible,
    isDaysEligible,
    calculationWageMonthly,
    attendanceRatio: Math.round(attendanceRatio * 100),
    annualCalculationBase,
    bonusPercent: percent,
    grossBonus,
    interimAdvance: advanceDeduction,
    netBonusPayable
  };
}

export const INITIAL_BONUS_RECORDS = [
  {
    id: 'bon_001',
    batchId: 'BON-FY26-001',
    employeeId: 'EMP-0104',
    employeeCode: 'RR-SEC-0104',
    employeeName: 'Rajeshwar Dayal Singh',
    designation: 'Senior Security Supervisor',
    department: 'Operations',
    clientName: 'DLF CyberCity Tech Park',
    financialYear: 'FY 2026-2027',
    monthlyBasic: 19500,
    workedDays: 298,
    standardYearDays: 300,
    calculationWageMonthly: 7000,
    annualCalculationBase: 83440,
    bonusPercent: 8.33,
    grossBonus: 6951,
    interimAdvance: 2000,
    netBonusPayable: 4951,
    bonusType: 'Annual Statutory Bonus (Act 1965)',
    status: 'Disbursed & Settled',
    paymentMode: 'NEFT Transfer',
    utrNumber: 'SBIN202610229841',
    disbursedDate: '2026-10-22',
    approvedBy: 'Meenakshi Iyer (Finance Lead)',
    formCSerialNo: 'FC-2026-081',
    remarks: 'Prorated for 298 days. Diwali advance adjusted.'
  },
  {
    id: 'bon_002',
    batchId: 'BON-FY26-002',
    employeeId: 'EMP-0219',
    employeeCode: 'RR-SEC-0219',
    employeeName: 'Mahesh Chandra Sharma',
    designation: 'Head Armoured Guard',
    department: 'Security Operations',
    clientName: 'HDFC Bank Regional Cash Vault',
    financialYear: 'FY 2026-2027',
    monthlyBasic: 18000,
    workedDays: 300,
    standardYearDays: 300,
    calculationWageMonthly: 7000,
    annualCalculationBase: 84000,
    bonusPercent: 10.00, // Client approved 10% rate
    grossBonus: 8400,
    interimAdvance: 0,
    netBonusPayable: 8400,
    bonusType: 'Annual Statutory Bonus (Act 1965)',
    status: 'Approved for Payout',
    paymentMode: 'Bank Transfer (RTGS)',
    utrNumber: 'Pending Disbursement',
    disbursedDate: '—',
    approvedBy: 'Anand Kumar (HR Head)',
    formCSerialNo: 'FC-2026-082',
    remarks: 'Full 300 days completed. 10% declared rate.'
  },
  {
    id: 'bon_003',
    batchId: 'BON-FY26-003',
    employeeId: 'EMP-0342',
    employeeCode: 'RR-FAC-0342',
    employeeName: 'Harish Babulal Patel',
    designation: 'Technical Facility Supervisor',
    department: 'Facilities & Maintenance',
    clientName: 'Max Super Speciality Hospital',
    financialYear: 'FY 2026-2027',
    monthlyBasic: 20500,
    workedDays: 285,
    standardYearDays: 300,
    calculationWageMonthly: 7000,
    annualCalculationBase: 79800,
    bonusPercent: 8.33,
    grossBonus: 6647,
    interimAdvance: 1500,
    netBonusPayable: 5147,
    bonusType: 'Festive / Diwali Advance Bonus',
    status: 'Pending Approval',
    paymentMode: 'NEFT Transfer',
    utrNumber: '—',
    disbursedDate: '—',
    approvedBy: '—',
    formCSerialNo: 'FC-2026-083',
    remarks: 'Awaiting biometric attendance sign-off.'
  },
  {
    id: 'bon_004',
    batchId: 'BON-FY26-004',
    employeeId: 'EMP-0418',
    employeeCode: 'RR-SEC-0418',
    employeeName: 'Praveen Kumar Yadav',
    designation: 'Field Patrol Officer',
    department: 'Security Operations',
    clientName: 'Amazon India Fulfillment Center',
    financialYear: 'FY 2026-2027',
    monthlyBasic: 16500,
    workedDays: 290,
    standardYearDays: 300,
    calculationWageMonthly: 7000,
    annualCalculationBase: 81200,
    bonusPercent: 12.00, // Peak season client performance rate
    grossBonus: 9744,
    interimAdvance: 0,
    netBonusPayable: 9744,
    bonusType: 'Performance Ex-Gratia Bonus',
    status: 'Disbursed & Settled',
    paymentMode: 'Direct Account Credit',
    utrNumber: 'HDFC202610287412',
    disbursedDate: '2026-10-28',
    approvedBy: 'Meenakshi Iyer (Finance Lead)',
    formCSerialNo: 'FC-2026-084',
    remarks: 'Disbursed for Amazon Q3 peak season compliance.'
  },
  {
    id: 'bon_005',
    batchId: 'BON-FY26-005',
    employeeId: 'EMP-0511',
    employeeCode: 'RR-SEC-0511',
    employeeName: 'Surender Kumar Verma',
    designation: 'Patrol Guard Grade 1',
    department: 'Security Operations',
    clientName: 'Tata Consultancy Services Campus',
    financialYear: 'FY 2026-2027',
    monthlyBasic: 14800,
    workedDays: 270,
    standardYearDays: 300,
    calculationWageMonthly: 7000,
    annualCalculationBase: 75600,
    bonusPercent: 8.33,
    grossBonus: 6298,
    interimAdvance: 0,
    netBonusPayable: 6298,
    bonusType: 'Annual Statutory Bonus (Act 1965)',
    status: 'Eligible (Calculated)',
    paymentMode: 'NEFT Transfer',
    utrNumber: '—',
    disbursedDate: '—',
    approvedBy: '—',
    formCSerialNo: 'FC-2026-085',
    remarks: 'Scheduled for batch disbursement next payroll cycle.'
  }
];

const LOCAL_STORAGE_KEY = 'novaspark_bonus_records';

export function getStoredBonus() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_BONUS_RECORDS));
      return INITIAL_BONUS_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse bonus records from localStorage:', err);
    return INITIAL_BONUS_RECORDS;
  }
}

export function saveStoredBonus(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save bonus records to localStorage:', err);
  }
}

export function calculateBonusMetrics(records = []) {
  const totalEmployees = records.length;
  const disbursedRecords = records.filter((r) => r.status === 'Disbursed & Settled');
  const pendingRecords = records.filter(
    (r) => r.status === 'Pending Approval' || r.status === 'Eligible (Calculated)' || r.status === 'Approved for Payout'
  );

  const totalGrossBonus = records.reduce(
    (acc, cur) => acc + (Number(cur.grossBonus) || 0),
    0
  );

  const totalNetDisbursed = disbursedRecords.reduce(
    (acc, cur) => acc + (Number(cur.netBonusPayable) || 0),
    0
  );

  const totalPendingPayout = pendingRecords.reduce(
    (acc, cur) => acc + (Number(cur.netBonusPayable) || 0),
    0
  );

  const avgBonusPercent =
    totalEmployees > 0
      ? (
          records.reduce((acc, cur) => acc + (Number(cur.bonusPercent) || 8.33), 0) /
          totalEmployees
        ).toFixed(1)
      : '8.3';

  return {
    totalEmployees,
    disbursedCount: disbursedRecords.length,
    pendingCount: pendingRecords.length,
    totalGrossBonus,
    totalNetDisbursed,
    totalPendingPayout,
    avgBonusPercent
  };
}

