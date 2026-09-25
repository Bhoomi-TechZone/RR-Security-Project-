import React from 'react';
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './LocationSummaryCards.module.css';

/**
 * LocationSummaryCards Component
 * Displays summary cards for Work Locations (Total, Active, Inactive)
 */
function LocationSummaryCards({ locations = [] }) {
  const total = locations.length;
  const active = locations.filter(loc => loc.status === 'active').length;
  const inactive = locations.filter(loc => loc.status === 'inactive').length;

  const stats = [
    {
      id: 'total',
      label: 'Total Locations',
      value: total.toLocaleString(),
      icon: MapPin,
      colorClass: styles.blue
    },
    {
      id: 'active',
      label: 'Active Locations',
      value: active.toLocaleString(),
      icon: CheckCircle2,
      colorClass: styles.green
    },
    {
      id: 'inactive',
      label: 'Inactive Locations',
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

export default LocationSummaryCards;
