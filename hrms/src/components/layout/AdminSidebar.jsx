import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, ClipboardCheck, CalendarDays,
  WalletCards, HandCoins, Timer, CalendarOff, Package, BarChart3,
  Settings2, Bell, LogOut, ChevronLeft, ChevronRight, Zap, ShieldCheck, UserCog, MapPin, SlidersHorizontal, Landmark, FileText, FileCheck, Hash, Receipt, ChevronDown, FileSignature
} from 'lucide-react';
import styles from './AdminSidebar.module.css';
import Avatar from '../common/Avatar';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';
import rrLogo from '../../assets/rrlogo.png';

// Navigation groups & items mapping with module keys
const NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard, moduleKey: null },
    ]
  },
  {
    title: 'ORGANIZATION',
    items: [
      {
        path: '/admin/company-setup',
        name: 'Organization Setup',
        icon: Building2,
        moduleKey: 'company_setup'
      },
    ]
  },
  {
    title: 'WORKFORCE',
    items: [
      {
        path: '/admin/clients',
        name: 'Clients',
        icon: Building2,
        moduleKey: 'clients',
        hasDropdown: true,
        subItems: [
          { path: '/admin/clients', name: 'All Clients' },
          { path: '/admin/clients/billing', name: 'Billing' },
          { path: '/admin/masters?tab=clients', name: 'Client Master' },
        ]
      },
      {
        path: '/admin/employees',
        name: 'Employees',
        icon: Users,
        moduleKey: 'employees',
        hasDropdown: true,
        subItems: [
          { path: '/admin/employees', name: 'All Employees' },
          { path: '/admin/employees/transfer', name: 'Transfer Employees' },
        ]
      },
      {
        path: '/admin/attendance',
        name: 'Attendance',
        icon: ClipboardCheck,
        moduleKey: 'attendance',
        hasDropdown: true,
        subItems: [
          { path: '/admin/attendance', name: 'Manual Attendance' },
          { path: '/admin/biometric-attendance', name: 'Biometric Attendance' },
          { path: '/admin/attendance?tab=corrections', name: 'Correction Requests' },
        ]
      },
      {
        path: '/admin/shifts',
        name: 'Shift Management',
        icon: CalendarDays,
        moduleKey: 'shifts',
        hasDropdown: true,
        subItems: [
          { path: '/admin/shifts', name: 'Shift Roster' },
          { path: '/admin/shifts?tab=patterns', name: 'Shift Patterns' },
          { path: '/admin/shifts?tab=calendar', name: 'Calendar View' },
        ]
      },
    ]
  },
  {
    title: 'PAYROLL MANAGEMENT',
    items: [
      {
        path: '/admin/payroll',
        name: 'Payroll',
        icon: WalletCards,
        moduleKey: 'payroll',
        hasDropdown: true,
        subItems: [
          { path: '/admin/payroll', name: 'Payroll Processing' },
          { path: '/admin/payroll?tab=structure', name: 'Salary Structure' },
          { path: '/admin/payroll?tab=rate-revision', name: 'Rate Revision' },
          { path: '/admin/payroll?tab=arrears', name: 'Arrears' },
          { path: '/admin/payroll?tab=slips', name: 'Salary Slips' },
          { path: '/admin/payroll?tab=statutory', name: 'Statutory Reports' },
        ]
      },
      {
        path: '/admin/payroll-setup',
        name: 'Payroll Setup',
        icon: SlidersHorizontal,
        moduleKey: 'payroll_setup'
      },
      {
        path: '/admin/statutory-setup',
        name: 'Statutory Setup',
        icon: Landmark,
        moduleKey: 'statutory_setup'
      },
      {
        path: '/admin/advances-loans',
        name: 'Advances & Loans',
        icon: HandCoins,
        moduleKey: 'advances_loans',
        hasDropdown: true,
        subItems: [
          { path: '/admin/advances-loans', name: 'All Requests' },
          { path: '/admin/advances-loans?tab=advances', name: 'Advances' },
          { path: '/admin/advances-loans?tab=loans', name: 'Loans' },
          { path: '/admin/advances-loans?tab=schedule', name: 'Deduction Schedule' },
          { path: '/admin/advances-loans?tab=history', name: 'Deduction History' },
        ]
      },
      {
        path: '/admin/reimbursements',
        name: 'Reimbursements',
        icon: Receipt,
        moduleKey: 'reimbursements',
        hasDropdown: true,
        subItems: [
          { path: '/admin/reimbursements', name: 'All Claims' },
          { path: '/admin/reimbursements?status=pending', name: 'Pending Approvals' },
          { path: '/admin/reimbursements?tab=expense-types', name: 'Expense Types Master' },
          { path: '/admin/reimbursements?tab=reports', name: 'Reports & Analytics' },
        ]
      },
      {
        path: '/admin/overtime',
        name: 'Overtime',
        icon: Timer,
        moduleKey: 'overtime',
        hasDropdown: true,
        subItems: [
          { path: '/admin/overtime', name: 'All Overtime' },
          { path: '/admin/overtime?tab=requests', name: 'Pending Approvals' },
          { path: '/admin/overtime?tab=history', name: 'Overtime History' },
          { path: '/admin/overtime?tab=analytics', name: 'Client & Dept Analytics' },
        ]
      },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      {
        path: '/admin/leave',
        name: 'Leave',
        icon: CalendarOff,
        moduleKey: 'leave',
        hasDropdown: true,
        subItems: [
          { path: '/admin/leave', name: 'Leave Requests' },
          { path: '/admin/leave?tab=balances', name: 'Employee Balances' },
          { path: '/admin/leave?tab=master', name: 'Leave Master' },
          { path: '/admin/leave?tab=calendar', name: 'Roster & Calendar' },
        ]
      },
      {
        path: '/admin/inventory',
        name: 'Inventory',
        icon: Package,
        moduleKey: 'inventory',
        hasDropdown: true,
        subItems: [
          { path: '/admin/inventory', name: 'Inventory Stock' },
          { path: '/admin/inventory?tab=requests', name: 'Uniform Requisitions' },
          { path: '/admin/inventory?tab=issued', name: 'Issued Items' },
          { path: '/admin/inventory?tab=returns', name: 'Return History' },
          { path: '/admin/inventory?tab=movement', name: 'Stock Movements' },
          { path: '/admin/inventory?tab=clearance', name: 'Asset Clearance' },
        ]
      },
      {
        path: '/admin/reports',
        name: 'Reports',
        icon: BarChart3,
        moduleKey: 'reports'
      },
    ]
  },
  {
    title: 'SETTINGS',
    items: [
      {
        path: '/admin/masters',
        name: 'Masters',
        icon: Settings2,
        moduleKey: 'masters'
      },
      {
        path: '/admin/roles-permissions',
        name: 'Role & Permissions',
        icon: ShieldCheck,
        moduleKey: 'roles_permissions',
        hasDropdown: true,
        subItems: [
          { path: '/admin/roles-permissions', name: 'Configured Roles' },
          { path: '/admin/roles-permissions?tab=users', name: 'Assigned Users' },
          { path: '/admin/roles-permissions?tab=permissions', name: 'Permission Matrix' },
        ]
      },
      {
        path: '/admin/users',
        name: 'User Management',
        icon: UserCog,
        moduleKey: 'user_management',
        hasDropdown: true,
        subItems: [
          { path: '/admin/users', name: 'All Users' },
          { path: '/admin/users?status=active', name: 'Active Users' },
          { path: '/admin/users?status=inactive', name: 'Inactive Users' },
          { path: '/admin/roles-permissions', name: 'Roles & Access' },
        ]
      },
      {
        path: '/admin/preferences',
        name: 'Preferences',
        icon: SlidersHorizontal,
        moduleKey: 'preferences',
        hasDropdown: true,
        subItems: [
          { path: '/admin/preferences', name: 'Overview' },
          { path: '/admin/preferences?tab=employee-portal', name: 'Employee Portal' },
          { path: '/admin/preferences?tab=email', name: 'Email Settings' },
          { path: '/admin/preferences?tab=notifications', name: 'Notification Settings' },
          { path: '/admin/preferences?tab=approvals', name: 'Approval Settings' },
        ]
      },
      {
        path: '/admin/templates',
        name: 'Template Setup',
        icon: FileText,
        moduleKey: 'templates'
      },
      {
        path: '/admin/letter-management',
        name: 'Letter Management',
        icon: FileSignature,
        moduleKey: 'letter_management'
      },
      {
        path: '/admin/document-compliance',
        name: 'Docs & Compliance',
        icon: FileCheck,
        moduleKey: 'docs_compliance',
        hasDropdown: true,
        subItems: [
          { path: '/admin/document-compliance', name: 'Overview' },
          { path: '/admin/document-compliance?tab=verification-rules', name: 'Verification Rules' },
          { path: '/admin/document-compliance?tab=expiry-alert', name: 'Expiry Alert' },
          { path: '/admin/document-compliance?tab=police-verification', name: 'Police Verification' },
        ]
      },
      {
        path: '/admin/notifications',
        name: 'Notifications',
        icon: Bell,
        moduleKey: 'notifications',
        hasDropdown: true,
        subItems: [
          { path: '/admin/notifications?tab=announcements', name: 'Announcements' },
          { path: '/admin/notifications?tab=notifications', name: 'Notifications' },
        ]
      },
    ]
  }
];

function AdminSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const { activeCompany } = useCompany();
  const { canView, isAdmin, userRole, currentUser } = usePermissions();
  const location = useLocation();

  // Track expanded state of dropdown menus
  const [openDropdowns, setOpenDropdowns] = useState(() => {
    return {
      '/admin/clients': location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies') || (location.pathname === '/admin/masters' && location.search.includes('tab=clients')),
      '/admin/employees': location.pathname.startsWith('/admin/employees'),
      '/admin/attendance': location.pathname.startsWith('/admin/attendance') || location.pathname.startsWith('/admin/biometric-attendance'),
      '/admin/shifts': location.pathname.startsWith('/admin/shifts'),
      '/admin/payroll': location.pathname === '/admin/payroll' || location.pathname.startsWith('/admin/payroll/'),
      '/admin/payroll-setup': location.pathname === '/admin/payroll-setup' || location.pathname.startsWith('/admin/payroll-setup/') || (location.pathname === '/admin/masters' && location.search.includes('tab=salary-components')),
      '/admin/statutory-setup': location.pathname === '/admin/statutory-setup' || location.pathname.startsWith('/admin/statutory-setup/') || location.pathname === '/admin/settings/statutory',
      '/admin/advances-loans': location.pathname === '/admin/advances-loans' || location.pathname.startsWith('/admin/advances-loans/'),
      '/admin/reimbursements': location.pathname === '/admin/reimbursements' || location.pathname.startsWith('/admin/reimbursements/'),
      '/admin/overtime': location.pathname === '/admin/overtime' || location.pathname.startsWith('/admin/overtime/'),
      '/admin/leave': location.pathname === '/admin/leave' || location.pathname.startsWith('/admin/leave/'),
      '/admin/inventory': location.pathname === '/admin/inventory' || location.pathname.startsWith('/admin/inventory/'),
      '/admin/masters': (location.pathname === '/admin/masters' || location.pathname.startsWith('/admin/masters/')) &&
        !location.search.includes('tab=departments') &&
        !location.search.includes('tab=designations') &&
        !location.search.includes('tab=clients') &&
        !location.search.includes('tab=salary-components'),
      '/admin/roles-permissions': location.pathname === '/admin/roles-permissions' || location.pathname.startsWith('/admin/roles-permissions/'),
      '/admin/users': location.pathname === '/admin/users' || location.pathname.startsWith('/admin/users/'),
      '/admin/preferences': location.pathname === '/admin/preferences' || location.pathname.startsWith('/admin/preferences/'),
      '/admin/templates': location.pathname === '/admin/templates' || location.pathname.startsWith('/admin/templates/'),
      '/admin/document-compliance': location.pathname === '/admin/document-compliance' || location.pathname.startsWith('/admin/document-compliance/') || location.pathname === '/admin/settings/document-compliance',
      '/admin/notifications': location.pathname === '/admin/notifications' || location.pathname.startsWith('/admin/notifications/')
    };
  });

  // Automatically keep dropdown open when on matching route
  useEffect(() => {
    if (location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies') || (location.pathname === '/admin/masters' && location.search.includes('tab=clients'))) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/clients': true }));
    }
    if (location.pathname.startsWith('/admin/employees')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/employees': true }));
    }
    if (location.pathname.startsWith('/admin/attendance') || location.pathname.startsWith('/admin/biometric-attendance')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/attendance': true }));
    }
    if (location.pathname.startsWith('/admin/shifts')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/shifts': true }));
    }
    if (location.pathname === '/admin/payroll' || location.pathname.startsWith('/admin/payroll/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/payroll': true }));
    }
    if (location.pathname === '/admin/advances-loans' || location.pathname.startsWith('/admin/advances-loans/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/advances-loans': true }));
    }
    if (location.pathname === '/admin/reimbursements' || location.pathname.startsWith('/admin/reimbursements/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/reimbursements': true }));
    }
    if (location.pathname === '/admin/overtime' || location.pathname.startsWith('/admin/overtime/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/overtime': true }));
    }
    if (location.pathname === '/admin/leave' || location.pathname.startsWith('/admin/leave/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/leave': true }));
    }
    if (location.pathname === '/admin/inventory' || location.pathname.startsWith('/admin/inventory/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/inventory': true }));
    }
    if (location.pathname === '/admin/roles-permissions' || location.pathname.startsWith('/admin/roles-permissions/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/roles-permissions': true }));
    }
    if (location.pathname === '/admin/users' || location.pathname.startsWith('/admin/users/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/users': true }));
    }
    if (location.pathname === '/admin/preferences' || location.pathname.startsWith('/admin/preferences/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/preferences': true }));
    }
    if (location.pathname === '/admin/document-compliance' || location.pathname.startsWith('/admin/document-compliance/') || location.pathname === '/admin/settings/document-compliance') {
      setOpenDropdowns(prev => ({ ...prev, '/admin/document-compliance': true }));
    }
    if (location.pathname === '/admin/notifications' || location.pathname.startsWith('/admin/notifications/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/notifications': true }));
    }
  }, [location.pathname, location.search]);

  const toggleDropdown = (path) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Handles close drawer for mobile navigation clicks
  const handleItemClick = (disabled) => {
    if (disabled) return;
    if (setIsDrawerOpen) {
      setIsDrawerOpen(false);
    }
  };

  // Admin Sidebar always displays full administration module catalog
  const filteredNavGroups = NAV_GROUPS;

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
        aria-label="Admin sidebar navigation"
      >
        {/* Branding header */}
        <div className={styles.brandHeader}>
          <NavLink to="/admin/dashboard" className={styles.brandLink} title="RR Security & Facilities">
            <img 
              src={rrLogo} 
              alt="RR Security & Facilities" 
              className={styles.brandLogoImg} 
            />
          </NavLink>
        </div>

        {/* Navigation list */}
        <nav className={styles.navContainer}>
          {filteredNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={styles.group}>
              {!isCollapsed && <h2 className={styles.groupTitle}>{group.title}</h2>}
              <ul className={styles.groupList}>
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;

                  const isDropdownActive = item.path === '/admin/company-setup'
                    ? (
                        location.pathname.startsWith('/admin/company-setup') ||
                        location.pathname.startsWith('/admin/work-locations') ||
                        (location.pathname === '/admin/masters' && (location.search.includes('tab=departments') || location.search.includes('tab=designations')))
                      )
                    : item.path === '/admin/masters'
                    ? (
                        (location.pathname === '/admin/masters' || location.pathname.startsWith('/admin/masters/')) &&
                        !location.search.includes('tab=departments') &&
                        !location.search.includes('tab=designations') &&
                        !location.search.includes('tab=clients') &&
                        !location.search.includes('tab=salary-components')
                      )
                    : item.path === '/admin/clients'
                    ? (
                        location.pathname.startsWith('/admin/clients') ||
                        location.pathname.startsWith('/admin/companies') ||
                        (location.pathname === '/admin/masters' && location.search.includes('tab=clients'))
                      )

                    : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

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
                                        (subItem.path.includes('tab=banks') && location.pathname === '/admin/masters' && !location.search) ||
                                        (subItem.path.includes('section=company-profile') && location.pathname === '/admin/company-setup' && !location.search) ||
                                        (subItem.path.includes('tab=announcements') && location.pathname === '/admin/notifications' && (!location.search || location.search === '?tab=announcements'));
                                    } else {
                                      isSubActive = (location.pathname === subItem.path) &&
                                        (!location.search || (subItem.path === '/admin/payroll' && location.search === '?tab=processing') || (subItem.path !== '/admin/attendance' && !location.search.startsWith('?tab=')));
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
                          to={item.disabled ? '#' : item.path}
                          end={item.path === '/admin/dashboard'}
                          className={({ isActive }) => [
                            styles.link,
                            (isActive || (item.path === '/admin/company-setup' && location.pathname.startsWith('/admin/company-setup'))) ? styles.active : '',
                            item.disabled ? styles.disabledLink : ''
                          ].filter(Boolean).join(' ')}
                          onClick={(e) => {
                            if (item.disabled) {
                              e.preventDefault();
                            }
                            handleItemClick(item.disabled);
                          }}
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
          {/* <div className={styles.profileRow}>
            <Avatar
              initials={isAdmin ? 'AD' : (currentUser?.initials || 'AD')}
              size={isCollapsed ? 'sm' : 'md'}
              name={isAdmin ? 'Administrator' : (currentUser?.name || 'Administrator')}
            />
            {!isCollapsed && (
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{isAdmin ? (currentUser?.name || 'RR Security Administrator') : (currentUser?.name || 'Administrator')}</span>
                <span className={styles.profileRole}>Administrator</span>
              </div>
            )}
          </div> */}

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

export default AdminSidebar;
