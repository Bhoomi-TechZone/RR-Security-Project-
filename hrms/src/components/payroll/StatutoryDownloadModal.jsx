import React, { useState } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import styles from './StatutoryDownloadModal.module.css';

export default function StatutoryDownloadModal({
  isOpen,
  initialType = 'combined',
  monthLabel = 'August 2026',
  onClose,
  onDownload
}) {
  const [reportType, setReportType] = useState(initialType);
  const [format, setFormat] = useState('excel'); // 'excel' | 'csv' | 'pdf'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onDownload({ reportType, format });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <FileSpreadsheet size={20} className={styles.icon} />
            <h2>Download Statutory Report</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Report Type</label>
              <select
                className={styles.select}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="combined">Combined (PF &amp; ESI Statutory Returns)</option>
                <option value="pf">EPF Electronic Challan Cum Return (ECR)</option>
                <option value="esi">ESIC Monthly Contribution Return (Form 5)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Report Month</label>
              <input
                type="text"
                className={styles.input}
                value={monthLabel}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Export File Format</label>
              <div className={styles.radioGrid}>
                <label className={format === 'excel' ? styles.radioLabelActive : styles.radioLabel}>
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={format === 'excel'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className={format === 'csv' ? styles.radioLabelActive : styles.radioLabel}>
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>CSV (.csv)</span>
                </label>
                <label className={format === 'pdf' ? styles.radioLabelActive : styles.radioLabel}>
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <span>PDF Document (.pdf)</span>
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
              className={styles.downloadBtn}
            >
              <Download size={16} />
              <span>Download Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
