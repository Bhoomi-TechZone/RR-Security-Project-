import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  Globe,
  Clock
} from 'lucide-react';
import styles from './AttendanceDateSelector.module.css';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDisplayMonth = (monthStr) => {
  if (!monthStr) return '—';
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const addDays = (dateStr, n) => {
  const d = new Date((dateStr || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const addMonths = (monthStr, n) => {
  const [y, m] = (monthStr || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  const nextY = d.getFullYear();
  const nextM = String(d.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
};

const addYears = (yearStr, n) => {
  const y = Number(yearStr || new Date().getFullYear());
  return String(y + n);
};

function AttendanceDateSelector({
  viewMode = 'date',
  onViewModeChange,
  date,
  onDateChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  fromDate,
  toDate,
  onRangeChange,
}) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const currentYear = String(new Date().getFullYear());

  const isToday = date === today;
  const isThisMonth = month === currentMonth;
  const isThisYear = year === currentYear;

  const yearsList = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  const setRangePreset = (preset) => {
    const d = new Date();
    if (preset === 'today') {
      onRangeChange({ fromDate: today, toDate: today });
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(d.getDate() - 7);
      onRangeChange({ fromDate: past.toISOString().slice(0, 10), toDate: today });
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(d.getDate() - 30);
      onRangeChange({ fromDate: past.toISOString().slice(0, 10), toDate: today });
    } else if (preset === 'thisMonth') {
      const firstDay = `${currentMonth}-01`;
      onRangeChange({ fromDate: firstDay, toDate: today });
    } else if (preset === 'lastMonth') {
      const lastMonthStr = addMonths(currentMonth, -1);
      const [ly, lm] = lastMonthStr.split('-').map(Number);
      const lastDay = new Date(ly, lm, 0).getDate();
      onRangeChange({
        fromDate: `${lastMonthStr}-01`,
        toDate: `${lastMonthStr}-${String(lastDay).padStart(2, '0')}`,
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Filter Mode Switcher */}
      <div className={styles.modeBar}>
        <button
          type="button"
          className={`${styles.modeTab} ${viewMode === 'date' ? styles.modeTabActive : ''}`}
          onClick={() => onViewModeChange('date')}
        >
          <Calendar size={15} /> Daily (Date-wise)
        </button>

        <button
          type="button"
          className={`${styles.modeTab} ${viewMode === 'month' ? styles.modeTabActive : ''}`}
          onClick={() => onViewModeChange('month')}
        >
          <CalendarDays size={15} /> Monthly (Month-wise)
        </button>

        <button
          type="button"
          className={`${styles.modeTab} ${viewMode === 'year' ? styles.modeTabActive : ''}`}
          onClick={() => onViewModeChange('year')}
        >
          <Clock size={15} /> Yearly (Year-wise)
        </button>

        <button
          type="button"
          className={`${styles.modeTab} ${viewMode === 'range' ? styles.modeTabActive : ''}`}
          onClick={() => onViewModeChange('range')}
        >
          <CalendarRange size={15} /> Custom Range
        </button>

        <button
          type="button"
          className={`${styles.modeTab} ${viewMode === 'all' ? styles.modeTabActive : ''}`}
          onClick={() => onViewModeChange('all')}
        >
          <Globe size={15} /> All Records
        </button>
      </div>

      {/* Context-Sensitive Navigation & Date Picker Controls */}
      <div className={styles.navRow}>
        {/* --- DAILY (DATE-WISE) MODE --- */}
        {viewMode === 'date' && (
          <div className={styles.navControls}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => onDateChange(addDays(date, -1))}
              title="Previous day"
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.dateDisplay}>
              <Calendar size={16} className={styles.calIcon} />
              <span className={styles.dateText}>{formatDisplayDate(date)}</span>
              {isToday && <span className={styles.todayChip}>Today</span>}
            </div>

            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => onDateChange(addDays(date, 1))}
              title="Next day"
            >
              <ChevronRight size={18} />
            </button>

            <input
              type="date"
              className={styles.pickerInput}
              value={date || today}
              onChange={(e) => onDateChange(e.target.value)}
              title="Select custom date"
            />

            {!isToday && (
              <button
                type="button"
                className={styles.todayBtn}
                onClick={() => onDateChange(today)}
              >
                Today
              </button>
            )}
          </div>
        )}

        {/* --- MONTHLY (MONTH-WISE) MODE --- */}
        {viewMode === 'month' && (
          <div className={styles.navControls}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => onMonthChange(addMonths(month, -1))}
              title="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.dateDisplay}>
              <CalendarDays size={16} className={styles.calIcon} />
              <span className={styles.dateText}>{formatDisplayMonth(month || currentMonth)}</span>
              {isThisMonth && <span className={styles.todayChip}>This Month</span>}
            </div>

            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => onMonthChange(addMonths(month, 1))}
              title="Next month"
            >
              <ChevronRight size={18} />
            </button>

            <input
              type="month"
              className={styles.pickerInput}
              value={month || currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              title="Select specific month"
            />

            {!isThisMonth && (
              <button
                type="button"
                className={styles.todayBtn}
                onClick={() => onMonthChange(currentMonth)}
              >
                This Month
              </button>
            )}
          </div>
        )}

        {/* --- YEARLY (YEAR-WISE) MODE --- */}
        {viewMode === 'year' && (
          <div className={styles.navControls}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => onYearChange(addYears(year, -1))}
              title="Previous year"
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.dateDisplay}>
              <Clock size={16} className={styles.calIcon} />
              <span className={styles.dateText}>Year {year || currentYear}</span>
              {isThisYear && <span className={styles.todayChip}>This Year</span>}
            </div>

            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => onYearChange(addYears(year, 1))}
              title="Next year"
            >
              <ChevronRight size={18} />
            </button>

            <select
              className={styles.pickerInput}
              value={year || currentYear}
              onChange={(e) => onYearChange(e.target.value)}
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {!isThisYear && (
              <button
                type="button"
                className={styles.todayBtn}
                onClick={() => onYearChange(currentYear)}
              >
                This Year
              </button>
            )}
          </div>
        )}

        {/* --- CUSTOM DATE RANGE MODE --- */}
        {viewMode === 'range' && (
          <div className={styles.rangeGroup}>
            <span className={styles.rangeLabel}>From:</span>
            <input
              type="date"
              className={styles.pickerInput}
              value={fromDate || ''}
              onChange={(e) => onRangeChange({ fromDate: e.target.value, toDate })}
            />
            <span className={styles.rangeLabel}>To:</span>
            <input
              type="date"
              className={styles.pickerInput}
              value={toDate || ''}
              onChange={(e) => onRangeChange({ fromDate, toDate: e.target.value })}
            />

            <div className={styles.presetGroup}>
              <button type="button" className={styles.presetBtn} onClick={() => setRangePreset('7days')}>Last 7 Days</button>
              <button type="button" className={styles.presetBtn} onClick={() => setRangePreset('30days')}>Last 30 Days</button>
              <button type="button" className={styles.presetBtn} onClick={() => setRangePreset('thisMonth')}>This Month</button>
              <button type="button" className={styles.presetBtn} onClick={() => setRangePreset('lastMonth')}>Last Month</button>
            </div>
          </div>
        )}

        {/* --- ALL RECORDS MODE --- */}
        {viewMode === 'all' && (
          <div className={styles.allTimeBadge}>
            <Globe size={15} /> Showing all historical records in database
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceDateSelector;
