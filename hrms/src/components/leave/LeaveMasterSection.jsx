import React, { useState } from 'react';
import { Plus, Edit2, Eye, ToggleLeft, ToggleRight, Layers, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import styles from './LeaveMasterSection.module.css';

export default function LeaveMasterSection({
  leaveTypes,
  onAddClick,
  onEditClick,
  onViewClick,
  onToggleStatus
}) {
  const [filterType, setFilterType] = useState('ALL');

  const totalTypes = leaveTypes.length;
  const paidTypes = leaveTypes.filter(t => t.category === 'Paid').length;
  const unpaidTypes = leaveTypes.filter(t => t.category === 'Unpaid').length;
  const activeTypes = leaveTypes.filter(t => t.status === 'Active').length;

  const filteredList = leaveTypes.filter(t => {
    if (filterType === 'PAID') return t.category === 'Paid';
    if (filterType === 'UNPAID') return t.category === 'Unpaid';
    if (filterType === 'ACTIVE') return t.status === 'Active';
    return true;
  });

  return (
    <div className={styles.sectionContainer}>
      {/* KPI Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.kpiCard} ${styles.blueKpi}`}>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Leave Types</span>
            <span className={styles.kpiValue}>{totalTypes}</span>
            <span className={styles.kpiHint}>Configured in system</span>
          </div>
          <div className={`${styles.kpiIconWrap} ${styles.blueIcon}`}>
            <Layers size={22} />
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.greenKpi}`}>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Paid Leave Types</span>
            <span className={styles.kpiValue}>{paidTypes}</span>
            <span className={styles.kpiHint}>No salary deduction</span>
          </div>
          <div className={`${styles.kpiIconWrap} ${styles.greenIcon}`}>
            <CheckCircle size={22} />
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.amberKpi}`}>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Unpaid Leave Types</span>
            <span className={styles.kpiValue}>{unpaidTypes}</span>
            <span className={styles.kpiHint}>Prorated salary deduction</span>
          </div>
          <div className={`${styles.kpiIconWrap} ${styles.amberIcon}`}>
            <ShieldAlert size={22} />
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.purpleKpi}`}>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Active Leave Types</span>
            <span className={styles.kpiValue}>{activeTypes}</span>
            <span className={styles.kpiHint}>Available for application</span>
          </div>
          <div className={`${styles.kpiIconWrap} ${styles.purpleIcon}`}>
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Configured Leave Master</h3>
            <p className={styles.cardSubtitle}>Manage enterprise leave quota, carry-forward rules, and encashment settings.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.filterPills}>
              <button
                type="button"
                className={`${styles.filterPill} ${filterType === 'ALL' ? styles.activePill : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                All ({totalTypes})
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${filterType === 'PAID' ? styles.activePill : ''}`}
                onClick={() => setFilterType('PAID')}
              >
                Paid ({paidTypes})
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${filterType === 'UNPAID' ? styles.activePill : ''}`}
                onClick={() => setFilterType('UNPAID')}
              >
                Unpaid ({unpaidTypes})
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${filterType === 'ACTIVE' ? styles.activePill : ''}`}
                onClick={() => setFilterType('ACTIVE')}
              >
                Active ({activeTypes})
              </button>
            </div>

            <button type="button" className={styles.primaryAddBtn} onClick={onAddClick}>
              <Plus size={16} />
              <span>Add Leave Type</span>
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Leave Code</th>
                <th>Leave Name</th>
                <th>Paid / Unpaid</th>
                <th>Annual Quota</th>
                <th>Carry Forward</th>
                <th>Max Accumulation</th>
                <th>Encashment</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={styles.codeBadge}>{item.code}</span>
                  </td>
                  <td>
                    <span className={styles.typeName}>{item.name}</span>
                  </td>
                  <td>
                    <span className={item.category === 'Paid' ? styles.paidBadge : styles.unpaidBadge}>
                      {item.category}
                    </span>
                  </td>
                  <td className={styles.numberCell}>
                    <strong>{item.annualQuota > 0 ? `${item.annualQuota} Days` : 'No Quota'}</strong>
                  </td>
                  <td>
                    <span className={item.carryForward === 'Yes' ? styles.yesBadge : styles.noBadge}>
                      {item.carryForward}
                    </span>
                  </td>
                  <td className={styles.numberCell}>
                    {item.maxAccumulation > 0 ? `${item.maxAccumulation} Days` : '0'}
                  </td>
                  <td>
                    <span className={item.encashment === 'Yes' ? styles.yesBadge : styles.noBadge}>
                      {item.encashment}
                    </span>
                  </td>
                  <td>
                    <span className={item.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        title="View Details"
                        onClick={() => onViewClick(item)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        title="Edit Leave Type"
                        onClick={() => onEditClick(item)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${item.status === 'Active' ? styles.btnActive : styles.btnInactive}`}
                        title={item.status === 'Active' ? 'Deactivate Leave Type' : 'Activate Leave Type'}
                        onClick={() => onToggleStatus(item)}
                      >
                        {item.status === 'Active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
