import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardCheck,
  CalendarDays,
  CalendarOff,
  Timer,
  Package,
  HandCoins,
  WalletCards,
  BarChart3,
  Bell,
  LogOut,
  Zap,
  Shield,
  SlidersHorizontal,
  Landmark,
  Receipt,
  MapPin,
  Settings2,
  ShieldCheck,
  UserCog,
  FileText,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import styles from './UserSidebar.module.css';
import Avatar from '../common/Avatar';
import { usePermissions } from '../../context/PermissionContext';
import { useCompany } from '../../context/CompanyContext';

// Navigation groups & module definitions mapping for User Panel
const USER_NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      {
        path: '/user/dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        isAlwaysVisible: true
      }
    ]
  },
  {
    title: 'WORKFORCE',
    items: [
      { 
        path: '/user/clients', 
        name: 'Clients', 
        icon: Building2, 
        moduleKey: 'clients',
        hasDropdown: true,
        subItems: [
          { path: '/user/clients', name: 'All Clients' },
          { path: '/user/clients?status=active', name: 'Active Clients' },
          { path: '/user/clients?status=inactive', name: 'Inactive Clients' },
        ]
      },
      { 
        path: '/user/employees', 
        name: 'Employees', 
        icon: Users, 
        moduleKey: 'employees',
        hasDropdown: true,
        subItems: [
          { path: '/user/employees', name: 'All Employees' },
          { path: '/user/employees?status=active', name: 'Active Employees' },
          { path: '/user/employees?status=inactive', name: 'Inactive Employees' },
        ]
      },
      { 
        path: '/user/attendance', 
        name: 'Attendance', 
        icon: ClipboardCheck, 
        moduleKey: 'attendance',
        hasDropdown: true,
        subItems: [
          { path: '/user/attendance', name: 'Daily Attendance' },
          { path: '/user/attendance?tab=corrections', name: 'Correction Requests' },
        ]
      },
      { 
        path: '/user/shifts', 
        name: 'Shift Management', 
        icon: CalendarDays, 
        moduleKey: 'shifts',
        hasDropdown: true,
        subItems: [
          { path: '/user/shifts', name: 'Shift Roster' },
          { path: '/user/shifts?tab=patterns', name: 'Shift Patterns' },
          { path: '/user/shifts?tab=calendar', name: 'Calendar View' },
        ]
      }
    ]
  },
  {
    title: 'PAYROLL MANAGEMENT',
    items: [
      { 
        path: '/user/payroll', 
        name: 'Payroll', 
        icon: WalletCards, 
        moduleKey: 'payroll',
        hasDropdown: true,
        subItems: [
          { path: '/user/payroll', name: 'Payroll Processing' },
          { path: '/user/payroll?tab=structure', name: 'Salary Structure' },
          { path: '/user/payroll?tab=rate-revision', name: 'Rate Revision' },
          { path: '/user/payroll?tab=arrears', name: 'Arrears' },
          { path: '/user/payroll?tab=slips', name: 'Salary Slips' },
          { path: '/user/payroll?tab=statutory', name: 'Statutory Reports' },
        ]
      },
      { 
        path: '/user/payroll-setup', 
        name: 'Payroll Setup', 
        icon: SlidersHorizontal, 
        moduleKey: 'payroll_setup',
        hasDropdown: true,
        subItems: [
          { path: '/user/payroll-setup', name: 'Pay Groups' },
          { path: '/user/payroll-setup?tab=pay-schedules', name: 'Pay Schedules' },
          { path: '/user/payroll-setup?tab=pay-cycles', name: 'Pay Cycles' },
          { path: '/user/payroll-setup?tab=pay-days', name: 'Pay Days' },
          { path: '/user/payroll-setup?tab=calculation-methods', name: 'Calculation Methods' },
        ]
      },
      { 
        path: '/user/statutory-setup', 
        name: 'Statutory Setup', 
        icon: Landmark, 
        moduleKey: 'statutory_setup',
        hasDropdown: true,
        subItems: [
          { path: '/user/statutory-setup', name: 'Overview' },
          { path: '/user/statutory-setup?tab=pf', name: 'PF (Provident Fund)' },
          { path: '/user/statutory-setup?tab=esi', name: 'ESI' },
          { path: '/user/statutory-setup?tab=pt', name: 'Professional Tax (PT)' },
          { path: '/user/statutory-setup?tab=tds', name: 'TDS' },
          { path: '/user/statutory-setup?tab=bonus', name: 'Bonus' },
          { path: '/user/statutory-setup?tab=gratuity', name: 'Gratuity' },
          { path: '/user/statutory-setup?tab=lwf', name: 'Labour Welfare Fund (LWF)' },
        ]
      },
      { 
        path: '/user/advances-loans', 
        name: 'Advances & Loans', 
        icon: HandCoins, 
        moduleKey: 'advances_loans',
        hasDropdown: true,
        subItems: [
          { path: '/user/advances-loans', name: 'All Requests' },
          { path: '/user/advances-loans?tab=advances', name: 'Advances' },
          { path: '/user/advances-loans?tab=loans', name: 'Loans' },
          { path: '/user/advances-loans?tab=schedule', name: 'Deduction Schedule' },
          { path: '/user/advances-loans?tab=history', name: 'Deduction History' },
        ]
      },
      { 
        path: '/user/reimbursements', 
        name: 'Reimbursements', 
        icon: Receipt, 
        moduleKey: 'reimbursements',
        hasDropdown: true,
        subItems: [
          { path: '/user/reimbursements', name: 'All Claims' },
          { path: '/user/reimbursements?status=pending', name: 'Pending Approvals' },
          { path: '/user/reimbursements?tab=expense-types', name: 'Expense Types Master' },
          { path: '/user/reimbursements?tab=reports', name: 'Reports & Analytics' },
        ]
      },
      { 
        path: '/user/overtime', 
        name: 'Overtime', 
        icon: Timer, 
        moduleKey: 'overtime',
        hasDropdown: true,
        subItems: [
          { path: '/user/overtime', name: 'All Overtime' },
          { path: '/user/overtime?tab=requests', name: 'Pending Approvals' },
          { path: '/user/overtime?tab=history', name: 'Overtime History' },
          { path: '/user/overtime?tab=analytics', name: 'Client & Dept Analytics' },
        ]
      }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { 
        path: '/user/leave', 
        name: 'Leave', 
        icon: CalendarOff, 
        moduleKey: 'leave',
        hasDropdown: true,
        subItems: [
          { path: '/user/leave', name: 'Leave Requests' },
          { path: '/user/leave?tab=balances', name: 'Employee Balances' },
          { path: '/user/leave?tab=master', name: 'Leave Master' },
          { path: '/user/leave?tab=calendar', name: 'Roster & Calendar' },
        ]
      },
      { 
        path: '/user/inventory', 
        name: 'Inventory', 
        icon: Package, 
        moduleKey: 'inventory',
        hasDropdown: true,
        subItems: [
          { path: '/user/inventory', name: 'Inventory Stock' },
          { path: '/user/inventory?tab=requests', name: 'Uniform Requisitions' },
          { path: '/user/inventory?tab=issued', name: 'Issued Items' },
          { path: '/user/inventory?tab=returns', name: 'Return History' },
          { path: '/user/inventory?tab=movement', name: 'Stock Movements' },
          { path: '/user/inventory?tab=clearance', name: 'Asset Clearance' },
        ]
      },
      { 
        path: '/user/reports', 
        name: 'Reports', 
        icon: BarChart3, 
        moduleKey: 'reports',
        hasDropdown: true,
        subItems: [
          { path: '/user/reports', name: 'All Reports' },
          { path: '/user/reports?tab=attendance', name: 'Attendance Report' },
          { path: '/user/reports?tab=payroll', name: 'Payroll Report' },
          { path: '/user/reports?tab=billing', name: 'Billing Report' },
          { path: '/user/reports?tab=employee', name: 'Employee Master Report' },
          { path: '/user/reports?tab=inventory', name: 'Inventory Report' },
        ]
      }
    ]
  },
  {
    title: 'SETTINGS & SYSTEM',
    items: [
      { 
        path: '/user/company-setup', 
        name: 'Company Setup', 
        icon: Building2, 
        moduleKey: 'company_setup',
        hasDropdown: true,
        subItems: [
          { path: '/user/company-setup?section=company-profile', name: 'Company Profile' },
          { path: '/user/company-setup?section=statutory-tax-ids', name: 'Statutory & Tax IDs' },
          { path: '/user/company-setup?section=signatories', name: 'Signatories & Stamp' },
          { path: '/user/company-setup?section=code-numbering', name: 'Code Numbering' },
          { path: '/user/company-setup?section=regional-settings', name: 'Regional Settings' },
          { path: '/user/company-setup?section=audit-history', name: 'Audit History' },
        ]
      },
      { 
        path: '/user/work-locations', 
        name: 'Work Locations', 
        icon: MapPin, 
        moduleKey: 'work_locations',
        hasDropdown: true,
        subItems: [
          { path: '/user/work-locations', name: 'All Locations' },
          { path: '/user/work-locations?type=head-office', name: 'Head Office' },
          { path: '/user/work-locations?type=branch', name: 'Branches' },
        ]
      },
      { 
        path: '/user/masters', 
        name: 'Masters', 
        icon: Settings2, 
        moduleKey: 'masters',
        hasDropdown: true,
        subItems: [
          { path: '/user/masters?tab=banks', name: 'Banks' },
          { path: '/user/masters?tab=clients', name: 'Clients' },
          { path: '/user/masters?tab=departments', name: 'Departments' },
          { path: '/user/masters?tab=designations', name: 'Designations' },
          { path: '/user/masters?tab=employee-types', name: 'Employee Types' },
          { path: '/user/masters?tab=sites', name: 'Sites' },
          { path: '/user/masters?tab=posts', name: 'Posts' },
          { path: '/user/masters?tab=shifts', name: 'Shifts' },
          { path: '/user/masters?tab=leave-types', name: 'Leave Types' },
          { path: '/user/masters?tab=holidays', name: 'Holidays' },
          { path: '/user/masters?tab=salary-components', name: 'Salary Components' },
          { path: '/user/masters?tab=document-types', name: 'Document Types' },
        ]
      },
      { 
        path: '/user/roles-permissions', 
        name: 'Role & Permissions', 
        icon: ShieldCheck, 
        moduleKey: 'roles_permissions',
        hasDropdown: true,
        subItems: [
          { path: '/user/roles-permissions', name: 'Configured Roles' },
          { path: '/user/roles-permissions?tab=users', name: 'Assigned Users' },
          { path: '/user/roles-permissions?tab=permissions', name: 'Permission Matrix' },
        ]
      },
      { path: '/user/users', name: 'User Management', icon: UserCog, moduleKey: 'user_management' },
      { path: '/user/preferences', name: 'Preferences', icon: SlidersHorizontal, moduleKey: 'preferences' },
      { path: '/user/templates', name: 'Templates', icon: FileText, moduleKey: 'templates' },
      { path: '/user/document-compliance', name: 'Docs & Compliance', icon: FileCheck, moduleKey: 'docs_compliance' },
      { path: '/user/notifications', name: 'Notifications', icon: Bell, moduleKey: 'notifications' }
    ]
  }
];

function UserSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const location = useLocation();
  const { currentUser, canView, isAdmin, userRole } = usePermissions();
  const { activeCompany } = useCompany();

  // Dropdown states for multi-item accordions
  const [openDropdowns, setOpenDropdowns] = useState(() => ({
    '/user/clients': location.pathname.startsWith('/user/clients'),
    '/user/employees': location.pathname.startsWith('/user/employees'),
    '/user/attendance': location.pathname.startsWith('/user/attendance'),
    '/user/shifts': location.pathname.startsWith('/user/shifts'),
    '/user/payroll': location.pathname.startsWith('/user/payroll'),
    '/user/payroll-setup': location.pathname.startsWith('/user/payroll-setup'),
    '/user/statutory-setup': location.pathname.startsWith('/user/statutory-setup'),
    '/user/advances-loans': location.pathname.startsWith('/user/advances-loans'),
    '/user/reimbursements': location.pathname.startsWith('/user/reimbursements'),
    '/user/overtime': location.pathname.startsWith('/user/overtime'),
    '/user/leave': location.pathname.startsWith('/user/leave'),
    '/user/inventory': location.pathname.startsWith('/user/inventory'),
    '/user/reports': location.pathname.startsWith('/user/reports'),
    '/user/company-setup': location.pathname.startsWith('/user/company-setup'),
    '/user/work-locations': location.pathname.startsWith('/user/work-locations'),
    '/user/masters': location.pathname.startsWith('/user/masters'),
    '/user/roles-permissions': location.pathname.startsWith('/user/roles-permissions'),
  }));

  // Auto-expand active route's accordion when path changes
  useEffect(() => {
    Object.keys(openDropdowns).forEach((key) => {
      if (location.pathname === key || location.pathname.startsWith(key + '/') || location.pathname.startsWith(key + '?')) {
        setOpenDropdowns(prev => ({ ...prev, [key]: true }));
      }
    });
  }, [location.pathname]);

  const toggleDropdown = (path) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleItemClick = (disabled) => {
    if (disabled) return;
    if (setIsDrawerOpen) {
      setIsDrawerOpen(false);
    }
  };

  // Filter navigation items by active user permissions dynamically
  const filteredGroups = USER_NAV_GROUPS.map(group => {
    const visibleItems = group.items.filter(item => {
      if (item.isAlwaysVisible) return true;
      if (isAdmin) return true;
      return item.moduleKey && canView(item.moduleKey);
    });

    return {
      ...group,
      items: visibleItems
    };
  }).filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={[
          styles.sidebar,
          isCollapsed ? styles.collapsed : '',
          isDrawerOpen ? styles.drawerOpen : ''
        ].filter(Boolean).join(' ')}
        aria-label="User portal sidebar navigation"
      >
        {/* Branding header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoRow}>
            {activeCompany?.logo ? (
              <div className={styles.companyLogoWrap}>
                <img src={activeCompany.logo} alt={activeCompany.name || 'Company'} className={styles.companyLogoImg} />
              </div>
            ) : (
              <span className={styles.logoIcon}>
                <Zap size={16} strokeWidth={2.5} color="#ffffff" fill="rgba(255,255,255,0.4)" />
              </span>
            )}
            {!isCollapsed && (
              <div className={styles.brandText}>
                <span className={styles.appName} title={activeCompany?.name}>
                  {activeCompany?.name || 'RR Security'}
                </span>
                <span className={styles.appSuffix}>HRMS</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className={styles.navContainer}>
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={styles.group}>
              {!isCollapsed && <h2 className={styles.groupTitle}>{group.title}</h2>}
              <ul className={styles.groupList}>
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isDropdownActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                  return (
                    <li key={itemIdx} className={styles.item}>
                      {item.hasDropdown && item.subItems ? (
                        <div className={styles.dropdownItemWrap}>
                          <div
                            role="button"
                            tabIndex={0}
                            className={[
                              styles.link,
                              styles.dropdownToggle,
                              isDropdownActive ? styles.active : ''
                            ].filter(Boolean).join(' ')}
                            onClick={() => toggleDropdown(item.path)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleDropdown(item.path);
                              }
                            }}
                            title={isCollapsed ? item.name : undefined}
                          >
                            <span className={styles.iconWrap}>
                              <Icon size={18} strokeWidth={2} />
                            </span>
                            {!isCollapsed && (
                              <>
                                <span className={styles.itemName}>{item.name}</span>
                                <ChevronDown
                                  size={15}
                                  className={[
                                    styles.chevronIcon,
                                    openDropdowns[item.path] ? styles.chevronIconRotated : ''
                                  ].filter(Boolean).join(' ')}
                                />
                              </>
                            )}
                            {isCollapsed && (
                              <span className={styles.tooltip} role="tooltip">
                                {item.name}
                              </span>
                            )}
                          </div>

                          {/* Submenu Items with smooth transition */}
                          {!isCollapsed && (
                            <div
                              className={[
                                styles.submenuWrapper,
                                openDropdowns[item.path] ? styles.submenuWrapperExpanded : ''
                              ].filter(Boolean).join(' ')}
                              aria-hidden={!openDropdowns[item.path]}
                            >
                              <div className={styles.submenuInner}>
                                <ul className={styles.subMenuList}>
                                  {item.subItems.map((subItem, subIdx) => {
                                    const currentFullUrl = location.pathname + location.search;
                                    let isSubActive = false;
                                    if (subItem.path.includes('?')) {
                                      isSubActive = currentFullUrl === subItem.path ||
                                        (subItem.path.includes('tab=banks') && location.pathname === '/user/masters' && !location.search) ||
                                        (subItem.path.includes('section=company-profile') && location.pathname === '/user/company-setup' && !location.search);
                                    } else {
                                      isSubActive = (location.pathname === subItem.path && !location.search);
                                    }

                                    return (
                                      <li key={subIdx} className={styles.subMenuItem}>
                                        <NavLink
                                          to={subItem.path}
                                          className={[
                                            styles.subItemLink,
                                            isSubActive ? styles.subItemActive : ''
                                          ].filter(Boolean).join(' ')}
                                          onClick={() => handleItemClick(false)}
                                        >
                                          <span className={styles.subItemBullet} />
                                          <span>{subItem.name}</span>
                                        </NavLink>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={item.path}
                          end={item.path === '/user/dashboard'}
                          className={({ isActive }) => [
                            styles.link,
                            isActive ? styles.active : ''
                          ].filter(Boolean).join(' ')}
                          onClick={() => handleItemClick(false)}
                          title={isCollapsed ? item.name : undefined}
                        >
                          <span className={styles.iconWrap}>
                            <Icon size={18} strokeWidth={2} />
                          </span>
                          {!isCollapsed && <span className={styles.itemName}>{item.name}</span>}
                          {isCollapsed && (
                            <span className={styles.tooltip} role="tooltip">
                              {item.name}
                            </span>
                          )}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer (Profile / Logout) */}
        <div className={styles.sidebarFooter}>
          <div className={styles.profileRow}>
            <Avatar
              initials={currentUser?.initials || (currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : 'US')}
              size={isCollapsed ? 'sm' : 'md'}
              name={currentUser?.name || 'User'}
            />
            {!isCollapsed && (
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{currentUser?.name || 'User'}</span>
                <span className={styles.profileRole}>
                  <Shield size={10} style={{ display: 'inline', marginRight: 3 }} />
                  {userRole || currentUser?.roleName || currentUser?.role || 'Custom Role'}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
            aria-label="Logout"
            title={isCollapsed ? "Logout" : undefined}
          >
            <span className={styles.iconWrap}>
              <LogOut size={18} strokeWidth={2} />
            </span>
            {!isCollapsed && <span className={styles.logoutText}>Logout</span>}
            {isCollapsed && (
              <span className={styles.tooltip} role="tooltip">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default UserSidebar;
