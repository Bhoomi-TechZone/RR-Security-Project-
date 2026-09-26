import React from 'react';
import { Eye, Edit2, ArrowLeftRight, Download, Power, MoreVertical } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './EmployeeActionMenu.module.css';

/**
 * EmployeeActionMenu Component
 * Renders the three-dot action menu for each employee in the table/cards.
 */
function EmployeeActionMenu({ employee, onAction }) {
  const isEmployeeActive = String(employee.status || '').toLowerCase() === 'active';

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
        <li>
          <button className={styles.menuItem} onClick={() => onAction('edit', employee)}>
            <Edit2 size={14} />
            <span>Edit Employee</span>
          </button>
        </li>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('transfer', employee)}>
            <ArrowLeftRight size={14} />
            <span>Transfer Company/Site</span>
          </button>
        </li>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('download', employee)}>
            <Download size={14} />
            <span>Download Profile</span>
          </button>
        </li>
        <li>
          <button 
            className={`${styles.menuItem} ${isEmployeeActive ? styles.deactivate : styles.activate}`}
            onClick={() => onAction(isEmployeeActive ? 'deactivate' : 'activate', employee)}
          >
            <Power size={14} />
            <span>{isEmployeeActive ? 'Deactivate Employee' : 'Activate Employee'}</span>
          </button>
        </li>
      </ul>
    </Dropdown>
  );
}

export default EmployeeActionMenu;
