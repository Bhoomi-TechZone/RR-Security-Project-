import React from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './EmployeeAttendanceTable.module.css';

function EmployeeAttendanceTable({ records = [], onSelect, currentPage = 1, pageSize = 10, onPageChange }) {
  const safeRecords = Array.isArray(records) ? records : [];
  if (!safeRecords.length) {
    return <section className={styles.emptyState}><h2>No attendance records found</h2><p>There are no attendance records available for this month.</p></section>;
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}><div><p className={styles.eyebrow}>Attendance History</p><h2>Attendance Records</h2></div><span className={styles.count}>{safeRecords.length} days</span></div>
      <div className={styles.tableWrap}>
        <table><thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Working Hours</th><th>Action</th></tr></thead>
          <tbody>{safeRecords.map((record) => {
            const dateDisplay = record.date ? (
              !isNaN(new Date(`${record.date}T00:00:00`).getTime())
                ? new Date(`${record.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : record.date
            ) : '—';
            const statusKey = (record.status || '').toLowerCase().replace(/\s+/g, '');

            return (
              <tr key={record.id || record._id || Math.random()}>
                <td>{dateDisplay}</td>
                <td>{record.day || '—'}</td>
                <td><span className={`${styles.status} ${styles[statusKey] || styles.present}`}>{record.status || 'Present'}</span></td>
                <td>{record.checkIn || '—'}</td>
                <td>{record.checkOut || '—'}</td>
                <td>{record.workingHours || '—'}</td>
                <td><button type="button" className={styles.viewButton} onClick={() => onSelect(record)} aria-label={`View attendance details for ${record.date}`} title="View details"><Eye size={16} /></button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <span>Page {currentPage} of {Math.ceil(safeRecords.length / pageSize) || 1}</span>
        <div className={styles.paginationActions}>
          <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft size={15} />Previous</button>
          <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(safeRecords.length / pageSize)} aria-label="Next page">Next<ChevronRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}

export default EmployeeAttendanceTable;
