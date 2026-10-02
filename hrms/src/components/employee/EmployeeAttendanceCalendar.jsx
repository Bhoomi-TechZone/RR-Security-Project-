import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './EmployeeAttendanceCalendar.module.css';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function EmployeeAttendanceCalendar({ records = [], monthLabel = '', monthKey = '', year, monthNumber, onPreviousMonth, onNextMonth }) {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const curYear = year || (monthKey ? parseInt(monthKey.split('-')[0], 10) : new Date().getFullYear());
  const curMonth = monthNumber || (monthKey ? parseInt(monthKey.split('-')[1], 10) : new Date().getMonth() + 1);

  const firstDay = new Date(curYear, curMonth - 1, 1).getDay();
  // In JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const leadingDays = (firstDay + 6) % 7;
  const daysInMonth = new Date(curYear, curMonth, 0).getDate();

  const recordsMap = useMemo(() => {
    const map = {};
    if (Array.isArray(records)) {
      records.forEach((r) => {
        if (r && r.date) {
          const dStr = typeof r.date === 'string' ? r.date.split('T')[0] : '';
          if (dStr) {
            map[dStr] = r;
          }
        }
      });
    }
    return map;
  }, [records]);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < leadingDays; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(curYear, curMonth - 1, d);
      const dayOfWeekName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
      const isWeekend = dayOfWeekName === 'Saturday' || dayOfWeekName === 'Sunday';

      const existingRecord = recordsMap[dayStr];
      if (existingRecord) {
        cells.push(existingRecord);
      } else {
        cells.push({
          id: `cell-${dayStr}`,
          date: dayStr,
          day: dayOfWeekName,
          status: isWeekend ? 'Weekend' : 'No Record',
          checkIn: null,
          checkOut: null,
          workingHours: null,
          isPlaceholder: true,
        });
      }
    }
    return cells;
  }, [leadingDays, daysInMonth, curYear, curMonth, recordsMap]);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Monthly Attendance Calendar</p>
          <h2>{monthLabel}</h2>
        </div>
        <div className={styles.monthControls}>
          <button type="button" onClick={onPreviousMonth} aria-label="Previous month" title="Previous month"><ChevronLeft size={17} /></button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={onNextMonth} aria-label="Next month" title="Next month"><ChevronRight size={17} /></button>
        </div>
      </div>

      <div className={styles.legend} aria-label="Attendance status legend">
        <span><i className={styles.present} />Present</span>
        <span><i className={styles.absent} />Absent</span>
        <span><i className={styles.leave} />Leave</span>
        <span><i className={styles.weekend} />Weekend</span>
      </div>

      <div className={styles.calendar}>
        {weekDays.map((day) => <span key={day} className={styles.weekday}>{day}</span>)}
        {calendarCells.map((record, index) => {
          if (!record) {
            return <div key={`empty-${index}`} className={`${styles.dateCell} ${styles.empty}`} />;
          }

          const dayNumber = parseInt(record.date.slice(-2), 10);
          const statusLower = (record.status || '').toLowerCase().replace(/\s+/g, '');
          const isWeekend = ['saturday', 'sunday'].includes((record.day || '').toLowerCase());

          let cellStatusClass = '';
          if (isWeekend) {
            cellStatusClass = styles.weekend;
          } else if (statusLower === 'present' || statusLower === 'late') {
            cellStatusClass = styles.present;
          } else if (statusLower === 'absent') {
            cellStatusClass = styles.absent;
          } else if (statusLower === 'leave' || statusLower === 'halfday') {
            cellStatusClass = styles.leave;
          }

          return (
            <button
              key={record.id || `cell-${index}`}
              type="button"
              className={`${styles.dateCell} ${cellStatusClass}`}
              onClick={() => setSelectedRecord(record)}
              title={`${record.day || ''}, ${record.date}: ${record.status}`}
            >
              <strong>{dayNumber}</strong>
              <span />
            </button>
          );
        })}
      </div>

      {selectedRecord && (
        <div className={styles.detailPanel}>
          <div>
            <strong>{new Date(`${selectedRecord.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            <span>{selectedRecord.day} | {selectedRecord.status}</span>
          </div>
          <div className={styles.detailValues}>
            <span>Check In <b>{selectedRecord.checkIn || '—'}</b></span>
            <span>Check Out <b>{selectedRecord.checkOut || '—'}</b></span>
            <span>Working Hours <b>{selectedRecord.workingHours || '—'}</b></span>
          </div>
        </div>
      )}
    </section>
  );
}

export default EmployeeAttendanceCalendar;
