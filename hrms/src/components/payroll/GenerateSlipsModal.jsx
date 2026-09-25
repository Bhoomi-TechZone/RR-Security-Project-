import React, { useState } from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import styles from './GenerateSlipsModal.module.css';

export default function GenerateSlipsModal({
  isOpen,
  onClose,
  selectedMonth = '2026-08',
  monthLabel = 'August 2026',
  companies = [],
  departments = [],
  onConfirm
}) {
  const [client, setClient] = useState('all');
  const [department, setDepartment] = useState('all');
  const totalEmployees = 1184;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ client, department, totalEmployees });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <Printer size={20} className={styles.icon} />
            <h2>Generate Salary Slips</h2>
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
              <label className={styles.label}>Salary Month</label>
              <input
                type="text"
                className={styles.input}
                value={monthLabel}
                readOnly
              />
            </div>

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

            <div className={styles.statBox}>
              <div className={styles.statItem}>
                <span>Target Employees</span>
                <strong>{totalEmployees.toLocaleString('en-IN')}</strong>
              </div>
              <div className={styles.statItem}>
                <span>Status</span>
                <strong className={styles.textGreen}>Ready for Generation</strong>
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
              className={styles.generateBtn}
            >
              <Printer size={16} />
              <span>Generate Slips</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
