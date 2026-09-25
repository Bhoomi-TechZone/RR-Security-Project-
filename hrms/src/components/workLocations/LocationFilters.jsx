import React from 'react';
import styles from './LocationFilters.module.css';

/**
 * LocationFilters Component
 * Filter controls for Status and Location Type
 */
function LocationFilters({ filters, onFilterChange }) {
  return (
    <div className={styles.filtersPanel}>
      <div className={styles.filterGroup}>
        <label htmlFor="statusFilter" className={styles.filterLabel}>
          Status
        </label>
        <select
          id="statusFilter"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="typeFilter" className={styles.filterLabel}>
          Location Type
        </label>
        <select
          id="typeFilter"
          value={filters.locationType}
          onChange={(e) => onFilterChange('locationType', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="head-office">Head Office</option>
          <option value="branch">Branch</option>
          <option value="office">Office</option>
        </select>
      </div>
    </div>
  );
}

export default LocationFilters;
