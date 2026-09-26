import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { ATTENDANCE_STATUS_OPTIONS } from '../../data/attendanceData';
import styles from './AttendanceFilters.module.css';

function AttendanceFilters({ filters, onChange, onReset, records = [] }) {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  const dynamicClients = Array.from(new Set(records.map(r => r.companyName || r.clientName).filter(Boolean)));
  const dynamicSites = Array.from(new Set(records.map(r => r.site).filter(Boolean)));
  const dynamicDepts = Array.from(new Set(records.map(r => r.department).filter(Boolean)));

  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.search}
          placeholder="Search employee name or ID…"
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />
      </div>

      <select
        className={styles.select}
        value={filters.companyId}
        onChange={(e) => handleChange('companyId', e.target.value)}
      >
        <option value="">All Clients</option>
        {dynamicClients.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className={styles.select}
        value={filters.site}
        onChange={(e) => handleChange('site', e.target.value)}
      >
        <option value="">All Sites</option>
        {dynamicSites.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        className={styles.select}
        value={filters.department}
        onChange={(e) => handleChange('department', e.target.value)}
      >
        <option value="">All Departments</option>
        {dynamicDepts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        className={styles.select}
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        {ATTENDANCE_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button className={styles.resetBtn} onClick={onReset} title="Reset all filters">
        <RotateCcw size={14} />
        Reset
      </button>
    </div>
  );
}

export default AttendanceFilters;
