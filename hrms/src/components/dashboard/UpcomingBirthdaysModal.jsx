import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Cake,
  Calendar,
  Search,
  Sparkles,
  Building,
  User,
  PartyPopper
} from 'lucide-react';
import employeeService from '../../services/employeeService';
import styles from './UpcomingBirthdaysModal.module.css';

/**
 * Parses DOB strings in formats: YYYY-MM-DD, DD-MM-YYYY, YYYY/MM/DD, DD/MM/YYYY
 */
const parseDobMonthDay = (dobStr) => {
  if (!dobStr) return null;
  const str = String(dobStr).trim();

  // YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }

  // DD-MM-YYYY or DD/MM/YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    return {
      day: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      year: parseInt(match[3], 10)
    };
  }

  return null;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Computes birthday metrics relative to reference date (today)
 */
const computeBirthdayDetails = (emp, referenceDate = new Date()) => {
  if (!emp || !emp.dob) return null;

  const parsed = parseDobMonthDay(emp.dob);
  if (!parsed || !parsed.month || !parsed.day) return null;

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;
  const todayDay = referenceDate.getDate();

  const todayMidnight = new Date(currentYear, referenceDate.getMonth(), todayDay);
  let nextBday = new Date(currentYear, parsed.month - 1, parsed.day);

  if (nextBday < todayMidnight) {
    nextBday = new Date(currentYear + 1, parsed.month - 1, parsed.day);
  }

  const diffDays = Math.round((nextBday.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  const isThisMonth = parsed.month === currentMonth;
  const formattedDate = `${parsed.day} ${MONTH_NAMES[parsed.month - 1]}`;
  const turningAge = parsed.year ? nextBday.getFullYear() - parsed.year : null;

  return {
    id: emp.id || emp._id || emp.employeeId,
    employeeId: emp.employeeId || emp.employeeCode || '—',
    name: emp.name || emp.employeeName || 'Staff Member',
    gender: emp.gender || 'Male',
    department: emp.department || 'Security',
    designation: emp.designation || 'Security Personnel',
    clientName: emp.clientName || emp.companyName || 'RR Security & Facilities',
    contact: emp.contact || emp.mobile || '',
    mobile: emp.mobile || emp.contact || '',
    email: emp.email || '',
    photo: emp.employeePhoto || emp.photo || null,
    dob: emp.dob,
    birthDay: parsed.day,
    birthMonth: parsed.month,
    birthYear: parsed.year,
    formattedDate,
    daysLeft: diffDays,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
    isThisMonth,
    turningAge
  };
};

function UpcomingBirthdaysModal({
  isOpen,
  onClose,
  initialList = [],
  companyId = '',
  companyName = ''
}) {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'thisMonth' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // If initialList is empty or incomplete, fetch employees from service to ensure complete data
  useEffect(() => {
    if (!isOpen) return;

    if (initialList && initialList.length > 0) {
      setAllEmployees(initialList);
      return;
    }

    let isMounted = true;
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const empData = await employeeService.getEmployees(companyId);
        if (isMounted) {
          setAllEmployees(empData || []);
        }
      } catch (err) {
        console.error('Failed to load employees for birthday modal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialList, companyId]);

  // Transform and calculate nearest upcoming birthdays
  const processedBirthdays = useMemo(() => {
    const list = (allEmployees || [])
      .map((e) => (e.formattedDate && e.daysLeft !== undefined ? e : computeBirthdayDetails(e)))
      .filter(Boolean);

    // Sort by daysLeft ascending (closest upcoming first)
    list.sort((a, b) => a.daysLeft - b.daysLeft);
    return list;
  }, [allEmployees]);

  // Current month label
  const now = new Date();
  const currentMonthLabel = MONTH_NAMES[now.getMonth()];

  // Counts for tabs
  const upcomingCount = processedBirthdays.filter((b) => b.daysLeft <= 30).length;
  const thisMonthCount = processedBirthdays.filter((b) => b.isThisMonth).length;
  const allCount = processedBirthdays.length;

  // Has someone birthday today?
  const todayBirthdayList = processedBirthdays.filter((b) => b.isToday);

  // Filtered items based on activeTab and searchTerm
  const filteredBirthdays = useMemo(() => {
    let result = processedBirthdays;

    if (activeTab === 'upcoming') {
      result = result.filter((b) => b.daysLeft <= 30);
    } else if (activeTab === 'thisMonth') {
      result = result.filter((b) => b.isThisMonth);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.employeeId.toLowerCase().includes(q) ||
          b.department.toLowerCase().includes(q) ||
          b.designation.toLowerCase().includes(q) ||
          b.clientName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [processedBirthdays, activeTab, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Cake size={24} />
            </div>
            <div>
              <h2 className={styles.title}>
                <span>Upcoming Birthdays</span>
                <Sparkles size={18} color="#ec4899" />
              </h2>
              <p className={styles.sub}>
                Workforce milestone celebrations for {companyName || 'RR Security & Facilities'} ({currentMonthLabel} {now.getFullYear()}).
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Controls Bar (Filter Tabs + Search) */}
        <div className={styles.controlsBar}>
          <div className={styles.tabsGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <span>Next 30 Days</span>
              <span className={styles.countBadge}>{upcomingCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'thisMonth' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('thisMonth')}
            >
              <span>{currentMonthLabel}</span>
              <span className={styles.countBadge}>{thisMonthCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All Birthdays</span>
              <span className={styles.countBadge}>{allCount}</span>
            </button>
          </div>

          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search employee, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Today Celebration Highlight Banner */}
          {todayBirthdayList.length > 0 && (
            <div className={styles.todayBanner}>
              <div className={styles.todayBannerIcon}>
                <PartyPopper size={18} />
              </div>
              <div>
                🎉 <strong>Today's Birthday:</strong>{' '}
                {todayBirthdayList.map((t) => `${t.name} (${t.employeeId})`).join(', ')} — Don't forget to wish them!
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className={styles.emptyState}>
              <Cake size={32} color="#ec4899" className="animate-pulse" />
              <p className={styles.emptyTitle}>Loading employee birthdays...</p>
            </div>
          ) : filteredBirthdays.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Cake size={28} />
              </div>
              <h4 className={styles.emptyTitle}>No Birthdays in this View</h4>
              <p className={styles.emptyDesc}>
                {activeTab === 'upcoming'
                  ? 'There are no employee birthdays in the next 30 days.'
                  : activeTab === 'thisMonth'
                  ? `No employee birthdays recorded for ${currentMonthLabel}.`
                  : 'No employee date of birth records found in this company profile.'}
              </p>
              {activeTab !== 'all' && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setActiveTab('all')}
                  style={{ width: 'auto', marginTop: '6px' }}
                >
                  View All Team Birthdays ({allCount})
                </button>
              )}
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredBirthdays.map((item) => {
                const initials = item.name
                  ? item.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'EM';

                return (
                  <div
                    key={item.id}
                    className={`${styles.bdayCard} ${item.isToday ? styles.bdayCardToday : ''}`}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.empProfile}>
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.name}
                            className={styles.avatar}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={styles.avatarFallback}
                          style={{ display: item.photo ? 'none' : 'flex' }}
                        >
                          {initials}
                        </div>
                        <div className={styles.empMeta}>
                          <h4 className={styles.empName} title={item.name}>
                            {item.name}
                          </h4>
                          <span className={styles.empCode}>{item.employeeId}</span>
                        </div>
                      </div>

                      {/* Status Countdown Badge */}
                      {item.isToday ? (
                        <span className={styles.badgeToday}>
                          🎉 Today!
                        </span>
                      ) : item.isTomorrow ? (
                        <span className={styles.badgeUpcoming}>
                          Tomorrow
                        </span>
                      ) : item.daysLeft <= 30 ? (
                        <span className={styles.badgeUpcoming}>
                          In {item.daysLeft} days
                        </span>
                      ) : (
                        <span className={styles.badgeNeutral}>
                          In {item.daysLeft} days
                        </span>
                      )}
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className={styles.cardDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>🎂 Birthday Date</span>
                        <span className={`${styles.detailValue} ${styles.highlightBdayDate}`}>
                          {item.formattedDate} {item.turningAge ? `(${item.turningAge} yrs)` : ''}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Department</span>
                        <span className={styles.detailValue}>{item.department}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Designation</span>
                        <span className={styles.detailValue}>{item.designation}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Client Unit</span>
                        <span className={styles.detailValue} title={item.clientName}>
                          {item.clientName}
                        </span>
                      </div>
                      {item.contact && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Contact</span>
                          <span className={styles.detailValue}>{item.contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerInfo}>
            Showing {filteredBirthdays.length} of {allCount} employees with birthdays on file.
          </span>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpcomingBirthdaysModal;
