import React from 'react';
import { IndianRupee, CalendarDays, User, FileClockIcon, FileText, Cake } from 'lucide-react';
import styles from './QuickInsights.module.css';



function QuickInsights({ data, onOpenBirthdays, onOpenOnLeave, onOpenLeaveRequests }) {
  const currentMonthName = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  const dynamicInsights = [
    {
      id: 'payroll',
      icon: IndianRupee,
      iconBg: 'linear-gradient(135deg, #0ea5e9, #1d4ed8)',
      iconColor: '#ffffff',
      label: 'Monthly Payroll',
      sublabel: data?.monthlyPayrollMonth || `(${currentMonthName})`,
      value: data?.monthlyPayroll || '₹ 0',
      link: '/admin/payroll',
      linkLabel: 'View Details →'
    },
    {
      id: 'attendance',
      icon: CalendarDays,
      iconBg: '#ffffff',
      iconColor: '#16a34a',
      border: '2px solid #22c55e',
      label: 'Attendance Today',
      value: data?.attendanceToday || '0 / 0',
      sub: data?.attendancePct || '100% Present',
      link: '/admin/attendance',
      linkLabel: 'View Roster →'
    },
    {
      id: 'onleave',
      icon: User,
      iconBg: 'linear-gradient(135deg, #f97316, #ea580c)',
      iconColor: '#ffffff',
      label: 'On Leave Today',
      value: data?.onLeaveToday || '0',
      sub: data?.leavePct || '0%',
      link: null,
      isModalTrigger: true,
      linkLabel: 'View Details →'
    },
    {
      id: 'leaverequests',
      icon: FileClockIcon,
      iconBg: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      iconColor: '#ffffff',
      label: 'Leave Requests',
      value: data?.leaveRequests || '0',
      link: null,
      isModalTrigger: true,
      linkLabel: 'View Details →'
    },
    {
      id: 'pending',
      icon: FileText,
      iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      iconColor: '#ffffff',
      label: 'Pending Claims',
      value: data?.pendingClaims || '0',
      link: '/admin/reimbursements',
      linkLabel: 'View Details →'
    },
    {
      id: 'birthdays',
      icon: Cake,
      iconBg: 'linear-gradient(135deg, #ec4899, #db2777)',
      iconColor: '#ffffff',
      label: 'Upcoming Birthdays',
      value: data?.upcomingBirthdays || '00',
      link: null,
      isModalTrigger: true,
      linkLabel: 'View Details →'
    },
  ];

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Quick Insights</h3>

      {/* Symmetric 3x2 Grid for 6 cards */}
      <div className={styles.grid}>
        {dynamicInsights.map((item) => {
          const Icon = item.icon;
          const isBirthday = item.id === 'birthdays';
          const isOnLeave = item.id === 'onleave';
          const isLeaveRequests = item.id === 'leaverequests';
          const isInteractive =
            (isBirthday && onOpenBirthdays) ||
            (isOnLeave && onOpenOnLeave) ||
            (isLeaveRequests && onOpenLeaveRequests);

          const handleClick = () => {
            if (isBirthday && onOpenBirthdays) onOpenBirthdays();
            if (isOnLeave && onOpenOnLeave) onOpenOnLeave();
            if (isLeaveRequests && onOpenLeaveRequests) onOpenLeaveRequests();
          };

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
                {item.linkLabel && (
                  isInteractive ? (
                    <button
                      type="button"
                      className={styles.viewLinkBtn}
                      onClick={handleClick}
                      title={`Open ${item.label}`}
                    >
                      {item.linkLabel}
                    </button>
                  ) : (
                    <a href={item.link || '#'} className={styles.viewLink}>
                      {item.linkLabel}
                    </a>
                  )
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

