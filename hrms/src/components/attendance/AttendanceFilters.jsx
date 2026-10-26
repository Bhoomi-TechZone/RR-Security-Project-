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
  Globe,
  User,
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

const MONTH_OPTIONS = [
  { value: '', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
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
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

const formatDisplayWeek = (startStr, endStr) => {
  if (!startStr || !endStr) return '—';
  const d1 = new Date(startStr + 'T00:00:00');
  const d2 = new Date(endStr + 'T00:00:00');
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return `${startStr} - ${endStr}`;
  const p1 = d1.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const p2 = d2.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${p1} - ${p2}`;
};

function AttendanceFilters({
  filters,
  onChange,
  onReset,
  timeframe = 'month',
  onTimeframeChange,
  activeTab,
  selectedMonth,
  onMonthChange,
  selectedDate,
  onDateChange,
  selectedWeekDate,
  onWeekDateChange,
  weekRange,
  onPrevWeek,
  onNextWeek,
  selectedYear,
  onYearChange,
  fromDate,
  toDate,
  onRangeChange,
  records = [],
  clients = [],
  sites = [],
  departments = [],
  employees = [],
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

  const dynamicEmployees = React.useMemo(() => {
    const map = new Map();
    (employees || []).forEach((e) => {
      const id = String(e.employeeId || e.employeeCode || e._id || '').trim();
      if (!id) return;
      const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || e.employeeName || id;
      map.set(id, { id, name: fullName, code: e.employeeId || e.employeeCode || '' });
    });
    (records || []).forEach((r) => {
      const id = String(r.employeeId || '').trim();
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, { id, name: r.employeeName || id, code: id });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, records]);

  const yearsList = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  const selectedMonthNum = React.useMemo(() => {
    if (selectedMonth) {
      const parts = selectedMonth.split('-');
      return parts.length === 2 ? parts[1] : selectedMonth;
    }
    if (selectedDate && selectedDate.length >= 7) {
      return selectedDate.slice(5, 7);
    }
    return '';
  }, [selectedDate, selectedMonth]);

  const selectedYearVal = React.useMemo(() => {
    if (selectedMonth && selectedMonth.length >= 4) {
      return selectedMonth.slice(0, 4);
    }
    if (selectedYear) return String(selectedYear);
    if (selectedDate && selectedDate.length >= 4) {
      return selectedDate.slice(0, 4);
    }
    return '';
  }, [selectedDate, selectedYear, selectedMonth]);

  const handleMonthSelect = (mVal) => {
    const currentY = selectedYearVal || String(new Date().getFullYear());
    const fullMonthStr = mVal ? `${currentY}-${mVal}` : '';
    if (onMonthChange) onMonthChange(fullMonthStr);

    if (activeTab === 'daily' || activeTab === 'monthly') {
      if (mVal) {
        const baseDate = selectedDate || `${currentY}-${mVal}-01`;
        const [y, , d] = baseDate.split('-').map(Number);
        const mIdx = parseInt(mVal, 10) - 1;
        const maxD = new Date(y, mIdx + 1, 0).getDate();
        const safeD = Math.min(d || 1, maxD);
        const newDate = `${y}-${mVal}-${String(safeD).padStart(2, '0')}`;
        if (onDateChange) onDateChange(newDate);
      }
    }
  };

  const handleYearSelect = (yVal) => {
    if (onYearChange) onYearChange(yVal);

    if (activeTab === 'daily' || activeTab === 'monthly') {
      if (yVal) {
        const currentM = selectedMonthNum || String(new Date().getMonth() + 1).padStart(2, '0');
        const baseDate = selectedDate || `${yVal}-${currentM}-01`;
        const [, m, d] = baseDate.split('-').map(Number);
        const mIdx = (m || 1) - 1;
        const maxD = new Date(Number(yVal), mIdx + 1, 0).getDate();
        const safeD = Math.min(d || 1, maxD);
        const newDate = `${yVal}-${String(mIdx + 1).padStart(2, '0')}-${String(safeD).padStart(2, '0')}`;
        if (onDateChange) onDateChange(newDate);
      }
    }
  };

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

        {/* Timeframe Controls — Context-sensitive based on activeTab */}
        {activeTab ? (
          <>
            {activeTab === 'daily' && (
              <div className={styles.selectWrap} style={{ minWidth: '160px' }}>
                <span className={styles.filterIcon}>
                  <Calendar size={14} />
                </span>
                <input
                  type="date"
                  className={styles.selectWithIcon}
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange(e.target.value)}
                  title="Filter by Date (Default: Current Date)"
                  aria-label="Filter by Date"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}

            {activeTab === 'weekly' && (
              <div className={styles.timeframeGroup}>
                <span style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                  <CalendarDays size={15} color="#1e40af" />
                </span>
                <div className={styles.dateNavControl}>
                  <button
                    type="button"
                    className={styles.navArrowBtn}
                    onClick={onPrevWeek}
                    title="Previous week"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className={styles.dateDisplayLabel}>
                    {formatDisplayWeek(weekRange?.start, weekRange?.end)}
                  </span>
                  <button
                    type="button"
                    className={styles.navArrowBtn}
                    onClick={onNextWeek}
                    title="Next week"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <input
                    type="date"
                    className={styles.inputControl}
                    value={selectedWeekDate || weekRange?.start || ''}
                    onChange={(e) => onWeekDateChange && onWeekDateChange(e.target.value)}
                    title="Select date for week of any month and year"
                    aria-label="Select date for weekly filter"
                    style={{ width: '130px', padding: '4px 6px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className={styles.timeframeGroup}>
                <span style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                  <CalendarRange size={15} color="#1e40af" />
                </span>
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
              </div>
            )}
          </>
        ) : (
          <div className={styles.timeframeGroup}>
            <span style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
              {getTimeframeIcon()}
            </span>
            <select
              className={styles.timeframeSelect}
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              title="Filter by Timeframe"
            >
              {TIMEFRAME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

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
              <div className={styles.selectWrap} style={{ minWidth: '160px' }}>
                <span className={styles.filterIcon}>
                  <Calendar size={14} />
                </span>
                <input
                  type="date"
                  className={styles.selectWithIcon}
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange(e.target.value)}
                  title="Filter by Date (Default: Current Date)"
                  aria-label="Filter by Date"
                  style={{ cursor: 'pointer' }}
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
        )}

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

        {/* All Employees Filter Dropdown (just beside All Sites) */}
        <div className={styles.selectWrap}>
          <span className={styles.filterIcon}>
            <User size={14} />
          </span>
          <select
            className={styles.selectWithIcon}
            value={filters.employeeId || ''}
            onChange={(e) => handleChange('employeeId', e.target.value)}
            title="Filter by Employee"
          >
            <option value="">All Employees</option>
            {dynamicEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.code && emp.code !== emp.name ? `(${emp.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Month & Year Filter Dropdowns - Shown in Monthly Tab */}
        {activeTab === 'monthly' && (
          <>
            {/* Month Filter Dropdown */}
            <div className={styles.selectWrap}>
              <span className={styles.filterIcon}>
                <Calendar size={14} />
              </span>
              <select
                className={styles.selectWithIcon}
                value={selectedMonthNum}
                onChange={(e) => handleMonthSelect(e.target.value)}
                title="Filter by Month"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Year Filter Dropdown */}
            <div className={styles.selectWrap}>
              <span className={styles.filterIcon}>
                <CalendarRange size={14} />
              </span>
              <select
                className={styles.selectWithIcon}
                value={selectedYearVal}
                onChange={(e) => handleYearSelect(e.target.value)}
                title="Filter by Year"
              >
                <option value="">All Years</option>
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </>
        )}

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
