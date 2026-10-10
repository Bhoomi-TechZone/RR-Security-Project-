import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, Clock, AlertCircle, FileSpreadsheet, UploadCloud, Trash2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/layout/AdminLayout';
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
import { usePermissions } from '../../context/PermissionContext';
import attendanceService from '../../services/attendanceService';
import { clientService } from '../../services/clientService';
import styles from './Attendance.module.css';

function DeleteAttendanceConfirmModal({ isOpen, record, isDeleting, onClose, onConfirm }) {
  if (!isOpen || !record) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1060,
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: 480,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #fee2e2',
            background: '#fff5f5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#991b1b' }}>Delete Attendance Record</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#b91c1c' }}>Permanent removal from database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary, #0f172a)', lineHeight: 1.5 }}>
            Are you sure you want to permanently delete the attendance record for <strong>{record.employeeName}</strong> (<code>{record.employeeId}</code>) on <strong>{record.date}</strong>?
          </p>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div><strong>Client / Site:</strong> {record.companyName || record.clientName} · {record.site}</div>
            <div><strong>Timing:</strong> In: {record.checkIn || '—'} | Out: {record.checkOut || '—'} ({record.workingHours || '—'})</div>
            <div><strong>Current Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{record.status}</span></div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#dc2626',
              background: '#fef2f2',
              padding: '8px 10px',
              borderRadius: 6,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>This action is immediate and permanently removes this record from database.</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 20px',
            borderTop: '1px solid var(--border-light, #f1f5f9)',
            background: 'var(--surface-alt, #f8fafc)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { canAdd, canExport, canApprove } = usePermissions();
  const compId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // --- Dynamic State Loaded directly from MongoDB Atlas ---
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Granular Filter View Mode & Date States ---
  const [searchParams, setSearchParams] = useSearchParams();
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);
  const currentYearStr = String(new Date().getFullYear());

  const urlDate = searchParams.get('date');
  const urlMode = searchParams.get('mode') || 'month';

  const [viewMode, setViewMode] = useState(urlMode);
  const [selectedDate, setSelectedDate] = useState(() => urlDate || todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [activeTab, setActiveTab] = useState(() => (searchParams.get('tab') === 'corrections' ? 'corrections' : 'daily'));

  // --- Filters & Pagination ---
  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    status: searchParams.get('status') || '',
  }));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // --- Modals & Drawers ---
  const [viewDrawerRecord, setViewDrawerRecord] = useState(null);
  const [editModalRecord, setEditModalRecord] = useState(null);
  const [deleteModalRecord, setDeleteModalRecord] = useState(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch Master Clients
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const cls = await clientService.getClients(compId).catch(() => []);
        setClientsList(cls || []);
      } catch (err) {
        console.warn('Error fetching clients master:', err);
      }
    };
    fetchMasters();
  }, [compId]);

  // Fetch Records from Database
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};

      if (viewMode === 'date' && selectedDate) {
        params.date = selectedDate;
      } else if (viewMode === 'month' && selectedMonth) {
        params.month = selectedMonth;
      } else if (viewMode === 'year' && selectedYear) {
        params.year = selectedYear;
      } else if (viewMode === 'range' && fromDate && toDate) {
        params.fromDate = fromDate;
        params.toDate = toDate;
      }

      if (filters.search) params.search = filters.search;
      if (filters.companyId) params.clientName = filters.companyId;
      if (filters.site) params.site = filters.site;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;

      const data = await attendanceService.getAttendanceRecords(compId, params);
      const list = Array.isArray(data) ? data : (data.records || []);
      setRecords(sanitizeRecords(list));

      const corrs = await attendanceService.getCorrectionRequests(compId).catch(() => []);
      if (Array.isArray(corrs)) {
        setCorrections(corrs);
      }
    } catch (err) {
      console.warn('MongoDB attendance load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [compId, viewMode, selectedDate, selectedMonth, selectedYear, fromDate, toDate, filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Date / Mode Change Handlers
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', mode);
      return next;
    });
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newDate) next.set('date', newDate);
      else next.delete('date');
      return next;
    });
  };

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    setCurrentPage(1);
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setCurrentPage(1);
  };

  const handleRangeChange = ({ fromDate: fDate, toDate: tDate }) => {
    setFromDate(fDate);
    setToDate(tDate);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  // Sync URL search params for tabs and dates
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'corrections') {
      setActiveTab('corrections');
    } else {
      setActiveTab('daily');
    }

    const dateParam = searchParams.get('date');
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
    }

    const modeParam = searchParams.get('mode');
    if (modeParam && modeParam !== viewMode) {
      setViewMode(modeParam);
    }
  }, [searchParams]);

  // Filtered records for active view mode and search/dropdown filters
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Granularity Date Filtering
      if (viewMode === 'date' && selectedDate && r.date && r.date !== selectedDate) return false;
      if (viewMode === 'month' && selectedMonth) {
        const matchDate = r.date && r.date.startsWith(selectedMonth);
        const matchMonth = r.month && (r.month === selectedMonth || selectedMonth.toLowerCase().includes(String(r.month).toLowerCase()));
        if (!matchDate && !matchMonth) return false;
      }
      if (viewMode === 'year' && selectedYear) {
        const matchDate = r.date && r.date.startsWith(selectedYear);
        const matchYear = r.year && String(r.year) === String(selectedYear);
        if (!matchDate && !matchYear) return false;
      }
      if (viewMode === 'range') {
        if (fromDate && r.date && r.date < fromDate) return false;
        if (toDate && r.date && r.date > toDate) return false;
      }

      // Search matches name, ID, client
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = (r.employeeName || '').toLowerCase().includes(query);
        const matchesId = (r.employeeId || '').toLowerCase().includes(query);
        const matchesClient = (r.clientName || r.companyName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesClient) return false;
      }

      // Client / Company
      if (filters.companyId && r.companyName !== filters.companyId && r.clientName !== filters.companyId) return false;
      // Site
      if (filters.site && r.site !== filters.site) return false;
      // Department
      if (filters.department && r.department !== filters.department) return false;
      // Status
      if (filters.status) {
        const normStatus = String(r.status || '').toLowerCase().replace(/[-_ ]/g, '');
        const targetStatus = String(filters.status || '').toLowerCase().replace(/[-_ ]/g, '');
        if (normStatus !== targetStatus) return false;
      }

      return true;
    });
  }, [records, filters, viewMode, selectedDate, selectedMonth, selectedYear, fromDate, toDate]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle Delete Record
  const handleDeleteRecord = (record) => {
    setDeleteModalRecord(record);
  };

  const handleConfirmDeleteRecord = async () => {
    if (!deleteModalRecord) return;
    try {
      setIsDeletingRecord(true);
      const recordId = deleteModalRecord._id || deleteModalRecord.id || deleteModalRecord.employeeId;
      await attendanceService.deleteAttendanceRecord(compId, recordId);
      setDeleteModalRecord(null);
      showToast(`✓ Attendance record for ${deleteModalRecord.employeeName || deleteModalRecord.employeeId} (${deleteModalRecord.date}) deleted.`);
      fetchRecords();
    } catch (err) {
      showToast(`Failed to delete attendance: ${err.message}`, 'danger');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Instant Edit Handler
  const handleEditRecordSubmit = async (formData) => {
    try {
      const present = Number(formData.present) || 0;
      const weekOff = Number(formData.weekOff) || 0;
      const holidays = Number(formData.holidays) || 0;
      const cl = Number(formData.cl) || 0;
      const sl = Number(formData.sl) || 0;
      const el = Number(formData.el) || 0;
      const lwp = Number(formData.lwp) || 0;
      const totalPaidDays = formData.totalPaidDays !== undefined 
        ? Number(formData.totalPaidDays) 
        : (present + weekOff + holidays + cl + sl + el);
      const workingDays = formData.workingDays !== undefined
        ? Number(formData.workingDays)
        : totalPaidDays;

      const payload = {
        companyId: compId,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        fatherName: formData.fatherName || '',
        month: formData.month || '',
        year: Number(formData.year) || new Date().getFullYear(),
        present,
        weekOff,
        holidays,
        cl,
        sl,
        el,
        lwp,
        totalPaidDays,
        workingDays,
        clientName: formData.clientName || formData.companyName || 'RR Security',
        companyName: formData.companyName || formData.clientName || 'RR Security',
        site: formData.site || 'Main Site',
        department: formData.department || 'Security',
        date: formData.date || selectedDate,
        checkIn: formData.checkIn || null,
        checkOut: formData.checkOut || null,
        workingHours: `${present} days`,
        status: formData.status || (present > 0 ? 'present' : 'present'),
        lateMinutes: Number(formData.lateMinutes) || 0,
        remarks: formData.remarks || '',
      };

      await attendanceService.saveAttendanceRecord(compId, payload);
      await fetchRecords();
      setEditModalRecord(null);
      showToast(`✓ Attendance updated instantly for ${formData.employeeName || 'employee'}.`);
    } catch (err) {
      showToast(`Failed to update attendance: ${err.message}`, 'danger');
    }
  };

  // Corrections Handler
  const handleApproveCorrection = async (corrId) => {
    try {
      await attendanceService.reviewCorrectionRequest(compId, corrId, 'approve');
      await fetchRecords();
      setReviewRequest(null);
      showToast('✓ Correction approved and attendance record updated successfully.');
    } catch (err) {
      showToast(`Failed to approve correction: ${err.message}`, 'danger');
    }
  };

  const handleRejectCorrection = async (corrId, reason) => {
    try {
      await attendanceService.reviewCorrectionRequest(compId, corrId, 'reject', reason);
      await fetchRecords();
      setReviewRequest(null);
      showToast('Correction request has been rejected.');
    } catch (err) {
      showToast(`Failed to reject correction: ${err.message}`, 'danger');
    }
  };

  // Export Report Handler
  const handleExport = (exportConfig) => {
    const { fromDate: fDate, toDate: tDate, clientName, status, format } = exportConfig;

    const dataToExport = records.filter((r) => {
      if (fDate && r.date && r.date < fDate) return false;
      if (tDate && r.date && r.date > tDate) return false;
      if (clientName && r.companyName !== clientName && r.clientName !== clientName) return false;
      if (status && r.status !== status) return false;
      return true;
    }).map((r) => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Father Name': r.fatherName || '—',
      'Month': r.month || '—',
      'Year': r.year || '—',
      'Present Days': r.present !== undefined ? r.present : (r.status === 'present' ? 1 : 0),
      'Week Off (WO)': r.weekOff !== undefined ? r.weekOff : 0,
      'Holidays (HL)': r.holidays !== undefined ? r.holidays : 0,
      'CL (Casual Leave)': r.cl !== undefined ? r.cl : 0,
      'SL (Sick Leave)': r.sl !== undefined ? r.sl : 0,
      'EL (Earn Leave)': r.el !== undefined ? r.el : 0,
      'LWP (Leave Without Pay)': r.lwp !== undefined ? r.lwp : 0,
      'Working Days': r.workingDays !== undefined ? r.workingDays : (r.totalPaidDays !== undefined ? r.totalPaidDays : '—'),
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
        const companyName = activeCompany?.name || 'RR Security & Facilities';
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
    .tag-half_day { background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${companyName}</div>
      <div class="meta">Attendance Register | Date Range: ${fDate || 'All'} to ${tDate || 'All'} | Total Records: ${dataToExport.length}</div>
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

    const fileName = `Attendance_Report_${fDate || 'start'}_to_${tDate || 'end'}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    XLSX.writeFile(workbook, fileName);

    showToast(`✓ Exported ${dataToExport.length} records to ${fileName}`);
  };

  // Import Handler
  const handleImportRecords = async (importPayload) => {
    const { month, date, records: newRecords } = importPayload;
    if (!newRecords || newRecords.length === 0) return;

    try {
      setIsLoading(true);
      const res = await attendanceService.bulkImportAttendance(compId, importPayload);
      const targetDate = date || (res.records && res.records[0]?.date) || selectedDate;

      setShowImportModal(false);
      showToast(`✓ Successfully imported and updated ${res.count || newRecords.length} attendance records.`);

      if (targetDate) {
        handleDateChange(targetDate);
        await fetchRecords();
      } else {
        await fetchRecords();
      }
    } catch (err) {
      console.error('Import to database failed:', err);
      showToast(`Failed to import to database: ${err.message}`, 'danger');
    } finally {
      setIsLoading(false);
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
              type="button"
              className={styles.importBtn}
              onClick={fetchRecords}
              title="Refresh database records"
              style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' }}
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
            {canAdd('attendance') && (
              <button
                className={styles.importBtn}
                onClick={() => setShowImportModal(true)}
              >
                <UploadCloud size={16} />
                <span>Import Records</span>
              </button>
            )}
            {canExport('attendance') && (
              <button
                className={styles.exportBtn}
                onClick={() => setShowExportModal(true)}
              >
                <Download size={16} />
                <span>Export Report</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: DAILY ATTENDANCE */}
        {activeTab === 'daily' && (
          <div className={styles.tabContent}>
            {/* Summary Cards */}
            <AttendanceSummaryCards records={filteredRecords} />

            {/* Visual Distribution Chart */}
            <AttendanceDistribution records={filteredRecords} />

            {/* Unified Filter Bar with Integrated Timeframe Selector */}
            <AttendanceFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              timeframe={viewMode}
              onTimeframeChange={handleViewModeChange}
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              fromDate={fromDate}
              toDate={toDate}
              onRangeChange={handleRangeChange}
              records={records}
              clients={clientsList}
            />

            {/* Attendance Table */}
            <AttendanceTable
              records={paginatedRecords}
              onView={(rec) => setViewDrawerRecord(rec)}
              onEdit={(rec) => setEditModalRecord(rec)}
              onDelete={(rec) => handleDeleteRecord(rec)}
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

        {/* Drawers & Modals */}
        <AttendanceDetailsDrawer
          record={viewDrawerRecord}
          onClose={() => setViewDrawerRecord(null)}
          onEdit={(rec) => {
            setViewDrawerRecord(null);
            setEditModalRecord(rec);
          }}
          onDelete={(rec) => {
            setViewDrawerRecord(null);
            handleDeleteRecord(rec);
          }}
        />

        <AttendanceCorrectionModal
          record={editModalRecord}
          isOpen={!!editModalRecord}
          onClose={() => setEditModalRecord(null)}
          onSubmit={handleEditRecordSubmit}
        />

        <CorrectionReviewDrawer
          request={reviewRequest}
          onClose={() => setReviewRequest(null)}
          onApprove={handleApproveCorrection}
          onReject={handleRejectCorrection}
        />

        <AttendanceExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          currentDate={selectedDate}
        />

        <AttendanceImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportRecords}
          currentDate={selectedDate}
        />

        <DeleteAttendanceConfirmModal
          isOpen={!!deleteModalRecord}
          record={deleteModalRecord}
          isDeleting={isDeletingRecord}
          onClose={() => setDeleteModalRecord(null)}
          onConfirm={handleConfirmDeleteRecord}
        />
      </div>
    </AdminLayout>
  );
}

export default Attendance;
