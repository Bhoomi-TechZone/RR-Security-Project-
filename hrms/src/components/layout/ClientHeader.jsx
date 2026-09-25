import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  Building
} from 'lucide-react';
import styles from './ClientHeader.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import { useClientAuth } from '../../context/ClientAuthContext';

function ClientHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientCompany, clientUser } = useClientAuth();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/client/dashboard')) return 'Client Portal / Overview';
    if (path.startsWith('/client/employees')) return 'Workforce / Employees';
    if (path.startsWith('/client/attendance')) return 'Workforce / Attendance';
    if (path.startsWith('/client/billing')) return 'Finance / Billing & Invoices';
    if (path.startsWith('/client/reports')) return 'Reports / Company Reports';
    if (path.startsWith('/client/notifications')) return 'Communication / Notifications';
    if (path.startsWith('/client/profile')) return 'Account / Company Profile';
    return 'Client Portal';
  };

  return (
    <header className={styles.header} aria-label="Client portal header">
      {/* Left side: Toggle button and breadcrumb */}
      <div className={styles.left}>
        <button
          onClick={onToggleSidebar}
          className={styles.toggleBtn}
          aria-label="Toggle sidebar panel"
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <span className={styles.breadcrumb}>{getBreadcrumb()}</span>
      </div>

      {/* Right side: Mapped Company Badge, Notifications, Profile Dropdown */}
      <div className={styles.right}>
        {/* Company Identity & Client Code Tag */}
        <div className={styles.companyPill} title="Authenticated Client Company">
          <Building size={14} className={styles.companyPillIcon} />
          <span className={styles.companyPillText}>
            {clientCompany?.name || 'ABC Security Services'}
          </span>
          <span className={styles.clientCodeBadge}>
            {clientCompany?.clientCode || 'CLT-ABC-001'}
          </span>
        </div>

        {/* Notifications Icon */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.actionBtn}
            onClick={() => navigate('/client/notifications')}
            aria-label="View notifications"
            title="Notifications"
          >
            <Bell size={19} strokeWidth={2} />
            <span className={styles.badge} aria-label="2 unread notifications">2</span>
          </button>
        </div>

        {/* Vertical divider */}
        <span className={styles.divider} />

        {/* Client Profile Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button className={styles.profileTrigger} aria-label="Client profile options menu">
              <Avatar
                initials={clientUser?.initials || 'RK'}
                size="sm"
                name={clientUser?.name || 'Rahul Kumar'}
              />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>
                  {clientUser?.name || 'Rahul Kumar'}
                </span>
                <span className={styles.profileRole}>Client</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </button>
          }
        >
          <ul className={styles.dropdownMenu}>
            <li className={styles.dropdownHeader}>
              <span className={styles.dropdownCompanyName}>
                {clientCompany?.name || 'ABC Security Services'}
              </span>
              <span className={styles.dropdownClientCode}>
                Code: {clientCompany?.clientCode || 'CLT-ABC-001'}
              </span>
            </li>
            <li className={styles.dropdownItemDivider} />
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={() => navigate('/client/profile')}
                className={styles.dropdownLink}
              >
                <Building2 size={14} />
                <span>Company Profile</span>
              </button>
            </li>
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={() => navigate('/client/billing')}
                className={styles.dropdownLink}
              >
                <span>Billing Summary</span>
              </button>
            </li>
            <li className={styles.dropdownItemDivider} />
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={onLogout}
                className={`${styles.dropdownLink} ${styles.logoutOption}`}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </Dropdown>
      </div>
    </header>
  );
}

export default ClientHeader;
