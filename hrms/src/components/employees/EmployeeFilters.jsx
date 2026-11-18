import React, { useMemo } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import styles from './EmployeeFilters.module.css';

/**
 * EmployeeFilters Component
 * Updated to match the modern dashboard layout:
 * - Header with "All Employees", subtitle and sort toggles (Name | E-Code | DOJ)
 * - Labeled dropdown filters: Client Unit, Location, Department, Designation
 * - Interactive Active / Inactive switch toggles
 * - Attached search bar with search button + Reset Filters
 */
function EmployeeFilters({
  searchTerm = '',
  onSearchChange,
  companyFilter = 'all',
  onCompanyFilterChange,
  locationFilter = 'all',
  onLocationFilterChange,
  departmentFilter = 'all',
  onDepartmentFilterChange,
  designationFilter = 'all',
  onDesignationFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  sortBy = 'none',
  onSortChange,
  sortOrder = 'asc',
  onSortOrderChange,
  onResetFilters,
  clients = [],
  locations = [],
  departments = [],
  designations = []
}) {
  const deptList = useMemo(() => {
    if (departments && departments.length > 0) {
      const items = departments
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === departmentFilter)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d))
        .filter(Boolean);
      return Array.from(new Set(items));
    }
    return [];
  }, [departments, departmentFilter]);

  const desgList = useMemo(() => {
    if (designations && designations.length > 0) {
      const items = designations
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === designationFilter)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d))
        .filter(Boolean);
      return Array.from(new Set(items));
    }
    return [];
  }, [designations, designationFilter]);

  const clientList = useMemo(() => {
    if (clients && clients.length > 0) {
      const filtered = clients.filter(
        (c) => !c.status || c.status === 'active' || (companyFilter !== 'all' && (c.clientId === companyFilter || c.id === companyFilter || c._id === companyFilter))
      );
      const seen = new Set();
      return filtered.filter((c) => {
        const val = c.clientId || c.id || c._id;
        if (!val || seen.has(val)) return false;
        seen.add(val);
        return true;
      });
    }
    return [];
  }, [clients, companyFilter]);

  const locList = useMemo(() => {
    if (locations && locations.length > 0) {
      const items = locations
        .map(l => (typeof l === 'string' ? l : l.name || l.locationName || l.title || l.siteName))
        .filter(Boolean);
      return Array.from(new Set(items));
    }
    return [];
  }, [locations]);

  // Handle sort button click
  const handleSortToggle = (field) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') {
        onSortOrderChange('desc');
      } else {
        onSortChange('none');
        onSortOrderChange('asc');
      }
    } else {
      onSortChange(field);
      onSortOrderChange('asc');
    }
  };

  // Toggle active/inactive filter
  const handleStatusToggle = (targetStatus) => {
    const current = (statusFilter || 'all').toLowerCase();
    if (current === targetStatus) {
      onStatusFilterChange('all');
    } else {
      onStatusFilterChange(targetStatus);
    }
  };

  const isActiveActive = (statusFilter || '').toLowerCase() === 'active';
  const isInactiveActive = (statusFilter || '').toLowerCase() === 'inactive';

  return (
    <div className={styles.filtersContainer}>
      {/* Top Header Row: Title & Subtitle + Sort Options */}
      <div className={styles.filterHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconWrap}>
            <Users size={22} className={styles.headerIcon} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>All Employees</h2>
            <p className={styles.headerSubtitle}>
              List of employees. Filter by client unit, location or department.
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.sortContainer}>
            <ArrowUpDown size={14} className={styles.sortIndicatorIcon} />
            <div className={styles.sortButtonGroup}>
              <button
                type="button"
                className={`${styles.sortBtn} ${sortBy === 'name' ? styles.sortBtnActive : ''}`}
                onClick={() => handleSortToggle('name')}
                title="Sort by Name"
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                type="button"
                className={`${styles.sortBtn} ${sortBy === 'code' ? styles.sortBtnActive : ''}`}
                onClick={() => handleSortToggle('code')}
                title="Sort by Employee Code"
              >
                E-Code {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                type="button"
                className={`${styles.sortBtn} ${sortBy === 'doj' ? styles.sortBtnActive : ''}`}
                onClick={() => handleSortToggle('doj')}
                title="Sort by Date of Joining"
              >
                DOJ {sortBy === 'doj' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Filters Grid + Active/Inactive Status Switch */}
      <div className={styles.controlsRow}>
        <div className={styles.dropdownsGrid}>
          {/* Client Unit (Business Unit) */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Client Unit</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={companyFilter}
                onChange={(e) => onCompanyFilterChange(e.target.value)}
                aria-label="Filter by Client Unit"
              >
                <option value="all">All Units</option>
                {clientList.map((c) => {
                  const val = c.clientId || c.id || c._id;
                  return (
                    <option key={val} value={val}>
                      {c.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Location</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={locationFilter}
                onChange={(e) => onLocationFilterChange && onLocationFilterChange(e.target.value)}
                aria-label="Filter by Location"
              >
                <option value="all">All Locations</option>
                {locList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Department</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={departmentFilter}
                onChange={(e) => onDepartmentFilterChange(e.target.value)}
                aria-label="Filter by Department"
              >
                <option value="all">All Departments</option>
                {deptList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Designation */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Designation</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={designationFilter}
                onChange={(e) => onDesignationFilterChange(e.target.value)}
                aria-label="Filter by Designation"
              >
                <option value="all">All Designations</option>
                {desgList.map((desg) => (
                  <option key={desg} value={desg}>
                    {desg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Switches: Active / Inactive */}
        <div className={styles.statusTogglesWrapper}>
          <button
            type="button"
            className={`${styles.toggleItem} ${isActiveActive ? styles.toggleItemActiveRed : ''}`}
            onClick={() => handleStatusToggle('active')}
            aria-pressed={isActiveActive}
            title="Filter by Active Employees"
          >
            <span className={`${styles.switchTrack} ${isActiveActive ? styles.switchTrackActiveRed : ''}`}>
              <span className={styles.switchThumb} />
            </span>
            <span className={styles.toggleLabel}>Active</span>
          </button>

          <button
            type="button"
            className={`${styles.toggleItem} ${isInactiveActive ? styles.toggleItemActiveSlate : ''}`}
            onClick={() => handleStatusToggle('inactive')}
            aria-pressed={isInactiveActive}
            title="Filter by Inactive Employees"
          >
            <span className={`${styles.switchTrack} ${isInactiveActive ? styles.switchTrackActiveSlate : ''}`}>
              <span className={styles.switchThumb} />
            </span>
            <span className={styles.toggleLabel}>Inactive</span>
          </button>
        </div>
      </div>

      {/* Bottom Search Row: Search Employee input with attached search button + Reset Filters */}
      <div className={styles.searchRow}>
        <div className={styles.searchGroup}>
          <label className={styles.fieldLabel}>Search Employee</label>
          <div className={styles.searchBox}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
              type="button"
              className={styles.searchBtn}
              title="Search"
              aria-label="Search"
            >
              <Search size={15} />
            </button>
          </div>
        </div>

        {(searchTerm || companyFilter !== 'all' || locationFilter !== 'all' || departmentFilter !== 'all' || designationFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'none') && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onResetFilters}
            aria-label="Reset all search and filters"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default EmployeeFilters;
