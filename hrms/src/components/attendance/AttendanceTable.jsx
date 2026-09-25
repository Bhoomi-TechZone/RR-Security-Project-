import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import AttendanceActionMenu from './AttendanceActionMenu';
import { formatTime, getStatusLabel } from '../../data/attendanceData';
import styles from './AttendanceTable.module.css';

function getInitialsBg(initials) {
  const colors = [
    '#2563eb', '#16a34a', '#d97706', '#dc2626',
    '#7c3aed', '#0369a1', '#0f766e', '#9333ea'
  ];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

function AttendanceTable({ records, onView, onEdit, onReview }) {
  const handleAction = (action, rec) => {
    if (action === 'view') {
      onView(rec);
    } else if (action === 'edit') {
      onEdit(rec);
    } else if (action === 'review') {
      onReview(rec);
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
              <th>Company / Site</th>
              <th>Department</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Status</th>
              <th className={styles.actionsCol}></th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id} className={styles.row} onClick={() => onView(rec)}>
                <td>
                  <div className={styles.empCell}>
                    <div
                      className={styles.avatar}
                      style={{ background: getInitialsBg(rec.initials) }}
                    >
                      {rec.initials}
                    </div>
                    <div>
                      <div className={styles.empName}>{rec.employeeName}</div>
                      <div className={styles.empId}>{rec.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.companyCell}>
                    <span className={styles.company}>{rec.companyName}</span>
                    <span className={styles.site}>{rec.site}</span>
                  </div>
                </td>
                <td className={styles.deptCell}>{rec.department}</td>
                <td>
                  <span className={rec.lateMinutes > 0 ? styles.lateTime : ''}>
                    {formatTime(rec.checkIn)}
                  </span>
                  {rec.lateMinutes > 0 && (
                    <span className={styles.lateTag}>+{rec.lateMinutes}m late</span>
                  )}
                </td>
                <td>
                  <span className={rec.earlyOutMinutes > 0 ? styles.earlyTime : ''}>
                    {formatTime(rec.checkOut)}
                  </span>
                  {rec.earlyOutMinutes > 0 && (
                    <span className={styles.earlyTag}>{rec.earlyOutMinutes}m early</span>
                  )}
                </td>
                <td className={styles.hoursCell}>
                  {rec.workingHours || '—'}
                </td>
                <td>
                  <StatusBadge status={rec.status}>
                    {getStatusLabel(rec.status)}
                  </StatusBadge>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className={styles.cards}>
        {records.map((rec) => (
          <div key={rec.id} className={styles.card} onClick={() => onView(rec)}>
            <div className={styles.cardHeader}>
              <div className={styles.empCell}>
                <div
                  className={styles.avatar}
                  style={{ background: getInitialsBg(rec.initials) }}
                >
                  {rec.initials}
                </div>
                <div>
                  <div className={styles.empName}>{rec.employeeName}</div>
                  <div className={styles.empId}>{rec.employeeId} · {rec.site}</div>
                </div>
              </div>
              <StatusBadge status={rec.status}>
                {getStatusLabel(rec.status)}
              </StatusBadge>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardRow}>
                <span>In</span>
                <span>
                  {formatTime(rec.checkIn)}
                  {rec.lateMinutes > 0 && <span className={styles.lateTag}> +{rec.lateMinutes}m</span>}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span>Out</span>
                <span>
                  {formatTime(rec.checkOut)}
                  {rec.earlyOutMinutes > 0 && <span className={styles.earlyTag}> -{rec.earlyOutMinutes}m</span>}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span>Hours</span>
                <span className={styles.hoursCell}>{rec.workingHours || '—'}</span>
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
        ))}
      </div>
    </>
  );
}

export default AttendanceTable;
