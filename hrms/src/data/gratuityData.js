// NovaSpark HRMS — Gratuity Management Data Engine & Statutory Calculation
// In compliance with Payment of Gratuity Act, 1972 & Section 10(10) of Income Tax Act

export const GRATUITY_CONSTANTS = {
  ACT_NAME: 'Payment of Gratuity Act, 1972',
  MIN_CONTINUOUS_YEARS: 5,
  WORKING_DAYS_DIVISOR: 26,
  DAYS_PER_YEAR_FACTOR: 15,
  MAX_TAX_EXEMPT_LIMIT: 2000000, // ₹20,00,000 statutory limit u/s 10(10)
  FORM_F_NAME: 'Form F (Nomination)',
  FORM_L_NAME: 'Form L (Notice of Determination of Gratuity)'
};

export const SEPARATION_TYPES = [
  'Superannuation / Retirement',
  'Resignation (Completed 5+ Years)',
  'Death in Service (5-Year Rule Waived)',
  'Permanent Disablement / Medical (5-Year Rule Waived)',
  'Termination / Retrenchment'
];

export const GRATUITY_STATUSES = [
  'All',
  'Pending HR Verification',
  'Approved by Accounts',
  'Disbursed & Settled',
  'Rejected'
];

/**
 * Statutory Gratuity Calculation Engine
 * Formula: (15 * Last Drawn Basic * Completed Service Years) / 26
 * Tenure Rounding Rule: Fraction exceeding 6 months is rounded to 1 full year.
 * 5-year eligibility is waived in case of death or disablement.
 */
export function calculateGratuityDetails({
  joiningDate,
  exitDate = new Date().toISOString().slice(0, 10),
  lastDrawnBasic = 15000,
  separationReason = 'Superannuation / Retirement'
}) {
  const start = new Date(joiningDate);
  const end = new Date(exitDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      tenureYears: 0,
      tenureMonths: 0,
      roundedYears: 0,
      isEligible: false,
      dailyRate: 0,
      gratuityAmount: 0,
      taxExemptAmount: 0,
      taxableAmount: 0,
      netPayable: 0
    };
  }

  // Calculate tenure in years and months
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Statutory 6-month rounding rule under Gratuity Act
  // E.g., 5 years 7 months = 6 years; 5 years 5 months = 5 years
  const roundedYears = months >= 6 ? years + 1 : years;

  // Waive 5-year requirement for Death or Disablement
  const isDeathOrDisablement =
    separationReason.toLowerCase().includes('death') ||
    separationReason.toLowerCase().includes('disablement') ||
    separationReason.toLowerCase().includes('medical');

  const isEligible = roundedYears >= GRATUITY_CONSTANTS.MIN_CONTINUOUS_YEARS || isDeathOrDisablement;

  const basic = Number(lastDrawnBasic) || 0;
  const dailyRate = Math.round((basic / GRATUITY_CONSTANTS.WORKING_DAYS_DIVISOR) * 100) / 100;

  let gratuityAmount = 0;
  if (isEligible && roundedYears > 0) {
    gratuityAmount = Math.round((GRATUITY_CONSTANTS.DAYS_PER_YEAR_FACTOR * basic * roundedYears) / GRATUITY_CONSTANTS.WORKING_DAYS_DIVISOR);
  }

  const taxExemptAmount = Math.min(gratuityAmount, GRATUITY_CONSTANTS.MAX_TAX_EXEMPT_LIMIT);
  const taxableAmount = Math.max(0, gratuityAmount - GRATUITY_CONSTANTS.MAX_TAX_EXEMPT_LIMIT);

  return {
    tenureYears: years,
    tenureMonths: months,
    roundedYears,
    isEligible,
    isDeathOrDisablement,
    dailyRate,
    gratuityAmount,
    taxExemptAmount,
    taxableAmount,
    netPayable: gratuityAmount
  };
}

export const INITIAL_GRATUITY_RECORDS = [
  {
    id: 'grat_001',
    claimId: 'GRAT-2026-001',
    employeeId: 'EMP-0104',
    employeeCode: 'RR-SEC-0104',
    employeeName: 'Rajeshwar Dayal Singh',
    designation: 'Senior Security Supervisor',
    department: 'Operations',
    clientName: 'DLF CyberCity Tech Park',
    joiningDate: '2016-04-10',
    exitDate: '2026-04-15',
    tenureYears: 10,
    tenureMonths: 0,
    roundedYears: 10,
    isEligible: true,
    lastDrawnBasic: 24500,
    gratuityAmount: 141346,
    taxExemptAmount: 141346,
    taxableAmount: 0,
    netPayable: 141346,
    separationReason: 'Superannuation / Retirement',
    formFSubmitted: true,
    nomineeName: 'Sunita Devi (Wife)',
    nomineeRelation: 'Spouse',
    nomineeSharePercent: 100,
    bankDetails: {
      accountNo: '30495829104',
      ifsc: 'SBIN0004210',
      bankName: 'State Bank of India',
      branch: 'Sector 29, Gurgaon'
    },
    status: 'Disbursed & Settled',
    paymentMode: 'NEFT Transfer',
    utrNumber: 'SBIN2026042009842',
    disbursedDate: '2026-04-20',
    appliedDate: '2026-04-02',
    hrApprover: 'Anand Kumar (HR Lead)',
    accountsApprover: 'Meenakshi Iyer (Finance Controller)',
    remarks: 'Full 10 years verified with flawless operational record.'
  },
  {
    id: 'grat_002',
    claimId: 'GRAT-2026-002',
    employeeId: 'EMP-0219',
    employeeCode: 'RR-SEC-0219',
    employeeName: 'Mahesh Chandra Sharma',
    designation: 'Head Armoured Guard',
    department: 'Security Operations',
    clientName: 'HDFC Bank Regional Cash Vault',
    joiningDate: '2018-09-01',
    exitDate: '2026-03-31',
    tenureYears: 7,
    tenureMonths: 7,
    roundedYears: 8,
    isEligible: true,
    lastDrawnBasic: 21000,
    gratuityAmount: 96923,
    taxExemptAmount: 96923,
    taxableAmount: 0,
    netPayable: 96923,
    separationReason: 'Resignation (Completed 5+ Years)',
    formFSubmitted: true,
    nomineeName: 'Poonam Sharma (Wife)',
    nomineeRelation: 'Spouse',
    nomineeSharePercent: 100,
    bankDetails: {
      accountNo: '5010023910582',
      ifsc: 'HDFC0000128',
      bankName: 'HDFC Bank Ltd',
      branch: 'Cyber Hub Gurgaon'
    },
    status: 'Approved by Accounts',
    paymentMode: 'RTGS / Bank Transfer',
    utrNumber: 'Pending Disbursement',
    disbursedDate: '—',
    appliedDate: '2026-03-20',
    hrApprover: 'Anand Kumar (HR Lead)',
    accountsApprover: 'Meenakshi Iyer (Finance Controller)',
    remarks: '7y 7m rounded to 8 statutory years. Form F verified on physical file.'
  },
  {
    id: 'grat_003',
    claimId: 'GRAT-2026-003',
    employeeId: 'EMP-0342',
    employeeCode: 'RR-FAC-0342',
    employeeName: 'Harish Babulal Patel',
    designation: 'Technical Facility Supervisor',
    department: 'Facilities & Maintenance',
    clientName: 'Max Super Speciality Hospital',
    joiningDate: '2020-02-15',
    exitDate: '2026-04-10',
    tenureYears: 6,
    tenureMonths: 2,
    roundedYears: 6,
    isEligible: true,
    lastDrawnBasic: 22800,
    gratuityAmount: 78923,
    taxExemptAmount: 78923,
    taxableAmount: 0,
    netPayable: 78923,
    separationReason: 'Resignation (Completed 5+ Years)',
    formFSubmitted: true,
    nomineeName: 'Daksha Patel (Wife)',
    nomineeRelation: 'Spouse',
    nomineeSharePercent: 100,
    bankDetails: {
      accountNo: '0834101009842',
      ifsc: 'PUNB0083400',
      bankName: 'Punjab National Bank',
      branch: 'Sohna Road'
    },
    status: 'Pending HR Verification',
    paymentMode: 'NEFT Transfer',
    utrNumber: '—',
    disbursedDate: '—',
    appliedDate: '2026-04-05',
    hrApprover: '—',
    accountsApprover: '—',
    remarks: 'Awaiting biometric & client clearance sign-off.'
  },
  {
    id: 'grat_004',
    claimId: 'GRAT-2026-004',
    employeeId: 'EMP-0088',
    employeeCode: 'RR-SEC-0088',
    employeeName: 'Late Subhash Chander (Nominee Claim)',
    designation: 'Senior Gunman',
    department: 'Security Operations',
    clientName: 'ITC Grand Bharat Resort',
    joiningDate: '2023-01-10',
    exitDate: '2026-02-18',
    tenureYears: 3,
    tenureMonths: 1,
    roundedYears: 3,
    isEligible: true, // Waived on death
    lastDrawnBasic: 19500,
    gratuityAmount: 33750,
    taxExemptAmount: 33750,
    taxableAmount: 0,
    netPayable: 33750,
    separationReason: 'Death in Service (5-Year Rule Waived)',
    formFSubmitted: true,
    nomineeName: 'Kamla Devi (Widow)',
    nomineeRelation: 'Spouse',
    nomineeSharePercent: 100,
    bankDetails: {
      accountNo: '10984920194',
      ifsc: 'SBIN0001429',
      bankName: 'State Bank of India',
      branch: 'Farrukhnagar'
    },
    status: 'Disbursed & Settled',
    paymentMode: 'Direct Benefit NEFT',
    utrNumber: 'SBIN2026022883921',
    disbursedDate: '2026-02-28',
    appliedDate: '2026-02-20',
    hrApprover: 'Anand Kumar (HR Lead)',
    accountsApprover: 'Meenakshi Iyer (Finance Controller)',
    remarks: 'Disbursed to nominee widow under Section 4(1) second proviso (5-year waiver for demise).'
  },
  {
    id: 'grat_005',
    claimId: 'GRAT-2026-005',
    employeeId: 'EMP-0511',
    employeeCode: 'RR-SEC-0511',
    employeeName: 'Surender Kumar Verma',
    designation: 'Patrol Guard Grade 1',
    department: 'Security Operations',
    clientName: 'Tata Consultancy Services Campus',
    joiningDate: '2019-11-20',
    exitDate: '2026-04-30',
    tenureYears: 6,
    tenureMonths: 5,
    roundedYears: 6,
    isEligible: true,
    lastDrawnBasic: 18200,
    gratuityAmount: 63000,
    taxExemptAmount: 63000,
    taxableAmount: 0,
    netPayable: 63000,
    separationReason: 'Superannuation / Retirement',
    formFSubmitted: true,
    nomineeName: 'Shanti Verma (Wife)',
    nomineeRelation: 'Spouse',
    nomineeSharePercent: 100,
    bankDetails: {
      accountNo: '91823049182',
      ifsc: 'ICIC0000045',
      bankName: 'ICICI Bank',
      branch: 'MG Road Gurgaon'
    },
    status: 'Pending HR Verification',
    paymentMode: 'NEFT Transfer',
    utrNumber: '—',
    disbursedDate: '—',
    appliedDate: '2026-04-12',
    hrApprover: '—',
    accountsApprover: '—',
    remarks: 'Retirement on attaining 58 years of age.'
  }
];

const LOCAL_STORAGE_KEY = 'novaspark_gratuity_records';

export function getStoredGratuity() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_GRATUITY_RECORDS));
      return INITIAL_GRATUITY_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse gratuity records from localStorage:', err);
    return INITIAL_GRATUITY_RECORDS;
  }
}

export function saveStoredGratuity(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save gratuity records to localStorage:', err);
  }
}

export function calculateGratuityMetrics(records = []) {
  const totalClaims = records.length;
  const disbursedRecords = records.filter((r) => r.status === 'Disbursed & Settled');
  const pendingRecords = records.filter(
    (r) => r.status === 'Pending HR Verification' || r.status === 'Approved by Accounts'
  );
  const eligibleRecords = records.filter((r) => r.isEligible);

  const totalDisbursedAmount = disbursedRecords.reduce(
    (acc, cur) => acc + (Number(cur.netPayable) || 0),
    0
  );

  const totalLiabilityAmount = records.reduce(
    (acc, cur) => acc + (Number(cur.netPayable) || 0),
    0
  );

  return {
    totalClaims,
    eligibleCount: eligibleRecords.length,
    disbursedCount: disbursedRecords.length,
    pendingCount: pendingRecords.length,
    totalDisbursedAmount,
    totalLiabilityAmount
  };
}

