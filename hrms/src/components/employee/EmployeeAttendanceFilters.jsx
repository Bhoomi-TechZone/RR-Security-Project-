import React from 'react';
import styles from './EmployeeAttendanceFilters.module.css';

function EmployeeAttendanceFilters({ draftMonth, draftStatus, months, onMonthChange, onStatusChange, onApply, onReset }) {
  return (
    <section className={styles.card} aria-label="Attendance filters">
      <div className={styles.field}><label htmlFor="attendance-month">Month</label><select id="attendance-month" value={draftMonth} onChange={(event) => onMonthChange(event.target.value)}>{months.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="attendance-status">Status</label><select id="attendance-status" value={draftStatus} onChange={(event) => onStatusChange(event.target.value)}><option value="All">All</option><option value="Present">Present</option><option value="Absent">Absent</option><option value="Leave">Leave</option></select></div>
      <div className={styles.actions}><button type="button" className={styles.apply} onClick={onApply}>Apply</button><button type="button" className={styles.reset} onClick={onReset}>Reset</button></div>
    </section>
  );
}

export default EmployeeAttendanceFilters;
