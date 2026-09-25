import React from 'react';
import { 
  Landmark, Briefcase, Layers, Award, UserCheck, 
  MapPin, Shield, CalendarDays, CalendarOff, CalendarHeart, 
  DollarSign, FileCheck, CheckCircle2, AlertCircle, Database 
} from 'lucide-react';
import styles from './MasterSummaryCards.module.css';

/**
 * MasterSummaryCards Component
 * Displays 3 summary cards (Total, Active, Inactive) tailored to the active master tab.
 */
function MasterSummaryCards({ activeTab, items = [] }) {
  const total = items.length;
  const active = items.filter(item => item.status === 'active').length;
  const inactive = items.filter(item => item.status === 'inactive').length;

  const getTabLabel = () => {
    switch (activeTab) {
      case 'banks':
        return { singular: 'Bank', plural: 'Banks', icon: Landmark };
      case 'clients':
        return { singular: 'Client', plural: 'Clients', icon: Briefcase };
      case 'departments':
        return { singular: 'Department', plural: 'Departments', icon: Layers };
      case 'designations':
        return { singular: 'Designation', plural: 'Designations', icon: Award };
      case 'employee-types':
        return { singular: 'Employee Type', plural: 'Employee Types', icon: UserCheck };
      case 'sites':
        return { singular: 'Site', plural: 'Sites', icon: MapPin };
      case 'posts':
        return { singular: 'Post', plural: 'Posts', icon: Shield };
      case 'shifts':
        return { singular: 'Shift', plural: 'Shifts', icon: CalendarDays };
      case 'leave-types':
        return { singular: 'Leave Type', plural: 'Leave Types', icon: CalendarOff };
      case 'holidays':
        return { singular: 'Holiday', plural: 'Holidays', icon: CalendarHeart };
      case 'salary-components':
        return { singular: 'Salary Component', plural: 'Salary Components', icon: DollarSign };
      case 'document-types':
        return { singular: 'Document Type', plural: 'Document Types', icon: FileCheck };
      default:
        return { singular: 'Record', plural: 'Records', icon: Database };
    }
  };

  const { plural, icon: TabIcon } = getTabLabel();

  const stats = [
    {
      id: 'total',
      label: `Total ${plural}`,
      value: total.toLocaleString(),
      icon: TabIcon,
      colorClass: styles.blue
    },
    {
      id: 'active',
      label: `Active ${plural}`,
      value: active.toLocaleString(),
      icon: CheckCircle2,
      colorClass: styles.green
    },
    {
      id: 'inactive',
      label: `Inactive ${plural}`,
      value: inactive.toLocaleString(),
      icon: AlertCircle,
      colorClass: styles.red
    }
  ];

  return (
    <div className={styles.summaryGrid}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className={styles.statCard}>
            <div className={styles.content}>
              <span className={styles.label}>{stat.label}</span>
              <span className={styles.value}>{stat.value}</span>
            </div>
            <div className={`${styles.iconBox} ${stat.colorClass}`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MasterSummaryCards;
