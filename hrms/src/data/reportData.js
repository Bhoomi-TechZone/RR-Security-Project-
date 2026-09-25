export const reportSummaryCards = [
  { label: 'Available Reports', value: '7', icon: 'FileBarChart', tone: 'blue' },
  { label: 'Generated Today', value: '18', icon: 'FileCheck', tone: 'green' },
  { label: 'Scheduled Reports', value: '4', icon: 'CalendarClock', tone: 'purple' },
  { label: 'Total Records', value: '12,480', icon: 'Database', tone: 'orange' }
];

export const reportCategories = [
  {
    id: 'attendance',
    name: 'Attendance Report',
    description: 'View employee attendance, working days, absences and attendance status.',
    records: 248,
    accent: 'blue'
  },
  {
    id: 'leave',
    name: 'Leave Report',
    description: 'View employee leave applications, leave types, dates and approval status.',
    records: 184,
    accent: 'green'
  },
  {
    id: 'overtime',
    name: 'Overtime Report',
    description: 'View employee overtime hours, rates and overtime amounts.',
    records: 96,
    accent: 'purple'
  },
  {
    id: 'payroll',
    name: 'Payroll Report',
    description: 'View salary processing, earnings, deductions and net payroll.',
    records: 1184,
    accent: 'indigo'
  },
  {
    id: 'employee',
    name: 'Employee Report',
    description: 'View employee information, client assignment and employment details.',
    records: 1250,
    accent: 'cyan'
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'View inventory stock, issued items and return history.',
    records: 428,
    accent: 'amber'
  },
  {
    id: 'advance-loan',
    name: 'Advance & Loan Report',
    description: 'View employee advances, loans, approvals and deduction history.',
    records: 248,
    accent: 'rose'
  }
];

export const reportActivity = [
  { label: 'Today', value: '18 reports', count: 18 },
  { label: 'This Week', value: '64 reports', count: 64 },
  { label: 'This Month', value: '248 reports', count: 248 }
];

export const mostUsedReports = [
  { name: 'Attendance Report', value: 84 },
  { name: 'Payroll Report', value: 72 },
  { name: 'Leave Report', value: 48 },
  { name: 'Overtime Report', value: 32 },
  { name: 'Inventory Report', value: 24 }
];

export const recentReports = [
  { id: 1, reportName: 'Attendance Report', generatedBy: 'Admin', generatedDate: '2026-08-24', records: 248, format: 'Excel', status: 'Completed' },
  { id: 2, reportName: 'Payroll Report', generatedBy: 'Admin', generatedDate: '2026-08-23', records: 1184, format: 'PDF', status: 'Completed' },
  { id: 3, reportName: 'Leave Report', generatedBy: 'HR Manager', generatedDate: '2026-08-22', records: 184, format: 'CSV', status: 'Completed' },
  { id: 4, reportName: 'Inventory Report', generatedBy: 'Admin', generatedDate: '2026-08-21', records: 428, format: 'Excel', status: 'Completed' },
  { id: 5, reportName: 'Overtime Report', generatedBy: 'Operations', generatedDate: '2026-08-21', records: 96, format: 'PDF', status: 'Completed' }
];

export const scheduledReports = [
  { id: 1, reportName: 'Attendance Report', frequency: 'Monthly', nextRun: '01 Sep 2026', status: 'Active' },
  { id: 2, reportName: 'Payroll Report', frequency: 'Monthly', nextRun: '01 Sep 2026', status: 'Active' },
  { id: 3, reportName: 'Leave Report', frequency: 'Weekly', nextRun: '28 Aug 2026', status: 'Paused' },
  { id: 4, reportName: 'Inventory Report', frequency: 'Monthly', nextRun: '05 Sep 2026', status: 'Active' }
];

export const reportPreviewDefaults = {
  attendance: {
    title: 'Attendance Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'ABC Security Services',
    department: 'Security',
    records: 248,
    summary: {
      totalEmployees: '1,250',
      present: '30,450',
      absent: '1,240',
      leave: '1,180'
    }
  },
  leave: {
    title: 'Leave Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'All Clients',
    department: 'All Departments',
    records: 248,
    summary: {
      totalRequests: '248',
      approved: '184',
      pending: '42',
      rejected: '22'
    }
  },
  overtime: {
    title: 'Overtime Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'All Clients',
    department: 'Security',
    records: 96,
    summary: {
      totalHours: '4,280 hrs',
      employees: '486',
      amount: '₹12,50,000'
    }
  },
  payroll: {
    title: 'Payroll Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'All Clients',
    department: 'All Departments',
    records: 1184,
    summary: {
      processed: '1,184',
      gross: '₹5,20,00,000',
      deductions: '₹37,50,000',
      net: '₹4,82,50,000'
    }
  },
  employee: {
    title: 'Employee Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'All Clients',
    department: 'All Departments',
    records: 1250,
    summary: {
      totalEmployees: '1,250',
      active: '1,184',
      inactive: '66',
      clients: '18'
    }
  },
  inventory: {
    title: 'Inventory Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'All Clients',
    department: 'All Departments',
    records: 428,
    summary: {
      totalItems: '428',
      available: '286',
      issued: '118',
      pending: '24'
    }
  },
  'advance-loan': {
    title: 'Advance & Loan Report',
    period: '01 Aug 2026 - 31 Aug 2026',
    client: 'All Clients',
    department: 'All Departments',
    records: 248,
    summary: {
      totalRequests: '248',
      approved: '184',
      pending: '42',
      outstanding: '₹9,82,500'
    }
  }
};
