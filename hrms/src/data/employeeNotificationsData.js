// NovaSpark HRMS — Employee Notifications & Announcements Data
// Personal notifications for the logged-in employee: EMP001 (Rahul Kumar).
// DO NOT include other employees' personal notifications.
// Announcements that are audience="all" or audience="employees" are visible here.

// ─── System Alerts (personal to EMP001) ────────────────────────────────────
export const employeeAlerts = [
  {
    id: 'alert-1',
    type: 'leave',
    title: 'Leave Approved',
    description:
      'Your Casual Leave request from 20 Aug 2026 to 22 Aug 2026 has been approved.',
    date: '2026-08-25',
    time: '10:32 AM',
    read: false,
    priority: 'normal',
    details: {
      leaveType: 'Casual Leave',
      from: '20 August 2026',
      to: '22 August 2026',
      days: 3,
      status: 'Approved',
    },
  },
  {
    id: 'alert-2',
    type: 'salary',
    title: 'Salary Processed',
    description: 'Your salary for August 2026 has been processed successfully.',
    date: '2026-08-24',
    time: '04:15 PM',
    read: false,
    priority: 'normal',
    details: {
      salaryMonth: 'August 2026',
      status: 'Processed',
      processedDate: '24 August 2026',
      netSalary: '₹32,300',
    },
  },
  {
    id: 'alert-3',
    type: 'document',
    title: 'Document Expiry Alert',
    description: 'Your Police Verification document is approaching its expiry date.',
    date: '2026-08-22',
    time: '09:20 AM',
    read: false,
    priority: 'important',
    details: {
      document: 'Police Verification',
      expiryDate: '30 September 2026',
      status: 'Expiring Soon',
    },
  },
  {
    id: 'alert-4',
    type: 'leave',
    title: 'Leave Rejected',
    description:
      'Your Sick Leave request from 10 Aug 2026 to 11 Aug 2026 has been rejected.',
    date: '2026-08-11',
    time: '11:45 AM',
    read: true,
    priority: 'normal',
    details: {
      leaveType: 'Sick Leave',
      from: '10 August 2026',
      to: '11 August 2026',
      days: 2,
      status: 'Rejected',
      rejectionReason: 'Insufficient leave balance for the requested period.',
    },
  },
  {
    id: 'alert-5',
    type: 'salary',
    title: 'Salary Processed',
    description: 'Your salary for July 2026 has been processed successfully.',
    date: '2026-07-25',
    time: '03:30 PM',
    read: true,
    priority: 'normal',
    details: {
      salaryMonth: 'July 2026',
      status: 'Processed',
      processedDate: '25 July 2026',
      netSalary: '₹31,800',
    },
  },
  {
    id: 'alert-6',
    type: 'leave',
    title: 'Leave Approved',
    description:
      'Your Earned Leave request from 15 Jul 2026 to 16 Jul 2026 has been approved.',
    date: '2026-07-14',
    time: '02:10 PM',
    read: true,
    priority: 'normal',
    details: {
      leaveType: 'Earned Leave',
      from: '15 July 2026',
      to: '16 July 2026',
      days: 2,
      status: 'Approved',
    },
  },
  {
    id: 'alert-7',
    type: 'document',
    title: 'ID Verification Reminder',
    description: 'Please submit your updated Aadhaar card copy to HR.',
    date: '2026-07-10',
    time: '10:00 AM',
    read: true,
    priority: 'normal',
    details: {
      document: 'Aadhaar Card',
      expiryDate: null,
      status: 'Action Required',
    },
  },
];

// ─── Admin Announcements (audience: all / employees) ──────────────────────
// Only published announcements targeting all or employees are shown.
export const employeeAnnouncements = [
  {
    id: 'ann-1',
    type: 'announcement',
    title: 'Company Holiday Notice',
    description: 'The office will remain closed on 27 August 2026 for the company holiday.',
    date: '2026-08-25',
    time: '09:00 AM',
    read: false,
    priority: 'important',
    details: {
      effectiveFrom: '27 August 2026',
      message:
        'The office will remain closed on 27 August 2026 (Wednesday) on account of the company-wide holiday. All employees are advised to plan their work accordingly.',
      postedBy: 'Admin',
      postedDate: '25 August 2026',
      audience: 'All Employees',
    },
  },
  {
    id: 'ann-2',
    type: 'announcement',
    title: 'Important Attendance Update',
    description: 'All employees must ensure attendance is marked before 9:00 AM daily.',
    date: '2026-08-22',
    time: '10:00 AM',
    read: true,
    priority: 'normal',
    details: {
      effectiveFrom: '23 August 2026',
      message:
        'All employees must ensure their attendance is marked before 9:00 AM daily. Late logins will be tracked and reported to the respective supervisors. Please follow the updated attendance policy strictly.',
      postedBy: 'Admin',
      postedDate: '22 August 2026',
      audience: 'All Employees',
    },
  },
  {
    id: 'ann-3',
    type: 'announcement',
    title: 'Leave Policy Reminder',
    description: 'All leave applications must be submitted at least 3 working days in advance.',
    date: '2026-08-10',
    time: '11:30 AM',
    read: true,
    priority: 'normal',
    details: {
      effectiveFrom: '11 August 2026',
      message:
        'This is a reminder that all leave applications must be submitted at least 3 working days in advance through the HRMS portal. Emergency leaves should be communicated immediately to the supervisor and HR.',
      postedBy: 'Admin',
      postedDate: '10 August 2026',
      audience: 'All Employees',
    },
  },
];

// ─── Combined feed (alerts + announcements, sorted by date desc) ──────────
export const allEmployeeNotifications = [...employeeAlerts, ...employeeAnnouncements].sort(
  (a, b) => new Date(b.date) - new Date(a.date),
);

// ─── Helper: friendly date ─────────────────────────────────────────────────
export function friendlyDate(isoDate) {
  if (!isoDate) return '—';
  const today = new Date('2026-08-26'); // simulated "today"
  const d = new Date(isoDate);
  const diffDays = Math.floor((today - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
