import React from 'react';
import * as Icons from 'lucide-react';
import styles from './StatCard.module.css';

/**
 * StatCard Component
 * Displays a single KPI statistic card with trend comparisons and icon labels.
 * Supports skeleton loading state.
 */
function StatCard({ title, value, trend, trendType, subtext, iconName, loading }) {
  // Get corresponding Lucide Icon
  const Icon = Icons[iconName] || Icons.HelpCircle;

  // Map icon names to color classes
  const iconColorMap = {
    'Building2': styles.iconBlue,
    'Users': styles.iconGreen,
    'UserCheck': styles.iconPurple,
    'UserPlus': styles.iconOrange,
    'Mars': styles.iconCyan,
    'Venus': styles.iconPink,
  };

  const iconColorClass = iconColorMap[iconName] || '';

  if (loading) {
    return (
      <div className={`${styles.card} ${styles.skeletonCard}`}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonText} ${styles.w60}`} />
          <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonTitle} ${styles.w40}`} />
        <div className={`${styles.skeleton} ${styles.skeletonSubtext} ${styles.w80}`} />
      </div>
    );
  }

  const isUp = trendType === 'up';
  const isDown = trendType === 'down';

  return (
    <div className={styles.card}>
      <div className={`${styles.iconContainer} ${iconColorClass}`}>
        <Icon size={28} className={styles.icon} />
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <span className={styles.value}>{value}</span>
        
        <div className={styles.trendRow}>
          {trend && (
            <span className={[
              styles.trend,
              isUp ? styles.trendUp : '',
              isDown ? styles.trendDown : ''
            ].filter(Boolean).join(' ')}>
              {isUp && '↑ '}
              {isDown && '↓ '}
              {trend}
            </span>
          )}
          {/* <span className={styles.subtext}>{subtext}</span> */}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
