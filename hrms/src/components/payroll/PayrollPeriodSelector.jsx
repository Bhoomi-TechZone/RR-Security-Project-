import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import styles from './PayrollPeriodSelector.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollPeriodSelector({ selectedMonth, onMonthChange }) {
  // Parse YYYY-MM
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  const monthName = MONTH_NAMES[month - 1] || 'August';
  const displayLabel = `${monthName} ${year}`;

  const handlePrev = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const handleNext = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  return (
    <div className={styles.periodCard}>
      <div className={styles.periodInfo}>
        <span className={styles.periodLabel}>Payroll Period</span>
        <div className={styles.periodMain}>
          <span className={styles.periodIcon}>
            <Calendar size={18} />
          </span>
          <span className={styles.periodMonth}>{displayLabel}</span>
          <span className={styles.liveBadge}>Active Cycle</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={handlePrev}
          aria-label="Previous Month"
        >
          <ChevronLeft size={16} />
          <span>Previous Month</span>
        </button>

        <div className={styles.currentMonthBadge}>
          <span>{displayLabel}</span>
        </div>

        <button
          type="button"
          className={styles.navBtn}
          onClick={handleNext}
          aria-label="Next Month"
        >
          <span>Next Month</span>
          <ChevronRight size={16} />
        </button>

        <div className={styles.selectWrapper}>
          <label htmlFor="payroll-month-select" className={styles.hiddenLabel}>Select Month</label>
          <input
            id="payroll-month-select"
            type="month"
            className={styles.monthInput}
            value={selectedMonth}
            onChange={(e) => e.target.value && onMonthChange(e.target.value)}
          />
          <span className={styles.selectLabel}>Select Month</span>
        </div>
      </div>
    </div>
  );
}
