import React from 'react';
import { Eye, Edit2, Users, Power, MoreVertical, Key } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './CompanyActionMenu.module.css';
import { usePermissions } from '../../context/PermissionContext';

/**
 * CompanyActionMenu Component
 * Renders the three-dot actions menu for each company in the table/cards.
 */
function CompanyActionMenu({ company, onAction }) {
  const isCompanyActive = company.status === 'active';
  const { canEdit, canDelete } = usePermissions();

  const allowEdit = canEdit('clients');
  const allowDelete = canDelete('clients');

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
        {allowEdit && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('credentials', company)}>
              <Key size={14} />
              <span>Credentials</span>
            </button>
          </li>
        )}
        {allowEdit && (
          <li>
            <button className={styles.menuItem} onClick={() => onAction('edit', company)}>
              <Edit2 size={14} />
              <span>Edit Client</span>
            </button>
          </li>
        )}
        <li>
          <button className={styles.menuItem} onClick={() => onAction('employees', company)}>
            <Users size={14} />
            <span>View Employees</span>
          </button>
        </li>
        {allowDelete && (
          <li>
            <button 
              className={`${styles.menuItem} ${isCompanyActive ? styles.deactivate : styles.activate}`}
              onClick={() => onAction(isCompanyActive ? 'deactivate' : 'activate', company)}
            >
              <Power size={14} />
              <span>{isCompanyActive ? 'Deactivate' : 'Activate'}</span>
            </button>
          </li>
        )}
      </ul>
    </Dropdown>
  );
}

export default CompanyActionMenu;
