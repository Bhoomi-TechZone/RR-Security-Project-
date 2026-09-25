import React, { useMemo, useState } from 'react';
import EmployeeAttendanceSummary from '../../components/employee/EmployeeAttendanceSummary';
import EmployeeAttendanceCalendar from '../../components/employee/EmployeeAttendanceCalendar';
import EmployeeAttendanceTable from '../../components/employee/EmployeeAttendanceTable';
import EmployeeAttendanceFilters from '../../components/employee/EmployeeAttendanceFilters';
import EmployeeAttendanceDetails from '../../components/employee/EmployeeAttendanceDetails';
import { employeeAttendanceData, employeeAttendanceMonths, getAttendanceSummary, getMonthLabel } from '../../data/employeeAttendanceData';
import styles from './MyAttendance.module.css';

function MyAttendance() {
  const [monthKey, setMonthKey] = useState('2026-08');
  const [draftMonth, setDraftMonth] = useState('2026-08');
  const [status, setStatus] = useState('All');
  const [draftStatus, setDraftStatus] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [year, monthNumber] = monthKey.split('-').map(Number);
  const records = employeeAttendanceData[monthKey] || [];
  const summary = getAttendanceSummary(records);
  const monthLabel = getMonthLabel(year, monthNumber);
  const filteredRecords = useMemo(
    () => status === 'All' ? records : records.filter((record) => record.status === status),
    [records, status]
  );
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const applyFilters = () => {
    setIsLoading(true);
    window.setTimeout(() => {
      setMonthKey(draftMonth);
      setStatus(draftStatus);
      setCurrentPage(1);
      setIsLoading(false);
    }, 180);
  };

  const resetFilters = () => {
    setDraftMonth('2026-08');
    setDraftStatus('All');
    setMonthKey('2026-08');
    setStatus('All');
    setCurrentPage(1);
  };

  const changeMonth = (offset) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;

    if (employeeAttendanceData[nextKey]) {
      setMonthKey(nextKey);
      setDraftMonth(nextKey);
      setStatus('All');
      setDraftStatus('All');
      setCurrentPage(1);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <h1>My Attendance</h1>
            <p>View your attendance records and monthly attendance summary.</p>
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
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
            </select>
          </label>
        </header>

        <EmployeeAttendanceSummary summary={summary} />

        <section className={styles.overview}>
          <div>
            <p className={styles.eyebrow}>Attendance Overview</p>
            <h2>{monthLabel}</h2>
            <p>Your attendance summary for {monthLabel}.</p>
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
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
        />

        <EmployeeAttendanceFilters
          draftMonth={draftMonth}
          draftStatus={draftStatus}
          months={employeeAttendanceMonths}
          onMonthChange={setDraftMonth}
          onStatusChange={setDraftStatus}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        {isLoading ? (
          <section className={styles.loading}>Loading attendance...</section>
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
