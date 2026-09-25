import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, CircleHelp, ChevronDown, User, Settings, LogOut, ArrowLeft, Building2, Plus, Check, Shield } from 'lucide-react';
import styles from './AdminHeader.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import Toast from '../common/Toast';
import OrganizationSettingsModal from '../settings/OrganizationSettingsModal';
import AddCompanyProfileModal from '../company/AddCompanyProfileModal';
import ExternalLinksDrawer from './ExternalLinksDrawer';
import { useCompany } from '../../context/CompanyContext';

function AdminHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { companies, activeCompany, switchCompany } = useCompany();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(
    location.state?.organisationSettingsOpen === true
  );
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const fromOrganisationSettings = location.state?.fromOrganisationSettings === true;

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
    navigate(location.pathname + location.search, {
      state: {
        ...location.state,
        organisationSettingsOpen: true
      }
    });
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    if (location.state?.organisationSettingsOpen) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: {
          ...location.state,
          organisationSettingsOpen: false
        }
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    const handleOpenSettings = () => {
      handleOpenSettingsModal();
    };
    const handleCloseSettings = () => {
      handleCloseSettingsModal();
    };

    window.addEventListener('open-organisation-settings', handleOpenSettings);
    window.addEventListener('close-organisation-settings', handleCloseSettings);

    return () => {
      clearInterval(timer);
      window.removeEventListener('open-organisation-settings', handleOpenSettings);
      window.removeEventListener('close-organisation-settings', handleCloseSettings);
    };
  }, [location.pathname, location.search, location.state]);

  // Synchronize modal state with browser history location state
  useEffect(() => {
    setIsSettingsModalOpen(location.state?.organisationSettingsOpen === true);
  }, [location.pathname, location.search, location.state]);

  const formattedDateTime = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentDateTime);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Dashboard';
    if (path.startsWith('/admin/settings') || path.startsWith('/admin/organization-settings')) return 'System / Organisation Settings';
    if (path.startsWith('/admin/company-setup')) return 'System / Company Setup';
    if (path.startsWith('/admin/work-locations')) return 'System / Work Locations';
    if (path.startsWith('/admin/clients/')) return 'Workforce / Clients / Details';
    if (path.startsWith('/admin/clients')) return 'Workforce / Clients';
    if (path.startsWith('/admin/companies/')) return 'Workforce / Clients / Details';
    if (path.startsWith('/admin/companies')) return 'Workforce / Clients';
    if (path.startsWith('/admin/employees')) return 'Workforce / Employees';
    if (path.startsWith('/admin/roles-permissions')) return 'System / Role & Permissions';
    if (path.startsWith('/admin/users')) return 'System / User Management';
    if (path.startsWith('/admin/masters')) return 'System / Masters';
    if (path.startsWith('/admin/notifications')) return 'System / Notifications';
    if (path.startsWith('/admin/payroll')) return 'Payroll / Payroll';
    if (path.startsWith('/admin/advances-loans')) return 'Payroll / Advances & Loans';
    if (path.startsWith('/admin/overtime')) return 'Payroll / Overtime';
    if (path.startsWith('/admin/leave')) return 'Management / Leave';
    if (path.startsWith('/admin/inventory')) return 'Management / Inventory';
    if (path.startsWith('/admin/reports')) return 'Management / Reports';
    if (path.startsWith('/admin/attendance')) return 'Workforce / Attendance';
    if (path.startsWith('/admin/shifts')) return 'Workforce / Shifts';
    return 'Dashboard';
  };

  return (
    <header className={styles.header} aria-label="Main administrator header">
      {/* Left side: Toggle button, contextual back button, and breadcrumb */}
      <div className={styles.left}>
        <button 
          onClick={onToggleSidebar} 
          className={styles.toggleBtn}
          aria-label="Toggle sidebar panel"
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>

        {fromOrganisationSettings && (
          <>
            <span className={styles.navDivider} />
            <button
              type="button"
              className={styles.backToOrgBtn}
              onClick={handleOpenSettingsModal}
              title="Back to Organisation Settings"
              aria-label="Back to Organisation Settings"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
            </button>
          </>
        )}

        <span className={styles.breadcrumb}>{getBreadcrumb()}</span>
      </div>

      {/* Center: Search employees, clients bar */}
      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search employees, clients..." 
          className={styles.searchInput}
          aria-label="Global workforce search"
        />
      </div>

      {/* Right side: Actions, Notifications, Profile dropdown */}
      <div className={styles.right}>
        <div className={styles.dateTimeBlock} aria-live="polite">
          <span className={styles.dateTimeText}>{formattedDateTime}</span>
        </div>

        {/* Notifications */}
        <div className={styles.notificationWrapper}>
          <button className={styles.actionBtn} aria-label="View recent alerts">
            <Bell size={19} strokeWidth={2} />
            <span className={styles.badge} aria-label="5 unread notifications">5</span>
          </button>
        </div>

        {/* Admin settings button - opens Organisation Settings modal */}
        <button 
          onClick={handleOpenSettingsModal} 
          className={styles.actionBtn} 
          aria-label="Organisation Settings"
          title="Organisation Settings"
        >
          <Settings size={18} strokeWidth={2.2} />
        </button>

        {/* Vertical divider */}
        <span className={styles.divider} />

        {/* User profile dropdown */}
        <Dropdown 
          align="right"
          trigger={
            <button className={styles.profileTrigger} aria-label="Profile options menu">
              <Avatar initials={activeCompany?.code ? activeCompany.code.substring(0, 2) : 'RR'} size="sm" status={null} />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>{activeCompany?.name || 'RR Security'}</span>
                <span className={styles.profileRole}>Administrator</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </button>
          }
        >
          <ul className={styles.dropdownMenu}>
            {/* Add Company Profile action */}
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={() => setIsAddCompanyModalOpen(true)}
                className={`${styles.dropdownLink} ${styles.addProfileOption}`}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Company Profile</span>
              </button>
            </li>

            <li className={styles.dropdownItemDivider} />

            {/* List of Company Profiles */}
            <div className={styles.dropdownSectionTitle}>
              Switch Company Profile ({(companies || []).length})
            </div>

            {(companies || []).map((comp) => {
              const isActive = comp.id === activeCompany?.id;
              return (
                <li key={comp.id} className={styles.dropdownItem}>
                  <button
                    type="button"
                    onClick={() => {
                      switchCompany(comp.id);
                      setToast({
                        message: `Switched to ${comp.name} profile`,
                        type: 'success'
                      });
                    }}
                    className={`${styles.dropdownLink} ${isActive ? styles.companyItemActive : ''}`}
                    title={comp.name}
                  >
                    <Building2 size={14} />
                    <div className={styles.companyItemMeta}>
                      <span className={styles.companyItemName}>{comp.name}</span>
                      <span className={styles.companyItemCode}>{comp.code}</span>
                    </div>
                    {isActive && <Check size={14} color="#2563eb" strokeWidth={2.5} />}
                  </button>
                </li>
              );
            })}

            <li className={styles.dropdownItemDivider} />

            {/* Logout option */}
            <li className={styles.dropdownItem}>
              <button onClick={onLogout} className={`${styles.dropdownLink} ${styles.logoutOption}`}>
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </Dropdown>

        {/* External Portals / Apps Trigger (9-dots icon) */}
        <button
          type="button"
          className={styles.appsGridBtn}
          onClick={() => setIsLinksDrawerOpen(true)}
          title="Government & Statutory Portals"
          aria-label="Open Government & Statutory Portals"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="4" cy="4" r="2.5" />
            <circle cx="12" cy="4" r="2.5" />
            <circle cx="20" cy="4" r="2.5" />
            <circle cx="4" cy="12" r="2.5" />
            <circle cx="12" cy="12" r="2.5" />
            <circle cx="20" cy="12" r="2.5" />
            <circle cx="4" cy="20" r="2.5" />
            <circle cx="12" cy="20" r="2.5" />
            <circle cx="20" cy="20" r="2.5" />
          </svg>
        </button>
      </div>

      {/* Organization Settings Modal */}
      <OrganizationSettingsModal 
        isOpen={isSettingsModalOpen || location.state?.organisationSettingsOpen === true} 
        onClose={handleCloseSettingsModal} 
      />

      {/* External Statutory Links Drawer */}
      <ExternalLinksDrawer
        isOpen={isLinksDrawerOpen}
        onClose={() => setIsLinksDrawerOpen(false)}
      />

      {/* Add Company Profile Modal */}
      <AddCompanyProfileModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onSuccess={(newCompany) => {
          setToast({
            message: `✓ Company "${newCompany.name}" profile created and activated!`,
            type: 'success'
          });
        }}
      />

      {/* Action Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </header>
  );
}

export default AdminHeader;
