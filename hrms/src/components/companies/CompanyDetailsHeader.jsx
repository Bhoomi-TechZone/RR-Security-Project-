import React from 'react';
import { Edit2, Power } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import styles from './CompanyDetailsHeader.module.css';

/**
 * CompanyDetailsHeader Component
 * Renders the top profile card in the Company Details view.
 */
function CompanyDetailsHeader({ company, onEdit, onToggleStatus }) {
  if (!company) return null;

  const isCompanyActive = company.status === 'active';

  return (
    <div className={styles.card}>
      <div className={styles.profileSection}>
        <div className={styles.avatar}>
          {company.initials || company.name.substring(0, 2).toUpperCase()}
        </div>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1 className={styles.name}>{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          <p className={styles.industry}>
            {company.industry || 'Facility Management & Services'}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.editBtn} onClick={onEdit}>
          <Edit2 size={16} />
          <span>Edit Client</span>
        </button>
        <button
          className={`${styles.statusBtn} ${
            isCompanyActive ? styles.deactivate : styles.activate
          }`}
          onClick={onToggleStatus}
        >
          <Power size={16} />
          <span>{isCompanyActive ? 'Deactivate' : 'Activate'}</span>
        </button>
      </div>
    </div>
  );
}

export default CompanyDetailsHeader;
