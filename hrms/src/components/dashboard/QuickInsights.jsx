import React from 'react';
import { IndianRupee, CalendarDays, User, FileClockIcon, FileText, Cake } from 'lucide-react';
import styles from './QuickInsights.module.css';

const insights = [
  {
    id: 'payroll',
    icon: IndianRupee,
    iconBg: 'linear-gradient(135deg, #0ea5e9, #1d4ed8)',
    iconColor: '#ffffff',
    label: 'Monthly Payroll',
    sublabel: '(May 2025)',
    value: '₹ 2,45,80,000',
    link: 'View Details →',
  },
  {
    id: 'attendance',
    icon: CalendarDays,
    iconBg: '#ffffff',
    iconColor: '#16a34a',
    border: '2px solid #22c55e',
    label: 'Attendance Today',
    value: '1,421 / 1,531',
    sub: '92.83% Present',
    link: null,
  },
  {
    id: 'onleave',
    icon: User,
    iconBg: 'linear-gradient(135deg, #f97316, #ea580c)',
    iconColor: '#ffffff',
    label: 'On Leave Today',
    value: '78',
    sub: '5.09%',
    link: null,
  },
  {
    id: 'leaverequests',
    icon: FileClockIcon,
    iconBg: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    iconColor: '#ffffff',
    label: 'Leave Requests',
    value: '15',
    link: 'View Details →',
  },
  {
    id: 'pending',
    icon: FileText,
    iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    iconColor: '#ffffff',
    label: 'Pending Claims',
    value: '32',
    link: 'View Details →',
  },
  {
    id: 'birthdays',
    icon: Cake,
    iconBg: 'linear-gradient(135deg, #ec4899, #db2777)',
    iconColor: '#ffffff',
    label: 'Upcoming Birthdays',
    value: '07',
    link: 'View Details →',
  },
];

function QuickInsights() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Quick Insights</h3>

      {/* Symmetric 3x2 Grid for 6 cards */}
      <div className={styles.grid}>
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className={styles.insightItem}>
              <div 
                className={styles.iconWrap} 
                style={{ 
                  background: item.iconBg,
                  border: item.border || 'none',
                  borderRadius: item.border ? '8px' : '50%'
                }}
              >
                <Icon size={18} color={item.iconColor} strokeWidth={2.2} />
              </div>
              <div className={styles.meta}>
                <span className={styles.insightLabel}>
                  {item.label}
                  {item.sublabel && <span className={styles.sublabel}> {item.sublabel}</span>}
                </span>
                <span className={styles.insightValue}>{item.value}</span>
                {item.sub && <span className={styles.insightSub}>{item.sub}</span>}
                {item.link && (
                  <a href="#" onClick={(e) => e.preventDefault()} className={styles.viewLink}>
                    {item.link}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuickInsights;
