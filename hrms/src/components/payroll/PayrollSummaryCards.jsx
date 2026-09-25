import React from 'react';
import { Users, CircleCheck, Clock3, IndianRupee, TrendingUp } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './PayrollSummaryCards.module.css';

export default function PayrollSummaryCards({ summary }) {
  const cards = [
    {
      title: 'Total Employees',
      value: summary?.totalEmployees?.toLocaleString('en-IN') || '1,250',
      subtitle: 'Eligible for active cycle',
      icon: Users,
      colorClass: styles.blueIcon,
      badge: 'Active Roster'
    },
    {
      title: 'Payroll Processed',
      value: summary?.processedEmployees?.toLocaleString('en-IN') || '1,184',
      subtitle: `${((summary?.processedEmployees || 1184) / (summary?.totalEmployees || 1250) * 100).toFixed(0)}% completion rate`,
      icon: CircleCheck,
      colorClass: styles.greenIcon,
      badge: 'On Track'
    },
    {
      title: 'Pending Payroll',
      value: summary?.pendingEmployees?.toLocaleString('en-IN') || '66',
      subtitle: 'Awaiting final approval',
      icon: Clock3,
      colorClass: styles.amberIcon,
      badge: 'Requires Action'
    },
    {
      title: 'Total Net Payroll',
      value: formatRupee(summary?.totalNetPayroll || 48250000),
      subtitle: 'Disbursement estimate',
      icon: IndianRupee,
      colorClass: styles.purpleIcon,
      badge: '+4.2% MoM'
    }
  ];

  return (
    <div className={styles.kpiGrid}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div className={styles.card} key={idx}>
            <div className={styles.cardHeader}>
              <div className={styles.headerText}>
                <span className={styles.cardTitle}>{card.title}</span>
                <strong className={styles.cardValue}>{card.value}</strong>
              </div>
              <div className={`${styles.iconWrap} ${card.colorClass}`}>
                <Icon size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.subtitle}>{card.subtitle}</span>
              <span className={styles.badge}>{card.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
