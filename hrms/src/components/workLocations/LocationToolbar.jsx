import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import styles from './LocationToolbar.module.css';

/**
 * LocationToolbar Component
 * Search bar and Add Location button
 */
function LocationToolbar({ searchTerm, onSearchChange, onAddNew, onFilterToggle, showFilters }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search locations by name, city, state, or PIN code..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
          aria-label="Search work locations"
        />
      </div>

      <div className={styles.actions}>
        <button 
          type="button"
          onClick={onFilterToggle}
          className={`${styles.filterBtn} ${showFilters ? styles.active : ''}`}
          aria-label="Toggle filters"
        >
          <Filter size={16} />
          Filters
        </button>
        <button
          type="button"
          onClick={onAddNew}
          className={styles.addBtn}
          aria-label="Add new work location"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Location
        </button>
      </div>
    </div>
  );
}

export default LocationToolbar;
