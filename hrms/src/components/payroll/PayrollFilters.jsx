import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './PayrollFilters.module.css';

export default function PayrollFilters({
  search,
  onSearchChange,
  client,
  onClientChange,
  department,
  onDepartmentChange,
  designation,
  onDesignationChange,
  status,
  onStatusChange,
  onReset,
  companies = [],
  departments = [],
  designations = [],
  showStatusFilter = true
}) {
  return (
    <div className={styles.filterCard}>
      <div className={styles.filterGrid}>
        {/* Search */}
        <div className={styles.searchField}>
          <label className={styles.fieldLabel}>Search Employee</label>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search employee or employee ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Client */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Client</label>
          <select
            className={styles.select}
            value={client}
            onChange={(e) => onClientChange(e.target.value)}
          >
            <option value="">All Clients</option>
            {companies.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Department</label>
          <select
            className={styles.select}
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id || d.name || d} value={d.name || d}>
                {d.name || d}
              </option>
            ))}
          </select>
        </div>

        {/* Designation */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Designation</label>
          <select
            className={styles.select}
            value={designation}
            onChange={(e) => onDesignationChange(e.target.value)}
          >
            <option value="">All Designations</option>
            {designations.map((desig) => (
              <option key={desig.id || desig.name || desig} value={desig.name || desig}>
                {desig.name || desig}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        {showStatusFilter && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Payroll Status</label>
            <select
              className={styles.select}
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="calculated">Calculated</option>
              <option value="processed">Processed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        )}

        {/* Reset */}
        <div className={styles.actionWrap}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onReset}
            title="Reset Filters"
          >
            <RotateCcw size={15} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
