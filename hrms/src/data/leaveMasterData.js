// NovaSpark HRMS — Comprehensive Leave Master & Policy Data
// Integrates Leave Master, Employee Balances, Multi-Stage Workflow, Site Manpower, Attendance, & Payroll Impact

export const INITIAL_LEAVE_TYPES = [
  {
    id: 'LT-01',
    code: 'CL',
    name: 'Casual Leave',
    category: 'Paid',
    annualQuota: 12,
    carryForward: 'No',
    maxAccumulation: 0,
    encashment: 'No',
    status: 'Active',
    description: 'For short personal engagements, unforeseen events, and casual absences.'
  },
  {
    id: 'LT-02',
    code: 'SL',
    name: 'Sick Leave',
    category: 'Paid',
    annualQuota: 12,
    carryForward: 'No',
    maxAccumulation: 0,
    encashment: 'No',
    status: 'Active',
    description: 'Medical emergencies, health recovery, and doctor appointments.'
  },
  {
    id: 'LT-03',
    code: 'EL',
    name: 'Earned / Privilege Leave',
    category: 'Paid',
    annualQuota: 18,
    carryForward: 'Yes',
    maxAccumulation: 30,
    encashment: 'Yes',
    status: 'Active',
    description: 'Accrued annual vacation leave that can be carried forward or encashed upon separation.'
  },
  {
    id: 'LT-04',
    code: 'LWP',
    name: 'Leave Without Pay',
    category: 'Unpaid',
    annualQuota: 0,
    carryForward: 'No',
    maxAccumulation: 0,
    encashment: 'No',
    status: 'Active',
    description: 'Unpaid absence beyond permissible quota. Incurs direct prorated salary deduction in Payroll.'
  },
  {
    id: 'LT-05',
    code: 'ML',
    name: 'Maternity Leave',
    category: 'Paid',
    annualQuota: 180,
    carryForward: 'No',
    maxAccumulation: 0,
    encashment: 'No',
    status: 'Active',
    description: 'Statutory maternity benefit for eligible female personnel as per Maternity Benefit Act.'
  },
  {
    id: 'LT-06',
    code: 'SPL',
    name: 'Special Leave',
    category: 'Paid',
    annualQuota: 5,
    carryForward: 'No',
    maxAccumulation: 0,
    encashment: 'No',
    status: 'Active',
    description: 'Bereavement, civic duty, or management-sanctioned compassionate leave.'
  }
];

export const INITIAL_LEAVE_POLICIES = [
  { id: 'LP-01', name: 'Standard Security Guard Policy', code: 'POL-SEC', description: 'Covers on-site guards, armed guards, and head guards.' },
  { id: 'LP-02', name: 'Site Supervisor & Field Ops Policy', code: 'POL-OPS', description: 'Covers site supervisors, field officers, and patrol marshals.' },
  { id: 'LP-03', name: 'Corporate & Admin Policy', code: 'POL-CORP', description: 'Covers HQ, HR, accounts, and facility management staff.' }
];

export const INITIAL_EMPLOYEE_BALANCES = [
  {
    id: 'BAL-001',
    employeeCode: 'EMP001',
    employeeName: 'Rahul Kumar',
    department: 'Security',
    designation: 'Security Guard',
    client: 'ABC Security Services',
    site: 'Delhi Site A',
    joiningDate: '2023-04-10',
    policyName: 'Standard Security Guard Policy',
    balances: {
      CL: { opening: 6, accrued: 4, used: 2, pending: 1, available: 7 },
      SL: { opening: 5, accrued: 4, used: 2, pending: 0, available: 7 },
      EL: { opening: 10, accrued: 6, used: 4, pending: 2, available: 10 },
      LWP: { opening: 0, accrued: 0, used: 1, pending: 0, available: 0 }
    }
  },
  {
    id: 'BAL-002',
    employeeCode: 'EMP002',
    employeeName: 'Amit Sharma',
    department: 'Operations',
    designation: 'Site Supervisor',
    client: 'XYZ Facility Management',
    site: 'Gurgaon Cyber City Hub',
    joiningDate: '2022-08-15',
    policyName: 'Site Supervisor & Field Ops Policy',
    balances: {
      CL: { opening: 8, accrued: 4, used: 4, pending: 0, available: 8 },
      SL: { opening: 6, accrued: 4, used: 3, pending: 0, available: 7 },
      EL: { opening: 12, accrued: 6, used: 6, pending: 0, available: 12 },
      LWP: { opening: 0, accrued: 0, used: 0, pending: 0, available: 0 }
    }
  },
  {
    id: 'BAL-003',
    employeeCode: 'EMP003',
    employeeName: 'Rajesh Verma',
    department: 'Security',
    designation: 'Armed Guard',
    client: 'PQR Housekeeping Pvt Ltd',
    site: 'Noida Sector 62 Campus',
    joiningDate: '2024-01-10',
    policyName: 'Standard Security Guard Policy',
    balances: {
      CL: { opening: 4, accrued: 4, used: 3, pending: 1, available: 4 },
      SL: { opening: 4, accrued: 4, used: 2, pending: 0, available: 6 },
      EL: { opening: 6, accrued: 6, used: 2, pending: 0, available: 10 },
      LWP: { opening: 0, accrued: 0, used: 2, pending: 0, available: 0 }
    }
  },
  {
    id: 'BAL-004',
    employeeCode: 'EMP004',
    employeeName: 'Manoj Verma',
    department: 'Security',
    designation: 'Head Guard',
    client: 'Suraksha Security Corp',
    site: 'Delhi Site A',
    joiningDate: '2021-11-01',
    policyName: 'Standard Security Guard Policy',
    balances: {
      CL: { opening: 7, accrued: 5, used: 3, pending: 0, available: 9 },
      SL: { opening: 8, accrued: 4, used: 4, pending: 0, available: 8 },
      EL: { opening: 14, accrued: 6, used: 5, pending: 0, available: 15 },
      LWP: { opening: 0, accrued: 0, used: 0, pending: 0, available: 0 }
    }
  },
  {
    id: 'BAL-005',
    employeeCode: 'EMP005',
    employeeName: 'Priya Nair',
    department: 'Administration',
    designation: 'HR Executive',
    client: 'Greenfield Services Ltd',
    site: 'Corporate HQ - Okhla',
    joiningDate: '2023-02-01',
    policyName: 'Corporate & Admin Policy',
    balances: {
      CL: { opening: 8, accrued: 4, used: 4, pending: 1, available: 7 },
      SL: { opening: 6, accrued: 4, used: 1, pending: 0, available: 9 },
      EL: { opening: 10, accrued: 6, used: 3, pending: 0, available: 13 },
      LWP: { opening: 0, accrued: 0, used: 0, pending: 0, available: 0 }
    }
  }
];

export const INITIAL_SITE_MANPOWER = {
  'Delhi Site A': {
    siteName: 'Delhi Site A',
    clientName: 'ABC Security Services',
    totalGuards: 25,
    onDuty: 20,
    onLeave: 3,
    absent: 2,
    relieverAvailable: 2,
    minimumRequired: 20,
    supervisorName: 'Amit Kumar (Sup-101)'
  },
  'Gurgaon Cyber City Hub': {
    siteName: 'Gurgaon Cyber City Hub',
    clientName: 'XYZ Facility Management',
    totalGuards: 35,
    onDuty: 30,
    onLeave: 3,
    absent: 2,
    relieverAvailable: 4,
    minimumRequired: 28,
    supervisorName: 'Vikas Rawat (Sup-104)'
  },
  'Noida Sector 62 Campus': {
    siteName: 'Noida Sector 62 Campus',
    clientName: 'PQR Housekeeping Pvt Ltd',
    totalGuards: 18,
    onDuty: 14,
    onLeave: 2,
    absent: 2,
    relieverAvailable: 1,
    minimumRequired: 15,
    supervisorName: 'Suresh Rana (Sup-108)'
  },
  'Corporate HQ - Okhla': {
    siteName: 'Corporate HQ - Okhla',
    clientName: 'Greenfield Services Ltd',
    totalGuards: 12,
    onDuty: 11,
    onLeave: 1,
    absent: 0,
    relieverAvailable: 2,
    minimumRequired: 8,
    supervisorName: 'Pooja Bhatia (HR Mgr)'
  }
};

export const ENHANCED_LEAVE_REQUESTS = [
  {
    id: 'LV-2026-0891',
    employeeId: 'EMP001',
    employeeName: 'Rahul Kumar',
    initials: 'RK',
    clientName: 'ABC Security Services',
    site: 'Delhi Site A',
    department: 'Security',
    designation: 'Security Guard',
    leaveCode: 'CL',
    leaveType: 'Casual Leave',
    category: 'Paid',
    durationType: 'Multiple Days', // Full Day, Half Day, Short Leave, Multiple Days
    halfDayType: null, // 'First Half' | 'Second Half'
    shortLeaveTime: null, // { start: '14:00', end: '16:00' }
    fromDate: '2026-09-01',
    toDate: '2026-09-03',
    days: 2.5,
    dateBreakdown: [
      { date: '2026-09-01', dayType: 'Full Day', units: 1.0 },
      { date: '2026-09-02', dayType: 'Full Day', units: 1.0 },
      { date: '2026-09-03', dayType: 'First Half', units: 0.5 }
    ],
    reason: 'Attending sister\'s wedding rituals in hometown',
    supportingDocName: 'wedding_invitation.pdf',
    remarks: 'Reliever guard assigned for night shift duty',
    availableBalanceBefore: 8,
    requestedDays: 2.5,
    balanceAfter: 5.5,
    // Site manpower snapshot at submission
    siteManpower: {
      siteName: 'Delhi Site A',
      totalGuards: 25,
      onDuty: 20,
      onLeave: 3,
      absent: 2,
      relieverAvailable: 2,
      minimumRequired: 20
    },
    // Multi-stage status: 'Draft' | 'Pending Supervisor Approval' | 'Pending HR Approval' | 'Approved' | 'Rejected' | 'Cancelled' | 'Sent Back'
    status: 'Pending Supervisor Approval',
    currentApprover: 'Site Supervisor (Amit Kumar)',
    workflowStage: 2, // 1: Applied, 2: Supervisor, 3: HR, 4: Attendance, 5: Payroll
    timeline: [
      {
        stage: 'Employee Applied',
        actor: 'Rahul Kumar (EMP001)',
        status: 'Completed',
        timestamp: '2026-08-28 09:30 AM',
        remarks: 'Submitted request with invitation attachment'
      },
      {
        stage: 'Site Supervisor Approval',
        actor: 'Amit Kumar (Supervisor)',
        status: 'Pending',
        timestamp: null,
        remarks: null
      },
      {
        stage: 'HR Approval',
        actor: 'Priya Nair (HR Manager)',
        status: 'Queued',
        timestamp: null,
        remarks: null
      },
      {
        stage: 'Attendance Update',
        actor: 'Automated System',
        status: 'Queued',
        timestamp: null,
        remarks: 'Will mark status as Leave in Daily Attendance'
      },
      {
        stage: 'Payroll Calculation',
        actor: 'Payroll Engine',
        status: 'Queued',
        timestamp: null,
        remarks: 'Paid Leave: No salary deduction'
      }
    ],
    attendanceImpact: {
      status: 'Leave (CL)',
      dailyCode: 'L-CL',
      salaryDeduction: false,
      deductionDays: 0
    },
    payrollImpact: {
      monthlySalary: 18000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 2.5,
      lwpDays: 0,
      absentDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'No salary deduction applicable for Paid Casual Leave.'
    },
    rejectionReason: null,
    sendBackReason: null
  },
  {
    id: 'LV-2026-0892',
    employeeId: 'EMP003',
    employeeName: 'Rajesh Verma',
    initials: 'RV',
    clientName: 'PQR Housekeeping Pvt Ltd',
    site: 'Noida Sector 62 Campus',
    department: 'Security',
    designation: 'Armed Guard',
    leaveCode: 'LWP',
    leaveType: 'Leave Without Pay',
    category: 'Unpaid',
    durationType: 'Full Day',
    halfDayType: null,
    shortLeaveTime: null,
    fromDate: '2026-09-04',
    toDate: '2026-09-04',
    days: 1.0,
    dateBreakdown: [
      { date: '2026-09-04', dayType: 'Full Day', units: 1.0 }
    ],
    reason: 'Exhausted CL quota; urgently needed at native village for land registry',
    supportingDocName: null,
    remarks: 'Approved by Site Supervisor with manpower warning acknowledged',
    availableBalanceBefore: 0,
    requestedDays: 1.0,
    balanceAfter: 0,
    siteManpower: {
      siteName: 'Noida Sector 62 Campus',
      totalGuards: 18,
      onDuty: 14,
      onLeave: 2,
      absent: 2,
      relieverAvailable: 1,
      minimumRequired: 15
    },
    status: 'Pending HR Approval',
    currentApprover: 'HR Manager (Priya Nair)',
    workflowStage: 3,
    timeline: [
      {
        stage: 'Employee Applied',
        actor: 'Rajesh Verma (EMP003)',
        status: 'Completed',
        timestamp: '2026-08-29 11:15 AM',
        remarks: 'Applied for 1-day LWP'
      },
      {
        stage: 'Site Supervisor Approval',
        actor: 'Suresh Rana (Supervisor)',
        status: 'Approved',
        timestamp: '2026-08-29 02:40 PM',
        remarks: 'Manpower is tight (14 on duty vs 15 req) but reliever deployed. Forwarded to HR.'
      },
      {
        stage: 'HR Approval',
        actor: 'Priya Nair (HR Manager)',
        status: 'Pending',
        timestamp: null,
        remarks: null
      },
      {
        stage: 'Attendance Update',
        actor: 'Automated System',
        status: 'Queued',
        timestamp: null,
        remarks: 'Will mark status as Leave Without Pay (LWP)'
      },
      {
        stage: 'Payroll Calculation',
        actor: 'Payroll Engine',
        status: 'Queued',
        timestamp: null,
        remarks: 'LWP: 1 Day Pro-rated Salary Deduction'
      }
    ],
    attendanceImpact: {
      status: 'Leave Without Pay (LWP)',
      dailyCode: 'L-LWP',
      salaryDeduction: true,
      deductionDays: 1
    },
    payrollImpact: {
      monthlySalary: 19500,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0,
      lwpDays: 1,
      absentDays: 0,
      payableDays: 29,
      deductionAmount: 650,
      note: '1 Day salary deduction (₹650) will be automatically processed in September Payroll.'
    },
    rejectionReason: null,
    sendBackReason: null
  },
  {
    id: 'LV-2026-0888',
    employeeId: 'EMP002',
    employeeName: 'Amit Sharma',
    initials: 'AS',
    clientName: 'XYZ Facility Management',
    site: 'Gurgaon Cyber City Hub',
    department: 'Operations',
    designation: 'Site Supervisor',
    leaveCode: 'SL',
    leaveType: 'Sick Leave',
    category: 'Paid',
    durationType: 'Half Day',
    halfDayType: 'Second Half',
    shortLeaveTime: null,
    fromDate: '2026-08-26',
    toDate: '2026-08-26',
    days: 0.5,
    dateBreakdown: [
      { date: '2026-08-26', dayType: 'Second Half (After 1:30 PM)', units: 0.5 }
    ],
    reason: 'Dental surgery and prescribed rest',
    supportingDocName: 'dental_prescription.pdf',
    remarks: 'Assistant supervisor handled second half shift briefing',
    availableBalanceBefore: 7,
    requestedDays: 0.5,
    balanceAfter: 6.5,
    siteManpower: {
      siteName: 'Gurgaon Cyber City Hub',
      totalGuards: 35,
      onDuty: 30,
      onLeave: 3,
      absent: 2,
      relieverAvailable: 4,
      minimumRequired: 28
    },
    status: 'Approved',
    currentApprover: 'Fully Processed',
    workflowStage: 5,
    timeline: [
      {
        stage: 'Employee Applied',
        actor: 'Amit Sharma (EMP002)',
        status: 'Completed',
        timestamp: '2026-08-25 08:30 AM',
        remarks: 'Applied for dental appointment'
      },
      {
        stage: 'Site Supervisor Approval',
        actor: 'Vikas Rawat (Ops Head)',
        status: 'Approved',
        timestamp: '2026-08-25 10:45 AM',
        remarks: 'Approved. Assistant on duty.'
      },
      {
        stage: 'HR Approval',
        actor: 'Priya Nair (HR Manager)',
        status: 'Approved',
        timestamp: '2026-08-25 03:20 PM',
        remarks: 'Prescription verified and approved.'
      },
      {
        stage: 'Attendance Update',
        actor: 'Automated System',
        status: 'Completed',
        timestamp: '2026-08-26 06:00 PM',
        remarks: 'Attendance synchronized as Half-Day SL (0.5 Day)'
      },
      {
        stage: 'Payroll Calculation',
        actor: 'Payroll Engine',
        status: 'Completed',
        timestamp: '2026-08-26 06:05 PM',
        remarks: 'Paid Leave: 0.5 Day credited, No salary deduction.'
      }
    ],
    attendanceImpact: {
      status: 'Half-Day Leave (SL)',
      dailyCode: 'HD-SL',
      salaryDeduction: false,
      deductionDays: 0
    },
    payrollImpact: {
      monthlySalary: 28000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0.5,
      lwpDays: 0,
      absentDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'No salary deduction. 0.5 day paid leave adjusted.'
    },
    rejectionReason: null,
    sendBackReason: null
  },
  {
    id: 'LV-2026-0885',
    employeeId: 'EMP004',
    employeeName: 'Manoj Verma',
    initials: 'MV',
    clientName: 'Suraksha Security Corp',
    site: 'Delhi Site A',
    department: 'Security',
    designation: 'Head Guard',
    leaveCode: 'EL',
    leaveType: 'Earned / Privilege Leave',
    category: 'Paid',
    durationType: 'Multiple Days',
    halfDayType: null,
    shortLeaveTime: null,
    fromDate: '2026-08-15',
    toDate: '2026-08-18',
    days: 4.0,
    dateBreakdown: [
      { date: '2026-08-15', dayType: 'Full Day', units: 1.0 },
      { date: '2026-08-16', dayType: 'Full Day', units: 1.0 },
      { date: '2026-08-17', dayType: 'Full Day', units: 1.0 },
      { date: '2026-08-18', dayType: 'Full Day', units: 1.0 }
    ],
    reason: 'Annual family festival trip',
    supportingDocName: null,
    remarks: 'Short notice submitted during festival weekend',
    availableBalanceBefore: 15,
    requestedDays: 4.0,
    balanceAfter: 15,
    siteManpower: {
      siteName: 'Delhi Site A',
      totalGuards: 25,
      onDuty: 19,
      onLeave: 4,
      absent: 2,
      relieverAvailable: 0,
      minimumRequired: 20
    },
    status: 'Rejected',
    currentApprover: 'Site Supervisor (Amit Kumar)',
    workflowStage: 2,
    timeline: [
      {
        stage: 'Employee Applied',
        actor: 'Manoj Verma (EMP004)',
        status: 'Completed',
        timestamp: '2026-08-14 04:10 PM',
        remarks: 'Applied 1 day prior to leave'
      },
      {
        stage: 'Site Supervisor Approval',
        actor: 'Amit Kumar (Supervisor)',
        status: 'Rejected',
        timestamp: '2026-08-14 06:30 PM',
        remarks: 'Site manpower is below minimum (19 vs 20) with no reliever available over Independence Day weekend.'
      }
    ],
    attendanceImpact: {
      status: 'Not Applicable (Request Rejected)',
      dailyCode: 'NA',
      salaryDeduction: false,
      deductionDays: 0
    },
    payrollImpact: {
      monthlySalary: 21000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0,
      lwpDays: 0,
      absentDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'Leave was rejected. Regular shift attendance expected.'
    },
    rejectionReason: 'Critical shortage of security personnel during Independence Day weekend. Manpower on site cannot fall below 20.',
    sendBackReason: null
  },
  {
    id: 'LV-2026-0880',
    employeeId: 'EMP005',
    employeeName: 'Priya Nair',
    initials: 'PN',
    clientName: 'Greenfield Services Ltd',
    site: 'Corporate HQ - Okhla',
    department: 'Administration',
    designation: 'HR Executive',
    leaveCode: 'CL',
    leaveType: 'Casual Leave',
    category: 'Paid',
    durationType: 'Short Leave',
    halfDayType: null,
    shortLeaveTime: { start: '15:30', end: '17:30' },
    fromDate: '2026-08-10',
    toDate: '2026-08-10',
    days: 0.25,
    dateBreakdown: [
      { date: '2026-08-10', dayType: 'Short Leave (15:30 - 17:30)', units: 0.25 }
    ],
    reason: 'Parent-teacher meeting at daughter\'s school',
    supportingDocName: null,
    remarks: 'Approved as 2-hour permission pass',
    availableBalanceBefore: 8,
    requestedDays: 0.25,
    balanceAfter: 7.75,
    siteManpower: {
      siteName: 'Corporate HQ - Okhla',
      totalGuards: 12,
      onDuty: 11,
      onLeave: 1,
      absent: 0,
      relieverAvailable: 2,
      minimumRequired: 8
    },
    status: 'Approved',
    currentApprover: 'Fully Processed',
    workflowStage: 5,
    timeline: [
      {
        stage: 'Employee Applied',
        actor: 'Priya Nair (EMP005)',
        status: 'Completed',
        timestamp: '2026-08-09 03:00 PM',
        remarks: '2 hour short leave request'
      },
      {
        stage: 'Site Supervisor Approval',
        actor: 'Pooja Bhatia (HR Mgr)',
        status: 'Approved',
        timestamp: '2026-08-09 05:00 PM',
        remarks: 'Approved.'
      },
      {
        stage: 'HR Approval',
        actor: 'Pooja Bhatia (HR Head)',
        status: 'Approved',
        timestamp: '2026-08-10 09:00 AM',
        remarks: 'Approved permission slip.'
      }
    ],
    attendanceImpact: {
      status: 'Short Leave (Permission Pass)',
      dailyCode: 'SL-PASS',
      salaryDeduction: false,
      deductionDays: 0
    },
    payrollImpact: {
      monthlySalary: 32000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0.25,
      lwpDays: 0,
      absentDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'No deduction. Short leave within monthly grace threshold.'
    },
    rejectionReason: null,
    sendBackReason: null
  }
];

// Helper calculation: Calculate Available Balance
export const calculateAvailableBalance = (opening, accrued, used, pending) => {
  return Number((opening + accrued - used - pending).toFixed(2));
};

// Helper: Calculate Manpower after Leave Approval
export const calculateManpowerAfterLeave = (siteInfo, leaveDays = 1) => {
  if (!siteInfo) return null;
  const onDutyAfter = Math.max(0, siteInfo.onDuty - 1);
  const onLeaveAfter = siteInfo.onLeave + 1;
  const isBelowMinimum = onDutyAfter < siteInfo.minimumRequired;
  const shortfall = isBelowMinimum ? siteInfo.minimumRequired - onDutyAfter : 0;

  return {
    ...siteInfo,
    onDutyAfter,
    onLeaveAfter,
    isBelowMinimum,
    shortfall
  };
};
