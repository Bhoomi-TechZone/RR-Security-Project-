import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Search,
  Calendar,
  Filter,
  Download,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarOff,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './ClientAttendance.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function getInitialsBg(initials) {
  const colors = [
    '#2563eb', '#16a34a', '#d97706', '#dc2626',
    '#7c3aed', '#0369a1', '#0f766e', '#9333ea'
  ];
  const str = String(initials || 'EM');
  const idx = (str.charCodeAt(0) + (str.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

const formatMonthYearDisplay = (rec) => {
  if (!rec) return '—';
  const m = rec.month;
  const y = rec.year;

  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [year, month] = m.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  if (m && y) {
    if (String(m).includes(String(y))) {
      return String(m);
    }
    const mNum = Number(m);
    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
      const d = new Date(Number(y), mNum - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    return `${m} ${y}`;
  }

  if (m) {
    const mNum = Number(m);
    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
      const d = new Date(new Date().getFullYear(), mNum - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'short' });
    }
    return m;
  }

  if (rec.date) {
    const d = new Date(rec.date.includes('T') ? rec.date : `${rec.date}T00:00:00`);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        year: 'numeric'
      }).format(d);
    }
    return rec.date;
  }
  return '—';
};

export const getDaysInMonth = (monthName, year) => {
  const months = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sept: 8, sep: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
  };
  const mLower = String(monthName || '').trim().toLowerCase();
  let mIdx = months[mLower];
  if (mIdx === undefined) {
    if (typeof monthName === 'string' && monthName.includes('-')) {
      mIdx = Number(monthName.split('-')[1]) - 1;
    } else {
      mIdx = new Date().getMonth();
    }
  }
  const y = Number(year) || (typeof monthName === 'string' && monthName.includes('-') ? Number(monthName.split('-')[0]) : new Date().getFullYear());
  return new Date(y, mIdx + 1, 0).getDate();
};

function ClientAttendance() {
  const { clientCompany } = useClientAuth();

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'date'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [summary, setSummary] = useState({
    presentCount: 0,
    absentCount: 0,
    onLeaveCount: 0,
    attendanceRate: 100,
    total: 0
  });
  const [siteOptions, setSiteOptions] = useState([]);
  const [deptOptions, setDeptOptions] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchAttendance = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      const params = {
        search: searchTerm,
        site: siteFilter,
        department: deptFilter,
        status: statusFilter
      };

      if (viewMode === 'date') {
        params.date = selectedDate;
      } else {
        params.month = selectedMonth;
      }

      const res = await clientPortalService.getAttendance(params);

      if (res && Array.isArray(res.records)) {
        setRecords(res.records);
        if (res.summary) setSummary(res.summary);
        if (res.sites?.length > 0) setSiteOptions(res.sites);
        if (res.departments?.length > 0) setDeptOptions(res.departments);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.warn('Error fetching client attendance:', err.message);
      if (!isSilent) setRecords([]);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAttendance(false);
    const handleAuthChange = () => fetchAttendance(true);

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('user_logged_in', handleAuthChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('user_logged_in', handleAuthChange);
    };
  }, [clientCompany?.clientId, clientCompany?.name, viewMode, selectedMonth, selectedDate, siteFilter, deptFilter, statusFilter]);

  const filteredRecords = records.filter((rec) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      (rec.employeeName && rec.employeeName.toLowerCase().includes(s)) ||
      (rec.employeeCode && rec.employeeCode.toLowerCase().includes(s)) ||
      (rec.employeeId && rec.employeeId.toLowerCase().includes(s)) ||
      (rec.fatherName && rec.fatherName.toLowerCase().includes(s))
    );
  });

  const handleExportAttendance = () => {
    if (filteredRecords.length === 0) {
      showToast('No attendance records to export.', 'error');
      return;
    }

    try {
      const dataToExport = filteredRecords.map((r, i) => ({
        'Sr.': i + 1,
        'Employee Name': r.employeeName || '—',
        'Employee ID': r.employeeCode || r.employeeId || '—',
        'Designation': r.designation || '—',
        'Father Name': r.fatherName || '—',
        'Client / Company': r.companyName || r.clientName || clientCompany?.name || '—',
        'Month / Year': formatMonthYearDisplay(r),
        'Present': r.present ?? 0,
        'Week Off': r.weekOff ?? 0,
        'Holidays': r.holidays ?? 0,
        'CL': r.cl ?? 0,
        'SL': r.sl ?? 0,
        'EL': r.el ?? 0,
        'LWP': r.lwp ?? 0,
        'Working Days': r.workingDays ?? (r.present ?? 0),
        'Status': r.status ? r.status.toUpperCase() : 'PRESENT'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Register');
      const safeClientName = (clientCompany?.name || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      const timeTag = viewMode === 'date' ? selectedDate : selectedMonth;
      XLSX.writeFile(wb, `Attendance_${safeClientName}_${timeTag}.xlsx`);
      showToast('✓ Attendance register exported to Excel successfully.', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export attendance to Excel.', 'error');
    }
  };

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Company Attendance</h1>
          <p className={styles.pageSubtitle}>
            Official attendance register, working days, and leave muster for workforce assigned to {clientCompany?.name || 'your company'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => fetchAttendance(false)}
            title="Refresh Attendance"
            style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className={styles.exportBtn} onClick={handleExportAttendance}>
            <Download size={15} />
            <span>Export Attendance</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconSuccess}`}>
            <UserCheck size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>
              {viewMode === 'date' ? 'PRESENT ON DATE' : 'PRESENT ON MUSTER'}
            </span>
            <span className={styles.kpiValue}>{summary.presentCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconDanger}`}>
            <AlertCircle size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>ABSENT</span>
            <span className={styles.kpiValue}>{summary.absentCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <CalendarOff size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>ON LEAVE</span>
            <span className={styles.kpiValue}>{summary.onLeaveCount || 0}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <TrendingUp size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>ATTENDANCE RATE</span>
            <span className={styles.kpiValue}>{summary.attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar matching Admin controls */}
      <div className={styles.filterCard}>
        {/* View Mode Toggle: Month vs Date */}
        <div className={styles.viewModeToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('month')}
          >
            Monthly Muster
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'date' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('date')}
          >
            Daily Record
          </button>
        </div>

        {/* Date or Month Picker */}
        <div className={styles.dateSelectorWrap}>
          <Calendar size={16} className={styles.filterIcon} />
          {viewMode === 'month' ? (
            <input
              type="month"
              className={styles.dateInput}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              title="Select Month"
            />
          ) : (
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Select Date"
            />
          )}
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by guard name, code, or father name..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className={styles.filterDropdowns}>
          <select
            className={styles.selectInput}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="all">All Assigned Sites</option>
            {siteOptions.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

          <select
            className={styles.selectInput}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {deptOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late Arrival</option>
            <option value="onleave">On Leave</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Attendance Register Table Matching Admin Layout */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Father Name</th>
                <th>Client / Company</th>
                <th>Month / Year</th>
                <th style={{ color: '#16a34a', textAlign: 'center' }}>Present</th>
                <th style={{ color: '#2563eb', textAlign: 'center' }}>Week Off</th>
                <th style={{ color: '#d97706', textAlign: 'center' }}>Holidays</th>
                <th style={{ color: '#7c3aed', textAlign: 'center' }} title="Casual Leave">CL</th>
                <th style={{ color: '#0284c7', textAlign: 'center' }} title="Sick Leave">SL</th>
                <th style={{ color: '#0d9488', textAlign: 'center' }} title="Earned Leave">EL</th>
                <th style={{ color: '#dc2626', textAlign: 'center' }} title="Leave Without Pay">LWP</th>
                <th>Working Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" className={styles.emptyCell}>
                    Fetching assigned attendance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="13" className={styles.emptyCell}>
                    No attendance records found for {clientCompany?.name || 'your assigned workforce'} on {viewMode === 'date' ? selectedDate : selectedMonth}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const present = rec.present !== undefined ? rec.present : (rec.status === 'present' ? 1 : 0);
                  const weekOff = rec.weekOff !== undefined ? rec.weekOff : 0;
                  const holidays = rec.holidays !== undefined ? rec.holidays : 0;
                  const cl = rec.cl !== undefined ? rec.cl : 0;
                  const sl = rec.sl !== undefined ? rec.sl : 0;
                  const el = rec.el !== undefined ? rec.el : 0;
                  const lwp = rec.lwp !== undefined ? rec.lwp : (rec.status === 'absent' ? 1 : 0);
                  const workingDays =
                    rec.workingDays !== undefined && rec.workingDays !== null
                      ? rec.workingDays
                      : (rec.totalPaidDays !== undefined && rec.totalPaidDays !== null && rec.totalPaidDays > 0
                        ? rec.totalPaidDays
                        : (rec.month && rec.year
                          ? getDaysInMonth(rec.month, rec.year)
                          : (present + weekOff + holidays + cl + sl + el || 1)));

                  return (
                    <tr
                      key={rec.id || rec._id || `${rec.employeeId}-${rec.date}`}
                      className={styles.clickableRow}
                      onClick={() => setSelectedRecord({ ...rec, present, weekOff, holidays, cl, sl, el, lwp, workingDays })}
                      title="Click to view full attendance & muster details"
                    >
                      {/* 1. Employee */}
                      <td>
                        <div className={styles.empCell}>
                          <div
                            className={styles.avatar}
                            style={{ background: getInitialsBg(rec.initials) }}
                          >
                            {rec.initials || 'EM'}
                          </div>
                          <div>
                            <span className={styles.empName}>{rec.employeeName}</span>
                            <span className={styles.empCode}>{rec.employeeCode || rec.employeeId} • {rec.designation || 'Staff'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Father Name */}
                      <td>
                        <span className={styles.fatherNameText}>{rec.fatherName || '—'}</span>
                      </td>

                      {/* 3. Client / Company */}
                      <td>
                        <span className={styles.companyText}>
                          {rec.companyName || rec.clientName || clientCompany?.name || '—'}
                        </span>
                      </td>

                      {/* 4. Month / Year */}
                      <td>
                        <span className={styles.monthText}>{formatMonthYearDisplay(rec)}</span>
                      </td>

                      {/* 5. Present */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.presentBadge}>{present}</span>
                      </td>

                      {/* 6. Week Off */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.weekOffText}>{weekOff}</span>
                      </td>

                      {/* 7. Holidays */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.holidaysText}>{holidays}</span>
                      </td>

                      {/* 8. CL */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.leaveVal} style={{ color: '#6d28d9' }}>{cl}</span>
                      </td>

                      {/* 9. SL */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.leaveVal} style={{ color: '#0369a1' }}>{sl}</span>
                      </td>

                      {/* 10. EL */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.leaveVal} style={{ color: '#0f766e' }}>{el}</span>
                      </td>

                      {/* 11. LWP */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.leaveVal} style={{ color: '#dc2626' }}>{lwp}</span>
                      </td>

                      {/* 12. Working Days */}
                      <td>
                        <span className={styles.totalPaidBadge}>
                          {workingDays} Days
                        </span>
                      </td>

                      {/* 13. Status */}
                      <td>
                        <StatusBadge status={rec.status === 'no_record' ? 'Pending Upload' : (rec.status || 'present')}>
                          {rec.status === 'no_record' ? 'Pending Upload' : (rec.status === 'present' ? 'Present' : (rec.status || 'Present'))}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Detail Drawer */}
      {selectedRecord && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setSelectedRecord(null)} />
          <div className={styles.detailDrawer}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>Attendance Summary</h3>
                <p className={styles.drawerSub}>
                  {formatMonthYearDisplay(selectedRecord)} • {selectedRecord.date || selectedRecord.month}
                </p>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setSelectedRecord(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Employee Block */}
            <div className={styles.drawerEmpBlock}>
              <div
                className={styles.drawerAvatar}
                style={{ background: getInitialsBg(selectedRecord.initials) }}
              >
                {selectedRecord.initials || 'EM'}
              </div>
              <div>
                <div className={styles.drawerEmpName}>{selectedRecord.employeeName}</div>
                <div className={styles.drawerEmpCode}>
                  {selectedRecord.employeeCode || selectedRecord.employeeId} • {selectedRecord.designation || 'Staff'}
                </div>
                {selectedRecord.fatherName && selectedRecord.fatherName !== '—' && (
                  <div className={styles.drawerFatherName}>
                    S/O or D/O: <strong>{selectedRecord.fatherName}</strong>
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <StatusBadge status={selectedRecord.status || 'present'} />
                </div>
              </div>
            </div>

            {/* Monthly Muster Breakdown */}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeader}>
                <ClipboardCheck size={15} />
                <span>Muster Register Breakdown</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Present Days</span>
                <span className={styles.drawerRowValGreen}>{selectedRecord.present ?? 0}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Week Off (WO)</span>
                <span className={styles.drawerRowValBlue}>{selectedRecord.weekOff ?? 0}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Holidays (HL)</span>
                <span className={styles.drawerRowValAmber}>{selectedRecord.holidays ?? 0}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Casual Leave (CL)</span>
                <span className={styles.drawerRowValPurple}>{selectedRecord.cl ?? 0}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Sick Leave (SL)</span>
                <span className={styles.drawerRowValCyan}>{selectedRecord.sl ?? 0}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Earned Leave (EL)</span>
                <span className={styles.drawerRowValTeal}>{selectedRecord.el ?? 0}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Leave Without Pay (LWP)</span>
                <span className={styles.drawerRowValRed}>{selectedRecord.lwp ?? 0}</span>
              </div>
              <div className={`${styles.drawerRow} ${styles.drawerRowHighlight}`}>
                <span className={styles.drawerRowLabelBold}>Total Working Days</span>
                <span className={styles.drawerRowValHighlight}>
                  {selectedRecord.workingDays ?? (selectedRecord.present ?? 0)} Days
                </span>
              </div>
            </div>

            {/* Location & Post Assignment */}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeader}>
                <Building size={15} />
                <span>Assignment & Site Details</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Client / Company</span>
                <span className={styles.drawerRowVal}>{selectedRecord.companyName || selectedRecord.clientName || clientCompany?.name}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Assigned Site</span>
                <span className={styles.drawerRowVal}>{selectedRecord.site || 'Main Site'}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Duty Post</span>
                <span className={styles.drawerRowVal}>{selectedRecord.dutyPost || 'Duty Post'}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Department</span>
                <span className={styles.drawerRowVal}>{selectedRecord.department || 'Security Operations'}</span>
              </div>
            </div>

            {/* Shift & Verification */}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeader}>
                <Clock size={15} />
                <span>Shift & Verification</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Shift Schedule</span>
                <span className={styles.drawerRowVal}>{selectedRecord.shift || 'General Day Shift'}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Verification Method</span>
                <span className={styles.drawerRowValGreen}>{selectedRecord.verificationMethod || 'Biometric / Facial Recognition'}</span>
              </div>
              {selectedRecord.checkIn && selectedRecord.checkIn !== '--' && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowLabel}>Punch In</span>
                  <span className={styles.drawerRowVal}>{selectedRecord.checkIn}</span>
                </div>
              )}
              {selectedRecord.checkOut && selectedRecord.checkOut !== '--' && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowLabel}>Punch Out</span>
                  <span className={styles.drawerRowVal}>{selectedRecord.checkOut}</span>
                </div>
              )}
              {selectedRecord.workingHours && selectedRecord.workingHours !== '0h 00m' && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowLabel}>Working Hours</span>
                  <span className={styles.drawerRowVal}>{selectedRecord.workingHours}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ClientAttendance;
