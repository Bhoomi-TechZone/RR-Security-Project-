import React, { useEffect, useState } from 'react';
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
import { useCompany } from '../../context/CompanyContext';
import preferenceService from '../../services/preferenceService';
import authService from '../../services/authService';

const ALL_NAV_ITEMS = [
  { path: '/employee/dashboard', name: 'Dashboard', icon: LayoutDashboard, key: 'allowDashboard' },
  { path: '/employee/attendance', name: 'My Attendance', icon: CalendarCheck, key: 'allowAttendance' },
  { path: '/employee/leave', name: 'My Leave', icon: CalendarDays, key: 'allowLeaves' },
  { path: '/employee/salary-slips', name: 'My Salary Slips', icon: FileText, key: 'allowSalarySlips' },
  { path: '/employee/notifications', name: 'Notifications', icon: Bell, key: 'allowNotifications' }
];

function EmployeeSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const { activeCompany } = useCompany();
  const [portalAccess, setPortalAccess] = useState({
    enabled: true,
    allowDashboard: true,
    allowAttendance: true,
    allowLeaves: true,
    allowSalarySlips: true,
    allowProfile: true,
    allowNotifications: true
  });

  const currentUser = authService.getCurrentUser();
  const companyId = activeCompany?.companyId || activeCompany?.id || currentUser?.companyId || 'RRS8392014SEC';

  useEffect(() => {
    let isMounted = true;
    async function loadPortalAccess() {
      try {
        const access = await preferenceService.getEmployeePortalAccess(companyId);
        if (isMounted && access) {
          setPortalAccess(access);
        }
      } catch (err) {
        console.warn('Failed to load employee portal access permissions:', err);
      }
    }

    loadPortalAccess();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const handleNavigation = () => setIsDrawerOpen(false);

  // Dynamically filter items according to backend-stored preferences
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    // If master switch disabled, hide all
    if (portalAccess.enabled === false) return false;
    // Check specific feature toggle
    if (item.key && portalAccess[item.key] === false) return false;
    return true;
  });

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

        <nav className={styles.navContainer}>
          <ul className={styles.navList}>
            {visibleNavItems.map(({ path, name, icon: Icon }) => (
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
            {visibleNavItems.length === 0 && !isCollapsed && (
              <li style={{ padding: '16px 12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                No portal modules enabled by administrator.
              </li>
            )}
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
