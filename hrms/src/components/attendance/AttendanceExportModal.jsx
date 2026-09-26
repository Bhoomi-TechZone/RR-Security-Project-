import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { ATTENDANCE_STATUS_OPTIONS } from '../../data/attendanceData';
import styles from './AttendanceExportModal.module.css';

const FORMAT_OPTIONS = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
  { value: 'csv', label: 'CSV (.csv)', icon: '📄' },
  { value: 'pdf', label: 'PDF (.pdf)', icon: '📋' }
];

function AttendanceExportModal({ onClose, onExport, records = [], clients = [], activeCompanyName = 'RR Security' }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    fromDate: today,
    toDate: today,
    companyId: '',
    site: '',
    department: '',
    status: '',
    format: 'excel'
  });

  // Extract dynamic dropdown options directly from actual database / loaded records
  const dynamicClients = Array.from(
    new Set([
      activeCompanyName,
      ...clients.map(c => c.name),
      ...records.map(r => r.companyName || r.clientName)
    ].filter(Boolean))
  );

  const dynamicSites = Array.from(
    new Set(records.map(r => r.site).filter(Boolean))
  );

  const dynamicDepartments = Array.from(
    new Set(records.map(r => r.department).filter(Boolean))
  );

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleExport = (e) => {
    e.preventDefault();
    onExport(form);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Download size={20} className={styles.headerIcon} />
            <div>
              <h3 className={styles.title}>Export Attendance</h3>
              <p className={styles.sub}>Configure and download your attendance report</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form className={styles.body} onSubmit={handleExport}>
          {/* Date range */}
          <div className={styles.sectionTitle}>Date Range</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>From Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.fromDate}
                onChange={(e) => handleChange('fromDate', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>To Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.toDate}
                min={form.fromDate}
                onChange={(e) => handleChange('toDate', e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className={styles.sectionTitle}>Filters (Optional)</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Client</label>
              <select className={styles.input} value={form.companyId} onChange={(e) => handleChange('companyId', e.target.value)}>
                <option value="">All Clients</option>
                {dynamicClients.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Site</label>
              <select className={styles.input} value={form.site} onChange={(e) => handleChange('site', e.target.value)}>
                <option value="">All Sites</option>
                {dynamicSites.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Department</label>
              <select className={styles.input} value={form.department} onChange={(e) => handleChange('department', e.target.value)}>
                <option value="">All Departments</option>
                {dynamicDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select className={styles.input} value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="">All Statuses</option>
                {ATTENDANCE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Format */}
          <div className={styles.sectionTitle}>Export Format</div>
          <div className={styles.formatGrid}>
            {FORMAT_OPTIONS.map((f) => (
              <label key={f.value} className={`${styles.formatOption} ${form.format === f.value ? styles.formatSelected : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value={f.value}
                  checked={form.format === f.value}
                  onChange={() => handleChange('format', f.value)}
                  className={styles.hiddenRadio}
                />
                <span className={styles.formatIcon}>{f.icon}</span>
                <span className={styles.formatLabel}>{f.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.exportBtn}>
              <Download size={15} /> Export Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AttendanceExportModal;
