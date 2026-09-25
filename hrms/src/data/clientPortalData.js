// NovaSpark HRMS — Client Portal Dedicated Data Service
// Strictly scopes all data to the authenticated client's company.
// Mock tenant mapping: clientId 'c001' -> ABC Security Services

export const CLIENT_COMPANY_PROFILE = {
  id: 'c001',
  clientId: 'c001',
  clientCode: 'CLT-ABC-001',
  name: 'ABC Security Services',
  legalName: 'ABC Security & Facility Management Pvt. Ltd.',
  initials: 'AS',
  industry: 'Security & Facility Management',
  gstin: '09ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  contractStartDate: '2026-01-12',
  contractEndDate: '2027-01-11',
  contractStatus: 'Active',
  contactPerson: 'Rahul Kumar',
  designation: 'Managing Director / Client Representative',
  contactNumber: '+91 98765 43210',
  email: 'rahul.kumar@abcsecurity.in',
  billingEmail: 'accounts@abcsecurity.in',
  registeredAddress: 'Civil Lines, Bareilly, Uttar Pradesh 243001',
  billingAddress: 'Corporate Tower, 4th Floor, Civil Lines, Bareilly, UP 243001',
  operatingSites: [
    'Main Gate & Perimeter',
    'Warehouse Complex Block A',
    'Administrative Headquarters',
    'Production Unit 2',
    'Logistics Terminal'
  ],
  serviceTier: 'Enterprise SLA - 24/7 Security & Patrol'
};

export const CLIENT_DASHBOARD_KPIS = {
  totalEmployees: 125,
  activeEmployees: 118,
  todayAttendancePercent: 94.2,
  presentToday: 118,
  absentToday: 5,
  onLeaveToday: 2,
  pendingCorrections: 3,
  currentBillingFormatted: '₹42,30,000',
  currentBillingAmount: 4230000,
  paidAmount: 3610000,
  pendingAmount: 620000,
  lastInvoiceNo: 'INV-2026-0801',
  currentBillingPeriod: 'August 2026'
};

export const CLIENT_WEEKLY_ATTENDANCE_TREND = [
  { day: 'Mon', fullDay: 'Monday', percentage: 92, present: 115, total: 125 },
  { day: 'Tue', fullDay: 'Tuesday', percentage: 95, present: 119, total: 125 },
  { day: 'Wed', fullDay: 'Wednesday', percentage: 89, present: 111, total: 125 },
  { day: 'Thu', fullDay: 'Thursday', percentage: 94, present: 118, total: 125 },
  { day: 'Fri', fullDay: 'Friday', percentage: 96, present: 120, total: 125 },
  { day: 'Sat', fullDay: 'Saturday', percentage: 91, present: 114, total: 125 },
  { day: 'Sun', fullDay: 'Sunday', percentage: 93, present: 116, total: 125 }
];

export const CLIENT_EMPLOYEES_LIST = [
  {
    id: 'emp-001',
    employeeCode: 'EMP001',
    name: 'Rahul Kumar',
    initials: 'RK',
    designation: 'Head Guard / Security Supervisor',
    department: 'Security Operations',
    site: 'Main Gate & Perimeter',
    joiningDate: '2025-01-15',
    status: 'Active',
    mobile: '+91 98765 43210',
    email: 'rahul.k@abcsecurity.in',
    gender: 'Male',
    shift: 'General Day (08:00 - 17:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Main Gate Post 1'
  },
  {
    id: 'emp-002',
    employeeCode: 'EMP002',
    name: 'Amit Sharma',
    initials: 'AS',
    designation: 'Security Officer',
    department: 'Security Operations',
    site: 'Warehouse Complex Block A',
    joiningDate: '2025-02-01',
    status: 'Active',
    mobile: '+91 98877 65432',
    email: 'amit.sharma@abcsecurity.in',
    gender: 'Male',
    shift: 'Night Shift (20:00 - 05:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Warehouse Entrance'
  },
  {
    id: 'emp-003',
    employeeCode: 'EMP006',
    name: 'Vikram Singh',
    initials: 'VS',
    designation: 'CCTV Surveillance Specialist',
    department: 'Surveillance & Monitoring',
    site: 'Administrative Headquarters',
    joiningDate: '2025-03-10',
    status: 'Active',
    mobile: '+91 97112 33445',
    email: 'vikram.s@abcsecurity.in',
    gender: 'Male',
    shift: 'Day Shift (06:00 - 14:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Control Room'
  },
  {
    id: 'emp-004',
    employeeCode: 'EMP011',
    name: 'Deepak Verma',
    initials: 'DV',
    designation: 'Armed Security Guard',
    department: 'Armed Protection',
    site: 'Logistics Terminal',
    joiningDate: '2025-04-18',
    status: 'Active',
    mobile: '+91 96554 11223',
    email: 'deepak.v@abcsecurity.in',
    gender: 'Male',
    shift: 'Night Shift (20:00 - 05:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Cash Transit Gate'
  },
  {
    id: 'emp-005',
    employeeCode: 'EMP015',
    name: 'Suresh Rawat',
    initials: 'SR',
    designation: 'Patrol Officer',
    department: 'Security Operations',
    site: 'Main Gate & Perimeter',
    joiningDate: '2025-05-22',
    status: 'Active',
    mobile: '+91 95443 66778',
    email: 'suresh.r@abcsecurity.in',
    gender: 'Male',
    shift: 'Afternoon Shift (14:00 - 22:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Perimeter Sector 4'
  },
  {
    id: 'emp-006',
    employeeCode: 'EMP019',
    name: 'Sunita Devi',
    initials: 'SD',
    designation: 'Female Security Guard',
    department: 'Visitor Management',
    site: 'Administrative Headquarters',
    joiningDate: '2025-06-05',
    status: 'Active',
    mobile: '+91 94332 77889',
    email: 'sunita.d@abcsecurity.in',
    gender: 'Female',
    shift: 'Day Shift (08:30 - 17:30)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Reception Frisking'
  },
  {
    id: 'emp-007',
    employeeCode: 'EMP024',
    name: 'Mohan Lal',
    initials: 'ML',
    designation: 'Fire & Safety Officer',
    department: 'Safety & Emergency',
    site: 'Production Unit 2',
    joiningDate: '2025-07-12',
    status: 'On Leave',
    mobile: '+91 93221 88990',
    email: 'mohan.l@abcsecurity.in',
    gender: 'Male',
    shift: 'General Day (09:00 - 18:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Emergency Response Post'
  },
  {
    id: 'emp-008',
    employeeCode: 'EMP030',
    name: 'Rakesh Yadav',
    initials: 'RY',
    designation: 'Security Guard',
    department: 'Security Operations',
    site: 'Warehouse Complex Block A',
    joiningDate: '2025-08-01',
    status: 'Active',
    mobile: '+91 92110 99001',
    email: 'rakesh.y@abcsecurity.in',
    gender: 'Male',
    shift: 'Night Shift (20:00 - 05:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Loading Dock'
  },
  {
    id: 'emp-009',
    employeeCode: 'EMP035',
    name: 'Kavita Joshi',
    initials: 'KJ',
    designation: 'Desk Security Assistant',
    department: 'Visitor Management',
    site: 'Administrative Headquarters',
    joiningDate: '2025-09-14',
    status: 'Active',
    mobile: '+91 91009 11223',
    email: 'kavita.j@abcsecurity.in',
    gender: 'Female',
    shift: 'Day Shift (09:00 - 18:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Visitor Lobby'
  },
  {
    id: 'emp-010',
    employeeCode: 'EMP042',
    name: 'Pramod Mishra',
    initials: 'PM',
    designation: 'Security Guard',
    department: 'Security Operations',
    site: 'Production Unit 2',
    joiningDate: '2025-10-02',
    status: 'Inactive',
    mobile: '+91 90998 22334',
    email: 'pramod.m@abcsecurity.in',
    gender: 'Male',
    shift: 'Day Shift (06:00 - 14:00)',
    policeVerification: 'Verified (2026)',
    dutyPost: 'Service Gate'
  }
];

export const CLIENT_ATTENDANCE_RECORDS = [
  {
    id: 'att-001',
    employeeCode: 'EMP001',
    employeeName: 'Rahul Kumar',
    site: 'Main Gate & Perimeter',
    department: 'Security Operations',
    shift: 'General Day (08:00 - 17:00)',
    date: '2026-08-25',
    inTime: '07:52 AM',
    outTime: '05:05 PM',
    status: 'Present',
    workingHours: '9h 13m',
    overtime: '1h 00m'
  },
  {
    id: 'att-002',
    employeeCode: 'EMP002',
    employeeName: 'Amit Sharma',
    site: 'Warehouse Complex Block A',
    department: 'Security Operations',
    shift: 'Night Shift (20:00 - 05:00)',
    date: '2026-08-25',
    inTime: '07:58 PM',
    outTime: '05:02 AM',
    status: 'Present',
    workingHours: '9h 04m',
    overtime: '1h 00m'
  },
  {
    id: 'att-003',
    employeeCode: 'EMP006',
    employeeName: 'Vikram Singh',
    site: 'Administrative Headquarters',
    department: 'Surveillance & Monitoring',
    shift: 'Day Shift (06:00 - 14:00)',
    date: '2026-08-25',
    inTime: '05:50 AM',
    outTime: '02:10 PM',
    status: 'Present',
    workingHours: '8h 20m',
    overtime: '0h 00m'
  },
  {
    id: 'att-004',
    employeeCode: 'EMP011',
    employeeName: 'Deepak Verma',
    site: 'Logistics Terminal',
    department: 'Armed Protection',
    shift: 'Night Shift (20:00 - 05:00)',
    date: '2026-08-25',
    inTime: '08:15 PM',
    outTime: '05:00 AM',
    status: 'Late',
    workingHours: '8h 45m',
    overtime: '0h 00m'
  },
  {
    id: 'att-005',
    employeeCode: 'EMP015',
    employeeName: 'Suresh Rawat',
    site: 'Main Gate & Perimeter',
    department: 'Security Operations',
    shift: 'Afternoon Shift (14:00 - 22:00)',
    date: '2026-08-25',
    inTime: '01:55 PM',
    outTime: '10:05 PM',
    status: 'Present',
    workingHours: '8h 10m',
    overtime: '0h 00m'
  },
  {
    id: 'att-006',
    employeeCode: 'EMP019',
    employeeName: 'Sunita Devi',
    site: 'Administrative Headquarters',
    department: 'Visitor Management',
    shift: 'Day Shift (08:30 - 17:30)',
    date: '2026-08-25',
    inTime: '08:25 AM',
    outTime: '05:30 PM',
    status: 'Present',
    workingHours: '9h 05m',
    overtime: '0h 00m'
  },
  {
    id: 'att-007',
    employeeCode: 'EMP024',
    employeeName: 'Mohan Lal',
    site: 'Production Unit 2',
    department: 'Safety & Emergency',
    shift: 'General Day (09:00 - 18:00)',
    date: '2026-08-25',
    inTime: '--',
    outTime: '--',
    status: 'Leave',
    workingHours: '0h 00m',
    overtime: '0h 00m'
  },
  {
    id: 'att-008',
    employeeCode: 'EMP030',
    employeeName: 'Rakesh Yadav',
    site: 'Warehouse Complex Block A',
    department: 'Security Operations',
    shift: 'Night Shift (20:00 - 05:00)',
    date: '2026-08-25',
    inTime: '--',
    outTime: '--',
    status: 'Absent',
    workingHours: '0h 00m',
    overtime: '0h 00m'
  },
  {
    id: 'att-009',
    employeeCode: 'EMP035',
    employeeName: 'Kavita Joshi',
    site: 'Administrative Headquarters',
    department: 'Visitor Management',
    shift: 'Day Shift (09:00 - 18:00)',
    date: '2026-08-25',
    inTime: '08:50 AM',
    outTime: '06:00 PM',
    status: 'Present',
    workingHours: '9h 10m',
    overtime: '0h 00m'
  }
];

export const CLIENT_BILLING_INVOICES = [
  {
    id: 'inv-001',
    invoiceNo: 'INV-2026-0801',
    billingPeriod: 'August 2026',
    issueDate: '2026-08-20',
    dueDate: '2026-09-05',
    totalManpowerCount: 125,
    grossAmount: 4230000,
    paidAmount: 3610000,
    pendingAmount: 620000,
    status: 'Pending',
    items: [
      { description: 'Security Personnel & Guard Deployment (110 Pax)', amount: 3300000 },
      { description: 'Supervisors & CCTV Surveillance Specialist (10 Pax)', amount: 450000 },
      { description: 'Armed Protection Team (5 Pax)', amount: 240000 },
      { description: 'Overtime & Night Differential Surcharge', amount: 240000 }
    ],
    taxes: {
      cgst: 190350,
      sgst: 190350,
      totalTax: 380700
    }
  },
  {
    id: 'inv-002',
    invoiceNo: 'INV-2026-0701',
    billingPeriod: 'July 2026',
    issueDate: '2026-07-20',
    dueDate: '2026-08-05',
    totalManpowerCount: 122,
    grossAmount: 4150000,
    paidAmount: 4150000,
    pendingAmount: 0,
    status: 'Paid',
    items: [
      { description: 'Security Personnel & Guard Deployment (108 Pax)', amount: 3240000 },
      { description: 'Supervisors & CCTV Surveillance Specialist (10 Pax)', amount: 450000 },
      { description: 'Armed Protection Team (4 Pax)', amount: 195000 },
      { description: 'Overtime & Holiday Differential', amount: 265000 }
    ],
    taxes: {
      cgst: 186750,
      sgst: 186750,
      totalTax: 373500
    }
  },
  {
    id: 'inv-003',
    invoiceNo: 'INV-2026-0601',
    billingPeriod: 'June 2026',
    issueDate: '2026-06-20',
    dueDate: '2026-07-05',
    totalManpowerCount: 120,
    grossAmount: 4080000,
    paidAmount: 4080000,
    pendingAmount: 0,
    status: 'Paid',
    items: [
      { description: 'Security Personnel & Guard Deployment (106 Pax)', amount: 3180000 },
      { description: 'Supervisors & Specialists (10 Pax)', amount: 450000 },
      { description: 'Armed Protection Team (4 Pax)', amount: 195000 },
      { description: 'Overtime Allowance', amount: 255000 }
    ],
    taxes: {
      cgst: 183600,
      sgst: 183600,
      totalTax: 367200
    }
  },
  {
    id: 'inv-004',
    invoiceNo: 'INV-2026-0501',
    billingPeriod: 'May 2026',
    issueDate: '2026-05-20',
    dueDate: '2026-06-05',
    totalManpowerCount: 118,
    grossAmount: 3990000,
    paidAmount: 3990000,
    pendingAmount: 0,
    status: 'Paid',
    items: [
      { description: 'Security Personnel & Guard Deployment (105 Pax)', amount: 3150000 },
      { description: 'Supervisors & CCTV Specialists (9 Pax)', amount: 405000 },
      { description: 'Armed Protection Team (4 Pax)', amount: 195000 },
      { description: 'Overtime & Festival Deployments', amount: 240000 }
    ],
    taxes: {
      cgst: 179550,
      sgst: 179550,
      totalTax: 359100
    }
  }
];

export const CLIENT_NOTIFICATIONS = [
  {
    id: 'cn-1',
    type: 'announcement',
    title: 'Monthly Attendance Report Published',
    message: 'The attendance report for August 2026 is now available for download.',
    date: '2026-08-25',
    time: '10:30 AM',
    unread: true
  },
  {
    id: 'cn-2',
    type: 'billing',
    title: 'Invoice Generated for August 2026',
    message: 'Invoice INV-2026-0801 for ₹42,30,000 has been generated. Due date is 05 Sep 2026.',
    date: '2026-08-20',
    time: '02:15 PM',
    unread: true
  },
  {
    id: 'cn-3',
    type: 'workforce',
    title: 'Workforce Deployment Shift Schedule Updated',
    message: 'The upcoming schedule for Warehouse Block A has been finalized.',
    date: '2026-08-18',
    time: '11:00 AM',
    unread: false
  },
  {
    id: 'cn-4',
    type: 'announcement',
    title: 'Statutory Compliance Acknowledgment Completed',
    message: 'PF and ESIC statutory challans for the previous billing cycle have been verified and archived.',
    date: '2026-08-14',
    time: '04:45 PM',
    unread: false
  }
];

export const CLIENT_REPORTS_METADATA = [
  {
    id: 'attendance-report',
    title: 'Attendance Report',
    description: 'Detailed daily and monthly attendance register, duty shifts, and working hours for your workforce.',
    accent: 'blue',
    iconName: 'ClipboardCheck',
    lastGenerated: '25 Aug 2026',
    recordCount: 125
  },
  {
    id: 'employee-master-report',
    title: 'Employee Master Report',
    description: 'Complete roster of verified security personnel, designations, site locations, and police verification status.',
    accent: 'cyan',
    iconName: 'Users',
    lastGenerated: '24 Aug 2026',
    recordCount: 125
  },
  {
    id: 'billing-report',
    title: 'Billing Report',
    description: 'Comprehensive financial breakdown of monthly manpower billing, taxes, overtime costs, and payment receipts.',
    accent: 'amber',
    iconName: 'Receipt',
    lastGenerated: '20 Aug 2026',
    recordCount: 4
  },
  {
    id: 'payroll-report',
    title: 'Payroll Summary Report',
    description: 'Read-only monthly summary of processed wages and statutory contributions for personnel deployed at your company.',
    accent: 'indigo',
    iconName: 'WalletCards',
    lastGenerated: '22 Aug 2026',
    recordCount: 118
  }
];
