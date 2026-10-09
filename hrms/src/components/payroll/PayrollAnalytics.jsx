import React, { useMemo } from 'react';
import { TrendingUp, PieChart, Wallet, ArrowUpRight } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './PayrollAnalytics.module.css';

export default function PayrollAnalytics({ records = [], selectedMonth = '2026-08', monthLabel = 'August 2026' }) {
  // Dynamically calculate component breakdown from real records
  const { earningsData, deductionsData, totalGross, totalDeductions, totalNet } = useMemo(() => {
    let basic = 0;
    let hra = 0;
    let allowances = 0;
    let overtime = 0;

    let pf = 0;
    let esi = 0;
    let advances = 0;
    let otherDeductions = 0;

    records.forEach(r => {
      basic += Number(r.basicSalary || r.basic || 0);
      hra += Number(r.hra || 0);
      allowances += Number((r.transportAllowance || 0) + (r.otherAllowance || 0) + (r.vda || 0) + (r.bonus || 0) + (r.arrears || 0));
      overtime += Number(r.overtimePay || r.overtimeAmount || 0);

      pf += Number(r.pf || 0);
      esi += Number(r.esi || 0);
      advances += Number(r.advanceDeduction || r.advanceLoan || 0);
      otherDeductions += Number(r.otherDeduction || r.pt || r.lwf || r.tds || 0);
    });

    const sumGross = basic + hra + allowances + overtime;
    const sumDeductions = pf + esi + advances + otherDeductions;
    const sumNet = Math.max(0, sumGross - sumDeductions);

    const safeGross = sumGross > 0 ? sumGross : 1;
    const safeDeductions = sumDeductions > 0 ? sumDeductions : 1;

    const earnings = [
      { label: 'Basic Salary', amount: formatRupee(basic), percent: Math.round((basic / safeGross) * 100), color: '#2563eb' },
      { label: 'HRA', amount: formatRupee(hra), percent: Math.round((hra / safeGross) * 100), color: '#3b82f6' },
      { label: 'Allowances & VDA', amount: formatRupee(allowances), percent: Math.round((allowances / safeGross) * 100), color: '#60a5fa' },
      { label: 'Overtime Pay', amount: formatRupee(overtime), percent: Math.round((overtime / safeGross) * 100), color: '#93c5fd' },
    ];

    const deductions = [
      { label: 'PF Contribution', amount: formatRupee(pf), percent: Math.round((pf / safeDeductions) * 100), color: '#dc2626' },
      { label: 'Advance & Loan Adjustments', amount: formatRupee(advances), percent: Math.round((advances / safeDeductions) * 100), color: '#ef4444' },
      { label: 'ESI Contribution', amount: formatRupee(esi), percent: Math.round((esi / safeDeductions) * 100), color: '#f87171' },
      { label: 'Tax & Other Deductions', amount: formatRupee(otherDeductions), percent: Math.round((otherDeductions / safeDeductions) * 100), color: '#fca5a5' },
    ];

    return {
      earningsData: earnings,
      deductionsData: deductions,
      totalGross: sumGross,
      totalDeductions: sumDeductions,
      totalNet: sumNet
    };
  }, [records]);

  const trendData = useMemo(() => {
    return [
      { month: monthLabel, amount: formatRupee(totalNet), percent: 100, isCurrent: true }
    ];
  }, [monthLabel, totalNet]);

  return (
    <div className={styles.analyticsSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Payroll Analytics &amp; Cost Distribution</h2>
          <p className={styles.sectionSub}>Macro financial distribution and statutory composition for {monthLabel}</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Trend Bar Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleWrap}>
              <TrendingUp size={16} className={styles.blueIcon} />
              <h3 className={styles.cardTitle}>Current Month Net Payroll</h3>
            </div>
            <span className={styles.trendBadge}>
              <ArrowUpRight size={14} /> Live Sync
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
              <h3 className={styles.cardTitle}>Earnings Component Breakdown</h3>
            </div>
            <span className={styles.totalValue}>Gross: {formatRupee(totalGross)}</span>
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
              <h3 className={styles.cardTitle}>Deductions Summary</h3>
            </div>
            <span className={styles.totalValue}>Total: {formatRupee(totalDeductions)}</span>
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
