import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Info,
  Search,
  X,
  XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import { workLocationService } from '../../services/workLocationService';
import leaveService from '../../services/leaveService';
import { leaveTypeOptions } from '../../data/leaveTypes';
import {
  REQUEST_CATEGORIES,
  deleteHubRequest,
  getStoredHubRequests,
  updateHubRequestStatus
} from '../../data/requestHubData';
import styles from './HRRequestCategory.module.css';

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected'];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const CATEGORY_TYPE_CONFIG = {
  leaves: {
    label: 'Leave Type',
    allLabel: 'All Leaves',
    defaults: leaveTypeOptions
  },
  reimbursement: {
    label: 'Expense Type',
    allLabel: 'All Expense Types',
    defaults: ['Travel & Conveyance', 'Medical', 'Food & Refreshment', 'Site Operations']
  },
  'letter-request': {
    label: 'Letter Type',
    allLabel: 'All Letter Types',
    defaults: ['Salary Certificate', 'Bonafide Certificate', 'Experience Letter', 'NOC']
  }
};

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

export default function HRRequestCategory() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isUserPanel = location.pathname.startsWith('/user');
  const requestsHubPath = isUserPanel
    ? '/user/hr-management/requests'
    : '/admin/hr-management/requests';

  const currentUser = authService.getCurrentUser() || {};
  const adminName = currentUser?.name || currentUser?.employeeName || 'RR Security Administrator';
  const { activeCompany } = useCompany();
  const compId = activeCompany?.id || activeCompany?._id || currentUser?.companyId || null;

  const category = useMemo(
    () => REQUEST_CATEGORIES.find((cat) => cat.id === categoryId) || null,
    [categoryId]
  );

  const [allRequests, setAllRequests] = useState(() => getStoredHubRequests());
  const [companyLocations, setCompanyLocations] = useState([]);
  const [moduleLeaveTypes, setModuleLeaveTypes] = useState([]);
  const [locationFilter, setLocationFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalRemarks, setModalRemarks] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const syncFromStorage = () => {
      setAllRequests(getStoredHubRequests());
    };
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('novaspark:hub-requests-updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('novaspark:hub-requests-updated', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!compId) return;
    let cancelled = false;
    workLocationService
      .getWorkLocations(compId)
      .then((locs) => {
        if (!cancelled && Array.isArray(locs)) {
          setCompanyLocations(locs.map((l) => l.name || l.locationName).filter(Boolean));
        }
      })
      .catch(() => {});

    if (categoryId === 'leaves' || categoryId === 'leave-encashment') {
      leaveService
        .getLeaveTypes(compId)
        .then((types) => {
          if (!cancelled && Array.isArray(types)) {
            setModuleLeaveTypes(types.map((t) => t.name || t.leaveType).filter(Boolean));
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [compId, categoryId]);

  const categoryRequests = useMemo(
    () => allRequests.filter((req) => req.categoryId === categoryId),
    [allRequests, categoryId]
  );

  const locationOptions = useMemo(() => {
    const set = new Set([
      ...companyLocations,
      ...categoryRequests.map((r) => r.site).filter(Boolean)
    ]);
    return ['All', ...Array.from(set)];
  }, [companyLocations, categoryRequests]);

  const typeConfig = CATEGORY_TYPE_CONFIG[categoryId] || null;

  const typeOptions = useMemo(() => {
    if (!typeConfig) return [];
    const fromModule = categoryId === 'leaves' ? moduleLeaveTypes : [];
    const fromRequests = categoryRequests
      .map(
        (r) =>
          r.details?.['Leave Type'] ||
          r.details?.['Expense Type'] ||
          r.details?.['Letter Type']
      )
      .filter(Boolean);
    const set = new Set([...fromModule, ...typeConfig.defaults, ...fromRequests]);
    return ['All', ...Array.from(set)];
  }, [categoryId, typeConfig, moduleLeaveTypes, categoryRequests]);

  const filteredRequests = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    return categoryRequests.filter((req) => {
      if (locationFilter !== 'All' && req.site !== locationFilter) return false;
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (typeFilter !== 'All') {
        const subType = String(
          req.details?.['Leave Type'] ||
            req.details?.['Expense Type'] ||
            req.details?.['Letter Type'] ||
            req.details?.Item ||
            req.amountOrMetric ||
            ''
        ).toLowerCase();
        const target = typeFilter.toLowerCase();
        if (!subType.includes(target) && !target.includes(subType)) return false;
      }
      if (fromDate && req.submittedDate && req.submittedDate < fromDate) return false;
      if (toDate && req.submittedDate && req.submittedDate > toDate) return false;

      if (!q) return true;
      return (
        String(req.id || '').toLowerCase().includes(q) ||
        String(req.employeeName || '').toLowerCase().includes(q) ||
        String(req.employeeId || '').toLowerCase().includes(q) ||
        String(req.site || '').toLowerCase().includes(q) ||
        String(req.summary || '').toLowerCase().includes(q)
      );
    });
  }, [categoryRequests, locationFilter, typeFilter, statusFilter, fromDate, toDate, appliedSearch]);

  const visibleRequests = useMemo(
    () => filteredRequests.slice(0, pageSize),
    [filteredRequests, pageSize]
  );

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
  };

  const handleDownloadAll = () => {
    if (!filteredRequests.length) {
      showToast('No requests to download.', 'error');
      return;
    }
    const rows = filteredRequests.map((r) => ({
      'Request #': r.id,
      Category: r.categoryLabel,
      'Employee Name': r.employeeName,
      'Employee Code': r.employeeId,
      Location: r.site || '—',
      Summary: r.summary,
      'Metric / Value': r.amountOrMetric || '—',
      Submitted: r.submittedDate,
      Stage: r.stage || '—',
      Status: r.status,
      Remarks: r.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requests');
    XLSX.writeFile(wb, `${categoryId || 'requests'}_requests.xlsx`);
    showToast('Requests downloaded successfully.');
  };

  const handleDownloadSingle = (req) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.setTextColor(74, 35, 68);
    doc.text(`${category?.title || req.categoryLabel} - Request Report`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 25);

    const detailRows = [
      ['Request #', req.id],
      ['Category', req.categoryLabel || category?.title || '—'],
      ['Employee Name', req.employeeName || '—'],
      ['Employee Code', req.employeeId || '—'],
      ['Designation', req.designation || '—'],
      ['Location / Site', req.site || '—'],
      ['Submitted Date', formatDate(req.submittedDate)],
      ['Status', req.status === 'Pending' ? 'Open' : req.status],
      ['Approval Stage', req.stage || '—'],
      ['Summary', req.summary || '—'],
      ['Reason / Comments', req.reason || '—']
    ];

    if (req.details) {
      Object.entries(req.details).forEach(([k, v]) => {
        detailRows.push([k, String(v ?? '—')]);
      });
    }

    if (req.actionBy) {
      detailRows.push(['Action Taken By', `${req.actionBy}${req.actionAt ? ` (${req.actionAt})` : ''}`]);
    }
    if (req.remarks) {
      detailRows.push(['Admin Remarks', req.remarks]);
    }

    autoTable(doc, {
      startY: 32,
      head: [['Field', 'Value']],
      body: detailRows,
      theme: 'grid',
      headStyles: { fillColor: [107, 29, 69], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9.5, textColor: [30, 41, 59] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } }
    });

    doc.save(`${req.id}_Report.pdf`);
    showToast(`${req.id} report downloaded.`);
  };

  const handleDeleteRequest = (req) => {
    const updated = deleteHubRequest(req.id);
    setAllRequests(updated);
    window.dispatchEvent(new Event('novaspark:hub-requests-updated'));
    if (selectedRequest?.id === req.id) {
      setSelectedRequest(null);
    }
    showToast(`${req.id} deleted.`, 'warning');
  };

  const openDetailModal = (req) => {
    setSelectedRequest(req);
    setModalRemarks(req.remarks || '');
  };

  const handleModalAction = (action) => {
    if (!selectedRequest) return;
    if (action === 'Rejected' && !modalRemarks.trim()) {
      showToast('Please enter comments or remarks before rejecting.', 'error');
      return;
    }

    const updatedList = updateHubRequestStatus(
      selectedRequest.id,
      action,
      modalRemarks.trim() || (action === 'Approved' ? 'Approved by HR / Admin' : ''),
      adminName
    );
    setAllRequests(updatedList);
    window.dispatchEvent(new Event('novaspark:hub-requests-updated'));

    setSelectedRequest(null);
    setModalRemarks('');
    showToast(
      action === 'Approved'
        ? `${selectedRequest.id} approved successfully.`
        : `${selectedRequest.id} rejected.`,
      action === 'Approved' ? 'success' : 'warning'
    );
  };

  const getStatusClass = (status) => {
    if (status === 'Approved') return styles.statusApproved;
    if (status === 'Rejected') return styles.statusRejected;
    if (status === 'Cancelled') return styles.statusCancelled;
    return styles.statusOpen;
  };

  const getSubTypeLabel = (req) =>
    req.details?.['Leave Type'] ||
    req.details?.['Expense Type'] ||
    req.details?.['Letter Type'] ||
    req.details?.Item ||
    req.amountOrMetric ||
    req.categoryLabel;

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span onClick={() => navigate(isUserPanel ? '/user/dashboard' : '/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span>Workforce</span>
          <span className={styles.separator}>/</span>
          <span onClick={() => navigate(requestsHubPath)}>Requests</span>
          <span className={styles.separator}>/</span>
          <strong>{category ? category.title : 'Requests'}</strong>
        </nav>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.pageTitle}>
              {category ? `${category.title} Requests` : 'Requests'}
            </h1>
            <p className={styles.pageSubtitle}>
              {category
                ? category.description
                : 'Review and take action on employee requests.'}
            </p>
          </div>

          <button
            type="button"
            className={styles.backToRequestsBtn}
            onClick={() => navigate(requestsHubPath)}
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
            <span>Back to Requests</span>
          </button>
        </div>

        {/* Row 1: Filter Dropdowns + Date Range */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label>Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'All' ? 'All Locations' : loc}
                </option>
              ))}
            </select>
          </div>

          {typeConfig && (
            <div className={styles.filterGroup}>
              <label>{typeConfig.label}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? typeConfig.allLabel : t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st === 'Pending' ? 'Open / Pending' : st}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.dateLabel}>
              <span>Date Range</span>
              <Info size={13} className={styles.infoIcon} />
            </label>
            <div className={styles.dateRangeInputs}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.dateInput}
                aria-label="From Date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.dateInput}
                aria-label="To Date"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Search + Download + Records Count */}
        <div className={styles.toolbarRow}>
          <form className={styles.searchGroup} onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value) setAppliedSearch('');
              }}
              placeholder="Search name or code"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>

          <div className={styles.rightControls}>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadAll}
            >
              <FileSpreadsheet size={14} />
              <span>Download</span>
            </button>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={styles.recordsSelect}
              aria-label="Records per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} records
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Cards List */}
        <div className={styles.cardsList}>
          {visibleRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <Filter size={32} className={styles.emptyIcon} />
              <h3>No requests found</h3>
              <p>
                {appliedSearch || statusFilter !== 'All' || locationFilter !== 'All'
                  ? 'Try adjusting your filters or search query.'
                  : `There are currently no requests under ${category?.title || 'this category'}.`}
              </p>
            </div>
          ) : (
            visibleRequests.map((req) => (
              <div key={req.id} className={styles.requestCard}>
                {/* Col 1: Request # + Download icon */}
                <div className={styles.colRequestNo}>
                  <span className={styles.colLabel}>Request #</span>
                  <strong className={styles.reqNumber}>{req.id}</strong>
                  <button
                    type="button"
                    className={styles.iconDownloadBtn}
                    onClick={() => handleDownloadSingle(req)}
                    title="Download Report"
                    aria-label="Download Report"
                  >
                    <Download size={14} />
                  </button>
                </div>

                {/* Col 2: Category / Date / Sub-type */}
                <div className={styles.colTypeDate}>
                  <span className={styles.colLabel}>{category?.shortTitle || 'Request'}</span>
                  <strong className={styles.dateHighlight}>{formatDate(req.submittedDate)}</strong>
                  <span className={styles.subTypeText}>{getSubTypeLabel(req)}</span>
                </div>

                {/* Col 3: Requested By */}
                <div className={styles.colRequestedBy}>
                  <span className={styles.colLabel}>Requested By</span>
                  <strong className={styles.empName}>
                    {req.employeeName} ({req.employeeId})
                  </strong>
                  <span className={styles.reasonText}>{req.reason || req.summary}</span>
                  <span className={styles.timestampText}>{formatDate(req.submittedDate)}</span>
                </div>

                {/* Col 4: Approval Status / Stage */}
                <div className={styles.colApprovalStatus}>
                  <span className={styles.colLabel}>Approval Status</span>
                  <span className={styles.stageText}>
                    {req.stage || '(No Approver Assigned)'}
                  </span>
                </div>

                {/* Col 5: Status Pill + Action Taken By */}
                <div className={styles.colStatus}>
                  <span className={`${styles.statusPill} ${getStatusClass(req.status)}`}>
                    {req.status === 'Pending' ? 'Open' : req.status}
                  </span>
                  {req.actionBy && (
                    <div className={styles.actionMeta}>
                      <span>Action taken by {req.actionBy}</span>
                      {req.actionAt && <span>{req.actionAt}</span>}
                    </div>
                  )}
                </div>

                {/* Col 6: Action Buttons */}
                <div className={styles.colActions}>
                  <button
                    type="button"
                    className={styles.viewDetailsBtn}
                    onClick={() => openDetailModal(req)}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteRequest(req)}
                  >
                    <XCircle size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Take Action / View Details Modal */}
        {selectedRequest &&
          createPortal(
            <div className={styles.modalBackdrop} onClick={() => setSelectedRequest(null)}>
              <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Take Action"
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>Take Action</h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setSelectedRequest(null)}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {/* Category & Submitted By/On */}
                  <div className={styles.submittedMeta}>
                    <div className={styles.modalCategoryTitle}>
                      {category?.shortTitle || selectedRequest.categoryLabel}
                    </div>
                    <div className={styles.submittedLine}>
                      Submitted by:{' '}
                      <strong>
                        {selectedRequest.employeeName} ({selectedRequest.employeeId})
                      </strong>
                      {selectedRequest.designation ? ` - ${selectedRequest.designation}` : ''}
                    </div>
                    <div className={styles.submittedDateLine}>
                      Submitted on: {formatDate(selectedRequest.submittedDate)}
                    </div>
                  </div>

                  {/* Request Details Table */}
                  <div className={styles.modalSection}>
                    <h4 className={styles.sectionLabel}>Request Details</h4>
                    <div className={styles.detailsTableWrap}>
                      <table className={styles.detailsTable}>
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.details &&
                            Object.entries(selectedRequest.details).map(([key, val]) => (
                              <tr key={key}>
                                <td>{key}</td>
                                <td>{val}</td>
                              </tr>
                            ))}
                          <tr>
                            <td>Comments</td>
                            <td>{selectedRequest.reason || selectedRequest.summary || '—'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Approval Workflow */}
                  <div className={styles.modalSection}>
                    <h4 className={styles.sectionLabel}>Approval Workflow</h4>
                    <div className={styles.workflowBox}>
                      {selectedRequest.status === 'Pending' ? (
                        <span>{selectedRequest.stage || 'No approver assigned.'}</span>
                      ) : (
                        <span>
                          {selectedRequest.status}
                          {selectedRequest.actionBy ? ` • Action taken by ${selectedRequest.actionBy}` : ''}
                          {selectedRequest.actionAt ? ` (${selectedRequest.actionAt})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Take Action Box */}
                  {selectedRequest.status === 'Pending' ? (
                    <div className={styles.takeActionBox}>
                      <h4 className={styles.takeActionHeading}>Take Action</h4>
                      <label htmlFor="take-action-comments" className={styles.commentsLabel}>
                        Comments
                      </label>
                      <input
                        id="take-action-comments"
                        type="text"
                        value={modalRemarks}
                        onChange={(e) => setModalRemarks(e.target.value)}
                        placeholder="Enter comments or remarks..."
                        className={styles.commentsInput}
                      />
                      <div className={styles.takeActionButtons}>
                        <button
                          type="button"
                          className={styles.cancelTextBtn}
                          onClick={() => setSelectedRequest(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.modalRejectBtn}
                          onClick={() => handleModalAction('Rejected')}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          className={styles.modalApproveBtn}
                          onClick={() => handleModalAction('Approved')}
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.completedActionFooter}>
                      {selectedRequest.remarks && (
                        <div className={styles.savedRemarks}>
                          <strong>Remarks:</strong> {selectedRequest.remarks}
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => setSelectedRequest(null)}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}
      </div>
    </AdminLayout>
  );
}
