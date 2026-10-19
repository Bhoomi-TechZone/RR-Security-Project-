import React from 'react';
import { Users, CircleCheck, Clock3, IndianRupee, TrendingUp } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './PayrollSummaryCards.module.css';

export default function PayrollSummaryCards({ summary = {} }) {
  const totalEmployees = Number(summary?.totalEmployees) || 0;
  const processedEmployees = Number(summary?.processedEmployees) || 0;
  const pendingEmployees = Number(summary?.pendingEmployees) || 0;
  const totalNetPayroll = Number(summary?.totalNetPayroll) || 0;

  const completionPercent = totalEmployees > 0 
    ? Math.round((processedEmployees / totalEmployees) * 100) 
    : 0;

  const cards = [
    {
      title: 'Total Employees',
      value: totalEmployees.toLocaleString('en-IN'),
      subtitle: 'Eligible for active cycle',
      icon: Users,
      colorClass: styles.blueIcon,
      badge: 'Active Roster'
    },
    {
      title: 'Payroll Processed',
      value: processedEmployees.toLocaleString('en-IN'),
      subtitle: `${completionPercent}% completion rate`,
      icon: CircleCheck,
      colorClass: styles.greenIcon,
      badge: completionPercent === 100 && totalEmployees > 0 ? 'Completed' : (processedEmployees > 0 ? 'In Progress' : 'Pending')
    },
    {
      title: 'Pending Payroll',
      value: pendingEmployees.toLocaleString('en-IN'),
      subtitle: 'Awaiting final approval',
      icon: Clock3,
      colorClass: styles.amberIcon,
      badge: pendingEmployees > 0 ? 'Requires Action' : 'All Clear'
    },
    {
      title: 'Total Net Payroll',
      value: formatRupee(totalNetPayroll),
      subtitle: 'Disbursement estimate',
      icon: IndianRupee,
      colorClass: styles.purpleIcon,
      badge: 'Net Payable'
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
