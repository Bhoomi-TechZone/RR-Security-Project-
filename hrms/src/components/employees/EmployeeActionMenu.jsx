import React from 'react';
import { Eye, Edit2, ArrowLeftRight, Download, Trash2, MoreVertical, Key } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './EmployeeActionMenu.module.css';
import { usePermissions } from '../../context/PermissionContext';

/**
 * EmployeeActionMenu Component
 * Renders the three-dot action menu for each employee in the table/cards.
 */
function EmployeeActionMenu({ employee, onAction }) {
  const { canEdit, canDelete, canExport } = usePermissions();

  const allowEdit = canEdit('employees');
  const allowDelete = canDelete('employees');
  const allowExport = canExport('employees');

  return (
    <Dropdown
      align="right"
      trigger={
        <button className={styles.actionBtn} aria-label="Employee action menu">
          <MoreVertical size={16} />
        </button>
      }
    >
      <ul className={styles.menuList}>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('view', employee)}>
            <Eye size={14} />
            <span>View Profile</span>
          </button>
        </li>
        {allowEdit && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('edit', employee)}>
              <Edit2 size={14} />
              <span>Edit Employee</span>
            </button>
          </li>
        )}
        {allowEdit && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('credentials', employee)}>
              <Key size={14} />
              <span>Credentials</span>
            </button>
          </li>
        )}
        {allowEdit && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('transfer', employee)}>
              <ArrowLeftRight size={14} />
              <span>Transfer Company/Site</span>
            </button>
          </li>
        )}
        {allowExport && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('download', employee)}>
              <Download size={14} />
              <span>Download Profile</span>
            </button>
          </li>
        )}
        {allowDelete && (
          <li>
            <button 
              className={`${styles.menuItem} ${styles.deleteItem}`}
              onClick={() => onAction('delete', employee)}
            >
              <Trash2 size={14} />
              <span>Delete Employee</span>
            </button>
          </li>
        )}
      </ul>
    </Dropdown>
  );
}

export default EmployeeActionMenu;
