import React from 'react';
import {
  Search,
  RotateCcw,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Clock,
  Globe
} from 'lucide-react';
import styles from './AttendanceFilters.module.css';

const DEFAULT_SITES = ['Main Gate', 'Warehouse', 'Office Building', 'Hospital Block', 'Parking Area', 'Main Site', 'HQ Tower'];
const DEFAULT_DEPTS = ['Security', 'Operations', 'Administration', 'HR', 'Accounts', 'Housekeeping', 'Facility Management'];
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'On Leave' },
  { value: 'late', label: 'Late / Early' },
];

const TIMEFRAME_OPTIONS = [
  { value: 'month', label: 'Current Month' },
  { value: 'date', label: 'Single Date' },
  { value: 'range', label: 'Date Range' },
  { value: 'year', label: 'Specific Year' },
  { value: 'all', label: 'All Records' },
];

const formatDisplayMonth = (monthStr) => {
  if (!monthStr) return '—';
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const addMonths = (monthStr, n) => {
  const [y, m] = (monthStr || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  const nextY = d.getFullYear();
  const nextM = String(d.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
};

const addDays = (dateStr, n) => {
  const d = new Date((dateStr || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

function AttendanceFilters({
  filters,
  onChange,
  onReset,
  timeframe = 'month',
  onTimeframeChange,
  selectedMonth,
  onMonthChange,
  selectedDate,
  onDateChange,
  selectedYear,
  onYearChange,
  fromDate,
  toDate,
  onRangeChange,
  records = [],
  clients = [],
  sites = [],
  departments = [],
}) {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  // Merge dynamic options from master list and current records
  const dynamicClients = Array.from(
    new Set([
      ...clients.map((c) => c.clientName || c.name || c),
      ...records.map((r) => r.companyName || r.clientName).filter(Boolean),
    ])
  ).filter(Boolean);

  const dynamicSites = Array.from(
    new Set([
      ...DEFAULT_SITES,
      ...sites.map((s) => s.name || s),
      ...records.map((r) => r.site).filter(Boolean),
    ])
  ).filter(Boolean);

  const dynamicDepts = Array.from(
    new Set([
      ...DEFAULT_DEPTS,
      ...departments.map((d) => d.name || d),
      ...records.map((r) => r.department).filter(Boolean),
    ])
  ).filter(Boolean);

  const yearsList = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  const getTimeframeIcon = () => {
    switch (timeframe) {
      case 'date': return <CalendarDays size={15} color="#1e40af" />;
      case 'range': return <CalendarRange size={15} color="#1e40af" />;
      case 'year': return <Clock size={15} color="#1e40af" />;
      case 'all': return <Globe size={15} color="#1e40af" />;
      default: return <Calendar size={15} color="#1e40af" />;
    }
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.bar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Search employee name or ID…"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Timeframe Filter Dropdown Selector */}
        <div className={styles.timeframeGroup}>
          <span style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
            {getTimeframeIcon()}
          </span>
          <select
            className={styles.timeframeSelect}
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            title="Filter by Timeframe (Current Month, Single Date, Date Range, Year, All Records)"
          >
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Context-Sensitive Timeframe Controls */}
          {timeframe === 'month' && (
            <div className={styles.dateNavControl}>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => onMonthChange(addMonths(selectedMonth, -1))}
                title="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.dateDisplayLabel}>{formatDisplayMonth(selectedMonth)}</span>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
                title="Next month"
              >
                <ChevronRight size={14} />
              </button>
              <input
                type="month"
                className={styles.inputControl}
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                style={{ width: '130px', padding: '4px 6px' }}
              />
            </div>
          )}

          {timeframe === 'date' && (
            <div className={styles.dateNavControl}>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                title="Previous day"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.dateDisplayLabel}>{formatDisplayDate(selectedDate)}</span>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => onDateChange(addDays(selectedDate, 1))}
                title="Next day"
              >
                <ChevronRight size={14} />
              </button>
              <input
                type="date"
                className={styles.inputControl}
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                style={{ width: '130px', padding: '4px 6px' }}
              />
            </div>
          )}

          {timeframe === 'range' && (
            <div className={styles.rangeInputs}>
              <span className={styles.rangeText}>From:</span>
              <input
                type="date"
                className={styles.inputControl}
                value={fromDate || ''}
                onChange={(e) => onRangeChange({ fromDate: e.target.value, toDate })}
                style={{ width: '125px', padding: '4px 6px' }}
              />
              <span className={styles.rangeText}>To:</span>
              <input
                type="date"
                className={styles.inputControl}
                value={toDate || ''}
                onChange={(e) => onRangeChange({ fromDate, toDate: e.target.value })}
                style={{ width: '125px', padding: '4px 6px' }}
              />
            </div>
          )}

          {timeframe === 'year' && (
            <div className={styles.dateNavControl}>
              <select
                className={styles.inputControl}
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Client Dropdown with SVG Icon */}
        <div className={styles.selectWrap}>
          <span className={styles.filterIcon}>
            <Building2 size={14} />
          </span>
          <select
            className={styles.selectWithIcon}
            value={filters.companyId || ''}
            onChange={(e) => handleChange('companyId', e.target.value)}
          >
            <option value="">All Clients</option>
            {dynamicClients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Site Dropdown with SVG Icon */}
        <div className={styles.selectWrap}>
          <span className={styles.filterIcon}>
            <MapPin size={14} />
          </span>
          <select
            className={styles.selectWithIcon}
            value={filters.site || ''}
            onChange={(e) => handleChange('site', e.target.value)}
          >
            <option value="">All Sites</option>
            {dynamicSites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Department Dropdown with SVG Icon */}
        <div className={styles.selectWrap}>
          <span className={styles.filterIcon}>
            <Briefcase size={14} />
          </span>
          <select
            className={styles.selectWithIcon}
            value={filters.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
          >
            <option value="">All Departments</option>
            {dynamicDepts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown with SVG Icon */}
        <div className={styles.selectWrap}>
          <span className={styles.filterIcon}>
            <ShieldCheck size={14} />
          </span>
          <select
            className={styles.selectWithIcon}
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <button className={styles.resetBtn} onClick={onReset} title="Reset all filters">
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}

export default AttendanceFilters;
