import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './EmployeeFilters.module.css';
import { mockDepartments, mockDesignations } from '../../data/employeeData';

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
  clients = []
}) {
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
            {clients.map((c) => {
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
            {mockDepartments.map((dept) => (
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
            {mockDesignations.map((desg) => (
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
