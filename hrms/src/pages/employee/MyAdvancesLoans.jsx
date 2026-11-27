import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileSpreadsheet,
  HandCoins,
  PlusCircle,
  Save,
  XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import { advanceLoanService } from '../../services/advanceLoanService';
import Toast from '../../components/common/Toast';
import RequestBackButton from '../../components/common/RequestBackButton';
import styles from './MyAdvancesLoans.module.css';

const formatUpperDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

const formatMixedDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

const formatDec = (num) =>
  Number(num || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatInt = (num) => Number(num || 0).toLocaleString('en-IN');

const addMonthsToIso = (isoDate, offset) => {
  const base = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return isoDate;
  const d = new Date(base);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
};

const generateScheduleRows = ({
  loanAmount,
  issueDate,
  deductionStart,
  installmentsCount
}) => {
  const amount = Number(loanAmount) || 0;
  const count = Math.max(1, Number(installmentsCount) || 1);
  if (amount <= 0) return [];

  const rows = [
    {
      id: `disb-${Date.now()}`,
      isDisbursement: true,
      date: issueDate || new Date().toISOString().slice(0, 10),
      opening: 0,
      principal: 0,
      interest: 0,
      installment: 0,
      balance: 0,
      deductible: false
    }
  ];

  const basePrincipal = Math.floor((amount / count) * 100) / 100;
  let remaining = amount;

  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1;
    const principal = isLast ? Number(remaining.toFixed(2)) : basePrincipal;
    const opening = Number(remaining.toFixed(2));
    const balance = Math.max(0, Number((opening - principal).toFixed(2)));
    remaining = balance;

    rows.push({
      id: `inst-${i + 1}-${Date.now()}`,
      isDisbursement: false,
      date: addMonthsToIso(deductionStart || issueDate, i),
      opening,
      principal,
      interest: 0,
      installment: principal,
      balance,
      deductible: true
    });
  }

  return rows;
};

const normalizeLoanRecord = (r, index) => {
  const amount = Number(r.approvedAmount || r.amount || 0);
  const count = Math.max(1, Number(r.numberOfMonths || r.installmentsCount || 6));
  const issueDate = (r.requestDate || r.createdAt || new Date().toISOString()).slice(0, 10);
  const startMonth = r.firstDeductionMonth || r.adjustmentMonth || '';
  const deductionStart =
    startMonth && startMonth.length === 7
      ? `${startMonth}-01`
      : addMonthsToIso(issueDate, 1);

  return {
    id: r.requestId || r._id || r.id || `LN-${index + 1}`,
    requestId: r.requestId || r._id || r.id || `LN-${index + 1}`,
    purpose: r.reason || 'Personal Loan',
    loanAmount: amount,
    issueDate,
    deductionStart,
    installmentsCount: count,
    interestMethod: 'Interest Free',
    status: (r.status || 'pending').toLowerCase(),
    remarks: r.remarks || '',
    schedule: generateScheduleRows({
      loanAmount: amount,
      issueDate,
      deductionStart,
      installmentsCount: count
    })
  };
};

export default function MyAdvancesLoans() {
  const { activeCompany } = useCompany();
  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const companyId =
    activeCompany?._id || activeCompany?.companyId || currentUser?.companyId || 'RRS8392014SEC';
  const employeeId = currentUser?.employeeId || currentUser?.employeeCode || currentUser?.id || '';
  const employeeName = currentUser?.name || currentUser?.employeeName || 'Employee';
  const designation = currentUser?.designation || currentUser?.role || 'Staff Member';
  const department = currentUser?.department || 'Operations';

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'apply' | 'view'
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  // List filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all'
  });

  // Apply form state
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextMonthStr = addMonthsToIso(todayStr, 1);
  const [applyForm, setApplyForm] = useState({
    loanAmount: '',
    reason: 'Family Emergency',
    otherReason: '',
    deductionStart: nextMonthStr,
    installments: '6',
    remarks: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [previewSchedule, setPreviewSchedule] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const reqData = await advanceLoanService
        .getRequests(companyId, { employee: employeeId, type: 'loan' })
        .catch(() => []);
      const loanReqs = Array.isArray(reqData)
        ? reqData.filter((r) => r.type === 'loan').map(normalizeLoanRecord)
        : [];
      setLoans(loanReqs);
    } catch (err) {
      console.error('Error loading loans:', err);
      showToast('Failed to load loans data', 'error');
    } finally {
      setLoading(false);
    }
  }, [companyId, employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (appliedFilters.fromDate && l.issueDate < appliedFilters.fromDate) return false;
      if (appliedFilters.toDate && l.issueDate > appliedFilters.toDate) return false;
      if (appliedFilters.status !== 'all' && l.status !== appliedFilters.status) return false;
      return true;
    });
  }, [loans, appliedFilters]);

  const selectedLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId) || null,
    [loans, selectedLoanId]
  );

  const scheduleTotals = useMemo(() => {
    const rows = selectedLoan?.schedule || [];
    return rows.reduce(
      (acc, r) => ({
        principal: acc.principal + (Number(r.principal) || 0),
        interest: acc.interest + (Number(r.interest) || 0),
        installment: acc.installment + (Number(r.installment) || 0)
      }),
      { principal: 0, interest: 0, installment: 0 }
    );
  }, [selectedLoan]);

  const estimatedEmi = useMemo(() => {
    const amt = Number(applyForm.loanAmount || 0);
    const months = Math.max(1, Number(applyForm.installments || 1));
    if (amt <= 0) return 0;
    return Math.ceil(amt / months);
  }, [applyForm.loanAmount, applyForm.installments]);

  const handleApplyFilters = () => {
    setAppliedFilters({ fromDate, toDate, status: statusFilter });
  };

  const handleOpenApply = () => {
    setApplyForm({
      loanAmount: '',
      reason: 'Family Emergency',
      otherReason: '',
      deductionStart: nextMonthStr,
      installments: '6',
      remarks: ''
    });
    setFormErrors({});
    setPreviewSchedule([]);
    setViewMode('apply');
  };

  const handleOpenView = (loan) => {
    setSelectedLoanId(loan.id);
    setViewMode('view');
  };

  const validateApplyForm = () => {
    const errs = {};
    const amt = Number(applyForm.loanAmount);
    if (!applyForm.loanAmount || amt <= 0) {
      errs.loanAmount = 'Enter a valid loan amount greater than ₹0';
    } else if (amt > 200000) {
      errs.loanAmount = 'Loan amount cannot exceed ₹2,00,000';
    }
    if (!applyForm.reason) {
      errs.reason = 'Please select a purpose';
    } else if (applyForm.reason === 'Other' && !applyForm.otherReason?.trim()) {
      errs.otherReason = 'Please specify purpose';
    }
    const months = Number(applyForm.installments);
    if (!months || months < 1 || months > 24) {
      errs.installments = 'Installments must be between 1 and 24';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreviewSchedule = () => {
    if (!validateApplyForm()) return;
    setPreviewSchedule(
      generateScheduleRows({
        loanAmount: Number(applyForm.loanAmount),
        issueDate: todayStr,
        deductionStart: applyForm.deductionStart,
        installmentsCount: Number(applyForm.installments)
      })
    );
  };

  const handleSubmitLoan = async (e) => {
    e.preventDefault();
    if (!validateApplyForm()) return;

    try {
      setSubmitting(true);
      const months = Number(applyForm.installments);
      const deductionMonth = (applyForm.deductionStart || nextMonthStr).slice(0, 7);
      const payload = {
        employeeId,
        employeeName,
        department,
        designation,
        type: 'loan',
        amount: Number(applyForm.loanAmount),
        reason:
          applyForm.reason === 'Other' ? applyForm.otherReason.trim() : applyForm.reason,
        otherReason: applyForm.reason === 'Other' ? applyForm.otherReason.trim() : '',
        deductionMethod: 'monthly-emi',
        numberOfMonths: months,
        emiAmount: estimatedEmi,
        firstDeductionMonth: deductionMonth,
        adjustmentMonth: deductionMonth,
        remarks: applyForm.remarks?.trim() || '',
        requestDate: todayStr
      };

      await advanceLoanService.createRequest(companyId, payload);
      showToast('Loan application submitted successfully!', 'success');
      await loadData();
      setViewMode('list');
    } catch (err) {
      console.error('Failed to submit loan:', err);
      showToast(err.message || 'Failed to submit loan application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadScheduleExcel = () => {
    if (!selectedLoan) return;
    const rows = (selectedLoan.schedule || []).map((r) => ({
      Date: r.isDisbursement ? formatUpperDate(r.date) : formatMixedDate(r.date),
      Opening: r.opening.toFixed(2),
      Principal: r.principal.toFixed(2),
      Interest: r.interest.toFixed(2),
      Installment: r.installment.toFixed(2),
      Balance: r.balance.toFixed(2),
      Deductible: r.isDisbursement ? '' : r.deductible ? 'Yes' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Schedule');
    XLSX.writeFile(wb, `My_Loan_Schedule_${selectedLoan.id}.xlsx`);
  };

  const renderStatusBadge = (status) => {
    const map = {
      approved: { cls: styles.statusApproved, icon: <CheckCircle2 size={12} />, label: 'Approved' },
      rejected: { cls: styles.statusRejected, icon: <XCircle size={12} />, label: 'Rejected' },
      completed: { cls: styles.statusCompleted, icon: <CheckCircle2 size={12} />, label: 'Completed' },
      pending: { cls: styles.statusPending, icon: <Clock3 size={12} />, label: 'Pending' }
    };
    const item = map[status] || map.pending;
    return (
      <span className={`${styles.statusPill} ${item.cls}`}>
        {item.icon}
        <span>{item.label}</span>
      </span>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.breadcrumb}>
        <span>Dashboard</span>
        <span>/</span>
        <strong>My Loans</strong>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      {/* ==================== VIEW 1: MY LOANS LIST ==================== */}
      {viewMode === 'list' && (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RequestBackButton />
                <h1 className={styles.pageTitle}>
                  <HandCoins size={18} />
                  <span>My Loans</span>
                </h1>
              </div>
              <p className={styles.pageSubtitle}>
                Apply for a new loan and view your monthly repayment schedules.
              </p>
            </div>
            <div className={styles.headerBtns}>
              <button type="button" className={styles.addNewBtn} onClick={handleOpenApply}>
                <PlusCircle size={15} />
                <span>Apply for Loan</span>
              </button>
            </div>
          </header>

          <div className={styles.filterBar}>
            <div className={styles.dateRangeGroup}>
              <input
                type="date"
                className={styles.dateInput}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
              />
              <span className={styles.dateTo}>to</span>
              <input
                type="date"
                className={styles.dateInput}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
              />
            </div>

            <div className={styles.selectGroup}>
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="button"
                className={styles.viewFilterBtn}
                onClick={handleApplyFilters}
              >
                <CheckCircle2 size={14} />
                <span>View</span>
              </button>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>PURPOSE</th>
                    <th>LOAN AMOUNT</th>
                    <th>REQUEST DATE</th>
                    <th>INTEREST METHOD</th>
                    <th>INSTALLMENTS</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className={styles.emptyCell}>
                        Loading your loans...
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.emptyCell}>
                        No loans found. Click &quot;Apply for Loan&quot; to submit a new request.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan, idx) => (
                      <tr key={loan.id}>
                        <td className={styles.snCell}>{idx + 1}</td>
                        <td>
                          <div className={styles.purposeCell}>
                            <strong>{loan.purpose}</strong>
                            <span>{loan.requestId}</span>
                          </div>
                        </td>
                        <td className={styles.amountCell}>₹{formatInt(loan.loanAmount)}</td>
                        <td className={styles.dateCell}>{formatUpperDate(loan.issueDate)}</td>
                        <td>
                          <span className={styles.methodPill}>{loan.interestMethod}</span>
                        </td>
                        <td>{loan.installmentsCount} Months</td>
                        <td>{renderStatusBadge(loan.status)}</td>
                        <td>
                          <div className={styles.circleActions}>
                            <button
                              type="button"
                              className={styles.viewCircleBtn}
                              onClick={() => handleOpenView(loan)}
                              title="View Loan Schedule"
                              aria-label="View Loan Schedule"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== VIEW 2: APPLY FOR LOAN ==================== */}
      {viewMode === 'apply' && (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>Apply for New Loan</h1>
              <p className={styles.pageSubtitle}>
                Submit a loan request and preview your monthly EMI repayment schedule.
              </p>
            </div>
            <div className={styles.headerBtns}>
              <button
                type="button"
                className={styles.backLinkBtn}
                onClick={() => setViewMode('list')}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            </div>
          </header>

          <form className={styles.formCard} onSubmit={handleSubmitLoan}>
            <div className={styles.formGrid}>
              <div className={styles.fieldRow}>
                <label>
                  Loan Amount (₹) <span className={styles.reqStar}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="200000"
                  className={`${styles.input} ${formErrors.loanAmount ? styles.inputError : ''}`}
                  placeholder="Enter amount (max 2,00,000)"
                  value={applyForm.loanAmount}
                  onChange={(e) =>
                    setApplyForm((prev) => ({ ...prev, loanAmount: e.target.value }))
                  }
                />
                {formErrors.loanAmount && (
                  <span className={styles.errorText}>{formErrors.loanAmount}</span>
                )}
              </div>

              <div className={styles.fieldRow}>
                <label>
                  Purpose <span className={styles.reqStar}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={applyForm.reason}
                  onChange={(e) =>
                    setApplyForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                >
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Medical Expense">Medical Expense</option>
                  <option value="Education">Education</option>
                  <option value="Home Renovation">Home Renovation</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {applyForm.reason === 'Other' && (
                <div className={styles.fieldRow}>
                  <label>
                    Specify Purpose <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`${styles.input} ${formErrors.otherReason ? styles.inputError : ''}`}
                    placeholder="Enter loan purpose"
                    value={applyForm.otherReason}
                    onChange={(e) =>
                      setApplyForm((prev) => ({ ...prev, otherReason: e.target.value }))
                    }
                  />
                  {formErrors.otherReason && (
                    <span className={styles.errorText}>{formErrors.otherReason}</span>
                  )}
                </div>
              )}

              <div className={styles.fieldRow}>
                <label>
                  Deduction Start <span className={styles.reqStar}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.input}
                  value={applyForm.deductionStart}
                  onChange={(e) =>
                    setApplyForm((prev) => ({ ...prev, deductionStart: e.target.value }))
                  }
                />
              </div>

              <div className={styles.fieldRow}>
                <label>
                  Installments (Months) <span className={styles.reqStar}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className={`${styles.input} ${formErrors.installments ? styles.inputError : ''}`}
                  placeholder="1 - 24"
                  value={applyForm.installments}
                  onChange={(e) =>
                    setApplyForm((prev) => ({ ...prev, installments: e.target.value }))
                  }
                />
                {formErrors.installments && (
                  <span className={styles.errorText}>{formErrors.installments}</span>
                )}
              </div>

              <div className={styles.fieldRow}>
                <label>Remarks</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Optional remarks for HR"
                  value={applyForm.remarks}
                  onChange={(e) =>
                    setApplyForm((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className={styles.emiBanner}>
              <span>
                Estimated Monthly EMI ({applyForm.installments || 1} months, Interest Free):
              </span>
              <strong>₹{formatInt(estimatedEmi)} / month</strong>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.previewBtn}
                onClick={handlePreviewSchedule}
              >
                <Eye size={15} />
                <span>Preview</span>
              </button>
              <button type="submit" className={styles.addNewBtn} disabled={submitting}>
                <Save size={15} />
                <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
              </button>
            </div>
          </form>

          {previewSchedule.length > 0 && (
            <div className={styles.previewSection}>
              <h3 className={styles.sectionHeading}>Loan Repayment Schedule Preview</h3>
              <div className={styles.tableWrap}>
                <table className={styles.scheduleTable}>
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>OPENING</th>
                      <th>PRINCIPAL</th>
                      <th>INTEREST</th>
                      <th>INSTALLMENT</th>
                      <th>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSchedule.map((r) => (
                      <tr
                        key={r.id}
                        className={r.isDisbursement ? styles.disbursementRow : ''}
                      >
                        <td>
                          {r.isDisbursement
                            ? formatUpperDate(r.date)
                            : formatMixedDate(r.date)}
                        </td>
                        <td>{formatDec(r.opening)}</td>
                        <td>{formatDec(r.principal)}</td>
                        <td>{formatDec(r.interest)}</td>
                        <td>{formatDec(r.installment)}</td>
                        <td>{formatDec(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== VIEW 3: VIEW LOAN & SCHEDULE ==================== */}
      {viewMode === 'view' && selectedLoan && (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>View Loan</h1>
              <p className={styles.pageSubtitle}>
                Review your loan summary and monthly deduction schedule.
              </p>
            </div>
            <div className={styles.headerBtns}>
              <button
                type="button"
                className={styles.backLinkBtn}
                onClick={() => setViewMode('list')}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            </div>
          </header>

          <div className={styles.summaryCardsGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Purpose</span>
              <strong>
                {selectedLoan.purpose} ({selectedLoan.requestId})
              </strong>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Loan Amount</span>
              <strong>₹{formatInt(selectedLoan.loanAmount)}</strong>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Request Date</span>
              <strong>{formatUpperDate(selectedLoan.issueDate)}</strong>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Status</span>
              {renderStatusBadge(selectedLoan.status)}
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Deduction Start</span>
              <strong>{formatUpperDate(selectedLoan.deductionStart)}</strong>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Interest Method</span>
              <strong>{selectedLoan.interestMethod}</strong>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryCardLabel}>Total Installments</span>
              <strong>{selectedLoan.installmentsCount}</strong>
            </div>
          </div>

          <div className={styles.scheduleSection}>
            <div className={styles.scheduleToolbar}>
              <h3 className={styles.scheduleTitle}>Loan Repayment Schedule</h3>
              <button
                type="button"
                className={styles.excelBtn}
                onClick={handleDownloadScheduleExcel}
              >
                <FileSpreadsheet size={15} />
                <span>Download Excel</span>
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.scheduleTable}>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>OPENING</th>
                    <th>PRINCIPAL</th>
                    <th>INTEREST</th>
                    <th>INSTALLMENT</th>
                    <th>BALANCE</th>
                    <th>DEDUCTIBLE</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedLoan.schedule || []).map((row) => (
                    <tr
                      key={row.id}
                      className={row.isDisbursement ? styles.disbursementRow : ''}
                    >
                      <td className={styles.dateCell}>
                        {row.isDisbursement
                          ? formatUpperDate(row.date)
                          : formatMixedDate(row.date)}
                      </td>
                      <td>{formatDec(row.opening)}</td>
                      <td>{formatDec(row.principal)}</td>
                      <td>{formatDec(row.interest)}</td>
                      <td>{formatDec(row.installment)}</td>
                      <td>{formatDec(row.balance)}</td>
                      <td>
                        {!row.isDisbursement && (
                          <span
                            className={
                              row.deductible ? styles.deductibleYes : styles.deductibleNo
                            }
                          >
                            {row.deductible ? 'Yes' : 'No'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalsRow}>
                    <td>
                      <strong>Totals</strong>
                    </td>
                    <td>0.00</td>
                    <td>{formatDec(scheduleTotals.principal)}</td>
                    <td>{formatDec(scheduleTotals.interest)}</td>
                    <td>{formatDec(scheduleTotals.installment)}</td>
                    <td>0.00</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
