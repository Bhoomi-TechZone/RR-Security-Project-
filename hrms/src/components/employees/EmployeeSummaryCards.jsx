import React from 'react';
import { Users, UserCheck, UserX, Building2 } from 'lucide-react';
import styles from './EmployeeSummaryCards.module.css';

/**
 * EmployeeSummaryCards Component
 * Renders 4 compact statistics cards at the top of the Employees page.
 */
function EmployeeSummaryCards({ employees = [] }) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => String(e.status || '').toLowerCase() === 'active').length;
  const inactiveEmployees = employees.filter(e => {
    const s = String(e.status || '').toLowerCase();
    return s === 'inactive' || s === 'terminated' || s === 'on leave';
  }).length;
  
  // Count unique client company names/IDs that have at least one employee
  const uniqueCompanies = new Set(
    employees
      .map(e => e.clientId || e.clientName || e.companyName)
      .filter(Boolean)
  ).size;

  const stats = [
    {
      id: 'total',
      label: 'Total Employees',
      value: totalEmployees.toLocaleString(),
      icon: Users,
      colorClass: styles.blue
    },
    {
      id: 'active',
      label: 'Active Employees',
      value: activeEmployees.toLocaleString(),
      icon: UserCheck,
      colorClass: styles.green
    },
    {
      id: 'inactive',
      label: 'Inactive Employees',
      value: inactiveEmployees.toLocaleString(),
      icon: UserX,
      colorClass: styles.red
    },
    {
      id: 'companies',
      label: 'Companies Covered',
      value: uniqueCompanies.toLocaleString(),
      icon: Building2,
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
              <Icon size={30} strokeWidth={3} />
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

export default EmployeeSummaryCards;
