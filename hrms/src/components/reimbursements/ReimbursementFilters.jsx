import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';
import { PAYMENT_STATUSES } from '../../data/reimbursementData';

export default function ReimbursementFilters({
  claimsCount,
  metrics,
  searchQuery,
  setSearchQuery,
  subStatusFilter,
  setSubStatusFilter,
  selectedDepartment,
  setSelectedDepartment,
  selectedLocation,
  setSelectedLocation,
  selectedExpenseType,
  setSelectedExpenseType,
  selectedPaymentStatus,
  setSelectedPaymentStatus,
  selectedMonth,
  setSelectedMonth,
  departments,
  locations,
  expenseTypes,
  onReset
}) {
  const filterPills = [
    { label: 'All', count: claimsCount },
    { label: 'Pending Approval', count: metrics.pendingApproval },
    { label: 'Approved', count: metrics.approved },
    { label: 'Ready for Payment', count: metrics.pendingPayment },
    { label: 'Paid', count: metrics.totalClaims - metrics.pendingApproval - metrics.pendingPayment - metrics.rejected - metrics.sentBack },
    { label: 'Rejected / Sent Back', count: metrics.rejected + metrics.sentBack }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Sub-status Quick Filter Pills */}
      <div className={styles.statusPillsRow}>
        {filterPills.map(pill => (
          <button
            key={pill.label}
            type="button"
            className={`${styles.statusPill} ${subStatusFilter === pill.label ? styles.statusPillActive : ''}`}
            onClick={() => setSubStatusFilter(pill.label)}
          >
            <span>{pill.label}</span>
            <span>({pill.count})</span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarTop}>
          <div className={styles.searchBox}>
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search Claim ID, Emp Code, Name, Expense Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onReset}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Department</label>
            <select
              className={styles.filterSelect}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location / Site</label>
            <select
              className={styles.filterSelect}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Expense Type</label>
            <select
              className={styles.filterSelect}
              value={selectedExpenseType}
              onChange={(e) => setSelectedExpenseType(e.target.value)}
            >
              <option value="All">All Expense Types</option>
              {expenseTypes.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Payment Status</label>
            <select
              className={styles.filterSelect}
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            >
              <option value="All">All Payment Statuses</option>
              {PAYMENT_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Expense Month</label>
            <input
              type="month"
              className={styles.filterInput}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
