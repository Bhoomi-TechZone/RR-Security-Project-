import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, Clock, AlertCircle, FileSpreadsheet, UploadCloud } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import AttendanceDateSelector from '../../components/attendance/AttendanceDateSelector';
import AttendanceSummaryCards from '../../components/attendance/AttendanceSummaryCards';
import AttendanceDistribution from '../../components/attendance/AttendanceDistribution';
import AttendanceFilters from '../../components/attendance/AttendanceFilters';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import AttendanceDetailsDrawer from '../../components/attendance/AttendanceDetailsDrawer';
import AttendanceCorrectionModal from '../../components/attendance/AttendanceCorrectionModal';
import CorrectionRequests from '../../components/attendance/CorrectionRequests';
import CorrectionReviewDrawer from '../../components/attendance/CorrectionReviewDrawer';
import AttendanceExportModal from '../../components/attendance/AttendanceExportModal';
import AttendanceImportModal from '../../components/attendance/AttendanceImportModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import styles from './Attendance.module.css';

const INITIAL_FILTERS = {
  search: '',
  companyId: '',
  site: '',
  department: '',
  status: ''
};

function Attendance() {
  const { activeCompany } = useCompany();
  const [searchParams] = useSearchParams();
  const compId = activeCompany?.companyId || activeCompany?.id || 'comp_rr_security';
  const ATTENDANCE_STORAGE_KEY = `novaspark_attendance_${compId}`;
  const CORRECTION_STORAGE_KEY = `novaspark_corrections_${compId}`;

  // --- Dynamic State Isolated per Active Company Profile ---
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_attendance_${compId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [corrections, setCorrections] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_corrections_${compId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reload state on active company profile switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`novaspark_attendance_${compId}`);
      setRecords(saved ? JSON.parse(saved) : []);
    } catch {
      setRecords([]);
    }
    try {
      const savedCorr = localStorage.getItem(`novaspark_corrections_${compId}`);
      setCorrections(savedCorr ? JSON.parse(savedCorr) : []);
    } catch {
      setCorrections([]);
    }
  }, [compId]);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
  }, [records, ATTENDANCE_STORAGE_KEY]);

  useEffect(() => {
    localStorage.setItem(CORRECTION_STORAGE_KEY, JSON.stringify(corrections));
  }, [corrections, CORRECTION_STORAGE_KEY]);

  // --- Active Date & Tab ---
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'corrections' ? 'corrections' : 'daily');

  // --- Filters & Pagination ---
  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    status: searchParams.get('status') || ''
  }));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sync URL search params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'corrections') {
      setActiveTab('corrections');
    } else {
      setActiveTab('daily');
    }

    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    } else if (!tab) {
      setFilters(prev => ({ ...prev, status: '' }));
    }
  }, [searchParams]);

  // --- Modals & Drawers ---
  const [viewDrawerRecord, setViewDrawerRecord] = useState(null);
  const [editModalRecord, setEditModalRecord] = useState(null);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Reset page when filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  // Filtered records for selected date and active filters
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date filter (matches selected date if record specifies date)
      if (selectedDate && r.date && r.date !== selectedDate) return false;

      // Search matches name or ID
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = (r.employeeName || '').toLowerCase().includes(query);
        const matchesId = (r.employeeId || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }
      // Company
      if (filters.companyId && r.companyName !== filters.companyId && r.companyId !== filters.companyId) return false;
      // Site
      if (filters.site && r.site !== filters.site) return false;
      // Department
      if (filters.department && r.department !== filters.department) return false;
      // Status
      if (filters.status && r.status !== filters.status) return false;

      return true;
    });
  }, [records, filters, selectedDate]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // --- Correction Handlers ---
  const handleCorrectionSubmit = (formData) => {
    const { attendanceId, checkIn, checkOut, status, reason } = formData;
    const target = records.find((r) => r.id === attendanceId);

    // Update attendance record status
    setRecords((prev) =>
      prev.map((r) =>
        r.id === attendanceId
          ? { ...r, status: 'pendingCorrection' }
          : r
      )
    );

    // Add to correction requests
    const newCorr = {
      id: `CORR${String(Date.now()).slice(-4)}`,
      attendanceId,
      employeeId: target?.employeeId || 'EMP000',
      employeeName: target?.employeeName || 'Unknown',
      initials: target?.initials || 'UN',
      companyName: target?.companyName || 'General',
      site: target?.site || 'Main Site',
      date: target?.date || selectedDate,
      originalCheckIn: target?.checkIn || null,
      originalCheckOut: target?.checkOut || null,
      originalStatus: target?.status || 'present',
      requestedCheckIn: checkIn || null,
      requestedCheckOut: checkOut || null,
      reason,
      submittedAt: new Date().toISOString(),
      submittedBy: target?.employeeName || 'Admin',
      status: 'pendingCorrection'
    };

    setCorrections((prev) => [newCorr, ...prev]);
    setEditModalRecord(null);
    showToast('Correction request submitted and marked as Pending Correction.');
  };

  const handleApproveCorrection = (corrId) => {
    const req = corrections.find((c) => c.id === corrId);
    if (!req) return;

    // Update attendance record
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === req.attendanceId || r.employeeId === req.employeeId) {
          // Calculate approximate hours if both in & out provided
          let workingHours = r.workingHours;
          if (req.requestedCheckIn && req.requestedCheckOut) {
            const [inH, inM] = req.requestedCheckIn.split(':').map(Number);
            const [outH, outM] = req.requestedCheckOut.split(':').map(Number);
            const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
            if (totalMins > 0) {
              const h = Math.floor(totalMins / 60);
              const m = totalMins % 60;
              workingHours = `${h}h ${String(m).padStart(2, '0')}m`;
            }
          }

          return {
            ...r,
            checkIn: req.requestedCheckIn,
            checkOut: req.requestedCheckOut,
            workingHours,
            status: 'present',
            lateMinutes: 0,
            earlyOutMinutes: 0
          };
        }
        return r;
      })
    );

    // Remove from pending correction requests
    setCorrections((prev) => prev.filter((c) => c.id !== corrId));
    setReviewRequest(null);
    showToast(`Correction approved for ${req.employeeName}. Attendance updated.`);
  };

  const handleRejectCorrection = (corrId, reason) => {
    const req = corrections.find((c) => c.id === corrId);
    if (!req) return;

    // Revert status to original
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === req.attendanceId || r.employeeId === req.employeeId) {
          return { ...r, status: req.originalStatus || 'present' };
        }
        return r;
      })
    );

    // Remove from pending
    setCorrections((prev) => prev.filter((c) => c.id !== corrId));
    setReviewRequest(null);
    showToast(`Correction request rejected for ${req.employeeName}.`, 'danger');
  };

  // --- Export Handler ---
  const handleExport = (exportConfig) => {
    setShowExportModal(false);
    showToast(`Attendance report (${exportConfig.format.toUpperCase()}) exported successfully!`);
  };

  const pendingCount = corrections.length;

  const handleImportRecords = (importPayload) => {
    const { month, date, records: newRecords } = importPayload;
    if (!newRecords || newRecords.length === 0) return;

    setRecords((prev) => [...newRecords, ...prev]);
    setShowImportModal(false);
    showToast(`✓ Successfully imported ${newRecords.length} attendance records for ${month}.`);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumb}>
              <span>Home</span> / <span>Workforce</span> / <span className={styles.activeBreadcrumb}>Attendance</span>
            </div>
            <h1 className={styles.pageTitle}>
              {activeTab === 'corrections' ? 'Correction Requests' : 'Attendance Management'}
            </h1>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.importBtn}
              onClick={() => setShowImportModal(true)}
            >
              <UploadCloud size={16} />
              <span>Import Records</span>
            </button>
            <button
              className={styles.exportBtn}
              onClick={() => setShowExportModal(true)}
            >
              <Download size={16} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DAILY ATTENDANCE */}
        {activeTab === 'daily' && (
          <div className={styles.tabContent}>
            {/* Top Controls: Date Selector */}
            <div className={styles.dateSelectorRow}>
              <AttendanceDateSelector
                date={selectedDate}
                onChange={(newDate) => {
                  setSelectedDate(newDate);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Summary Cards */}
            <AttendanceSummaryCards records={records.filter(r => !selectedDate || !r.date || r.date === selectedDate)} />

            {/* Visual Distribution Chart */}
            <AttendanceDistribution records={records.filter(r => !selectedDate || !r.date || r.date === selectedDate)} />

            {/* Filter Bar */}
            <AttendanceFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              records={records}
            />

            {/* Attendance Table */}
            <AttendanceTable
              records={paginatedRecords}
              onView={(rec) => setViewDrawerRecord(rec)}
              onEdit={(rec) => setEditModalRecord(rec)}
              onReview={(rec) => {
                const matchedReq = corrections.find((c) => c.attendanceId === rec.id || c.employeeId === rec.employeeId);
                if (matchedReq) {
                  setReviewRequest(matchedReq);
                } else {
                  setEditModalRecord(rec);
                }
              }}
            />

            {/* Pagination */}
            {filteredRecords.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredRecords.length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                label="attendance records"
              />
            )}
          </div>
        )}

        {/* TAB 2: CORRECTION REQUESTS */}
        {activeTab === 'corrections' && (
          <div className={styles.tabContent}>
            <div className={styles.correctionsHeader}>
              <div>
                <h2 className={styles.sectionHeading}>Pending Attendance Corrections</h2>
                <p className={styles.sectionSub}>
                  Review and approve or reject employee check-in / check-out correction requests.
                </p>
              </div>
            </div>

            <CorrectionRequests
              requests={corrections}
              onReview={(req) => setReviewRequest(req)}
            />
          </div>
        )}

        {/* --- Drawers & Modals --- */}
        {viewDrawerRecord && (
          <AttendanceDetailsDrawer
            record={viewDrawerRecord}
            onClose={() => setViewDrawerRecord(null)}
            onEdit={(rec) => setEditModalRecord(rec)}
          />
        )}

        {editModalRecord && (
          <AttendanceCorrectionModal
            record={editModalRecord}
            onClose={() => setEditModalRecord(null)}
            onSubmit={handleCorrectionSubmit}
          />
        )}

        {reviewRequest && (
          <CorrectionReviewDrawer
            request={reviewRequest}
            onClose={() => setReviewRequest(null)}
            onApprove={handleApproveCorrection}
            onReject={handleRejectCorrection}
          />
        )}

        {showExportModal && (
          <AttendanceExportModal
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
          />
        )}

        {showImportModal && (
          <AttendanceImportModal
            onClose={() => setShowImportModal(false)}
            onImport={handleImportRecords}
            activeCompanyName={activeCompany?.name || 'RR Security'}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default Attendance;
