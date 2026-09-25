import React from 'react';
import { Building2, Users } from 'lucide-react';
import styles from './CompanySummaryCards.module.css';

/**
 * CompanySummaryCards Component
 * Renders 4 compact statistics cards at the top of the Companies page.
 */
function CompanySummaryCards({ companies = [] }) {
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const inactiveCompanies = companies.filter(c => c.status === 'inactive').length;
  const totalEmployees = companies.reduce((acc, c) => acc + (c.employees || 0), 0);

  const stats = [
    {
      id: 'total',
      label: 'Total Clients',
      value: totalCompanies.toLocaleString(),
      icon: Building2,
      colorClass: styles.blue
    },
    {
      id: 'active',
      label: 'Active Clients',
      value: activeCompanies.toLocaleString(),
      icon: Building2,
      colorClass: styles.green
    },
    {
      id: 'inactive',
      label: 'Inactive Clients',
      value: inactiveCompanies.toLocaleString(),
      icon: Building2,
      colorClass: styles.red
    },
    {
      id: 'employees',
      label: 'Total Employees',
      value: totalEmployees.toLocaleString(),
      icon: Users,
      colorClass: styles.purple
    }
  ];

  return (
    <div className={styles.summaryGrid}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className={styles.statCard}>
            <div className={`${styles.iconBox} ${stat.colorClass}`}>
              <Icon size={30} />
            </div>
            <div className={styles.content}>
              <span className={styles.label}>{stat.label}</span>
              <span className={styles.value}>{stat.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompanySummaryCards;
