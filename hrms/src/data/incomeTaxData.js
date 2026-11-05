// NovaSpark HRMS — Income Tax & TDS Management Data & Engine
// Enterprise Module covering IT Declaration, IT Exemptions (Sec 10), IT Challan (Challan 281), and TDS Return (Form 24Q)

export const FINANCIAL_YEARS = ['FY 2026-2027', 'FY 2025-2026', 'FY 2024-2025'];
export const ASSESSMENT_YEARS = ['AY 2027-2028', 'AY 2026-2027', 'AY 2025-2026'];

export const TAX_REGIMES = [
  'New Regime (Section 115BAC)',
  'Old Regime'
];

export const DECLARATION_STATUSES = [
  'All',
  'Pending Verification',
  'Approved',
  'Action Required',
  'Draft'
];

export const CHALLAN_STATUSES = [
  'All',
  'Paid & Verified (NSDL)',
  'Pending Remittance',
  'Under Clearance'
];

export const QUARTERS = ['Q1 (Apr - Jun)', 'Q2 (Jul - Sep)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)'];

export const SECTION_80C_COMPONENTS = [
  { id: 'epf', name: 'Employee Provident Fund (EPF)', maxLimit: 150000, category: 'statutory' },
  { id: 'ppf', name: 'Public Provident Fund (PPF)', maxLimit: 150000, category: 'savings' },
  { id: 'lic', name: 'Life Insurance Premium (LIC)', maxLimit: 150000, category: 'insurance' },
  { id: 'elss', name: 'Equity Linked Savings Scheme (ELSS)', maxLimit: 150000, category: 'investment' },
  { id: 'hl_principal', name: 'Home Loan Principal Repayment', maxLimit: 150000, category: 'housing' },
  { id: 'tuition', name: 'Children School Tuition Fees', maxLimit: 150000, category: 'education' },
  { id: 'nsc', name: 'National Savings Certificate (NSC)', maxLimit: 150000, category: 'savings' },
  { id: 'fd_tax', name: '5-Year Tax Saver Bank Fixed Deposit', maxLimit: 150000, category: 'savings' }
];

export const SECTION_OTHER_COMPONENTS = [
  { id: 'sec_80d_self', name: '80D: Health Insurance (Self & Dependents)', maxLimit: 25000, description: 'Medical insurance premium & preventive checkup' },
  { id: 'sec_80d_parents', name: '80D: Health Insurance (Senior Citizen Parents)', maxLimit: 50000, description: 'Medical cover for parents aged 60+' },
  { id: 'sec_80ccd_1b', name: '80CCD(1B): National Pension System (NPS)', maxLimit: 50000, description: 'Additional voluntary contribution over and above 80C' },
  { id: 'sec_24_home_loan', name: 'Section 24: Interest on Housing Loan', maxLimit: 200000, description: 'Self-occupied property interest deduction' },
  { id: 'sec_80e', name: '80E: Higher Education Loan Interest', maxLimit: 999999, description: 'Interest paid on loan taken for higher education' },
  { id: 'sec_80g', name: '80G: Donations to PM Relief / Charitable Funds', maxLimit: 999999, description: '50% or 100% deduction on approved eligible donations' }
];

export const INITIAL_IT_DECLARATIONS = [
  {
    id: 'itd-001',
    declarationId: 'ITD-2026-001',
    employeeId: 'e001',
    employeeCode: 'RR-101',
    employeeName: 'Rajesh Kumar Verma',
    panNumber: 'ABCDE1234F',
    designation: 'Field Supervisor',
    department: 'Security Operations',
    client: 'DLF CyberCity Tech Park',
    financialYear: 'FY 2026-2027',
    regime: 'Old Regime',
    annualGrossSalary: 450000,
    standardDeduction: 50000,
    
    // Chapter VI-A Deductions
    sec80C: {
      epf: 28800,
      ppf: 40000,
      lic: 24000,
      elss: 25000,
      hlPrincipal: 0,
      tuitionFees: 20000,
      totalDeclared: 137800,
      totalAllowed: 137800 // capped at 1.5L
    },
    
    sec80D: {
      selfAndFamily: 22000,
      parentsSenior: 35000,
      totalAllowed: 57000
    },

    sec80CCD: 30000, // NPS
    sec24HomeLoanInterest: 0,
    otherDeductionsTotal: 0,

    // HRA Declarations
    hraDeclaration: {
      isOpted: true,
      annualRentPaid: 144000,
      monthlyRent: 12000,
      cityType: 'Metro', // Metro (50%) or Non-Metro (40%)
      landlordName: 'Rameshwar Dayal',
      landlordPan: 'FGHIJ5678K',
      rentalAddress: 'Sector 56, Gurgaon, Haryana',
      exemptAmount: 96000
    },

    // Computations
    totalDeductionsAndExemptions: 370800, // 50k standard + 137.8k 80C + 57k 80D + 30k NPS + 96k HRA
    netTaxableIncome: 79200,
    annualTaxPayable: 0, // Rebate u/s 87A applies below 5L
    monthlyTdsDeduction: 0,

    status: 'Approved',
    submittedDate: '2026-09-15',
    verifiedBy: 'Suman Lata (Tax Lead)',
    verificationDate: '2026-09-22',
    proofsCount: 5,
    proofsStatus: 'Verified (5/5 Approved)',
    remarks: 'Rent agreement, landlord PAN copy & LIC policy receipts checked.'
  },
  {
    id: 'itd-002',
    declarationId: 'ITD-2026-002',
    employeeId: 'e002',
    employeeCode: 'RR-219',
    employeeName: 'Sanjay Pratap Singh',
    panNumber: 'BKDPS8921L',
    designation: 'Operations Lead',
    department: 'Field Supervision',
    client: 'Advant Navis Business Park',
    financialYear: 'FY 2026-2027',
    regime: 'Old Regime',
    annualGrossSalary: 840000,
    standardDeduction: 50000,

    sec80C: {
      epf: 43200,
      ppf: 50000,
      lic: 36000,
      elss: 40000,
      hlPrincipal: 50000,
      tuitionFees: 0,
      totalDeclared: 219200,
      totalAllowed: 150000 // capped at 150000
    },

    sec80D: {
      selfAndFamily: 24500,
      parentsSenior: 48000,
      totalAllowed: 72500
    },

    sec80CCD: 50000,
    sec24HomeLoanInterest: 160000,
    otherDeductionsTotal: 0,

    hraDeclaration: {
      isOpted: false,
      annualRentPaid: 0,
      monthlyRent: 0,
      cityType: 'Metro',
      landlordName: '',
      landlordPan: '',
      rentalAddress: '',
      exemptAmount: 0
    },

    totalDeductionsAndExemptions: 482500, // 50k + 150k + 72.5k + 50k + 160k
    netTaxableIncome: 357500,
    annualTaxPayable: 0, // After 87A rebate
    monthlyTdsDeduction: 0,

    status: 'Approved',
    submittedDate: '2026-09-18',
    verifiedBy: 'Suman Lata (Tax Lead)',
    verificationDate: '2026-09-24',
    proofsCount: 6,
    proofsStatus: 'Verified (6/6 Approved)',
    remarks: 'Home loan interest certificate & medical policy documents verified.'
  },
  {
    id: 'itd-003',
    declarationId: 'ITD-2026-003',
    employeeId: 'e003',
    employeeCode: 'RR-304',
    employeeName: 'Vikramaditya Rathore',
    panNumber: 'CZKPR9402Q',
    designation: 'Armed Guard',
    department: 'Security Operations',
    client: 'DLF CyberCity Tech Park',
    financialYear: 'FY 2026-2027',
    regime: 'New Regime (Section 115BAC)',
    annualGrossSalary: 360000,
    standardDeduction: 75000, // New Regime FY 26-27 standard deduction

    sec80C: {
      epf: 21600,
      ppf: 0,
      lic: 0,
      elss: 0,
      hlPrincipal: 0,
      tuitionFees: 0,
      totalDeclared: 21600,
      totalAllowed: 0 // In new regime 80C not allowed
    },

    sec80D: {
      selfAndFamily: 0,
      parentsSenior: 0,
      totalAllowed: 0
    },

    sec80CCD: 0,
    sec24HomeLoanInterest: 0,
    otherDeductionsTotal: 0,

    hraDeclaration: {
      isOpted: false,
      annualRentPaid: 0,
      monthlyRent: 0,
      cityType: 'Non-Metro',
      landlordName: '',
      landlordPan: '',
      rentalAddress: '',
      exemptAmount: 0
    },

    totalDeductionsAndExemptions: 75000,
    netTaxableIncome: 285000,
    annualTaxPayable: 0, // Below 3L nil + 87A rebate up to 7L
    monthlyTdsDeduction: 0,

    status: 'Approved',
    submittedDate: '2026-09-10',
    verifiedBy: 'System Auto-Rule',
    verificationDate: '2026-09-10',
    proofsCount: 0,
    proofsStatus: 'No Proofs Required (New Regime)',
    remarks: 'Opted New Regime (Sec 115BAC). Tax liability is NIL under Sec 87A rebate.'
  },
  {
    id: 'itd-004',
    declarationId: 'ITD-2026-004',
    employeeId: 'e004',
    employeeCode: 'RR-412',
    employeeName: 'Priya Nandini Sharma',
    panNumber: 'DKXPS4821N',
    designation: 'Senior HR Executive',
    department: 'Human Resources',
    client: 'Corporate Head Office',
    financialYear: 'FY 2026-2027',
    regime: 'Old Regime',
    annualGrossSalary: 960000,
    standardDeduction: 50000,

    sec80C: {
      epf: 48000,
      ppf: 30000,
      lic: 28000,
      elss: 50000,
      hlPrincipal: 0,
      tuitionFees: 15000,
      totalDeclared: 171000,
      totalAllowed: 150000
    },

    sec80D: {
      selfAndFamily: 22000,
      parentsSenior: 25000,
      totalAllowed: 47000
    },

    sec80CCD: 50000,
    sec24HomeLoanInterest: 0,
    otherDeductionsTotal: 10000,

    hraDeclaration: {
      isOpted: true,
      annualRentPaid: 216000,
      monthlyRent: 18000,
      cityType: 'Metro',
      landlordName: 'Anil Agarwal',
      landlordPan: 'AFRPA3920M',
      rentalAddress: 'Flat 402, Nirvana Country, Gurgaon',
      exemptAmount: 144000
    },

    totalDeductionsAndExemptions: 451000, // 50k + 150k + 47k + 50k + 10k + 144k
    netTaxableIncome: 509000,
    annualTaxPayable: 14872, // 5% above 2.5L to 5L = 12500 + 20% on 9000 = 1800 + 4% cess = 14872
    monthlyTdsDeduction: 1239,

    status: 'Pending Verification',
    submittedDate: '2026-10-25',
    verifiedBy: '',
    verificationDate: '',
    proofsCount: 4,
    proofsStatus: 'Pending Review (4 receipts)',
    remarks: 'Submitted rent receipts for Q1 & Q2. Landlord PAN attached.'
  },
  {
    id: 'itd-005',
    declarationId: 'ITD-2026-005',
    employeeId: 'e005',
    employeeCode: 'RR-505',
    employeeName: 'Mohammad Farooq',
    panNumber: 'EQRPF1920L',
    designation: 'Security Officer',
    department: 'Security Operations',
    client: 'Logix Blossom Greens',
    financialYear: 'FY 2026-2027',
    regime: 'Old Regime',
    annualGrossSalary: 620000,
    standardDeduction: 50000,

    sec80C: {
      epf: 36000,
      ppf: 30000,
      lic: 20000,
      elss: 0,
      hlPrincipal: 0,
      tuitionFees: 18000,
      totalDeclared: 104000,
      totalAllowed: 104000
    },

    sec80D: {
      selfAndFamily: 18000,
      parentsSenior: 0,
      totalAllowed: 18000
    },

    sec80CCD: 0,
    sec24HomeLoanInterest: 0,
    otherDeductionsTotal: 0,

    hraDeclaration: {
      isOpted: true,
      annualRentPaid: 120000,
      monthlyRent: 10000,
      cityType: 'Metro',
      landlordName: 'Satish Chand',
      landlordPan: '',
      rentalAddress: 'Sector 137, Noida, UP',
      exemptAmount: 72000
    },

    totalDeductionsAndExemptions: 244000,
    netTaxableIncome: 376000,
    annualTaxPayable: 0,
    monthlyTdsDeduction: 0,

    status: 'Action Required',
    submittedDate: '2026-10-20',
    verifiedBy: 'Suman Lata (Tax Lead)',
    verificationDate: '2026-10-22',
    proofsCount: 2,
    proofsStatus: 'Missing Landlord PAN / Rent Agreement',
    remarks: 'Annual rent exceeds ₹1,00,000 threshold. Landlord PAN mandatory under CBDT circular.'
  }
];

export const INITIAL_IT_EXEMPTIONS = [
  {
    id: 'ex-001',
    employeeCode: 'RR-101',
    employeeName: 'Rajesh Kumar Verma',
    pan: 'ABCDE1234F',
    basicAnnual: 240000,
    daAnnual: 24000,
    hraReceivedAnnual: 120000,
    rentPaidAnnual: 144000,
    cityType: 'Metro (50%)',
    rule1_ActualHra: 120000,
    rule2_RentMinusTenPercent: 117600, // 144000 - 26400
    rule3_PercentOfSalary: 132000, // 50% of 264000
    finalHraExemption: 117600, // least of 120k, 117.6k, 132k
    ltaExemption: 0,
    childrenAllowanceExemption: 2400, // ₹100 x 2 kids x 12m
    totalExemptionSec10: 120000,
    status: 'Computed'
  },
  {
    id: 'ex-002',
    employeeCode: 'RR-412',
    employeeName: 'Priya Nandini Sharma',
    pan: 'DKXPS4821N',
    basicAnnual: 480000,
    daAnnual: 0,
    hraReceivedAnnual: 192000,
    rentPaidAnnual: 216000,
    cityType: 'Metro (50%)',
    rule1_ActualHra: 192000,
    rule2_RentMinusTenPercent: 168000, // 216000 - 48000
    rule3_PercentOfSalary: 240000, // 50% of 480000
    finalHraExemption: 168000,
    ltaExemption: 25000,
    childrenAllowanceExemption: 2400,
    totalExemptionSec10: 195400,
    status: 'Computed'
  },
  {
    id: 'ex-003',
    employeeCode: 'RR-505',
    employeeName: 'Mohammad Farooq',
    pan: 'EQRPF1920L',
    basicAnnual: 300000,
    daAnnual: 0,
    hraReceivedAnnual: 120000,
    rentPaidAnnual: 120000,
    cityType: 'Metro (50%)',
    rule1_ActualHra: 120000,
    rule2_RentMinusTenPercent: 90000, // 120000 - 30000
    rule3_PercentOfSalary: 150000,
    finalHraExemption: 90000,
    ltaExemption: 0,
    childrenAllowanceExemption: 1200,
    totalExemptionSec10: 91200,
    status: 'Pending Documentation'
  }
];

export const INITIAL_IT_CHALLANS = [
  {
    id: 'chl-001',
    challanId: 'CHL-2026-10',
    salaryMonth: 'October 2026',
    assessmentYear: 'AY 2027-2028',
    financialYear: 'FY 2026-2027',
    challanType: 'ITNS 281',
    majorHead: '0021 - Income Tax Other than Companies',
    minorHead: '200 - TDS / TCS Payable by Employer',
    bsrCode: '0510304',
    branchName: 'SBI Parliament Street, New Delhi',
    tenderDate: '2026-11-04',
    challanSerialNo: '04912',
    cinNumber: '05103040411202604912',
    taxAmount: 412500,
    surcharge: 0,
    educationCess: 16500,
    interestOrLateFee: 0,
    totalAmountPaid: 429000,
    paymentMode: 'e-Pay Tax (Net Banking / SBI)',
    bankReferenceNumber: 'CPN20261104829104',
    deducteeCount: 142,
    status: 'Paid & Verified (NSDL)',
    remarks: 'Monthly TDS deposited well before statutory due date (07 Nov 2026).'
  },
  {
    id: 'chl-002',
    challanId: 'CHL-2026-09',
    salaryMonth: 'September 2026',
    assessmentYear: 'AY 2027-2028',
    financialYear: 'FY 2026-2027',
    challanType: 'ITNS 281',
    majorHead: '0021 - Income Tax Other than Companies',
    minorHead: '200 - TDS / TCS Payable by Employer',
    bsrCode: '0510304',
    branchName: 'SBI Parliament Street, New Delhi',
    tenderDate: '2026-10-06',
    challanSerialNo: '03820',
    cinNumber: '05103040610202603820',
    taxAmount: 398000,
    surcharge: 0,
    educationCess: 15920,
    interestOrLateFee: 0,
    totalAmountPaid: 413920,
    paymentMode: 'e-Pay Tax (Net Banking / HDFC)',
    bankReferenceNumber: 'CPN20261006918231',
    deducteeCount: 138,
    status: 'Paid & Verified (NSDL)',
    remarks: 'Challan verified and reconciled in NSDL OLTAS portal.'
  },
  {
    id: 'chl-003',
    challanId: 'CHL-2026-08',
    salaryMonth: 'August 2026',
    assessmentYear: 'AY 2027-2028',
    financialYear: 'FY 2026-2027',
    challanType: 'ITNS 281',
    majorHead: '0021 - Income Tax Other than Companies',
    minorHead: '200 - TDS / TCS Payable by Employer',
    bsrCode: '0510304',
    branchName: 'SBI Parliament Street, New Delhi',
    tenderDate: '2026-09-05',
    challanSerialNo: '02711',
    cinNumber: '05103040509202602711',
    taxAmount: 395000,
    surcharge: 0,
    educationCess: 15800,
    interestOrLateFee: 0,
    totalAmountPaid: 410800,
    paymentMode: 'e-Pay Tax (Net Banking / SBI)',
    bankReferenceNumber: 'CPN20260905182901',
    deducteeCount: 136,
    status: 'Paid & Verified (NSDL)',
    remarks: 'Payment acknowledged by TIN-NSDL.'
  },
  {
    id: 'chl-004',
    challanId: 'CHL-2026-07',
    salaryMonth: 'July 2026',
    assessmentYear: 'AY 2027-2028',
    financialYear: 'FY 2026-2027',
    challanType: 'ITNS 281',
    majorHead: '0021 - Income Tax Other than Companies',
    minorHead: '200 - TDS / TCS Payable by Employer',
    bsrCode: '0510304',
    branchName: 'SBI Parliament Street, New Delhi',
    tenderDate: '2026-08-04',
    challanSerialNo: '01890',
    cinNumber: '05103040408202601890',
    taxAmount: 390000,
    surcharge: 0,
    educationCess: 15600,
    interestOrLateFee: 0,
    totalAmountPaid: 405600,
    paymentMode: 'e-Pay Tax (Net Banking / SBI)',
    bankReferenceNumber: 'CPN20260804910284',
    deducteeCount: 135,
    status: 'Paid & Verified (NSDL)',
    remarks: 'Reconciled in Form 24Q Q2 Annexure I.'
  }
];

export const INITIAL_TDS_RETURNS = [
  {
    id: 'tds-q2-2026',
    returnId: '24Q-2026-Q2',
    financialYear: 'FY 2026-2027',
    assessmentYear: 'AY 2027-2028',
    quarter: 'Q2 (Jul - Sep)',
    formType: 'Form 24Q (Salary TDS)',
    filingDueDate: '2026-10-31',
    filedDate: '2026-10-28',
    prnTokenNo: '202610283920194',
    tanNumber: 'DELR12345A',
    employerPan: 'AABCN1234F',
    deductorName: 'RR Security & Facilities Pvt Ltd',
    totalDeductees: 138,
    grossSalaryPaid: 29840000,
    totalTdsDeducted: 1230320,
    totalTdsDeposited: 1230320,
    challansLinkedCount: 3,
    status: 'Filed & Accepted',
    fvuVersion: '8.4',
    acknowledgementReceiptUrl: '#',
    annexureIStatus: '138/138 Deductees Matched',
    annexureIIStatus: 'Not Applicable (Q4 Only)'
  },
  {
    id: 'tds-q1-2026',
    returnId: '24Q-2026-Q1',
    financialYear: 'FY 2026-2027',
    assessmentYear: 'AY 2027-2028',
    quarter: 'Q1 (Apr - Jun)',
    formType: 'Form 24Q (Salary TDS)',
    filingDueDate: '2026-07-31',
    filedDate: '2026-07-29',
    prnTokenNo: '202607294820192',
    tanNumber: 'DELR12345A',
    employerPan: 'AABCN1234F',
    deductorName: 'RR Security & Facilities Pvt Ltd',
    totalDeductees: 132,
    grossSalaryPaid: 28500000,
    totalTdsDeducted: 1184000,
    totalTdsDeposited: 1184000,
    challansLinkedCount: 3,
    status: 'Filed & Accepted',
    fvuVersion: '8.3',
    acknowledgementReceiptUrl: '#',
    annexureIStatus: '132/132 Deductees Matched',
    annexureIIStatus: 'Not Applicable (Q4 Only)'
  },
  {
    id: 'tds-q3-2026',
    returnId: '24Q-2026-Q3',
    financialYear: 'FY 2026-2027',
    assessmentYear: 'AY 2027-2028',
    quarter: 'Q3 (Oct - Dec)',
    formType: 'Form 24Q (Salary TDS)',
    filingDueDate: '2027-01-31',
    filedDate: '',
    prnTokenNo: '',
    tanNumber: 'DELR12345A',
    employerPan: 'AABCN1234F',
    deductorName: 'RR Security & Facilities Pvt Ltd',
    totalDeductees: 142,
    grossSalaryPaid: 10420000,
    totalTdsDeducted: 429000,
    totalTdsDeposited: 429000,
    challansLinkedCount: 1, // Oct paid, Nov & Dec pending
    status: 'Ready for Review',
    fvuVersion: '8.4',
    acknowledgementReceiptUrl: '',
    annexureIStatus: '142 Deductees Prepared (Challan 1 Linked)',
    annexureIIStatus: 'Not Applicable (Q4 Only)'
  }
];

// Helper: HRA Exemption Calculator under Section 10(13A)
export function calculateHRAExemption({ basicAnnual, daAnnual = 0, hraReceivedAnnual, rentPaidAnnual, isMetro = true }) {
  const salaryBase = Number(basicAnnual || 0) + Number(daAnnual || 0);
  const actualHRA = Number(hraReceivedAnnual || 0);
  const rentPaid = Number(rentPaidAnnual || 0);

  // Condition 1: Actual HRA received
  const c1 = actualHRA;

  // Condition 2: Rent paid minus 10% of salary
  const tenPercentSalary = salaryBase * 0.10;
  const c2 = Math.max(0, rentPaid - tenPercentSalary);

  // Condition 3: 50% for Metro, 40% for Non-Metro
  const percentRate = isMetro ? 0.50 : 0.40;
  const c3 = salaryBase * percentRate;

  // Final exemption is the minimum of c1, c2, c3
  const finalExemption = Math.min(c1, c2, c3);

  return {
    salaryBase,
    actualHRA: c1,
    rentMinusTenPercent: Math.round(c2),
    percentOfSalary: Math.round(c3),
    finalExemption: Math.round(finalExemption),
    taxableHRA: Math.max(0, Math.round(c1 - finalExemption))
  };
}

// Storage Keys
const DECLARATION_STORAGE_KEY = 'novaspark_it_declarations';
const CHALLAN_STORAGE_KEY = 'novaspark_it_challans';
const RETURNS_STORAGE_KEY = 'novaspark_it_returns';
const EXEMPTIONS_STORAGE_KEY = 'novaspark_it_exemptions';

export function getStoredDeclarations() {
  try {
    const raw = localStorage.getItem(DECLARATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading declarations storage:', err);
  }
  saveStoredDeclarations(INITIAL_IT_DECLARATIONS);
  return INITIAL_IT_DECLARATIONS;
}

export function saveStoredDeclarations(records) {
  try {
    localStorage.setItem(DECLARATION_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving declarations storage:', err);
  }
}

export function getStoredChallans() {
  try {
    const raw = localStorage.getItem(CHALLAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading challans storage:', err);
  }
  saveStoredChallans(INITIAL_IT_CHALLANS);
  return INITIAL_IT_CHALLANS;
}

export function saveStoredChallans(records) {
  try {
    localStorage.setItem(CHALLAN_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving challans storage:', err);
  }
}

export function getStoredReturns() {
  try {
    const raw = localStorage.getItem(RETURNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading returns storage:', err);
  }
  saveStoredReturns(INITIAL_TDS_RETURNS);
  return INITIAL_TDS_RETURNS;
}

export function saveStoredReturns(records) {
  try {
    localStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving returns storage:', err);
  }
}

export function getStoredExemptions() {
  try {
    const raw = localStorage.getItem(EXEMPTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading exemptions storage:', err);
  }
  saveStoredExemptions(INITIAL_IT_EXEMPTIONS);
  return INITIAL_IT_EXEMPTIONS;
}

export function saveStoredExemptions(records) {
  try {
    localStorage.setItem(EXEMPTIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Error saving exemptions storage:', err);
  }
}

