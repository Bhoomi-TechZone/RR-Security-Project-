// NovaSpark HRMS — Role & Permissions Data Source
// Comprehensive permission model mapping Modules to Action-level permissions.

export const PERMISSION_ACTIONS = {
  VIEW: 'view',
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
  PRINT: 'print',
  GENERATE: 'generate',
  PROCESS: 'process',
  DOWNLOAD: 'download',
  ISSUE: 'issue',
  RETURN: 'return',
  POST: 'post',
};

export const PERMISSION_MODULES = [
  {
    key: 'employees',
    name: 'Employee Management',
    category: 'Workforce',
    description: 'Employee profiles, documentation, bank details, and assignments',
    actions: [
      { key: 'view', label: 'View', description: 'Browse and view employee records' },
      { key: 'add', label: 'Add', description: 'Onboard new employees' },
      { key: 'edit', label: 'Edit', description: 'Modify employee profile and documents' },
      { key: 'delete', label: 'Delete', description: 'Deactivate / delete employee records' },
      { key: 'export', label: 'Export', description: 'Export employee directory data' }
    ]
  },
  {
    key: 'attendance',
    name: 'Attendance Management',
    category: 'Operations',
    description: 'Daily biometric logs, shift attendance, correction requests, and muster roll',
    actions: [
      { key: 'view', label: 'View', description: 'View daily logs and monthly muster' },
      { key: 'add', label: 'Mark/Add', description: 'Manual entry of attendance' },
      { key: 'edit', label: 'Edit', description: 'Edit punch times & status' },
      { key: 'delete', label: 'Delete', description: 'Delete attendance entries' },
      { key: 'approve', label: 'Approve', description: 'Approve attendance corrections' }
    ]
  },
  {
    key: 'leave',
    name: 'Leave Management',
    category: 'Operations',
    description: 'Leave balance quotas, holiday calendars, and employee leave approvals',
    actions: [
      { key: 'view', label: 'View', description: 'View leave requests and balances' },
      { key: 'add', label: 'Apply/Add', description: 'Apply leave on behalf of employee' },
      { key: 'edit', label: 'Edit', description: 'Modify leave application' },
      { key: 'delete', label: 'Delete', description: 'Cancel/delete leave records' },
      { key: 'approve', label: 'Approve/Reject', description: 'Approve or reject leave requests' }
    ]
  },
  {
    key: 'overtime',
    name: 'Overtime Management',
    category: 'Operations',
    description: 'OT calculations, holiday hours, rate multipliers, and manager approvals',
    actions: [
      { key: 'view', label: 'View', description: 'View overtime hours & multipliers' },
      { key: 'add', label: 'Add', description: 'Record extra hours manually' },
      { key: 'edit', label: 'Edit', description: 'Adjust overtime hours and rates' },
      { key: 'delete', label: 'Delete', description: 'Remove overtime claims' },
      { key: 'approve', label: 'Approve/Reject', description: 'Authorize overtime payouts' }
    ]
  },
  {
    key: 'shifts',
    name: 'Shift Management',
    category: 'Operations',
    description: 'Roster scheduling, rotational shifts, site allocations and time slots',
    actions: [
      { key: 'view', label: 'View', description: 'View shift rosters and schedules' },
      { key: 'add', label: 'Create', description: 'Create shift templates & rosters' },
      { key: 'edit', label: 'Edit', description: 'Reassign shifts and time slots' },
      { key: 'delete', label: 'Delete', description: 'Delete rosters and shift slots' }
    ]
  },
  {
    key: 'inventory',
    name: 'Inventory Management',
    category: 'Operations',
    description: 'Uniforms, badges, safety equipment, issue history and return logs',
    actions: [
      { key: 'view', label: 'View', description: 'View inventory stock and logs' },
      { key: 'add', label: 'Add Item', description: 'Add inventory equipment to stock' },
      { key: 'edit', label: 'Edit', description: 'Update stock counts & descriptions' },
      { key: 'delete', label: 'Delete', description: 'Remove inventory items' },
      { key: 'issue', label: 'Issue Items', description: 'Assign items to employees' },
      { key: 'return', label: 'Return Items', description: 'Process equipment returns' }
    ]
  },
  {
    key: 'advances_loans',
    name: 'Advance & Loan Management',
    category: 'Payroll',
    description: 'Salary advance requests, EMI repayment schedules and deduction approvals',
    actions: [
      { key: 'view', label: 'View', description: 'View loan ledgers and requests' },
      { key: 'add', label: 'Request/Add', description: 'Create new advance or loan claim' },
      { key: 'edit', label: 'Edit', description: 'Modify EMI schedule & amount' },
      { key: 'delete', label: 'Delete', description: 'Delete loan entries' },
      { key: 'approve', label: 'Approve/Disburse', description: 'Approve advances and loan disbursements' }
    ]
  },
  {
    key: 'payroll',
    name: 'Payroll Management',
    category: 'Payroll',
    description: 'Salary structure templates, payroll generation, payslips and processing',
    actions: [
      { key: 'view', label: 'View', description: 'View payroll summaries & structures' },
      { key: 'generate', label: 'Run/Generate', description: 'Calculate monthly payroll' },
      { key: 'process', label: 'Process/Approve', description: 'Finalize and lock payroll period' },
      { key: 'download', label: 'Payslips/Export', description: 'Download salary slips & bank advice' }
    ]
  },
  {
    key: 'reports',
    name: 'Reports Management',
    category: 'Analytics',
    description: 'Statutory compliance (PF, ESI, PT), billing sheets, and attendance reports',
    actions: [
      { key: 'view', label: 'View', description: 'Browse and view compliance reports' },
      { key: 'generate', label: 'Generate', description: 'Build customized report queries' },
      { key: 'export', label: 'Export', description: 'Export to Excel/CSV spreadsheets' },
      { key: 'print', label: 'Print/PDF', description: 'Print official report summaries' }
    ]
  },
  {
    key: 'notifications',
    name: 'Notifications & Announcements',
    category: 'System',
    description: 'System alerts, broadcast announcements, audience targeting and reminders',
    actions: [
      { key: 'view', label: 'View', description: 'View announcements and alert logs' },
      { key: 'post', label: 'Post Announcement', description: 'Publish company-wide announcements' },
      { key: 'edit', label: 'Edit', description: 'Modify active announcements' },
      { key: 'delete', label: 'Delete', description: 'Remove alerts and notices' }
    ]
  },
  {
    key: 'companies',
    name: 'Company Management',
    category: 'Workforce',
    description: 'Client organizations, site branches, billing config and agreements',
    actions: [
      { key: 'view', label: 'View', description: 'View client companies and details' },
      { key: 'add', label: 'Add', description: 'Register new client companies' },
      { key: 'edit', label: 'Edit', description: 'Update company info, sites and rates' },
      { key: 'delete', label: 'Delete', description: 'Remove client organizations' }
    ]
  },
  {
    key: 'masters',
    name: 'Masters Setup',
    category: 'System',
    description: 'Banks, departments, designations, shifts, and client code masters',
    actions: [
      { key: 'view', label: 'View', description: 'View system masters' },
      { key: 'add', label: 'Add', description: 'Create master records' },
      { key: 'edit', label: 'Edit', description: 'Update master records' },
      { key: 'delete', label: 'Delete', description: 'Remove master entries' }
    ]
  }
];

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

// Initial Mock Roles
export const INITIAL_ROLES = [
  {
    id: 'role-admin',
    name: 'Admin',
    type: 'system',
    description: 'Full administrative access across all system modules and configurations',
    status: 'Active',
    createdOn: '2026-08-01',
    lastUpdated: '2026-08-25',
    isProtected: true,
    usersCount: 2,
    permissions: createFullPermissions()
  },
  {
    id: 'role-supervisor',
    name: 'Supervisor',
    type: 'custom',
    description: 'Operations field supervisor with attendance, shift and overtime management rights',
    status: 'Active',
    createdOn: '2026-08-02',
    lastUpdated: '2026-08-20',
    isProtected: false,
    usersCount: 8,
    permissions: {
      employees: ['view', 'add', 'edit'],
      attendance: ['view', 'add', 'edit', 'approve'],
      leave: ['view', 'add', 'approve'],
      overtime: ['view', 'add', 'edit', 'approve'],
      shifts: ['view', 'add', 'edit'],
      inventory: ['view', 'add', 'issue', 'return'],
      advances_loans: ['view'],
      payroll: ['view'],
      reports: ['view', 'export'],
      notifications: ['view', 'post'],
      companies: ['view'],
      masters: ['view']
    }
  },
  {
    id: 'role-hr-user',
    name: 'HR User',
    type: 'custom',
    description: 'Human resources operations including employee onboarding, leave management and announcements',
    status: 'Active',
    createdOn: '2026-08-03',
    lastUpdated: '2026-08-22',
    isProtected: false,
    usersCount: 4,
    permissions: {
      employees: ['view', 'add', 'edit', 'delete', 'export'],
      attendance: ['view', 'add', 'edit', 'approve'],
      leave: ['view', 'add', 'edit', 'delete', 'approve'],
      overtime: ['view', 'add', 'approve'],
      shifts: ['view', 'add'],
      inventory: ['view', 'issue', 'return'],
      advances_loans: ['view', 'add', 'approve'],
      payroll: ['view'],
      reports: ['view', 'generate', 'export', 'print'],
      notifications: ['view', 'post', 'edit', 'delete'],
      companies: ['view', 'add', 'edit'],
      masters: ['view', 'add', 'edit']
    }
  },
  {
    id: 'role-payroll-user',
    name: 'Payroll User',
    type: 'custom',
    description: 'Payroll calculations, salary structure configuration, and statutory reports',
    status: 'Active',
    createdOn: '2026-08-04',
    lastUpdated: '2026-08-23',
    isProtected: false,
    usersCount: 3,
    permissions: {
      employees: ['view'],
      attendance: ['view'],
      leave: ['view'],
      overtime: ['view'],
      shifts: ['view'],
      inventory: ['view'],
      advances_loans: ['view', 'add', 'edit', 'approve'],
      payroll: ['view', 'generate', 'process', 'download'],
      reports: ['view', 'generate', 'export', 'print'],
      notifications: ['view'],
      companies: ['view'],
      masters: ['view']
    }
  },
  {
    id: 'role-site-supervisor',
    name: 'Site Supervisor',
    type: 'custom',
    description: 'Site-level attendance verification, shift execution, and equipment tracking',
    status: 'Active',
    createdOn: '2026-08-05',
    lastUpdated: '2026-08-18',
    isProtected: false,
    usersCount: 1,
    permissions: {
      employees: ['view'],
      attendance: ['view', 'add', 'edit'],
      leave: ['view', 'add'],
      overtime: ['view', 'add'],
      shifts: ['view'],
      inventory: ['view', 'issue', 'return'],
      advances_loans: [],
      payroll: [],
      reports: ['view'],
      notifications: ['view'],
      companies: ['view'],
      masters: []
    }
  },
  {
    id: 'role-employee',
    name: 'Employee',
    type: 'system',
    description: 'Employee self-service scope (view own attendance, leave, salary slip and alerts)',
    status: 'Active',
    createdOn: '2026-08-01',
    lastUpdated: '2026-08-01',
    isProtected: true,
    usersCount: 45,
    permissions: {
      employees: [],
      attendance: ['view'],
      leave: ['view', 'add'],
      overtime: [],
      shifts: ['view'],
      inventory: [],
      advances_loans: [],
      payroll: ['view'],
      reports: [],
      notifications: ['view'],
      companies: [],
      masters: []
    }
  }
];

// Initial Assigned Users
export const INITIAL_USERS = [
  {
    id: 'usr-001',
    name: 'Vikramaditya Roy',
    initials: 'VR',
    email: 'v.roy@novaspark.com',
    employeeId: 'EMP099',
    company: 'NovaSpark HQ',
    roleId: 'role-admin',
    roleName: 'Admin',
    status: 'Active',
    assignedOn: '2026-08-01',
    avatarTone: 'primary'
  },
  {
    id: 'usr-002',
    name: 'Shalini Mehra',
    initials: 'SM',
    email: 'shalini.m@novaspark.com',
    employeeId: 'EMP098',
    company: 'NovaSpark HQ',
    roleId: 'role-admin',
    roleName: 'Admin',
    status: 'Active',
    assignedOn: '2026-08-01',
    avatarTone: 'primary'
  },
  {
    id: 'usr-003',
    name: 'Amit Kumar',
    initials: 'AK',
    email: 'amit.kumar@abcsec.com',
    employeeId: 'EMP001',
    company: 'ABC Security Services',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Active',
    assignedOn: '2026-08-02',
    avatarTone: 'info'
  },
  {
    id: 'usr-004',
    name: 'Rohit Singh',
    initials: 'RS',
    email: 'rohit.singh@xyzfacility.com',
    employeeId: 'EMP002',
    company: 'XYZ Facility Management',
    roleId: 'role-site-supervisor',
    roleName: 'Site Supervisor',
    status: 'Active',
    assignedOn: '2026-08-05',
    avatarTone: 'secondary'
  },
  {
    id: 'usr-005',
    name: 'Pooja Deshmukh',
    initials: 'PD',
    email: 'pooja.d@novaspark.com',
    employeeId: 'EMP088',
    company: 'NovaSpark HQ',
    roleId: 'role-hr-user',
    roleName: 'HR User',
    status: 'Active',
    assignedOn: '2026-08-08',
    avatarTone: 'success'
  },
  {
    id: 'usr-006',
    name: 'Neha Chawla',
    initials: 'NC',
    email: 'neha.c@novaspark.com',
    employeeId: 'EMP085',
    company: 'NovaSpark HQ',
    roleId: 'role-payroll-user',
    roleName: 'Payroll User',
    status: 'Active',
    assignedOn: '2026-08-10',
    avatarTone: 'warning'
  },
  {
    id: 'usr-007',
    name: 'Ramesh Patel',
    initials: 'RP',
    email: 'ramesh.p@suraksha.com',
    employeeId: 'EMP024',
    company: 'Suraksha Security Corp',
    roleId: 'role-site-supervisor',
    roleName: 'Site Supervisor',
    status: 'Active',
    assignedOn: '2026-08-12',
    avatarTone: 'secondary'
  },
  {
    id: 'usr-008',
    name: 'Karan Malhotra',
    initials: 'KM',
    email: 'karan.m@greenfield.com',
    employeeId: 'EMP032',
    company: 'Greenfield Services Ltd',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Active',
    assignedOn: '2026-08-14',
    avatarTone: 'info'
  },
  {
    id: 'usr-009',
    name: 'Sunita Rao',
    initials: 'SR',
    email: 'sunita.r@novaspark.com',
    employeeId: 'EMP081',
    company: 'NovaSpark HQ',
    roleId: 'role-hr-user',
    roleName: 'HR User',
    status: 'Active',
    assignedOn: '2026-08-15',
    avatarTone: 'success'
  },
  {
    id: 'usr-010',
    name: 'Deepak Joshi',
    initials: 'DJ',
    email: 'deepak.j@pqrhousekeeping.com',
    employeeId: 'EMP044',
    company: 'PQR Housekeeping Pvt Ltd',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Inactive',
    assignedOn: '2026-08-16',
    avatarTone: 'danger'
  }
];

// Helper calculations — strictly counts valid defined modules only
export const countRolePermissions = (role) => {
  if (!role || !role.permissions) return 0;
  const validModuleKeys = new Set(PERMISSION_MODULES.map(m => m.key));
  return Object.entries(role.permissions).reduce((sum, [modKey, actions]) => {
    if (!validModuleKeys.has(modKey)) return sum;
    return sum + (Array.isArray(actions) ? actions.length : 0);
  }, 0);
};

export const getEnabledModulesCount = (role) => {
  if (!role || !role.permissions) return 0;
  const validModuleKeys = new Set(PERMISSION_MODULES.map(m => m.key));
  return Object.entries(role.permissions).filter(([modKey, actions]) => {
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
  const validModuleKeys = new Set(PERMISSION_MODULES.map(m => m.key));

  Object.entries(role.permissions).forEach(([modKey, actions]) => {
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
