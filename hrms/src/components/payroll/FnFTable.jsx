import React from 'react';
import { Eye, Check, FileText, CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import styles from './RateRevisionTable.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function FnFTable({
  records = [],
  onView,
  onApprove,
  onMarkSettled,
  onGenerateLetter
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Settled':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 9px',
            borderRadius: 20,
            fontSize: '11px',
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0'
          }}>
            <CheckCircle2 size={12} /> Settled / Paid
          </span>
        );
      case 'Approved':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 9px',
            borderRadius: 20,
            fontSize: '11px',
            fontWeight: 700,
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe'
          }}>
            <Check size={12} /> Approved
          </span>
        );
      case 'Calculation Ready':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 9px',
            borderRadius: 20,
            fontSize: '11px',
            fontWeight: 700,
            background: '#f5f3ff',
            color: '#6d28d9',
            border: '1px solid #ddd6fe'
          }}>
            <Sparkles size={12} /> Calculation Ready
          </span>
        );
      case 'Pending Clearance':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 9px',
            borderRadius: 20,
            fontSize: '11px',
            fontWeight: 700,
            background: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a'
          }}>
            <Clock size={12} /> Pending Clearance
          </span>
        );
    }
  };

  const getClearanceBadge = (status) => {
    if (status === 'Cleared') {
      return (
        <span style={{ color: '#059669', fontWeight: 600, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          ✓ Cleared
        </span>
      );
    }
    return (
      <span style={{ color: '#d97706', fontWeight: 600, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <AlertTriangle size={11} /> {status || 'Pending'}
      </span>
    );
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>FnF Ref</th>
              <th style={{ minWidth: '170px' }}>Employee</th>
              <th style={{ minWidth: '160px' }}>Role &amp; Client</th>
              <th style={{ minWidth: '140px' }}>Last Working Day</th>
              <th style={{ minWidth: '110px', textAlign: 'right' }}>Gross Accrual</th>
              <th style={{ minWidth: '110px', textAlign: 'right' }}>Deductions</th>
              <th style={{ minWidth: '120px', textAlign: 'right' }}>Net Payable</th>
              <th style={{ minWidth: '120px' }}>Asset Clearance</th>
              <th style={{ minWidth: '130px' }}>Status</th>
              <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No Full &amp; Final settlement records match your filters.
                </td>
              </tr>
            ) : (
              records.map((fnf) => {
                return (
                  <tr key={fnf.id || fnf.settlementId}>
                    {/* FnF Ref */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          fontSize: '12.5px'
                        }}
                        onClick={() => onView && onView(fnf)}
                        title="View Full Settlement Statement"
                      >
                        {fnf.settlementId}
                      </button>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {fnf.settlementDate || 'Pending payout'}
                      </div>
                    </td>

                    {/* Employee */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fnf.employeeName}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                        {fnf.employeeCode}
                      </div>
                    </td>

                    {/* Role & Client */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>{fnf.designation}</div>
                      <div style={{ fontSize: '11.5px', color: '#2563eb', marginTop: 1 }}>{fnf.client}</div>
                    </td>

                    {/* Separation / LWD */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>
                        {fnf.lastWorkingDay || '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 1 }} title={fnf.separationReason}>
                        {fnf.separationReason?.split('(')[0]?.trim() || fnf.separationReason}
                      </div>
                    </td>

                    {/* Gross Accruals */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {formatINR(fnf.totalEarnings)}
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {fnf.unpaidWorkDays} earned days
                      </div>
                    </td>

                    {/* Deductions */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: fnf.totalDeductions > 0 ? '#dc2626' : '#64748b' }}>
                      {fnf.totalDeductions > 0 ? `-${formatINR(fnf.totalDeductions)}` : '₹0'}
                    </td>

                    {/* Net Payable Settlement Amount */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        fontWeight: 700,
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0'
                      }}>
                        {formatINR(fnf.netSettlementAmount)}
                      </span>
                    </td>

                    {/* Asset Clearance */}
                    <td>
                      {getClearanceBadge(fnf.assetClearanceStatus)}
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Dept: {fnf.managerClearanceStatus || 'Cleared'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>{getStatusBadge(fnf.settlementStatus)}</td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {/* View Statement */}
                        <button
                          type="button"
                          className={styles.viewBtn}
                          onClick={() => onView && onView(fnf)}
                          title="Open Full Settlement Voucher"
                          style={{
                            padding: '5px 9px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#0f172a'
                          }}
                        >
                          <Eye size={13} />
                          <span>Voucher</span>
                        </button>

                        {/* Approve Button */}
                        {fnf.settlementStatus === 'Calculation Ready' && onApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(fnf)}
                            title="Approve Settlement for Payout"
                            style={{
                              padding: '5px 8px',
                              background: '#2563eb',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Mark Paid Button */}
                        {fnf.settlementStatus === 'Approved' && onMarkSettled && (
                          <button
                            type="button"
                            onClick={() => onMarkSettled(fnf)}
                            title="Confirm Payout Disbursement"
                            style={{
                              padding: '5px 8px',
                              background: '#059669',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            <Sparkles size={12} />
                            <span>Disburse</span>
                          </button>
                        )}

                        {/* Letter Button */}
                        {onGenerateLetter && (
                          <button
                            type="button"
                            onClick={() => onGenerateLetter(fnf)}
                            title="Generate Full & Final Letter"
                            style={{
                              width: '28px',
                              height: '28px',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#ea580c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FileText size={13} />
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

