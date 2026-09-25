import React, { useMemo } from 'react';
import styles from './AttendanceDistribution.module.css';

const SEGMENTS = [
  { statuses: ['present'], label: 'Present', color: '#16a34a', bg: '#dcfce7' },
  { statuses: ['late', 'earlyOut'], label: 'Late/Early', color: '#d97706', bg: '#fff7ed' },
  { statuses: ['halfDay'], label: 'Half Day', color: '#0369a1', bg: '#e0f2fe' },
  { statuses: ['leave', 'onLeave'], label: 'Leave', color: '#7c3aed', bg: '#ede9fe' },
  { statuses: ['absent'], label: 'Absent', color: '#dc2626', bg: '#fee2e2' },
  { statuses: ['pendingCorrection'], label: 'Pending Fix', color: '#9333ea', bg: '#fdf4ff' }
];

function AttendanceDistribution({ records }) {
  const total = records.length;

  const segments = useMemo(() => {
    if (total === 0) return [];
    return SEGMENTS.map((seg) => {
      const count = records.filter((r) => seg.statuses.includes(r.status)).length;
      const pct = (count / total) * 100;
      return { ...seg, count, pct };
    }).filter((s) => s.pct > 0);
  }, [records, total]);

  if (total === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>Attendance Distribution</span>
        <span className={styles.total}>{total} employees</span>
      </div>
      <div className={styles.bar}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={styles.segment}
            style={{ width: `${seg.pct}%`, background: seg.color }}
            title={`${seg.label}: ${seg.count} (${Math.round(seg.pct)}%)`}
          />
        ))}
      </div>
      <div className={styles.legend}>
        {segments.map((seg) => (
          <div key={seg.label} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: seg.color }} />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendCount} style={{ color: seg.color }}>
              {seg.count}
            </span>
            <span className={styles.legendPct}>({Math.round(seg.pct)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceDistribution;
