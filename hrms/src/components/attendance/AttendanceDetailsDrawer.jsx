import React from 'react';
import { X, User, Building2, MapPin, Clock, AlertCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatTime, getStatusLabel } from '../../data/attendanceData';
import styles from './AttendanceDetailsDrawer.module.css';

function Row({ label, value, highlight }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${highlight ? styles.highlight : ''}`}>{value || '—'}</span>
    </div>
  );
}

function AttendanceDetailsDrawer({ record, onClose, onEdit }) {
  if (!record) return null;

  const isSpecial = record.lateMinutes > 0 || record.earlyOutMinutes > 0;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Attendance Details</h3>
            <p className={styles.subtitle}>{record.date}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Employee info */}
        <div className={styles.empSection}>
          <div className={styles.avatarLarge}
            style={{ background: '#2563eb' }}
          >
            {record.initials}
          </div>
          <div>
            <div className={styles.empName}>{record.employeeName}</div>
            <div className={styles.empId}>{record.employeeId}</div>
            <StatusBadge status={record.status}>
              {getStatusLabel(record.status)}
            </StatusBadge>
          </div>
        </div>

        {/* Location section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Building2 size={14} /> Location
          </div>
          <Row label="Client" value={record.companyName || record.clientName} />
          <Row label="Site" value={record.site} />
          <Row label="Department" value={record.department} />
        </div>

        {/* Timing section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Clock size={14} /> Timing
          </div>
          <Row label="Check In" value={formatTime(record.checkIn)} />
          <Row label="Check Out" value={formatTime(record.checkOut)} />
          <Row label="Working Hours" value={record.workingHours} highlight />
          {record.lateMinutes > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={14} /> Late by {record.lateMinutes} minutes
            </div>
          )}
          {record.earlyOutMinutes > 0 && (
            <div className={`${styles.alert} ${styles.earlyAlert}`}>
              <AlertCircle size={14} /> Left {record.earlyOutMinutes} minutes early
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => { onEdit(record); onClose(); }}>
            Edit Attendance
          </button>
        </div>
      </div>
    </>
  );
}

export default AttendanceDetailsDrawer;
