import React from 'react';
import { CalendarCheck, CalendarDays, CalendarOff, CalendarX, ChartNoAxesColumnIncreasing } from 'lucide-react';
import styles from './EmployeeAttendanceSummary.module.css';

const summaryItems = [
  { key: 'workingDays', label: 'Working Days', icon: CalendarDays, tone: 'neutral', suffix: '' },
  { key: 'present', label: 'Present', icon: CalendarCheck, tone: 'success', suffix: '' },
  { key: 'absent', label: 'Absent', icon: CalendarX, tone: 'danger', suffix: '' },
  { key: 'leave', label: 'Leave', icon: CalendarOff, tone: 'info', suffix: '' },
  { key: 'attendanceRate', label: 'Attendance Rate', icon: ChartNoAxesColumnIncreasing, tone: 'primary', suffix: '%' }
];

function EmployeeAttendanceSummary({ summary }) {
  return (
    <section className={styles.grid} aria-label="Monthly attendance summary">
      {summaryItems.map(({ key, label, icon: Icon, tone, suffix }) => (
        <article key={key} className={styles.card}>
          <div className={`${styles.icon} ${styles[tone]}`}><Icon size={18} strokeWidth={2} /></div>
          <div className={styles.content}>
            <span>{label}</span>
            <strong>{summary[key]}{suffix}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

export default EmployeeAttendanceSummary;
