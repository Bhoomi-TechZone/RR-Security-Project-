import React from 'react';
import { Eye, Edit2, Check, X } from 'lucide-react';
import styles from './RateRevisionTable.module.css';
import StatusBadge from '../common/StatusBadge';

export default function RateRevisionTable({
  revisions,
  records,
  onView,
  onEdit,
  onApprove,
  onReject
}) {
  const data = records || revisions || [];

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Revision ID</th>
              <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Employee</th>
              <th style={{ minWidth: '160px' }}>Client / Site</th>
              <th style={{ minWidth: '140px' }}>Designation</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Old Rate</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>New Rate</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Difference</th>
              <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Effective From</th>
              <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>New Gross</th>
              <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ minWidth: '150px' }}>Approved By</th>
              <th style={{ textAlign: 'right', minWidth: '110px', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No rate revision records found.
                </td>
              </tr>
            ) : (
              data.map((rev) => {
                const revId = rev.revisionId || rev.id;
                const clientName = rev.client || rev.clientName || '—';
                const siteName = rev.site || rev.siteName || '—';
                const status = rev.status || rev.revisionStatus || 'Pending Approval';
                const rateDiff = rev.rateDifference ?? ((rev.newRate || 0) - (rev.oldRate || 0));
                const newGross = rev.newGross ?? rev.newRate;

                return (
                  <tr key={rev.id || rev.revisionId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className={styles.empId}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary, #4f46e5)', fontWeight: 700 }}
                        onClick={() => onView && onView(rev)}
                      >
                        {revId}
                      </button>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rev.createdAt || 'Recent'}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rev.employeeName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{rev.employeeCode}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>{clientName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{siteName}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{rev.designation}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'Consolas, monospace', color: 'var(--text-secondary)' }}>
                        ₹{Number(rev.oldRate || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ fontFamily: 'Consolas, monospace', color: 'var(--text-primary)' }}>
                        ₹{Number(rev.newRate || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'Consolas, monospace', color: rateDiff >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {rateDiff >= 0 ? '+' : ''}₹{Number(rateDiff).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{rev.effectiveFrom}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ fontFamily: 'Consolas, monospace', color: '#0f172a' }}>
                        ₹{Number(newGross || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {rev.approvedBy || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>}
                      </div>
                      {rev.approvalDate && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rev.approvalDate}</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                        {/* View Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="View Revision Details"
                          onClick={() => onView && onView(rev)}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit Button (Draft / Pending) */}
                        {(status === 'Draft' || status === 'Pending' || status === 'Pending Approval') && onEdit && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Edit Revision"
                            onClick={() => onEdit(rev)}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {/* Approve Button */}
                        {(status === 'Pending' || status === 'Pending Approval') && onApprove && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ color: '#16a34a' }}
                            title="Approve Rate Revision"
                            onClick={() => onApprove(rev)}
                          >
                            <Check size={14} />
                          </button>
                        )}

                        {/* Reject Button */}
                        {(status === 'Pending' || status === 'Pending Approval') && onReject && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ color: '#dc2626' }}
                            title="Reject Rate Revision"
                            onClick={() => onReject(rev)}
                          >
                            <X size={14} />
                          </button>
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
