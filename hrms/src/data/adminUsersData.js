// NovaSpark HRMS — Admin User Management Data Source
// Manages HRMS login users who access the system with role-based permissions.
// NOTE: Users inherit permissions directly from their assigned Role. (USER -> ROLE -> PERMISSIONS)

import { INITIAL_ROLES, PERMISSION_MODULES } from './rolesPermissionsData';

export const INITIAL_ADMIN_USERS = [
  {
    id: 'usr-101',
    userId: 'USR001',
    name: 'Amit Kumar',
    initials: 'AK',
    email: 'amit.kumar@novaspark.com',
    mobile: '+91 98765 43210',
    username: 'amit.kumar',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Active',
    createdOn: '2026-08-10',
    lastLogin: '2026-08-25 09:12 AM',
    avatarTone: 'info'
  },
  {
    id: 'usr-102',
    userId: 'USR002',
    name: 'Rohit Singh',
    initials: 'RS',
    email: 'rohit.singh@novaspark.com',
    mobile: '+91 98877 65432',
    username: 'rohit.singh',
    roleId: 'role-site-supervisor',
    roleName: 'Site Supervisor',
    status: 'Active',
    createdOn: '2026-08-12',
    lastLogin: '2026-08-25 08:45 AM',
    avatarTone: 'secondary'
  },
  {
    id: 'usr-103',
    userId: 'USR003',
    name: 'Neha Sharma',
    initials: 'NS',
    email: 'neha.sharma@novaspark.com',
    mobile: '+91 98765 43212',
    username: 'neha.sharma',
    roleId: 'role-hr-user',
    roleName: 'HR User',
    status: 'Active',
    createdOn: '2026-08-14',
    lastLogin: '2026-08-24 04:30 PM',
    avatarTone: 'success'
  },
  {
    id: 'usr-104',
    userId: 'USR004',
    name: 'Pooja Deshmukh',
    initials: 'PD',
    email: 'pooja.deshmukh@novaspark.com',
    mobile: '+91 97654 32101',
    username: 'pooja.deshmukh',
    roleId: 'role-hr-user',
    roleName: 'HR User',
    status: 'Active',
    createdOn: '2026-08-15',
    lastLogin: '2026-08-25 10:15 AM',
    avatarTone: 'success'
  },
  {
    id: 'usr-105',
    userId: 'USR005',
    name: 'Neha Chawla',
    initials: 'NC',
    email: 'neha.chawla@novaspark.com',
    mobile: '+91 96543 21092',
    username: 'neha.chawla',
    roleId: 'role-payroll-user',
    roleName: 'Payroll User',
    status: 'Active',
    createdOn: '2026-08-16',
    lastLogin: '2026-08-25 11:20 AM',
    avatarTone: 'warning'
  },
  {
    id: 'usr-106',
    userId: 'USR006',
    name: 'Ramesh Patel',
    initials: 'RP',
    email: 'ramesh.patel@novaspark.com',
    mobile: '+91 95432 10983',
    username: 'ramesh.patel',
    roleId: 'role-site-supervisor',
    roleName: 'Site Supervisor',
    status: 'Active',
    createdOn: '2026-08-16',
    lastLogin: '2026-08-24 07:30 PM',
    avatarTone: 'secondary'
  },
  {
    id: 'usr-107',
    userId: 'USR007',
    name: 'Karan Malhotra',
    initials: 'KM',
    email: 'karan.malhotra@novaspark.com',
    mobile: '+91 94321 09874',
    username: 'karan.malhotra',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Active',
    createdOn: '2026-08-17',
    lastLogin: '2026-08-25 09:00 AM',
    avatarTone: 'info'
  },
  {
    id: 'usr-108',
    userId: 'USR008',
    name: 'Sunita Rao',
    initials: 'SR',
    email: 'sunita.rao@novaspark.com',
    mobile: '+91 93210 98765',
    username: 'sunita.rao',
    roleId: 'role-hr-user',
    roleName: 'HR User',
    status: 'Active',
    createdOn: '2026-08-18',
    lastLogin: '2026-08-23 02:45 PM',
    avatarTone: 'success'
  },
  {
    id: 'usr-109',
    userId: 'USR009',
    name: 'Deepak Joshi',
    initials: 'DJ',
    email: 'deepak.joshi@novaspark.com',
    mobile: '+91 92109 87654',
    username: 'deepak.joshi',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Inactive',
    createdOn: '2026-08-18',
    lastLogin: '2026-08-20 11:30 AM',
    avatarTone: 'danger'
  },
  {
    id: 'usr-110',
    userId: 'USR010',
    name: 'Manoj Verma',
    initials: 'MV',
    email: 'manoj.verma@novaspark.com',
    mobile: '+91 91098 76543',
    username: 'manoj.verma',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Active',
    createdOn: '2026-08-19',
    lastLogin: '2026-08-25 08:15 AM',
    avatarTone: 'info'
  },
  {
    id: 'usr-111',
    userId: 'USR011',
    name: 'Vikramaditya Roy',
    initials: 'VR',
    email: 'v.roy@novaspark.com',
    mobile: '+91 99001 12233',
    username: 'vikram.roy',
    roleId: 'role-admin',
    roleName: 'Admin',
    status: 'Active',
    createdOn: '2026-08-01',
    lastLogin: '2026-08-26 09:30 AM',
    avatarTone: 'primary'
  },
  {
    id: 'usr-112',
    userId: 'USR012',
    name: 'Shalini Mehra',
    initials: 'SM',
    email: 'shalini.mehra@novaspark.com',
    mobile: '+91 99002 23344',
    username: 'shalini.mehra',
    roleId: 'role-admin',
    roleName: 'Admin',
    status: 'Active',
    createdOn: '2026-08-01',
    lastLogin: '2026-08-26 10:00 AM',
    avatarTone: 'primary'
  },
  {
    id: 'usr-113',
    userId: 'USR013',
    name: 'Ananya Sen',
    initials: 'AS',
    email: 'ananya.sen@novaspark.com',
    mobile: '+91 98112 34567',
    username: 'ananya.sen',
    roleId: 'role-payroll-user',
    roleName: 'Payroll User',
    status: 'Active',
    createdOn: '2026-08-20',
    lastLogin: '2026-08-25 03:20 PM',
    avatarTone: 'warning'
  },
  {
    id: 'usr-114',
    userId: 'USR014',
    name: 'Gaurav Kulkarni',
    initials: 'GK',
    email: 'gaurav.kulkarni@novaspark.com',
    mobile: '+91 97223 45678',
    username: 'gaurav.kulkarni',
    roleId: 'role-supervisor',
    roleName: 'Supervisor',
    status: 'Active',
    createdOn: '2026-08-21',
    lastLogin: '2026-08-25 09:40 AM',
    avatarTone: 'info'
  },
  {
    id: 'usr-115',
    userId: 'USR015',
    name: 'Priyanka Ghosh',
    initials: 'PG',
    email: 'priyanka.ghosh@novaspark.com',
    mobile: '+91 96334 56789',
    username: 'priyanka.ghosh',
    roleId: 'role-hr-user',
    roleName: 'HR User',
    status: 'Suspended',
    createdOn: '2026-08-21',
    lastLogin: '2026-08-22 01:10 PM',
    avatarTone: 'danger'
  },
  {
    id: 'usr-116',
    userId: 'USR016',
    name: 'Rajesh Chauhan',
    initials: 'RC',
    email: 'rajesh.chauhan@novaspark.com',
    mobile: '+91 95445 67890',
    username: 'rajesh.chauhan',
    roleId: 'role-site-supervisor',
    roleName: 'Site Supervisor',
    status: 'Active',
    createdOn: '2026-08-22',
    lastLogin: '2026-08-25 07:50 AM',
    avatarTone: 'secondary'
  },
  {
    id: 'usr-117',
    userId: 'USR017',
    name: 'Siddharth Saxena',
    initials: 'SS',
    email: 'siddharth.saxena@novaspark.com',
    mobile: '+91 94556 78901',
    username: 'siddharth.saxena',
    roleId: 'role-payroll-user',
    roleName: 'Payroll User',
    status: 'Active',
    createdOn: '2026-08-23',
    lastLogin: '2026-08-25 05:15 PM',
    avatarTone: 'warning'
  },
  {
    id: 'usr-118',
    userId: 'USR018',
    name: 'Harish Mehta',
    initials: 'HM',
    email: 'harish.mehta@novaspark.com',
    mobile: '+91 93667 89012',
    username: 'harish.mehta',
    roleId: 'role-site-supervisor',
    roleName: 'Site Supervisor',
    status: 'Inactive',
    createdOn: '2026-08-23',
    lastLogin: '2026-08-24 10:20 AM',
    avatarTone: 'secondary'
  }
];

// Helper to resolve inherited role permissions for a user
export const getUserPermissions = (user, rolesList = INITIAL_ROLES) => {
  if (!user) return {};
  const role = rolesList.find(r => r.id === user.roleId || r.name === user.roleName);
  return role ? role.permissions || {} : {};
};

// Helper to format a preview of permissions for a role
export const getRolePermissionsOverview = (role) => {
  if (!role || !role.permissions) return [];

  return PERMISSION_MODULES.map(mod => {
    const grantedActionKeys = role.permissions[mod.key] || [];
    const isEnabled = grantedActionKeys.length > 0;

    const actionLabels = mod.actions
      .filter(act => grantedActionKeys.includes(act.key))
      .map(act => act.label);

    return {
      moduleKey: mod.key,
      moduleName: mod.name,
      category: mod.category,
      description: mod.description,
      isEnabled,
      actionCount: grantedActionKeys.length,
      totalActions: mod.actions.length,
      actionLabels: actionLabels.length > 0 ? actionLabels.join(' / ') : 'No Access'
    };
  });
};
