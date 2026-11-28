import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Award,
  Cake,
  Calendar,
  ChevronDown,
  Heart,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import styles from './UpcomingEventsPage.module.css';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EVENT_META = {
  'work-anniversary': {
    label: 'Work Anniversary',
    icon: Award,
    pillBg: '#fef3c7',
    pillColor: '#b45309'
  },
  birthday: {
    label: 'Birthday',
    icon: Cake,
    pillBg: '#fdf2f8',
    pillColor: '#be185d'
  },
  'wedding-anniversary': {
    label: 'Wedding Anniversary',
    icon: Heart,
    pillBg: '#fff1f2',
    pillColor: '#e11d48'
  }
};

function parseDateParts(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }

  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const n1 = parseInt(match[1], 10);
    const n2 = parseInt(match[2], 10);
    const yr = parseInt(match[3], 10);
    if (n2 > 12 && n1 <= 12) return { month: n1, day: n2, year: yr };
    if (n1 > 12 && n2 <= 12) return { day: n1, month: n2, year: yr };
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    return { day: n1, month: n2, year: yr };
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  return null;
}

function getInitials(name = '') {
  return (
    String(name || 'EM')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'EM'
  );
}

export default function UpcomingEventsPage() {
  const location = useLocation();
  const isUserPanel = location.pathname.startsWith('/user');
  const LayoutComponent = isUserPanel ? UserLayout : AdminLayout;
  const dashboardPath = isUserPanel ? '/user/dashboard' : '/admin/dashboard';

  const { activeCompanyId } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState([]); // empty = All Months
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('upcoming'); // 'all' | 'upcoming' | 'past'

  const monthDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const list = await employeeService.getEmployees(activeCompanyId);
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load employees for events:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Build events list according to timelineFilter: 'all' | 'upcoming' | 'past'
  const allEvents = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const todayMidnight = new Date(currentYear, now.getMonth(), now.getDate());
    const msPerDay = 1000 * 60 * 60 * 24;
    const list = [];

    const pushOccasion = (emp, rawDate, type) => {
      if (!rawDate) return;
      const parsed = parseDateParts(rawDate);
      if (!parsed || !parsed.month || !parsed.day) return;

      let occDate;
      if (timelineFilter === 'upcoming') {
        occDate = new Date(currentYear, parsed.month - 1, parsed.day);
        if (occDate < todayMidnight) {
          occDate = new Date(currentYear + 1, parsed.month - 1, parsed.day);
        }
      } else if (timelineFilter === 'past') {
        occDate = new Date(currentYear, parsed.month - 1, parsed.day);
        if (occDate >= todayMidnight) {
          occDate = new Date(currentYear - 1, parsed.month - 1, parsed.day);
        }
      } else {
        // 'all' -> current calendar year (Jan..Dec)
        occDate = new Date(currentYear, parsed.month - 1, parsed.day);
      }

      const occMonth = occDate.getMonth() + 1;
      const occYear = occDate.getFullYear();
      const diffDays = Math.round((occDate.getTime() - todayMidnight.getTime()) / msPerDay);
      const years = parsed.year ? occYear - parsed.year : null;

      if (type === 'work-anniversary' && years !== null && years < 0) return;

      const empName = emp.name || emp.employeeName || 'Staff';
      const empCode = emp.employeeCode || emp.employeeId || emp.code || '—';
      const monthDay = `${SHORT_MONTHS[parsed.month - 1]} ${String(parsed.day).padStart(2, '0')}`;

      list.push({
        id: `${type}-${emp._id || emp.employeeId || empCode}-${occMonth}-${parsed.day}-${occYear}`,
        type,
        employeeName: empName,
        employeeCode: empCode,
        department: emp.department || '—',
        designation: emp.designation || '—',
        month: occMonth,
        monthDay,
        diffDays,
        years
      });
    };

    employees.forEach((emp) => {
      if (String(emp.status || '').toLowerCase() === 'inactive') return;
      pushOccasion(emp, emp.dob, 'birthday');
      pushOccasion(emp, emp.joiningDate, 'work-anniversary');
      pushOccasion(emp, emp.marriageDate || emp.marriedDate, 'wedding-anniversary');
    });

    if (timelineFilter === 'past') {
      list.sort((a, b) => b.diffDays - a.diffDays); // most recent past first
    } else if (timelineFilter === 'upcoming') {
      list.sort((a, b) => a.diffDays - b.diffDays);
    } else {
      list.sort((a, b) => a.diffDays - b.diffDays);
    }
    return list;
  }, [employees, timelineFilter]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEvents.filter((ev) => {
      if (typeFilter !== 'all' && ev.type !== typeFilter) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(ev.month)) return false;
      if (q) {
        const meta = EVENT_META[ev.type];
        const hay = `${ev.employeeName} ${ev.employeeCode} ${ev.department} ${ev.designation} ${meta?.label || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allEvents, search, typeFilter, selectedMonths]);

  const toggleMonth = (monthNum) => {
    setSelectedMonths((prev) =>
      prev.includes(monthNum) ? prev.filter((m) => m !== monthNum) : [...prev, monthNum].sort((a, b) => a - b)
    );
  };

  const monthButtonLabel = useMemo(() => {
    if (selectedMonths.length === 0) return 'All Months';
    if (selectedMonths.length <= 3) {
      return selectedMonths.map((m) => SHORT_MONTHS[m - 1]).join(', ');
    }
    return `${selectedMonths.length} Months Selected`;
  }, [selectedMonths]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setSelectedMonths([]);
    setTimelineFilter('upcoming');
    setMonthDropdownOpen(false);
  };

  return (
    <LayoutComponent>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to={dashboardPath}>Dashboard</Link>
          <span>/</span>
          <strong>Events</strong>
        </div>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.titleGroup}>
            <h1>Events</h1>
            <p>Employee Birthdays, Work Anniversaries, and Wedding Anniversaries across the calendar.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={fetchEmployees}
              title="Refresh Events"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className={styles.filterCard}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Search Employee</label>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                type="text"
                className={styles.input}
                placeholder="Search by name, code, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Event Type</label>
            <select
              className={styles.select}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Event Types</option>
              <option value="birthday">Birthday</option>
              <option value="work-anniversary">Work Anniversary</option>
              <option value="wedding-anniversary">Wedding Anniversary</option>
            </select>
          </div>

          <div className={styles.field} ref={monthDropdownRef}>
            <label className={styles.fieldLabel}>Months</label>
            <div className={styles.multiSelectWrap}>
              <button
                type="button"
                className={styles.multiSelectBtn}
                onClick={() => setMonthDropdownOpen((o) => !o)}
                aria-expanded={monthDropdownOpen}
              >
                <span className={styles.multiSelectText}>{monthButtonLabel}</span>
                <ChevronDown size={15} />
              </button>
              {monthDropdownOpen && (
                <div className={styles.multiSelectMenu}>
                  <div className={styles.multiSelectHeader}>
                    <button
                      type="button"
                      className={styles.multiSelectAction}
                      onClick={() => setSelectedMonths([])}
                    >
                      All Months
                    </button>
                    <button
                      type="button"
                      className={styles.multiSelectAction}
                      onClick={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                    >
                      Select All
                    </button>
                  </div>
                  <div className={styles.multiSelectList}>
                    {FULL_MONTHS.map((mName, idx) => {
                      const monthNum = idx + 1;
                      const checked = selectedMonths.includes(monthNum);
                      return (
                        <label key={mName} className={styles.multiSelectItem}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMonth(monthNum)}
                          />
                          <span>{mName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Timeline</label>
            <select
              className={styles.select}
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          <button type="button" className={styles.secondaryButton} onClick={resetFilters}>
            Reset
          </button>
        </div>

        {/* Events Table */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={30} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No events found matching your filters.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department &amp; Role</th>
                    <th>Event Type</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev, idx) => {
                    const meta = EVENT_META[ev.type] || EVENT_META.birthday;
                    const Icon = meta.icon;

                    const showYears =
                      (ev.type === 'work-anniversary' || ev.type === 'wedding-anniversary') &&
                      ev.years !== null &&
                      ev.years >= 0;
                    const eventTypeLabel = showYears ? `${meta.label} (${ev.years} yr)` : meta.label;

                    let statusText = '';
                    let statusClass = styles.tagLater;
                    if (ev.diffDays === 0) {
                      statusText = 'Today';
                      statusClass = styles.tagToday;
                    } else if (ev.diffDays === 1) {
                      statusText = 'Tomorrow';
                      statusClass = styles.tagToday;
                    } else if (ev.diffDays > 1) {
                      statusText = `In ${ev.diffDays} Days`;
                      statusClass = ev.diffDays <= 7 ? styles.tagSoon : styles.tagLater;
                    } else if (ev.diffDays === -1) {
                      statusText = 'Yesterday';
                      statusClass = styles.tagPast;
                    } else {
                      statusText = `${Math.abs(ev.diffDays)} Days Ago`;
                      statusClass = styles.tagPast;
                    }

                    return (
                      <tr key={`${ev.id}-${idx}`}>
                        <td>
                          <div className={styles.empCell}>
                            <span className={styles.avatar}>{getInitials(ev.employeeName)}</span>
                            <div>
                              <span className={styles.empName}>{ev.employeeName}</span>
                              <span className={styles.empCode}>{ev.employeeCode}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{ev.department}</div>
                          <small style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>{ev.designation}</small>
                        </td>
                        <td>
                          <span
                            className={styles.typePill}
                            style={{ backgroundColor: meta.pillBg, color: meta.pillColor }}
                          >
                            <Icon size={13} />
                            {eventTypeLabel}
                          </span>
                        </td>
                        <td>
                          <span className={styles.dateBadge}>{ev.monthDay}</span>
                        </td>
                        <td>
                          <span className={`${styles.countdownTag} ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LayoutComponent>
  );
}
