import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './EmployeeAttendanceCalendar.module.css';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function EmployeeAttendanceCalendar({ records, monthLabel, onPreviousMonth, onNextMonth }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const firstDay = new Date(`${records[0]?.date.slice(0, 7)}-01T00:00:00`).getDay();
  const leadingDays = (firstDay + 6) % 7;
  const calendarCells = useMemo(() => [
    ...Array.from({ length: leadingDays }, () => null),
    ...records
  ], [leadingDays, records]);

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
        {calendarCells.map((record, index) => (
          <button
            key={record?.id || `empty-${index}`}
            type="button"
            disabled={!record}
            className={`${styles.dateCell} ${record ? (['Saturday', 'Sunday'].includes(record.day) ? styles.weekend : styles[record.status.toLowerCase()]) : styles.empty}`}
            onClick={() => record && setSelectedRecord(record)}
            title={record ? `${record.day}, ${record.date}: ${record.status}` : undefined}
          >
            {record && <><strong>{Number(record.date.slice(-2))}</strong><span /></>}
          </button>
        ))}
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
