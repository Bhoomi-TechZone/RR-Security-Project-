import React from 'react';
import { Download, ChevronDown, Key, FileText, UserX, UserCheck } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './EmployeeActionMenu.module.css';
import { usePermissions } from '../../context/PermissionContext';

/**
 * EmployeeActionMenu Component
 * Renders the Options dropdown menu for each employee in the table/cards.
 * Note: Edit Employee is handled by the dedicated quick-edit button on the row,
 * and View Profile is triggered by clicking the employee record row directly.
 */
function EmployeeActionMenu({ employee, onAction }) {
  const { canEdit, canDelete, canExport } = usePermissions();

  const allowEdit = canEdit('employees');
  const allowDelete = canDelete('employees');
  const allowExport = canExport('employees');

  const isInactive = String(employee?.status || employee?.employeeStatus || '').toLowerCase() === 'inactive';

  return (
    <Dropdown
      align="right"
      trigger={
        <button className={styles.optionsBtn} aria-label="Employee options">
          <span>Options</span>
          <ChevronDown size={13} className={styles.chevronIcon} />
        </button>
      }
    >
      <ul className={styles.menuList}>
        {allowEdit && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('credentials', employee)}>
              <Key size={14} />
              <span>Credentials</span>
            </button>
          </li>
        )}
        <li>
          <button className={styles.menuItem} onClick={() => onAction('payslip', employee)}>
            <FileText size={14} />
            <span>Payslip</span>
          </button>
        </li>
        {allowExport && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('download', employee)}>
              <Download size={14} />
              <span>Download Profile</span>
            </button>
          </li>
        )}
        {(allowDelete || allowEdit) && (
          <li>
            {isInactive ? (
              <button 
                className={`${styles.menuItem} ${styles.activateItem || ''}`}
                onClick={() => onAction('activate', employee)}
                style={{ color: '#16a34a' }}
              >
                <UserCheck size={14} color="#16a34a" />
                <span>Activate Employee</span>
              </button>
            ) : (
              <button 
                className={`${styles.menuItem} ${styles.deleteItem}`}
                onClick={() => onAction('deactivate', employee)}
              >
                <UserX size={14} />
                <span>Deactivate Employee</span>
              </button>
            )}
          </li>
        )}
      </ul>
    </Dropdown>
  );
}

export default EmployeeActionMenu;
