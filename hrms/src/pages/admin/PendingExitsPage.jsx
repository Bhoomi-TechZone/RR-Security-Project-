import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  PlusCircle
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import Toast from '../../components/common/Toast';
import FnFDetailsDrawer from '../../components/payroll/FnFDetailsDrawer';
import FinalizeExitDrawer from '../../components/payroll/FinalizeExitDrawer';
import { useCompany } from '../../context/CompanyContext';
import separationService from '../../services/separationService';
import {
  SEPARATION_REASONS,
  getStoredFnF,
  saveStoredFnF
} from '../../data/fnfData';
import styles from './PendingExitsPage.module.css';

// Format ISO YYYY-MM-DD into DD-Mon-YYYY (e.g. 01-Jan-2026)
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.slice(0, 10);
    const d = new Date(`${clean}T12:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}

function getInitials(name) {
  if (!name) return 'EM';
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function computeNoticeDays(rec) {
  const planned = Number(rec.noticePeriodRequiredDays ?? 30);
  if (rec.noticePeriodServedDays !== undefined && rec.noticePeriodServedDays !== null) {
    return { planned, actual: Number(rec.noticePeriodServedDays) };
  }
  if (rec.resignationDate && rec.lastWorkingDay) {
    const d1 = new Date(`${rec.resignationDate.slice(0, 10)}T00:00:00`);
    const d2 = new Date(`${rec.lastWorkingDay.slice(0, 10)}T00:00:00`);
    const diff = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    return { planned, actual: diff };
  }
  return { planned, actual: planned };
}

export default function PendingExitsPage({ initialShowFinalized = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = !location.pathname.startsWith('/user');
  const basePath = isAdmin ? '/admin/payroll' : '/user/payroll';
  const LayoutComponent = isAdmin ? AdminLayout : UserLayout;

  const { activeCompanyId, activeCompany } = useCompany();

  const queryParams = new URLSearchParams(location.search);
  const urlFinalized = queryParams.get('finalized') === 'true';

  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type });

  // Filter inputs
  const [exitDateFrom, setExitDateFrom] = useState('');
  const [exitDateTo, setExitDateTo] = useState('');
  const [exitReason, setExitReason] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied filters (triggered by Search button, Enter, or dropdown/checkbox changes)
  const [appliedFilters, setAppliedFilters] = useState({
    from: '',
    to: '',
    reason: 'All',
    query: ''
  });

  const [showFinalized, setShowFinalized] = useState(initialShowFinalized || urlFinalized);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Process Drawer state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Finalize Exit Drawer state
  const [finalizeRecord, setFinalizeRecord] = useState(null);
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);

  // Confirmation modal state ('cancel')
  const [confirmAction, setConfirmAction] = useState(null);

  const loadExits = useCallback(async () => {
    if (!activeCompanyId) return;
    try {
      const res = await separationService.getSeparations({}, activeCompanyId);
      if (res?.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(getStoredFnF());
      }
    } catch (err) {
      console.warn('Failed to load exits from backend, using local:', err);
      setRecords(getStoredFnF());
    }
  }, [activeCompanyId]);

  useEffect(() => {
    loadExits();
  }, [loadExits]);

  useEffect(() => {
    if (urlFinalized) {
      setShowFinalized(true);
    }
  }, [urlFinalized]);

  const handleApplySearch = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      from: exitDateFrom,
      to: exitDateTo,
      reason: exitReason,
      query: searchQuery.trim().toLowerCase()
    });
    setCurrentPage(1);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (rec.settlementStatus === 'Cancelled') return false;

      const isFinalized = rec.settlementStatus === 'Settled / Disbursed';
      if (!showFinalized && isFinalized) return false;

      // Exit Reason filter
      const activeReason = appliedFilters.reason;
      if (activeReason && activeReason !== 'All') {
        if ((rec.separationReason || '') !== activeReason) return false;
      }

      // Date range filter (by Exit Date / lastWorkingDay)
      const exitStr = (rec.lastWorkingDay || rec.resignationDate || '').slice(0, 10);
      if (appliedFilters.from && exitStr && exitStr < appliedFilters.from) return false;
      if (appliedFilters.to && exitStr && exitStr > appliedFilters.to) return false;

      // Search query (Code or Name)
      const q = appliedFilters.query;
      if (q) {
        const name = (rec.employeeName || '').toLowerCase();
        const code = (rec.employeeCode || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }

      return true;
    });
  }, [records, showFinalized, appliedFilters]);

  // Pagination calculations
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, safePage, pageSize]);

  // Finalize exit handler (triggered from FinalizeExitDrawer)
  const executeFinalize = async (rec, { selectedLetters = [], sendEmail = false } = {}) => {
    const today = new Date().toISOString().slice(0, 10);
    const targetId = rec._id || rec.id;

    try {
      await separationService.finalizeSeparation(targetId, {
        paymentDate: today,
        mode: rec.payment?.mode || 'Bank Transfer (NEFT)',
        utrNo: rec.payment?.utrNo || `CMS${Date.now().toString().slice(-8)}`
      }, activeCompanyId);
    } catch (apiErr) {
      console.warn('Backend finalize notice:', apiErr.message);
    }

    const updatedList = records.map((item) => {
      const itemId = item._id || item.id;
      if (itemId !== targetId) return item;
      return {
        ...item,
        settlementStatus: 'Settled / Disbursed',
        settlementDate: today,
        issuedLetters: selectedLetters,
        emailDispatched: sendEmail,
        approvalWorkflow: {
          ...(item.approvalWorkflow || {}),
          currentStage: 'final_approval',
          isFullyApproved: true
        },
        payment: {
          ...(item.payment || {}),
          status: 'Disbursed',
          paymentDate: today
        }
      };
    });

    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setIsFinalizeOpen(false);
    setFinalizeRecord(null);

    const letterNote =
      selectedLetters.length > 0
        ? ` ${selectedLetters.length} letter(s) generated${sendEmail ? ' & emailed' : ''}.`
        : '';
    notify(`✓ Exit finalized for ${rec.employeeName} (${rec.employeeCode}). Employee marked inactive.${letterNote}`, 'success');
  };

  // Cancel exit handler
  const executeCancel = async (rec) => {
    const targetId = rec._id || rec.id;
    try {
      await separationService.cancelSeparation(targetId, activeCompanyId);
    } catch (apiErr) {
      console.warn('Backend cancel notice:', apiErr.message);
    }

    const updatedList = records.filter((item) => (item._id || item.id) !== targetId);
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setConfirmAction(null);
    notify(`Separation request cancelled for ${rec.employeeName} (${rec.employeeCode}).`, 'info');
  };

  // Drawer handlers
  const handleApproveStage = async (fnf) => {
    const stageOrder = ['hr_review', 'ops_review', 'accounts_review', 'final_approval'];
    const currentStage = fnf.approvalWorkflow?.currentStage || 'hr_review';
    const currentIdx = stageOrder.indexOf(currentStage);
    const now = new Date().toISOString().slice(0, 10);

    const updatedWorkflow = {
      ...fnf.approvalWorkflow,
      stages: {
        ...(fnf.approvalWorkflow?.stages || {}),
        [currentStage]: {
          status: 'Approved',
          approver: 'Admin Approver',
          date: now
        }
      }
    };

    let nextStatus = 'Pending Approval';
    if (currentIdx < stageOrder.length - 1) {
      updatedWorkflow.currentStage = stageOrder[currentIdx + 1];
    } else {
      updatedWorkflow.isFullyApproved = true;
      nextStatus = 'Approved for Payout';
    }

    const updatedRecord = {
      ...fnf,
      approvalWorkflow: updatedWorkflow,
      settlementStatus: nextStatus
    };

    const targetId = fnf._id || fnf.id;
    try {
      await separationService.updateSeparation(targetId, {
        approvalWorkflow: updatedWorkflow,
        settlementStatus: nextStatus
      }, activeCompanyId);
    } catch (_) { }

    const updatedList = records.map((item) => ((item._id || item.id) === targetId ? updatedRecord : item));
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setSelectedRecord(updatedRecord);
    notify(
      updatedWorkflow.isFullyApproved
        ? `✓ Final approval completed for ${fnf.employeeName}.`
        : `✓ Stage approved for ${fnf.employeeName}.`,
      'success'
    );
  };

  const handleDisburse = async (fnf, payoutDetails = {}) => {
    const today = payoutDetails.paymentDate || new Date().toISOString().slice(0, 10);
    const utr = payoutDetails.utrNo || `CMS${Date.now().toString().slice(-8)}`;
    const mode = payoutDetails.mode || 'Bank Transfer (NEFT)';

    const updatedRecord = {
      ...fnf,
      settlementStatus: 'Settled / Disbursed',
      settlementDate: today,
      payment: {
        ...(fnf.payment || {}),
        mode,
        paymentDate: today,
        utrNo: utr,
        status: 'Disbursed'
      }
    };

    const targetId = fnf._id || fnf.id;
    try {
      await separationService.finalizeSeparation(targetId, {
        paymentDate: today,
        mode,
        utrNo: utr
      }, activeCompanyId);
    } catch (_) { }

    const updatedList = records.map((item) => ((item._id || item.id) === targetId ? updatedRecord : item));
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setSelectedRecord(updatedRecord);
    notify(`✓ Settlement disbursed via ${mode} (UTR: ${utr}) for ${fnf.employeeName}.`, 'success');
  };

  const handleSaveSettlement = async (updatedRecord) => {
    const targetId = updatedRecord._id || updatedRecord.id;
    try {
      await separationService.updateSeparation(targetId, updatedRecord, activeCompanyId);
    } catch (_) { }

    const updatedList = records.map((item) => ((item._id || item.id) === targetId ? updatedRecord : item));
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setIsDrawerOpen(false);
    setSelectedRecord(null);
    notify(
      `✓ Settlement processed for ${updatedRecord.employeeName} (Net: ₹${Number(
        updatedRecord.netSettlementAmount || updatedRecord.finalSettlement?.netPayable || 0
      ).toLocaleString('en-IN')}).`,
      'success'
    );
  };

  const handleFinalizeSettlement = async (updatedRecord) => {
    const targetId = updatedRecord._id || updatedRecord.id;
    try {
      await separationService.finalizeSeparation(targetId, updatedRecord, activeCompanyId);
    } catch (_) { }

    const updatedList = records.map((item) => ((item._id || item.id) === targetId ? updatedRecord : item));
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setIsDrawerOpen(false);
    setSelectedRecord(null);
    notify(
      `✓ Exit finalized & settled for ${updatedRecord.employeeName} (Net: ₹${Number(
        updatedRecord.netSettlementAmount || updatedRecord.finalSettlement?.netPayable || 0
      ).toLocaleString('en-IN')}).`,
      'success'
    );
  };

  const handleGenerateLetter = (fnf) => {
    navigate(
      `${isAdmin ? '/admin' : '/user'}/letter-management?type=full-final-letter&empCode=${fnf.employeeCode || ''}`
    );
  };

  return (
    <LayoutComponent>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          <Link to={isAdmin ? '/admin/dashboard' : '/user/dashboard'}>Dashboard</Link>
          <span>/</span>
          <Link to={`${basePath}?tab=fnf`}>Payroll</Link>
          <span>/</span>
          <Link to={`${basePath}?tab=fnf`}>Separation</Link>
          <span>/</span>
          <strong>Pending Exits</strong>
        </div>

        {/* Header Row */}
        <div className={styles.pageHeader}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Pending Exits</h1>
            <p className={styles.subtitle}>Process Full &amp; Final Settlement for exited employees.</p>
          </div>
          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.addNewBtn}
              onClick={() => navigate(`${basePath}/fnf-initiate`)}
            >
              <PlusCircle size={15} />
              <span>Add New Exit</span>
            </button>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(`${basePath}?tab=fnf`)}
              title="Return to Separation Dashboard"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <form className={styles.filtersSection} onSubmit={handleApplySearch}>
          <div className={styles.filtersBar}>
            <div className={styles.filterInputsGroup}>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Exit Date From</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={exitDateFrom}
                  onChange={(e) => {
                    setExitDateFrom(e.target.value);
                    setAppliedFilters((prev) => ({ ...prev, from: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Exit Date To</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={exitDateTo}
                  onChange={(e) => {
                    setExitDateTo(e.target.value);
                    setAppliedFilters((prev) => ({ ...prev, to: e.target.value }));
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Exit Reason</label>
                <select
                  className={styles.selectInput}
                  value={exitReason}
                  onChange={(e) => {
                    setExitReason(e.target.value);
                    setAppliedFilters((prev) => ({ ...prev, reason: e.target.value }));
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {SEPARATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Search</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Code or Name"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAppliedFilters((prev) => ({ ...prev, query: e.target.value.trim().toLowerCase() }));
                    setCurrentPage(1);
                  }}
                />
              </div>

              <button type="submit" className={styles.searchBtn}>
                <Search size={15} />
                <span>Search</span>
              </button>
            </div>

            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Records per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={showFinalized}
                onChange={(e) => {
                  setShowFinalized(e.target.checked);
                  setCurrentPage(1);
                }}
              />
              <span>Show Finalized Exits</span>
            </label>
          </div>
        </form>

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>JOINING DATE</th>
                  <th>RESIGNATION DATE</th>
                  <th>EXIT DATE</th>
                  <th>EXIT REASON</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyRow}>
                      <Users size={34} color="#94a3b8" />
                      <div className={styles.emptyTitle}>No Exit Records Found</div>
                      <p className={styles.emptyDesc}>
                        {showFinalized
                          ? 'No pending or finalized exit records match your filter criteria.'
                          : 'There are no pending exits right now. Click "Add New Exit" to initiate one.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec) => {
                    const { planned, actual } = computeNoticeDays(rec);
                    const isAligned = actual >= planned;
                    const isFinalized = rec.settlementStatus === 'Settled / Disbursed';

                    return (
                      <tr key={rec.id}>
                        {/* EMPLOYEE */}
                        <td>
                          <div className={styles.empCell}>
                            {rec.avatar ? (
                              <img src={rec.avatar} alt={rec.employeeName} className={styles.avatarImg} />
                            ) : (
                              <div className={styles.avatarFallback}>{getInitials(rec.employeeName)}</div>
                            )}
                            <div className={styles.empInfo}>
                              <span className={styles.empName}>{rec.employeeName}</span>
                              <span className={styles.empCode}>{rec.employeeCode}</span>
                            </div>
                          </div>
                        </td>

                        {/* JOINING DATE */}
                        <td>
                          <div className={styles.dateMain}>{formatDateDisplay(rec.dateOfJoining)}</div>
                        </td>

                        {/* RESIGNATION DATE */}
                        <td>
                          <div className={styles.dateMain}>{formatDateDisplay(rec.resignationDate)}</div>
                          <div className={styles.noticeSub}>
                            Planned Notice: <span className={styles.noticeDaysBold}>{planned} day(s)</span>
                          </div>
                        </td>

                        {/* EXIT DATE */}
                        <td>
                          <div className={styles.dateMain}>{formatDateDisplay(rec.lastWorkingDay)}</div>
                          <div className={styles.noticeSub}>
                            Actual Notice:{' '}
                            <span
                              className={
                                isAligned ? styles.actualNoticeAligned : styles.actualNoticeShortfall
                              }
                            >
                              {actual} day(s)
                            </span>
                          </div>
                        </td>

                        {/* EXIT REASON */}
                        <td>
                          <div className={styles.reasonTitle}>{rec.separationReason || '—'}</div>
                          {rec.remarks && (
                            <div className={styles.reasonRemarks} title={rec.remarks}>
                              {rec.remarks}
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className={styles.actionsGroup}>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.processBtn}`}
                              onClick={() => {
                                setSelectedRecord(rec);
                                setIsDrawerOpen(true);
                              }}
                              title="Process Full & Final Settlement"
                            >
                              <Eye size={14} />
                              <span>Process</span>
                            </button>

                            {!isFinalized ? (
                              <>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.finalizeBtn}`}
                                  onClick={() => {
                                    setFinalizeRecord(rec);
                                    setIsFinalizeOpen(true);
                                  }}
                                  title="Finalize this exit settlement"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Finalize</span>
                                </button>

                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.cancelBtn}`}
                                  onClick={() => setConfirmAction({ type: 'cancel', record: rec })}
                                  title="Cancel exit initiation"
                                >
                                  <XCircle size={14} />
                                  <span>Cancel</span>
                                </button>
                              </>
                            ) : (
                              <span className={styles.finalizedBadge}>
                                <CheckCircle2 size={13} />
                                Finalized
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <div className={styles.paginationBar}>
              <span>
                Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, totalItems)} of{' '}
                {totalItems} entries
              </span>
              {totalPages > 1 && (
                <div className={styles.pageControls}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      className={`${styles.pageBtn} ${pg === safePage ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Cancel Modal */}
        {confirmAction && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle}>Cancel Exit Initiation?</h3>
              <p className={styles.modalText}>
                {`Are you sure you want to cancel and remove the exit initiation for ${confirmAction.record.employeeName} (${confirmAction.record.employeeCode})?`}
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setConfirmAction(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.modalConfirmBtn}
                  style={{ backgroundColor: '#f43f5e' }}
                  onClick={() => executeCancel(confirmAction.record)}
                >
                  Yes, Cancel Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finalize Exit & Generate Letters Drawer */}
        <FinalizeExitDrawer
          isOpen={isFinalizeOpen}
          onClose={() => {
            setIsFinalizeOpen(false);
            setFinalizeRecord(null);
          }}
          record={finalizeRecord}
          onFinalize={executeFinalize}
        />

        {/* Process Settlement Drawer */}
        <FnFDetailsDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSaveSettlement={handleSaveSettlement}
          onFinalizeSettlement={handleFinalizeSettlement}
          onDisburse={handleDisburse}
        />

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </LayoutComponent>
  );
}

