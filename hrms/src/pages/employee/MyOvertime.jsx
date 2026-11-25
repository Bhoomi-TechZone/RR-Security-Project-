import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Timer,
  Clock3,
  CheckCircle2,
  IndianRupee,
  Plus,
  Search,
  Eye,
  X,
  Ban,
  Calendar,
  MapPin
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import RequestBackButton from '../../components/common/RequestBackButton';
import authService from '../../services/authService';
import { addHubRequest } from '../../data/requestHubData';
import styles from './EmployeeModulePage.module.css';

const INITIAL_OVERTIME_REQUESTS = [
  {
    id: 'OT-2026-101',
    date: '2026-11-21',
    shift: 'Night Shift',
    site: 'DLF CyberCity Tech Park',
    hours: 4,
    ratePerHour: 150,
    amount: 600,
    reason: 'Night reliever reported late due to heavy rain; covered Main Gate post.',
    submittedOn: '2026-11-22',
    status: 'Pending',
    approverRemarks: ''
  },
  {
    id: 'OT-2026-094',
    date: '2026-11-14',
    shift: 'Evening Shift',
    site: 'DLF CyberCity Tech Park',
    hours: 3,
    ratePerHour: 150,
    amount: 450,
    reason: 'VIP client audit inspection extended beyond regular shift.',
    submittedOn: '2026-11-15',
    status: 'Approved',
    approverRemarks: 'Verified with site supervisor logbook.'
  },
  {
    id: 'OT-2026-082',
    date: '2026-11-05',
    shift: 'Morning Shift',
    site: 'Main Gate',
    hours: 2,
    ratePerHour: 150,
    amount: 300,
    reason: 'Additional vendor vehicle entry verification.',
    submittedOn: '2026-11-06',
    status: 'Rejected',
    approverRemarks: 'Overlap with regular shift hours; not eligible for OT.'
  }
];

const STORAGE_KEY = 'novaspark_emp_overtime_ui_v1';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

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

export default function MyOvertime() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || {};
  const employeeId = currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || 'RRS0104';
  const employeeName = currentUser?.name || currentUser?.employeeName || 'Rajeshwar Dayal Singh';

  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_OVERTIME_REQUESTS;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    shift: 'Night Shift',
    site: currentUser?.site || 'DLF CyberCity Tech Park',
    hours: '2',
    reason: ''
  });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  const persist = (next) => {
    setRecords(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const summary = useMemo(() => {
    const totalHours = records.reduce((s, r) => s + Number(r.hours || 0), 0);
    const pendingCount = records.filter((r) => r.status === 'Pending').length;
    const approvedHours = records
      .filter((r) => r.status === 'Approved')
      .reduce((s, r) => s + Number(r.hours || 0), 0);
    const approvedAmount = records
      .filter((r) => r.status === 'Approved')
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    return { totalHours, pendingCount, approvedHours, approvedAmount };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (monthFilter && !r.date?.startsWith(monthFilter)) return false;
      if (q && !`${r.id} ${r.site} ${r.shift} ${r.reason}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [records, statusFilter, monthFilter, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const hrs = Number(form.hours);
    if (!form.date || !hrs || hrs <= 0 || !form.reason.trim()) {
      showToast('Please fill valid date, overtime hours, and reason.', 'error');
      return;
    }

    const ratePerHour = 150;
    const amount = Math.round(hrs * ratePerHour);
    const newId = `OT-2026-${Math.floor(110 + Math.random() * 880)}`;
    const today = new Date().toISOString().slice(0, 10);

    const newItem = {
      id: newId,
      date: form.date,
      shift: form.shift,
      site: form.site,
      hours: hrs,
      ratePerHour,
      amount,
      reason: form.reason.trim(),
      submittedOn: today,
      status: 'Pending',
      approverRemarks: ''
    };

    persist([newItem, ...records]);

    addHubRequest({
      id: newId,
      categoryId: 'overtime',
      categoryLabel: 'Overtime',
      employeeId,
      employeeName,
      designation: currentUser?.designation || 'Staff Member',
      site: form.site,
      submittedDate: today,
      summary: `${hrs} hrs overtime on ${form.shift} (${formatDate(form.date)})`,
      amountOrMetric: `${hrs} hrs`,
      priority: hrs >= 4 ? 'High' : 'Normal',
      stage: 'Pending Manager Approval',
      status: 'Pending',
      reason: form.reason.trim(),
      remarks: '',
      details: {
        Date: formatDate(form.date),
        Shift: form.shift,
        Site: form.site,
        'OT Hours': `${hrs} hrs (Est. ${formatINR(amount)})`
      }
    });

    setIsModalOpen(false);
    setForm({
      date: today,
      shift: 'Night Shift',
      site: currentUser?.site || 'DLF CyberCity Tech Park',
      hours: '2',
      reason: ''
    });
    showToast(`✓ Overtime request ${newId} submitted for approval.`);
  };

  const handleCancel = (item) => {
    const next = records.map((r) =>
      r.id === item.id ? { ...r, status: 'Cancelled', approverRemarks: 'Withdrawn by employee.' } : r
    );
    persist(next);
    if (selectedRecord?.id === item.id) {
      setSelectedRecord({ ...item, status: 'Cancelled' });
    }
    showToast(`Overtime request ${item.id} withdrawn.`, 'info');
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
          <strong>My Overtime</strong>
        </nav>

        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RequestBackButton />
              <h1 className={styles.pageTitle}>My Overtime Requests</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Submit extra duty / reliever overtime hours and monitor supervisor & payroll approvals.
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
              <span>Request Overtime</span>
            </button>
          </div>
        </header>

        {/* Summary KPIs */}
        <section className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.blue}`}>
              <Timer size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Total OT Logged</span>
              <strong className={styles.summaryValue}>{summary.totalHours} hrs</strong>
              <span className={styles.summaryMeta}>All submissions</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.amber}`}>
              <Clock3 size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Pending Approval</span>
              <strong className={styles.summaryValue}>{summary.pendingCount}</strong>
              <span className={styles.summaryMeta}>Awaiting supervisor</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.green}`}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Approved Hours</span>
              <strong className={styles.summaryValue}>{summary.approvedHours} hrs</strong>
              <span className={styles.summaryMeta}>Payroll eligible</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.purple}`}>
              <IndianRupee size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Approved OT Payout</span>
              <strong className={styles.summaryValue}>{formatINR(summary.approvedAmount)}</strong>
              <span className={styles.summaryMeta}>Estimated earnings</span>
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
                  placeholder="Search ID, site, shift, reason..."
                />
              </div>
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
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Month</label>
              <input
                type="month"
                className={styles.input}
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setMonthFilter('');
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
                  <th>OT ID</th>
                  <th>Date & Shift</th>
                  <th>Site / Post</th>
                  <th>Hours</th>
                  <th>Est. Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyCell}>
                      No overtime requests match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.codeCell}>{item.id}</td>
                      <td>
                        <strong>{formatDate(item.date)}</strong>
                        <small className={styles.subText}>{item.shift}</small>
                      </td>
                      <td>{item.site}</td>
                      <td>
                        <strong>{item.hours} hrs</strong>
                      </td>
                      <td>
                        <strong>{formatINR(item.amount)}</strong>
                      </td>
                      <td className={styles.reasonCell}>{item.reason}</td>
                      <td>
                        <StatusBadge status={item.status.toLowerCase()} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionRow}>
                          <button
                            type="button"
                            className={styles.iconActionBtn}
                            onClick={() => setSelectedRecord(item)}
                          >
                            <Eye size={14} /> Details
                          </button>
                          {item.status === 'Pending' && (
                            <button
                              type="button"
                              className={styles.cancelActionBtn}
                              onClick={() => handleCancel(item)}
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

      {/* Submit Overtime Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Request Overtime Approval</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Overtime Date *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Shift *</label>
                  <select
                    className={styles.select}
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  >
                    <option value="Morning Shift">Morning Shift</option>
                    <option value="Evening Shift">Evening Shift</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="General Shift">General Shift</option>
                    <option value="Holiday / Week-Off Duty">Holiday / Week-Off Duty</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Site / Post *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.site}
                    onChange={(e) => setForm({ ...form, site: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Overtime Hours *</label>
                  <input
                    type="number"
                    min="0.5"
                    max="16"
                    step="0.5"
                    className={styles.input}
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Reason / Duty Justification *</label>
                <textarea
                  rows={3}
                  className={styles.textarea}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Explain why extra duty hours were required (e.g., reliever delay, site audit)..."
                  required
                />
              </div>

              <div className={styles.infoBanner}>
                <span>Estimated OT Payout (@ ₹150/hr):</span>
                <strong>{formatINR(Number(form.hours || 0) * 150)}</strong>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Submit OT Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedRecord && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedRecord(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Overtime Details</h3>
                <span className={styles.subText}>{selectedRecord.id}</span>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedRecord(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.detailRow}>
                <span>Status</span>
                <StatusBadge status={selectedRecord.status.toLowerCase()} />
              </div>
              <div className={styles.detailRow}>
                <span><Calendar size={13} /> Overtime Date</span>
                <strong>{formatDate(selectedRecord.date)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Shift</span>
                <strong>{selectedRecord.shift}</strong>
              </div>
              <div className={styles.detailRow}>
                <span><MapPin size={13} /> Site / Post</span>
                <strong>{selectedRecord.site}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Hours Claimed</span>
                <strong>{selectedRecord.hours} hrs</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Estimated Amount</span>
                <strong>{formatINR(selectedRecord.amount)}</strong>
              </div>
              <div className={styles.detailBlock}>
                <span className={styles.fieldLabel}>Reason</span>
                <p>{selectedRecord.reason}</p>
              </div>
              {selectedRecord.approverRemarks && (
                <div className={styles.detailBlock}>
                  <span className={styles.fieldLabel}>Reviewer Remarks</span>
                  <p>{selectedRecord.approverRemarks}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
