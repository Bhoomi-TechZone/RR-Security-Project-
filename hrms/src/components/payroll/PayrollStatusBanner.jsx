import React from 'react';
import { PlayCircle, AlertCircle, CheckCircle2, Lock, Sparkles, ArrowRight } from 'lucide-react';
import styles from './PayrollStatusBanner.module.css';

export default function PayrollStatusBanner({ monthLabel, status = 'Processing', processedCount = 1184, totalCount = 1250, onContinueProcessing }) {
  const percentage = Math.min(100, Math.round((processedCount / totalCount) * 100));

  const getStatusBadge = () => {
    switch (status.toLowerCase()) {
      case 'processed':
        return {
          label: 'Processed',
          icon: CheckCircle2,
          className: styles.statusProcessed
        };
      case 'locked':
        return {
          label: 'Locked',
          icon: Lock,
          className: styles.statusLocked
        };
      case 'draft':
        return {
          label: 'Draft',
          icon: AlertCircle,
          className: styles.statusDraft
        };
      case 'processing':
      default:
        return {
          label: 'Processing',
          icon: Sparkles,
          className: styles.statusProcessing
        };
    }
  };

  const statusMeta = getStatusBadge();
  const StatusIcon = statusMeta.icon;

  return (
    <div className={styles.banner}>
      <div className={styles.bannerLeft}>
        <div className={styles.titleRow}>
          <h2 className={styles.bannerTitle}>{monthLabel || 'August 2026'} Payroll</h2>
          <div className={`${styles.statusBadge} ${statusMeta.className}`}>
            <span className={styles.dot} />
            <StatusIcon size={14} />
            <span>Payroll Status: <strong>{statusMeta.label}</strong></span>
          </div>
        </div>

        <p className={styles.bannerDescription}>
          <strong>{processedCount.toLocaleString('en-IN')}</strong> of{' '}
          <strong>{totalCount.toLocaleString('en-IN')}</strong> employees processed.
          {status.toLowerCase() === 'processing' && ' Review pending employee records and continue processing.'}
          {status.toLowerCase() === 'processed' && ' All employee salary records have been processed and slips are ready.'}
        </p>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          <span className={styles.progressText}>{percentage}% Completed</span>
        </div>
      </div>

      <div className={styles.bannerRight}>
        {status.toLowerCase() !== 'processed' && status.toLowerCase() !== 'locked' && (
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onContinueProcessing}
          >
            <PlayCircle size={18} />
            <span>Continue Processing</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
