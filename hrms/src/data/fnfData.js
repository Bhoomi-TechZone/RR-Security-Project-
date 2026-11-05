// NovaSpark HRMS — Full and Final Settlement (FnF) Data & Engine
// Enterprise 11-Step Exit Lifecycle: Initiation, Details, 6 Clearances, Attendance, Earnings, Deductions, Statutory, Net Amount, 4-Stage Approvals, Payment & Documents

export const EXIT_TYPES = [
  'Resignation',
  'Termination',
  'Absconding',
  'Retirement',
  'Contract End'
];

export const SEPARATION_REASONS = [
  'Resignation (Better Career Opportunity)',
  'Resignation (Personal / Family Reasons)',
  'Resignation (Health / Medical Issues)',
  'Relocation / Shift to Hometown',
  'Contract Expiry / Non-Renewal by Client',
  'Mutual Separation Agreement',
  'Superannuation / Official Retirement',
  'Termination (Performance / Operational Issues)',
  'Termination (Disciplinary / Conduct Breach)',
  'Absconding / Unauthorized Absence'
];

export const CLEARANCE_DEPARTMENTS = [
  { key: 'hr', name: 'HR Department', description: 'ID Card, employee file, NDA compliance & exit survey' },
  { key: 'operations', name: 'Operations / Site', description: 'Guard post handover, shift duty register, replacement guard deployed' },
  { key: 'accounts', name: 'Accounts & Finance', description: 'Petty cash, tour imprest, pending advance & loan clearance' },
  { key: 'admin', name: 'Admin & Facilities', description: 'Biometric access revoked, locker keys, SIM card returned' },
  { key: 'inventory', name: 'Inventory & Uniform Store', description: 'Uniform shirts, boots, belt, cap, whistle, torch & gear inspection' },
  { key: 'client', name: 'Client Site Clearance', description: 'Client site manager sign-off and site access revoked' }
];

export const APPROVAL_STAGES = [
  { id: 'hr_review', label: 'HR Manager', role: 'HR Review & Verification' },
  { id: 'ops_review', label: 'Operations Manager', role: 'Site Handover Sign-off' },
  { id: 'accounts_review', label: 'Accounts Manager', role: 'Dues & Statutory Verification' },
  { id: 'final_approval', label: 'Final Approver', role: 'Management Payout Approval' }
];

export const SETTLEMENT_STATUSES = [
  'All',
  'Pending Clearance',
  'Pending Approval',
  'Approved for Payout',
  'Settled / Disbursed'
];

export const INITIAL_FNF_RECORDS = [
  {
    id: 'fnf-001',
    settlementId: 'FNF-2026-001',
    employeeId: 'e003',
    employeeCode: 'RR-304',
    employeeName: 'Vikramaditya Rathore',
    designation: 'Armed Guard / Gunman',
    client: 'DLF CyberCity Tech Park',
    site: 'Tower 3 Cash Transit Desk',
    department: 'Security Operations',
    dateOfJoining: '2023-04-12',
    exitType: 'Resignation',
    resignationDate: '2026-09-30',
    lastWorkingDay: '2026-10-31',
    separationReason: 'Resignation (Personal / Family Reasons)',
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 30,
    noticeShortfallDays: 0,
    monthlyGrossSalary: 25000,
    basicSalary: 15000,
    perDayWage: 961.54,
    tenureYears: 3.5,

    // Step 3: 6 Department Clearances
    clearances: {
      hr: { status: 'Cleared', clearedBy: 'Priya Sharma (HR)', clearedDate: '2026-10-28', remarks: 'ID Card & files verified' },
      operations: { status: 'Cleared', clearedBy: 'Rajesh Nair (Ops)', clearedDate: '2026-10-29', remarks: 'Replacement guard deployed' },
      accounts: { status: 'Cleared', clearedBy: 'Deepak Joshi (Acc)', clearedDate: '2026-10-30', remarks: 'Advance adjusted' },
      admin: { status: 'Cleared', clearedBy: 'Manoj Verma (Admin)', clearedDate: '2026-10-29', remarks: 'Biometric disabled' },
      inventory: { status: 'Cleared', clearedBy: 'Kavita Singh (Store)', clearedDate: '2026-10-30', remarks: 'Uniform kit returned in good order' },
      client: { status: 'Cleared', clearedBy: 'Client Security Head', clearedDate: '2026-10-31', remarks: 'DLF site sign-off received' }
    },

    // Step 4: Attendance & Leave Verification
    attendance: {
      presentDays: 18,
      absentDays: 2,
      overtimeHours: 16,
      weeklyOffs: 4,
      holidays: 2,
      leaveBalance: 12
    },

    // Step 5: Salary & Arrears
    salaryDues: {
      pendingSalary: 17308,
      overtimePay: 1923,
      incentives: 1500,
      arrears: 2500,
      bonus: 0
    },

    // Step 6: Deductions
    deductions: {
      noticeRecovery: 0,
      advanceRecovery: 3000,
      loanRecovery: 0,
      uniformPenalty: 0,
      otherDeductions: 0
    },

    // Step 7: Statutory & Benefits
    statutoryBenefits: {
      employeePf: 1800,
      employeeEsi: 187,
      gratuityAmount: 0,
      leaveEncashment: 11538
    },

    // Step 8: Final Settlement
    finalSettlement: {
      totalEarnings: 34769,
      totalDeductions: 4987,
      netPayable: 29782
    },

    // Step 9: Approval Workflow
    approvalWorkflow: {
      currentStage: 'final_approval',
      isFullyApproved: true,
      stages: {
        hr_review: { status: 'Approved', approver: 'Priya Sharma (HR Mgr)', date: '2026-10-29' },
        ops_review: { status: 'Approved', approver: 'Rajesh Nair (Ops Mgr)', date: '2026-10-30' },
        accounts_review: { status: 'Approved', approver: 'Deepak Joshi (Accounts Head)', date: '2026-10-31' },
        final_approval: { status: 'Approved', approver: 'Director - HR & Admin', date: '2026-11-01' }
      }
    },

    // Step 10: Payment Processing
    payment: {
      mode: 'Bank Transfer (NEFT)',
      paymentDate: '2026-11-02',
      bankName: 'HDFC Bank',
      accountNo: '50100482910482',
      ifsc: 'HDFC0001248',
      utrNo: 'CMS2026110294821',
      status: 'Disbursed'
    },

    // Step 11: Final Documents
    documents: {
      fnfStatementGenerated: true,
      relievingLetterGenerated: true,
      exitPayslipGenerated: true
    },

    settlementStatus: 'Settled / Disbursed',
    remarks: 'Gun license verification, guard gear, and daily post registers checked. All clearance received and payout disbursed via NEFT.'
  },
  {
    id: 'fnf-002',
    settlementId: 'FNF-2026-002',
    employeeId: 'e002',
    employeeCode: 'RR-219',
    employeeName: 'Sanjay Pratap Singh',
    designation: 'Field Supervisor',
    client: 'Advant Navis Business Park',
    site: 'Sector 142 Campus',
    department: 'Field Supervision',
    dateOfJoining: '2020-02-10',
    exitType: 'Resignation',
    resignationDate: '2026-09-15',
    lastWorkingDay: '2026-10-15',
    separationReason: 'Resignation (Better Career Opportunity)',
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 30,
    noticeShortfallDays: 0,
    monthlyGrossSalary: 32000,
    basicSalary: 20000,
    perDayWage: 1230.77,
    tenureYears: 6.7,

    clearances: {
      hr: { status: 'Cleared', clearedBy: 'Priya Sharma (HR)', clearedDate: '2026-10-12', remarks: 'Dossier signed' },
      operations: { status: 'Cleared', clearedBy: 'Vikram Singh (Head Ops)', clearedDate: '2026-10-13', remarks: 'Supervision route handed over' },
      accounts: { status: 'Cleared', clearedBy: 'Deepak Joshi (Acc)', clearedDate: '2026-10-14', remarks: 'No dues' },
      admin: { status: 'Cleared', clearedBy: 'Manoj Verma (Admin)', clearedDate: '2026-10-14', remarks: 'Keys & ID card returned' },
      inventory: { status: 'Cleared', clearedBy: 'Store Head', clearedDate: '2026-10-15', remarks: 'All uniform badges surrendered' },
      client: { status: 'Cleared', clearedBy: 'Advant Facilities Head', clearedDate: '2026-10-15', remarks: 'Client sign-off completed' }
    },

    attendance: {
      presentDays: 15,
      absentDays: 0,
      overtimeHours: 0,
      weeklyOffs: 2,
      holidays: 1,
      leaveBalance: 12
    },

    salaryDues: {
      pendingSalary: 18462,
      overtimePay: 0,
      incentives: 2000,
      arrears: 0,
      bonus: 0
    },

    deductions: {
      noticeRecovery: 0,
      advanceRecovery: 0,
      loanRecovery: 0,
      uniformPenalty: 0,
      otherDeductions: 0
    },

    statutoryBenefits: {
      employeePf: 2400,
      employeeEsi: 0,
      gratuityAmount: 57692, // (15 * 20000 / 26) * 6.7
      leaveEncashment: 14769
    },

    finalSettlement: {
      totalEarnings: 92923,
      totalDeductions: 2400,
      netPayable: 90523
    },

    approvalWorkflow: {
      currentStage: 'final_approval',
      isFullyApproved: true,
      stages: {
        hr_review: { status: 'Approved', approver: 'HR Manager', date: '2026-10-16' },
        ops_review: { status: 'Approved', approver: 'Head of Operations', date: '2026-10-16' },
        accounts_review: { status: 'Approved', approver: 'Accounts Head', date: '2026-10-17' },
        final_approval: { status: 'Approved', approver: 'Managing Director', date: '2026-10-18' }
      }
    },

    payment: {
      mode: 'Bank Transfer (RTGS)',
      paymentDate: '2026-10-20',
      bankName: 'State Bank of India',
      accountNo: '30492810948',
      ifsc: 'SBIN0002481',
      utrNo: 'SBIN2026102039481',
      status: 'Disbursed'
    },

    documents: {
      fnfStatementGenerated: true,
      relievingLetterGenerated: true,
      exitPayslipGenerated: true
    },

    settlementStatus: 'Settled / Disbursed',
    remarks: '6+ years continuous service completed. Full statutory gratuity calculated and paid.'
  },
  {
    id: 'fnf-003',
    settlementId: 'FNF-2026-003',
    employeeId: 'e005',
    employeeCode: 'RR-512',
    employeeName: 'Mahesh Chandra',
    designation: 'Security Guard',
    client: 'DLF CyberCity Tech Park',
    site: 'Main Entrance Gate',
    department: 'Physical Security',
    dateOfJoining: '2024-06-01',
    exitType: 'Resignation',
    resignationDate: '2026-10-10',
    lastWorkingDay: '2026-10-25',
    separationReason: 'Relocation / Shift to Hometown',
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 15,
    noticeShortfallDays: 15,
    monthlyGrossSalary: 19000,
    basicSalary: 12000,
    perDayWage: 730.77,
    tenureYears: 2.3,

    clearances: {
      hr: { status: 'Cleared', clearedBy: 'Priya Sharma (HR)', clearedDate: '2026-10-24', remarks: 'ID Card surrendered' },
      operations: { status: 'Cleared', clearedBy: 'Ops Supervisor', clearedDate: '2026-10-25', remarks: 'Duty log signed' },
      accounts: { status: 'Cleared', clearedBy: 'Deepak Joshi (Acc)', clearedDate: '2026-10-26', remarks: 'Advance of ₹2,000 flagged' },
      admin: { status: 'Cleared', clearedBy: 'Manoj Verma (Admin)', clearedDate: '2026-10-25', remarks: 'Clear' },
      inventory: { status: 'Pending', clearedBy: '', clearedDate: '', remarks: '1 Security Cap missing & 1 Shirt damaged' },
      client: { status: 'Cleared', clearedBy: 'DLF Site Head', clearedDate: '2026-10-25', remarks: 'Site access revoked' }
    },

    attendance: {
      presentDays: 18,
      absentDays: 2,
      overtimeHours: 0,
      weeklyOffs: 4,
      holidays: 1,
      leaveBalance: 5
    },

    salaryDues: {
      pendingSalary: 13154,
      overtimePay: 0,
      incentives: 0,
      arrears: 0,
      bonus: 0
    },

    deductions: {
      noticeRecovery: 10962, // 15 days * 730.77
      advanceRecovery: 2000,
      loanRecovery: 0,
      uniformPenalty: 1200,
      otherDeductions: 0
    },

    statutoryBenefits: {
      employeePf: 1440,
      employeeEsi: 143,
      gratuityAmount: 0,
      leaveEncashment: 3654
    },

    finalSettlement: {
      totalEarnings: 16808,
      totalDeductions: 15745,
      netPayable: 1063
    },

    approvalWorkflow: {
      currentStage: 'hr_review',
      isFullyApproved: false,
      stages: {
        hr_review: { status: 'In Review', approver: 'Priya Sharma (HR Mgr)', date: '' },
        ops_review: { status: 'Pending', approver: '', date: '' },
        accounts_review: { status: 'Pending', approver: '', date: '' },
        final_approval: { status: 'Pending', approver: '', date: '' }
      }
    },

    payment: {
      mode: 'Bank Transfer (NEFT)',
      paymentDate: '',
      bankName: 'Punjab National Bank',
      accountNo: '0492000192841',
      ifsc: 'PUNB0049200',
      utrNo: '',
      status: 'Pending Payout'
    },

    documents: {
      fnfStatementGenerated: false,
      relievingLetterGenerated: false,
      exitPayslipGenerated: false
    },

    settlementStatus: 'Pending Clearance',
    remarks: 'Awaiting uniform store sign-off for damaged shirt and missing cap. Notice shortfall of 15 days applied.'
  },
  {
    id: 'fnf-004',
    settlementId: 'FNF-2026-004',
    employeeId: 'e008',
    employeeCode: 'RR-408',
    employeeName: 'Pooja Sharma',
    designation: 'Housekeeping Attendant',
    client: 'Logix Cyber Park',
    site: 'Tower B Facility Area',
    department: 'Facility Management',
    dateOfJoining: '2025-01-15',
    exitType: 'Contract End',
    resignationDate: '2026-10-18',
    lastWorkingDay: '2026-10-31',
    separationReason: 'Contract Expiry / Non-Renewal by Client',
    noticePeriodRequiredDays: 15,
    noticePeriodServedDays: 15,
    noticeShortfallDays: 0,
    monthlyGrossSalary: 16500,
    basicSalary: 11000,
    perDayWage: 634.62,
    tenureYears: 1.8,

    clearances: {
      hr: { status: 'Cleared', clearedBy: 'Priya Sharma', clearedDate: '2026-10-30', remarks: 'Cleared' },
      operations: { status: 'Cleared', clearedBy: 'Housekeeping Supervisor', clearedDate: '2026-10-31', remarks: 'Handover complete' },
      accounts: { status: 'Cleared', clearedBy: 'Accounts', clearedDate: '2026-10-31', remarks: 'No advances' },
      admin: { status: 'Cleared', clearedBy: 'Admin', clearedDate: '2026-10-31', remarks: 'Gate pass revoked' },
      inventory: { status: 'Cleared', clearedBy: 'Store', clearedDate: '2026-10-31', remarks: 'All uniform aprons returned' },
      client: { status: 'Cleared', clearedBy: 'Logix Client Rep', clearedDate: '2026-10-31', remarks: 'Contract end signed' }
    },

    attendance: {
      presentDays: 26,
      absentDays: 0,
      overtimeHours: 8,
      weeklyOffs: 4,
      holidays: 1,
      leaveBalance: 5
    },

    salaryDues: {
      pendingSalary: 16500,
      overtimePay: 635,
      incentives: 0,
      arrears: 0,
      bonus: 0
    },

    deductions: {
      noticeRecovery: 0,
      advanceRecovery: 0,
      loanRecovery: 0,
      uniformPenalty: 0,
      otherDeductions: 0
    },

    statutoryBenefits: {
      employeePf: 1320,
      employeeEsi: 124,
      gratuityAmount: 0,
      leaveEncashment: 3173
    },

    finalSettlement: {
      totalEarnings: 20308,
      totalDeductions: 1444,
      netPayable: 18864
    },

    approvalWorkflow: {
      currentStage: 'accounts_review',
      isFullyApproved: false,
      stages: {
        hr_review: { status: 'Approved', approver: 'Priya Sharma (HR Mgr)', date: '2026-11-01' },
        ops_review: { status: 'Approved', approver: 'Facility Ops Head', date: '2026-11-01' },
        accounts_review: { status: 'In Review', approver: 'Accounts Officer', date: '' },
        final_approval: { status: 'Pending', approver: '', date: '' }
      }
    },

    payment: {
      mode: 'Bank Transfer (NEFT)',
      paymentDate: '',
      bankName: 'ICICI Bank',
      accountNo: '109281094821',
      ifsc: 'ICIC0001092',
      utrNo: '',
      status: 'Pending Payout'
    },

    documents: {
      fnfStatementGenerated: true,
      relievingLetterGenerated: false,
      exitPayslipGenerated: false
    },

    settlementStatus: 'Pending Approval',
    remarks: 'Logix client contract completed. All 6 clearances completed. Passed to Accounts for statutory verification.'
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
  
  const pendingClearance = records.filter((r) => {
    if (r.settlementStatus === 'Pending Clearance') return true;
    const clrValues = Object.values(r.clearances || {});
    return clrValues.some((c) => c.status !== 'Cleared');
  }).length;

  const pendingApproval = records.filter((r) => {
    return r.settlementStatus === 'Pending Approval' || (!r.approvalWorkflow?.isFullyApproved && r.settlementStatus !== 'Pending Clearance');
  }).length;

  const approvedReady = records.filter(
    (r) => r.settlementStatus === 'Approved for Payout' || r.approvalWorkflow?.isFullyApproved
  ).length;

  const settledCount = records.filter((r) => r.settlementStatus === 'Settled / Disbursed').length;

  const totalSettledAmount = records
    .filter((r) => r.settlementStatus === 'Settled / Disbursed')
    .reduce((sum, r) => sum + (Number(r.finalSettlement?.netPayable ?? r.netSettlementAmount) || 0), 0);

  const pendingSettlementAmount = records
    .filter((r) => r.settlementStatus !== 'Settled / Disbursed')
    .reduce((sum, r) => sum + (Number(r.finalSettlement?.netPayable ?? r.netSettlementAmount) || 0), 0);

  return {
    totalSettlements,
    pendingClearance,
    pendingApproval,
    approvedReady,
    settledCount,
    totalSettledAmount,
    pendingSettlementAmount
  };
}
