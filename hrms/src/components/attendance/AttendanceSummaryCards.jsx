import React, { useMemo } from 'react';
import { UserCheck, UserX, Clock, CalendarOff, AlertTriangle } from 'lucide-react';
import styles from './AttendanceSummaryCards.module.css';

const CARD_CONFIG = [
  {
    key: 'present',
    label: 'Present',
    icon: UserCheck,
    colorClass: 'present',
    statuses: ['present', 'late', 'earlyOut']
  },
  {
    key: 'absent',
    label: 'Absent',
    icon: UserX,
    colorClass: 'absent',
    statuses: ['absent']
  },
  {
    key: 'halfDay',
    label: 'Half Day',
    icon: Clock,
    colorClass: 'halfDay',
    statuses: ['halfDay']
  },
  {
    key: 'leave',
    label: 'On Leave',
    icon: CalendarOff,
    colorClass: 'leave',
    statuses: ['leave']
  },
  {
    key: 'lateEarly',
    label: 'Late / Early',
    icon: AlertTriangle,
    colorClass: 'late',
    statuses: ['late', 'earlyOut']
  }
];

function AttendanceSummaryCards({ records }) {
  const totals = useMemo(() => {
    const counts = {
      present: 0, absent: 0, halfDay: 0, leave: 0, lateEarly: 0, pendingCorrection: 0
    };
    records.forEach((r) => {
      const s = String(r.status || '').toLowerCase().replace(/[-_ ]/g, '');
      if (s === 'present') counts.present++;
      else if (s === 'absent') counts.absent++;
      else if (s === 'halfday') counts.halfDay++;
      else if (s === 'leave' || s === 'onleave') counts.leave++;
      else if (s === 'late' || s === 'earlyout' || Number(r.lateMinutes || 0) > 0) counts.lateEarly++;
      else if (s === 'pendingcorrection') counts.pendingCorrection++;
      else if (s) counts.present++;
    });
    return counts;
  }, [records]);

  const total = records.length;

  return (
    <div className={styles.grid}>
      {CARD_CONFIG.map(({ key, label, icon: Icon, colorClass }) => {
        const count = totals[key];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} className={`${styles.card} ${styles[colorClass]}`}>
            <div className={styles.iconWrap}>
              <Icon size={20} />
            </div>
            <div className={styles.info}>
              <span className={styles.count}>{count}</span>
              <span className={styles.label}>{label}</span>
            </div>
            <div className={styles.pct}>{pct}%</div>
          </div>
        );
      })}

      {/* Pending correction as a subtle chip */}
      {totals.pendingCorrection > 0 && (
        <div className={`${styles.card} ${styles.pendingCorrection}`}>
          <div className={styles.iconWrap}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.info}>
            <span className={styles.count}>{totals.pendingCorrection}</span>
            <span className={styles.label}>Pending Fix</span>
          </div>
          <div className={styles.pct}>!</div>
        </div>
      )}
    </div>
  );
}

export default AttendanceSummaryCards;
