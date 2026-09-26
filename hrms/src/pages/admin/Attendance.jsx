import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, Clock, AlertCircle, FileSpreadsheet, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import attendanceService from '../../services/attendanceService';
import styles from './Attendance.module.css';

const INITIAL_FILTERS = {
  search: '',
  companyId: '',
  site: '',
  department: '',
  status: ''
};

const sanitizeRecords = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((r) => {
    let checkIn = r.checkIn;
    let checkOut = r.checkOut;
    if (typeof checkIn === 'string' && checkIn.includes('NaN')) {
      checkIn = checkIn.replace(/:NaN/g, ':00');
    }
    if (typeof checkOut === 'string' && checkOut.includes('NaN')) {
      checkOut = checkOut.replace(/:NaN/g, ':00');
    }
    return {
      ...r,
      id: r.id || r._id || `att_${Math.random()}`,
      checkIn,
      checkOut
    };
  });
};

function Attendance() {
  const { activeCompany } = useCompany();
  const [searchParams] = useSearchParams();
  const compId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';
  const ATTENDANCE_STORAGE_KEY = `novaspark_attendance_${compId}`;
  const CORRECTION_STORAGE_KEY = `novaspark_corrections_${compId}`;

  // --- Dynamic State Loaded directly from MongoDB Atlas ---
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_attendance_${compId}`);
      return saved ? sanitizeRecords(JSON.parse(saved)) : [];
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

  const [isLoading, setIsLoading] = useState(false);

  const fetchRecords = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await attendanceService.getAttendanceRecords(compId);
      if (Array.isArray(data) && data.length > 0) {
        setRecords(sanitizeRecords(data));
      }
      const corrs = await attendanceService.getCorrectionRequests(compId);
      if (Array.isArray(corrs) && corrs.length > 0) {
        setCorrections(corrs);
      }
    } catch (err) {
      console.warn('Backend attendance load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [compId]);

  // Load from MongoDB on component mount and company switch
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Sync to local cache
  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    }
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
  const handleCorrectionSubmit = async (formData) => {
    const { attendanceId, checkIn, checkOut, status, reason } = formData;
    const target = records.find((r) => r.id === attendanceId || r._id === attendanceId);

    const newCorr = {
      attendanceId: target?.id || target?._id || attendanceId,
      employeeId: target?.employeeId || 'EMP000',
      employeeName: target?.employeeName || 'Unknown',
      initials: target?.initials || 'UN',
      clientName: target?.clientName || target?.companyName || 'General',
      companyName: target?.companyName || target?.clientName || 'General',
      site: target?.site || 'Main Site',
      date: target?.date || selectedDate,
      originalCheckIn: target?.checkIn || null,
      originalCheckOut: target?.checkOut || null,
      originalStatus: target?.status || 'present',
      requestedCheckIn: checkIn || null,
      requestedCheckOut: checkOut || null,
      reason,
      status: 'pendingCorrection'
    };

    try {
      await attendanceService.submitCorrectionRequest(compId, newCorr);
      fetchRecords();
      setEditModalRecord(null);
      showToast('Correction request submitted and saved to database.');
    } catch (err) {
      setCorrections((prev) => [
        { ...newCorr, id: `CORR${String(Date.now()).slice(-4)}`, submittedAt: new Date().toISOString() },
        ...prev
      ]);
      setEditModalRecord(null);
      showToast('Correction request submitted.');
    }
  };

  const handleApproveCorrection = async (corrId) => {
    try {
      await attendanceService.reviewCorrectionRequest(compId, corrId, 'approve');
      fetchRecords();
      setReviewRequest(null);
      showToast('Correction approved and attendance updated in database.');
    } catch (err) {
      // local fallback
      const req = corrections.find((c) => c.id === corrId || c._id === corrId);
      if (req) {
        setRecords((prev) =>
          prev.map((r) => {
            if (r.id === req.attendanceId || r.employeeId === req.employeeId) {
              return {
                ...r,
                checkIn: req.requestedCheckIn,
                checkOut: req.requestedCheckOut,
                status: 'present',
                lateMinutes: 0,
                earlyOutMinutes: 0
              };
            }
            return r;
          })
        );
        setCorrections((prev) => prev.filter((c) => c.id !== corrId && c._id !== corrId));
      }
      setReviewRequest(null);
      showToast('Correction approved.');
    }
  };

  const handleRejectCorrection = async (corrId, reason) => {
    try {
      await attendanceService.reviewCorrectionRequest(compId, corrId, 'reject', reason);
      fetchRecords();
      setReviewRequest(null);
      showToast('Correction request rejected.', 'danger');
    } catch (err) {
      setCorrections((prev) => prev.filter((c) => c.id !== corrId && c._id !== corrId));
      setReviewRequest(null);
      showToast('Correction request rejected.', 'danger');
    }
  };

  // --- Export Handler ---
  const handleExport = (exportConfig) => {
    setShowExportModal(false);
    const { fromDate, toDate, companyId, site, department, status, format } = exportConfig;

    const dataToExport = records.filter((r) => {
      if (fromDate && r.date && r.date < fromDate) return false;
      if (toDate && r.date && r.date > toDate) return false;
      if (companyId && r.companyName !== companyId && r.companyId !== companyId && r.clientName !== companyId) return false;
      if (site && r.site !== site) return false;
      if (department && r.department !== department) return false;
      if (status && r.status !== status) return false;
      return true;
    }).map((r) => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Client Name': r.companyName || r.clientName || 'General',
      'Site': r.site || 'Main Site',
      'Department': r.department || 'Security',
      'Date': r.date,
      'Check In': r.checkIn || '—',
      'Check Out': r.checkOut || '—',
      'Working Hours': r.workingHours || '—',
      'Status': r.status || 'present'
    }));

    if (dataToExport.length === 0) {
      showToast('No records match the selected export filters.', 'danger');
      return;
    }

    if (format === 'pdf') {
      const printWindow = window.open('', '_blank', 'width=1000,height=900');
      if (printWindow) {
        const companyName = activeCompany?.name || 'RR Security';
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Attendance Report - ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 20px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px 10px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; color: #334155; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    .tag-present { background: #dcfce7; color: #15803d; }
    .tag-absent { background: #fee2e2; color: #b91c1c; }
    .tag-late { background: #fef3c7; color: #b45309; }
    .tag-halfDay { background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${companyName}</div>
      <div class="meta">Attendance Report | Date Range: ${fromDate || 'All'} to ${toDate || 'All'} | Total Records: ${dataToExport.length}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Emp ID</th>
        <th>Name</th>
        <th>Client</th>
        <th>Site</th>
        <th>Dept</th>
        <th>Date</th>
        <th>Check In</th>
        <th>Check Out</th>
        <th>Hours</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${dataToExport.map((row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${row['Employee ID']}</strong></td>
          <td>${row['Employee Name']}</td>
          <td>${row['Client Name']}</td>
          <td>${row['Site']}</td>
          <td>${row['Department']}</td>
          <td>${row['Date']}</td>
          <td>${row['Check In']}</td>
          <td>${row['Check Out']}</td>
          <td>${row['Working Hours']}</td>
          <td><span class="tag tag-${row['Status']}">${row['Status']}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
        `;
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        showToast(`✓ Generated printable PDF report for ${dataToExport.length} records.`);
      }
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const fileName = `Attendance_Report_${fromDate || 'start'}_to_${toDate || 'end'}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    XLSX.writeFile(workbook, fileName);

    showToast(`✓ Exported ${dataToExport.length} records to ${fileName}`);
  };

  const pendingCount = corrections.length;

  const handleImportRecords = async (importPayload) => {
    const { month, date, records: newRecords } = importPayload;
    if (!newRecords || newRecords.length === 0) return;

    try {
      // Save directly to MongoDB Atlas database
      const res = await attendanceService.bulkImportAttendance(compId, importPayload);
      const saved = res.records || newRecords;

      setRecords((prev) => {
        const newKeys = new Set(saved.map((r) => `${r.employeeId}_${r.date}`));
        const existingFiltered = prev.filter((r) => !newKeys.has(`${r.employeeId}_${r.date}`));
        return [...saved, ...existingFiltered];
      });

      setShowImportModal(false);
      showToast(`✓ Successfully imported & saved ${saved.length} attendance records to database!`);
      if (date) {
        setSelectedDate(date);
        setCurrentPage(1);
      }
    } catch (err) {
      // Local fallback
      setRecords((prev) => {
        const newKeys = new Set(newRecords.map((r) => `${r.employeeId}_${r.date}`));
        const existingFiltered = prev.filter((r) => !newKeys.has(`${r.employeeId}_${r.date}`));
        return [...newRecords, ...existingFiltered];
      });

      setShowImportModal(false);
      showToast(`Imported locally (${err.message})`, 'danger');
      if (date) {
        setSelectedDate(date);
        setCurrentPage(1);
      }
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
            records={records}
            activeCompanyName={activeCompany?.name || 'RR Security'}
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
