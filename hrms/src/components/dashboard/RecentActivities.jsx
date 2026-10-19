import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Clock, Calendar, CheckSquare, HelpCircle,
  Receipt, WalletCards, Package
} from 'lucide-react';
import styles from './RecentActivities.module.css';

// Icon mapper for activity category type
const iconMap = {
  employee: { icon: User, bg: '#eff6ff', color: '#1e3a8a' },
  attendance: { icon: CheckSquare, bg: '#fff7ed', color: '#1e3a8a' },
  payroll: { icon: Clock, bg: '#f0fdf4', color: '#1e3a8a' },
  leave: { icon: Calendar, bg: '#faf5ff', color: '#7c3aed' },
  reimbursement: { icon: Receipt, bg: '#ecfdf5', color: '#059669' },
  loan: { icon: WalletCards, bg: '#fffbeb', color: '#d97706' },
  inventory: { icon: Package, bg: '#f0f9ff', color: '#0284c7' },
};

const tagClassMap = {
  'Approved': styles.tagSuccess,
  'Success': styles.tagSuccess,
  'New Joiner': styles.tagNewJoiner,
  'Leave': styles.tagLeave,
  'Attendance': styles.tagAttendance,
  'Claim': styles.tagClaim,
  'Advance': styles.tagAdvance,
  'Requisition': styles.tagRequisition,
  'Rejected': styles.tagRejected,
  'Pending': styles.tagPending,
};

function RecentActivities({ activities = [], loading }) {
  const navigate = useNavigate();

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
        <button
          type="button"
          onClick={() => navigate('/admin/notifications?tab=notifications')}
          className={styles.viewAllBtn}
          title="View all activities and system notifications"
        >
          View All →
        </button>
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
            const isClickable = Boolean(item.targetUrl);
            
            return (
              <div
                key={item.id}
                className={`${styles.timelineItem} ${isClickable ? styles.interactiveTimelineItem : ''}`}
                onClick={() => item.targetUrl && navigate(item.targetUrl)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                title={isClickable ? `Go to ${item.type} details` : undefined}
              >
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
