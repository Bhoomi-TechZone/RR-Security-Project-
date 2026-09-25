// NovaSpark HRMS — Mock Statutory Setup Configuration Data

export const mockPFConfig = {
  enabled: true,
  employeeContribution: 12,
  employerContribution: 12,
  epsContribution: 8.33,
  epfEmployerContribution: 3.67,
  edliContribution: 0.5,
  adminCharges: 0.5,
  wageCeiling: 15000,
  wageCeilingRestricted: true,
  allowVPF: true,
  vpfMaxPercentage: 100,
  effectiveDate: '2026-04-01',
  status: 'active',
  createdBy: 'System SuperAdmin',
  createdDate: '2025-04-01',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};

export const mockESIConfig = {
  enabled: true,
  employeeContribution: 0.75,
  employerContribution: 3.25,
  wageEligibilityLimit: 21000,
  disabilityWageLimit: 25000,
  effectiveDate: '2026-04-01',
  status: 'active',
  notes: 'Applicable to all security and operational staff drawing gross monthly wage up to ₹21,000.',
  createdBy: 'System SuperAdmin',
  createdDate: '2025-04-01',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};

export const mockPTSlabs = [
  {
    id: 'pt-mh-1',
    state: 'Maharashtra',
    minSalary: 0,
    maxSalary: 7500,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-mh-2',
    state: 'Maharashtra',
    minSalary: 7501,
    maxSalary: 10000,
    taxAmount: 175,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-mh-3',
    state: 'Maharashtra',
    minSalary: 10001,
    maxSalary: 9999999,
    taxAmount: 200,
    februaryTaxAmount: 300,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-ka-1',
    state: 'Karnataka',
    minSalary: 0,
    maxSalary: 15000,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-ka-2',
    state: 'Karnataka',
    minSalary: 15001,
    maxSalary: 9999999,
    taxAmount: 200,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-tg-1',
    state: 'Telangana',
    minSalary: 0,
    maxSalary: 15000,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-tg-2',
    state: 'Telangana',
    minSalary: 15001,
    maxSalary: 20000,
    taxAmount: 150,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-tg-3',
    state: 'Telangana',
    minSalary: 20001,
    maxSalary: 9999999,
    taxAmount: 200,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-gj-1',
    state: 'Gujarat',
    minSalary: 0,
    maxSalary: 12000,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active'
  },
  {
    id: 'pt-gj-2',
    state: 'Gujarat',
    minSalary: 12001,
    maxSalary: 9999999,
    taxAmount: 200,
    effectiveFrom: '2026-04-01',
    status: 'active'
  }
];

export const mockPTConfig = {
  enabled: true,
  status: 'active',
  effectiveDate: '2026-04-01',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};

export const mockTDSConfig = {
  enabled: true,
  defaultTaxRegime: 'New Regime',
  effectiveFinancialYear: '2026-2027',
  standardDeductionNewRegime: 75000,
  standardDeductionOldRegime: 50000,
  investmentDeclarationRequired: true,
  proofSubmissionDeadline: '2027-01-31',
  monthlyTDSThreshold: 500000,
  status: 'active',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};

export const mockBonusConfig = {
  enabled: true,
  calculationMethod: 'Percentage of Basic',
  bonusPercentage: 8.33,
  maximumBonusPercentage: 20.0,
  statutoryWageCeiling: 7000,
  minimumServiceDays: 30,
  disbursementSchedule: 'Annual (Diwali / Puja Festival)',
  effectiveDate: '2026-04-01',
  status: 'active',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};

export const mockGratuityConfig = {
  enabled: true,
  eligibilityYears: 5,
  calculationBasis: 'Basic + DA',
  formulaMethod: '15 Days × (Last Drawn Basic + DA) × Completed Years / 26',
  maximumTaxExemptionLimit: 2000000,
  effectiveDate: '2026-04-01',
  status: 'active',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};

export const mockLWFRules = [
  {
    id: 'lwf-mh',
    state: 'Maharashtra',
    employeeContribution: 12,
    employerContribution: 36,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    status: 'active',
    effectiveDate: '2026-04-01'
  },
  {
    id: 'lwf-ka',
    state: 'Karnataka',
    employeeContribution: 20,
    employerContribution: 40,
    frequency: 'Yearly',
    deductionMonths: 'December',
    status: 'active',
    effectiveDate: '2026-04-01'
  },
  {
    id: 'lwf-hr',
    state: 'Haryana',
    employeeContribution: 25,
    employerContribution: 50,
    frequency: 'Monthly',
    deductionMonths: 'Every Month',
    status: 'active',
    effectiveDate: '2026-04-01'
  },
  {
    id: 'lwf-dl',
    state: 'Delhi',
    employeeContribution: 0.75,
    employerContribution: 2.25,
    frequency: 'Monthly',
    deductionMonths: 'Every Month',
    status: 'active',
    effectiveDate: '2026-04-01'
  },
  {
    id: 'lwf-wb',
    state: 'West Bengal',
    employeeContribution: 3,
    employerContribution: 15,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    status: 'active',
    effectiveDate: '2026-04-01'
  }
];

export const mockLWFConfig = {
  enabled: true,
  status: 'active',
  effectiveDate: '2026-04-01',
  lastUpdatedBy: 'Admin (Karan Verma)',
  lastUpdatedDate: '2026-08-20'
};
