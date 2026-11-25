import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bell,
  CalendarCheck,
  CalendarDays,
  FileSignature,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Shield,
  Shirt,
  Timer,
  Zap,
  ChevronDown,
  HandCoins,
  Calculator
} from 'lucide-react';
import styles from './EmployeeSidebar.module.css';
import { useCompany } from '../../context/CompanyContext';
import preferenceService from '../../services/preferenceService';
import authService from '../../services/authService';
import rrLogo from '../../assets/rrlogo.png';

const ALL_NAV_ITEMS = [
  { path: '/employee/dashboard', name: 'Dashboard', icon: LayoutDashboard, key: 'allowDashboard' },
  { path: '/employee/requests', name: 'Request Hub', icon: ArrowLeftRight },
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
  {
    path: '/employee/leave',
    name: 'My Leave',
    icon: CalendarDays,
    key: 'allowLeaves',
    hasDropdown: true,
    subItems: [
      { path: '/employee/leave', name: 'Leave Requests' },
      { path: '/employee/leave?tab=encashment', name: 'Leave Encashment' },
    ]
  },
  { path: '/employee/overtime', name: 'Overtime', icon: Timer, key: 'allowAttendance' },
  {
    path: '/employee/salary-slips',
    name: 'Payroll & Slips',
    icon: FileText,
    key: 'allowSalarySlips',
    hasDropdown: true,
    subItems: [
      { path: '/employee/salary-slips', name: 'Salary Slips' },
      { path: '/employee/salary-slips?tab=bonus', name: 'Bonus (Form C)' },
      { path: '/employee/salary-slips?tab=gratuity', name: 'Gratuity & Form F' },
    ]
  },
  { path: '/employee/tax-declaration', name: 'IT Declaration (12BB)', icon: Calculator, key: 'allowSalarySlips' },
  {
    path: '/employee/advances-loans',
    name: 'Loans',
    icon: HandCoins,
    key: 'allowAdvancesLoans',
    hasDropdown: true,
    subItems: [
      { path: '/employee/advances-loans?tab=loans', name: 'My Loans' },
      { path: '/employee/advances-loans?tab=schedule', name: 'Deduction Schedule' },
      { path: '/employee/advances-loans?tab=history', name: 'Deduction History' },
    ]
  },
  { path: '/employee/reimbursements', name: 'Reimbursements', icon: Receipt },
  { path: '/employee/uniforms', name: 'Uniforms', icon: Shirt, key: 'allowAssetsUniform' },
  { path: '/employee/assets', name: 'Assets', icon: Shield, key: 'allowAssetsUniform' },
  { path: '/employee/letters', name: 'HR Letters', icon: FileSignature },
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
    '/employee/leave': location.pathname.startsWith('/employee/leave'),
    '/employee/salary-slips': location.pathname.startsWith('/employee/salary-slips'),
    '/employee/advances-loans': location.pathname.startsWith('/employee/advances-loans'),
  }));

  const currentUser = authService.getCurrentUser();
  const companyId = activeCompany?.companyId || activeCompany?.id || currentUser?.companyId || 'RRS8392014SEC';

  // Automatically expand dropdown if user navigates to an active section
  useEffect(() => {
    ['/employee/attendance', '/employee/leave', '/employee/salary-slips', '/employee/advances-loans'].forEach((path) => {
      if (location.pathname.startsWith(path)) {
        setOpenDropdowns((prev) => ({
          ...prev,
          [path]: true,
        }));
      }
    });
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

  // Floating Flyout Submenu state for Collapsed Mode
  const [flyoutData, setFlyoutData] = useState(null);
  const flyoutCloseTimerRef = useRef(null);

  const checkIsSubActive = (subItemPath) => {
    const currentFullUrl = location.pathname + location.search;
    if (subItemPath.includes('?')) {
      return currentFullUrl === subItemPath;
    }
    return location.pathname === subItemPath && !location.search;
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
                                const isSubActive = checkIsSubActive(subItem.path);

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
                        handleNavigation();
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

export default EmployeeSidebar;
