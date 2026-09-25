import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, ClipboardCheck, CalendarDays,
  WalletCards, HandCoins, Timer, CalendarOff, Package, BarChart3, 
  Settings2, Bell, LogOut, ChevronLeft, ChevronRight, Zap, ShieldCheck, UserCog, MapPin, SlidersHorizontal, Landmark, FileText, FileCheck, Hash, Receipt, ChevronDown
} from 'lucide-react';
import styles from './AdminSidebar.module.css';
import Avatar from '../common/Avatar';
import { useCompany } from '../../context/CompanyContext';

// Navigation groups & items mapping
const NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'ORGANIZATION',
    items: [
      { 
        path: '/admin/company-setup', 
        name: 'Company Setup', 
        icon: Building2,
        hasDropdown: true,
        subItems: [
          { path: '/admin/company-setup?section=company-profile', name: 'Company Profile' },
          { path: '/admin/company-setup?section=logo', name: 'Logo' },
          { path: '/admin/company-setup?section=employee-code', name: 'Employee Code' },
          { path: '/admin/company-setup?section=address', name: 'Address' },
          { path: '/admin/company-setup?section=contact-details', name: 'Contact Details' },
          { path: '/admin/company-setup?section=pan-tan-gst', name: 'PAN / TAN / GST' },
          { path: '/admin/company-setup?section=regional-settings', name: 'Regional Settings' },
        ]
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
        hasDropdown: true,
        subItems: [
          { path: '/admin/clients', name: 'All Clients' },
          { path: '/admin/clients?status=active', name: 'Active Clients' },
          { path: '/admin/clients?status=inactive', name: 'Inactive Clients' },
          // { path: '/admin/clients?action=add', name: 'Add Client' },
        ]
      },
      { 
        path: '/admin/employees', 
        name: 'Employees', 
        icon: Users,
        hasDropdown: true,
        subItems: [
          { path: '/admin/employees', name: 'All Employees' },
          { path: '/admin/employees?status=active', name: 'Active Employees' },
          { path: '/admin/employees?status=inactive', name: 'Inactive Employees' },
          // { path: '/admin/employees?action=add', name: 'Add Employee' },
        ]
      },
      { 
        path: '/admin/attendance', 
        name: 'Attendance', 
        icon: ClipboardCheck,
        hasDropdown: true,
        subItems: [
          { path: '/admin/attendance', name: 'Daily Attendance' },
          { path: '/admin/attendance?tab=corrections', name: 'Correction Requests' },
        ]
      },
      { 
        path: '/admin/shifts', 
        name: 'Shift Management', 
        icon: CalendarDays,
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
      { path: '/admin/payroll-setup', name: 'Payroll Setup', icon: SlidersHorizontal },
      { path: '/admin/statutory-setup', name: 'Statutory Setup', icon: Landmark },
      { path: '/admin/advances-loans', name: 'Advances & Loans', icon: HandCoins },
      { path: '/admin/reimbursements', name: 'Reimbursements', icon: Receipt },
      { path: '/admin/overtime', name: 'Overtime', icon: Timer },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { path: '/admin/leave', name: 'Leave', icon: CalendarOff },
      { path: '/admin/inventory', name: 'Inventory', icon: Package },
      { path: '/admin/reports', name: 'Reports', icon: BarChart3 },
    ]
  },
  {
    title: 'SETTINGS',
    items: [
      { path: '/admin/work-locations', name: 'Work Locations', icon: MapPin },
      { path: '/admin/masters', name: 'Masters', icon: Settings2 },
      { path: '/admin/roles-permissions', name: 'Role & Permissions', icon: ShieldCheck },
      { path: '/admin/users', name: 'User Management', icon: UserCog },
      { path: '/admin/preferences', name: 'Preferences', icon: SlidersHorizontal },
      { path: '/admin/templates', name: 'Templates', icon: FileText },
      { path: '/admin/document-compliance', name: 'Document & Compliance', icon: FileCheck },
      { path: '/admin/notifications', name: 'Notifications', icon: Bell },
    ]
  }
];

function AdminSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const { activeCompany } = useCompany();
  const location = useLocation();

  // Track expanded state of dropdown menus
  const [openDropdowns, setOpenDropdowns] = useState(() => {
    return {
      '/admin/company-setup': location.pathname.startsWith('/admin/company-setup'),
      '/admin/clients': location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies'),
      '/admin/employees': location.pathname.startsWith('/admin/employees'),
      '/admin/attendance': location.pathname.startsWith('/admin/attendance'),
      '/admin/shifts': location.pathname.startsWith('/admin/shifts'),
      '/admin/payroll': location.pathname === '/admin/payroll' || location.pathname.startsWith('/admin/payroll/')
    };
  });

  // Automatically keep dropdown open when on matching route
  useEffect(() => {
    if (location.pathname.startsWith('/admin/company-setup')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/company-setup': true }));
    }
    if (location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/clients': true }));
    }
    if (location.pathname.startsWith('/admin/employees')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/employees': true }));
    }
    if (location.pathname.startsWith('/admin/attendance')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/attendance': true }));
    }
    if (location.pathname.startsWith('/admin/shifts')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/shifts': true }));
    }
    if (location.pathname === '/admin/payroll' || location.pathname.startsWith('/admin/payroll/')) {
      setOpenDropdowns(prev => ({ ...prev, '/admin/payroll': true }));
    }
  }, [location.pathname]);

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
          <div className={styles.logoRow}>
            <span className={styles.logoIcon}>
              <Zap size={16} strokeWidth={2.5} color="#ffffff" fill="rgba(255,255,255,0.4)" />
            </span>
            {!isCollapsed && (
              <div className={styles.brandText}>
                <span className={styles.appName} title={activeCompany.name}>
                  {activeCompany.name || 'RR Security'}
                </span>
                <span className={styles.appSuffix}>HRMS</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className={styles.navContainer}>
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className={styles.group}>
              {!isCollapsed && <h2 className={styles.groupTitle}>{group.title}</h2>}
              <ul className={styles.groupList}>
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;

                  const isDropdownActive = item.path === '/admin/clients' 
                    ? (location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/companies'))
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
                                      isSubActive = currentFullUrl === subItem.path;
                                    } else {
                                      isSubActive = (location.pathname === subItem.path && !location.search) ||
                                        (subItem.path.includes('company-profile') && location.pathname === '/admin/company-setup' && !location.search);
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
                            isActive ? styles.active : '',
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
            <Avatar initials="AD" size={isCollapsed ? 'sm' : 'md'} name="Admin" />
            {!isCollapsed && (
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>Admin</span>
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
