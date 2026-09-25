import React, { useState } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import styles from './PayrollExportModal.module.css';

export default function PayrollExportModal({
  isOpen,
  selectedMonth = '2026-08',
  monthLabel = 'August 2026',
  companies = [],
  departments = [],
  onClose,
  onExport
}) {
  const [client, setClient] = useState('all');
  const [department, setDepartment] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const [format, setFormat] = useState('excel');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport({ client, department, reportType, format });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <FileSpreadsheet size={20} className={styles.icon} />
            <h2>Export Payroll</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close export modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Month</label>
              <input
                type="text"
                className={styles.input}
                value={monthLabel}
                readOnly
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Client</label>
                <select
                  className={styles.select}
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                >
                  <option value="all">All Clients</option>
                  {companies.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Department</label>
                <select
                  className={styles.select}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id || d.name || d} value={d.name || d}>
                      {d.name || d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Report Type</label>
              <select
                className={styles.select}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="summary">Payroll Summary (Disbursement totals &amp; KPI metrics)</option>
                <option value="detailed">Detailed Payroll (Employee-level breakdown &amp; attendance)</option>
                <option value="components">Salary Components (Fixed earnings &amp; deduction ledger)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Export Format</label>
              <div className={styles.radioGrid}>
                <label className={format === 'excel' ? styles.radioActive : styles.radio}>
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={format === 'excel'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className={format === 'csv' ? styles.radioActive : styles.radio}>
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>CSV (.csv)</span>
                </label>
                <label className={format === 'pdf' ? styles.radioActive : styles.radio}>
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>PDF (.pdf)</span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.exportBtn}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
