import React from 'react';
import { TrendingUp, Clock, CheckCircle2, Calendar } from 'lucide-react';
import styles from './RateRevisionSummaryCards.module.css';

export default function RateRevisionSummaryCards({ metrics }) {
  return (
    <div className={styles.kpiGrid}>
      {/* 1. Total Revisions */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Total Revisions</span>
            <span className={styles.cardValue}>{metrics.totalRevisions}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <TrendingUp size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>All recorded rate revisions</span>
        </div>
      </div>

      {/* 2. Pending Approval */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Pending Approval</span>
            <span className={styles.cardValue} style={{ color: '#d97706' }}>{metrics.pendingApproval}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#fef9c3', color: '#854d0e' }}>
            <Clock size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Awaiting authorization</span>
        </div>
      </div>

      {/* 3. Approved */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Approved Revisions</span>
            <span className={styles.cardValue} style={{ color: '#16a34a' }}>{metrics.approved}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Authorized rate increments</span>
        </div>
      </div>

      {/* 4. Effective This Month */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <span className={styles.cardTitle}>Effective This Month</span>
            <span className={styles.cardValue} style={{ color: '#2563eb' }}>{metrics.effectiveThisMonth}</span>
          </div>
          <div className={styles.iconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={22} />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.footerNote}>Applicable for current payroll</span>
        </div>
      </div>
    </div>
  );
}
