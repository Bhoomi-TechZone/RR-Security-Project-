import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCheck,
  Eye,
  FileWarning,
  IndianRupee,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import announcementService from '../../services/announcementService';
import clientService from '../../services/clientService';
import inventoryService from '../../services/inventoryService';
import { notificationData } from '../../data/notificationData';
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
  { value: 'all', label: 'All' },
  { value: 'leave-approval', label: 'Leave Approval' },
  { value: 'salary-processed', label: 'Salary Processed' },
  { value: 'document-expiry', label: 'Document Expiry' }
];

const badgeClass = (value) => ({
  published: styles.publishedBadge,
  draft: styles.draftBadge,
  read: styles.readBadge,
  unread: styles.unreadBadge,
  all: styles.infoBadge,
  clients: styles.clientBadge,
  employees: styles.employeeBadge
}[value] || '');

const iconMap = {
  'leave-approval': CalendarCheck,
  'salary-processed': IndianRupee,
  'document-expiry': FileWarning
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

          <div className={styles.fieldGroup}>
            <label>Audience *</label>
            <select value={form.audience} onChange={(event) => updateField('audience', event.target.value)}>
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {form.audience === 'clients' && (
            <div className={styles.fieldGroup}>
              <label>Target Client</label>
              <select
                value={form.targetClientId || ''}
                onChange={(event) => {
                  const selected = clients.find((c) => (c.clientId || c.id || c._id) === event.target.value);
                  updateField('targetClientId', event.target.value);
                  updateField('targetClientName', selected ? selected.name : '');
                }}
              >
                <option value="">All Clients</option>
                {clients.map((client) => {
                  const id = client.clientId || client.id || client._id;
                  return (
                    <option key={id} value={id}>
                      {client.name} {client.clientId ? `(${client.clientId})` : ''}
                    </option>
                  );
                })}
              </select>
              {form.targetClientName && <small className={styles.helperText}>Targeted to: {form.targetClientName}</small>}
            </div>
          )}

          {form.audience === 'employees' && (
            <div className={styles.fieldGroup}>
              <label>Target Employee</label>
              <select
                value={form.employeeId || ''}
                onChange={(event) => {
                  const selected = employees.find((e) => (e.employeeId || e.id || e._id) === event.target.value);
                  updateField('employeeId', event.target.value);
                  updateField('employeeName', selected ? selected.name : '');
                }}
              >
                <option value="">All Employees</option>
                {employees.map((employee) => {
                  const id = employee.employeeId || employee.id || employee._id;
                  return (
                    <option key={id} value={id}>
                      {employee.name} — {employee.employeeId || employee.employeeCode || id}
                    </option>
                  );
                })}
              </select>
              {form.employeeName && <small className={styles.helperText}>Targeted to: {form.employeeName}</small>}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label>Priority</label>
            <select value={form.priority || 'normal'} onChange={(event) => updateField('priority', event.target.value)}>
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Message *</label>
            <textarea
              value={form.message}
              onChange={(event) => updateField('message', event.target.value)}
              placeholder="Write your announcement..."
              rows={5}
            />
            {errors.message && <span className={styles.errorText}>{errors.message}</span>}
          </div>
        </div>

        <div className={styles.modalActions}>
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

function NotificationDetailsDrawer({ item, onClose, onMarkAsRead }) {
  if (!item) return null;

  const Icon = iconMap[item.type] || Bell;

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
          <div className={styles.detailRow}><span>Notification Type</span><strong>{notificationTypeOptions.find((option) => option.value === item.type)?.label || item.type}</strong></div>
          <div className={styles.detailRow}><span>Title</span><strong>{item.title}</strong></div>
          <div className={styles.detailRow}><span>Message</span><strong>{item.message}</strong></div>
          <div className={styles.detailRow}><span>Employee</span><strong>{item.employeeName ? `${item.employeeName} — ${item.employeeId}` : '—'}</strong></div>
          <div className={styles.detailRow}><span>Client</span><strong>{item.clientName || '—'}</strong></div>
          <div className={styles.detailRow}><span>Date</span><strong>{formatDate(item.date)}</strong></div>
          <div className={styles.detailRow}><span>Status</span><span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>{item.status === 'unread' ? 'Unread' : 'Read'}</span></div>
        </div>

        {item.status === 'unread' && (
          <div className={styles.drawerActions}>
            <button type="button" className={styles.primaryButton} onClick={() => onMarkAsRead(item.id)}>
              <Icon size={16} /> Mark as Read
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const tabParam = searchParams.get('tab') || 'announcements';
  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const audienceParam = searchParams.get('audience');

  const [activeTab, setActiveTab] = useState(tabParam);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState(notificationData);
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

  // Fetch dynamic announcements, clients, and employees
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [annList, clientList, empList] = await Promise.allSettled([
        announcementService.getAnnouncements(companyId),
        clientService.getClients(companyId),
        inventoryService.getEmployees(companyId)
      ]);

      if (annList.status === 'fulfilled' && Array.isArray(annList.value)) {
        setAnnouncements(annList.value);
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
  }, [companyId]);

  useEffect(() => {
    loadData();
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

  const unreadCount = notifications.filter((item) => item.status === 'unread').length;

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
    try {
      if (!deleteTarget) return;
      const id = deleteTarget.announcementId || deleteTarget._id || deleteTarget.id;
      await announcementService.deleteAnnouncement(id);
      setToast({ type: 'success', message: '✓ Announcement deleted successfully.' });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete announcement.' });
    }
  };

  const handleMarkAsRead = (id) => {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, status: 'read' } : item));
    setSelectedNotification((current) => (current && current.id === id ? { ...current, status: 'read' } : current));
    setToast({ type: 'success', message: '✓ Notification marked as read.' });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span 
            className={styles.breadcrumbLink}
            onClick={() => navigate('/admin/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            Dashboard
          </span>
          <span>/</span>
          <span 
            className={styles.breadcrumbLink}
            onClick={() => handleTabChange('announcements')}
            style={{ cursor: activeTab !== 'announcements' ? 'pointer' : 'default', color: activeTab !== 'announcements' ? 'var(--primary, #2563eb)' : 'inherit', fontWeight: activeTab !== 'announcements' ? 500 : 600 }}
          >
            Notifications &amp; Announcements
          </span>
          {activeTab !== 'announcements' && (
            <>
              <span>/</span>
              <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600 }}>
                {TABS.find(t => t.id === activeTab)?.label || activeTab}
              </span>
            </>
          )}
        </nav>

        <header className={styles.pageHeader}>
          <div>
            <h1>Notifications &amp; Announcements</h1>
            <p className={styles.pageDescription}>Manage announcements and view system-generated notifications for clients and employees.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className={styles.secondaryButton} onClick={loadData} title="Refresh Announcements">
              <RefreshCw size={15} className={loading ? styles.spinning : ''} />
              Refresh
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => { setEditingAnnouncement(null); setAnnouncementFormOpen(true); }}>
              <Plus size={16} /> Post Announcement
            </button>
          </div>
        </header>

        <div className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? styles.activeTab : styles.tab}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'announcements' ? (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Announcements</p>
                <h2>Announcements</h2>
                <p className={styles.sectionDescription}>Create and manage targeted announcements visible in Client and Employee panels.</p>
              </div>
              <button type="button" className={styles.primaryButton} onClick={() => { setEditingAnnouncement(null); setAnnouncementFormOpen(true); }}>
                <Plus size={16} /> Post Announcement
              </button>
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
                <h3>No announcements found.</h3>
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
                <h2>Notifications</h2>
                <p className={styles.sectionDescription}>View system-generated alerts related to HRMS activities.</p>
              </div>
              <div className={styles.unreadBadgeRow}>
                <span className={styles.notificationCountLabel}>Unread Notifications</span>
                <span className={styles.notificationCount}>{unreadCount}</span>
              </div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchBox}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={notificationSearch}
                  onChange={(event) => { setNotificationPage(1); setNotificationSearch(event.target.value); }}
                />
              </div>

              <select value={notificationTypeFilter} onChange={(event) => { setNotificationPage(1); setNotificationTypeFilter(event.target.value); }}>
                <option value="all">All</option>
                <option value="leave-approval">Leave Approval</option>
                <option value="salary-processed">Salary Processed</option>
                <option value="document-expiry">Document Expiry</option>
              </select>

              <select value={notificationStatusFilter} onChange={(event) => { setNotificationPage(1); setNotificationStatusFilter(event.target.value); }}>
                <option value="all">All</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
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
                      <div key={item.id} className={`${styles.notificationCard} ${item.status === 'unread' ? styles.notificationUnread : ''}`}>
                        <div className={styles.notificationIconWrap}>
                          <Icon size={18} />
                        </div>
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationHeader}>
                            <h3>{item.title}</h3>
                            <span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>{item.status === 'unread' ? 'Unread' : 'Read'}</span>
                          </div>
                          <p>{item.message}</p>
                          <div className={styles.metaRow}>
                            <span>{item.employeeName || 'System'}</span>
                            <span>{formatDate(item.date)}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={`${styles.statusBadge} ${styles.infoBadge}`}>{notificationTypeOptions.find((option) => option.value === item.type)?.label || 'Notification'}</span>
                            <button type="button" className={styles.linkButton} onClick={() => setSelectedNotification(item)}>View</button>
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
                <h3>No notifications found.</h3>
                <p>You&apos;re all caught up.</p>
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
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="Delete Announcement?"
          description="Are you sure you want to delete this announcement?"
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
