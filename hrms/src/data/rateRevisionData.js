// NovaSpark HRMS — Rate Revision & Arrears Calculation Mock Data & Helpers
// Ready for backend API integration

export const REVISION_REASONS = [
  'Annual Increment / Appraisal',
  'Promotion / Role Upgrade',
  'Minimum Wage Govt Notification',
  'Site / Client Specific Allowance Adjustment',
  'Special Performance Bonus Revision',
  'Contractual Rate Renegotiation',
  'Correction / Regularization'
];

export const INITIAL_RATE_REVISIONS = [
  {
    id: 'rev-001',
    revisionId: 'REV-2026-001',
    employeeId: 'e001',
    employeeCode: 'EMP001',
    employeeName: 'Rahul Kumar',
    client: 'ABC Security Services',
    site: 'Main Gate Bareilly',
    designation: 'Security Guard',
    effectiveFrom: '2026-08-15',
    oldRate: 20000,
    newRate: 23000,
    rateDifference: 3000,
    
    // Components
    oldBasic: 12000,
    oldVda: 2000,
    oldHra: 4000,
    oldOtherAllowance: 2000,
    oldOtRate: 150,
    oldGross: 20000,

    newBasic: 14000,
    newVda: 2500,
    newHra: 4500,
    newOtherAllowance: 2000,
    newOtRate: 175,
    newGross: 23000,

    revisionReason: 'Annual Increment / Appraisal',
    status: 'Approved',
    approvedBy: 'Vikram Singh (Director HR)',
    approvalDate: '2026-08-18',
    rejectionReason: '',
    remarks: 'Annual appraisal increment approved based on FY25-26 performance score.',
    createdAt: '2026-08-16 10:30 AM'
  },
  {
    id: 'rev-002',
    revisionId: 'REV-2026-002',
    employeeId: 'e002',
    employeeCode: 'EMP002',
    employeeName: 'Priya Sharma',
    client: 'ABC Security Services',
    site: 'Corporate HQ Bareilly',
    designation: 'Admin Executive',
    effectiveFrom: '2026-08-01',
    oldRate: 25000,
    newRate: 28500,
    rateDifference: 3500,

    oldBasic: 15000,
    oldVda: 2500,
    oldHra: 5000,
    oldOtherAllowance: 2500,
    oldOtRate: 180,
    oldGross: 25000,

    newBasic: 17000,
    newVda: 3000,
    newHra: 5500,
    newOtherAllowance: 3000,
    newOtRate: 210,
    newGross: 28500,

    revisionReason: 'Promotion / Role Upgrade',
    status: 'Effective',
    approvedBy: 'Rajesh Khanna (Managing Director)',
    approvalDate: '2026-07-30',
    rejectionReason: '',
    remarks: 'Promoted to Senior Admin Executive with revised compensation band.',
    createdAt: '2026-07-28 04:15 PM'
  },
  {
    id: 'rev-003',
    revisionId: 'REV-2026-003',
    employeeId: 'e003',
    employeeCode: 'EMP003',
    employeeName: 'Vikram Singh',
    client: 'ABC Security Services',
    site: 'Site Alpha Industrial Area',
    designation: 'Operations Field Officer',
    effectiveFrom: '2026-08-10',
    oldRate: 28000,
    newRate: 32000,
    rateDifference: 4000,

    oldBasic: 17000,
    oldVda: 3000,
    oldHra: 5500,
    oldOtherAllowance: 2500,
    oldOtRate: 200,
    oldGross: 28000,

    newBasic: 19500,
    newVda: 3500,
    newHra: 6000,
    newOtherAllowance: 3000,
    newOtRate: 235,
    newGross: 32000,

    revisionReason: 'Site / Client Specific Allowance Adjustment',
    status: 'Pending Approval',
    approvedBy: null,
    approvalDate: null,
    rejectionReason: '',
    remarks: 'Additional responsibility for 4 new peripheral client clusters.',
    createdAt: '2026-08-20 11:00 AM'
  },
  {
    id: 'rev-004',
    revisionId: 'REV-2026-004',
    employeeId: 'e004',
    employeeCode: 'EMP004',
    employeeName: 'Amit Patel',
    client: 'Apex Guarding Services',
    site: 'Sector 18 Plant',
    designation: 'Security Supervisor',
    effectiveFrom: '2026-07-15',
    oldRate: 22000,
    newRate: 25000,
    rateDifference: 3000,

    oldBasic: 13500,
    oldVda: 2200,
    oldHra: 4300,
    oldOtherAllowance: 2000,
    oldOtRate: 160,
    oldGross: 22000,

    newBasic: 15500,
    newVda: 2500,
    newHra: 4800,
    newOtherAllowance: 2200,
    newOtRate: 185,
    newGross: 25000,

    revisionReason: 'Minimum Wage Govt Notification',
    status: 'Approved',
    approvedBy: 'Admin HR Head',
    approvalDate: '2026-07-20',
    rejectionReason: '',
    remarks: 'Aligned with state statutory minimum wages revised notification.',
    createdAt: '2026-07-16 02:20 PM'
  },
  {
    id: 'rev-005',
    revisionId: 'REV-2026-005',
    employeeId: 'e006',
    employeeCode: 'EMP006',
    employeeName: 'Rajesh Verma',
    client: 'CyberTech Facilities',
    site: 'Data Center Noida',
    designation: 'CCTV Technician',
    effectiveFrom: '2026-08-01',
    oldRate: 24000,
    newRate: 29000,
    rateDifference: 5000,

    oldBasic: 14500,
    oldVda: 2500,
    oldHra: 4800,
    oldOtherAllowance: 2200,
    oldOtRate: 170,
    oldGross: 24000,

    newBasic: 18000,
    newVda: 3000,
    newHra: 5500,
    newOtherAllowance: 2500,
    newOtRate: 210,
    newGross: 29000,

    revisionReason: 'Special Performance Bonus Revision',
    status: 'Rejected',
    approvedBy: 'Admin HR Head',
    approvalDate: '2026-08-05',
    rejectionReason: 'Annual performance score of 68% does not meet the minimum Grade-B (75%) criteria required for off-cycle rate revision.',
    remarks: 'Re-evaluation scheduled during the standard Q4 review window.',
    createdAt: '2026-08-02 09:40 AM'
  },
  {
    id: 'rev-006',
    revisionId: 'REV-2026-006',
    employeeId: 'e007',
    employeeCode: 'EMP007',
    employeeName: 'Deepak Joshi',
    client: 'Apex Guarding Services',
    site: 'Warehouse Hub Moradabad',
    designation: 'Armed Guard',
    effectiveFrom: '2026-08-20',
    oldRate: 21500,
    newRate: 24000,
    rateDifference: 2500,

    oldBasic: 13000,
    oldVda: 2200,
    oldHra: 4300,
    oldOtherAllowance: 2000,
    oldOtRate: 160,
    oldGross: 21500,

    newBasic: 14500,
    newVda: 2500,
    newHra: 4800,
    newOtherAllowance: 2200,
    newOtRate: 180,
    newGross: 24000,

    revisionReason: 'Contractual Rate Renegotiation',
    status: 'Draft',
    approvedBy: null,
    approvalDate: null,
    rejectionReason: '',
    remarks: 'Client rate revision proposal pending contract renewal sign-off.',
    createdAt: '2026-08-22 03:00 PM'
  }
];

export const INITIAL_ARREARS_RECORDS = [
  {
    id: 'arr-001',
    arrearId: 'ARR-2026-001',
    revisionId: 'REV-2026-001',
    employeeId: 'e001',
    employeeCode: 'EMP001',
    employeeName: 'Rahul Kumar',
    client: 'ABC Security Services',
    site: 'Main Gate Bareilly',
    designation: 'Security Guard',
    arrearMonth: 'August 2026',
    oldRate: 20000,
    revisedRate: 23000,
    difference: 3000,
    applicableDays: 17, // From 15th to 31st August (17 days)
    arrearAmount: 1645, // Math.round((3000 / 31) * 17)
    pfApplicable: true,
    esiApplicable: true,
    otherDeduction: 0,
    payrollStatus: 'Included in Payroll',
    payrollMonth: '2026-08',
    calculationNotes: 'Calculated for 17 applicable days from effective date 15-Aug-2026 @ ₹96.77/day difference.',
    createdAt: '2026-08-19'
  },
  {
    id: 'arr-002',
    arrearId: 'ARR-2026-002',
    revisionId: 'REV-2026-002',
    employeeId: 'e002',
    employeeCode: 'EMP002',
    employeeName: 'Priya Sharma',
    client: 'ABC Security Services',
    site: 'Corporate HQ Bareilly',
    designation: 'Admin Executive',
    arrearMonth: 'August 2026',
    oldRate: 25000,
    revisedRate: 28500,
    difference: 3500,
    applicableDays: 31,
    arrearAmount: 3500,
    pfApplicable: true,
    esiApplicable: false, // Gross > ₹21,000 threshold
    otherDeduction: 0,
    payrollStatus: 'Calculated',
    payrollMonth: '2026-08',
    calculationNotes: 'Full month rate difference applicable from 01-Aug-2026.',
    createdAt: '2026-08-01'
  },
  {
    id: 'arr-003',
    arrearId: 'ARR-2026-003',
    revisionId: 'REV-2026-004',
    employeeId: 'e004',
    employeeCode: 'EMP004',
    employeeName: 'Amit Patel',
    client: 'Apex Guarding Services',
    site: 'Sector 18 Plant',
    designation: 'Security Supervisor',
    arrearMonth: 'July 2026',
    oldRate: 22000,
    revisedRate: 25000,
    difference: 3000,
    applicableDays: 17,
    arrearAmount: 1645,
    pfApplicable: true,
    esiApplicable: true,
    otherDeduction: 0,
    payrollStatus: 'Included in Payroll',
    payrollMonth: '2026-08',
    calculationNotes: 'Backdated July arrears (17 days) processed in August payroll batch.',
    createdAt: '2026-07-21'
  },
  {
    id: 'arr-004',
    arrearId: 'ARR-2026-004',
    revisionId: 'REV-2026-003',
    employeeId: 'e003',
    employeeCode: 'EMP003',
    employeeName: 'Vikram Singh',
    client: 'ABC Security Services',
    site: 'Site Alpha Industrial Area',
    designation: 'Operations Field Officer',
    arrearMonth: 'August 2026',
    oldRate: 28000,
    revisedRate: 32000,
    difference: 4000,
    applicableDays: 22,
    arrearAmount: 2839,
    pfApplicable: true,
    esiApplicable: false,
    otherDeduction: 0,
    payrollStatus: 'Pending Calculation',
    payrollMonth: '2026-08',
    calculationNotes: 'Awaiting rate revision approval before finalizing calculation.',
    createdAt: '2026-08-20'
  }
];

export function calculateRateRevisionMetrics(revisions) {
  const totalRevisions = revisions.length;
  const pendingApproval = revisions.filter(r => r.status === 'Pending Approval').length;
  const approved = revisions.filter(r => r.status === 'Approved' || r.status === 'Effective').length;
  
  // Revisions effective in the current/selected month (Aug 2026)
  const effectiveThisMonth = revisions.filter(r => 
    r.effectiveFrom && (r.effectiveFrom.startsWith('2026-08') || r.effectiveFrom.startsWith('2026-07')) &&
    (r.status === 'Approved' || r.status === 'Effective')
  ).length;

  return {
    totalRevisions,
    pendingApproval,
    approved,
    effectiveThisMonth
  };
}

export function calculateArrearsMetrics(arrears) {
  const totalArrearRecords = arrears.length;
  const pendingCalculation = arrears.filter(a => a.payrollStatus === 'Pending Calculation').length;
  const calculated = arrears.filter(a => a.payrollStatus === 'Calculated').length;
  const includedInPayroll = arrears.filter(a => a.payrollStatus === 'Included in Payroll').length;
  
  const totalArrearAmount = arrears.reduce((sum, a) => sum + (Number(a.arrearAmount) || 0), 0);

  return {
    totalArrearRecords,
    pendingCalculation,
    calculated,
    includedInPayroll,
    totalArrearAmount
  };
}
