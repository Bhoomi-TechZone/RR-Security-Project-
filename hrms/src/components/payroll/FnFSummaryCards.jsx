import React from 'react';
import { UserMinus, Clock, CheckCircle2, IndianRupee } from 'lucide-react';
import styles from './RateRevisionSummaryCards.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function FnFSummaryCards({ metrics }) {
  return (
    <div className={styles.kpiGrid}>
      {/* 1. Total Settlements */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Total Settlements</span>
            <span className={styles.cardValue}>{metrics.totalSettlements}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <UserMinus size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Separation & exit cases</span>
        </div>
      </div>

      {/* 2. Pending Clearance */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Pending Clearance</span>
            <span className={styles.cardValue} style={{ color: '#d97706' }}>
              {metrics.pendingClearance}
            </span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#fef3c7', color: '#b45309' }}>
            <Clock size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Awaiting asset / dept no-dues</span>
        </div>
      </div>

      {/* 3. Approved & Ready */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Approved & Ready</span>
            <span className={styles.cardValue} style={{ color: '#4f46e5' }}>
              {metrics.approvedReady}
            </span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Ready for finance disbursement</span>
        </div>
      </div>

      {/* 4. Total Settled Amount */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Settled Disbursed</span>
            <span className={styles.cardValue} style={{ color: '#16a34a' }}>
              {formatINR(metrics.totalSettledAmount)}
            </span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#dcfce7', color: '#15803d' }}>
            <IndianRupee size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>
            {metrics.settledCount} staff accounts fully cleared
          </span>
        </div>
      </div>
    </div>
  );
}

