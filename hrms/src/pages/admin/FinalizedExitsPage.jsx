import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  RotateCcw,
  ExternalLink,
  Users,
  CheckCircle2,
  UserX,
  X,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import separationService from '../../services/separationService';
import {
  SEPARATION_REASONS,
  getStoredFnF,
  saveStoredFnF
} from '../../data/fnfData';
import styles from './FinalizedExitsPage.module.css';

// Format ISO YYYY-MM-DD into DD-MON-YYYY (e.g. 01-JAN-2026)
function formatUpperDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.slice(0, 10);
    const d = new Date(`${clean}T12:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
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
    return { planned, served: Number(rec.noticePeriodServedDays) };
  }
  if (rec.resignationDate && rec.lastWorkingDay) {
    const d1 = new Date(`${rec.resignationDate.slice(0, 10)}T00:00:00`);
    const d2 = new Date(`${rec.lastWorkingDay.slice(0, 10)}T00:00:00`);
    const diff = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    return { planned, served: diff };
  }
  return { planned, served: planned };
}

export default function FinalizedExitsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompanyId } = useCompany();
  const isAdmin = !location.pathname.startsWith('/user');
  const basePath = isAdmin ? '/admin/payroll' : '/user/payroll';
  const LayoutComponent = isAdmin ? AdminLayout : UserLayout;

  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type });

  // Filter inputs
  const [exitDateFrom, setExitDateFrom] = useState('');
  const [exitDateTo, setExitDateTo] = useState('');
  const [exitReason, setExitReason] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    from: '',
    to: '',
    reason: 'All',
    query: ''
  });

  const [showRehired, setShowRehired] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Deactivate Confirm Modal
  const [confirmAction, setConfirmAction] = useState(null);

  // Rehire Employee Modal
  const [rehireTarget, setRehireTarget] = useState(null);
  const [rehireDate, setRehireDate] = useState('');
  const [rehireError, setRehireError] = useState('');

  const loadFinalizedExits = React.useCallback(async () => {
    if (!activeCompanyId) return;
    try {
      const res = await separationService.getSeparations({ status: 'finalized' }, activeCompanyId);
      if (res?.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(getStoredFnF());
      }
    } catch (err) {
      console.warn('Failed to load finalized exits from backend:', err);
      setRecords(getStoredFnF());
    }
  }, [activeCompanyId]);

  useEffect(() => {
    loadFinalizedExits();
  }, [loadFinalizedExits]);

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

  // Show only Finalized exits ('Settled / Disbursed')
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (rec.settlementStatus !== 'Settled / Disbursed') return false;
      if (!showRehired && rec.isRehired) return false;

      if (appliedFilters.reason && appliedFilters.reason !== 'All') {
        if ((rec.separationReason || '') !== appliedFilters.reason) return false;
      }

      const exitStr = (rec.lastWorkingDay || rec.resignationDate || '').slice(0, 10);
      if (appliedFilters.from && exitStr && exitStr < appliedFilters.from) return false;
      if (appliedFilters.to && exitStr && exitStr > appliedFilters.to) return false;

      const q = appliedFilters.query;
      if (q) {
        const name = (rec.employeeName || '').toLowerCase();
        const code = (rec.employeeCode || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }

      return true;
    });
  }, [records, showRehired, appliedFilters]);

  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, safePage, pageSize]);

  // Execute Re-hire with new Date of Joining
  const executeRehire = async () => {
    if (!rehireTarget) return;
    if (!rehireDate) {
      setRehireError('Please select a new Date of Joining.');
      return;
    }

    const rec = rehireTarget;
    const targetId = rec._id || rec.id;
    try {
      await separationService.rehireEmployee(targetId, rehireDate, activeCompanyId);
    } catch (_) { }

    try {
      if (rec.employeeId && !String(rec.employeeId).startsWith('emp-')) {
        await employeeService.updateEmployee(activeCompanyId, rec.employeeId, {
          employeeStatus: 'Active',
          status: 'Active',
          joiningDate: rehireDate,
          exitDateReason: null
        });
      }
    } catch (_) { }

    const updatedList = records.map((item) =>
      (item._id || item.id) === targetId
        ? {
            ...item,
            isRehired: true,
            rehiredDate: rehireDate,
            dateOfJoining: rehireDate,
            isDeactivated: false
          }
        : item
    );
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setRehireTarget(null);
    setRehireDate('');
    setRehireError('');
    notify(
      `${rec.employeeName} (${rec.employeeCode}) rehired with joining date ${formatUpperDate(rehireDate)}.`,
      'success'
    );
  };

  // Execute Deactivate
  const executeDeactivate = async (rec) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (rec.employeeId && !String(rec.employeeId).startsWith('emp-')) {
        await employeeService.updateEmployee(activeCompanyId, rec.employeeId, {
          employeeStatus: 'Inactive'
        });
      }
    } catch (_) {
      // Fallback to local state
    }

    const updatedList = records.map((item) =>
      item.id === rec.id
        ? {
            ...item,
            isDeactivated: true,
            deactivatedDate: today
          }
        : item
    );
    setRecords(updatedList);
    saveStoredFnF(updatedList);
    setConfirmAction(null);
    notify(`Account deactivated for ${rec.employeeName} (${rec.employeeCode}).`, 'info');
  };

  return (
    <LayoutComponent>
      <div className={styles.container}>
        {/* Breadcrumb matching FnFInitiatePage & PendingExitsPage */}
        <div className={styles.breadcrumb}>
          <Link to={isAdmin ? '/admin/dashboard' : '/user/dashboard'}>Dashboard</Link>
          <span>/</span>
          <Link to={`${basePath}?tab=fnf`}>Payroll</Link>
          <span>/</span>
          <Link to={`${basePath}?tab=fnf`}>Separation</Link>
          <span>/</span>
          <strong>Finalized Exits</strong>
        </div>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Finalized Exits</h1>
            <p className={styles.subtitle}>View ex-employee records.</p>
          </div>

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
                checked={showRehired}
                onChange={(e) => {
                  setShowRehired(e.target.checked);
                  setCurrentPage(1);
                }}
              />
              <span>Show Rehired</span>
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
                  <th>EMPLOYMENT TIMELINE</th>
                  <th>NOTICE PERIOD</th>
                  <th>EXIT DETAILS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      <Users size={34} color="#94a3b8" />
                      <div className={styles.emptyTitle}>No Finalized Exits Found</div>
                      <p className={styles.emptyDesc}>
                        No finalized ex-employee records match your current filter selection.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec) => {
                    const { planned, served } = computeNoticeDays(rec);
                    const isAligned = served >= planned;

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
                              <span className={styles.refId}>
                                #{rec.settlementId || rec.id}
                              </span>
                              <span className={styles.empName}>{rec.employeeName}</span>
                              <span className={styles.empMeta}>
                                {rec.employeeCode} • {rec.designation || 'Staff Member'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* EMPLOYMENT TIMELINE */}
                        <td>
                          <div className={styles.kvStack}>
                            <div className={styles.kvLine}>
                              <span className={styles.kvKeyNarrow}>DOJ</span>
                              <span className={styles.kvVal}>{formatUpperDate(rec.dateOfJoining)}</span>
                            </div>
                            <div className={styles.kvLine}>
                              <span className={styles.kvKeyNarrow}>DOR</span>
                              <span className={styles.kvVal}>{formatUpperDate(rec.resignationDate)}</span>
                            </div>
                            <div className={styles.kvLine}>
                              <span className={styles.kvKeyNarrow}>DOE</span>
                              <span className={styles.kvVal}>{formatUpperDate(rec.lastWorkingDay)}</span>
                            </div>
                          </div>
                        </td>

                        {/* NOTICE PERIOD */}
                        <td>
                          <div className={styles.kvStack}>
                            <div className={styles.kvLine}>
                              <span className={styles.kvKey}>PLANNED</span>
                              <span className={styles.kvVal}>{planned} day(s)</span>
                            </div>
                            <div className={styles.kvLine}>
                              <span className={styles.kvKey}>SERVED</span>
                              <span className={isAligned ? styles.servedAligned : styles.servedShortfall}>
                                {served} day(s)
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* EXIT DETAILS */}
                        <td>
                          <div className={styles.kvStack}>
                            <div className={styles.kvLine}>
                              <span className={styles.kvKey}>Reason</span>
                              <span className={styles.kvVal}>{rec.separationReason || '—'}</span>
                            </div>
                            {rec.remarks && (
                              <div className={styles.kvLine}>
                                <span className={styles.kvKey}>Remarks</span>
                                <span className={styles.remarksVal} title={rec.remarks}>
                                  {rec.remarks}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className={styles.actionsCol}>
                            {!rec.isRehired ? (
                              <button
                                type="button"
                                className={styles.rehireBtn}
                                onClick={() => {
                                  setRehireTarget(rec);
                                  setRehireDate('');
                                  setRehireError('');
                                }}
                                title="Re-hire this ex-employee"
                              >
                                <RotateCcw size={13} />
                                <span>Re-hire</span>
                              </button>
                            ) : (
                              <span className={styles.statusTagRehired}>
                                <CheckCircle2 size={13} />
                                Rehired
                              </span>
                            )}

                            {!rec.isDeactivated ? (
                              <button
                                type="button"
                                className={styles.deactivateBtn}
                                onClick={() => setConfirmAction({ type: 'deactivate', record: rec })}
                                title="Deactivate employee profile & access"
                              >
                                <span>Deactivate</span>
                                <ExternalLink size={12} />
                              </button>
                            ) : (
                              <span className={styles.statusTagDeactivated}>
                                <UserX size={13} />
                                Deactivated
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

        {/* Footer Legend */}
        <div className={styles.legendFooter}>
          <span>
            <strong>DOJ:</strong> Date of Joining
          </span>
          <span>•</span>
          <span>
            <strong>DOR:</strong> Date of Resignation
          </span>
          <span>•</span>
          <span>
            <strong>DOE:</strong> Date of Exit
          </span>
        </div>

        {/* Rehire Employee Modal matching reference */}
        {rehireTarget && (
          <div className={styles.modalBackdrop} onClick={() => setRehireTarget(null)}>
            <div className={styles.rehireModalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.rehireModalHeader}>
                <h3 className={styles.modalTitle}>Rehire Employee</h3>
                <button
                  type="button"
                  className={styles.rehireCloseBtn}
                  onClick={() => setRehireTarget(null)}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.rehireModalBody}>
                <h4 className={styles.rehireSectionTitle}>About Rehiring</h4>

                <p className={styles.rehireInfoText}>
                  Reactivating {rehireTarget.employeeName} ({rehireTarget.employeeCode}) will restore their active staff profile (if deactivated) and assign the new joining date selected below.
                </p>

                <p className={styles.rehireImportantText}>
                  Important: After completing the rehire, remember to review and update the employee&apos;s work posting, policies, and salary structure.
                </p>

                <div className={styles.rehireDateField}>
                  <label className={styles.filterLabel}>Select new Date of Joining</label>
                  <input
                    type="date"
                    className={styles.rehireDateInput}
                    value={rehireDate}
                    onChange={(e) => {
                      setRehireDate(e.target.value);
                      if (rehireError) setRehireError('');
                    }}
                  />
                  {rehireError && (
                    <div className={styles.rehireErrorText}>
                      <AlertCircle size={13} />
                      <span>{rehireError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.rehireModalFooter}>
                <button
                  type="button"
                  className={styles.rehireCancelBtn}
                  onClick={() => setRehireTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.rehireSubmitBtn}
                  onClick={executeRehire}
                >
                  <CheckCircle2 size={15} />
                  <span>Rehire</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Deactivate Modal */}
        {confirmAction && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalCard}>
              <h3 className={styles.modalTitle}>Deactivate Employee Access?</h3>
              <p className={styles.modalText}>
                {`Are you sure you want to deactivate portal access and mark ${confirmAction.record.employeeName} (${confirmAction.record.employeeCode}) as Inactive?`}
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalConfirmBtn}
                  style={{ backgroundColor: '#d97706' }}
                  onClick={() => executeDeactivate(confirmAction.record)}
                >
                  Yes, Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

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

