// NovaSpark HRMS — Employee Leave Data
// Tailored for Security & Workforce Management Self-Service Panel

export const currentEmployeeProfile = {
  employeeCode: 'EMP001',
  employeeName: 'Rahul Kumar',
  initials: 'RK',
  department: 'Security',
  designation: 'Security Guard',
  client: 'ABC Security Services',
  site: 'Delhi Site A',
  joiningDate: '2023-04-10',
  policyName: 'Standard Security Guard Policy',
  monthlySalary: 18000,
  monthlyWorkingDays: 30
};

export const employeeLeaveBalances = [
  {
    id: 'bal-cl',
    code: 'CL',
    name: 'Casual Leave',
    category: 'Paid',
    opening: 6,
    accrued: 4,
    used: 4,
    pending: 1,
    available: 8,
    colorClass: 'blue',
    description: 'For short personal engagements, unforeseen events, and casual absences.'
  },
  {
    id: 'bal-sl',
    code: 'SL',
    name: 'Sick Leave',
    category: 'Paid',
    opening: 5,
    accrued: 4,
    used: 5,
    pending: 0,
    available: 7,
    colorClass: 'green',
    description: 'Medical emergencies, health recovery, and doctor appointments.'
  },
  {
    id: 'bal-el',
    code: 'EL',
    name: 'Earned / Privilege Leave',
    category: 'Paid',
    opening: 10,
    accrued: 6,
    used: 6,
    pending: 2,
    available: 12,
    colorClass: 'purple',
    description: 'Accrued annual vacation leave that can be carried forward or encashed.'
  },
  {
    id: 'bal-lwp',
    code: 'LWP',
    name: 'Leave Without Pay',
    category: 'Unpaid',
    opening: 0,
    accrued: 0,
    used: 1,
    pending: 0,
    available: 0,
    colorClass: 'amber',
    description: 'Unpaid absence beyond permissible quota. Subject to prorated salary deduction in Payroll.'
  }
];

export const policyLeaveTypes = [
  { code: 'CL', name: 'Casual Leave', category: 'Paid', available: 8, quotaNote: '8 Days Available' },
  { code: 'SL', name: 'Sick Leave', category: 'Paid', available: 7, quotaNote: '7 Days Available' },
  { code: 'EL', name: 'Earned Leave', category: 'Paid', available: 12, quotaNote: '12 Days Available' },
  { code: 'LWP', name: 'Leave Without Pay', category: 'Unpaid', available: 0, quotaNote: 'Unpaid (Salary Deduction)' },
  { code: 'ML', name: 'Maternity Leave', category: 'Paid', available: 180, quotaNote: 'Statutory 180 Days' },
  { code: 'SPL', name: 'Special Leave', category: 'Paid', available: 5, quotaNote: '5 Days Max' }
];

export const employeeLeaveHistory = [
  {
    id: 'LV-2026-0891',
    leaveCode: 'CL',
    type: 'Casual Leave',
    category: 'Paid',
    durationType: 'Multiple Days',
    halfDayType: null,
    shortLeaveTime: null,
    from: '2026-09-01',
    to: '2026-09-03',
    days: 2.5,
    dateBreakdown: [
      { date: '2026-09-01', dayType: 'Full Day', units: 1.0 },
      { date: '2026-09-02', dayType: 'Full Day', units: 1.0 },
      { date: '2026-09-03', dayType: 'First Half (0.5d)', units: 0.5 }
    ],
    reason: 'Attending sister\'s wedding rituals in hometown',
    supportingDocName: 'wedding_invitation.pdf',
    supportingDocSize: '1.2 MB',
    remarks: 'Reliever guard assigned for night shift duty',
    appliedOn: '2026-08-28',
    status: 'Pending Supervisor Approval',
    currentStage: 'Site Supervisor Approval',
    workflowStage: 2,
    timeline: [
      {
        stage: 'Employee Submitted',
        status: 'Completed',
        actor: 'Rahul Kumar (Self)',
        timestamp: '28 Aug 2026, 09:30 AM',
        remarks: 'Applied with wedding card attachment'
      },
      {
        stage: 'Site Supervisor Approval',
        status: 'Pending',
        actor: 'Amit Kumar (Site Supervisor)',
        timestamp: null,
        remarks: 'Under review for Delhi Site A manpower coverage'
      },
      {
        stage: 'HR Approval',
        status: 'Waiting',
        actor: 'Priya Nair (HR Manager)',
        timestamp: null,
        remarks: null
      },
      {
        stage: 'Attendance Update',
        status: 'Waiting',
        actor: 'Automated System',
        timestamp: null,
        remarks: 'Will mark status as Leave in Daily Attendance'
      },
      {
        stage: 'Payroll Calculation',
        status: 'Waiting',
        actor: 'Payroll Engine',
        timestamp: null,
        remarks: 'Paid Leave: No salary deduction'
      }
    ],
    attendanceImpact: {
      status: 'Leave (CL)',
      dailyCode: 'L-CL',
      salaryDeduction: false
    },
    payrollImpact: {
      monthlySalary: 18000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 2.5,
      lwpDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'No salary deduction applicable for Paid Casual Leave.'
    },
    rejectionReason: null,
    sendBackReason: null
  },
  {
    id: 'LV-2026-0888',
    leaveCode: 'SL',
    type: 'Sick Leave',
    category: 'Paid',
    durationType: 'Half Day',
    halfDayType: 'Second Half',
    shortLeaveTime: null,
    from: '2026-08-26',
    to: '2026-08-26',
    days: 0.5,
    dateBreakdown: [
      { date: '2026-08-26', dayType: 'Second Half (After 1:30 PM)', units: 0.5 }
    ],
    reason: 'Dental surgery and prescribed rest',
    supportingDocName: 'dental_prescription.pdf',
    supportingDocSize: '450 KB',
    remarks: 'Assistant supervisor handled second half shift briefing',
    appliedOn: '2026-08-25',
    status: 'Approved',
    currentStage: 'Fully Processed',
    workflowStage: 5,
    timeline: [
      {
        stage: 'Employee Submitted',
        status: 'Completed',
        actor: 'Rahul Kumar (Self)',
        timestamp: '25 Aug 2026, 08:30 AM',
        remarks: 'Prescription attached'
      },
      {
        stage: 'Site Supervisor Approval',
        status: 'Approved',
        actor: 'Amit Kumar (Site Supervisor)',
        timestamp: '25 Aug 2026, 10:45 AM',
        remarks: 'Approved. Reliever posted on duty.'
      },
      {
        stage: 'HR Approval',
        status: 'Approved',
        actor: 'Priya Nair (HR Manager)',
        timestamp: '25 Aug 2026, 03:20 PM',
        remarks: 'Prescription verified and sanctioned.'
      },
      {
        stage: 'Attendance Update',
        status: 'Completed',
        actor: 'Automated System',
        timestamp: '26 Aug 2026, 06:00 PM',
        remarks: 'Attendance synchronized as Half-Day SL (0.5 Day)'
      },
      {
        stage: 'Payroll Calculation',
        status: 'Completed',
        actor: 'Payroll Engine',
        timestamp: '26 Aug 2026, 06:05 PM',
        remarks: 'Paid Leave: 0.5 Day credited, No salary deduction.'
      }
    ],
    attendanceImpact: {
      status: 'Half-Day Leave (SL)',
      dailyCode: 'HD-SL',
      salaryDeduction: false
    },
    payrollImpact: {
      monthlySalary: 18000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0.5,
      lwpDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'No salary deduction. 0.5 day paid leave adjusted.'
    },
    rejectionReason: null,
    sendBackReason: null
  },
  {
    id: 'LV-2026-0882',
    leaveCode: 'EL',
    type: 'Earned / Privilege Leave',
    category: 'Paid',
    durationType: 'Multiple Days',
    halfDayType: null,
    shortLeaveTime: null,
    from: '2026-08-14',
    to: '2026-08-16',
    days: 3.0,
    dateBreakdown: [
      { date: '2026-08-14', dayType: 'Full Day', units: 1.0 },
      { date: '2026-08-15', dayType: 'Full Day', units: 1.0 },
      { date: '2026-08-16', dayType: 'Full Day', units: 1.0 }
    ],
    reason: 'Family festival trip',
    supportingDocName: null,
    supportingDocSize: null,
    remarks: 'Short notice request',
    appliedOn: '2026-08-13',
    status: 'Rejected',
    currentStage: 'Site Supervisor Approval',
    workflowStage: 2,
    timeline: [
      {
        stage: 'Employee Submitted',
        status: 'Completed',
        actor: 'Rahul Kumar (Self)',
        timestamp: '13 Aug 2026, 04:10 PM',
        remarks: 'Submitted request'
      },
      {
        stage: 'Site Supervisor Approval',
        status: 'Rejected',
        actor: 'Amit Kumar (Site Supervisor)',
        timestamp: '13 Aug 2026, 06:30 PM',
        remarks: 'Critical shortage of security personnel during Independence Day weekend. Manpower on site cannot fall below 20.'
      }
    ],
    attendanceImpact: {
      status: 'Not Applicable (Request Rejected)',
      dailyCode: 'NA',
      salaryDeduction: false
    },
    payrollImpact: {
      monthlySalary: 18000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0,
      lwpDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'Leave rejected. Regular shift attendance expected.'
    },
    rejectionReason: 'Critical shortage of security personnel during Independence Day weekend. Manpower on site cannot fall below 20.',
    sendBackReason: null
  },
  {
    id: 'LV-2026-0875',
    leaveCode: 'LWP',
    type: 'Leave Without Pay',
    category: 'Unpaid',
    durationType: 'Full Day',
    halfDayType: null,
    shortLeaveTime: null,
    from: '2026-08-05',
    to: '2026-08-05',
    days: 1.0,
    dateBreakdown: [
      { date: '2026-08-05', dayType: 'Full Day', units: 1.0 }
    ],
    reason: 'Exhausted CL quota for month, emergency home visit',
    supportingDocName: null,
    supportingDocSize: null,
    remarks: 'Acknowledged 1 day salary deduction',
    appliedOn: '2026-08-03',
    status: 'Approved',
    currentStage: 'Fully Processed',
    workflowStage: 5,
    timeline: [
      {
        stage: 'Employee Submitted',
        status: 'Completed',
        actor: 'Rahul Kumar (Self)',
        timestamp: '03 Aug 2026, 10:00 AM',
        remarks: 'Applied for 1-day LWP'
      },
      {
        stage: 'Site Supervisor Approval',
        status: 'Approved',
        actor: 'Amit Kumar (Site Supervisor)',
        timestamp: '03 Aug 2026, 01:15 PM',
        remarks: 'Approved with reliever deployed.'
      },
      {
        stage: 'HR Approval',
        status: 'Approved',
        actor: 'Priya Nair (HR Manager)',
        timestamp: '04 Aug 2026, 11:30 AM',
        remarks: 'Approved as 1-day LWP.'
      },
      {
        stage: 'Attendance Update',
        status: 'Completed',
        actor: 'Automated System',
        timestamp: '05 Aug 2026, 06:00 PM',
        remarks: 'Attendance synchronized as Leave Without Pay (LWP)'
      },
      {
        stage: 'Payroll Calculation',
        status: 'Completed',
        actor: 'Payroll Engine',
        timestamp: '05 Aug 2026, 06:05 PM',
        remarks: 'LWP: 1 Day Pro-rated Salary Deduction (₹600)'
      }
    ],
    attendanceImpact: {
      status: 'Leave Without Pay (LWP)',
      dailyCode: 'L-LWP',
      salaryDeduction: true
    },
    payrollImpact: {
      monthlySalary: 18000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0,
      lwpDays: 1,
      payableDays: 29,
      deductionAmount: 600,
      note: '1 Day salary deduction (₹600) processed in August Payroll.'
    },
    rejectionReason: null,
    sendBackReason: null
  },
  {
    id: 'LV-2026-0870',
    leaveCode: 'SL',
    type: 'Sick Leave',
    category: 'Paid',
    durationType: 'Multiple Days',
    halfDayType: null,
    shortLeaveTime: null,
    from: '2026-07-20',
    to: '2026-07-22',
    days: 3.0,
    dateBreakdown: [
      { date: '2026-07-20', dayType: 'Full Day', units: 1.0 },
      { date: '2026-07-21', dayType: 'Full Day', units: 1.0 },
      { date: '2026-07-22', dayType: 'Full Day', units: 1.0 }
    ],
    reason: 'Viral fever recovery',
    supportingDocName: 'clinic_certificate.pdf',
    supportingDocSize: '820 KB',
    remarks: 'Doctor advised 3 days bed rest',
    appliedOn: '2026-07-19',
    status: 'Sent Back',
    currentStage: 'Awaiting Employee Resubmission',
    workflowStage: 2,
    timeline: [
      {
        stage: 'Employee Submitted',
        status: 'Completed',
        actor: 'Rahul Kumar (Self)',
        timestamp: '19 Jul 2026, 08:00 AM',
        remarks: 'Submitted initial slip'
      },
      {
        stage: 'Sent Back by Supervisor',
        status: 'Sent Back',
        actor: 'Amit Kumar (Site Supervisor)',
        timestamp: '19 Jul 2026, 11:30 AM',
        remarks: 'Uploaded certificate is blurry and missing doctor registration number. Please upload a clear copy with stamp.'
      }
    ],
    attendanceImpact: {
      status: 'Pending Resubmission',
      dailyCode: 'NA',
      salaryDeduction: false
    },
    payrollImpact: {
      monthlySalary: 18000,
      monthlyWorkingDays: 30,
      paidLeaveDays: 0,
      lwpDays: 0,
      payableDays: 30,
      deductionAmount: 0,
      note: 'Request sent back for correction.'
    },
    rejectionReason: null,
    sendBackReason: 'Uploaded certificate is blurry and missing doctor registration number. Please upload a clear copy with stamp.'
  }
];

// Backwards compatibility export
export const leaveBalance = employeeLeaveBalances.map(b => ({
  id: b.id,
  type: b.name,
  total: b.opening + b.accrued,
  used: b.used,
  available: b.available
}));

export const leaveHistory = employeeLeaveHistory;
export const leaveTypes = policyLeaveTypes.map(t => t.name);