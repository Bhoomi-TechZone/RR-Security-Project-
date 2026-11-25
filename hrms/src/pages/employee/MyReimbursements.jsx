import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Clock3,
  CheckCircle2,
  Wallet,
  Plus,
  Search,
  Eye,
  X,
  Upload,
  Ban,
  FileText
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import RequestBackButton from '../../components/common/RequestBackButton';
import authService from '../../services/authService';
import { addHubRequest } from '../../data/requestHubData';
import styles from './EmployeeModulePage.module.css';

const EXPENSE_TYPES = [
  'Travel & Conveyance',
  'Fuel & Site Patrol',
  'Food & Meal Allowance',
  'Medical Expense',
  'Mobile / Communication',
  'Accommodation / Lodging',
  'Stationery & Misc'
];

const INITIAL_CLAIMS = [
  {
    id: 'CLM-2026-412',
    expenseType: 'Travel & Conveyance',
    expenseDate: '2026-11-21',
    merchant: 'IndianOil Fuel Station',
    claimedAmount: 1450,
    approvedAmount: 0,
    receiptName: 'Fuel_Receipt_Nov21.pdf',
    description: 'Visited 3 Gurugram client posts for surprise night audit.',
    submittedOn: '2026-11-21',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    reviewerNotes: ''
  },
  {
    id: 'CLM-2026-389',
    expenseType: 'Food & Meal Allowance',
    expenseDate: '2026-11-10',
    merchant: 'Bikanervala CyberHub',
    claimedAmount: 650,
    approvedAmount: 650,
    receiptName: 'Meal_Bill_Nov10.jpg',
    description: 'Emergency night duty meal during client audit.',
    submittedOn: '2026-11-11',
    status: 'Approved',
    paymentStatus: 'Paid',
    reviewerNotes: 'Approved & settled via bank transfer.'
  },
  {
    id: 'CLM-2026-341',
    expenseType: 'Mobile / Communication',
    expenseDate: '2026-10-28',
    merchant: 'Airtel Postpaid',
    claimedAmount: 599,
    approvedAmount: 599,
    receiptName: 'Airtel_Oct_Bill.pdf',
    description: 'Monthly site control room coordination plan.',
    submittedOn: '2026-10-29',
    status: 'Approved',
    paymentStatus: 'Paid',
    reviewerNotes: 'Within monthly CUG cap.'
  }
];

const STORAGE_KEY = 'novaspark_emp_reimbursements_ui_v1';
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

export default function MyReimbursements() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || {};
  const employeeId = currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || 'RRS0104';
  const employeeName = currentUser?.name || currentUser?.employeeName || 'Rajeshwar Dayal Singh';

  const [claims, setClaims] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CLAIMS;
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [form, setForm] = useState({
    expenseType: EXPENSE_TYPES[0],
    expenseDate: new Date().toISOString().slice(0, 10),
    merchant: '',
    claimedAmount: '',
    receiptName: '',
    description: ''
  });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  const persist = (next) => {
    setClaims(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const summary = useMemo(() => {
    const totalClaimed = claims.reduce((s, c) => s + Number(c.claimedAmount || 0), 0);
    const pendingCount = claims.filter((c) => c.status === 'Pending').length;
    const approvedTotal = claims
      .filter((c) => c.status === 'Approved')
      .reduce((s, c) => s + Number(c.approvedAmount || c.claimedAmount || 0), 0);
    const paidTotal = claims
      .filter((c) => c.paymentStatus === 'Paid')
      .reduce((s, c) => s + Number(c.approvedAmount || c.claimedAmount || 0), 0);

    return { totalClaimed, pendingCount, approvedTotal, paidTotal };
  }, [claims]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((c) => {
      if (typeFilter !== 'All' && c.expenseType !== typeFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (q && !`${c.id} ${c.expenseType} ${c.merchant} ${c.description}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [claims, typeFilter, statusFilter, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = Number(form.claimedAmount);
    if (!amt || amt <= 0 || !form.merchant.trim() || !form.description.trim()) {
      showToast('Please enter merchant, valid claim amount, and expense description.', 'error');
      return;
    }

    const newId = `CLM-2026-${Math.floor(420 + Math.random() * 550)}`;
    const today = new Date().toISOString().slice(0, 10);

    const newClaim = {
      id: newId,
      expenseType: form.expenseType,
      expenseDate: form.expenseDate,
      merchant: form.merchant.trim(),
      claimedAmount: amt,
      approvedAmount: 0,
      receiptName: form.receiptName || 'Receipt_Attached.pdf',
      description: form.description.trim(),
      submittedOn: today,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      reviewerNotes: ''
    };

    persist([newClaim, ...claims]);

    addHubRequest({
      id: newId,
      categoryId: 'reimbursement',
      categoryLabel: 'Reimbursement',
      employeeId,
      employeeName,
      designation: currentUser?.designation || 'Staff Member',
      site: currentUser?.site || 'DLF CyberCity Tech Park',
      submittedDate: today,
      summary: `${form.expenseType} – ${form.merchant.trim()}`,
      amountOrMetric: formatINR(amt),
      priority: amt >= 5000 ? 'High' : 'Normal',
      stage: 'Pending HR Approval',
      status: 'Pending',
      reason: form.description.trim(),
      remarks: '',
      details: {
        'Expense Type': form.expenseType,
        'Expense Date': formatDate(form.expenseDate),
        Merchant: form.merchant.trim(),
        'Claimed Amount': formatINR(amt),
        'Bill / Receipt': newClaim.receiptName
      }
    });

    setIsModalOpen(false);
    setForm({
      expenseType: EXPENSE_TYPES[0],
      expenseDate: today,
      merchant: '',
      claimedAmount: '',
      receiptName: '',
      description: ''
    });
    showToast(`✓ Reimbursement claim ${newId} submitted for HR approval.`);
  };

  const handleWithdraw = (claim) => {
    const next = claims.map((c) =>
      c.id === claim.id ? { ...c, status: 'Cancelled', reviewerNotes: 'Withdrawn by employee.' } : c
    );
    persist(next);
    showToast(`Claim ${claim.id} withdrawn.`, 'info');
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
          <strong>My Reimbursements</strong>
        </nav>

        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RequestBackButton />
              <h1 className={styles.pageTitle}>My Reimbursements & Expense Claims</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Submit travel, conveyance, medical, or site operational expense bills and track payouts.
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
              <span>Submit Claim</span>
            </button>
          </div>
        </header>

        {/* Summary KPIs */}
        <section className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.blue}`}>
              <Receipt size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Total Claimed</span>
              <strong className={styles.summaryValue}>{formatINR(summary.totalClaimed)}</strong>
              <span className={styles.summaryMeta}>{claims.length} claims</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.amber}`}>
              <Clock3 size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Pending Review</span>
              <strong className={styles.summaryValue}>{summary.pendingCount}</strong>
              <span className={styles.summaryMeta}>HR / Accounts queue</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.green}`}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Approved Amount</span>
              <strong className={styles.summaryValue}>{formatINR(summary.approvedTotal)}</strong>
              <span className={styles.summaryMeta}>Sanctioned total</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.iconWrap} ${styles.purple}`}>
              <Wallet size={22} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Paid / Settled</span>
              <strong className={styles.summaryValue}>{formatINR(summary.paidTotal)}</strong>
              <span className={styles.summaryMeta}>Disbursed to bank</span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className={styles.filterCard}>
          <div className={styles.filterGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Search Claims</label>
              <div className={styles.searchBox}>
                <Search size={15} />
                <input
                  className={styles.input}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search claim ID, merchant, category..."
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Expense Category</label>
              <select
                className={styles.select}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Approval Status</label>
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
                  <th>Claim ID</th>
                  <th>Expense Date</th>
                  <th>Category & Merchant</th>
                  <th>Claimed</th>
                  <th>Receipt</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyCell}>
                      No reimbursement claims found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((claim) => (
                    <tr key={claim.id}>
                      <td className={styles.codeCell}>{claim.id}</td>
                      <td>{formatDate(claim.expenseDate)}</td>
                      <td>
                        <strong>{claim.expenseType}</strong>
                        <small className={styles.subText}>{claim.merchant}</small>
                      </td>
                      <td>
                        <strong>{formatINR(claim.claimedAmount)}</strong>
                      </td>
                      <td>
                        <span className={styles.fileChip}>
                          <FileText size={12} /> {claim.receiptName}
                        </span>
                      </td>
                      <td>
                        <span className={claim.paymentStatus === 'Paid' ? styles.paidPill : styles.unpaidPill}>
                          {claim.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={claim.status.toLowerCase()} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionRow}>
                          <button
                            type="button"
                            className={styles.iconActionBtn}
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <Eye size={14} /> Details
                          </button>
                          {claim.status === 'Pending' && (
                            <button
                              type="button"
                              className={styles.cancelActionBtn}
                              onClick={() => handleWithdraw(claim)}
                              title="Withdraw Claim"
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

      {/* New Claim Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Submit Expense Reimbursement</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Expense Category *</label>
                  <select
                    className={styles.select}
                    value={form.expenseType}
                    onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Expense Date *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Merchant / Vendor *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.merchant}
                    onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                    placeholder="e.g., IndianOil, Uber, Apollo Pharmacy"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Claimed Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    value={form.claimedAmount}
                    onChange={(e) => setForm({ ...form, claimedAmount: e.target.value })}
                    placeholder="e.g., 1200"
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Upload Bill / Receipt</label>
                <label className={styles.uploadBox}>
                  <Upload size={16} />
                  <span>{form.receiptName || 'Click to attach invoice PDF or photo'}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setForm({ ...form, receiptName: file.name });
                    }}
                  />
                </label>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Expense Purpose / Description *</label>
                <textarea
                  rows={3}
                  className={styles.textarea}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the operational purpose of this expense..."
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedClaim && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedClaim(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Claim Details</h3>
                <span className={styles.subText}>{selectedClaim.id}</span>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedClaim(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.detailRow}>
                <span>Approval Status</span>
                <StatusBadge status={selectedClaim.status.toLowerCase()} />
              </div>
              <div className={styles.detailRow}>
                <span>Payment Status</span>
                <strong>{selectedClaim.paymentStatus}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Expense Category</span>
                <strong>{selectedClaim.expenseType}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Expense Date</span>
                <strong>{formatDate(selectedClaim.expenseDate)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Merchant</span>
                <strong>{selectedClaim.merchant}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Claimed Amount</span>
                <strong>{formatINR(selectedClaim.claimedAmount)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Supporting Bill</span>
                <strong>{selectedClaim.receiptName}</strong>
              </div>
              <div className={styles.detailBlock}>
                <span className={styles.fieldLabel}>Description</span>
                <p>{selectedClaim.description}</p>
              </div>
              {selectedClaim.reviewerNotes && (
                <div className={styles.detailBlock}>
                  <span className={styles.fieldLabel}>Reviewer Notes</span>
                  <p>{selectedClaim.reviewerNotes}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
