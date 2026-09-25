import React from 'react';
import { Building, Hash, MapPin, User, Phone, Calendar, Users, ShieldAlert } from 'lucide-react';
import styles from './CompanyOverview.module.css';

/**
 * CompanyOverview Component
 * Displays the grid profile information card for the company details tab.
 */
function CompanyOverview({ company }) {
  if (!company) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const fields = [
    {
      label: 'Client Name',
      value: company.name,
      icon: Building
    },
    {
      label: 'GSTIN',
      value: company.gstin || 'N/A',
      icon: Hash,
      highlight: true
    },
    {
      label: 'Contact Person',
      value: company.contactPerson,
      icon: User
    },
    {
      label: 'Contact Number',
      value: company.contactNumber || 'N/A',
      icon: Phone
    },
    {
      label: 'Contract Start Date',
      value: formatDate(company.contractStartDate),
      icon: Calendar
    },
    {
      label: 'Contract End Date',
      value: formatDate(company.contractEndDate),
      icon: Calendar
    },
    {
      label: 'Total Employees',
      value: `${company.employees || 0} Employees`,
      icon: Users,
      badge: true
    },
    {
      label: 'Company Status',
      value: company.status.toUpperCase(),
      icon: ShieldAlert,
      statusBadge: true
    },
    {
      label: 'Company Address',
      value: company.address,
      icon: MapPin,
      fullWidth: true
    }
  ];

  return (
    <div className={styles.grid}>
      {fields.map((field, idx) => {
        const Icon = field.icon;
        return (
          <div
            key={idx}
            className={`${styles.infoBlock} ${field.fullWidth ? styles.fullWidth : ''}`}
          >
            <div className={styles.labelRow}>
              <Icon size={16} className={styles.icon} />
              <span className={styles.label}>{field.label}</span>
            </div>
            <div className={styles.valueRow}>
              <span
                className={`${styles.value} ${field.highlight ? styles.gstin : ''} ${
                  field.badge ? styles.empBadge : ''
                } ${field.statusBadge ? (company.status === 'active' ? styles.active : styles.inactive) : ''}`}
              >
                {field.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompanyOverview;
