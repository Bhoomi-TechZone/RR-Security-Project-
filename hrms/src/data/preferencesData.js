/**
 * Mock & Default Data for Admin Preferences Module
 */

export const mockEmployeePortalConfig = {
  enabled: true,
  allowDashboard: true,
  allowAttendance: true,
  allowApplyLeave: true,
  allowLeaveBalance: true,
  allowOvertime: true,
  allowSalarySlips: true,
  allowNotifications: true,
  allowProfile: true,
  announcementBanner: true,
  mobileAppAccess: true,
  lastUpdated: '2026-03-01 10:30 AM'
};

export const mockReportingManagerConfig = {
  viewAssignedEmployees: true,
  viewEmployeeAttendance: true,
  approveLeave: true,
  approveOvertime: true,
  viewOvertime: true,
  viewEmployeeDocuments: false,
  viewEmployeeReports: true,
  viewAssignedSiteBranchEmployees: true,
  allowShiftOverride: false,
  allowAttendanceRegularization: true,
  lastUpdated: '2026-03-01 11:15 AM'
};

export const mockEmailConfig = {
  enabled: true,
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  encryption: 'TLS', // 'None' | 'SSL' | 'TLS'
  smtpUsername: 'notifications@novasparkhrms.com',
  smtpPassword: '••••••••••••••••',
  fromEmail: 'noreply@novasparkhrms.com',
  fromName: 'NovaSpark HRMS Admin',
  replyToEmail: 'support@novasparkhrms.com',
  lastUpdated: '2026-02-28 04:45 PM'
};

export const mockNotificationConfig = {
  channels: {
    inApp: true,
    email: true
  },
  events: {
    attendance: {
      name: 'Attendance Notifications',
      description: 'Clock-in/out anomalies, miss punch alerts & shift roster releases',
      inApp: true,
      email: false
    },
    leave: {
      name: 'Leave Notifications',
      description: 'Leave application submission, approval, cancellation & balance alerts',
      inApp: true,
      email: true
    },
    overtime: {
      name: 'Overtime Notifications',
      description: 'Overtime requests, duty assignments & supervisor approvals',
      inApp: true,
      email: true
    },
    payroll: {
      name: 'Payroll Notifications',
      description: 'Monthly payroll run finalization & salary disbursement alerts',
      inApp: true,
      email: true
    },
    salarySlip: {
      name: 'Salary Slip Notifications',
      description: 'Payslip generation and monthly downloadable statement release',
      inApp: true,
      email: true
    },
    approval: {
      name: 'Approval Notifications',
      description: 'Action items pending manager/admin review & status escalations',
      inApp: true,
      email: true
    },
    system: {
      name: 'System Notifications',
      description: 'Security alerts, policy updates and organization announcements',
      inApp: true,
      email: true
    }
  },
  lastUpdated: '2026-03-02 09:00 AM'
};

export const mockApprovalConfig = {
  leave: {
    type: 'multi', // 'single' | 'multi'
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: true },
      { id: 'lvl-2', level: 2, role: 'HR', isMandatory: true }
    ],
    autoApprovalDays: 3,
    allowSelfApproval: false
  },
  overtime: {
    type: 'single',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: true }
    ],
    autoApprovalDays: 2,
    allowSelfApproval: false
  },
  reimbursement: {
    type: 'multi',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: true },
      { id: 'lvl-2', level: 2, role: 'HR', isMandatory: true },
      { id: 'lvl-3', level: 3, role: 'Accounts', isMandatory: true }
    ],
    autoApprovalDays: 5,
    allowSelfApproval: false
  },
  employeeRequests: {
    type: 'multi',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: false },
      { id: 'lvl-2', level: 2, role: 'HR', isMandatory: true },
      { id: 'lvl-3', level: 3, role: 'Admin', isMandatory: false }
    ],
    autoApprovalDays: 4,
    allowSelfApproval: false
  },
  lastUpdated: '2026-03-02 02:30 PM'
};

export const APPROVER_ROLES = [
  'Reporting Manager',
  'Supervisor',
  'HR',
  'Admin',
  'Accounts'
];
