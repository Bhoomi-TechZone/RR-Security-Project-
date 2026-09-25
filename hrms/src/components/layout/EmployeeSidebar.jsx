import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Zap
} from 'lucide-react';
import styles from './EmployeeSidebar.module.css';

const NAV_ITEMS = [
  { path: '/employee/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/employee/attendance', name: 'My Attendance', icon: CalendarCheck },
  { path: '/employee/leave', name: 'My Leave', icon: CalendarDays },
  { path: '/employee/salary-slips', name: 'My Salary Slips', icon: FileText },
  { path: '/employee/notifications', name: 'Notifications', icon: Bell }
];

function EmployeeSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const handleNavigation = () => setIsDrawerOpen(false);

  return (
    <>
      {isDrawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isDrawerOpen ? styles.drawerOpen : ''}`}
        aria-label="Employee sidebar navigation"
      >
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

        <nav className={styles.navContainer}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map(({ path, name, icon: Icon }) => (
              <li key={path} className={styles.item}>
                <NavLink
                  to={path}
                  end={path === '/employee/dashboard'}
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                  onClick={handleNavigation}
                  title={isCollapsed ? name : undefined}
                >
                  <span className={styles.iconWrap}><Icon size={18} strokeWidth={2} /></span>
                  {!isCollapsed && <span className={styles.itemName}>{name}</span>}
                  {isCollapsed && <span className={styles.tooltip} role="tooltip">{name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
            aria-label="Logout"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className={styles.iconWrap}><LogOut size={18} strokeWidth={2} /></span>
            {!isCollapsed && <span className={styles.logoutText}>Logout</span>}
            {isCollapsed && <span className={styles.tooltip} role="tooltip">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default EmployeeSidebar;
