import React, { useMemo } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './EmployeeFilters.module.css';

/**
 * EmployeeFilters Component
 * Handles searching by name/contact/ID, and filtering by Client Company, Department, Designation, and Status.
 */
function EmployeeFilters({
  searchTerm,
  onSearchChange,
  companyFilter,
  onCompanyFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  designationFilter,
  onDesignationFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  clients = [],
  departments = [],
  designations = []
}) {
  const deptList = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === departmentFilter)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d));
    }
    return [];
  }, [departments, departmentFilter]);

  const desgList = useMemo(() => {
    if (designations && designations.length > 0) {
      return designations
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === designationFilter)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d));
    }
    return [];
  }, [designations, designationFilter]);

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search employee, contact or ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={companyFilter}
            onChange={(e) => onCompanyFilterChange(e.target.value)}
            aria-label="Filter by Company"
          >
            <option value="all">All Companies</option>
            {clients
              .filter((c) => !c.status || c.status === 'active' || (companyFilter !== 'all' && (c.clientId === companyFilter || c.id === companyFilter || c._id === companyFilter)))
              .map((c) => {
                const val = c.clientId || c.id || c._id;
                return (
                  <option key={val} value={val}>
                    {c.name}
                  </option>
                );
              })}
          </select>
        </div>

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

        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
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
          aria-label="Reset all search and filters"
        >
          <RotateCcw size={14} />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}

export default EmployeeFilters;
