import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Shirt,
  Zap,
  ChevronDown,
  HandCoins
} from 'lucide-react';
import styles from './EmployeeSidebar.module.css';
import { useCompany } from '../../context/CompanyContext';
import preferenceService from '../../services/preferenceService';
import authService from '../../services/authService';
import rrLogo from '../../assets/rrlogo.png';

const ALL_NAV_ITEMS = [
  { path: '/employee/dashboard', name: 'Dashboard', icon: LayoutDashboard, key: 'allowDashboard' },
  {
    path: '/employee/attendance',
    name: 'My Attendance',
    icon: CalendarCheck,
    key: 'allowAttendance',
    hasDropdown: true,
    subItems: [
      { path: '/employee/attendance', name: 'Attendance Register' },
      { path: '/employee/attendance?tab=corrections', name: 'Correction Requests' },
    ]
  },
  { path: '/employee/leave', name: 'My Leave', icon: CalendarDays, key: 'allowLeaves' },
  { path: '/employee/salary-slips', name: 'My Salary Slips', icon: FileText, key: 'allowSalarySlips' },
  {
    path: '/employee/advances-loans',
    name: 'Advances & Loans',
    icon: HandCoins,
    key: 'allowAdvancesLoans',
    hasDropdown: true,
    subItems: [
      { path: '/employee/advances-loans', name: 'All Requests' },
      { path: '/employee/advances-loans?tab=advances', name: 'Advances' },
      { path: '/employee/advances-loans?tab=loans', name: 'Loans' },
      { path: '/employee/advances-loans?tab=schedule', name: 'Deduction Schedule' },
      { path: '/employee/advances-loans?tab=history', name: 'Deduction History' },
    ]
  },
  { path: '/employee/assets', name: 'Assets / Uniform', icon: Shirt, key: 'allowAssetsUniform' },
  { path: '/employee/notifications', name: 'Notifications', icon: Bell, key: 'allowNotifications' }
];

function EmployeeSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const { activeCompany, brandLogo } = useCompany();
  const location = useLocation();
  const activeBrandLogo = brandLogo || localStorage.getItem('novaspark_master_brand_logo') || rrLogo;

  const [portalAccess, setPortalAccess] = useState({
    enabled: true,
    allowDashboard: true,
    allowAttendance: true,
    allowLeaves: true,
    allowSalarySlips: true,
    allowAdvancesLoans: true,
    allowAssetsUniform: true,
    allowProfile: true,
    allowNotifications: true
  });

  // Track open dropdowns
  const [openDropdowns, setOpenDropdowns] = useState(() => ({
    '/employee/attendance': location.pathname.startsWith('/employee/attendance'),
    '/employee/advances-loans': location.pathname.startsWith('/employee/advances-loans'),
  }));

  const currentUser = authService.getCurrentUser();
  const companyId = activeCompany?.companyId || activeCompany?.id || currentUser?.companyId || 'RRS8392014SEC';

  // Automatically expand dropdown if user navigates to attendance or advances-loans
  useEffect(() => {
    if (location.pathname.startsWith('/employee/attendance')) {
      setOpenDropdowns((prev) => ({
        ...prev,
        '/employee/attendance': true,
      }));
    }
    if (location.pathname.startsWith('/employee/advances-loans')) {
      setOpenDropdowns((prev) => ({
        ...prev,
        '/employee/advances-loans': true,
      }));
    }
  }, [location.pathname]);

  const toggleDropdown = (path) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

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
          <NavLink to="/employee/dashboard" className={styles.brandLink} title="RR Security & Facilities">
            <img 
              src={activeBrandLogo} 
              alt="RR Security & Facilities" 
              className={styles.brandLogoImg} 
            />
          </NavLink>
        </div>

        <nav className={styles.navContainer}>
          <ul className={styles.navList}>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isDropdownActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

              if (item.hasDropdown && item.subItems) {
                return (
                  <li key={item.path} className={styles.item}>
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

                      {/* Submenu Items */}
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
                                  isSubActive = location.pathname === subItem.path && !location.search;
                                }

                                return (
                                  <li key={subIdx} className={styles.subMenuItem}>
                                    <NavLink
                                      to={subItem.path}
                                      className={[
                                        styles.subItemLink,
                                        isSubActive ? styles.subItemActive : ''
                                      ].filter(Boolean).join(' ')}
                                      onClick={handleNavigation}
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
                  </li>
                );
              }

              return (
                <li key={item.path} className={styles.item}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/employee/dashboard'}
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                    onClick={handleNavigation}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={styles.iconWrap}><Icon size={18} strokeWidth={2} /></span>
                    {!isCollapsed && <span className={styles.itemName}>{item.name}</span>}
                    {isCollapsed && <span className={styles.tooltip} role="tooltip">{item.name}</span>}
                  </NavLink>
                </li>
              );
            })}

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
