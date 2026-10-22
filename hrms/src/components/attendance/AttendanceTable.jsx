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

const MONTH_FULL_NAMES = {
  jan: 'January', january: 'January', '01': 'January', '1': 'January',
  feb: 'February', february: 'February', '02': 'February', '2': 'February',
  mar: 'March', march: 'March', '03': 'March', '3': 'March',
  apr: 'April', april: 'April', '04': 'April', '4': 'April',
  may: 'May', '05': 'May', '5': 'May',
  jun: 'June', june: 'June', '06': 'June', '6': 'June',
  jul: 'July', july: 'July', '07': 'July', '7': 'July',
  aug: 'August', august: 'August', '08': 'August', '8': 'August',
  sep: 'September', sept: 'September', september: 'September', '09': 'September', '9': 'September',
  oct: 'October', october: 'October', '10': 'October',
  nov: 'November', november: 'November', '11': 'November',
  dec: 'December', december: 'December', '12': 'December',
};

const formatMonthYearDisplay = (rec) => {
  const mStr = String(rec.month || '').trim();
  const yStr = rec.year ? String(rec.year) : '';

  // 1. If month is in YYYY-MM format (e.g. 2026-10)
  if (/^\d{4}-\d{1,2}$/.test(mStr)) {
    const [y, m] = mStr.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // 2. If month is a number like 1-12
  const mNum = parseInt(mStr, 10);
  if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
    const y = Number(yStr) || new Date().getFullYear();
    const d = new Date(y, mNum - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // 3. If month is a name or abbreviation like "Oct", "October", "Sep"
  if (mStr) {
    const clean = mStr.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fullName = MONTH_FULL_NAMES[clean] || (mStr.charAt(0).toUpperCase() + mStr.slice(1));
    if (yStr && !fullName.includes(yStr)) {
      return `${fullName} ${yStr}`;
    }
    return fullName;
  }

  // 4. Fallback to date
  if (rec.date) {
    const d = new Date(rec.date.includes('T') ? rec.date : `${rec.date}T00:00:00`);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
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
                (rec.workingDays && Number(rec.workingDays) > 1)
                  ? rec.workingDays
                  : (rec.month || rec.date
                    ? getDaysInMonth(rec.month || rec.date.slice(0, 7), rec.year || rec.date?.slice(0, 4))
                    : 30);

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
