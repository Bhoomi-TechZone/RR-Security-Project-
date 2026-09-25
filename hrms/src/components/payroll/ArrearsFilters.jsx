import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './ArrearsFilters.module.css';

export default function ArrearsFilters({
  search = '',
  onSearchChange,
  setSearch,
  client = '',
  clientFilter = '',
  onClientChange,
  setClientFilter,
  status = '',
  payrollStatusFilter = '',
  onStatusChange,
  setPayrollStatusFilter,
  companies = [],
  clients = [],
  onReset
}) {
  const currentSearch = search;
  const handleSearch = (val) => {
    if (onSearchChange) onSearchChange(val);
    if (setSearch) setSearch(val);
  };

  const currentClient = client || clientFilter;
  const handleClient = (val) => {
    if (onClientChange) onClientChange(val);
    if (setClientFilter) setClientFilter(val);
  };

  const currentStatus = status || payrollStatusFilter;
  const handleStatus = (val) => {
    if (onStatusChange) onStatusChange(val);
    if (setPayrollStatusFilter) setPayrollStatusFilter(val);
  };

  const companyList = companies.length > 0 ? companies : clients;

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by arrear ID, employee code or name..."
          value={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.selectGroup}>
        {/* Client / Site Filter */}
        <select
          value={currentClient}
          onChange={(e) => handleClient(e.target.value)}
          className={styles.select}
          aria-label="Filter by Client"
        >
          <option value="">All Clients &amp; Sites</option>
          {companyList.map((c) => (
            <option key={c.id || c.name} value={c.name || c.companyName}>
              {c.name || c.companyName}
            </option>
          ))}
        </select>

        {/* Payroll Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => handleStatus(e.target.value)}
          className={styles.select}
          aria-label="Filter by Payroll Status"
        >
          <option value="">All Arrear Statuses</option>
          <option value="Pending Calculation">Pending Calculation</option>
          <option value="Calculated">Calculated</option>
          <option value="Included in Payroll">Included in Payroll</option>
        </select>

        {/* Reset Button */}
        {(currentSearch || currentClient || currentStatus) && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onReset}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
