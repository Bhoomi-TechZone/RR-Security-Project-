import React from 'react';
import { Eye, Edit2, Power, Trash2, MoreVertical } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import styles from './MasterActionMenu.module.css';

/**
 * MasterActionMenu Component
 * Action menu for Master records (View, Edit, Activate/Deactivate, Delete).
 */
function MasterActionMenu({ item, onAction, activeTab }) {
  const isActive = item.status === 'active';
  const isSalaryComponent = activeTab === 'salary-components';

  return (
    <Dropdown
      align="right"
      trigger={
        <button className={styles.actionBtn} aria-label="Record action menu">
          <MoreVertical size={16} />
        </button>
      }
    >
      <ul className={styles.menuList}>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('view', item)}>
            <Eye size={14} />
            <span>View Details</span>
          </button>
        </li>
        <li>
          <button className={styles.menuItem} onClick={() => onAction('edit', item)}>
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
        </li>
        {isSalaryComponent ? (
          <li>
            <button 
              className={`${styles.menuItem} ${styles.deleteItem}`}
              onClick={() => onAction('delete', item)}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </li>
        ) : (
          <>
            <li>
              <button 
                className={`${styles.menuItem} ${isActive ? styles.deactivate : styles.activate}`}
                onClick={() => onAction(isActive ? 'deactivate' : 'activate', item)}
              >
                <Power size={14} />
                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
              </button>
            </li>
            <li>
              <button 
                className={`${styles.menuItem} ${styles.deleteItem}`}
                onClick={() => onAction('delete', item)}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </li>
          </>
        )}
      </ul>
    </Dropdown>
  );
}

export default MasterActionMenu;
