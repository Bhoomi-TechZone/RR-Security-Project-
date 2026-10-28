import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, CircleHelp, ChevronDown, User, Settings, LogOut,
  ArrowLeft, Building2, Plus, Check, Shield, Cake, CalendarCheck, Receipt,
  WalletCards, CheckCheck, Loader2, Sparkles, Shirt, Package, FileWarning, ArrowRight
} from 'lucide-react';
import styles from './AdminHeader.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import Toast from '../common/Toast';
import OrganizationSettingsModal from '../settings/OrganizationSettingsModal';
import AddCompanyProfileModal from '../company/AddCompanyProfileModal';
import ExternalLinksDrawer from './ExternalLinksDrawer';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';
import notificationService from '../../services/notificationService';

function AdminHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { companies, activeCompany, switchCompany } = useCompany();
  const { userRole, currentUser, isAdmin } = usePermissions();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(
    location.state?.organisationSettingsOpen === true
  );
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Notifications Popover State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('all');
  const notifDropdownRef = useRef(null);

  const companyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    const fetchUnread = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const count = await notificationService.getUnreadCount(companyId);
        if (isMounted) setUnreadCount(count);
      } catch {} finally {
        isFetching = false;
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Polling every 30s
    const handleRefresh = () => fetchUnread();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('user_logged_in', handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('user_logged_in', handleRefresh);
    };
  }, [companyId]);

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

  const fetchNotificationsList = async () => {
    setIsLoadingNotifs(true);
    try {
      const res = await notificationService.getNotifications(companyId, { limit: 25 });
      if (res && res.data) {
        setNotificationsList(res.data);
      }
    } catch (e) {
      console.error('Failed to load notifications list:', e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const handleToggleNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState) {
      fetchNotificationsList();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isNotificationsOpen]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(companyId);
      setUnreadCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, status: 'read' })));
      setToast({ message: 'All notifications marked as read', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.status === 'unread') {
      try {
        await notificationService.markAsRead(companyId, notif._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotificationsList((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, status: 'read' } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }
    setIsNotificationsOpen(false);
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    } else {
      navigate('/admin/notifications?tab=notifications');
    }
  };

  const formatNotifTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffSec = Math.floor((new Date() - d) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getNotificationIconInfo = (type) => {
    switch (type) {
      case 'birthday':
        return { icon: Cake, bg: '#fdf2f8', color: '#db2777', badgeBg: '#fce7f3', label: 'Birthday' };
      case 'leave-application':
      case 'leave-approval':
        return { icon: CalendarCheck, bg: '#faf5ff', color: '#7c3aed', badgeBg: '#f3e8ff', label: 'Leave' };
      case 'reimbursement':
        return { icon: Receipt, bg: '#ecfdf5', color: '#059669', badgeBg: '#d1fae5', label: 'Claim' };
      case 'advance-loan':
        return { icon: WalletCards, bg: '#fffbeb', color: '#d97706', badgeBg: '#fef3c7', label: 'Advance' };
      case 'uniform-request':
        return { icon: Shirt, bg: '#eff6ff', color: '#2563eb', badgeBg: '#dbeafe', label: 'Uniform' };
      case 'asset-request':
        return { icon: Package, bg: '#f0fdf4', color: '#16a34a', badgeBg: '#dcfce7', label: 'Asset' };
      case 'document-expiry':
      case 'compliance_alert':
        return { icon: FileWarning, bg: '#fef2f2', color: '#dc2626', badgeBg: '#fee2e2', label: 'Compliance' };
      default:
        return { icon: Bell, bg: '#f1f5f9', color: '#475569', badgeBg: '#e2e8f0', label: 'Alert' };
    }
  };

  const filteredNotifications = notificationsList.filter((item) => {
    if (activeNotifTab === 'all') return true;
    if (activeNotifTab === 'birthday') return item.type === 'birthday';
    if (activeNotifTab === 'leave') return item.type === 'leave-application' || item.type === 'leave-approval';
    if (activeNotifTab === 'claim') return item.type === 'reimbursement' || item.type === 'advance-loan';
    return true;
  });

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
    if (path.startsWith('/admin/all-companies') || path.startsWith('/admin/all-company')) return 'Organization / All Company';
    if (path.startsWith('/admin/settings') || path.startsWith('/admin/organization-settings')) return 'System / Organisation Settings';
    if (path.startsWith('/admin/company-setup')) return 'System / Organization Setup';
    if (path.startsWith('/admin/work-locations')) return 'System / Work Locations';
    if (path.startsWith('/admin/clients/')) return 'Workforce / Clients / Details';
    if (path.startsWith('/admin/clients')) return 'Workforce / Clients';
    if (path.startsWith('/admin/companies/')) return 'Workforce / Clients / Details';
    if (path.startsWith('/admin/companies')) return 'Workforce / Clients';
    if (path.startsWith('/admin/employees')) return 'Workforce / Employees';
    if (path.startsWith('/admin/roles-permissions')) return 'System / Role & Permissions';
    if (path.startsWith('/admin/users')) return 'System / User Management';
    if (path.startsWith('/admin/masters')) return 'System / Masters';
    if (path.startsWith('/admin/notifications')) {
      return location.search.includes('tab=notifications') ? 'System / Notifications' : 'System / Announcements';
    }
    if (path.startsWith('/admin/payroll')) {
      if (location.search.includes('tab=structure')) return 'Payroll / Salary Structure';
      if (location.search.includes('tab=rate-revision')) return 'Payroll / Rate Revision';
      if (location.search.includes('tab=arrears')) return 'Payroll / Arrears';
      if (location.search.includes('tab=slips')) return 'Payroll / Salary Slips';
      if (location.search.includes('tab=statutory')) return 'Payroll / Statutory Reports';
      return 'Payroll / Payroll Processing';
    }
    if (path.startsWith('/admin/advances-loans')) return 'Payroll / Advances & Loans';
    if (path.startsWith('/admin/overtime')) return 'Payroll / Overtime';
    if (path.startsWith('/admin/leave')) return 'Management / Leave';
    if (path.startsWith('/admin/inventory')) return 'Management / Inventory';
    if (path.startsWith('/admin/reports')) return 'Management / Reports';
    if (path.startsWith('/admin/biometric-attendance')) return 'Workforce / Biometric Attendance';
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

        {/* Notifications Popover */}
        <div className={styles.notificationWrapper} ref={notifDropdownRef}>
          <button 
            className={`${styles.actionBtn} ${isNotificationsOpen ? styles.actionBtnActive : ''}`} 
            aria-label="View notifications"
            onClick={handleToggleNotifications}
            title="System, Birthday & Employee Activity Notifications"
          >
            <Bell size={19} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className={styles.badge} aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className={styles.notificationPopover} role="dialog" aria-label="Notifications Panel">
              {/* Popover Header */}
              <div className={styles.popoverHeader}>
                <div className={styles.popoverTitleRow}>
                  <div className={styles.popoverTitleWrap}>
                    <h4 className={styles.popoverTitle}>Notifications</h4>
                    {unreadCount > 0 && (
                      <span className={styles.unreadPill}>{unreadCount} new</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.markAllReadBtn}
                      onClick={handleMarkAllAsRead}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className={styles.notifTabs}>
                  <button
                    type="button"
                    className={`${styles.notifTabBtn} ${activeNotifTab === 'all' ? styles.notifTabActive : ''}`}
                    onClick={() => setActiveNotifTab('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`${styles.notifTabBtn} ${activeNotifTab === 'birthday' ? styles.notifTabActive : ''}`}
                    onClick={() => setActiveNotifTab('birthday')}
                  >
                    🎂 Birthdays
                  </button>
                  <button
                    type="button"
                    className={`${styles.notifTabBtn} ${activeNotifTab === 'leave' ? styles.notifTabActive : ''}`}
                    onClick={() => setActiveNotifTab('leave')}
                  >
                    🏖️ Leaves
                  </button>
                  <button
                    type="button"
                    className={`${styles.notifTabBtn} ${activeNotifTab === 'claim' ? styles.notifTabActive : ''}`}
                    onClick={() => setActiveNotifTab('claim')}
                  >
                    💳 Claims
                  </button>
                </div>
              </div>

              {/* Popover Content */}
              <div className={styles.popoverBody}>
                {isLoadingNotifs ? (
                  <div className={styles.popoverLoading}>
                    <Loader2 size={22} className={styles.spinning} />
                    <span>Loading latest updates...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className={styles.popoverEmpty}>
                    <div className={styles.emptyIconWrap}>
                      <Bell size={24} strokeWidth={1.5} color="#94a3b8" />
                    </div>
                    <p className={styles.emptyTitle}>All caught up!</p>
                    <p className={styles.emptySub}>No notifications in this category.</p>
                  </div>
                ) : (
                  <div className={styles.notifList}>
                    {filteredNotifications.map((notif) => {
                      const iconInfo = getNotificationIconInfo(notif.type);
                      const IconComponent = iconInfo.icon;
                      const isUnread = notif.status === 'unread';

                      return (
                        <div
                          key={notif._id}
                          className={`${styles.notifItem} ${isUnread ? styles.notifItemUnread : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          role="button"
                          tabIndex={0}
                        >
                          <div
                            className={styles.notifIconWrap}
                            style={{ backgroundColor: iconInfo.bg, color: iconInfo.color }}
                          >
                            <IconComponent size={16} strokeWidth={2.2} />
                          </div>

                          <div className={styles.notifDetails}>
                            <div className={styles.notifHeaderLine}>
                              <span className={styles.notifCategoryTag} style={{ backgroundColor: iconInfo.badgeBg, color: iconInfo.color }}>
                                {iconInfo.label}
                              </span>
                              <span className={styles.notifTime}>{formatNotifTime(notif.createdAt || notif.date)}</span>
                            </div>

                            <p className={styles.notifItemTitle}>{notif.title}</p>
                            <p className={styles.notifItemMessage}>{notif.message}</p>

                            <div className={styles.notifActionRow}>
                              <span className={styles.notifActionLink}>
                                {notif.type === 'birthday' ? 'View Employee →' : notif.type === 'leave-application' ? 'Review Leave →' : notif.type === 'reimbursement' ? 'Review Claim →' : notif.type === 'advance-loan' ? 'Review Advance →' : 'View Details →'}
                              </span>
                            </div>
                          </div>

                          {isUnread && <span className={styles.unreadDot} aria-hidden="true" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Popover Footer */}
              <div className={styles.popoverFooter}>
                <button
                  type="button"
                  className={styles.viewAllFooterBtn}
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/admin/notifications?tab=notifications');
                  }}
                >
                  <span>View All in Notification Center</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}
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

        {/* User profile card (unclickable display) */}
        <div className={styles.profileStatic} aria-label="Current user profile">
          <Avatar 
            src={activeCompany?.logo} 
            initials={activeCompany?.code ? activeCompany.code.substring(0, 2) : 'RR'} 
            name={activeCompany?.name || 'RR Security'}
            size="sm" 
            status={null} 
          />
          <div className={styles.profileMeta}>
            <span className={styles.profileName}>{isAdmin ? (currentUser?.name || activeCompany?.name || 'RR Security Administrator') : (currentUser?.name || 'Administrator')}</span>
            <span className={styles.profileRole}>{isAdmin ? 'Administrator' : (userRole || 'Administrator')}</span>
          </div>
        </div>

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
