import React from 'react';
import { User, Clock, Calendar, CheckSquare, HelpCircle } from 'lucide-react';
import styles from './RecentActivities.module.css';

// Icon mapper for activity category type
const iconMap = {
  employee: { icon: User, bg: '#eff6ff', color: '#1e3a8a' },
  attendance: { icon: CheckSquare, bg: '#fff7ed', color: '#1e3a8a' },
  payroll: { icon: Clock, bg: '#f0fdf4', color: '#1e3a8a' },
  leave: { icon: Calendar, bg: '#faf5ff', color: '#1e3a8a' },
};

const tagClassMap = {
  'Success': styles.tagSuccess,
  'New Joiner': styles.tagNewJoiner,
  'Leave': styles.tagLeave,
  'Attendance': styles.tagAttendance,
};

function RecentActivities({ activities = [], loading }) {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLink}`} />
        </div>
        <div className={styles.timeline}>
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className={styles.timelineItem}>
              <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
              <div className={styles.timelineMeta}>
                <div className={`${styles.skeleton} ${styles.skeletonMessage}`} />
                <div className={`${styles.skeleton} ${styles.skeletonTime}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Activities</h3>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.viewAll}>
          View All →
        </a>
      </div>
      
      <div className={styles.timeline}>
        {activities.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No recent activities.</p>
          </div>
        ) : (
          activities.map((item) => {
            const config = iconMap[item.type] || { icon: HelpCircle, bg: '#f1f5f9', color: '#64748b' };
            const Icon = config.icon;
            const tagClass = tagClassMap[item.tag] || styles.tagDefault;
            
            return (
              <div key={item.id} className={styles.timelineItem}>
                {/* Timeline connector track */}
                <div className={styles.line} aria-hidden="true" />
                
                {/* Activity Icon circle */}
                <div 
                  className={styles.iconCircle}
                  style={{ backgroundColor: config.bg, color: config.color }}
                  aria-hidden="true"
                >
                  <Icon size={14} strokeWidth={2.2} />
                </div>

                {/* Info */}
                <div className={styles.timelineMeta}>
                  <p className={styles.message}>{item.message}</p>
                  <span className={styles.time}>{item.time}</span>
                </div>

                {/* Tag pill */}
                {item.tag && (
                  <span className={`${styles.tag} ${tagClass}`}>
                    {item.tag}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RecentActivities;
