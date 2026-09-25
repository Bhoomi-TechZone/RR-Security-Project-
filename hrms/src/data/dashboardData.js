// Mock Data for NovaSpark HRMS Admin Dashboard

export const kpiData = [
  {
    id: 'employees',
    title: 'Total Employees',
    value: '1,250',
    trend: '+12.5%',
    trendType: 'up',
    subtext: 'from last month',
    iconName: 'Users',
  },
  {
    id: 'attendance',
    title: 'Active Employees',
    value: '1,120',
    trend: '+4.8%',
    trendType: 'up',
    subtext: 'from last month',
    iconName: 'UserCheck',
  },
  {
    id: 'male-employees',
    title: 'Male Employees',
    value: '760',
    trend: '+3.1%',
    trendType: 'up',
    subtext: 'of total workforce',
    iconName: 'Mars',
  },
  {
    id: 'female-employees',
    title: 'Female Employees',
    value: '490',
    trend: '+5.6%',
    trendType: 'up',
    subtext: 'of total workforce',
    iconName: 'Venus',
  },
  {
    id: 'leave',
    title: 'New Joinee',
    value: '18',
    trend: '+6 this month',
    trendType: 'up',
    subtext: 'welcome additions',
    iconName: 'UserPlus',
  },
];

export const attendanceTrendData = [
  { day: 'Mon', percentage: 92, label: '92%' },
  { day: 'Tue', percentage: 95, label: '95%' },
  { day: 'Wed', percentage: 89, label: '89%' },
  { day: 'Thu', percentage: 94, label: '94%' },
  { day: 'Fri', percentage: 96, label: '96%' },
  { day: 'Sat', percentage: 91, label: '91%' },
  { day: 'Sun', percentage: 93, label: '93%' },
];

export const employeeDistributionData = [
  { role: 'Security Operations', count: 810 },
  { role: 'Housekeeping', count: 320 },
  { role: 'Admin & HR', count: 115 },
  { role: 'Accounts & Finance', count: 85 },
  { role: 'Maintenance', count: 75 },
  { role: 'Others', count: 126 },
];

export const leaveRequestsData = [
  {
    id: 'leave-1',
    employee: 'Rahul Kumar',
    type: 'Casual Leave',
    days: 2,
    status: 'Pending',
    avatarInitials: 'RK',
  },
  {
    id: 'leave-2',
    employee: 'Amit Sharma',
    type: 'Sick Leave',
    days: 1,
    status: 'Pending',
    avatarInitials: 'AS',
  },
  {
    id: 'leave-3',
    employee: 'Raj Kumar',
    type: 'Earned Leave',
    days: 3,
    status: 'Pending',
    avatarInitials: 'RK',
  },
];

export const recentActivitiesData = [
  {
    id: 'act-1',
    message: 'Payroll for May 2025 has been processed.',
    time: '26 May 2025 10:30 AM',
    type: 'payroll',
    tag: 'Success',
  },
  {
    id: 'act-2',
    message: 'New Employee RRSF-1532 (Amit Kumar) Joined.',
    time: '26 May 2025 09:15 AM',
    type: 'employee',
    tag: 'New Joiner',
  },
  {
    id: 'act-3',
    message: 'Leave Approved for RRSF-1287 (Sandeep Singh)',
    time: '26 May 2025 09:00 AM',
    type: 'leave',
    tag: 'Leave',
  },
  {
    id: 'act-4',
    message: 'Attendance Marked for 1421 Employees.',
    time: '26 May 2025 08:45 AM',
    type: 'attendance',
    tag: 'Attendance',
  },
];

export const payrollSummaryData = {
  month: 'August 2026',
  grossSalary: '₹48,50,000',
  deductions: '₹6,20,000',
  netPayable: '₹42,30,000',
  processedCount: 1210,
  totalCount: 1250,
  percentage: 96.8,
};

export const clientWisePayrollData = [
  {
    id: 'c001',
    clientName: 'ABC Security Services',
    month: 'August 2026',
    grossSalary: '₹22,50,000',
    deductions: '₹2,85,000',
    netPayable: '₹19,65,000',
    processedCount: 310,
    totalCount: 320,
    percentage: 96.9,
  },
  {
    id: 'c002',
    clientName: 'XYZ Facility Management',
    month: 'August 2026',
    grossSalary: '₹26,00,000',
    deductions: '₹3,35,000',
    netPayable: '₹22,65,000',
    processedCount: 450,
    totalCount: 450,
    percentage: 100.0,
  },
];

export const upcomingRemindersData = [
  {
    id: 'pf',
    label: 'PF Payment Due',
    date: '15 Jun 2025',
    daysLeft: 20,
    urgency: 'medium',
  },
  {
    id: 'esi',
    label: 'ESI Payment Due',
    date: '15 Jun 2025',
    daysLeft: 20,
    urgency: 'medium',
  },
  {
    id: 'pt',
    label: 'Professional Tax',
    date: '20 Jun 2025',
    daysLeft: 25,
    urgency: 'low',
  },
  {
    id: 'tds',
    label: 'TDS Return Filing',
    date: '30 Jun 2025',
    daysLeft: 35,
    urgency: 'safe',
  },
  {
    id: 'it',
    label: 'Income Tax Payment',
    date: '30 Jun 2025',
    daysLeft: 35,
    urgency: 'safe',
  },
];

