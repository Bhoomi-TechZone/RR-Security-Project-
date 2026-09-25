import React from 'react';
import { X } from 'lucide-react';
import styles from './EmployeeAttendanceDetails.module.css';

function EmployeeAttendanceDetails({ record, onClose }) {
  if (!record) return null;
  const fields = [['Date', new Date(`${record.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })], ['Day', record.day], ['Status', record.status], ['Check In', record.checkIn || '—'], ['Check Out', record.checkOut || '—'], ['Working Hours', record.workingHours || '—'], ['Shift', record.shift]];

  return <div className={styles.backdrop} onMouseDown={onClose}><aside className={styles.drawer} onMouseDown={(event) => event.stopPropagation()} aria-label="Attendance details"><div className={styles.header}><div><p>Attendance Details</p><h2>{record.status}</h2></div><button type="button" onClick={onClose} aria-label="Close attendance details"><X size={19} /></button></div><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></aside></div>;
}

export default EmployeeAttendanceDetails;
