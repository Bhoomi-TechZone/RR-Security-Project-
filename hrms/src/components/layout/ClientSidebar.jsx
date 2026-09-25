import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Receipt,
  FileBarChart,
  Bell,
  Building2,
  LogOut,
  Zap
} from 'lucide-react';
import styles from './ClientSidebar.module.css';
import Avatar from '../common/Avatar';
import { useClientAuth } from '../../context/ClientAuthContext';

// Company-scoped Client Navigation Structure
const CLIENT_NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { path: '/client/dashboard', name: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'WORKFORCE',
    items: [
      { path: '/client/employees', name: 'Employees', icon: Users },
      { path: '/client/attendance', name: 'Attendance', icon: ClipboardCheck }
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { path: '/client/billing', name: 'Billing', icon: Receipt }
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { path: '/client/reports', name: 'Reports', icon: FileBarChart }
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { path: '/client/notifications', name: 'Notifications', icon: Bell }
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { path: '/client/profile', name: 'Company Profile', icon: Building2 }
    ]
  }
];

function ClientSidebar({ isCollapsed, isDrawerOpen, setIsDrawerOpen, onLogout }) {
  const { clientCompany, clientUser } = useClientAuth();

  const handleItemClick = () => {
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
        aria-label="Client panel sidebar navigation"
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
                <span className={styles.appSuffix}>CLIENT PORTAL</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className={styles.navContainer} aria-label="Client main navigation">
          {CLIENT_NAV_GROUPS.map((group) => (
            <div key={group.title} className={styles.group}>
              {!isCollapsed && (
                <div className={styles.groupTitle}>{group.title}</div>
              )}
              <ul className={styles.groupList}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/client/dashboard'}
                        className={({ isActive }) =>
                          `${styles.link} ${isActive ? styles.active : ''}`
                        }
                        onClick={handleItemClick}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <span className={styles.iconWrap}>
                          <Icon size={18} strokeWidth={2} />
                        </span>
                        {!isCollapsed && (
                          <span className={styles.linkText}>{item.name}</span>
                        )}
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

        {/* Sidebar Footer: Client Contact Info & Logout */}
        <div className={styles.sidebarFooter}>
          {/* {!isCollapsed && (
            <div className={styles.profileRow}>
              <Avatar
                initials={clientUser?.initials || 'RK'}
                size="sm"
                name={clientUser?.name || 'Rahul Kumar'}
              />
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>
                  {clientUser?.name || 'Rahul Kumar'}
                </span>
                <span className={styles.profileRole}>
                  Client Representative
                </span>
              </div>
            </div>
          )} */}

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
            aria-label="Logout from Client Portal"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className={styles.iconWrap}>
              <LogOut size={17} strokeWidth={2} />
            </span>
            {!isCollapsed && <span className={styles.logoutText}>Logout</span>}
            {isCollapsed && (
              <span className={styles.tooltip} role="tooltip">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default ClientSidebar;
