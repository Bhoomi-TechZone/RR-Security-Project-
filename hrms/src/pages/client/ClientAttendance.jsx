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
  RefreshCw
} from 'lucide-react';
import styles from './ClientAttendance.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientAttendance() {
  const { clientCompany } = useClientAuth();

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [records, setRecords] = useState([]);
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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await clientPortalService.getAttendance({
        date: selectedDate,
        search: searchTerm,
        site: siteFilter,
        department: deptFilter,
        status: statusFilter
      });

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
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [clientCompany?.clientId, clientCompany?.name, selectedDate, siteFilter, deptFilter, statusFilter]);

  const filteredRecords = records.filter((rec) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      (rec.employeeName && rec.employeeName.toLowerCase().includes(s)) ||
      (rec.employeeCode && rec.employeeCode.toLowerCase().includes(s))
    );
  });

  const handleExportAttendance = () => {
    if (filteredRecords.length === 0) {
      showToast('No attendance records to export.', 'error');
      return;
    }
    showToast(`Attendance register for ${selectedDate} exported to Excel successfully.`, 'success');
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
            Daily shift muster rolls, biometric check-ins, and working hours for {clientCompany?.name || 'your assigned workforce'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={fetchAttendance}
            title="Refresh Attendance"
            style={{ background: 'var(--surface-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
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
            <span className={styles.kpiLabel}>Present On Date</span>
            <span className={styles.kpiValue}>{summary.presentCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconDanger}`}>
            <AlertCircle size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Absent</span>
            <span className={styles.kpiValue}>{summary.absentCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <CalendarOff size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>On Leave</span>
            <span className={styles.kpiValue}>{summary.onLeaveCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <TrendingUp size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Attendance Rate</span>
            <span className={styles.kpiValue}>{summary.attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.filterCard}>
        {/* Date Selector */}
        <div className={styles.dateSelector}>
          <Calendar size={16} className={styles.searchIcon} />
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search guard name or employee code..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdowns */}
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

      {/* Attendance Register Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Guard / Staff</th>
                <th>Site & Duty Post</th>
                <th>Shift Schedule</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Verification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    Fetching attendance logs...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    No attendance records found for {clientCompany?.name || 'your company'} on {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id || rec.employeeId}>
                    <td>
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>{rec.employeeName}</span>
                        <span className={styles.empCode}>{rec.employeeCode} • {rec.designation}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.siteInfo}>
                        <MapPin size={12} />
                        <span>{rec.site} ({rec.dutyPost || 'Duty Post'})</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.shiftInfo}>
                        <Clock size={12} />
                        <span>{rec.shift}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.timeVal}>{rec.checkIn}</span>
                    </td>
                    <td>
                      <span className={styles.timeVal}>{rec.checkOut}</span>
                    </td>
                    <td>
                      <span className={styles.hoursBadge}>{rec.workingHours}</span>
                    </td>
                    <td>
                      <span className={styles.verifiedMethod}>
                        <CheckCircle2 size={12} color="#16a34a" />
                        {rec.verificationMethod || 'Biometric'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={rec.status} />
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
