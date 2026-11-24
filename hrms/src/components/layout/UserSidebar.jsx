import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronDown,
  UserPlus,
  UserCheck,
  UserMinus,
  Calculator,
  PartyPopper,
  Briefcase
} from 'lucide-react';
import styles from './UserSidebar.module.css';
import Avatar from '../common/Avatar';
import { usePermissions } from '../../context/PermissionContext';
import { useCompany } from '../../context/CompanyContext';
import rrLogo from '../../assets/rrlogo.png';

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
    title: 'TALENT & RECRUITMENT',
    items: [
      {
        path: '/user/recruitment',
        name: 'Recruitment',
        icon: UserPlus,
        moduleKey: 'recruitment',
      },
      {
        path: '/user/onboarding',
        name: 'Onboarding',
        icon: UserCheck,
        moduleKey: 'onboarding',
      },
      {
        path: '/user/payroll?tab=fnf',
        name: 'Separation',
        icon: UserMinus,
        moduleKey: 'payroll',
      },
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
          { path: '/user/clients/billing', name: 'Billing' },
          { path: '/user/masters?tab=client-services', name: 'Client Services' },
        ]
      },
      { 
        path: '/user/employees', 
        name: 'All Employees', 
        icon: Users, 
        moduleKey: 'employees'
      },
      { 
        path: '/user/hr-management', 
        name: 'HR Management', 
        icon: Briefcase, 
        moduleKey: 'hr_management',
        isAlwaysVisible: true,
        hasDropdown: true,
        subItems: [
          { path: '/user/hr-management/requests', name: 'Requests' },
          { path: '/user/employees/transfer', name: 'Employee Transfer' },
          { path: '/user/greetings', name: 'Greetings' },
          { path: '/user/notifications?tab=announcements', name: 'Announcements' },
          { path: '/user/letter-management', name: 'Letter Management' },
        ]
      },
      { 
        path: '/user/attendance', 
        name: 'Attendance', 
        icon: ClipboardCheck, 
        moduleKey: 'attendance',
        hasDropdown: true,
        subItems: [
          { path: '/user/attendance', name: 'Manual Attendance' },
          { path: '/user/biometric-attendance', name: 'Biometric Attendance' },
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
          { path: '/user/payroll?tab=gratuity', name: 'Gratuity Management' },
          { path: '/user/payroll?tab=bonus', name: 'Bonus Management' },
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
          { path: '/user/masters?tab=salary-components&subTab=earnings', name: 'Earnings' }, { path: '/user/masters?tab=salary-components&subTab=deductions', name: 'Deductions' },
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
      },
      {
        path: '/user/income-tax',
        name: 'Income Tax',
        icon: Calculator,
        moduleKey: 'payroll',
        hasDropdown: true,
        subItems: [
          { path: '/user/income-tax', name: 'IT Declaration' },
          { path: '/user/income-tax?tab=exemptions', name: 'IT Exemptions' },
          { path: '/user/income-tax?tab=challan', name: 'IT Challan' },
          { path: '/user/income-tax?tab=tds-return', name: 'TDS Return' },
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
          { path: '/user/leave?tab=balances', name: 'Employee Balances' },
          { path: '/user/leave?tab=master', name: 'Leave Master' },
          { path: '/user/leave?tab=calendar', name: 'Roster & Calendar' },
          { path: '/user/leave?tab=encashment', name: 'Leave Encashment' },
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
        name: 'Organization Setup', 
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
        moduleKey: 'masters'
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
      { path: '/user/notifications?tab=notifications', name: 'Notifications', icon: Bell, moduleKey: 'notifications' },
      { path: '/user/templates', name: 'Templates', icon: FileText, moduleKey: 'templates' },
      { path: '/user/document-compliance', name: 'Docs & Compliance', icon: FileCheck, moduleKey: 'docs_compliance' }
    ]
  }
];

function UserSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const location = useLocation();
  const { activeCompany, brandLogo } = useCompany();
  const { canView, isAdmin, userRole, currentUser } = usePermissions();
  const activeBrandLogo = brandLogo || localStorage.getItem('novaspark_master_brand_logo') || rrLogo;

  const isSeparationRoute =
    (location.pathname === '/user/payroll' && location.search.includes('tab=fnf')) ||
    location.pathname.startsWith('/user/payroll/fnf-initiate') ||
    location.pathname.startsWith('/user/payroll/separation-initiate') ||
    location.pathname.startsWith('/user/payroll/fnf/initiate') ||
    location.pathname.startsWith('/user/payroll/pending-exits') ||
    location.pathname.startsWith('/user/payroll/finalized-exits');

  // Dropdown states for multi-item accordions
  const [openDropdowns, setOpenDropdowns] = useState(() => ({
    '/user/recruitment': location.pathname.startsWith('/user/recruitment'),
    '/user/onboarding': location.pathname.startsWith('/user/onboarding'),
    '/user/clients': location.pathname.startsWith('/user/clients'),
    '/user/hr-management': location.pathname.startsWith('/user/hr-management') || location.pathname.startsWith('/user/employees/transfer') || location.pathname.startsWith('/user/letter-management') || location.pathname.startsWith('/user/letters') || location.pathname.startsWith('/user/greetings') || (location.pathname.startsWith('/user/notifications') && location.search.includes('tab=announcements')),
    '/user/attendance': location.pathname.startsWith('/user/attendance') || location.pathname.startsWith('/user/biometric-attendance'),
    '/user/shifts': location.pathname.startsWith('/user/shifts'),
    '/user/payroll': location.pathname.startsWith('/user/payroll') && !isSeparationRoute,
    '/user/payroll-setup': location.pathname.startsWith('/user/payroll-setup'),
    '/user/statutory-setup': location.pathname.startsWith('/user/statutory-setup'),
    '/user/advances-loans': location.pathname.startsWith('/user/advances-loans'),
    '/user/reimbursements': location.pathname.startsWith('/user/reimbursements'),
    '/user/overtime': location.pathname.startsWith('/user/overtime'),
    '/user/income-tax': location.pathname.startsWith('/user/income-tax'),
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
      if (key === '/user/payroll' && isSeparationRoute) return;
      if (
        (key === '/user/hr-management' && (
          location.pathname.startsWith('/user/hr-management') ||
          location.pathname.startsWith('/user/employees/transfer') ||
          location.pathname.startsWith('/user/letter-management') ||
          location.pathname.startsWith('/user/letters') ||
          location.pathname.startsWith('/user/greetings') ||
          (location.pathname.startsWith('/user/notifications') && location.search.includes('tab=announcements'))
        )) ||
        location.pathname === key ||
        location.pathname.startsWith(key + '/') ||
        location.pathname.startsWith(key + '?') ||
        (key === '/user/attendance' && location.pathname.startsWith('/user/biometric-attendance')) ||
        (key === '/user/clients' && location.pathname === '/user/masters' && location.search.includes('tab=clients')) ||
        (key === '/user/payroll-setup' && location.pathname === '/user/masters' && location.search.includes('tab=salary-components'))
      ) {
        setOpenDropdowns(prev => ({ ...prev, [key]: true }));
      }
    });
  }, [location.pathname, location.search]);

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

  // Floating Flyout Submenu state for Collapsed Mode
  const [flyoutData, setFlyoutData] = useState(null);
  const flyoutCloseTimerRef = useRef(null);

  const checkIsSubActive = (subItemPath) => {
    const currentFullUrl = location.pathname + location.search;
    if (subItemPath.includes('?')) {
      return (
        currentFullUrl === subItemPath ||
        (subItemPath.includes('tab=banks') && location.pathname === '/user/masters' && !location.search) ||
        (subItemPath.includes('section=company-profile') && location.pathname === '/user/company-setup' && !location.search) ||
        (subItemPath.includes('tab=announcements') && location.pathname === '/user/notifications' && location.search.includes('tab=announcements'))
      );
    }
    return (
      location.pathname === subItemPath &&
      (!location.search ||
        (subItemPath === '/user/income-tax' && location.search === '?tab=declaration') ||
        subItemPath !== '/user/attendance' ||
        !location.search.includes('tab=corrections'))
    );
  };

  const openFlyout = (item, element) => {
    if (!isCollapsed || !item?.subItems?.length) return;
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
    }
    const rect = element.getBoundingClientRect();
    const estimatedHeight = Math.min(380, (item.subItems.length * 36) + 52);
    const top = Math.max(10, Math.min(rect.top, window.innerHeight - estimatedHeight - 16));
    const left = rect.right + 8;
    setFlyoutData({ item, top, left });
  };

  const closeFlyoutWithDelay = () => {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
    }
    flyoutCloseTimerRef.current = setTimeout(() => {
      setFlyoutData(null);
    }, 180);
  };

  const cancelFlyoutClose = () => {
    if (flyoutCloseTimerRef.current) {
      clearTimeout(flyoutCloseTimerRef.current);
    }
  };

  // Close flyout on scroll, outside click, or when expanding sidebar
  useEffect(() => {
    if (!flyoutData) return;
    const handleScrollOrClickOutside = (e) => {
      if (e.target?.closest && e.target.closest(`.${styles.flyoutPopover}`)) {
        return;
      }
      setFlyoutData(null);
    };
    window.addEventListener('scroll', handleScrollOrClickOutside, true);
    document.addEventListener('mousedown', handleScrollOrClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScrollOrClickOutside, true);
      document.removeEventListener('mousedown', handleScrollOrClickOutside);
    };
  }, [flyoutData]);

  useEffect(() => {
    setFlyoutData(null);
  }, [isCollapsed, location.pathname, location.search]);

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
          <NavLink to="/user/dashboard" className={styles.brandLink} title="RR Security & Facilities">
            <img 
              src={activeBrandLogo} 
              alt="RR Security & Facilities" 
              className={styles.brandLogoImg} 
            />
          </NavLink>
        </div>

        {/* Navigation list */}
        <nav className={styles.navContainer}>
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={styles.group}>
              {!isCollapsed && <h2 className={styles.groupTitle}>{group.title}</h2>}
              <ul className={styles.groupList}>
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isDropdownActive = item.path === '/user/payroll'
                    ? ((location.pathname === item.path || location.pathname.startsWith(item.path + '/')) && !isSeparationRoute)
                    : item.path === '/user/hr-management'
                    ? (
                        location.pathname.startsWith('/user/hr-management') ||
                        location.pathname.startsWith('/user/employees/transfer') ||
                        location.pathname.startsWith('/user/letter-management') ||
                        location.pathname.startsWith('/user/letters') ||
                        location.pathname.startsWith('/user/greetings') ||
                        (location.pathname.startsWith('/user/notifications') && location.search.includes('tab=announcements'))
                      )
                    : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

                  return (
                    <li key={itemIdx} className={styles.item}>
                      {item.hasDropdown && item.subItems ? (
                        <div 
                          className={styles.dropdownItemWrap}
                          onMouseEnter={(e) => {
                            if (isCollapsed) {
                              openFlyout(item, e.currentTarget);
                            }
                          }}
                          onMouseLeave={() => {
                            if (isCollapsed) {
                              closeFlyoutWithDelay();
                            }
                          }}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            className={[
                              styles.link,
                              styles.dropdownToggle,
                              isDropdownActive ? styles.active : '',
                              (isCollapsed && flyoutData?.item?.path === item.path) ? styles.activeFlyoutTrigger : ''
                            ].filter(Boolean).join(' ')}
                            onClick={(e) => {
                              if (isCollapsed) {
                                e.preventDefault();
                                openFlyout(item, e.currentTarget);
                              } else {
                                toggleDropdown(item.path);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (isCollapsed) {
                                  openFlyout(item, e.currentTarget);
                                } else {
                                  toggleDropdown(item.path);
                                }
                              }
                            }}
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
                                    const isSubActive = checkIsSubActive(subItem.path);

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
                            (item.path === '/user/payroll?tab=fnf'
                              ? isSeparationRoute
                              : (isActive || 
                                 (item.path === '/user/recruitment' && location.pathname.startsWith('/user/recruitment')) || 
                                 (item.path === '/user/onboarding' && location.pathname.startsWith('/user/onboarding')) || 
                                 (item.path === '/user/employees' && (
                                   location.pathname === '/user/employees' ||
                                   location.pathname.startsWith('/user/employees/add') ||
                                   (location.pathname.startsWith('/user/employees/') && !location.pathname.startsWith('/user/employees/transfer'))
                                 )) ||
                                 (item.path === '/user/masters' && location.pathname.startsWith('/user/masters')) || 
                                 (item.path.startsWith('/user/notifications') && location.pathname.startsWith('/user/notifications') && !location.search.includes('tab=announcements')))
                            ) ? styles.active : ''
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

        {/* Floating Flyout Popover for Submenu in Collapsed Mode */}
        {isCollapsed && flyoutData && flyoutData.item && createPortal(
          <div
            className={styles.flyoutPopover}
            style={{
              top: `${flyoutData.top}px`,
              left: `${flyoutData.left}px`,
            }}
            onMouseEnter={cancelFlyoutClose}
            onMouseLeave={closeFlyoutWithDelay}
          >
            {/* Flyout Header */}
            <div className={styles.flyoutHeader}>
              <span className={styles.flyoutHeaderIcon}>
                {React.createElement(flyoutData.item.icon, { size: 16, strokeWidth: 2.2 })}
              </span>
              <span className={styles.flyoutHeaderTitle}>{flyoutData.item.name}</span>
            </div>

            {/* Flyout Submenu List */}
            <ul className={styles.flyoutList}>
              {flyoutData.item.subItems.map((subItem, sIdx) => {
                const isSubActive = checkIsSubActive(subItem.path);
                return (
                  <li key={sIdx} className={styles.flyoutListItem}>
                    <NavLink
                      to={subItem.path}
                      className={[
                        styles.flyoutLink,
                        isSubActive ? styles.flyoutLinkActive : ''
                      ].filter(Boolean).join(' ')}
                      onClick={() => {
                        setFlyoutData(null);
                        handleItemClick(false);
                      }}
                    >
                      <span className={styles.flyoutBullet} />
                      <span className={styles.flyoutItemName}>{subItem.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
      </aside>
    </>
  );
}

export default UserSidebar;
