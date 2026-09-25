import React from 'react';
import { Eye, Edit2, Users, Power, MoreVertical } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './CompanyActionMenu.module.css';

/**
 * CompanyActionMenu Component
 * Renders the three-dot actions menu for each company in the table/cards.
 */
function CompanyActionMenu({ company, onAction }) {
  const isCompanyActive = company.status === 'active';

  return (
    <Dropdown
      align="right"
      trigger={
        <button className={styles.actionBtn} aria-label="Company action menu">
          <MoreVertical size={16} />
        </button>
      }
    >
      <ul className={styles.menuList}>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('view', company)}>
            <Eye size={14} />
            <span>View Details</span>
          </button>
        </li>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('edit', company)}>
            <Edit2 size={14} />
            <span>Edit Client</span>
          </button>
        </li>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('employees', company)}>
            <Users size={14} />
            <span>View Employees</span>
          </button>
        </li>
        <li>
          <button 
            className={`${styles.menuItem} ${isCompanyActive ? styles.deactivate : styles.activate}`}
            onClick={() => onAction(isCompanyActive ? 'deactivate' : 'activate', company)}
          >
            <Power size={14} />
            <span>{isCompanyActive ? 'Deactivate' : 'Activate'}</span>
          </button>
        </li>
      </ul>
    </Dropdown>
  );
}

export default CompanyActionMenu;
