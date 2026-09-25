import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './CompanyFilters.module.css';

/**
 * CompanyFilters Component
 * Handles searching by name/GSTIN/contact person, filtering by status, and resetting filters.
 */
function CompanyFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters
}) {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search client, GSTIN or contact person..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <div className={styles.selectWrapper}>
          <select
            className={styles.statusSelect}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          className={styles.resetBtn}
          onClick={onResetFilters}
          aria-label="Reset all search and status filters"
        >
          <RotateCcw size={14} />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}

export default CompanyFilters;
