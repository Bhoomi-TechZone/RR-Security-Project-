import React, { useState } from 'react';
import {
  Eye,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  FileText,
  Building2,
  ShieldCheck,
  ArrowRight,
  Send,
  MoreVertical,
  Calendar,
  Layers
} from 'lucide-react';
import styles from './RateRevisionTable.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function FnFTable({
  records = [],
  onView,
  onApproveStage,
  onDisburse,
  onGenerateLetter
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Settled / Disbursed':
      case 'Settled':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 16,
            fontSize: '11px',
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0'
          }}>
            <CheckCircle2 size={12} /> Settled / Disbursed
          </span>
        );
      case 'Approved for Payout':
      case 'Approved':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 16,
            fontSize: '11px',
            fontWeight: 700,
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe'
          }}>
            <Check size={12} /> Approved for Payout
          </span>
        );
      case 'Pending Approval':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 16,
            fontSize: '11px',
            fontWeight: 700,
            background: '#f5f3ff',
            color: '#6d28d9',
            border: '1px solid #ddd6fe'
          }}>
            <Layers size={12} /> In Multi-Level Approval
          </span>
        );
      case 'Pending Clearance':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 16,
            fontSize: '11px',
            fontWeight: 700,
            background: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a'
          }}>
            <Clock size={12} /> Pending Clearances
          </span>
        );
    }
  };

  // Exit type pill
  const getExitTypeBadge = (exitType) => {
    const type = exitType || 'Resignation';
    const config = {
      Resignation: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
      Termination: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
      Absconding: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
      Retirement: { bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
      'Contract End': { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' }
    }[type] || { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };

    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 4,
        fontSize: '10.5px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`
      }}>
        {type}
      </span>
    );
  };

  // Calculate 6-department clearance
  const getClearanceSummary = (clearances = {}) => {
    const depts = ['hr', 'operations', 'accounts', 'admin', 'inventory', 'client'];
    let clearedCount = 0;
    const pendingNames = [];

    depts.forEach((key) => {
      const obj = clearances[key];
      if (obj && (obj.status === 'Cleared' || obj.status === 'Waived')) {
        clearedCount += 1;
      } else {
        const readable = {
          hr: 'HR',
          operations: 'Ops',
          accounts: 'Accounts',
          admin: 'Admin',
          inventory: 'Store',
          client: 'Client'
        }[key] || key;
        pendingNames.push(readable);
      }
    });

    const isAllCleared = clearedCount === depts.length;

    return {
      clearedCount,
      totalCount: depts.length,
      isAllCleared,
      pendingNames
    };
  };

  // 4-Stage Approval Pipeline Stepper
  const renderApprovalPipeline = (workflow = {}) => {
    const stages = [
      { key: 'hr_review', label: 'HR' },
      { key: 'ops_review', label: 'Ops' },
      { key: 'accounts_review', label: 'Acc' },
      { key: 'final_approval', label: 'Final' }
    ];

    const currentStage = workflow.currentStage || 'hr_review';
    const stageDetails = workflow.stages || {};

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {stages.map((st, idx) => {
          const detail = stageDetails[st.key] || {};
          const isDone = detail.status === 'Approved';
          const isCurrent = !isDone && currentStage === st.key;

          const bg = isDone ? '#059669' : isCurrent ? '#2563eb' : '#e2e8f0';
          const color = isDone || isCurrent ? '#ffffff' : '#64748b';

          return (
            <React.Fragment key={st.key}>
              <div
                title={`${st.label}: ${detail.status || (isCurrent ? 'Under Review' : 'Pending')} ${detail.approver ? `by ${detail.approver}` : ''}`}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: bg,
                  color: color,
                  fontSize: '9.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {isDone ? '✓' : st.label.slice(0, 1)}
              </div>
              {idx < stages.length - 1 && (
                <div style={{
                  width: 8,
                  height: 2,
                  background: isDone ? '#059669' : '#cbd5e1'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '130px' }}>FnF Ref &amp; Exit</th>
              <th style={{ minWidth: '170px' }}>Employee</th>
              <th style={{ minWidth: '160px' }}>Designation &amp; Client</th>
              <th style={{ minWidth: '135px' }}>Exit Timeline</th>
              <th style={{ minWidth: '130px' }}>6-Dept Clearance</th>
              <th style={{ minWidth: '120px', textAlign: 'right' }}>Accruals &amp; Dues</th>
              <th style={{ minWidth: '125px', textAlign: 'right' }}>Net Payable</th>
              <th style={{ minWidth: '130px' }}>Approval Stage</th>
              <th style={{ minWidth: '130px' }}>Settlement Status</th>
              <th style={{ minWidth: '130px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No separation settlement records found for selected filters.
                </td>
              </tr>
            ) : (
              records.map((fnf) => {
                const earnings = Number(fnf.finalSettlement?.totalEarnings ?? fnf.totalEarnings ?? 0);
                const deductions = Number(fnf.finalSettlement?.totalDeductions ?? fnf.totalDeductions ?? 0);
                const netPayable = Number(fnf.finalSettlement?.netPayable ?? fnf.netSettlementAmount ?? 0);
                const clrSummary = getClearanceSummary(fnf.clearances);

                return (
                  <tr key={fnf.id || fnf.settlementId}>
                    {/* 1. FnF Ref & Exit Type */}
                    <td>
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
                          fontSize: '12.5px',
                          display: 'block'
                        }}
                        onClick={() => onView && onView(fnf)}
                        title="Click to view complete 11-step Statement Voucher"
                      >
                        {fnf.settlementId}
                      </button>
                      <div style={{ marginTop: 4 }}>
                        {getExitTypeBadge(fnf.exitType)}
                      </div>
                    </td>

                    {/* 2. Employee Identity */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fnf.employeeName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        {fnf.employeeCode}
                      </div>
                    </td>

                    {/* 3. Role & Client */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>
                        {fnf.designation}
                      </div>
                      <div style={{ fontSize: '11px', color: '#2563eb', marginTop: 1 }}>
                        {fnf.client}
                      </div>
                    </td>

                    {/* 4. Exit Timeline */}
                    <td>
                      <div style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 600 }}>
                        LWD: {fnf.lastWorkingDay || '—'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: 1 }}>
                        Resigned: {fnf.resignationDate || '—'}
                      </div>
                      {fnf.noticeShortfallDays > 0 ? (
                        <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, marginTop: 1 }}>
                          ⚠️ {fnf.noticeShortfallDays}d Shortfall
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: 1 }}>
                          ✓ Notice Served
                        </div>
                      )}
                    </td>

                    {/* 5. 6-Department Clearance Progress */}
                    <td>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 7px',
                        borderRadius: 14,
                        fontSize: '11px',
                        fontWeight: 700,
                        background: clrSummary.isAllCleared ? '#f0fdf4' : '#fffbeb',
                        color: clrSummary.isAllCleared ? '#16a34a' : '#b45309',
                        border: `1px solid ${clrSummary.isAllCleared ? '#bbf7d0' : '#fde68a'}`
                      }}>
                        {clrSummary.isAllCleared ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>6/6 Cleared</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            <span>{clrSummary.clearedCount}/6 Cleared</span>
                          </>
                        )}
                      </div>
                      {!clrSummary.isAllCleared && clrSummary.pendingNames.length > 0 && (
                        <div style={{ fontSize: '10px', color: '#d97706', marginTop: 2 }}>
                          Pending: {clrSummary.pendingNames.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* 6. Accruals & Dues */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                        +{formatINR(earnings)}
                      </div>
                      <div style={{ fontSize: '10.5px', color: deductions > 0 ? '#dc2626' : '#64748b' }}>
                        {deductions > 0 ? `-${formatINR(deductions)}` : '₹0 Ded.'}
                      </div>
                    </td>

                    {/* 7. Net Settlement Amount */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 9px',
                        background: '#ecfdf5',
                        color: '#065f46',
                        fontWeight: 800,
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0',
                        boxShadow: '0 1px 2px rgba(5,150,105,0.08)'
                      }}>
                        {formatINR(netPayable)}
                      </span>
                    </td>

                    {/* 8. 4-Stage Approval Pipeline */}
                    <td>
                      <div>{renderApprovalPipeline(fnf.approvalWorkflow)}</div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: 3, fontWeight: 500 }}>
                        {fnf.approvalWorkflow?.isFullyApproved ? (
                          <span style={{ color: '#059669', fontWeight: 700 }}>Final Approved</span>
                        ) : (
                          <span>
                            Stage: <strong>{fnf.approvalWorkflow?.currentStage?.replace('_', ' ').toUpperCase()}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 9. Settlement Status */}
                    <td>{getStatusBadge(fnf.settlementStatus)}</td>

                    {/* 10. Actions */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {/* View Voucher Dossier */}
                        <button
                          type="button"
                          onClick={() => onView && onView(fnf)}
                          title="View 11-Step Statement Voucher"
                          style={{
                            padding: '5px 9px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#0f172a'
                          }}
                        >
                          <Eye size={13} />
                          <span>Voucher</span>
                        </button>

                        {/* Workflow Action Button: Approve Next Stage */}
                        {!fnf.approvalWorkflow?.isFullyApproved && fnf.settlementStatus !== 'Settled / Disbursed' && onApproveStage && (
                          <button
                            type="button"
                            onClick={() => onApproveStage(fnf)}
                            title="Approve current stage in 4-step workflow"
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
                            <span>Sign-off</span>
                          </button>
                        )}

                        {/* Workflow Action Button: Disburse Payment */}
                        {fnf.approvalWorkflow?.isFullyApproved && fnf.settlementStatus !== 'Settled / Disbursed' && onDisburse && (
                          <button
                            type="button"
                            onClick={() => onDisburse(fnf)}
                            title="Record payment transaction & disburse"
                            style={{
                              padding: '5px 9px',
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

                        {/* Generate Document Letter Link */}
                        {onGenerateLetter && (
                          <button
                            type="button"
                            onClick={() => onGenerateLetter(fnf)}
                            title="Generate Settlement / Relieving Letter"
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
