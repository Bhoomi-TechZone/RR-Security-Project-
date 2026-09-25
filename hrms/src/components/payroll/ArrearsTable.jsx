import React from 'react';
import { Eye, Calculator, Plus, CheckCheck, RefreshCw } from 'lucide-react';
import styles from './ArrearsTable.module.css';
import StatusBadge from '../common/StatusBadge';

export default function ArrearsTable({
  arrears,
  records,
  onView,
  onRecalculate,
  onIncludeInPayroll
}) {
  const data = records || arrears || [];

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Arrear ID</th>
              <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Employee</th>
              <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Arrear Month</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Old Rate</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Revised Rate</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Difference</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>App. Days</th>
              <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Arrear Amount</th>
              <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>PF / ESI</th>
              <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Payroll Status</th>
              <th style={{ textAlign: 'right', minWidth: '140px', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No arrears records generated.
                </td>
              </tr>
            ) : (
              data.map((arr) => {
                const arrId = arr.arrearId || arr.id;
                const revRate = arr.revisedRate ?? arr.newRate ?? (arr.oldRate + (arr.difference || arr.rateDifference || 0));
                const diff = arr.difference ?? arr.rateDifference ?? (revRate - (arr.oldRate || 0));
                const days = arr.applicableDays || 30;
                const amount = arr.arrearAmount ?? Math.round((diff / 30) * days);
                const pStatus = arr.payrollStatus || 'Pending Calculation';

                return (
                  <tr key={arr.id || arr.arrearId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className={styles.empId}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary, #4f46e5)', fontWeight: 700 }}
                        onClick={() => onView && onView(arr)}
                      >
                        {arrId}
                      </button>
                      {arr.revisionId && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {arr.revisionId}</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{arr.employeeName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{arr.employeeCode} • {arr.designation}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{arr.arrearMonth || 'August 2026'}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'Consolas, monospace', color: 'var(--text-secondary)' }}>
                        ₹{Number(arr.oldRate || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ fontFamily: 'Consolas, monospace', color: 'var(--text-primary)' }}>
                        ₹{Number(revRate || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'Consolas, monospace', color: '#16a34a', fontWeight: 700 }}>
                        +₹{Number(diff || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{days} Days</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ fontFamily: 'Consolas, monospace', color: '#16a34a', fontSize: '14px' }}>
                        ₹{Number(amount || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ fontSize: '10.5px', padding: '2px 5px', borderRadius: '3px', background: arr.pfApplicable !== false ? '#dcfce7' : '#f1f5f9', color: arr.pfApplicable !== false ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          PF: {arr.pfApplicable !== false ? 'Yes' : 'No'}
                        </span>
                        <span style={{ fontSize: '10.5px', padding: '2px 5px', borderRadius: '3px', background: arr.esiApplicable ? '#dcfce7' : '#f1f5f9', color: arr.esiApplicable ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          ESI: {arr.esiApplicable ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={pStatus === 'Included in Payroll' ? 'Active' : (pStatus === 'Calculated' ? 'Pending' : 'Draft')} />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                        {pStatus}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                        {/* View Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="View Arrear Breakdown"
                          onClick={() => onView && onView(arr)}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Recalculate */}
                        {pStatus !== 'Included in Payroll' && onRecalculate && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Recalculate Days & Arrear"
                            onClick={() => onRecalculate(arr)}
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}

                        {/* Include in Payroll */}
                        {pStatus === 'Calculated' && onIncludeInPayroll && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ color: '#16a34a', background: '#f0fdf4', borderColor: '#bbf7d0' }}
                            title="Include in Payroll Batch"
                            onClick={() => onIncludeInPayroll(arr)}
                          >
                            <Plus size={14} />
                          </button>
                        )}

                        {pStatus === 'Included in Payroll' && (
                          <span style={{ fontSize: '11px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                            <CheckCheck size={13} /> Synced
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
