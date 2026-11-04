import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { SETTLEMENT_STATUSES } from '../../data/fnfData';
import styles from './RateRevisionFilters.module.css';

export default function FnFFilters({
  search = '',
  onSearchChange,
  client = '',
  onClientChange,
  status = '',
  onStatusChange,
  companies = [],
  onReset
}) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by settlement ID, employee code, name or client..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.selectGroup}>
        {/* Client Filter */}
        <select
          value={client}
          onChange={(e) => onClientChange(e.target.value)}
          className={styles.select}
          aria-label="Filter by Client"
        >
          <option value="">All Clients &amp; Sites</option>
          {companies.map((c) => (
            <option key={c.id || c.name} value={c.name || c.companyName}>
              {c.name || c.companyName}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={styles.select}
          aria-label="Filter by Status"
        >
          {SETTLEMENT_STATUSES.map((st) => (
            <option key={st} value={st === 'All' ? '' : st}>
              {st === 'All' ? 'All Settlement Statuses' : st}
            </option>
          ))}
        </select>

        {/* Reset */}
        {(search || client || status) && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onReset}
            title="Reset active filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

