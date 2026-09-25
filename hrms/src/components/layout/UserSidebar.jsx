import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Shield
} from 'lucide-react';
import styles from './UserSidebar.module.css';
import Avatar from '../common/Avatar';
import { useUserAuth } from '../../context/UserAuthContext';

// Navigation groups & module definitions mapping
const USER_NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      {
        path: '/user/dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        isAlwaysVisible: true // Dashboard is always accessible
      }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { path: '/user/employees', name: 'Employees', icon: Users, moduleKey: 'employees' },
      { path: '/user/attendance', name: 'Attendance', icon: ClipboardCheck, moduleKey: 'attendance' },
      { path: '/user/leave', name: 'Leave', icon: CalendarOff, moduleKey: 'leave' },
      { path: '/user/overtime', name: 'Overtime', icon: Timer, moduleKey: 'overtime' },
      { path: '/user/shifts', name: 'Shifts', icon: CalendarDays, moduleKey: 'shifts' },
      { path: '/user/inventory', name: 'Inventory', icon: Package, moduleKey: 'inventory' },
      { path: '/user/advances-loans', name: 'Advances & Loans', icon: HandCoins, moduleKey: 'advances_loans' }
    ]
  },
  {
    title: 'PAYROLL',
    items: [
      { path: '/user/payroll', name: 'Payroll', icon: WalletCards, moduleKey: 'payroll' }
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { path: '/user/reports', name: 'Reports', icon: BarChart3, moduleKey: 'reports' }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/user/notifications', name: 'Notifications', icon: Bell, moduleKey: 'notifications' }
    ]
  }
];

function UserSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const location = useLocation();
  const { currentUser, canView } = useUserAuth();

  const handleItemClick = (disabled) => {
    if (disabled) return;
    if (setIsDrawerOpen) {
      setIsDrawerOpen(false);
    }
  };

  // Filter navigation items by active user permissions
  const filteredGroups = USER_NAV_GROUPS.map(group => {
    const visibleItems = group.items.filter(item => {
      if (item.isAlwaysVisible) return true;
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
            <span className={styles.logoIcon}>
              <Zap size={16} strokeWidth={2.5} color="#ffffff" fill="rgba(255,255,255,0.4)" />
            </span>
            {!isCollapsed && (
              <div className={styles.brandText}>
                <span className={styles.appName}>RR Security</span>
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

                  return (
                    <li key={itemIdx} className={styles.item}>
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
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer (Profile / Logout) */}
        <div className={styles.sidebarFooter}>
          {/* {currentUser && (
            <div className={styles.profileRow}>
              <Avatar
                initials={currentUser.initials || 'US'}
                size={isCollapsed ? 'sm' : 'md'}
                name={currentUser.name}
              />
              {!isCollapsed && (
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{currentUser.name}</span>
                  <span className={styles.profileRole}>
                    <Shield size={10} style={{ display: 'inline', marginRight: 3 }} />
                    {currentUser.role}
                  </span>
                </div>
              )}
            </div>
          )} */}

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
