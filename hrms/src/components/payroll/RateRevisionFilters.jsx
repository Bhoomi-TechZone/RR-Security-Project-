import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './RateRevisionFilters.module.css';

export default function RateRevisionFilters({
  search = '',
  onSearchChange,
  setSearch,
  client = '',
  clientFilter = '',
  onClientChange,
  setClientFilter,
  status = '',
  statusFilter = '',
  onStatusChange,
  setStatusFilter,
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

  const currentStatus = status || statusFilter;
  const handleStatus = (val) => {
    if (onStatusChange) onStatusChange(val);
    if (setStatusFilter) setStatusFilter(val);
  };

  const companyList = companies.length > 0 ? companies : clients;

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by revision ID, employee code or name..."
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

        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => handleStatus(e.target.value)}
          className={styles.select}
          aria-label="Filter by Revision Status"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Effective">Effective</option>
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
