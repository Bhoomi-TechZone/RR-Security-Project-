export const PERMISSION_ACTIONS = {
  VIEW: 'view',
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
  PRINT: 'print',
  ISSUE: 'issue',
  RETURN: 'return',
};

export const PERMISSION_MODULES = [
  // ==========================================
  // WORKFORCE
  // ==========================================
  {
    key: 'clients',
    name: 'Clients',
    category: 'Workforce',
    description: 'Client organizations, client agreements, billing details, active contracts, and deployment sites',
    actions: [
      { key: 'view', label: 'View', description: 'View client master and active accounts' },
      { key: 'add', label: 'Add', description: 'Register new client accounts and contracts' },
      { key: 'edit', label: 'Edit', description: 'Update client profiles, contracts and site allocations' },
      { key: 'delete', label: 'Delete', description: 'Deactivate or delete client accounts' },
      { key: 'export', label: 'Export', description: 'Export client list and contract records' }
    ]
  },
  {
    key: 'employees',
    name: 'Employees',
    category: 'Workforce',
    description: 'Workforce employee profiles, KYC documentation, bank accounts, assignments, and onboarding',
    actions: [
      { key: 'view', label: 'View', description: 'Browse employee directory and profiles' },
      { key: 'add', label: 'Add', description: 'Onboard and register new workforce employees' },
      { key: 'edit', label: 'Edit', description: 'Update employee profiles, documents, and banking' },
      { key: 'delete', label: 'Delete', description: 'Deactivate or delete employee records' },
      { key: 'export', label: 'Export', description: 'Export employee directory data' }
    ]
  },
  {
    key: 'attendance',
    name: 'Attendance',
    category: 'Workforce',
    description: 'Daily biometric logs, shift attendance, monthly muster roll, and attendance correction requests',
    actions: [
      { key: 'view', label: 'View', description: 'View daily attendance logs and monthly muster' },
      { key: 'add', label: 'Add / Mark', description: 'Manual entry of attendance records' },
      { key: 'edit', label: 'Edit', description: 'Modify punch times and attendance status' },
      { key: 'delete', label: 'Delete', description: 'Delete manual attendance records' },
      { key: 'approve', label: 'Approve', description: 'Approve or reject attendance corrections' },
      { key: 'export', label: 'Export', description: 'Export attendance reports and muster roll' }
    ]
  },
  {
    key: 'shifts',
    name: 'Shift Management',
    category: 'Workforce',
    description: 'Shift rosters, rotational scheduling, site allocations, calendar views, and shift patterns',
    actions: [
      { key: 'view', label: 'View', description: 'View shift schedules, rosters and calendars' },
      { key: 'add', label: 'Create', description: 'Create shift patterns and schedule rosters' },
      { key: 'edit', label: 'Edit', description: 'Reassign shifts, swap rosters and edit timings' },
      { key: 'delete', label: 'Delete', description: 'Delete shift rosters and pattern templates' },
      { key: 'export', label: 'Export', description: 'Export shift rosters and roster schedule' }
    ]
  },

  // ==========================================
  // PAYROLL MANAGEMENT
  // ==========================================
  {
    key: 'payroll',
    name: 'Payroll',
    category: 'Payroll Management',
    description: 'Monthly payroll processing, salary structures, rate revisions, arrears calculation, and payslips',
    actions: [
      { key: 'view', label: 'View', description: 'View payroll calculation and salary summaries' },
      { key: 'add', label: 'Run / Add', description: 'Initiate new payroll run / calculate payroll' },
      { key: 'edit', label: 'Edit', description: 'Adjust pay items, rate revisions and arrears' },
      { key: 'delete', label: 'Delete', description: 'Rollback or discard draft payroll batch' },
      { key: 'approve', label: 'Approve', description: 'Authorize, lock and finalize monthly payroll' },
      { key: 'export', label: 'Export', description: 'Download salary slips, bank advice & register' }
    ]
  },
  {
    key: 'payroll_setup',
    name: 'Payroll Setup',
    category: 'Payroll Management',
    description: 'Pay groups, pay schedules, pay cycles, cutoff days, and gross-to-net calculation methods',
    actions: [
      { key: 'view', label: 'View', description: 'View pay groups, cycles and calculation rules' },
      { key: 'add', label: 'Add', description: 'Create pay groups and custom pay schedules' },
      { key: 'edit', label: 'Edit', description: 'Configure calculation methods and cycle dates' },
      { key: 'delete', label: 'Delete', description: 'Remove unused pay groups or pay cycles' }
    ]
  },
  {
    key: 'statutory_setup',
    name: 'Statutory Setup',
    category: 'Payroll Management',
    description: 'PF (Provident Fund), ESI, Professional Tax (PT), TDS, Bonus, Gratuity, and LWF configurations',
    actions: [
      { key: 'view', label: 'View', description: 'View statutory rules, tax slabs and deduction formulas' },
      { key: 'add', label: 'Add', description: 'Configure new state rules or statutory slabs' },
      { key: 'edit', label: 'Edit', description: 'Modify contribution percentages, caps and exemptions' },
      { key: 'delete', label: 'Delete', description: 'Delete custom statutory rule sets' }
    ]
  },
  {
    key: 'advances_loans',
    name: 'Advances & Loans',
    category: 'Payroll Management',
    description: 'Salary advance requests, loan disbursement, EMI repayment schedules, and deduction history',
    actions: [
      { key: 'view', label: 'View', description: 'View advance & loan requests and EMI ledgers' },
      { key: 'add', label: 'Add / Request', description: 'Create advance request or loan application' },
      { key: 'edit', label: 'Edit', description: 'Adjust EMI repayment schedule and tenures' },
      { key: 'delete', label: 'Delete', description: 'Cancel or delete advance/loan records' },
      { key: 'approve', label: 'Approve', description: 'Approve and disburse advance / loan requests' }
    ]
  },
  {
    key: 'reimbursements',
    name: 'Reimbursements',
    category: 'Payroll Management',
    description: 'Expense claim submissions, bill attachments, expense type masters, and approval workflows',
    actions: [
      { key: 'view', label: 'View', description: 'View employee reimbursement claims and receipts' },
      { key: 'add', label: 'Add / Claim', description: 'Submit reimbursement claim on behalf of employee' },
      { key: 'edit', label: 'Edit', description: 'Modify expense claim items and amounts' },
      { key: 'delete', label: 'Delete', description: 'Delete pending or rejected expense claims' },
      { key: 'approve', label: 'Approve', description: 'Approve / reject reimbursement claims for payout' }
    ]
  },
  {
    key: 'overtime',
    name: 'Overtime',
    category: 'Payroll Management',
    description: 'Overtime tracking, holiday hour multipliers, client/dept analytics, and overtime payouts',
    actions: [
      { key: 'view', label: 'View', description: 'View recorded overtime hours and multipliers' },
      { key: 'add', label: 'Add', description: 'Log overtime hours manually' },
      { key: 'edit', label: 'Edit', description: 'Modify OT hours and multiplier rates' },
      { key: 'delete', label: 'Delete', description: 'Remove overtime entries' },
      { key: 'approve', label: 'Approve', description: 'Authorize overtime hours for payroll processing' }
    ]
  },

  // ==========================================
  // MANAGEMENT
  // ==========================================
  {
    key: 'leave',
    name: 'Leave',
    category: 'Management',
    description: 'Leave balance quotas, employee leave requests, leave masters, and leave calendar roster',
    actions: [
      { key: 'view', label: 'View', description: 'View leave requests, balances and calendar' },
      { key: 'add', label: 'Add / Apply', description: 'Apply leave on behalf of employee' },
      { key: 'edit', label: 'Edit', description: 'Modify leave applications and leave master rules' },
      { key: 'delete', label: 'Delete', description: 'Cancel or delete leave requests' },
      { key: 'approve', label: 'Approve', description: 'Approve or reject leave applications' }
    ]
  },
  {
    key: 'inventory',
    name: 'Inventory',
    category: 'Management',
    description: 'Security gear, uniforms, badges, equipment issue logs, return history, stock movements, and asset clearance',
    actions: [
      { key: 'view', label: 'View', description: 'View inventory stock, issued assets and return logs' },
      { key: 'add', label: 'Add Item', description: 'Add inventory items and stock batches' },
      { key: 'edit', label: 'Edit', description: 'Update stock counts, categories and item details' },
      { key: 'delete', label: 'Delete', description: 'Remove inventory stock entries' },
      { key: 'approve', label: 'Approve', description: 'Authorize asset clearance and disposal' },
      { key: 'issue', label: 'Issue Items', description: 'Assign items to employees' },
      { key: 'return', label: 'Return Items', description: 'Process equipment returns' }
    ]
  },
  {
    key: 'reports',
    name: 'Reports',
    category: 'Management',
    description: 'Attendance reports, payroll registers, billing reports, employee master summaries, and inventory logs',
    actions: [
      { key: 'view', label: 'View', description: 'Browse compliance and management reports' },
      { key: 'add', label: 'Generate', description: 'Build customized report filters and queries' },
      { key: 'export', label: 'Export', description: 'Export reports to Excel, CSV or PDF' },
      { key: 'print', label: 'Print', description: 'Print official compliance registers and statements' }
    ]
  },

  // ==========================================
  // SETTINGS
  // ==========================================
  {
    key: 'company_setup',
    name: 'Company Setup',
    category: 'Settings',
    description: 'Company profile, branding logo, employee code numbering, registered address, statutory tax IDs (PAN/TAN/GST), and regional settings',
    actions: [
      { key: 'view', label: 'View', description: 'Browse and view company profile and settings' },
      { key: 'edit', label: 'Edit / Update', description: 'Modify company details, tax registration, and configuration' },
      { key: 'export', label: 'Export', description: 'Export company profile and compliance info' }
    ]
  },
  {
    key: 'work_locations',
    name: 'Work Locations',
    category: 'Settings',
    description: 'Head office, branch offices, site locations, geofencing coordinates, and address management',
    actions: [
      { key: 'view', label: 'View', description: 'View all work locations and branch details' },
      { key: 'add', label: 'Add', description: 'Create new branch or work location' },
      { key: 'edit', label: 'Edit', description: 'Update location details, geofence, and contact info' },
      { key: 'delete', label: 'Delete', description: 'Remove branch or work location' }
    ]
  },
  {
    key: 'masters',
    name: 'Masters',
    category: 'Settings',
    description: 'Banks, clients, departments, designations, employee types, sites, posts, shifts, leave types, holidays, salary components, and document types',
    actions: [
      { key: 'view', label: 'View', description: 'View system configuration masters' },
      { key: 'add', label: 'Add', description: 'Add master records and lookup values' },
      { key: 'edit', label: 'Edit', description: 'Update master configurations and labels' },
      { key: 'delete', label: 'Delete', description: 'Remove master records' }
    ]
  },
  {
    key: 'roles_permissions',
    name: 'Role & Permissions',
    category: 'Settings',
    description: 'Security roles definition, permission matrix customization, and user role access mapping',
    actions: [
      { key: 'view', label: 'View', description: 'View configured roles and permission matrices' },
      { key: 'add', label: 'Add', description: 'Create new custom security roles' },
      { key: 'edit', label: 'Edit', description: 'Modify role permissions and access levels' },
      { key: 'delete', label: 'Delete', description: 'Delete custom security roles' }
    ]
  },
  {
    key: 'user_management',
    name: 'User Management',
    category: 'Settings',
    description: 'User accounts, login credentials, password resets, active/inactive user account status',
    actions: [
      { key: 'view', label: 'View', description: 'View user accounts and login access directory' },
      { key: 'add', label: 'Add', description: 'Create and invite new system users' },
      { key: 'edit', label: 'Edit', description: 'Update user profile, status and account settings' },
      { key: 'delete', label: 'Delete', description: 'Deactivate or delete user accounts' }
    ]
  },
  {
    key: 'preferences',
    name: 'Preferences',
    category: 'Settings',
    description: 'Employee portal preferences, manager permissions, email settings, notifications, and approval workflows',
    actions: [
      { key: 'view', label: 'View', description: 'View system preferences and policy configurations' },
      { key: 'edit', label: 'Edit', description: 'Configure portal access, approval thresholds and notifications' }
    ]
  },
  {
    key: 'templates',
    name: 'Templates',
    category: 'Settings',
    description: 'Salary slip templates, appointment letters, joining letters, experience letters, full & final settlement letters, and email templates',
    actions: [
      { key: 'view', label: 'View', description: 'View document and email letter templates' },
      { key: 'add', label: 'Add', description: 'Create new custom document templates' },
      { key: 'edit', label: 'Edit', description: 'Customize template layouts, variables and formatting' },
      { key: 'delete', label: 'Delete', description: 'Delete custom letter templates' }
    ]
  },
  {
    key: 'docs_compliance',
    name: 'Docs & Compliance',
    category: 'Settings',
    description: 'Document masters, verification rules, expiry alerts, police verification compliance, and tracking',
    actions: [
      { key: 'view', label: 'View', description: 'View document compliance standards and alerts' },
      { key: 'add', label: 'Add', description: 'Add compliance document types and verification rules' },
      { key: 'edit', label: 'Edit', description: 'Modify verification criteria, validity rules and alert triggers' },
      { key: 'delete', label: 'Delete', description: 'Remove compliance verification rules' },
      { key: 'approve', label: 'Approve', description: 'Verify and approve uploaded compliance documents' }
    ]
  },
  {
    key: 'notifications',
    name: 'Notifications',
    category: 'Settings',
    description: 'Company-wide announcements, broadcast messages, alert notifications, and audience targeting',
    actions: [
      { key: 'view', label: 'View', description: 'View announcements and notification history' },
      { key: 'add', label: 'Add / Post', description: 'Create and broadcast new announcements' },
      { key: 'edit', label: 'Edit', description: 'Modify active announcements and alerts' },
      { key: 'delete', label: 'Delete', description: 'Remove announcements and alerts' }
    ]
  }
];

// Module key aliasing for backward compatibility with previously stored roles
const LEGACY_KEY_MAP = {
  'companies': 'clients',
  'role_permissions': 'roles_permissions',
};

// Helper to normalize permissions object across legacy and current keys
export const normalizePermissions = (permissions = {}) => {
  if (!permissions) return {};
  const normalized = { ...permissions };
  Object.entries(LEGACY_KEY_MAP).forEach(([oldKey, newKey]) => {
    if (normalized[oldKey] && !normalized[newKey]) {
      normalized[newKey] = normalized[oldKey];
    }
  });
  return normalized;
};

// Helper to create full permissions set
export const createFullPermissions = () => {
  const perms = {};
  PERMISSION_MODULES.forEach(mod => {
    perms[mod.key] = mod.actions.map(act => act.key);
  });
  return perms;
};

// Helper to create empty permissions set
export const createEmptyPermissions = () => {
  const perms = {};
  PERMISSION_MODULES.forEach(mod => {
    perms[mod.key] = [];
  });
  return perms;
};

// Initial Mock Roles (Empty - purely dynamic from MongoDB database)
export const INITIAL_ROLES = [];

// Initial Assigned Users (Empty - purely dynamic from MongoDB database)
export const INITIAL_USERS = [];

// Helper calculations — strictly counts valid defined modules only
export const countRolePermissions = (role) => {
  if (!role || !role.permissions) return 0;
  const perms = normalizePermissions(role.permissions);
  const validModuleKeys = new Set(PERMISSION_MODULES.map(m => m.key));
  return Object.entries(perms).reduce((sum, [modKey, actions]) => {
    if (!validModuleKeys.has(modKey)) return sum;
    return sum + (Array.isArray(actions) ? actions.length : 0);
  }, 0);
};

export const getEnabledModulesCount = (role) => {
  if (!role || !role.permissions) return 0;
  const perms = normalizePermissions(role.permissions);
  const validModuleKeys = new Set(PERMISSION_MODULES.map(m => m.key));
  return Object.entries(perms).filter(([modKey, actions]) => {
    return validModuleKeys.has(modKey) && Array.isArray(actions) && actions.length > 0;
  }).length;
};

export const getActionCounts = (role) => {
  const counts = {
    view: 0,
    add: 0,
    edit: 0,
    delete: 0,
    approve: 0,
    other: 0,
    total: 0
  };

  if (!role || !role.permissions) return counts;
  const perms = normalizePermissions(role.permissions);
  const validModuleKeys = new Set(PERMISSION_MODULES.map(m => m.key));

  Object.entries(perms).forEach(([modKey, actions]) => {
    if (validModuleKeys.has(modKey) && Array.isArray(actions)) {
      actions.forEach(action => {
        counts.total += 1;
        if (action === 'view') counts.view += 1;
        else if (action === 'add') counts.add += 1;
        else if (action === 'edit') counts.edit += 1;
        else if (action === 'delete') counts.delete += 1;
        else if (action === 'approve') counts.approve += 1;
        else counts.other += 1;
      });
    }
  });

  return counts;
};

