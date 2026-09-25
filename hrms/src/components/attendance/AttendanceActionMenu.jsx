import React from 'react';
import { Eye, Edit2, CheckSquare, MoreVertical } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './AttendanceActionMenu.module.css';

/**
 * AttendanceActionMenu Component
 * Renders the three-dot dropdown action menu for attendance records.
 */
function AttendanceActionMenu({ record, onAction }) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button className={styles.actionBtn} aria-label="Attendance actions">
          <MoreVertical size={16} />
        </button>
      }
    >
      <ul className={styles.menuList}>
        <li>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => onAction('view', record)}
          >
            <Eye size={14} />
            <span>View Details</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => onAction('edit', record)}
          >
            <Edit2 size={14} />
            <span>Edit Attendance</span>
          </button>
        </li>
        {record.status === 'pendingCorrection' && (
          <li>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.reviewItem}`}
              onClick={() => onAction('review', record)}
            >
              <CheckSquare size={14} />
              <span>Review Correction</span>
            </button>
          </li>
        )}
      </ul>
    </Dropdown>
  );
}

export default AttendanceActionMenu;
