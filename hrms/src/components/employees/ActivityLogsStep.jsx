import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import styles from './ActivityLogsStep.module.css';
import { authService } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Formats a date or timestamp into "19-Nov-2026 12:03 PM"
 */
function formatDisplayDateTime(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  } catch {
    return String(dateVal);
  }
}

/**
 * Returns YYYY-MM-DD string from date
 */
function toDateString(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
    return dateObj.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function ActivityLogsStep({ data = {}, employee = {} }) {
  const safeData = data || {};
  const safeEmployee = employee || {};
  const employeeCode = safeData?.employeeCode || safeData?.employeeId || safeEmployee?.employeeCode || safeEmployee?.employeeId || 'RR-020';
  const employeeName = safeData?.name || safeEmployee?.name || 'Employee';
  const cleanCode = String(employeeCode).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const empId = safeData?._id || safeData?.id || safeEmployee?._id || safeEmployee?.id || employeeCode;
  const storageKey = `novaspark_activity_logs_emp_${cleanCode}`;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Today's date for default filter
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [appliedRange, setAppliedRange] = useState({ start: todayStr, end: todayStr });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch dynamic logs from backend API & state
  const fetchDynamicLogs = useCallback(async () => {
    setLoading(true);
    let resolvedLogs = [];

    // 1. Check passed-in props from parent state
    if (Array.isArray(safeData?.activityLogs) && safeData.activityLogs.length > 0) {
      resolvedLogs = [...safeData.activityLogs];
    } else if (Array.isArray(safeEmployee?.activityLogs) && safeEmployee.activityLogs.length > 0) {
      resolvedLogs = [...safeEmployee.activityLogs];
    }

    // 2. Fetch fresh dynamic logs from backend
    if (empId) {
      try {
        const token = authService.getToken();
        const res = await fetch(`${API_BASE_URL}/employees/${empId}/activity-logs`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && Array.isArray(resData.activityLogs) && resData.activityLogs.length > 0) {
            resolvedLogs = resData.activityLogs;
          }
        }
      } catch (err) {
        console.warn('[ActivityLogsStep] Could not fetch remote activity logs, falling back to local records:', err);
      }
    }

    // 3. Merge with any local session logs recorded in localStorage
    try {
      const localSaved = localStorage.getItem(storageKey);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(resolvedLogs.map(l => l.id || `${l.action}-${l.timestamp}`));
          parsed.forEach(p => {
            const key = p.id || `${p.action}-${p.timestamp}`;
            if (!existingIds.has(key)) {
              resolvedLogs.unshift(p);
              existingIds.add(key);
            }
          });
        }
      }
    } catch {}

    // 4. If no logs exist at all, construct dynamic creation log using the actual record metadata
    if (resolvedLogs.length === 0) {
      const createdTime = safeEmployee?.createdAt || safeData?.createdAt || new Date();
      const adminEditor = safeEmployee?.adminEmail ? safeEmployee.adminEmail.split('@')[0] : 'Administrator';
      resolvedLogs = [
        {
          id: `log-created-${empId}`,
          action: `Employee record created (${employeeName})`,
          performedBy: adminEditor,
          date: toDateString(createdTime),
          timestamp: formatDisplayDateTime(createdTime),
          createdAt: new Date(createdTime).toISOString()
        }
      ];
    }

    // Sort descending by timestamp/createdAt so newest logs are first
    resolvedLogs.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || a.date).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || b.date).getTime();
      return timeB - timeA;
    });

    setLogs(resolvedLogs);
    setLoading(false);
  }, [empId, employeeCode, employeeName, safeData?.activityLogs, safeEmployee?.activityLogs, safeEmployee?.createdAt, safeData?.createdAt, storageKey]);

  useEffect(() => {
    fetchDynamicLogs();
  }, [fetchDynamicLogs]);

  // Handle filtering
  const handleShowFilter = () => {
    setAppliedRange({ start: startDate, end: endDate });
    setCurrentPage(1);
  };

  // Filter dynamic logs based on applied range
  const filteredLogs = useMemo(() => {
    if (!appliedRange.start && !appliedRange.end) return logs;
    return logs.filter(log => {
      const logDate = log.date || (log.createdAt ? toDateString(log.createdAt) : todayStr);
      if (appliedRange.start && logDate < appliedRange.start) return false;
      if (appliedRange.end && logDate > appliedRange.end) return false;
      return true;
    });
  }, [logs, appliedRange, todayStr]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIdx, startIdx + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. HEADER BAR
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Activity Logs</h3>
          <p className={styles.headerSubtitle}>
            Review logs for changes made to this employee record.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="Read Help documentation"
          >
            <HelpCircle size={15} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. DATE RANGE FILTER
         ======================================================== */}
      <div className={styles.filterContainer}>
        <label className={styles.filterLabel}>Select Date Range</label>
        <div className={styles.filterRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start Date"
          />
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End Date"
          />
          <button
            type="button"
            className={styles.showBtn}
            onClick={handleShowFilter}
            title="Filter Activity Logs"
          >
            <CheckCircle size={15} />
            <span>Show</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          3. ACTIVITY LOG CARDS (DYNAMIC)
         ======================================================== */}
      <div className={styles.logsList}>
        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw size={18} className={styles.spinner} style={{ margin: '0 auto 8px auto', display: 'block' }} />
            Loading dynamic activity logs...
          </div>
        ) : paginatedLogs.length > 0 ? (
          paginatedLogs.map((log) => {
            const displayTime = log.timestamp || formatDisplayDateTime(log.createdAt || log.date);
            const userEditor = log.performedBy || 'Administrator';

            return (
              <div key={log.id || `${log.action}-${displayTime}`} className={styles.logCard}>
                {/* Left Side: Info icon & Action description */}
                <div className={styles.logLeft}>
                  <Info size={17} className={styles.infoIcon} />
                  <span className={styles.actionText}>{log.action}</span>
                </div>

                {/* Right Side: Who edited it & formatted timestamp */}
                <div className={styles.logRight}>
                  <span className={styles.performedBy}>by {userEditor}</span>
                  <span className={styles.timestamp}>{displayTime}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            No activity logs found for the selected date range.
          </div>
        )}
      </div>

      {/* ========================================================
          4. PAGINATION
         ======================================================== */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageCircleBtn}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              type="button"
              className={`${styles.pageNumBtn} ${currentPage === num ? styles.pageNumBtnActive : ''}`}
              onClick={() => setCurrentPage(num)}
              aria-label={`Page ${num}`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            className={styles.pageCircleBtn}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityLogsStep;
