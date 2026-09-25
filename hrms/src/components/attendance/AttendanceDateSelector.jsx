import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import styles from './AttendanceDateSelector.module.css';

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
  });
};

const toInputValue = (dateStr) => dateStr; // already YYYY-MM-DD

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

function AttendanceDateSelector({ date, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.arrowBtn}
        onClick={() => onChange(addDays(date, -1))}
        title="Previous day"
      >
        <ChevronLeft size={18} />
      </button>

      <div className={styles.dateDisplay} onClick={() => setShowPicker((v) => !v)} title="Pick a date">
        <Calendar size={16} className={styles.calIcon} />
        <span className={styles.dateText}>{formatDisplayDate(date)}</span>
        {isToday && <span className={styles.todayChip}>Today</span>}
      </div>

      <button
        className={styles.arrowBtn}
        onClick={() => onChange(addDays(date, 1))}
        title="Next day"
        disabled={date >= today}
      >
        <ChevronRight size={18} />
      </button>

      {!isToday && (
        <button className={styles.todayBtn} onClick={() => onChange(today)}>
          Today
        </button>
      )}

      {showPicker && (
        <input
          type="date"
          className={styles.hiddenPicker}
          value={toInputValue(date)}
          max={today}
          onChange={(e) => {
            onChange(e.target.value);
            setShowPicker(false);
          }}
          onBlur={() => setShowPicker(false)}
          autoFocus
        />
      )}
    </div>
  );
}

export default AttendanceDateSelector;
