export const employeeDashboardData = {
  employee: {
    name: 'Rahul Kumar',
    employeeId: 'EMP001',
    designation: 'Security Guard',
    department: 'Security',
    company: 'ABC Security Services',
    initials: 'RK'
  },
  summary: {
    presentDays: 26,
    leaveBalance: 8,
    totalLeaveRequests: 3,
    pendingLeaveRequests: 1,
    overtimeHours: 18,
    lastSalary: 32300,
    presentMonth: 'August 2026'
  },
  todayAttendance: {
    date: '25 August 2026',
    status: 'Present',
    checkIn: '09:12 AM',
    checkOut: '06:18 PM',
    workingHours: '09h 06m'
  },
  attendance: {
    workingDays: 31,
    presentDays: 26,
    absentDays: 2,
    leaveDays: 3,
    percentage: 83.87,
    month: 'August 2026',
    trend: [
      { label: 'Mon', percentage: 92, hours: '9.2h' },
      { label: 'Tue', percentage: 96, hours: '9.0h' },
      { label: 'Wed', percentage: 88, hours: '8.5h' },
      { label: 'Thu', percentage: 94, hours: '9.4h' },
      { label: 'Fri', percentage: 98, hours: '9.6h' },
      { label: 'Sat', percentage: 85, hours: '7.5h' },
      { label: 'Sun', percentage: 0, hours: 'Off' }
    ]
  },
  leaveBalance: {
    casual: 4,
    sick: 2,
    earned: 2,
    total: 8
  },
  leaveRequests: [
    {
      id: 1,
      type: 'Casual Leave',
      from: '20 Aug 2026',
      to: '22 Aug 2026',
      days: '3 Days',
      status: 'Approved'
    },
    {
      id: 2,
      type: 'Sick Leave',
      from: '10 Aug 2026',
      to: '11 Aug 2026',
      days: '2 Days',
      status: 'Rejected'
    },
    {
      id: 3,
      type: 'Casual Leave',
      from: '28 Aug 2026',
      to: '29 Aug 2026',
      days: '2 Days',
      status: 'Pending'
    }
  ],
  salary: {
    month: 'August 2026',
    gross: 36500,
    deductions: 4200,
    net: 32300,
    status: 'Processed'
  },
  notifications: [
    {
      id: 1,
      type: 'leave-approval',
      title: 'Leave Approved',
      description: 'Your leave request has been approved.',
      date: '25 Aug 2026',
      unread: true
    },
    {
      id: 2,
      type: 'salary-processed',
      title: 'Salary Processed',
      description: 'Your August salary has been processed.',
      date: '24 Aug 2026',
      unread: false
    },
    {
      id: 3,
      type: 'document-expiry',
      title: 'Document Expiry',
      description: 'Your ID document is approaching expiry.',
      date: '20 Aug 2026',
      unread: true
    },
    {
      id: 4,
      type: 'leave-approval',
      title: 'Attendance Reminder',
      description: 'Please ensure your attendance is updated timely.',
      date: '18 Aug 2026',
      unread: false
    }
  ],
  attendanceCalendar: [
    { day: 'Mon', date: 1, status: 'present' },
    { day: 'Tue', date: 2, status: 'present' },
    { day: 'Wed', date: 3, status: 'present' },
    { day: 'Thu', date: 4, status: 'present' },
    { day: 'Fri', date: 5, status: 'present' },
    { day: 'Sat', date: 6, status: 'weekend' },
    { day: 'Sun', date: 7, status: 'weekend' },
    { day: 'Mon', date: 8, status: 'present' },
    { day: 'Tue', date: 9, status: 'present' },
    { day: 'Wed', date: 10, status: 'present' },
    { day: 'Thu', date: 11, status: 'present' },
    { day: 'Fri', date: 12, status: 'present' },
    { day: 'Sat', date: 13, status: 'weekend' },
    { day: 'Sun', date: 14, status: 'weekend' },
    { day: 'Mon', date: 15, status: 'present' },
    { day: 'Tue', date: 16, status: 'leave' },
    { day: 'Wed', date: 17, status: 'present' },
    { day: 'Thu', date: 18, status: 'present' },
    { day: 'Fri', date: 19, status: 'absent' },
    { day: 'Sat', date: 20, status: 'weekend' },
    { day: 'Sun', date: 21, status: 'weekend' },
    { day: 'Mon', date: 22, status: 'leave' },
    { day: 'Tue', date: 23, status: 'present' },
    { day: 'Wed', date: 24, status: 'present' },
    { day: 'Thu', date: 25, status: 'present' },
    { day: 'Fri', date: 26, status: 'present' },
    { day: 'Sat', date: 27, status: 'weekend' },
    { day: 'Sun', date: 28, status: 'weekend' },
    { day: 'Mon', date: 29, status: 'present' },
    { day: 'Tue', date: 30, status: 'present' },
    { day: 'Wed', date: 31, status: 'absent' }
  ]
};
