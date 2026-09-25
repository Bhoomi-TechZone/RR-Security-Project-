import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import styles from './MasterToolbar.module.css';

/**
 * MasterToolbar Component
 * Search bar, filters and Add button that dynamically updates according to the active master tab.
 */
function MasterToolbar({ 
  activeTab, 
  searchTerm, 
  onSearchChange, 
  onAddNew,
  holidayYear,
  onHolidayYearChange
}) {
  const getTabConfig = () => {
    switch (activeTab) {
      case 'banks':
        return { placeholder: 'Search bank name or code...', addLabel: 'Add Bank' };
      case 'clients':
        return { placeholder: 'Search client, code, or contact...', addLabel: 'Add Client' };
      case 'departments':
        return { placeholder: 'Search department name or code...', addLabel: 'Add Department' };
      case 'designations':
        return { placeholder: 'Search designation or department...', addLabel: 'Add Designation' };
      case 'employee-types':
        return { placeholder: 'Search employee type name or code...', addLabel: 'Add Employee Type' };
      case 'sites':
        return { placeholder: 'Search site name, code, client, or city...', addLabel: 'Add Site' };
      case 'posts':
        return { placeholder: 'Search post name or code...', addLabel: 'Add Post' };
      case 'shifts':
        return { placeholder: 'Search shift name, code, or timing...', addLabel: 'Add Shift' };
      case 'leave-types':
        return { placeholder: 'Search leave name or code...', addLabel: 'Add Leave Type' };
      case 'holidays':
        return { placeholder: 'Search holiday name, date, or type...', addLabel: 'Add Holiday' };
      case 'salary-components':
        return { placeholder: 'Search component name or code...', addLabel: 'Add Component' };
      case 'document-types':
        return { placeholder: 'Search document name or code...', addLabel: 'Add Document Type' };
      default:
        return { placeholder: 'Search...', addLabel: 'Add Record' };
    }
  };

  const { placeholder, addLabel } = getTabConfig();

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.leftTools}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={placeholder}
          />
        </div>

        {activeTab === 'holidays' && onHolidayYearChange && (
          <div className={styles.filterWrapper}>
            <select
              className={styles.yearSelect}
              value={holidayYear || '2026'}
              onChange={(e) => onHolidayYearChange(e.target.value)}
              aria-label="Filter by Year"
            >
              <option value="all">All Years</option>
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.addBtn}
        onClick={onAddNew}
        aria-label={addLabel}
      >
        <Plus size={16} />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}

export default MasterToolbar;
