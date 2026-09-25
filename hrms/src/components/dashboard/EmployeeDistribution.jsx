import React from 'react';
import styles from './EmployeeDistribution.module.css';

/**
 * EmployeeDistribution Component
 * Displays a lightweight, responsive SVG-based Donut chart mapping workforce roles.
 * Supports skeleton loading state.
 */
function EmployeeDistribution({ data = [], loading }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const segmentClasses = [
    styles.segmentBlue,
    styles.segmentGreen,
    styles.segmentAmber,
    styles.segmentOrange,
    styles.segmentPink,
    styles.segmentGray,
  ];

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLink}`} />
        </div>
        <div className={styles.skeletonContainer}>
          <div className={`${styles.skeleton} ${styles.skeletonDonut}`} />
          <div className={styles.skeletonLegend}>
            <div className={`${styles.skeleton} ${styles.skeletonLegendItem}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLegendItem}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLegendItem}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLegendItem}`} />
          </div>
        </div>
      </div>
    );
  }

  // SVG parameters
  const size = 180;
  const radius = 50;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius; // ~314.16

  // Cumulative percentage tracks to calculate correct offsets
  let accumulatedPercentage = 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Department Wise Employees</h3>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.viewLink}>
          View Report →
        </a>
      </div>
      
      <div className={styles.container}>
        {/* Donut chart layout */}
        <div className={styles.donutWrapper}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {/* Donut track background */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className={styles.donutTrack}
                strokeWidth={strokeWidth}
              />
              
              {/* Segments */}
              {data.map((item, idx) => {
                const percentage = item.count / total;
                const strokeLength = percentage * circumference;
                const strokeOffset = circumference - (accumulatedPercentage * circumference);
                
                // Add current percentage for next segment's offset
                accumulatedPercentage += percentage;

                const segmentClass = segmentClasses[idx] || segmentClasses[segmentClasses.length - 1];

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeLength} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    className={`${styles.donutSegment} ${segmentClass}`}
                  />
                );
              })}
            </g>
            
            {/* Center label */}
            <foreignObject 
              x={size / 2 - 40} 
              y={size / 2 - 28} 
              width={80} 
              height={56}
              className={styles.centerMeta}
            >
              <div className={styles.centerText}>
                <span className={styles.totalNumber}>{total.toLocaleString()}</span>
                <span className={styles.totalLabel}>Total</span>
              </div>
            </foreignObject>
          </svg>
        </div>

        {/* Legend listing details */}
        <div className={styles.legend}>
          {data.map((item, idx) => {
            const pct = ((item.count / total) * 100).toFixed(2);
            const indicatorClass = segmentClasses[idx] || segmentClasses[segmentClasses.length - 1];

            return (
              <div key={idx} className={styles.legendItem}>
                <span 
                  className={`${styles.indicator} ${indicatorClass}`} 
                  aria-hidden="true"
                />
                <div className={styles.legendMeta}>
                  <span className={styles.roleName}>{item.role}</span>
                  <span className={styles.roleCount}>
                    {item.count} <span className={styles.rolePct}>({pct}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDistribution;
