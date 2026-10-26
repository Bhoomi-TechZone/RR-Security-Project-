import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeIndianRupee,
  Clock3,
  FileText,
  WalletCards,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  X,
  Loader2,
  HandCoins,
  ChevronRight,
  ShieldAlert,
  History
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import { advanceLoanService } from '../../services/advanceLoanService';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import styles from './MyAdvancesLoans.module.css';

const formatRupee = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(val || 0));

const formatDate = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val.includes('T') ? val : `${val}T00:00:00`);
    if (Number.isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return val;
  }
};

export default function MyAdvancesLoans() {
  const { activeCompany } = useCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all'; // 'all' | 'advances' | 'loans' | 'schedule' | 'history'

  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const companyId = activeCompany?._id || activeCompany?.companyId || currentUser?.companyId || 'RRS8392014SEC';
  const employeeId = currentUser?.employeeId || currentUser?.employeeCode || currentUser?.id || '';
  const employeeName = currentUser?.name || currentUser?.employeeName || 'Employee';
  const designation = currentUser?.designation || currentUser?.role || 'Staff Member';
  const department = currentUser?.department || 'Operations';

  const [requests, setRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals: null | 'advance' | 'loan'
  const [modalType, setModalType] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const currentYearMonth = new Date().toISOString().slice(0, 7);

  // Advance Form State
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: 'Emergency',
    otherReason: '',
    deductionMethod: 'salary-adjustment',
    firstDeductionMonth: currentYearMonth,
    remarks: ''
  });
  const [advanceErrors, setAdvanceErrors] = useState({});

  // Loan Form State
  const [loanForm, setLoanForm] = useState({
    amount: '',
    reason: 'Family Emergency',
    otherReason: '',
    numberOfMonths: 6,
    firstDeductionMonth: currentYearMonth,
    remarks: ''
  });
  const [loanErrors, setLoanErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch employee requests, schedules & history from MongoDB
  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [reqData, schedData, histData] = await Promise.all([
        advanceLoanService.getRequests(companyId, { employee: employeeId }).catch(() => []),
        advanceLoanService.getSchedules(companyId, { employee: employeeId }).catch(() => []),
        advanceLoanService.getHistory(companyId, { employee: employeeId }).catch(() => [])
      ]);

      setRequests(Array.isArray(reqData) ? reqData : []);
      setSchedules(Array.isArray(schedData) ? schedData : []);
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (err) {
      console.error('Error loading advances & loans:', err);
      showToast('Failed to load advances & loans data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId, employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open distinct modals
  const handleOpenAdvanceModal = () => {
    setAdvanceForm({
      amount: '',
      reason: 'Emergency',
      otherReason: '',
      deductionMethod: 'salary-adjustment',
      firstDeductionMonth: currentYearMonth,
      remarks: ''
    });
    setAdvanceErrors({});
    setModalType('advance');
  };

  const handleOpenLoanModal = () => {
    setLoanForm({
      amount: '',
      reason: 'Family Emergency',
      otherReason: '',
      numberOfMonths: 6,
      firstDeductionMonth: currentYearMonth,
      remarks: ''
    });
    setLoanErrors({});
    setModalType('loan');
  };

  // Live Loan EMI calculation
  const calculatedLoanEmi = useMemo(() => {
    const principal = Number(loanForm.amount || 0);
    if (principal <= 0) return 0;
    const months = Math.max(1, Number(loanForm.numberOfMonths || 1));
    return Math.ceil(principal / months);
  }, [loanForm.amount, loanForm.numberOfMonths]);

  // Submit Advance Request
  const handleSubmitAdvance = async (e) => {
    e.preventDefault();
    const errs = {};
    const amt = Number(advanceForm.amount);
    if (!advanceForm.amount || amt <= 0) {
      errs.amount = 'Please enter a valid advance amount greater than ₹0';
    } else if (amt > 100000) {
      errs.amount = 'Salary advance cannot exceed ₹1,00,000';
    }

    if (!advanceForm.reason) {
      errs.reason = 'Please select a reason';
    } else if (advanceForm.reason === 'Other' && !advanceForm.otherReason?.trim()) {
      errs.otherReason = 'Please specify reason';
    }

    if (Object.keys(errs).length > 0) {
      setAdvanceErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        employeeId,
        employeeName,
        department,
        designation,
        type: 'advance',
        amount: Number(advanceForm.amount),
        reason: advanceForm.reason === 'Other' ? advanceForm.otherReason.trim() : advanceForm.reason,
        otherReason: advanceForm.reason === 'Other' ? advanceForm.otherReason.trim() : '',
        deductionMethod: advanceForm.deductionMethod,
        numberOfMonths: advanceForm.deductionMethod === 'monthly-emi' ? 2 : 1,
        emiAmount: Number(advanceForm.amount),
        firstDeductionMonth: advanceForm.firstDeductionMonth,
        adjustmentMonth: advanceForm.firstDeductionMonth,
        remarks: advanceForm.remarks?.trim() || '',
        requestDate: new Date().toISOString().slice(0, 10)
      };

      await advanceLoanService.createRequest(companyId, payload);
      showToast('Salary advance request submitted successfully!', 'success');
      setModalType(null);
      loadData(true);
    } catch (err) {
      console.error('Failed to submit advance:', err);
      showToast(err.message || 'Failed to submit advance request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Loan Request
  const handleSubmitLoan = async (e) => {
    e.preventDefault();
    const errs = {};
    const amt = Number(loanForm.amount);
    if (!loanForm.amount || amt <= 0) {
      errs.amount = 'Please enter a valid loan amount greater than ₹0';
    } else if (amt > 200000) {
      errs.amount = 'Personal loan cannot exceed ₹2,00,000';
    }

    if (!loanForm.reason) {
      errs.reason = 'Please select a purpose';
    } else if (loanForm.reason === 'Other' && !loanForm.otherReason?.trim()) {
      errs.otherReason = 'Please specify purpose';
    }

    const months = Number(loanForm.numberOfMonths);
    if (!months || months < 1 || months > 24) {
      errs.numberOfMonths = 'Tenure must be between 1 and 24 months';
    }

    if (Object.keys(errs).length > 0) {
      setLoanErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        employeeId,
        employeeName,
        department,
        designation,
        type: 'loan',
        amount: Number(loanForm.amount),
        reason: loanForm.reason === 'Other' ? loanForm.otherReason.trim() : loanForm.reason,
        otherReason: loanForm.reason === 'Other' ? loanForm.otherReason.trim() : '',
        deductionMethod: 'monthly-emi',
        numberOfMonths: months,
        emiAmount: calculatedLoanEmi,
        firstDeductionMonth: loanForm.firstDeductionMonth,
        adjustmentMonth: loanForm.firstDeductionMonth,
        remarks: loanForm.remarks?.trim() || '',
        requestDate: new Date().toISOString().slice(0, 10)
      };

      await advanceLoanService.createRequest(companyId, payload);
      showToast('Loan application submitted successfully!', 'success');
      setModalType(null);
      loadData(true);
    } catch (err) {
      console.error('Failed to submit loan:', err);
      showToast(err.message || 'Failed to submit loan application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter requests based on tab & search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (currentTab === 'advances' && req.type !== 'advance') return false;
      if (currentTab === 'loans' && req.type !== 'loan') return false;
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesId = req.requestId?.toLowerCase().includes(query);
        const matchesReason = req.reason?.toLowerCase().includes(query);
        const matchesRemarks = req.remarks?.toLowerCase().includes(query);
        return matchesId || matchesReason || matchesRemarks;
      }
      return true;
    });
  }, [requests, currentTab, statusFilter, search]);

  // Tab Counts
  const advanceCount = useMemo(() => requests.filter((r) => r.type === 'advance').length, [requests]);
  const loanCount = useMemo(() => requests.filter((r) => r.type === 'loan').length, [requests]);

  // Dynamic KPI Stats based on currentTab
  const kpiStats = useMemo(() => {
    let sourceList = requests;
    let labelPrefix = 'Request';

    if (currentTab === 'advances') {
      sourceList = requests.filter((r) => r.type === 'advance');
      labelPrefix = 'Advance';
    } else if (currentTab === 'loans') {
      sourceList = requests.filter((r) => r.type === 'loan');
      labelPrefix = 'Loan';
    }

    const total = sourceList.length;
    const pending = sourceList.filter((r) => r.status === 'pending').length;
    const approvedAmount = sourceList
      .filter((r) => ['approved', 'completed'].includes(r.status))
      .reduce((sum, r) => sum + (Number(r.approvedAmount) || Number(r.amount) || 0), 0);
    const outstanding = sourceList
      .filter((r) => ['approved', 'completed'].includes(r.status))
      .reduce((sum, r) => sum + (Number(r.remainingAmount !== undefined ? r.remainingAmount : r.amount) || 0), 0);

    return {
      card1: {
        label: currentTab === 'advances' ? 'Total Advance Requests' : currentTab === 'loans' ? 'Total Loan Applications' : 'Total Requests',
        value: total,
        sub: 'Submitted to date'
      },
      card2: {
        label: `Pending ${labelPrefix}s`,
        value: pending,
        sub: 'Awaiting HR approval'
      },
      card3: {
        label: `Approved ${labelPrefix} Amount`,
        value: formatRupee(approvedAmount),
        sub: 'Sanctioned funds'
      },
      card4: {
        label: `Outstanding ${labelPrefix} Balance`,
        value: formatRupee(outstanding),
        sub: 'Balance to be deducted'
      }
    };
  }, [requests, currentTab]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
            <CheckCircle2 size={13} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`${styles.statusBadge} ${styles.statusRejected}`}>
            <XCircle size={13} /> Rejected
          </span>
        );
      case 'completed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            <Clock3 size={13} /> Pending
          </span>
        );
    }
  };

  const getPageHeaderInfo = () => {
    switch (currentTab) {
      case 'advances':
        return {
          title: 'My Salary Advances',
          subtitle: 'Apply for short-term salary advances, check approval status and upcoming payroll adjustments.'
        };
      case 'loans':
        return {
          title: 'My Loans',
          subtitle: 'Apply for personal loans, choose repayment tenure, and track monthly EMI installments.'
        };
      case 'schedule':
        return {
          title: 'Deduction Schedule',
          subtitle: 'Track active monthly salary deductions, repayment progress bars and remaining balance.'
        };
      case 'history':
        return {
          title: 'Deduction History',
          subtitle: 'View historical salary deductions and past payment logs recorded against your payroll slips.'
        };
      default:
        return {
          title: 'My Advances & Loans',
          subtitle: 'Apply for advances and personal loans, check approval progress, and view deduction schedules.'
        };
    }
  };

  const pageInfo = getPageHeaderInfo();

  return (
    <div className={styles.page}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />

      <div className={styles.container}>
        {/* Breadcrumb & Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <span>Employee Portal</span>
              <span>/</span>
              <span>Advances & Loans</span>
              {currentTab !== 'all' && (
                <>
                  <span>/</span>
                  <strong>
                    {currentTab === 'advances'
                      ? 'Advances'
                      : currentTab === 'loans'
                      ? 'Loans'
                      : currentTab === 'schedule'
                      ? 'Deduction Schedule'
                      : 'Deduction History'}
                  </strong>
                </>
              )}
            </div>
            <h1 className={styles.pageTitle}>{pageInfo.title}</h1>
            <p className={styles.pageSubtitle}>{pageInfo.subtitle}</p>
          </div>

          {/* Action Buttons: Advance, Loan, Refresh */}
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => loadData(true)}
              title="Refresh Data"
              disabled={loading || refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>

            {currentTab !== 'advances' && (
              <button
                type="button"
                className={styles.applyLoanBtn}
                onClick={handleOpenLoanModal}
              >
                <Plus size={16} /> Request Loan
              </button>
            )}

            {currentTab !== 'loans' && (
              <button
                type="button"
                className={styles.applyAdvanceBtn}
                onClick={handleOpenAdvanceModal}
              >
                <Plus size={16} /> Request Advance
              </button>
            )}
          </div>
        </div>

        {/* Dynamic KPI Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{kpiStats.card1.label}</span>
              <strong className={styles.summaryNumber}>{kpiStats.card1.value}</strong>
              <span className={styles.summarySub}>{kpiStats.card1.sub}</span>
            </div>
            <div className={`${styles.iconWrap} ${styles.blue}`}>
              <FileText size={22} />
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{kpiStats.card2.label}</span>
              <strong className={styles.summaryNumber}>{kpiStats.card2.value}</strong>
              <span className={styles.summarySub}>{kpiStats.card2.sub}</span>
            </div>
            <div className={`${styles.iconWrap} ${styles.yellow}`}>
              <Clock3 size={22} />
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{kpiStats.card3.label}</span>
              <strong className={styles.summaryNumber}>{kpiStats.card3.value}</strong>
              <span className={styles.summarySub}>{kpiStats.card3.sub}</span>
            </div>
            <div className={`${styles.iconWrap} ${styles.green}`}>
              <BadgeIndianRupee size={22} />
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{kpiStats.card4.label}</span>
              <strong className={styles.summaryNumber}>{kpiStats.card4.value}</strong>
              <span className={styles.summarySub}>{kpiStats.card4.sub}</span>
            </div>
            <div className={`${styles.iconWrap} ${styles.purple}`}>
              <WalletCards size={22} />
            </div>
          </div>
        </div>

        {/* Section View: All / Advances / Loans Table */}
        {['all', 'advances', 'loans'].includes(currentTab) && (
          <div className={styles.mainCard}>
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by Request ID, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className={styles.filtersGroup}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Loading your records...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title={`No ${currentTab === 'advances' ? 'advance' : currentTab === 'loans' ? 'loan' : ''} requests found`}
                description={
                  search || statusFilter !== 'all'
                    ? 'No requests match your current filters.'
                    : `You haven't submitted any ${
                        currentTab === 'advances'
                          ? 'salary advance'
                          : currentTab === 'loans'
                          ? 'personal loan'
                          : 'advance or loan'
                      } requests yet.`
                }
                actionLabel={
                  currentTab === 'loans' ? '+ Request Loan' : '+ Request Advance'
                }
                onAction={
                  currentTab === 'loans' ? handleOpenLoanModal : handleOpenAdvanceModal
                }
              />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Type</th>
                      <th>Applied Date</th>
                      <th>Requested Amount</th>
                      <th>Repayment Terms</th>
                      <th>Reason / Purpose</th>
                      <th>Status</th>
                      <th>Outstanding</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((row) => (
                      <tr key={row._id || row.requestId}>
                        <td>
                          <span className={styles.reqId}>{row.requestId}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.typeBadge} ${
                              row.type === 'loan' ? styles.loanBadge : styles.advanceBadge
                            }`}
                          >
                            {row.type === 'loan' ? 'Loan' : 'Advance'}
                          </span>
                        </td>
                        <td>{formatDate(row.requestDate || row.createdAt)}</td>
                        <td className={styles.amountCell}>{formatRupee(row.amount)}</td>
                        <td>
                          <div className={styles.repayTerms}>
                            <span className={styles.repayMethod}>
                              {row.deductionMethod === 'monthly-emi'
                                ? `Monthly EMI (${row.numberOfMonths || 1} mos)`
                                : 'Salary Adjustment'}
                            </span>
                            <span className={styles.repaySub}>
                              {row.deductionMethod === 'monthly-emi'
                                ? `${formatRupee(row.emiAmount)} / mo`
                                : 'Next payroll cycle'}
                            </span>
                          </div>
                        </td>
                        <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.reason}
                        </td>
                        <td>{getStatusBadge(row.status)}</td>
                        <td style={{ fontWeight: 600 }}>
                          {row.status === 'approved' || row.status === 'completed'
                            ? formatRupee(row.remainingAmount !== undefined ? row.remainingAmount : row.amount)
                            : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setSelectedRequest(row)}
                          >
                            View Details <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Deduction Schedule */}
        {currentTab === 'schedule' && (
          <div className={styles.mainCard}>
            <div className={styles.policyAlert}>
              <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Active Deduction Schedules:</strong> Approved advances and loans are adjusted
                automatically against your monthly salary. Repayment progress and remaining installments are tracked here.
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Loading deduction schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No active deduction schedules"
                description="You currently have no active deduction schedules linked to your employee code."
              />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Schedule / Request ID</th>
                      <th>Type</th>
                      <th>Sanctioned Amount</th>
                      <th>Deducted Amount</th>
                      <th>Remaining Balance</th>
                      <th>Repayment Progress</th>
                      <th>Monthly EMI</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => {
                      const total = Number(item.totalAmount || item.approvedAmount || item.amount || 0);
                      const deducted = Number(item.totalDeducted || item.deductedAmount || 0);
                      const remaining = Number(item.remainingBalance !== undefined ? item.remainingBalance : (total - deducted));
                      const progress = total > 0 ? Math.min(100, Math.round((deducted / total) * 100)) : 0;

                      return (
                        <tr key={item._id || item.scheduleId || item.requestId}>
                          <td>
                            <span className={styles.reqId}>{item.scheduleId || item.requestId || 'SCH-001'}</span>
                          </td>
                          <td>
                            <span
                              className={`${styles.typeBadge} ${
                                item.type === 'loan' ? styles.loanBadge : styles.advanceBadge
                              }`}
                            >
                              {item.type === 'loan' ? 'Loan' : 'Advance'}
                            </span>
                          </td>
                          <td className={styles.amountCell}>{formatRupee(total)}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatRupee(deducted)}</td>
                          <td style={{ color: '#9333ea', fontWeight: 600 }}>{formatRupee(remaining)}</td>
                          <td>
                            <div className={styles.scheduleProgress}>
                              <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                              </div>
                              <div className={styles.progressLabel}>
                                <span>{progress}% paid</span>
                                <span>{item.installmentsPaid || 0}/{item.totalInstallments || item.numberOfMonths || 1} mos</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatRupee(item.monthlyDeduction || item.emiAmount)}/mo</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                item.status === 'completed'
                                  ? styles.statusCompleted
                                  : item.status === 'active'
                                  ? styles.statusApproved
                                  : styles.statusPending
                              }`}
                            >
                              {item.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Deduction History */}
        {currentTab === 'history' && (
          <div className={styles.mainCard}>
            <div className={styles.policyAlert}>
              <History size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Repayment History:</strong> Detailed log of previous payroll deductions, showing exact amounts
                adjusted and salary month details.
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Loading deduction history...</p>
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={History}
                title="No past deduction history"
                description="No deduction transactions have been processed yet on your payroll slips."
              />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Transaction / Request ID</th>
                      <th>Type</th>
                      <th>Payroll Month</th>
                      <th>Deduction Date</th>
                      <th>Deducted Amount</th>
                      <th>Remaining Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, idx) => (
                      <tr key={h._id || idx}>
                        <td>
                          <span className={styles.reqId}>{h.requestId || h.historyId || `TXN-${idx + 1}`}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.typeBadge} ${
                              h.type === 'loan' ? styles.loanBadge : styles.advanceBadge
                            }`}
                          >
                            {h.type === 'loan' ? 'Loan' : 'Advance'}
                          </span>
                        </td>
                        <td>{h.salaryMonth || h.month || '—'}</td>
                        <td>{formatDate(h.deductionDate || h.createdAt)}</td>
                        <td style={{ color: '#16a34a', fontWeight: 700 }}>
                          {formatRupee(h.deductedAmount || h.amount)}
                        </td>
                        <td style={{ color: '#9333ea', fontWeight: 600 }}>
                          {formatRupee(h.remainingBalance || 0)}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                            <CheckCircle2 size={13} /> Deducted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL 1: APPLY FOR SALARY ADVANCE ──────────────── */}
      {modalType === 'advance' && (
        <div className={styles.modalOverlay} onClick={() => setModalType(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HandCoins size={20} color="#2563eb" />
                  <h2 className={styles.modalTitle}>Apply for Salary Advance</h2>
                </div>
                <p className={styles.modalSubtitle}>
                  Request short-term financial advance adjusted against upcoming salary payout.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setModalType(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdvance} className={styles.modalForm}>
              <div className={styles.modalBody}>
                {/* Employee Info Header Box */}
                <div className={styles.empInfoBox}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Employee Name</span>
                    <span className={styles.infoValue}>{employeeName}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Employee ID</span>
                    <span className={styles.infoValue}>{employeeId}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Designation</span>
                    <span className={styles.infoValue}>{designation}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Department</span>
                    <span className={styles.infoValue}>{department}</span>
                  </div>
                </div>

                {/* Requested Amount */}
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.labelWithPreview}`}>
                    <span>Advance Amount (₹) <span className={styles.required}>*</span></span>
                    {advanceForm.amount > 0 && (
                      <span className={styles.amountPreviewBlue}>
                        {formatRupee(advanceForm.amount)}
                      </span>
                    )}
                  </label>
                  <div className={styles.inputGroup}>
                    <span className={styles.inputPrefix}>₹</span>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      placeholder="e.g. 10000"
                      className={`${styles.input} ${styles.inputWithPrefix}`}
                      value={advanceForm.amount}
                      onChange={(e) => {
                        setAdvanceForm({ ...advanceForm, amount: e.target.value });
                        if (advanceErrors.amount) setAdvanceErrors({ ...advanceErrors, amount: null });
                      }}
                    />
                  </div>
                  {advanceErrors.amount && <span className={styles.errorText}>{advanceErrors.amount}</span>}
                </div>

                {/* Deduction Method */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Repayment Method <span className={styles.required}>*</span></label>
                  <select
                    className={styles.selectInput}
                    value={advanceForm.deductionMethod}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, deductionMethod: e.target.value })}
                  >
                    <option value="salary-adjustment">Single Deduction (Next Salary Adjustment)</option>
                    <option value="monthly-emi">Split Deduction (2 Months EMI)</option>
                  </select>
                </div>

                {/* Expected Adjustment Month */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Adjustment Payroll Month</label>
                  <input
                    type="month"
                    className={styles.input}
                    value={advanceForm.firstDeductionMonth}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, firstDeductionMonth: e.target.value })}
                  />
                </div>

                {/* Reason */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Reason / Purpose <span className={styles.required}>*</span></label>
                  <select
                    className={styles.selectInput}
                    value={advanceForm.reason}
                    onChange={(e) => {
                      setAdvanceForm({ ...advanceForm, reason: e.target.value });
                      if (advanceErrors.reason) setAdvanceErrors({ ...advanceErrors, reason: null });
                    }}
                  >
                    <option value="Emergency">General Emergency</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="House Rent / Repair">House Rent / Repair</option>
                    <option value="Festival / Marriage">Festival / Marriage Expenses</option>
                    <option value="Travel Expenses">Travel / Commute</option>
                    <option value="Other">Other (Please specify)</option>
                  </select>
                  {advanceErrors.reason && <span className={styles.errorText}>{advanceErrors.reason}</span>}
                </div>

                {advanceForm.reason === 'Other' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Please Specify Reason <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      placeholder="Specify your advance purpose..."
                      className={styles.input}
                      value={advanceForm.otherReason}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, otherReason: e.target.value })}
                    />
                    {advanceErrors.otherReason && (
                      <span className={styles.errorText}>{advanceErrors.otherReason}</span>
                    )}
                  </div>
                )}

                {/* Remarks */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Additional Remarks / Justification (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Provide any additional context for management review..."
                    className={styles.textarea}
                    value={advanceForm.remarks}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                  />
                </div>

                {/* Policy Notice */}
                <div className={styles.policyAlert}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Salary advances are adjusted against your upcoming monthly salary slip upon approval by HR/Management.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModalType(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Advance Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: APPLY FOR PERSONAL LOAN ────────────────── */}
      {modalType === 'loan' && (
        <div className={styles.modalOverlay} onClick={() => setModalType(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BadgeIndianRupee size={20} color="#7e22ce" />
                  <h2 className={styles.modalTitle}>Apply for Personal Loan</h2>
                </div>
                <p className={styles.modalSubtitle}>
                  Request personal loan with convenient monthly EMI installments.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setModalType(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitLoan} className={styles.modalForm}>
              <div className={styles.modalBody}>
                {/* Employee Info Header Box */}
                <div className={styles.empInfoBox}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Employee Name</span>
                    <span className={styles.infoValue}>{employeeName}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Employee ID</span>
                    <span className={styles.infoValue}>{employeeId}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Designation</span>
                    <span className={styles.infoValue}>{designation}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Department</span>
                    <span className={styles.infoValue}>{department}</span>
                  </div>
                </div>

                {/* Requested Loan Amount */}
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.labelWithPreview}`}>
                    <span>Loan Amount (₹) <span className={styles.required}>*</span></span>
                    {loanForm.amount > 0 && (
                      <span className={styles.amountPreviewPurple}>
                        {formatRupee(loanForm.amount)}
                      </span>
                    )}
                  </label>
                  <div className={styles.inputGroup}>
                    <span className={styles.inputPrefix}>₹</span>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="e.g. 50000"
                      className={`${styles.input} ${styles.inputWithPrefix}`}
                      value={loanForm.amount}
                      onChange={(e) => {
                        setLoanForm({ ...loanForm, amount: e.target.value });
                        if (loanErrors.amount) setLoanErrors({ ...loanErrors, amount: null });
                      }}
                    />
                  </div>
                  {loanErrors.amount && <span className={styles.errorText}>{loanErrors.amount}</span>}
                </div>

                {/* Tenure in Months */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Repayment Tenure (Months) <span className={styles.required}>*</span></label>
                  <select
                    className={styles.selectInput}
                    value={loanForm.numberOfMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, numberOfMonths: Number(e.target.value) })}
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months (Half Year)</option>
                    <option value={9}>9 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months (1.5 Years)</option>
                    <option value={24}>24 Months (2 Years)</option>
                  </select>
                </div>

                {/* Live EMI Calculation Summary */}
                {loanForm.amount > 0 && (
                  <div className={styles.calcCard} style={{ borderColor: '#e9d5ff', background: 'linear-gradient(135deg, #fdf4ff, #faf5ff)' }}>
                    <div className={styles.calcHeader} style={{ color: '#6b21a8' }}>
                      <span>Estimated EMI Calculation</span>
                      <span>Interest: 0% Company Benefit</span>
                    </div>
                    <div className={styles.calcRows}>
                      <div className={styles.calcCol}>
                        <span className={styles.calcLabel}>Principal Amount</span>
                        <span className={styles.calcVal}>{formatRupee(loanForm.amount)}</span>
                      </div>
                      <div className={styles.calcCol}>
                        <span className={styles.calcLabel}>Tenure</span>
                        <span className={styles.calcVal}>{loanForm.numberOfMonths} Months</span>
                      </div>
                      <div className={styles.calcCol}>
                        <span className={styles.calcLabel}>Monthly Deduction (EMI)</span>
                        <span className={styles.calcVal} style={{ color: '#7e22ce' }}>
                          {formatRupee(calculatedLoanEmi)} / mo
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* First Deduction Month */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Deduction Month</label>
                  <input
                    type="month"
                    className={styles.input}
                    value={loanForm.firstDeductionMonth}
                    onChange={(e) => setLoanForm({ ...loanForm, firstDeductionMonth: e.target.value })}
                  />
                </div>

                {/* Purpose / Reason */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Loan Purpose <span className={styles.required}>*</span></label>
                  <select
                    className={styles.selectInput}
                    value={loanForm.reason}
                    onChange={(e) => {
                      setLoanForm({ ...loanForm, reason: e.target.value });
                      if (loanErrors.reason) setLoanErrors({ ...loanErrors, reason: null });
                    }}
                  >
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="Education / School Fees">Child Education / School Fees</option>
                    <option value="Medical Emergency">Medical Treatment / Hospitalization</option>
                    <option value="Marriage / Ceremony">Marriage / Ceremony Expenses</option>
                    <option value="House Renovation">Home Construction / Renovation</option>
                    <option value="Vehicle Purchase">Vehicle Purchase / Commute</option>
                    <option value="Other">Other Purpose (Specify below)</option>
                  </select>
                  {loanErrors.reason && <span className={styles.errorText}>{loanErrors.reason}</span>}
                </div>

                {loanForm.reason === 'Other' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Please Specify Purpose <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      placeholder="Specify your loan purpose..."
                      className={styles.input}
                      value={loanForm.otherReason}
                      onChange={(e) => setLoanForm({ ...loanForm, otherReason: e.target.value })}
                    />
                    {loanErrors.otherReason && (
                      <span className={styles.errorText}>{loanErrors.otherReason}</span>
                    )}
                  </div>
                )}

                {/* Remarks */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Additional Notes / Justification (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Provide any additional comments for management approval..."
                    className={styles.textarea}
                    value={loanForm.remarks}
                    onChange={(e) => setLoanForm({ ...loanForm, remarks: e.target.value })}
                  />
                </div>

                {/* Policy Notice */}
                <div className={styles.policyAlert}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Monthly EMI deductions will begin from the selected deduction month. Approvals are subject to company service tenure and loan policy eligibility.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModalType(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  style={{ background: '#7e22ce' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Loan Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS MODAL ─────────────────────────────── */}
      {selectedRequest && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 className={styles.modalTitle}>Request Details</h2>
                  <span className={styles.reqId}>{selectedRequest.requestId}</span>
                </div>
                <p className={styles.modalSubtitle}>
                  Applied on {formatDate(selectedRequest.requestDate || selectedRequest.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedRequest(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className={`${styles.typeBadge} ${
                      selectedRequest.type === 'loan' ? styles.loanBadge : styles.advanceBadge
                    }`}
                  >
                    {selectedRequest.type === 'loan' ? 'Personal Loan' : 'Salary Advance'}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Current Status:</span>
                </div>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              {selectedRequest.status === 'rejected' && (
                <div className={styles.rejectBox}>
                  <div className={styles.rejectTitle}>
                    <ShieldAlert size={16} /> Rejection Reason
                  </div>
                  <div className={styles.rejectReason}>
                    {selectedRequest.rejectionReason || selectedRequest.remarks || 'Application could not be approved at this time.'}
                  </div>
                </div>
              )}

              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Requested Amount</span>
                  <span className={styles.detailValue}>{formatRupee(selectedRequest.amount)}</span>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Approved Amount</span>
                  <span className={styles.detailValue} style={{ color: selectedRequest.status === 'approved' ? '#16a34a' : 'inherit' }}>
                    {selectedRequest.approvedAmount ? formatRupee(selectedRequest.approvedAmount) : 'Pending Review'}
                  </span>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Repayment Method</span>
                  <span className={styles.detailValue}>
                    {selectedRequest.deductionMethod === 'monthly-emi'
                      ? `Monthly EMI (${selectedRequest.numberOfMonths || 1} Months)`
                      : 'Salary Adjustment'}
                  </span>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Monthly EMI</span>
                  <span className={styles.detailValue}>
                    {selectedRequest.emiAmount ? `${formatRupee(selectedRequest.emiAmount)} / month` : 'Single Deduction'}
                  </span>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Remaining Balance</span>
                  <span className={styles.detailValue} style={{ color: '#9333ea' }}>
                    {['approved', 'completed'].includes(selectedRequest.status)
                      ? formatRupee(selectedRequest.remainingAmount !== undefined ? selectedRequest.remainingAmount : selectedRequest.amount)
                      : '—'}
                  </span>
                </div>

                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>First Deduction Month</span>
                  <span className={styles.detailValue}>
                    {selectedRequest.firstDeductionMonth || selectedRequest.adjustmentMonth || 'Next Cycle'}
                  </span>
                </div>
              </div>

              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Purpose / Reason</span>
                <span className={styles.detailValue}>{selectedRequest.reason}</span>
              </div>

              {selectedRequest.remarks && (
                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Additional Notes / Justification</span>
                  <span className={styles.detailValue} style={{ fontWeight: 400, color: '#475569' }}>
                    {selectedRequest.remarks}
                  </span>
                </div>
              )}

              {selectedRequest.approvedBy && (
                <div className={styles.detailField} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <span className={styles.detailLabel} style={{ color: '#166534' }}>Approval Metadata</span>
                  <span className={styles.detailValue} style={{ color: '#14532d', fontSize: 12 }}>
                    Approved by {selectedRequest.approvedBy} on {formatDate(selectedRequest.approvedDate)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
