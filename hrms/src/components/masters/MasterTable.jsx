import React from 'react';
import StatusBadge from '../common/StatusBadge';
import MasterActionMenu from './MasterActionMenu';
import EmptyState from '../common/EmptyState';
import styles from './MasterTable.module.css';

/**
 * MasterTable Component
 * Universal table rendering data for all 12 Master categories.
 */
function MasterTable({
  activeTab,
  items = [],
  loading = false,
  onAction,
  onResetSearch
}) {
  const getTabLabelPlural = () => {
    switch (activeTab) {
      case 'banks': return 'banks';
      case 'clients': return 'clients';
      case 'departments': return 'departments';
      case 'designations': return 'designations';
      case 'employee-types': return 'employee types';
      case 'sites': return 'sites';
      case 'posts': return 'posts';
      case 'shifts': return 'shifts';
      case 'leave-types': return 'leave types';
      case 'holidays': return 'holidays';
      case 'salary-components': return 'salary components';
      case 'document-types': return 'document types';
      default: return 'records';
    }
  };

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

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
  };

  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code / Details</th>
              <th>Category / Info</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className={styles.skeletonRow}>
                <td><div className={styles.skeletonBar} style={{ width: '160px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '100px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '120px' }} /></td>
                <td><div className={styles.skeletonBadge} /></td>
                <td><div className={styles.skeletonAction} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title={`No ${getTabLabelPlural()} found`}
          description={`No ${getTabLabelPlural()} match your current search criteria.`}
          actionLabel="Clear Search"
          onAction={onResetSearch}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {/* Dynamic Headers based on activeTab */}
              {activeTab === 'banks' && (
                <>
                  <th>Bank Name</th>
                  <th>Short Code</th>
                  <th>Branches</th>
                </>
              )}

              {activeTab === 'clients' && (
                <>
                  <th>Client / Company</th>
                  <th>Client Code</th>
                  <th>Contact Person</th>
                  <th>Services Required</th>
                  <th>Contract Start</th>
                </>
              )}

              {activeTab === 'departments' && (
                <>
                  <th>Department</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Employees</th>
                </>
              )}

              {activeTab === 'designations' && (
                <>
                  <th>Designation</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Description</th>
                </>
              )}

              {activeTab === 'employee-types' && (
                <>
                  <th>Employee Type</th>
                  <th>Type Code</th>
                  <th>Description</th>
                </>
              )}

              {activeTab === 'sites' && (
                <>
                  <th>Site Name</th>
                  <th>Site Code</th>
                  <th>Client</th>
                  <th>Branch / Location</th>
                  <th>Min Manpower</th>
                </>
              )}

              {activeTab === 'posts' && (
                <>
                  <th>Post Name</th>
                  <th>Post Code</th>
                  <th>Description</th>
                </>
              )}

              {activeTab === 'shifts' && (
                <>
                  <th>Shift Name</th>
                  <th>Code</th>
                  <th>Timings</th>
                  <th>Break</th>
                  <th>Description</th>
                </>
              )}

              {activeTab === 'leave-types' && (
                <>
                  <th>Leave Type</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Annual Quota</th>
                  <th>Carry Forward</th>
                  <th>Encashment</th>
                </>
              )}

              {activeTab === 'holidays' && (
                <>
                  <th>Holiday Name</th>
                  <th>Date</th>
                  <th>Holiday Type</th>
                  <th>Applicable Location</th>
                </>
              )}

              {activeTab === 'salary-components' && (
                <>
                  <th>Component Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Calculation Type</th>
                  <th>Default Value</th>
                  <th>Taxable</th>
                </>
              )}

              {activeTab === 'document-types' && (
                <>
                  <th>Document Type</th>
                  <th>Code</th>
                  <th>Required</th>
                  <th>Expiry Alert</th>
                  <th>Verification</th>
                </>
              )}

              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {/* 1. BANKS */}
                {activeTab === 'banks' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td><span className={styles.countText}>{item.branches || 0} Branches</span></td>
                  </>
                )}

                {/* 2. CLIENTS */}
                {activeTab === 'clients' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code || '—'}</span></td>
                    <td>
                      <div className={styles.contactStack}>
                        <span className={styles.contactName}>{item.contactPerson || 'N/A'}</span>
                        {item.contactNumber && <span className={styles.contactPhone}>{item.contactNumber}</span>}
                      </div>
                    </td>
                    <td>
                      {Array.isArray(item.servicesRequired) && item.servicesRequired.length > 0 ? (
                        <div className={styles.tagsStack}>
                          <span className={styles.tagBadge}>{item.servicesRequired[0]}</span>
                          {item.servicesRequired.length > 1 && (
                            <span className={styles.tagMore}>+{item.servicesRequired.length - 1} more</span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.muted}>All Services</span>
                      )}
                    </td>
                    <td><span className={styles.dateText}>{formatDate(item.contractStartDate)}</span></td>
                  </>
                )}

                {/* 3. DEPARTMENTS */}
                {activeTab === 'departments' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code || '—'}</span></td>
                    <td><span className={styles.descText}>{item.description || '—'}</span></td>
                    <td><span className={styles.countText}>{item.employees || 0} Employees</span></td>
                  </>
                )}

                {/* 4. DESIGNATIONS */}
                {activeTab === 'designations' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code || '—'}</span></td>
                    <td><span className={styles.deptBadge}>{item.department || 'General'}</span></td>
                    <td><span className={styles.descText}>{item.description || '—'}</span></td>
                  </>
                )}

                {/* 5. EMPLOYEE TYPES */}
                {activeTab === 'employee-types' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td><span className={styles.descText}>{item.description || '—'}</span></td>
                  </>
                )}

                {/* 6. SITES */}
                {activeTab === 'sites' && (
                  <>
                    <td>
                      <div className={styles.siteStack}>
                        <span className={styles.primaryText}>{item.name}</span>
                        {item.city && <span className={styles.siteCity}>{item.city}, {item.state}</span>}
                      </div>
                    </td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td><span className={styles.clientBadge}>{item.clientName || 'N/A'}</span></td>
                    <td><span className={styles.branchText}>{item.workLocationName || 'All Branches'}</span></td>
                    <td><span className={styles.countText}>{item.minimumManpower || 0} Guards</span></td>
                  </>
                )}

                {/* 7. POSTS */}
                {activeTab === 'posts' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td><span className={styles.descText}>{item.description || '—'}</span></td>
                  </>
                )}

                {/* 8. SHIFTS */}
                {activeTab === 'shifts' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td>
                      <span className={styles.timeBadge}>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                    </td>
                    <td><span className={styles.countText}>{item.breakDuration || 0} mins</span></td>
                    <td><span className={styles.descText}>{item.description || '—'}</span></td>
                  </>
                )}

                {/* 9. LEAVE TYPES */}
                {activeTab === 'leave-types' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td>
                      <span className={`${styles.typeBadge} ${item.paidType === 'paid' ? styles.typePaid : styles.typeUnpaid}`}>
                        {item.paidType === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td><span className={styles.countText}>{item.annualQuota || 0} Days/yr</span></td>
                    <td><span className={styles.flagText}>{item.carryForward ? '✓ Yes' : '✕ No'}</span></td>
                    <td><span className={styles.flagText}>{item.encashment ? '✓ Yes' : '✕ No'}</span></td>
                  </>
                )}

                {/* 10. HOLIDAYS */}
                {activeTab === 'holidays' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.dateText}>{formatDate(item.date)}</span></td>
                    <td>
                      <span className={`${styles.holidayTypeBadge} ${styles[item.holidayType] || ''}`}>
                        {item.holidayType ? item.holidayType.toUpperCase() : 'GENERAL'}
                      </span>
                    </td>
                    <td><span className={styles.branchText}>{item.applicableLocation || 'All Locations'}</span></td>
                  </>
                )}

                {/* 11. SALARY COMPONENTS */}
                {activeTab === 'salary-components' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td>
                      <span className={`${styles.typeBadge} ${item.type === 'earning' ? styles.typeEarning : styles.typeDeduction}`}>
                        {item.type === 'earning' ? 'Earning (+)' : 'Deduction (-)'}
                      </span>
                    </td>
                    <td><span className={styles.descText}>{item.calculationType || 'Fixed'}</span></td>
                    <td><span className={styles.countText}>{item.defaultValue || '—'}</span></td>
                    <td>
                      <span className={styles.flagText}>
                        {item.taxable === 'taxable' ? 'Taxable' : 'Non-Taxable'}
                      </span>
                    </td>
                  </>
                )}

                {/* 12. DOCUMENT TYPES */}
                {activeTab === 'document-types' && (
                  <>
                    <td><span className={styles.primaryText}>{item.name}</span></td>
                    <td><span className={styles.codeBadge}>{item.code}</span></td>
                    <td>
                      <span className={`${styles.typeBadge} ${item.requiredType === 'required' ? styles.typeRequired : styles.typeOptional}`}>
                        {item.requiredType === 'required' ? 'Mandatory' : 'Optional'}
                      </span>
                    </td>
                    <td><span className={styles.flagText}>{item.expiryRequired ? '✓ Track Expiry' : '✕ No Expiry'}</span></td>
                    <td><span className={styles.flagText}>{item.verificationRequired ? '✓ Required' : '✕ Not Required'}</span></td>
                  </>
                )}

                {/* STATUS & ACTIONS */}
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td className={styles.textCenter}>
                  <MasterActionMenu
                    item={item}
                    onAction={(actionType) => onAction(actionType, item)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MasterTable;
