import React from 'react';
import { Edit2, Power, Key } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import styles from './CompanyDetailsHeader.module.css';

/**
 * CompanyDetailsHeader Component
 * Renders the top profile card in the Company Details view.
 */
function CompanyDetailsHeader({ company, onEdit, onToggleStatus, onOpenCredentials }) {
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
            {company.clientId && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                backgroundColor: 'var(--primary-light, #eff6ff)',
                color: 'var(--primary, #2563eb)',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                letterSpacing: '0.5px'
              }}>
                {company.clientId}
              </span>
            )}
            <StatusBadge status={company.status} />
          </div>
          <p className={styles.industry}>
            {company.industry || 'Facility Management & Services'}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        {onOpenCredentials && (
          <button className={styles.editBtn} onClick={onOpenCredentials} title="View & manage client login credentials">
            <Key size={16} />
            <span>Credentials</span>
          </button>
        )}
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
