import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSignature,
  Clock3,
  CheckCircle2,
  Download,
  Plus,
  Search,
  Eye,
  X,
  Ban,
  FileText
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import RequestBackButton from '../../components/common/RequestBackButton';
import authService from '../../services/authService';
import { addHubRequest } from '../../data/requestHubData';
import styles from './EmployeeModulePage.module.css';

const LETTER_TYPES = [
  'Salary Certificate',
  'Bonafide / Employment Verification Letter',
  'Experience Certificate',
  'NOC (Bank Loan / Visa / Passport)',
  'Address Proof Letter',
  'Transfer / Relieving Letter Copy'
];

const INITIAL_LETTER_REQUESTS = [
  {
    id: 'LTR-2026-201',
    letterType: 'Salary Certificate',
    purpose: 'Required by SBI branch for housing loan verification.',
    urgency: 'Normal',
    deliveryMode: 'Signed PDF',
    requestedOn: '2026-11-18',
    status: 'Pending',
    hrRemarks: ''
  },
  {
    id: 'LTR-2026-175',
    letterType: 'Bonafide / Employment Verification Letter',
    purpose: 'School admission verification for dependent.',
    urgency: 'High',
    deliveryMode: 'Signed PDF',
    requestedOn: '2026-11-04',
    status: 'Approved',
    hrRemarks: 'Issued and signed by HR Manager.'
  },
  {
    id: 'LTR-2026-140',
    letterType: 'Address Proof Letter',
    purpose: 'Bank KYC address update.',
    urgency: 'Normal',
    deliveryMode: 'Hard Copy + PDF',
    requestedOn: '2026-10-15',
    status: 'Approved',
    hrRemarks: 'Dispatched to site supervisor.'
  }
];

const STORAGE_KEY = 'novaspark_emp_letters_ui_v1';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
};

export default function MyLetters() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || {};
  const employeeId = currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || 'RRS0104';
  const employeeName = currentUser?.name || currentUser?.employeeName || 'Rajeshwar Dayal Singh';

  const [letters, setLetters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_LETTER_REQUESTS;
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [form, setForm] = useState({
    letterType: LETTER_TYPES[0],
    urgency: 'Normal',
    deliveryMode: 'Signed PDF',
    purpose: ''
  });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  const persist = (next) => {
    setLetters(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const summary = useMemo(() => {
    const total = letters.length;
    const pending = letters.filter((l) => l.status === 'Pending').length;
    const issued = letters.filter((l) => l.status === 'Approved').length;
    return { total, pending, issued };
  }, [letters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return letters.filter((l) => {
      if (typeFilter !== 'All' && l.letterType !== typeFilter) return false;
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;
      if (q && !`${l.id} ${l.letterType} ${l.purpose}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [letters, typeFilter, statusFilter, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.purpose.trim()) {
      showToast('Please provide the purpose for requesting this letter.', 'error');
      return;
    }

    const newId = `LTR-2026-${Math.floor(220 + Math.random() * 750)}`;
    const today = new Date().toISOString().slice(0, 10);

    const newItem = {
      id: newId,
      letterType: form.letterType,
      purpose: form.purpose.trim(),
      urgency: form.urgency,
      deliveryMode: form.deliveryMode,
      requestedOn: today,
      status: 'Pending',
      hrRemarks: ''
    };

    persist([newItem, ...letters]);

    addHubRequest({
      id: newId,
      categoryId: 'letter-request',
      categoryLabel: 'HR Letters',
      employeeId,
      employeeName,
      designation: currentUser?.designation || 'Staff Member',
      site: currentUser?.site || 'DLF CyberCity Tech Park',
      submittedDate: today,
      summary: `${form.letterType} (${form.deliveryMode})`,
      amountOrMetric: 'Official Letter',
      priority: form.urgency,
      stage: 'Pending HR Issuance',
      status: 'Pending',
      reason: form.purpose.trim(),
      remarks: '',
      details: {
        'Letter Type': form.letterType,
        Purpose: form.purpose.trim(),
        Format: form.deliveryMode
      }
    });

    setIsModalOpen(false);
    setForm({
      letterType: LETTER_TYPES[0],
      urgency: 'Normal',
      deliveryMode: 'Signed PDF',
      purpose: ''
    });
    showToast(`✓ Letter request ${newId} submitted to HR.`);
  };

  const handleWithdraw = (item) => {
    const next = letters.map((l) =>
      l.id === item.id ? { ...l, status: 'Cancelled', hrRemarks: 'Withdrawn by employee.' } : l
    );
    persist(next);
    showToast(`Letter request ${item.id} withdrawn.`, 'info');
  };

  return (
    <main className={styles.page}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span onClick={() => navigate('/employee/dashboard')}>Employee Portal</span>
          <span>/</span>
          <span onClick={() => navigate('/employee/requests')}>Request Hub</span>
          <span>/</span>
          <strong>HR Letters & Certificates</strong>
        </nav>

        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RequestBackButton />
              <h1 className={styles.pageTitle}>My HR Letters & Certificates</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Request official salary certificates, bonafide letters, NOCs, or experience letters from HR.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate('/employee/requests')}
            >
              All Requests Hub
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              <span>Request Letter</span>
            </button>
          </div>
        </header>

        {/* Summary KPIs */}
        <section className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.blue}`}>
              <FileSignature size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Total Requests</span>
              <strong className={styles.summaryValue}>{summary.total}</strong>
              <span className={styles.summaryMeta}>All letter requests</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.amber}`}>
              <Clock3 size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Pending HR</span>
              <strong className={styles.summaryValue}>{summary.pending}</strong>
              <span className={styles.summaryMeta}>In verification queue</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.green}`}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Issued Letters</span>
              <strong className={styles.summaryValue}>{summary.issued}</strong>
              <span className={styles.summaryMeta}>Ready for download</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.purple}`}>
              <FileText size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Letter Types</span>
              <strong className={styles.summaryValue}>{LETTER_TYPES.length}</strong>
              <span className={styles.summaryMeta}>Official HR formats</span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className={styles.filterCard}>
          <div className={styles.filterGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Search</label>
              <div className={styles.searchBox}>
                <Search size={15} />
                <input
                  className={styles.input}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID, letter type, purpose..."
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Letter Type</label>
              <select
                className={styles.select}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Letter Types</option>
                {LETTER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Status</label>
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Issued / Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearch('');
                setTypeFilter('All');
                setStatusFilter('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Letter Type</th>
                  <th>Purpose</th>
                  <th>Delivery Mode</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyCell}>
                      No letter requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.codeCell}>{item.id}</td>
                      <td>
                        <strong>{item.letterType}</strong>
                        <small className={styles.subText}>{item.urgency} Priority</small>
                      </td>
                      <td className={styles.reasonCell}>{item.purpose}</td>
                      <td>{item.deliveryMode}</td>
                      <td>{formatDate(item.requestedOn)}</td>
                      <td>
                        <StatusBadge status={item.status.toLowerCase()}>
                          {item.status === 'Approved' ? 'Issued' : item.status}
                        </StatusBadge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionRow}>
                          <button
                            type="button"
                            className={styles.iconActionBtn}
                            onClick={() => setSelectedLetter(item)}
                          >
                            <Eye size={14} /> View
                          </button>
                          {item.status === 'Approved' && (
                            <button
                              type="button"
                              className={styles.iconActionBtn}
                              onClick={() => showToast(`Preparing PDF download for ${item.id}...`, 'info')}
                            >
                              <Download size={14} /> PDF
                            </button>
                          )}
                          {item.status === 'Pending' && (
                            <button
                              type="button"
                              className={styles.cancelActionBtn}
                              onClick={() => handleWithdraw(item)}
                              title="Withdraw Request"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Letter Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Request Official HR Letter</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Letter Type *</label>
                <select
                  className={styles.select}
                  value={form.letterType}
                  onChange={(e) => setForm({ ...form, letterType: e.target.value })}
                >
                  {LETTER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Delivery Format</label>
                  <select
                    className={styles.select}
                    value={form.deliveryMode}
                    onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })}
                  >
                    <option value="Signed PDF">Signed Digital PDF</option>
                    <option value="Hard Copy + PDF">Hard Copy + Digital PDF</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Priority</label>
                  <select
                    className={styles.select}
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  >
                    <option value="Normal">Normal (3-5 Working Days)</option>
                    <option value="High">High (Within 48 Hours)</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Purpose / Addressee Details *</label>
                <textarea
                  rows={3}
                  className={styles.textarea}
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Mention bank name, embassy, school, or exact purpose for HR letter..."
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedLetter && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedLetter(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Letter Request Details</h3>
                <span className={styles.subText}>{selectedLetter.id}</span>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedLetter(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.detailRow}>
                <span>Status</span>
                <StatusBadge status={selectedLetter.status.toLowerCase()}>
                  {selectedLetter.status === 'Approved' ? 'Issued' : selectedLetter.status}
                </StatusBadge>
              </div>
              <div className={styles.detailRow}>
                <span>Letter Type</span>
                <strong>{selectedLetter.letterType}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Delivery Mode</span>
                <strong>{selectedLetter.deliveryMode}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Priority</span>
                <strong>{selectedLetter.urgency}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Requested On</span>
                <strong>{formatDate(selectedLetter.requestedOn)}</strong>
              </div>
              <div className={styles.detailBlock}>
                <span className={styles.fieldLabel}>Purpose</span>
                <p>{selectedLetter.purpose}</p>
              </div>
              {selectedLetter.hrRemarks && (
                <div className={styles.detailBlock}>
                  <span className={styles.fieldLabel}>HR Remarks</span>
                  <p>{selectedLetter.hrRemarks}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
