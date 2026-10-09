import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileWarning,
  IndianRupee,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Shirt,
  Trash2,
  WalletCards,
  X,
  XCircle
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import announcementService from '../../services/announcementService';
import clientService from '../../services/clientService';
import employeeService from '../../services/employeeService';
import notificationService from '../../services/notificationService';
import inventoryService from '../../services/inventoryService';
import reimbursementService from '../../services/reimbursementService';
import advanceLoanService from '../../services/advanceLoanService';
import leaveService from '../../services/leaveService';
import styles from './Notifications.module.css';

const TABS = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'notifications', label: 'Notifications' }
];

const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const audienceOptions = [
  { value: 'all', label: 'All Clients & Employees' },
  { value: 'clients', label: 'Clients' },
  { value: 'employees', label: 'Employees' }
];

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' }
];

const notificationTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'asset-request', label: 'Asset Request' },
  { value: 'uniform-request', label: 'Uniform Request' },
  { value: 'reimbursement', label: 'Reimbursement Claim' },
  { value: 'advance-loan', label: 'Advance & Loan' },
  { value: 'leave-application', label: 'Leave Application' },
  { value: 'leave-approval', label: 'Leave Approval' },
  { value: 'attendance-correction', label: 'Attendance Correction' },
  { value: 'salary-processed', label: 'Salary Processed' },
  { value: 'document-expiry', label: 'Document Expiry' },
  { value: 'general', label: 'General Alert' }
];

const badgeClass = (value) => ({
  published: styles.publishedBadge,
  draft: styles.draftBadge,
  read: styles.readBadge,
  unread: styles.unreadBadge,
  approved: styles.approvedBadge,
  rejected: styles.rejectedBadge,
  pending: styles.unreadBadge,
  all: styles.infoBadge,
  clients: styles.clientBadge,
  employees: styles.employeeBadge
}[value] || '');

const iconMap = {
  'asset-request': Package,
  'uniform-request': Shirt,
  'reimbursement': Receipt,
  'advance-loan': WalletCards,
  'leave-application': CalendarCheck,
  'leave-approval': CheckCircle2,
  'attendance-correction': Clock,
  'salary-processed': IndianRupee,
  'document-expiry': FileWarning,
  'general': Bell
};

function AnnouncementForm({ isOpen, mode = 'create', initialData = null, clients = [], employees = [], onClose, onSave }) {
  const defaultForm = {
    title: '',
    audience: 'all',
    targetClientId: '',
    targetClientName: '',
    employeeId: '',
    employeeName: '',
    priority: 'normal',
    message: ''
  };
  const [form, setForm] = useState(initialData || defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialData || defaultForm);
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Announcement title is required.';
    if (!form.message.trim()) nextErrors.message = 'Message is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      ...form,
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      targetClientId: form.audience === 'clients' ? form.targetClientId : null,
      targetClientName: form.audience === 'clients' ? form.targetClientName : null,
      companyIdTarget: form.audience === 'clients' ? form.targetClientId : null,
      companyName: form.audience === 'clients' ? form.targetClientName : null,
      employeeId: form.audience === 'employees' ? form.employeeId : null,
      employeeName: form.audience === 'employees' ? form.employeeName : null,
      priority: form.priority || 'normal',
      status: 'published'
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{mode === 'edit' ? 'Edit Announcement' : 'Post Announcement'}</h3>
          <button type="button" className={styles.closeButton} aria-label="Close modal" onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.fieldGroup}>
            <label>Announcement Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Enter announcement title"
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

          <div className={styles.twoCol}>
            <div className={styles.fieldGroup}>
              <label>Target Audience</label>
              <select value={form.audience} onChange={(event) => updateField('audience', event.target.value)}>
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label>Priority</label>
              <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.audience === 'clients' && (
            <div className={styles.fieldGroup}>
              <label>Target Specific Client (Optional)</label>
              <select
                value={form.targetClientId}
                onChange={(event) => {
                  const selected = clients.find((c) => (c.clientId || c.id || c._id) === event.target.value);
                  updateField('targetClientId', event.target.value);
                  updateField('targetClientName', selected ? (selected.clientName || selected.companyName || selected.name) : '');
                }}
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.clientId || c.id || c._id} value={c.clientId || c.id || c._id}>
                    {c.clientName || c.companyName || c.name || c.clientId}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.audience === 'employees' && (
            <div className={styles.fieldGroup}>
              <label>Target Specific Employee (Optional)</label>
              <select
                value={form.employeeId}
                onChange={(event) => {
                  const selected = employees.find((e) => (e.employeeId || e.id || e._id) === event.target.value);
                  updateField('employeeId', event.target.value);
                  updateField('employeeName', selected ? (selected.name || `${selected.personalInfo?.firstName || ''} ${selected.personalInfo?.lastName || ''}`.trim()) : '');
                }}
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.employeeId || e.id || e._id} value={e.employeeId || e.id || e._id}>
                    {e.name || `${e.personalInfo?.firstName || ''} ${e.personalInfo?.lastName || ''}`.trim() || e.employeeId} — {e.employeeId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label>Message Content *</label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(event) => updateField('message', event.target.value)}
              placeholder="Write the announcement message details here..."
            />
            {errors.message && <span className={styles.errorText}>{errors.message}</span>}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
            {mode === 'edit' ? 'Save Changes' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementDetailsDrawer({ item, onClose }) {
  if (!item) return null;

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <aside className={styles.drawerPanel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.eyebrow}>Announcement Details</p>
            <h3>{item.title}</h3>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Close details" onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.detailRow}><span>Audience</span><strong>{audienceOptions.find((option) => option.value === item.audience)?.label || 'All Clients & Employees'}</strong></div>
          {item.audience === 'clients' && (
            <div className={styles.detailRow}><span>Target Client</span><strong>{item.targetClientName || item.companyName || 'All Clients'}</strong></div>
          )}
          {item.audience === 'employees' && (
            <div className={styles.detailRow}><span>Target Employee</span><strong>{item.employeeName ? `${item.employeeName} (${item.employeeId})` : 'All Employees'}</strong></div>
          )}
          <div className={styles.detailRow}><span>Priority</span><strong>{(item.priority || 'normal').toUpperCase()}</strong></div>
          <div className={styles.detailRow}><span>Message</span><strong>{item.message}</strong></div>
          <div className={styles.detailRow}><span>Created By</span><strong>{item.createdBy || 'Admin'}</strong></div>
          <div className={styles.detailRow}><span>Created Date</span><strong>{formatDate(item.createdDate || item.createdAt)}</strong></div>
          <div className={styles.detailRow}><span>Status</span><span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>{item.status === 'published' ? 'Published' : 'Draft'}</span></div>
        </div>
      </aside>
    </div>
  );
}

function NotificationDetailsDrawer({ item, onClose, onMarkAsRead, onApprove, onReject }) {
  if (!item) return null;

  const Icon = iconMap[item.type] || Bell;
  const isActionable = ['uniform-request', 'asset-request', 'reimbursement', 'advance-loan', 'leave-application'].includes(item.type);

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <aside className={styles.drawerPanel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.eyebrow}>Notification Details</p>
            <h3>{item.title}</h3>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Close details" onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.detailRow}>
            <span>Notification Type</span>
            <strong>{notificationTypeOptions.find((option) => option.value === item.type)?.label || item.type}</strong>
          </div>
          <div className={styles.detailRow}><span>Title</span><strong>{item.title}</strong></div>
          <div className={styles.detailRow}><span>Message</span><strong>{item.message}</strong></div>
          {item.employeeName && (
            <div className={styles.detailRow}>
              <span>Associated Employee</span>
              <strong>{item.employeeName} {item.employeeId ? `(${item.employeeId})` : ''}</strong>
            </div>
          )}
          {item.clientName && (
            <div className={styles.detailRow}><span>Client / Site</span><strong>{item.clientName}</strong></div>
          )}
          {item.referenceId && (
            <div className={styles.detailRow}><span>Reference ID</span><strong>{item.referenceId}</strong></div>
          )}
          <div className={styles.detailRow}><span>Date</span><strong>{formatDate(item.date || item.createdAt)}</strong></div>
          <div className={styles.detailRow}>
            <span>Status</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {item.actionStatus && item.actionStatus !== 'pending' && item.actionStatus !== 'none' && (
                <span className={`${styles.statusBadge} ${badgeClass(item.actionStatus)}`}>
                  {item.actionStatus === 'approved' ? <><Check size={12} /> Approved</> : <><XCircle size={12} /> Rejected</>}
                </span>
              )}
              <span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>{item.status === 'unread' ? 'Unread' : 'Read'}</span>
            </div>
          </div>
        </div>

        <div className={styles.drawerActions}>
          {isActionable && item.actionStatus && item.actionStatus !== 'pending' && item.actionStatus !== 'none' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`${styles.statusBadge} ${badgeClass(item.actionStatus)}`} style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                {item.actionStatus === 'approved' ? <><Check size={15} /> Request Approved</> : <><XCircle size={15} /> Request Rejected</>}
              </span>
            </div>
          ) : isActionable ? (
            <>
              <button
                type="button"
                className={styles.approveButton}
                onClick={() => onApprove(item)}
              >
                <Check size={16} /> Approve
              </button>
              <button
                type="button"
                className={styles.rejectButton}
                onClick={() => onReject(item)}
              >
                <XCircle size={16} /> Reject
              </button>
            </>
          ) : null}
          {item.status === 'unread' && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onMarkAsRead(item._id || item.id)}
            >
              <CheckCircle2 size={15} /> Mark as Read
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany, company } = useCompany();
  const companyId = activeCompany?.companyId || company?.companyId || activeCompany?.id || company?.id || 'RRS8392014SEC';

  const tabParam = searchParams.get('tab') || 'announcements';
  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const audienceParam = searchParams.get('audience');

  const [activeTab, setActiveTab] = useState(tabParam);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [announcementAudienceFilter, setAnnouncementAudienceFilter] = useState(audienceParam || 'all');
  const [announcementStatusFilter, setAnnouncementStatusFilter] = useState('all');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState(typeParam || 'all');
  const [notificationStatusFilter, setNotificationStatusFilter] = useState(statusParam || 'all');
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isAnnouncementFormOpen, setAnnouncementFormOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch dynamic announcements, notifications, clients, and employees from MongoDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [annList, notifRes, clientList, empList] = await Promise.allSettled([
        announcementService.getAnnouncements(companyId),
        notificationService.getNotifications(companyId, {
          type: notificationTypeFilter,
          status: notificationStatusFilter,
          search: notificationSearch
        }),
        clientService.getClients(companyId),
        employeeService.getEmployees(companyId)
      ]);

      if (annList.status === 'fulfilled' && Array.isArray(annList.value)) {
        setAnnouncements(annList.value);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value) {
        setNotifications(notifRes.value.data || []);
        setUnreadCount(notifRes.value.unreadCount || 0);
      }
      if (clientList.status === 'fulfilled' && Array.isArray(clientList.value)) {
        setClients(clientList.value);
      }
      if (empList.status === 'fulfilled' && Array.isArray(empList.value)) {
        setEmployees(empList.value);
      }
    } catch (err) {
      console.warn('Error loading notifications data:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, notificationTypeFilter, notificationStatusFilter, notificationSearch]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    const handleRefresh = () => loadData();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('user_logged_in', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('user_logged_in', handleRefresh);
    };
  }, [loadData]);

  // Sync state with URL params
  useEffect(() => {
    if (tabParam === 'notifications') {
      setActiveTab('notifications');
    } else {
      setActiveTab('announcements');
    }

    if (statusParam) setNotificationStatusFilter(statusParam);
    if (typeParam) setNotificationTypeFilter(typeParam);
    if (audienceParam) setAnnouncementAudienceFilter(audienceParam);
  }, [tabParam, statusParam, typeParam, audienceParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'announcements' ? {} : { tab: newTab });
  };

  const filteredAnnouncements = useMemo(() => {
    const query = announcementSearch.toLowerCase();
    return announcements.filter((item) => {
      const matchesSearch = !query || `${item.title} ${item.message} ${item.targetClientName || ''} ${item.employeeName || ''}`.toLowerCase().includes(query);
      const matchesAudience = announcementAudienceFilter === 'all' || item.audience === announcementAudienceFilter;
      const matchesStatus = announcementStatusFilter === 'all' || item.status === announcementStatusFilter;
      return matchesSearch && matchesAudience && matchesStatus;
    });
  }, [announcements, announcementSearch, announcementAudienceFilter, announcementStatusFilter]);

  const filteredNotifications = useMemo(() => {
    const query = notificationSearch.toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch = !query || `${item.title} ${item.message} ${item.employeeName || ''}`.toLowerCase().includes(query);
      const matchesType = notificationTypeFilter === 'all' || item.type === notificationTypeFilter;
      const matchesStatus = notificationStatusFilter === 'all' || item.status === notificationStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, notificationSearch, notificationTypeFilter, notificationStatusFilter]);

  const announcementPageRows = filteredAnnouncements.slice((announcementPage - 1) * PAGE_SIZE, announcementPage * PAGE_SIZE);
  const notificationPageRows = filteredNotifications.slice((notificationPage - 1) * PAGE_SIZE, notificationPage * PAGE_SIZE);

  const resetAnnouncementFilters = () => {
    setAnnouncementAudienceFilter('all');
    setAnnouncementStatusFilter('all');
    setAnnouncementSearch('');
    setAnnouncementPage(1);
  };

  const resetNotificationFilters = () => {
    setNotificationTypeFilter('all');
    setNotificationStatusFilter('all');
    setNotificationSearch('');
    setNotificationPage(1);
  };

  const handleAnnouncementSubmit = async (payload) => {
    try {
      if (editingAnnouncement) {
        const id = editingAnnouncement.announcementId || editingAnnouncement._id || editingAnnouncement.id;
        await announcementService.updateAnnouncement(id, payload);
        setToast({ type: 'success', message: '✓ Announcement updated successfully.' });
      } else {
        await announcementService.createAnnouncement(companyId, payload);
        setToast({ type: 'success', message: '✓ Announcement posted successfully.' });
      }

      await loadData();
      setAnnouncementFormOpen(false);
      setEditingAnnouncement(null);
      setAnnouncementPage(1);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save announcement.' });
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget.announcementId || deleteTarget._id || deleteTarget.id;
      await announcementService.deleteAnnouncement(id);
      setToast({ type: 'success', message: '✓ Announcement removed successfully.' });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete announcement.' });
    }
  };

  const handleApproveNotification = async (item) => {
    try {
      const refId = item.referenceId || item._id || item.id;
      if (item.type === 'uniform-request' || item.type === 'asset-request') {
        await inventoryService.actionRequest(companyId, refId, {
          action: 'approve',
          adminRemarks: 'Approved from notifications hub'
        });
      } else if (item.type === 'reimbursement') {
        await reimbursementService.reviewClaim(companyId, refId, {
          action: 'approve',
          reason: 'Approved from notifications hub'
        });
      } else if (item.type === 'advance-loan') {
        await advanceLoanService.approveRequest(companyId, refId, {
          remarks: 'Approved from notifications hub'
        });
      } else if (item.type === 'leave-application') {
        await leaveService.reviewLeaveRequest(companyId, refId, 'approve', 'Approved from notifications hub');
      }

      await notificationService.updateAction(companyId, item._id || item.id, 'approved');
      setToast({ type: 'success', message: `✓ ${item.title} approved successfully.` });
      setSelectedNotification(null);
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to approve request.' });
    }
  };

  const handleRejectNotification = async (item) => {
    try {
      const refId = item.referenceId || item._id || item.id;
      if (item.type === 'uniform-request' || item.type === 'asset-request') {
        await inventoryService.actionRequest(companyId, refId, {
          action: 'reject',
          adminRemarks: 'Rejected from notifications hub'
        });
      } else if (item.type === 'reimbursement') {
        await reimbursementService.reviewClaim(companyId, refId, {
          action: 'reject',
          reason: 'Rejected from notifications hub'
        });
      } else if (item.type === 'advance-loan') {
        await advanceLoanService.rejectRequest(companyId, refId, 'Rejected from notifications hub');
      } else if (item.type === 'leave-application') {
        await leaveService.reviewLeaveRequest(companyId, refId, 'reject', 'Rejected from notifications hub');
      }

      await notificationService.updateAction(companyId, item._id || item.id, 'rejected');
      setToast({ type: 'success', message: `✓ Request rejected.` });
      setSelectedNotification(null);
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to reject request.' });
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(companyId, id);
      setToast({ type: 'success', message: '✓ Notification marked as read.' });
      setSelectedNotification(null);
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update notification.' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(companyId);
      setToast({ type: 'success', message: '✓ All notifications marked as read.' });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update notifications.' });
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationService.clearReadNotifications(companyId);
      setToast({ type: 'success', message: '✓ Read notifications cleared.' });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to clear read notifications.' });
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className={styles.breadcrumb}>
          <span>Dashboard</span>
          <span>/</span>
          <span>Notifications &amp; Announcements</span>
          <span>/</span>
          <strong>{activeTab === 'announcements' ? 'Announcements' : 'Notifications'}</strong>
        </div>

        <header className={styles.header}>
          <div>
            <h1>Notifications &amp; Announcements</h1>
            <p>Manage announcements and view live system-generated notifications for employee requests, assets, and claims.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={loadData}
              title="Refresh"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setEditingAnnouncement(null);
                setAnnouncementFormOpen(true);
              }}
            >
              <Plus size={16} /> Post Announcement
            </button>
          </div>
        </header>

        <div className={styles.tabNav}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className={styles.tabBadge}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px' }}>
            <Loader2 size={28} className={styles.spin} />
            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Loading announcements and notifications...</span>
          </div>
        ) : activeTab === 'announcements' ? (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Broadcasts</p>
                <h2>Company Announcements</h2>
                <p className={styles.sectionDescription}>Targeted notices for clients, employees, and operations teams.</p>
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchBox}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={announcementSearch}
                  onChange={(event) => { setAnnouncementPage(1); setAnnouncementSearch(event.target.value); }}
                />
              </div>

              <select value={announcementAudienceFilter} onChange={(event) => { setAnnouncementPage(1); setAnnouncementAudienceFilter(event.target.value); }}>
                <option value="all">All Audience</option>
                <option value="clients">Clients</option>
                <option value="employees">Employees</option>
              </select>

              <select value={announcementStatusFilter} onChange={(event) => { setAnnouncementPage(1); setAnnouncementStatusFilter(event.target.value); }}>
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <button type="button" className={styles.secondaryButton} onClick={resetAnnouncementFilters}>Reset</button>
              <button type="button" className={styles.primaryButtonSmall} onClick={() => setAnnouncementPage(1)}>Apply</button>
            </div>

            {filteredAnnouncements.length ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Target Audience</th>
                        <th>Specific Target</th>
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcementPageRows.map((item) => {
                        const targetDetail = item.audience === 'clients'
                          ? (item.targetClientName || item.companyName || 'All Clients')
                          : item.audience === 'employees'
                            ? (item.employeeName ? `${item.employeeName} (${item.employeeId})` : 'All Employees')
                            : 'All Clients & Employees';

                        return (
                          <tr key={item.announcementId || item._id || item.id}>
                            <td>
                              <div className={styles.titleCell}>
                                <strong>{item.title}</strong>
                                <small>{item.message}</small>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${badgeClass(item.audience)}`}>
                                {item.audience === 'all' ? 'All' : item.audience === 'clients' ? 'Clients' : 'Employees'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>
                                {targetDetail}
                              </span>
                            </td>
                            <td>{item.createdBy || 'Admin'}</td>
                            <td>{formatDate(item.createdDate || item.createdAt)}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>
                                {item.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.inlineActions}>
                                <button type="button" className={styles.iconButton} onClick={() => setSelectedAnnouncement(item)} title="View Details">
                                  <Eye size={14} />
                                </button>
                                <button type="button" className={styles.iconButton} onClick={() => { setEditingAnnouncement(item); setAnnouncementFormOpen(true); }} title="Edit Announcement">
                                  <Pencil size={14} />
                                </button>
                                <button type="button" className={styles.iconButton} onClick={() => { setDeleteTarget(item); setDeleteModalOpen(true); }} title="Delete Announcement">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={announcementPage}
                  totalItems={filteredAnnouncements.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setAnnouncementPage}
                  label="announcements"
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <h3>No announcements yet</h3>
                <p>Try changing your filters or create a new announcement.</p>
                <button type="button" className={styles.primaryButton} onClick={() => setAnnouncementFormOpen(true)}>
                  <Plus size={16} /> Post Announcement
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Notifications</p>
                <h2>Activity Notifications</h2>
                <p className={styles.sectionDescription}>Live system alerts for employee asset requisitions, uniform requests, claims, and approvals.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.unreadBadgeRow}>
                  <span className={styles.notificationCountLabel}>Unread Notifications</span>
                  <span className={styles.notificationCount}>{unreadCount}</span>
                </div>
                {unreadCount > 0 && (
                  <button type="button" className={styles.secondaryButton} onClick={handleMarkAllAsRead} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    Mark All Read
                  </button>
                )}
                {notifications.some(n => n.status === 'read') && (
                  <button type="button" className={styles.secondaryButton} onClick={handleClearRead} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    Clear Read
                  </button>
                )}
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchBox}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search notifications, employees, requests..."
                  value={notificationSearch}
                  onChange={(event) => { setNotificationPage(1); setNotificationSearch(event.target.value); }}
                />
              </div>

              <select value={notificationTypeFilter} onChange={(event) => { setNotificationPage(1); setNotificationTypeFilter(event.target.value); }}>
                {notificationTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select value={notificationStatusFilter} onChange={(event) => { setNotificationPage(1); setNotificationStatusFilter(event.target.value); }}>
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              <button type="button" className={styles.secondaryButton} onClick={resetNotificationFilters}>Reset</button>
              <button type="button" className={styles.primaryButtonSmall} onClick={() => setNotificationPage(1)}>Apply</button>
            </div>

            {filteredNotifications.length ? (
              <>
                <div className={styles.notificationList}>
                  {notificationPageRows.map((item) => {
                    const Icon = iconMap[item.type] || Bell;
                    return (
                      <div key={item._id || item.id} className={`${styles.notificationCard} ${item.status === 'unread' ? styles.notificationUnread : ''}`}>
                        <div className={styles.notificationIconWrap}>
                          <Icon size={18} />
                        </div>
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationHeader}>
                            <h3>{item.title}</h3>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {item.actionStatus && item.actionStatus !== 'pending' && item.actionStatus !== 'none' && (
                                <span className={`${styles.statusBadge} ${badgeClass(item.actionStatus)}`}>
                                  {item.actionStatus === 'approved' ? <><Check size={12} /> Approved</> : <><XCircle size={12} /> Rejected</>}
                                </span>
                              )}
                              <span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>{item.status === 'unread' ? 'Unread' : 'Read'}</span>
                            </div>
                          </div>
                          <p>{item.message}</p>
                          <div className={styles.metaRow}>
                            <span>{item.employeeName ? `${item.employeeName} (${item.employeeId || 'Staff'})` : (item.clientName || 'System')}</span>
                            <span>{formatDate(item.date || item.createdAt)}</span>
                          </div>
                          <div className={styles.metaRow} style={{ marginTop: '8px' }}>
                            <span className={`${styles.statusBadge} ${styles.infoBadge}`}>
                              {notificationTypeOptions.find((option) => option.value === item.type)?.label || item.type}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {['uniform-request', 'asset-request', 'reimbursement', 'advance-loan', 'leave-application'].includes(item.type) && (!item.actionStatus || item.actionStatus === 'pending') && (
                                <>
                                  <button
                                    type="button"
                                    className={styles.approveButtonSmall}
                                    onClick={() => handleApproveNotification(item)}
                                    title="Approve request"
                                  >
                                    <Check size={13} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rejectButtonSmall}
                                    onClick={() => handleRejectNotification(item)}
                                    title="Reject request"
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                </>
                              )}
                              {item.status === 'unread' && (
                                <button
                                  type="button"
                                  className={styles.linkButton}
                                  onClick={() => handleMarkAsRead(item._id || item.id)}
                                >
                                  Mark Read
                                </button>
                              )}
                              <button type="button" className={styles.linkButton} onClick={() => setSelectedNotification(item)}>
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={notificationPage}
                  totalItems={filteredNotifications.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setNotificationPage}
                  label="notifications"
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <h3>No notifications yet</h3>
                <p>When employees submit uniform/asset requisitions, expense claims, or leave requests, real-time alerts will appear here.</p>
              </div>
            )}
          </section>
        )}

        <AnnouncementForm
          isOpen={isAnnouncementFormOpen}
          mode={editingAnnouncement ? 'edit' : 'create'}
          clients={clients}
          employees={employees}
          initialData={editingAnnouncement ? {
            title: editingAnnouncement.title,
            audience: editingAnnouncement.audience,
            targetClientId: editingAnnouncement.targetClientId || editingAnnouncement.companyIdTarget || '',
            targetClientName: editingAnnouncement.targetClientName || editingAnnouncement.companyName || '',
            employeeId: editingAnnouncement.employeeId || '',
            employeeName: editingAnnouncement.employeeName || '',
            priority: editingAnnouncement.priority || 'normal',
            message: editingAnnouncement.message
          } : null}
          onClose={() => { setAnnouncementFormOpen(false); setEditingAnnouncement(null); }}
          onSave={handleAnnouncementSubmit}
        />

        <AnnouncementDetailsDrawer item={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />

        <NotificationDetailsDrawer
          item={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={handleMarkAsRead}
          onApprove={handleApproveNotification}
          onReject={handleRejectNotification}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="Delete Announcement?"
          description="Are you sure you want to delete this announcement from the database?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteAnnouncement}
          onCancel={() => { setDeleteTarget(null); setDeleteModalOpen(false); }}
        />
      </div>
    </AdminLayout>
  );
}

export default NotificationsPage;
