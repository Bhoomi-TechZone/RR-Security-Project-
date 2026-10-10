import React, { useMemo, useState, useEffect, useCallback } from 'react';
import EmployeeAttendanceSummary from '../../components/employee/EmployeeAttendanceSummary';
import EmployeeAttendanceCalendar from '../../components/employee/EmployeeAttendanceCalendar';
import EmployeeAttendanceTable from '../../components/employee/EmployeeAttendanceTable';
import EmployeeAttendanceFilters from '../../components/employee/EmployeeAttendanceFilters';
import EmployeeAttendanceDetails from '../../components/employee/EmployeeAttendanceDetails';
import { getMonthLabel } from '../../data/employeeAttendanceData';
import { useCompany } from '../../context/CompanyContext';
import attendanceService from '../../services/attendanceService';
import authService from '../../services/authService';
import styles from './MyAttendance.module.css';

const generateMonthOptions = () => {
  const current = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
    options.push({ key, label, year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return options;
};

function MyAttendance() {
  const { activeCompany } = useCompany();
  const activeUser = authService.getCurrentUser() || authService.getUser() || {};
  const compId = activeCompany?.companyId || activeCompany?.id || activeUser?.companyId;

  const availableMonths = useMemo(() => generateMonthOptions(), []);
  const initialMonth = availableMonths[0]?.key || new Date().toISOString().slice(0, 7);

  const [monthKey, setMonthKey] = useState(initialMonth);
  const [draftMonth, setDraftMonth] = useState(initialMonth);
  const [status, setStatus] = useState('All');
  const [draftStatus, setDraftStatus] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [year, monthNumber] = monthKey.split('-').map(Number);
  const monthLabel = getMonthLabel(year, monthNumber);

  // Fetch dynamic attendance records for this month directly from MongoDB
  const fetchEmployeeAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await attendanceService.getAttendanceRecords(compId, {
        month: monthKey,
        employeeId: activeUser?.employeeId || activeUser?.id,
        search: activeUser?.employeeId || activeUser?.name || '',
      });

      if (Array.isArray(data)) {
        const formatted = data.map((r) => {
          const d = new Date(r.date);
          const dayName = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { weekday: 'long' }) : '';
          let normalizedStatus = 'Present';
          if (r.status === 'absent') normalizedStatus = 'Absent';
          else if (r.status === 'halfDay') normalizedStatus = 'Half Day';
          else if (r.status === 'onLeave' || r.status === 'leave') normalizedStatus = 'Leave';
          else if (r.status === 'late') normalizedStatus = 'Late';

          return {
            id: r.id || r._id,
            date: r.date,
            day: dayName,
            status: normalizedStatus,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            workingHours: r.workingHours,
            shift: r.shift || 'General Shift',
            site: r.site || 'Main Site',
            department: r.department || 'Operations',
            employeeName: r.employeeName,
            employeeId: r.employeeId,
          };
        });
        setRecords(formatted);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.warn('Failed to load employee attendance from MongoDB:', err.message);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [compId, monthKey, activeUser?.employeeId, activeUser?.name]);

  useEffect(() => {
    fetchEmployeeAttendance();
  }, [fetchEmployeeAttendance]);

  // Compute dynamic summary statistics from MongoDB records
  const summary = useMemo(() => {
    const present = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const leave = records.filter((r) => r.status === 'Leave').length;
    const halfDay = records.filter((r) => r.status === 'Half Day').length;
    const workingDays = records.length;
    const rate = workingDays > 0 ? Math.round(((present + halfDay * 0.5) / workingDays) * 100) : 0;

    return {
      workingDays,
      present,
      absent,
      leave,
      halfDay,
      attendanceRate: rate,
    };
  }, [records]);

  const filteredRecords = useMemo(
    () => (status === 'All' ? records : records.filter((record) => record.status.toLowerCase() === status.toLowerCase())),
    [records, status]
  );
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const applyFilters = () => {
    setMonthKey(draftMonth);
    setStatus(draftStatus);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setDraftMonth(initialMonth);
    setDraftStatus('All');
    setMonthKey(initialMonth);
    setStatus('All');
    setCurrentPage(1);
  };

  const changeMonth = (offset) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setMonthKey(nextKey);
    setDraftMonth(nextKey);
    setStatus('All');
    setDraftStatus('All');
    setCurrentPage(1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <h1>My Attendance</h1>
            <p>View your dynamic attendance records and monthly attendance summary.</p>
          </div>

          <label className={styles.monthSelector}>
            Month
            <select
              value={monthKey}
              onChange={(event) => {
                setMonthKey(event.target.value);
                setDraftMonth(event.target.value);
              }}
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </label>
        </header>

        <EmployeeAttendanceSummary summary={summary} />

        <section className={styles.overview}>
          <div>
            <p className={styles.eyebrow}>Attendance Overview</p>
            <h2>{monthLabel}</h2>
            <p>Your dynamic attendance summary for {monthLabel}.</p>
          </div>
          <strong className={styles.rate}>{summary.attendanceRate}%</strong>
          <div className={styles.progress}>
            <span style={{ width: `${summary.attendanceRate}%` }} />
          </div>
          <div className={styles.overviewStats}>
            <span><i className={styles.presentDot} />Present: <b>{summary.present}</b></span>
            <span><i className={styles.absentDot} />Absent: <b>{summary.absent}</b></span>
            <span><i className={styles.leaveDot} />Leave: <b>{summary.leave}</b></span>
          </div>
        </section>

        <EmployeeAttendanceCalendar
          records={records}
          monthLabel={monthLabel}
          monthKey={monthKey}
          year={year}
          monthNumber={monthNumber}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
        />

        <EmployeeAttendanceFilters
          draftMonth={draftMonth}
          draftStatus={draftStatus}
          months={availableMonths}
          onMonthChange={setDraftMonth}
          onStatusChange={setDraftStatus}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        {isLoading ? (
          <section className={styles.loading}>Loading live attendance records...</section>
        ) : (
          <EmployeeAttendanceTable
            records={paginatedRecords}
            totalRecords={filteredRecords.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onSelect={setSelectedRecord}
          />
        )}
      </div>

      <EmployeeAttendanceDetails
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </main>
  );
}

export default MyAttendance;

