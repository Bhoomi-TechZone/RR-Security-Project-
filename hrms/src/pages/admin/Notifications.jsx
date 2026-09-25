import React, { useMemo, useState } from 'react';
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
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { mockCompanies } from '../../data/companyData';
import { mockEmployees } from '../../data/employeeData';
import { announcementData } from '../../data/announcementData';
import { notificationData } from '../../data/notificationData';
import styles from './Notifications.module.css';

const PAGE_SIZE = 10;
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
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

function AnnouncementForm({ isOpen, mode = 'create', initialData = null, onClose, onSave }) {
  const defaultForm = {
    title: '',
    audience: 'all',
    companyId: '',
    companyName: '',
    employeeId: '',
    employeeName: '',
    message: ''
  };
  const [form, setForm] = useState(initialData || defaultForm);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
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
      companyId: form.audience === 'clients' ? form.companyId : null,
      companyName: form.audience === 'clients' ? form.companyName : null,
      employeeId: form.audience === 'employees' ? form.employeeId : null,
      employeeName: form.audience === 'employees' ? form.employeeName : null,
      status: 'published'
    });
  };

  const selectedCompany = mockCompanies.find((company) => company.id === form.companyId);
  const selectedEmployee = mockEmployees.find((employee) => employee.employeeId === form.employeeId);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{mode === 'edit' ? 'Edit Announcement' : 'Post Announcement'}</h3>
          <button type="button" className={styles.closeButton} aria-label="Close modal" onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.fieldGroup}>
            <label>Announcement Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Enter announcement title"
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label>Audience</label>
            <select value={form.audience} onChange={(event) => updateField('audience', event.target.value)}>
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {form.audience === 'clients' && (
            <div className={styles.fieldGroup}>
              <label>Company</label>
              <select
                value={form.companyId}
                onChange={(event) => {
                  const company = mockCompanies.find((item) => item.id === event.target.value);
                  updateField('companyId', event.target.value);
                  updateField('companyName', company ? company.name : '');
                }}
              >
                <option value="">All Clients</option>
                {mockCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              {selectedCompany && <small className={styles.helperText}>{selectedCompany.name}</small>}
            </div>
          )}

          {form.audience === 'employees' && (
            <div className={styles.fieldGroup}>
              <label>Employee</label>
              <select
                value={form.employeeId}
                onChange={(event) => {
                  const employee = mockEmployees.find((item) => item.employeeId === event.target.value);
                  updateField('employeeId', event.target.value);
                  updateField('employeeName', employee ? employee.name : '');
                }}
              >
                <option value="">All Employees</option>
                {mockEmployees.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>{employee.name} — {employee.employeeId}</option>
                ))}
              </select>
              {selectedEmployee && <small className={styles.helperText}>{selectedEmployee.name}</small>}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label>Message</label>
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
          <div className={styles.detailRow}><span>Company</span><strong>{item.companyName || '—'}</strong></div>
          <div className={styles.detailRow}><span>Employee</span><strong>{item.employeeName || '—'}</strong></div>
          <div className={styles.detailRow}><span>Message</span><strong>{item.message}</strong></div>
          <div className={styles.detailRow}><span>Created By</span><strong>{item.createdBy}</strong></div>
          <div className={styles.detailRow}><span>Created Date</span><strong>{formatDate(item.createdDate)}</strong></div>
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
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState(announcementData);
  const [notifications, setNotifications] = useState(notificationData);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [announcementAudienceFilter, setAnnouncementAudienceFilter] = useState('all');
  const [announcementStatusFilter, setAnnouncementStatusFilter] = useState('all');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('all');
  const [notificationStatusFilter, setNotificationStatusFilter] = useState('all');
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isAnnouncementFormOpen, setAnnouncementFormOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [toast, setToast] = useState(null);

  const unreadCount = notifications.filter((item) => item.status === 'unread').length;

  const filteredAnnouncements = useMemo(() => {
    const query = announcementSearch.toLowerCase();
    return announcements.filter((item) => {
      const matchesSearch = !query || `${item.title} ${item.message}`.toLowerCase().includes(query);
      const matchesAudience = announcementAudienceFilter === 'all' || item.audience === announcementAudienceFilter;
      const matchesStatus = announcementStatusFilter === 'all' || item.status === announcementStatusFilter;
      return matchesSearch && matchesAudience && matchesStatus;
    });
  }, [announcements, announcementSearch, announcementAudienceFilter, announcementStatusFilter]);

  const filteredNotifications = useMemo(() => {
    const query = notificationSearch.toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch = !query || `${item.title} ${item.message} ${item.employeeName}`.toLowerCase().includes(query);
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

  const handleAnnouncementSubmit = (payload) => {
    if (editingAnnouncement) {
      setAnnouncements((current) => current.map((item) => item.id === editingAnnouncement.id ? { ...item, ...payload, status: payload.status || item.status } : item));
      setToast({ type: 'success', message: '✓ Announcement updated successfully.' });
    } else {
      const newAnnouncement = {
        ...payload,
        id: Date.now(),
        createdBy: 'Admin',
        createdDate: new Date().toISOString().slice(0, 10),
        status: 'published'
      };
      setAnnouncements((current) => [newAnnouncement, ...current]);
      setToast({ type: 'success', message: '✓ Announcement posted successfully.' });
    }

    setAnnouncementFormOpen(false);
    setEditingAnnouncement(null);
    setAnnouncementPage(1);
  };

  const handleDeleteAnnouncement = () => {
    setAnnouncements((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setToast({ type: 'success', message: '✓ Announcement deleted successfully.' });
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

        <div className={styles.breadcrumb}>
          <span>Dashboard</span>
          <span>/</span>
          <strong>Notifications &amp; Announcements</strong>
        </div>

        <header className={styles.pageHeader}>
          <div>
            <h1>Notifications &amp; Announcements</h1>
            <p className={styles.pageDescription}>Manage announcements and view system-generated notifications for clients and employees.</p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => { setEditingAnnouncement(null); setAnnouncementFormOpen(true); }}>
            <Plus size={16} /> Post Announcement
          </button>
        </header>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            className={activeTab === 'announcements' ? styles.activeTab : ''}
            onClick={() => setActiveTab('announcements')}
          >
            Announcements
          </button>
          <button
            type="button"
            className={activeTab === 'notifications' ? styles.activeTab : ''}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </div>

        {activeTab === 'announcements' ? (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Announcements</p>
                <h2>Announcements</h2>
                <p className={styles.sectionDescription}>Create and manage announcements visible to Client/User and Employee panels.</p>
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
                <option value="all">All</option>
                <option value="all">All Clients &amp; Employees</option>
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
                        <th>Audience</th>
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcementPageRows.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.titleCell}>
                              <strong>{item.title}</strong>
                              <small>{item.message}</small>
                            </div>
                          </td>
                          <td><span className={`${styles.statusBadge} ${badgeClass(item.audience)}`}>{item.audience === 'all' ? 'All Clients & Employees' : item.audience === 'clients' ? 'Clients' : 'Employees'}</span></td>
                          <td>{item.createdBy}</td>
                          <td>{formatDate(item.createdDate)}</td>
                          <td><span className={`${styles.statusBadge} ${badgeClass(item.status)}`}>{item.status === 'published' ? 'Published' : 'Draft'}</span></td>
                          <td>
                            <div className={styles.inlineActions}>
                              <button type="button" className={styles.iconButton} onClick={() => setSelectedAnnouncement(item)}><Eye size={14} /></button>
                              <button type="button" className={styles.iconButton} onClick={() => { setEditingAnnouncement(item); setAnnouncementFormOpen(true); }}><Pencil size={14} /></button>
                              <button type="button" className={styles.iconButton} onClick={() => { setDeleteTarget(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
          initialData={editingAnnouncement ? {
            title: editingAnnouncement.title,
            audience: editingAnnouncement.audience,
            companyId: editingAnnouncement.companyId || '',
            companyName: editingAnnouncement.companyName || '',
            employeeId: editingAnnouncement.employeeId || '',
            employeeName: editingAnnouncement.employeeName || '',
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
