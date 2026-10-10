import React from 'react';
import EmptyState from '../common/EmptyState';
import AttendanceActionMenu from './AttendanceActionMenu';
import { getDaysInMonth } from './AttendanceCorrectionModal';
import styles from './AttendanceTable.module.css';

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
  if (rec.month && rec.year) {
    return `${rec.month} ${rec.year}`;
  }
  if (rec.month) {
    if (/^\d{4}-\d{2}$/.test(rec.month)) {
      const [y, m] = rec.month.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    return rec.month;
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

function AttendanceTable({ records, onView, onEdit, onReview, onDelete }) {
  const handleAction = (action, rec) => {
    if (action === 'view') {
      onView(rec);
    } else if (action === 'edit') {
      onEdit(rec);
    } else if (action === 'review') {
      onReview(rec);
    } else if (action === 'delete') {
      if (onDelete) onDelete(rec);
    }
  };

  if (records.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="No records found"
        description="No attendance records match the current filters."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Father Name</th>
              <th>Client / Company</th>
              <th>Month / Year</th>
              <th style={{ color: '#16a34a' }}>Present</th>
              <th style={{ color: '#2563eb' }}>Week Off</th>
              <th style={{ color: '#d97706' }}>Holidays</th>
              <th style={{ color: '#7c3aed' }} title="Casual Leave">CL</th>
              <th style={{ color: '#0284c7' }} title="Sick Leave">SL</th>
              <th style={{ color: '#0d9488' }} title="Earn Leave">EL</th>
              <th style={{ color: '#dc2626' }} title="Leave Without Pay">LWP</th>
              <th>Working Days</th>
              <th className={styles.actionsCol}></th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => {
              const present = rec.present !== undefined ? rec.present : (rec.status === 'present' ? 1 : 0);
              const weekOff = rec.weekOff !== undefined ? rec.weekOff : 0;
              const holidays = rec.holidays !== undefined ? rec.holidays : 0;
              const cl = rec.cl !== undefined ? rec.cl : 0;
              const sl = rec.sl !== undefined ? rec.sl : 0;
              const el = rec.el !== undefined ? rec.el : 0;
              const lwp = rec.lwp !== undefined ? rec.lwp : 0;
              const workingDays =
                rec.workingDays ||
                (rec.month && rec.year
                  ? getDaysInMonth(rec.month, rec.year)
                  : rec.totalPaidDays !== undefined
                  ? rec.totalPaidDays
                  : present + weekOff + holidays + cl + sl + el);

              return (
                <tr key={rec.id || rec._id || `${rec.employeeId}-${rec.date}`} className={styles.row} onClick={() => onView(rec)}>
                  <td>
                    <div className={styles.empCell}>
                      <div
                        className={styles.avatar}
                        style={{ background: getInitialsBg(rec.initials) }}
                      >
                        {rec.initials || 'EM'}
                      </div>
                      <div>
                        <div className={styles.empName}>{rec.employeeName}</div>
                        <div className={styles.empId}>{rec.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.fatherNameText}>{rec.fatherName || '—'}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {rec.companyName || rec.clientName || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.monthText}>{formatMonthYearDisplay(rec)}</span>
                  </td>
                  <td>
                    <span className={styles.presentBadge}>{present}</span>
                  </td>
                  <td>
                    <span className={styles.weekOffText}>{weekOff}</span>
                  </td>
                  <td>
                    <span className={styles.holidaysText}>{holidays}</span>
                  </td>
                  <td>
                    <span className={styles.leaveVal} style={{ color: '#6d28d9' }}>{cl}</span>
                  </td>
                  <td>
                    <span className={styles.leaveVal} style={{ color: '#0369a1' }}>{sl}</span>
                  </td>
                  <td>
                    <span className={styles.leaveVal} style={{ color: '#0f766e' }}>{el}</span>
                  </td>
                  <td>
                    <span className={styles.leaveVal} style={{ color: '#dc2626' }}>{lwp}</span>
                  </td>
                  <td>
                    <span className={styles.totalPaidBadge}>
                      {workingDays} Days
                    </span>
                  </td>
                  <td
                    className={styles.actionsCell}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AttendanceActionMenu
                      record={rec}
                      onAction={handleAction}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className={styles.cards}>
        {records.map((rec) => {
          const present = rec.present !== undefined ? rec.present : (rec.status === 'present' ? 1 : 0);
          const weekOff = rec.weekOff !== undefined ? rec.weekOff : 0;
          const holidays = rec.holidays !== undefined ? rec.holidays : 0;
          const cl = rec.cl !== undefined ? rec.cl : 0;
          const sl = rec.sl !== undefined ? rec.sl : 0;
          const el = rec.el !== undefined ? rec.el : 0;
          const lwp = rec.lwp !== undefined ? rec.lwp : 0;
          const workingDays =
            rec.workingDays ||
            (rec.month && rec.year
              ? getDaysInMonth(rec.month, rec.year)
              : rec.totalPaidDays !== undefined
              ? rec.totalPaidDays
              : present + weekOff + holidays + cl + sl + el);

          return (
            <div key={rec.id || rec._id || `${rec.employeeId}-${rec.date}`} className={styles.card} onClick={() => onView(rec)}>
              <div className={styles.cardHeader}>
                <div className={styles.empCell}>
                  <div
                    className={styles.avatar}
                    style={{ background: getInitialsBg(rec.initials) }}
                  >
                    {rec.initials || 'EM'}
                  </div>
                  <div>
                    <div className={styles.empName}>{rec.employeeName}</div>
                    <div className={styles.empId}>
                      {rec.employeeId} {rec.fatherName ? `· S/O: ${rec.fatherName}` : ''}
                    </div>
                  </div>
                </div>
                <span className={styles.totalPaidBadge}>
                  {workingDays} Days
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span>Client</span>
                  <span style={{ fontWeight: 600 }}>{rec.companyName || rec.clientName || '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span>Month / Year</span>
                  <span className={styles.monthText}>{formatMonthYearDisplay(rec)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span>Present / Week Off / Holidays</span>
                  <span>
                    <strong style={{ color: '#16a34a' }}>{present}P</strong> / <strong style={{ color: '#2563eb' }}>{weekOff}WO</strong> / <strong style={{ color: '#d97706' }}>{holidays}H</strong>
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span>Leaves (CL / SL / EL / LWP)</span>
                  <span>
                    {cl} CL &bull; {sl} SL &bull; {el} EL &bull; <span style={{ color: '#dc2626' }}>{lwp} LWP</span>
                  </span>
                </div>
              </div>
              <div
                className={styles.cardActions}
                onClick={(e) => e.stopPropagation()}
              >
                <AttendanceActionMenu
                  record={rec}
                  onAction={handleAction}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default AttendanceTable;
