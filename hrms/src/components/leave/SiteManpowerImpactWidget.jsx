import React from 'react';
import { Users, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { calculateManpowerAfterLeave } from '../../data/leaveMasterData';
import styles from './SiteManpowerImpactWidget.module.css';

export default function SiteManpowerImpactWidget({ siteInfo, leaveDays = 1 }) {
  if (!siteInfo) return null;

  const analysis = calculateManpowerAfterLeave(siteInfo, leaveDays);
  const {
    siteName,
    clientName,
    totalGuards,
    onDuty,
    onLeave,
    absent,
    relieverAvailable,
    minimumRequired,
    onDutyAfter,
    isBelowMinimum,
    shortfall
  } = analysis;

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.widgetHeader}>
        <div className={styles.titleWrap}>
          <Users size={16} className={styles.headerIcon} />
          <div>
            <h4 className={styles.title}>Site Manpower & Security Coverage</h4>
            <span className={styles.subtitle}>{siteName} • {clientName || 'Site Location'}</span>
          </div>
        </div>

        <div className={styles.minReqPill}>
          <span>Min Required: <strong>{minimumRequired} Guards</strong></span>
        </div>
      </div>

      {/* Live Site Metrics Snapshot */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Total Staff</span>
          <span className={styles.metricVal}>{totalGuards}</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Current On-Duty</span>
          <span className={`${styles.metricVal} ${styles.valDuty}`}>{onDuty}</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>On Leave</span>
          <span className={`${styles.metricVal} ${styles.valLeave}`}>{onLeave}</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Absent</span>
          <span className={`${styles.metricVal} ${styles.valAbsent}`}>{absent}</span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Relievers Ready</span>
          <span className={`${styles.metricVal} ${styles.valReliever}`}>{relieverAvailable}</span>
        </div>
      </div>

      {/* Post Approval Simulation */}
      <div className={styles.simulationRow}>
        <div className={styles.simBox}>
          <span className={styles.simLabel}>Duty Before Leave</span>
          <span className={styles.simVal}>{onDuty} Guards</span>
        </div>

        <div className={styles.simArrow}>
          <ArrowRight size={16} />
        </div>

        <div className={`${styles.simBox} ${isBelowMinimum ? styles.simBoxWarn : styles.simBoxOk}`}>
          <span className={styles.simLabel}>Manpower After Approval</span>
          <span className={styles.simVal}>
            {onDutyAfter} Guards {isBelowMinimum ? `(Shortfall: -${shortfall})` : '(Adequate)'}
          </span>
        </div>
      </div>

      {/* Warning or Success Alert */}
      {isBelowMinimum ? (
        <div className={styles.warningAlert}>
          <AlertTriangle size={18} className={styles.alertIcon} />
          <div className={styles.alertContent}>
            <strong>Warning: Potential Manpower Shortfall</strong>
            <p>
              Approving this leave will reduce on-duty personnel from {onDuty} to {onDutyAfter}, which is below the contractual minimum of {minimumRequired} guards.
              {relieverAvailable > 0
                ? ` Consider dispatching from the ${relieverAvailable} available reliever pool.`
                : ' No spare relievers are currently logged at this post.'}
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.safeAlert}>
          <CheckCircle2 size={16} className={styles.safeIcon} />
          <span>
            Contractual site security threshold is satisfied. Manpower after approval ({onDutyAfter} guards) meets minimum ({minimumRequired}).
          </span>
        </div>
      )}
    </div>
  );
}
