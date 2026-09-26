import React from 'react';
import StatusBadge from '../common/StatusBadge';
import CompanyActionMenu from './CompanyActionMenu';
import EmptyState from '../common/EmptyState';
import styles from './CompanyTable.module.css';

/**
 * CompanyTable Component
 * Displays a list of companies in an enterprise table for desktop,
 * and a list of cards for mobile.
 */
function CompanyTable({
  companies = [],
  loading = false,
  onAction,
  onResetFilters
}) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>GSTIN</th>
                <th>Contact Person</th>
                <th>Contract Start</th>
                <th>Contract End</th>
                <th>Employees</th>
                <th>Status</th>
                <th className={styles.textCenter}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} className={styles.skeletonRow}>
                  <td>
                    <div className={styles.skeletonCompany}>
                      <div className={styles.skeletonAvatar} />
                      <div className={styles.skeletonTextStack}>
                        <div className={styles.skeletonBarShort} style={{ width: '120px' }} />
                        <div className={styles.skeletonBarShort} style={{ width: '80px' }} />
                      </div>
                    </div>
                  </td>
                  <td><div className={styles.skeletonBarShort} style={{ width: '100px' }} /></td>
                  <td>
                    <div className={styles.skeletonTextStack}>
                      <div className={styles.skeletonBarShort} style={{ width: '90px' }} />
                      <div className={styles.skeletonBarShort} style={{ width: '70px' }} />
                    </div>
                  </td>
                  <td><div className={styles.skeletonBarShort} style={{ width: '80px' }} /></td>
                  <td><div className={styles.skeletonBarShort} style={{ width: '80px' }} /></td>
                  <td><div className={styles.skeletonBarShort} style={{ width: '50px' }} /></td>
                  <td><div className={styles.skeletonBadge} /></td>
                  <td><div className={styles.skeletonAction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title="No clients found"
          description="Try changing your search or filters to locate client companies."
          actionLabel="Reset Filters"
          onAction={onResetFilters}
        />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      {/* Desktop / Tablet Grid Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th>
              <th>GSTIN</th>
              <th>Contact Person</th>
              <th>Contract Start</th>
              <th>Contract End</th>
              <th>Employees</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company._id || company.id || company.clientId}>
                <td>
                  <div className={styles.companyCell}>
                    <div className={styles.avatar}>
                      {company.initials || (company.name ? company.name.substring(0, 2).toUpperCase() : 'CL')}
                    </div>
                    <div className={styles.info}>
                      <span 
                        className={styles.companyName}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onAction && onAction('view', company)}
                        title="Click to view details"
                      >
                        {company.name}
                      </span>
                      <span className={styles.companyAddress}>{company.address || 'No address provided'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.gstin}>{company.gstin || 'N/A'}</span>
                </td>
                <td>
                  <div className={styles.contactCell}>
                    <span className={styles.contactName}>{company.contactPerson}</span>
                    <span className={styles.contactPhone}>{company.contactNumber || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.date}>{formatDate(company.contractStartDate)}</span>
                </td>
                <td>
                  <span className={styles.date}>{formatDate(company.contractEndDate)}</span>
                </td>
                <td>
                  <span className={styles.employeeCount}>
                    {company.employees || 0} Employees
                  </span>
                </td>
                <td>
                  <StatusBadge status={company.status} />
                </td>
                <td className={styles.textCenter}>
                  <CompanyActionMenu company={company} onAction={onAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className={styles.mobileList}>
        {companies.map((company) => (
          <div key={company.id} className={styles.mobileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.companyInfo}>
                <div className={styles.avatar}>
                  {company.initials || company.name.substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.info}>
                  <h4 className={styles.companyName}>{company.name}</h4>
                  <span className={styles.companyAddress}>{company.address}</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <StatusBadge status={company.status} />
                <CompanyActionMenu company={company} onAction={onAction} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>GSTIN:</span>
                <span className={styles.cardValue}>{company.gstin || 'N/A'}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Contact:</span>
                <span className={styles.cardValue}>
                  {company.contactPerson} {company.contactNumber && `(${company.contactNumber})`}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Start:</span>
                <span className={styles.cardValue}>{formatDate(company.contractStartDate)}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>End:</span>
                <span className={styles.cardValue}>{formatDate(company.contractEndDate)}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Employees:</span>
                <span className={`${styles.cardValue} ${styles.fontWeightBold}`}>
                  {company.employees || 0} Employees
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompanyTable;
