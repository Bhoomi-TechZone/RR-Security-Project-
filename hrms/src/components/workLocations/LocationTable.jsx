import React from 'react';
import { Eye, Edit2, MoreVertical } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import Dropdown from '../common/Dropdown';
import styles from './LocationTable.module.css';

/**
 * LocationTable Component
 * Displays work locations in a table format
 */
function LocationTable({ locations = [], loading = false, onAction, onResetSearch }) {
  const getLocationTypeLabel = (type) => {
    const typeMap = {
      'head-office': 'Head Office',
      'branch': 'Branch',
      'office': 'Office'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Location Name</th>
              <th>Type</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>PIN Code</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className={styles.skeletonRow}>
                <td><div className={styles.skeletonBar} style={{ width: '160px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '100px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '200px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '100px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '100px' }} /></td>
                <td><div className={styles.skeletonBar} style={{ width: '80px' }} /></td>
                <td><div className={styles.skeletonBadge} /></td>
                <td><div className={styles.skeletonAction} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title="No work locations found"
          description="No locations match your current search criteria."
          actionLabel="Clear Search"
          onAction={onResetSearch}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Desktop / Tablet Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Location Name</th>
              <th>Type</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>PIN Code</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <td>
                  <span className={styles.primaryText}>{location.locationName}</span>
                </td>
                <td>
                  <span className={styles.typeLabel}>{getLocationTypeLabel(location.locationType)}</span>
                </td>
                <td>
                  <span className={styles.addressText}>{location.address}</span>
                </td>
                <td>
                  <span className={styles.secondaryText}>{location.city}</span>
                </td>
                <td>
                  <span className={styles.secondaryText}>{location.state}</span>
                </td>
                <td>
                  <span className={styles.pinCode}>{location.pinCode}</span>
                </td>
                <td>
                  <StatusBadge status={location.status} />
                </td>
                <td className={styles.textCenter}>
                  <Dropdown
                    align="right"
                    trigger={
                      <button className={styles.actionBtn} aria-label="More actions">
                        <MoreVertical size={16} />
                      </button>
                    }
                  >
                    <ul className={styles.actionMenu}>
                      <li>
                        <button
                          onClick={() => onAction('view', location)}
                          className={styles.actionLink}
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => onAction('edit', location)}
                          className={styles.actionLink}
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                      </li>
                      <li className={styles.divider} />
                      {location.status === 'active' ? (
                        <li>
                          <button
                            onClick={() => onAction('deactivate', location)}
                            className={`${styles.actionLink} ${styles.dangerAction}`}
                          >
                            <span>Deactivate</span>
                          </button>
                        </li>
                      ) : (
                        <li>
                          <button
                            onClick={() => onAction('activate', location)}
                            className={`${styles.actionLink} ${styles.successAction}`}
                          >
                            <span>Activate</span>
                          </button>
                        </li>
                      )}
                    </ul>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className={styles.mobileCards}>
        {locations.map((location) => (
          <div key={location.id} className={styles.mobileCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>{location.locationName}</h3>
                <span className={styles.cardType}>{getLocationTypeLabel(location.locationType)}</span>
              </div>
              <StatusBadge status={location.status} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Address:</span>
                <span className={styles.cardValue}>{location.address}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>City:</span>
                <span className={styles.cardValue}>{location.city}, {location.state}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>PIN Code:</span>
                <span className={styles.cardValue}>{location.pinCode}</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button
                onClick={() => onAction('view', location)}
                className={styles.cardBtn}
              >
                <Eye size={16} />
                View
              </button>
              <button
                onClick={() => onAction('edit', location)}
                className={styles.cardBtn}
              >
                <Edit2 size={16} />
                Edit
              </button>
              {location.status === 'active' ? (
                <button
                  onClick={() => onAction('deactivate', location)}
                  className={`${styles.cardBtn} ${styles.dangerBtn}`}
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => onAction('activate', location)}
                  className={`${styles.cardBtn} ${styles.successBtn}`}
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LocationTable;
