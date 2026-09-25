import React from 'react';
import { TrendingUp, PieChart, Wallet, ArrowUpRight } from 'lucide-react';
import styles from './PayrollAnalytics.module.css';

export default function PayrollAnalytics() {
  const trendData = [
    { month: 'May 2026', amount: '₹4.50 Cr', value: 4.5, percent: 93 },
    { month: 'June 2026', amount: '₹4.70 Cr', value: 4.7, percent: 97 },
    { month: 'July 2026', amount: '₹4.73 Cr', value: 4.73, percent: 98 },
    { month: 'August 2026', amount: '₹4.82 Cr', value: 4.82, percent: 100, isCurrent: true },
  ];

  const earningsData = [
    { label: 'Basic Salary', amount: '₹2.85 Cr', percent: 59, color: '#2563eb' },
    { label: 'HRA', amount: '₹1.02 Cr', percent: 21, color: '#3b82f6' },
    { label: 'Allowances', amount: '₹0.58 Cr', percent: 12, color: '#60a5fa' },
    { label: 'Overtime', amount: '₹0.37 Cr', percent: 8, color: '#93c5fd' },
  ];

  const deductionsData = [
    { label: 'PF Contribution', amount: '₹8.42 L', percent: 51, color: '#dc2626' },
    { label: 'Advance Adjustments', amount: '₹4.20 L', percent: 25, color: '#ef4444' },
    { label: 'ESI Contribution', amount: '₹2.18 L', percent: 14, color: '#f87171' },
    { label: 'Other Deductions', amount: '₹1.65 L', percent: 10, color: '#fca5a5' },
  ];

  return (
    <div className={styles.analyticsSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Payroll Analytics &amp; Cost Distribution</h2>
          <p className={styles.sectionSub}>Macro financial trend and statutory composition overview</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Trend Bar Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleWrap}>
              <TrendingUp size={16} className={styles.blueIcon} />
              <h3 className={styles.cardTitle}>Monthly Payroll Trend</h3>
            </div>
            <span className={styles.trendBadge}>
              <ArrowUpRight size={14} /> +7.1% (Q2)
            </span>
          </div>

          <div className={styles.trendBarsList}>
            {trendData.map((item, idx) => (
              <div key={idx} className={styles.trendItem}>
                <div className={styles.trendLabels}>
                  <span className={item.isCurrent ? styles.currentMonthText : styles.monthText}>
                    {item.month}
                  </span>
                  <strong className={item.isCurrent ? styles.currentAmountText : styles.amountText}>
                    {item.amount}
                  </strong>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={item.isCurrent ? styles.barFillCurrent : styles.barFill}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Component Summary */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleWrap}>
              <PieChart size={16} className={styles.purpleIcon} />
              <h3 className={styles.cardTitle}>Salary Component Summary</h3>
            </div>
            <span className={styles.totalValue}>Total ₹4.82 Cr</span>
          </div>

          <div className={styles.stackedTrack}>
            {earningsData.map((e, i) => (
              <div
                key={i}
                className={styles.stackSegment}
                style={{ width: `${e.percent}%`, background: e.color }}
                title={`${e.label}: ${e.amount} (${e.percent}%)`}
              />
            ))}
          </div>

          <div className={styles.componentList}>
            {earningsData.map((e, i) => (
              <div key={i} className={styles.compRow}>
                <div className={styles.compLeft}>
                  <span className={styles.colorDot} style={{ background: e.color }} />
                  <span>{e.label}</span>
                </div>
                <div className={styles.compRight}>
                  <strong>{e.amount}</strong>
                  <small>({e.percent}%)</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deduction Summary */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleWrap}>
              <Wallet size={16} className={styles.amberIcon} />
              <h3 className={styles.cardTitle}>Deduction Summary</h3>
            </div>
            <span className={styles.totalValue}>Total ₹16.45 L</span>
          </div>

          <div className={styles.stackedTrack}>
            {deductionsData.map((d, i) => (
              <div
                key={i}
                className={styles.stackSegment}
                style={{ width: `${d.percent}%`, background: d.color }}
                title={`${d.label}: ${d.amount} (${d.percent}%)`}
              />
            ))}
          </div>

          <div className={styles.componentList}>
            {deductionsData.map((d, i) => (
              <div key={i} className={styles.compRow}>
                <div className={styles.compLeft}>
                  <span className={styles.colorDot} style={{ background: d.color }} />
                  <span>{d.label}</span>
                </div>
                <div className={styles.compRight}>
                  <strong className={styles.deductText}>{d.amount}</strong>
                  <small>({d.percent}%)</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
