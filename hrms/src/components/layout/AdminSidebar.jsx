import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, ClipboardCheck, CalendarDays,
  WalletCards, HandCoins, Timer, CalendarOff, Package, BarChart3,
  Settings2, Bell, LogOut, ChevronLeft, ChevronRight, Zap, ShieldCheck, UserCog, MapPin, SlidersHorizontal, Landmark, FileText, FileCheck, Hash, Receipt, ChevronDown, FileSignature,
  UserPlus, UserCheck, UserMinus, Calculator, PartyPopper, Briefcase
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
        path: '/admin/all-companies',
        name: 'All Company',
        icon: Building2,
        rrSecurityOnly: true
      },
      {
        path: '/admin/company-setup',
        name: 'Organization Setup',
        icon: Building2,
        moduleKey: 'company_setup'
      },
    ]
  },
  {
    title: 'TALENT & RECRUITMENT',
    items: [
      {
        path: '/admin/recruitment',
        name: 'Recruitment',
        icon: UserPlus,
      },
      {
        path: '/admin/onboarding',
        name: 'Onboarding',
        icon: UserCheck,
      },
      {
        path: '/admin/payroll?tab=fnf',
        name: 'Separation',
        icon: UserMinus,
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
          { path: '/admin/clients/billing', name: 'Billing' }

        ]
      },
      {
        path: '/admin/employees',
        name: 'All Employees',
        icon: Users,
        moduleKey: 'employees'
      },
      {
        path: '/admin/hr-management',
        name: 'HR Management',
        icon: Briefcase,
        moduleKey: 'hr_management',
        hasDropdown: true,
        subItems: [
          { path: '/admin/hr-management/requests', name: 'Requests' },
          { path: '/admin/employees/transfer', name: 'Employee Transfer' },
          { path: '/admin/greetings', name: 'Greetings' },
          { path: '/admin/upcoming-events', name: 'Events' },
          { path: '/admin/notifications?tab=announcements', name: 'Announcements' },
          { path: '/admin/letter-management', name: 'Letter Management' },
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
          { path: '/admin/biometric-attendance?tab=daily', name: 'Daily Attendance' },
          { path: '/admin/biometric-attendance?tab=weekly', name: 'Weekly Attendance' },
          { path: '/admin/biometric-attendance?tab=monthly', name: 'Monthly Attendance' },
          { path: '/admin/daily-punches', name: 'Daily Punches' },
          { path: '/admin/biometric-attendance?tab=corrections', name: 'Correction Requests' },
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
          { path: '/admin/payroll?tab=gratuity', name: 'Gratuity Management' },
          { path: '/admin/payroll?tab=bonus', name: 'Bonus Management' },
        ]
      },
      {
        path: '/admin/loans',
        name: 'Loans',
        icon: HandCoins,
        moduleKey: 'advances_loans'
      },
      {
        path: '/admin/reimbursements',
        name: 'Reimbursements',
        icon: Receipt,
        moduleKey: 'reimbursements',
        hasDropdown: true,
        subItems: [
          { path: '/admin/reimbursements', name: 'All Claims' },
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
      {
        path: '/admin/income-tax',
        name: 'Income Tax',
        icon: Calculator,
        moduleKey: 'payroll',
        hasDropdown: true,
        subItems: [
          { path: '/admin/income-tax', name: 'IT Declaration' },
          { path: '/admin/income-tax?tab=exemptions', name: 'IT Exemptions' },
          { path: '/admin/income-tax?tab=challan', name: 'IT Challan' },
          { path: '/admin/income-tax?tab=tds-return', name: 'TDS Return' },
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
          { path: '/admin/leave?tab=balances', name: 'Employee Balances' },
          { path: '/admin/leave?tab=master', name: 'Leave Master' },
          { path: '/admin/leave?tab=calendar', name: 'Roster & Calendar' },
          { path: '/admin/leave?tab=encashment', name: 'Leave Encashment' },
        ]
      },
      {
        path: '/admin/inventory',
        name: 'Inventory',
        icon: Package,
        moduleKey: 'inventory',
        hasDropdown: true,
        subItems: [
          { path: '/admin/inventory?type=uniform', name: 'Uniforms' },
          { path: '/admin/inventory?type=asset', name: 'Assets' },
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
        path: '/admin/notifications?tab=notifications',
        name: 'Notifications',
        icon: Bell,
        moduleKey: 'notifications'
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
    ]
  }
];

function AdminSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const { activeCompany, brandLogo } = useCompany();
  const { canView, isAdmin, userRole, currentUser } = usePermissions();
  const location = useLocation();

  const activeBrandLogo = brandLogo || localStorage.getItem('novaspark_master_brand_logo') || rrLogo;

  const isSeparationRoute =
    (location.pathname === '/admin/payroll' && location.search.includes('tab=fnf')) ||
    location.pathname.startsWith('/admin/payroll/fnf-initiate') ||
    location.pathname.startsWith('/admin/payroll/separation-initiate') ||
    location.pathname.startsWith('/admin/payroll/fnf/initiate') ||
    location.pathname.startsWith('/admin/payroll/pending-exits') ||
    location.pathname.startsWith('/admin/payroll/finalized-exits');

  // Track expanded state of dropdown menus
  const [openDropdowns, setOpenDropdowns] = useState(() => {
    const initialSep =
      (location.pathname === '/admin/payroll' && location.search.includes('tab=fnf')) ||
      location.pathname.startsWith('/admin/payroll/fnf') ||
      location.pathname.startsWith('/admin/payroll/separation') ||
      location.pathname.startsWith('/admin/payroll/pending-exits') ||
      location.pathname.startsWith('/admin/payroll/finalized-exits');
    return {
      '/admin/clients': location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies') || (location.pathname === '/admin/masters' && location.search.includes('tab=clients')),
      '/admin/hr-management': location.pathname.startsWith('/admin/hr-management') || location.pathname.startsWith('/admin/employees/transfer') || location.pathname.startsWith('/admin/letter-management') || location.pathname.startsWith('/admin/letters') || location.pathname.startsWith('/admin/greetings') || (location.pathname.startsWith('/admin/notifications') && location.search.includes('tab=announcements')),
      '/admin/attendance': location.pathname.startsWith('/admin/attendance') || location.pathname.startsWith('/admin/biometric-attendance'),
      '/admin/shifts': location.pathname.startsWith('/admin/shifts'),
      '/admin/payroll': (location.pathname === '/admin/payroll' || location.pathname.startsWith('/admin/payroll/')) && !initialSep,
      '/admin/payroll-setup': location.pathname === '/admin/payroll-setup' || location.pathname.startsWith('/admin/payroll-setup/') || (location.pathname === '/admin/masters' && location.search.includes('tab=salary-components')),
      '/admin/statutory-setup': location.pathname === '/admin/statutory-setup' || location.pathname.startsWith('/admin/statutory-setup/') || location.pathname === '/admin/settings/statutory',
      '/admin/reimbursements': location.pathname === '/admin/reimbursements' || location.pathname.startsWith('/admin/reimbursements/'),
      '/admin/overtime': location.pathname === '/admin/overtime' || location.pathname.startsWith('/admin/overtime/'),
      '/admin/income-tax': location.pathname === '/admin/income-tax' || location.pathname.startsWith('/admin/income-tax/'),
      '/admin/leave': location.pathname === '/admin/leave' || location.pathname.startsWith('/admin/leave/'),
      '/admin/inventory': location.pathname === '/admin/inventory' || location.pathname.startsWith('/admin/inventory/'),
      '/admin/roles-permissions': location.pathname === '/admin/roles-permissions' || location.pathname.startsWith('/admin/roles-permissions/'),
      '/admin/users': location.pathname === '/admin/users' || location.pathname.startsWith('/admin/users/'),
      '/admin/preferences': location.pathname === '/admin/preferences' || location.pathname.startsWith('/admin/preferences/'),
      '/admin/templates': location.pathname === '/admin/templates' || location.pathname.startsWith('/admin/templates/'),
      '/admin/document-compliance': location.pathname === '/admin/document-compliance' || location.pathname.startsWith('/admin/document-compliance/') || location.pathname === '/admin/settings/document-compliance'
    };
  });

  // Automatically keep dropdown open when on matching route
  useEffect(() => {
    if (location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/clients': true }));
    }
    if (
      location.pathname.startsWith('/admin/hr-management') ||
      location.pathname.startsWith('/admin/employees/transfer') ||
      location.pathname.startsWith('/admin/letter-management') ||
      location.pathname.startsWith('/admin/letters') ||
      location.pathname.startsWith('/admin/greetings') ||
      location.pathname.startsWith('/admin/upcoming-events') ||
      (location.pathname.startsWith('/admin/notifications') && location.search.includes('tab=announcements'))
    ) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/hr-management': true }));
    }
    if (
      location.pathname.startsWith('/admin/attendance') ||
      location.pathname.startsWith('/admin/biometric-attendance') ||
      location.pathname.startsWith('/admin/daily-punches')
    ) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/attendance': true }));
    }
    if (location.pathname.startsWith('/admin/shifts')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/shifts': true }));
    }
    if ((location.pathname === '/admin/payroll' || location.pathname.startsWith('/admin/payroll/')) && !isSeparationRoute) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/payroll': true }));
    }
    if (location.pathname === '/admin/reimbursements' || location.pathname.startsWith('/admin/reimbursements/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/reimbursements': true }));
    }
    if (location.pathname === '/admin/overtime' || location.pathname.startsWith('/admin/overtime/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/overtime': true }));
    }
    if (location.pathname === '/admin/income-tax' || location.pathname.startsWith('/admin/income-tax/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/income-tax': true }));
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

  // Floating Flyout Submenu state for Collapsed Mode
  const [flyoutData, setFlyoutData] = useState(null);
  const flyoutCloseTimerRef = useRef(null);

  const checkIsSubActive = (subItemPath) => {
    const currentFullUrl = location.pathname + location.search;
    if (subItemPath.includes('?')) {
      return (
        currentFullUrl === subItemPath ||
        (subItemPath.includes('tab=banks') && location.pathname === '/admin/masters' && !location.search) ||
        (subItemPath.includes('section=company-profile') && location.pathname === '/admin/company-setup' && !location.search) ||
        (subItemPath === '/admin/inventory?type=uniform' && location.pathname === '/admin/inventory' && !location.search.includes('tab=movement') && !location.search.includes('tab=clearance') && !location.search.includes('tab=requests') && !location.search.includes('type=asset')) ||
        (subItemPath === '/admin/inventory?type=asset' && location.pathname === '/admin/inventory' && !location.search.includes('tab=requests') && location.search.includes('type=asset')) ||
        (subItemPath.includes('tab=announcements') && location.pathname === '/admin/notifications' && (!location.search || location.search === '?tab=announcements'))
      );
    }
    return (
      location.pathname === subItemPath &&
      (!location.search ||
        (subItemPath === '/admin/payroll' && location.search === '?tab=processing') ||
        (subItemPath === '/admin/income-tax' && (!location.search || location.search === '?tab=declaration')) ||
        (subItemPath !== '/admin/attendance' && !location.search.startsWith('?tab=')))
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

  // Determine if the logged-in user is RR Security
  const isRRSecurity = Boolean(
    currentUser && (
      (currentUser.email && (
        currentUser.email.toLowerCase() === 'rrsecurity@gmail.com' ||
        currentUser.email.toLowerCase() === 'admin@rrsecurity.com' ||
        currentUser.email.toLowerCase().includes('rrsecurity')
      )) ||
      (currentUser.name && currentUser.name.toLowerCase().includes('rr security')) ||
      (currentUser.username && currentUser.username.toLowerCase().includes('rrsecurity')) ||
      (isAdmin && (
        activeCompany?.code === 'RRS' ||
        activeCompany?.companyId === 'RRS8392014SEC' ||
        activeCompany?.isDefault ||
        activeCompany?.name?.toLowerCase().includes('rr security')
      ))
    )
  );

  // Admin Sidebar displays modules with RR Security exclusivity filtering
  const filteredNavGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.rrSecurityOnly && !isRRSecurity) {
        return false;
      }
      return true;
    })
  })).filter(group => group.items.length > 0);

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
        {/* Branding header: Master Brand Logo (common for all companies, customizable only by Master Admin) */}
        <div className={styles.brandHeader}>
          <NavLink to="/admin/dashboard" className={styles.brandLink} title="RR Security & Facilities">
            <img 
              src={activeBrandLogo} 
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
                        location.pathname.startsWith('/admin/masters')
                      )
                    : item.path === '/admin/clients'
                    ? (
                        location.pathname.startsWith('/admin/clients') ||
                        location.pathname.startsWith('/admin/companies')
                      )
                    : item.path === '/admin/hr-management'
                    ? (
                        location.pathname.startsWith('/admin/hr-management') ||
                        location.pathname.startsWith('/admin/employees/transfer') ||
                        location.pathname.startsWith('/admin/letter-management') ||
                        location.pathname.startsWith('/admin/letters') ||
                        location.pathname.startsWith('/admin/greetings') ||
                        (location.pathname.startsWith('/admin/notifications') && location.search.includes('tab=announcements'))
                      )
                    : item.path === '/admin/payroll'
                    ? (
                        (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) &&
                        !isSeparationRoute
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
                          to={item.disabled ? '#' : item.path}
                          end={item.path === '/admin/dashboard'}
                          className={({ isActive }) => [
                            styles.link,
                            (item.path === '/admin/payroll?tab=fnf'
                              ? isSeparationRoute
                              : (isActive ||
                                 (item.path === '/admin/company-setup' && location.pathname.startsWith('/admin/company-setup')) ||
                                 (item.path === '/admin/all-companies' && (location.pathname.startsWith('/admin/all-companies') || location.pathname.startsWith('/admin/all-company'))) ||
                                 (item.path === '/admin/recruitment' && location.pathname.startsWith('/admin/recruitment')) ||
                                 (item.path === '/admin/onboarding' && location.pathname.startsWith('/admin/onboarding')) ||
                                 (item.path === '/admin/employees' && (
                                   location.pathname === '/admin/employees' ||
                                   location.pathname.startsWith('/admin/employees/add') ||
                                   (location.pathname.startsWith('/admin/employees/') && !location.pathname.startsWith('/admin/employees/transfer'))
                                 )) ||
                                 (item.path.startsWith('/admin/notifications') && location.pathname.startsWith('/admin/notifications') && !location.search.includes('tab=announcements'))
                                )
                            ) ? styles.active : '',
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

export default AdminSidebar;
