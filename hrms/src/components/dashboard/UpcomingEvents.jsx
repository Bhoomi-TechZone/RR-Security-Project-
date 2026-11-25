import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import styles from './UpcomingEvents.module.css';

const EVENT_COLORS = {
  'work-anniversary': '#f3c593',
  birthday: '#5b0e2d',
  'wedding-anniversary': '#be185d'
};

const SHORT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Format date string such as "22 Dec" or "22 December" into "Dec 22"
function formatMonthDay(rawDate, formattedDate) {
  const source = rawDate || formattedDate || '';
  const match = String(source).trim().match(/^(\d{1,2})\s+([A-Za-z]+)/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const mon = match[2].slice(0, 3);
    return `${mon} ${day}`;
  }
  const alreadyMonDay = String(source).trim().match(/^([A-Za-z]{3,})\s+(\d{1,2})$/);
  if (alreadyMonDay) {
    return `${alreadyMonDay[1].slice(0, 3)} ${alreadyMonDay[2].padStart(2, '0')}`;
  }
  return source;
}

function isInCurrentOrNextMonth(monthNum, monthDayStr, daysLeft) {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const nextMonth = curMonth === 12 ? 1 : curMonth + 1;

  let resolvedMonth = Number(monthNum) || 0;
  if (!resolvedMonth && monthDayStr) {
    const monMatch = String(monthDayStr).trim().match(/^([A-Za-z]{3})/);
    if (monMatch) {
      const idx = SHORT_MONTHS.indexOf(monMatch[1].toLowerCase());
      if (idx !== -1) resolvedMonth = idx + 1;
    }
  }

  if (resolvedMonth !== curMonth && resolvedMonth !== nextMonth) return false;
  if (daysLeft !== undefined && daysLeft !== null && Number(daysLeft) > 62) return false;
  return true;
}

function UpcomingEvents({ events = [], birthdayFallbackList = [], loading = false }) {
  const navigate = useNavigate();

  // Prefer backend upcomingEvents; strictly filter to current or next month
  const normalizedEvents = useMemo(() => {
    if (Array.isArray(events) && events.length > 0) {
      return events
        .map((ev) => ({
          ...ev,
          monthDay: ev.monthDay || formatMonthDay(ev.date, ev.formattedDate)
        }))
        .filter((ev) => isInCurrentOrNextMonth(ev.month, ev.monthDay, ev.daysLeft));
    }
    if (Array.isArray(birthdayFallbackList) && birthdayFallbackList.length > 0) {
      return birthdayFallbackList
        .map((b, idx) => {
          const loc = (b.siteLocation || b.site || b.clientName || '').trim();
          const monthDay = formatMonthDay(b.shortDate, b.formattedDate);
          return {
            id: `birthday-${b._id || b.id || b.employeeId || idx}-${idx}`,
            type: 'birthday',
            label: `${b.name}'s birthday${loc ? ` (${loc})` : ''}`,
            month: b.birthMonth,
            monthDay,
            daysLeft: b.daysLeft ?? 0,
            link: '/admin/greetings'
          };
        })
        .filter((ev) => isInCurrentOrNextMonth(ev.month, ev.monthDay, ev.daysLeft));
    }
    return [];
  }, [events, birthdayFallbackList]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        </div>
        <div className={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${styles.skeleton} ${styles.skeletonItem}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upcoming Events</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/greetings')}
          className={styles.viewAllBtn}
          title="View greetings & celebrations calendar"
        >
          View All →
        </button>
      </div>

      <div className={styles.list}>
        {normalizedEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={22} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              No upcoming Birthdays, Work Anniversaries, or Wedding Anniversaries.
            </p>
          </div>
        ) : (
          normalizedEvents.map((ev, idx) => {
            const squareColor = EVENT_COLORS[ev.type] || '#5b0e2d';
            const dateLabel = ev.monthDay || formatMonthDay(ev.date, ev.formattedDate);

            return (
              <div
                key={`${ev.id}-${idx}`}
                className={styles.item}
                title={`${ev.label}${dateLabel ? ` (${dateLabel})` : ''}`}
              >
                <div className={styles.itemLeft}>
                  <span
                    className={styles.squareMarker}
                    style={{ backgroundColor: squareColor }}
                    aria-hidden="true"
                  />
                  <span className={styles.label}>{ev.label}</span>
                </div>
                {dateLabel && (
                  <span className={styles.dateBadge}>
                    {dateLabel}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UpcomingEvents;
