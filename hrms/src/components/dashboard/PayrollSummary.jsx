import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './PayrollSummary.module.css';

const parseNum = (v) => Number(String(v || '').replace(/[^0-9.-]/g, '')) || 0;

/**
 * PayrollSummary Component
 * Single unified card showing Overall Payroll by default ("All Clients")
 * or Client-wise Payroll when a specific client is selected.
 */
function PayrollSummary({ overallData, clientWiseData = [], loading }) {
  const [selectedClientId, setSelectedClientId] = useState('all');

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '130px' }} />
          <div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ width: '90px' }} />
        </div>
        <div className={styles.list}>
          {[1, 2, 3].map((idx) => (
            <div key={idx} className={styles.statRow}>
              <div className={`${styles.skeleton} ${styles.skeletonLabel}`} style={{ width: '85px' }} />
              <div className={`${styles.skeleton} ${styles.skeletonVal}`} style={{ width: '95px' }} />
            </div>
          ))}
        </div>
        <div className={styles.progressSection}>
          <div className={`${styles.skeleton} ${styles.skeletonBar}`} />
        </div>
      </div>
    );
  }

  if (!overallData) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>Payroll Summary</h3>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No payroll summary data available.</p>
        </div>
      </div>
    );
  }

  const activeData =
    selectedClientId === 'all'
      ? overallData
      : clientWiseData.find((c) => c.id === selectedClientId) || overallData;

  const netStr = String(activeData.netPayable || '');
  const safeNetPayable =
    netStr.includes('NaN') || !netStr.trim()
      ? `₹ ${Math.max(0, parseNum(activeData.grossSalary) - parseNum(activeData.deductions)).toLocaleString('en-IN')}`
      : activeData.netPayable;

  const processed = Number(activeData.processedCount) || 0;
  const total = Number(activeData.totalCount) || 0;
  const pct = Number(activeData.percentage) || 0;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Payroll Summary</h3>
        <span className={styles.monthBadge}>{activeData.month}</span>
      </div>

      {/* Client Filter */}
      {clientWiseData.length > 0 && (
        <div className={styles.selectorWrapper}>
          <label htmlFor="payroll-client-select" className={styles.selectorLabel}>
            Client:
          </label>
          <div className={styles.selectContainer}>
            <select
              id="payroll-client-select"
              className={styles.clientSelect}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="all">All Clients (Overall)</option>
              {clientWiseData.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientName}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className={styles.selectIcon} />
          </div>
        </div>
      )}

      {/* Stat Rows */}
      <div className={styles.list}>
        <div className={styles.statRow}>
          <span className={styles.label}>Gross Salary</span>
          <span className={styles.value}>{activeData.grossSalary}</span>
        </div>

        <div className={styles.statRow}>
          <span className={styles.label}>Deductions</span>
          <span className={`${styles.value} ${styles.deductionValue}`}>{activeData.deductions}</span>
        </div>

        <div className={styles.statRow}>
          <span className={styles.label}>Net Payable</span>
          <span className={`${styles.value} ${styles.netValue}`}>{safeNetPayable}</span>
        </div>
      </div>

      {/* Progress tracker */}
      <div className={styles.progressSection}>
        <div className={styles.ringRow}>
          <div className={styles.ringLeft}>
            <span className={styles.progressLabel}>Processed Payments</span>
            <span className={styles.progressCounts}>
              <strong>{processed.toLocaleString()}</strong> / {total.toLocaleString()} employees
            </span>
          </div>
          <div className={styles.ringWrap}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="21" fill="none" stroke="#e2e8f0" strokeWidth="5" />
              <circle
                cx="26"
                cy="26"
                r="21"
                fill="none"
                stroke="#2563eb"
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 21}
                strokeDashoffset={2 * Math.PI * 21 * (1 - Math.min(100, pct) / 100)}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
            </svg>
            <span className={styles.ringPct}>{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayrollSummary;
