import React from 'react';
import { MoreVertical, Check, X, FileText } from 'lucide-react';
import styles from './LeaveRequests.module.css';
import StatusBadge from '../common/StatusBadge';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';

/**
 * LeaveRequests Component
 * Renders a data table listing pending leave requests with metadata details and action options.
 * Supports loading skeleton and empty results layout.
 */
function LeaveRequests({ requests = [], loading, onAction }) {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLink}`} />
        </div>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}><div className={`${styles.skeleton} ${styles.skeletonTh}`} /></th>
                <th className={styles.th}><div className={`${styles.skeleton} ${styles.skeletonTh}`} /></th>
                <th className={styles.th}><div className={`${styles.skeleton} ${styles.skeletonTh}`} /></th>
                <th className={styles.th}><div className={`${styles.skeleton} ${styles.skeletonTh}`} /></th>
                <th className={styles.th} style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((idx) => (
                <tr key={idx} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.avatarSkeletonRow}>
                      <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
                      <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80px' }} />
                    </div>
                  </td>
                  <td className={styles.td}><div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '90px' }} /></td>
                  <td className={styles.td}><div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '40px' }} /></td>
                  <td className={styles.td}><div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px' }} /></td>
                  <td className={styles.td}><div className={`${styles.skeleton} ${styles.skeletonActions}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerTitleArea}>
          <h3 className={styles.title}>Leave Requests</h3>
          <span className={styles.subtext}>Pending Requests</span>
        </div>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.viewAll}>
          View All
        </a>
      </div>

      <div className={styles.tableWrapper}>
        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">🍂</span>
            <p className={styles.emptyText}>No leave requests found.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Days</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className={styles.tr}>
                  {/* Employee Avatar + Initials */}
                  <td className={styles.td}>
                    <div className={styles.employeeCell}>
                      <Avatar 
                        initials={item.avatarInitials} 
                        size="sm" 
                        status={null} 
                        name={item.employee} 
                      />
                      <span className={styles.employeeName}>{item.employee}</span>
                    </div>
                  </td>
                  
                  {/* Leave type */}
                  <td className={styles.td}>
                    <span className={styles.leaveType}>{item.type}</span>
                  </td>
                  
                  {/* Duration */}
                  <td className={styles.td}>
                    <span className={styles.daysCount}>{item.days} {item.days > 1 ? 'days' : 'day'}</span>
                  </td>
                  
                  {/* Status Badge */}
                  <td className={styles.td}>
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Actions Dropdown */}
                  <td className={styles.td}>
                    <Dropdown 
                      align="right"
                      trigger={
                        <button className={styles.actionBtn} aria-label="Action options">
                          <MoreVertical size={16} />
                        </button>
                      }
                    >
                      <ul className={styles.actionMenu}>
                        <li className={styles.actionItem}>
                          <button 
                            onClick={() => onAction && onAction(item.id, 'Approved')} 
                            className={styles.actionLink}
                          >
                            <Check size={14} className={styles.approveIcon} />
                            <span>Approve Request</span>
                          </button>
                        </li>
                        <li className={styles.actionItem}>
                          <button 
                            onClick={() => onAction && onAction(item.id, 'Rejected')} 
                            className={styles.actionLink}
                          >
                            <X size={14} className={styles.rejectIcon} />
                            <span>Reject Request</span>
                          </button>
                        </li>
                        <li className={styles.actionItemDivider} />
                        <li className={styles.actionItem}>
                          <a href="#" onClick={(e) => e.preventDefault()} className={styles.actionLink}>
                            <FileText size={14} />
                            <span>View Details</span>
                          </a>
                        </li>
                      </ul>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default LeaveRequests;
