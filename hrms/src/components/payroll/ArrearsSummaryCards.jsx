import React from 'react';
import { Layers, Clock, Calculator, CheckCheck, DollarSign } from 'lucide-react';
import styles from './ArrearsSummaryCards.module.css';

export default function ArrearsSummaryCards({ metrics }) {
  return (
    <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {/* 1. Total Arrears */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Total Records</span>
            <span className={styles.cardValue}>{metrics.totalArrearRecords}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <Layers size={20} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Generated from revisions</span>
        </div>
      </div>

      {/* 2. Pending Calculation */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Pending Calc</span>
            <span className={styles.cardValue} style={{ color: '#d97706' }}>{metrics.pendingCalculation}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#fef9c3', color: '#854d0e' }}>
            <Clock size={20} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Awaiting days evaluation</span>
        </div>
      </div>

      {/* 3. Calculated */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Calculated</span>
            <span className={styles.cardValue} style={{ color: '#2563eb' }}>{metrics.calculated}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calculator size={20} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Ready for payroll sync</span>
        </div>
      </div>

      {/* 4. Included in Payroll */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>In Payroll</span>
            <span className={styles.cardValue} style={{ color: '#16a34a' }}>{metrics.includedInPayroll}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCheck size={20} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Added to salary registers</span>
        </div>
      </div>

      {/* 5. Total Arrear Amount */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Total Arrear (₹)</span>
            <span className={styles.cardValue} style={{ color: '#0f172a' }}>
              ₹{metrics.totalArrearAmount.toLocaleString()}
            </span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#f0fdf4', color: '#166534' }}>
            <DollarSign size={20} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Gross arrear pool</span>
        </div>
      </div>
    </div>
  );
}
