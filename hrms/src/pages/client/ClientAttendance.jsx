import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import styles from './ClientAttendance.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import {
  CLIENT_ATTENDANCE_RECORDS,
  CLIENT_WEEKLY_ATTENDANCE_TREND,
  CLIENT_DASHBOARD_KPIS
} from '../../data/clientPortalData';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientAttendance() {
  const { clientCompany } = useClientAuth();

  const [selectedDate, setSelectedDate] = useState('2026-08-25');
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleExportAttendance = () => {
    showToast(`Attendance register for ${selectedDate} exported to Excel successfully.`, 'success');
  };

  const filteredRecords = CLIENT_ATTENDANCE_RECORDS.filter((rec) => {
    const matchesSearch =
      rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSite = siteFilter === 'all' || rec.site === siteFilter;
    const matchesDept = deptFilter === 'all' || rec.department === deptFilter;
    const matchesStatus =
      statusFilter === 'all' || rec.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSite && matchesDept && matchesStatus;
  });

  const sites = Array.from(new Set(CLIENT_ATTENDANCE_RECORDS.map((r) => r.site)));
  const departments = Array.from(new Set(CLIENT_ATTENDANCE_RECORDS.map((r) => r.department)));

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
            Daily shift muster rolls, biometric check-ins, and working hours for your workforce.
          </p>
        </div>

        <button type="button" className={styles.exportBtn} onClick={handleExportAttendance}>
          <Download size={15} />
          <span>Export Attendance</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconSuccess}`}>
            <UserCheck size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Present Today</span>
            <span className={styles.kpiValue}>{CLIENT_DASHBOARD_KPIS.presentToday}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconDanger}`}>
            <AlertCircle size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Absent</span>
            <span className={styles.kpiValue}>{CLIENT_DASHBOARD_KPIS.absentToday}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <CalendarOff size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>On Leave</span>
            <span className={styles.kpiValue}>{CLIENT_DASHBOARD_KPIS.onLeaveToday}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <TrendingUp size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Daily Attendance %</span>
            <span className={styles.kpiValue}>{CLIENT_DASHBOARD_KPIS.todayAttendancePercent}%</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filterCard}>
        <div className={styles.dateSelectorWrap}>
          <Calendar size={16} className={styles.filterIcon} />
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterDropdowns}>
          <select
            className={styles.selectInput}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            className={styles.selectInput}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="all">All Operating Sites</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site}
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
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
          </select>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Assigned Site</th>
                <th>Shift Details</th>
                <th>Date</th>
                <th>Status</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Working Hours</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.emptyCell}>
                    No attendance records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div>
                        <span className={styles.empName}>{rec.employeeName}</span>
                        <span className={styles.empCode}>{rec.employeeCode}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.siteCell}>
                        <MapPin size={12} />
                        <span>{rec.site}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.shiftBadge}>{rec.shift}</span>
                    </td>
                    <td>{rec.date}</td>
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>
                    <td>
                      <span className={styles.timeVal}>{rec.inTime}</span>
                    </td>
                    <td>
                      <span className={styles.timeVal}>{rec.outTime}</span>
                    </td>
                    <td>
                      <strong>{rec.workingHours}</strong>
                    </td>
                    <td>
                      <span className={rec.overtime !== '0h 00m' ? styles.otActive : styles.otNone}>
                        {rec.overtime}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientAttendance;
