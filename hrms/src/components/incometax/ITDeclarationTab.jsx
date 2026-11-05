import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Eye,
  Check,
  FileText,
  Printer,
  Download,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building2,
  Layers,
  UserCheck
} from 'lucide-react';
import styles from './ITDeclarationTab.module.css';
import {
  DECLARATION_STATUSES,
  TAX_REGIMES,
  FINANCIAL_YEARS
} from '../../data/incomeTaxData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function ITDeclarationTab({
  declarations = [],
  onUpdateDeclaration,
  onNotify
}) {
  const [search, setSearch] = useState('');
  const [selectedFy, setSelectedFy] = useState(FINANCIAL_YEARS[0]);
  const [regimeFilter, setRegimeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filtered declarations
  const filtered = declarations.filter((d) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchName = (d.employeeName || '').toLowerCase().includes(q);
      const matchCode = (d.employeeCode || '').toLowerCase().includes(q);
      const matchPan = (d.panNumber || '').toLowerCase().includes(q);
      const matchId = (d.declarationId || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPan && !matchId) return false;
    }
    if (selectedFy && d.financialYear !== selectedFy) return false;
    if (regimeFilter !== 'All' && !d.regime?.includes(regimeFilter)) return false;
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    return true;
  });

  // KPI Metrics
  const totalCount = declarations.length;
  const pendingCount = declarations.filter((d) => d.status === 'Pending Verification' || d.status === 'Action Required').length;
  const approvedCount = declarations.filter((d) => d.status === 'Approved').length;
  const newRegimeCount = declarations.filter((d) => d.regime?.includes('New Regime')).length;
  const oldRegimeCount = declarations.filter((d) => d.regime?.includes('Old Regime')).length;

  const handleApprove = (decl) => {
    const updated = {
      ...decl,
      status: 'Approved',
      verifiedBy: 'HR Admin',
      verificationDate: new Date().toISOString().slice(0, 10),
      proofsStatus: 'Verified & Approved'
    };
    onUpdateDeclaration(updated);
    if (selectedDeclaration && selectedDeclaration.id === decl.id) {
      setSelectedDeclaration(updated);
    }
    if (onNotify) onNotify(`✓ IT Declaration approved for ${decl.employeeName} (${decl.employeeCode}).`, 'success');
  };

  const handleReject = (decl) => {
    const reason = prompt('Please specify the reason for action required / rejection:', 'Rent receipts mismatch with declared rent amount');
    if (!reason) return;

    const updated = {
      ...decl,
      status: 'Action Required',
      remarks: reason,
      verifiedBy: 'HR Admin',
      verificationDate: new Date().toISOString().slice(0, 10),
      proofsStatus: 'Correction Required'
    };
    onUpdateDeclaration(updated);
    if (selectedDeclaration && selectedDeclaration.id === decl.id) {
      setSelectedDeclaration(updated);
    }
    if (onNotify) onNotify(`Notice sent to ${decl.employeeName} for declaration update.`, 'info');
  };

  return (
    <div className={styles.container}>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total IT Declarations</div>
          <div className={styles.kpiValue}>{totalCount}</div>
          <div className={styles.kpiSubtext}>Workforce submissions for {selectedFy}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelWarning}>Pending Verification</div>
          <div className={styles.kpiValueWarning}>{pendingCount}</div>
          <div className={styles.kpiSubtextWarning}>Awaiting proof verification</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelSuccess}>Approved Declarations</div>
          <div className={styles.kpiValueSuccess}>{approvedCount}</div>
          <div className={styles.kpiSubtextSuccess}>Tax liability locked &amp; compliant</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPrimary}>Tax Regime Distribution</div>
          <div className={styles.kpiValuePrimary}>
            {newRegimeCount} <span className={styles.kpiValueSub}>New</span> / {oldRegimeCount} <span className={styles.kpiValueSub}>Old</span>
          </div>
          <div className={styles.kpiSubtext}>Sec 115BAC adoption rate</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by employee, PAN or declaration ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          {/* Financial Year */}
          <select
            className={styles.selectField}
            style={{ fontWeight: 600 }}
            value={selectedFy}
            onChange={(e) => setSelectedFy(e.target.value)}
          >
            {FINANCIAL_YEARS.map((fy) => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>

          {/* Regime */}
          <select
            className={styles.selectField}
            value={regimeFilter}
            onChange={(e) => setRegimeFilter(e.target.value)}
          >
            <option value="All">All Regimes</option>
            <option value="New Regime">New Regime (115BAC)</option>
            <option value="Old Regime">Old Regime</option>
          </select>

          {/* Status */}
          <select
            className={styles.selectField}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {DECLARATION_STATUSES.map((st) => (
              <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
            ))}
          </select>

          {(search || regimeFilter !== 'All' || statusFilter !== 'All') && (
            <button
              type="button"
              className={styles.btnReset}
              onClick={() => { setSearch(''); setRegimeFilter('All'); setStatusFilter('All'); }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Declarations Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th}>Declaration Ref</th>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>Tax Regime</th>
                <th className={styles.thRight}>Annual Gross</th>
                <th className={styles.thRight}>80C Declared</th>
                <th className={styles.thRight}>80D Health</th>
                <th className={styles.thRight}>HRA / Sec 24</th>
                <th className={styles.thRight}>Taxable Income</th>
                <th className={styles.th}>Proof Status</th>
                <th className={styles.th}>Status</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No IT declarations match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isNewRegime = d.regime?.includes('New Regime');
                  const isApproved = d.status === 'Approved';
                  const isAction = d.status === 'Action Required';

                  return (
                    <tr key={d.id} className={styles.tr}>
                      <td className={styles.td}>
                        <button
                          type="button"
                          className={styles.refIdBtn}
                          onClick={() => { setSelectedDeclaration(d); setIsDrawerOpen(true); }}
                        >
                          {d.declarationId}
                        </button>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{d.financialYear}</div>
                      </td>

                      <td className={styles.td}>
                        <div className={styles.empName}>{d.employeeName}</div>
                        <div className={styles.empCode}>
                          {d.employeeCode} • PAN: {d.panNumber}
                        </div>
                      </td>

                      <td className={styles.td}>
                        <span className={isNewRegime ? styles.badgeRegimeNew : styles.badgeRegimeOld}>
                          {isNewRegime ? 'New Regime (115BAC)' : 'Old Regime'}
                        </span>
                      </td>

                      <td className={styles.tdRight} style={{ fontWeight: 600, color: '#0f172a' }}>
                        {formatINR(d.annualGrossSalary)}
                      </td>

                      <td className={styles.tdRight}>
                        {isNewRegime ? (
                          <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>N/A (New Regime)</span>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatINR(d.sec80C?.totalAllowed)}</div>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>Declared: {formatINR(d.sec80C?.totalDeclared)}</div>
                          </>
                        )}
                      </td>

                      <td className={styles.tdRight}>
                        {isNewRegime ? (
                          <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>—</span>
                        ) : (
                          <span style={{ fontWeight: 600, color: d.sec80D?.totalAllowed > 0 ? '#166534' : '#64748b' }}>
                            {formatINR(d.sec80D?.totalAllowed)}
                          </span>
                        )}
                      </td>

                      <td className={styles.tdRight}>
                        {isNewRegime ? (
                          <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>—</span>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatINR((d.hraDeclaration?.exemptAmount || 0) + (d.sec24HomeLoanInterest || 0))}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {d.hraDeclaration?.isOpted ? 'HRA Exemption' : d.sec24HomeLoanInterest > 0 ? 'Home Loan Int.' : 'No exemption'}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className={styles.tdRight}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(d.netTaxableIncome)}</div>
                        <div style={{ fontSize: '10.5px', color: d.annualTaxPayable > 0 ? '#dc2626' : '#16a34a' }}>
                          Tax: {formatINR(d.annualTaxPayable)}/yr
                        </div>
                      </td>

                      <td className={styles.td} style={{ fontSize: '11.5px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 600,
                          color: d.proofsCount > 0 ? '#0369a1' : '#64748b'
                        }}>
                          <FileText size={12} /> {d.proofsStatus}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span className={isApproved ? styles.badgeStatusApproved : isAction ? styles.badgeStatusAction : styles.badgeStatusPending}>
                          {isApproved ? <CheckCircle2 size={12} /> : isAction ? <AlertTriangle size={12} /> : <Clock size={12} />}
                          {d.status}
                        </span>
                      </td>

                      <td className={styles.tdRight}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className={styles.btnReview}
                            onClick={() => { setSelectedDeclaration(d); setIsDrawerOpen(true); }}
                            title="Review full declaration details & verification"
                          >
                            <Eye size={12} /> Review
                          </button>

                          {!isApproved && (
                            <button
                              type="button"
                              className={styles.btnApproveSm}
                              onClick={() => handleApprove(d)}
                              title="Approve declaration"
                            >
                              <Check size={12} /> Approve
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

      {/* Review Drawer */}
      {isDrawerOpen && selectedDeclaration && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.drawerHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedDeclaration.declarationId}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8' }}>
                    {selectedDeclaration.financialYear}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                  {selectedDeclaration.employeeName} ({selectedDeclaration.employeeCode}) • PAN: <strong>{selectedDeclaration.panNumber}</strong>
                </div>
              </div>
              <button type="button" className={styles.drawerCloseBtn} onClick={() => setIsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.drawerBody}>
              {/* Regime & Summary Strip */}
              <div className={styles.drawerStrip}>
                <div className={styles.grid3}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Tax Regime</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDeclaration.regime}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Projected Annual Gross</span>
                    <strong style={{ color: '#0f172a' }}>{formatINR(selectedDeclaration.annualGrossSalary)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Standard Deduction</span>
                    <strong style={{ color: '#16a34a' }}>-{formatINR(selectedDeclaration.standardDeduction)}</strong>
                  </div>
                </div>
              </div>

              {/* 80C Deductions Details */}
              <div className={styles.cardSection}>
                <div className={styles.cardSectionHeader}>
                  <span>Section 80C Deductions (Max Limit: ₹1,50,000)</span>
                  <span style={{ color: '#16a34a' }}>Allowed: {formatINR(selectedDeclaration.sec80C?.totalAllowed)}</span>
                </div>
                <div className={styles.cardSectionBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>EPF Statutory Contribution</span>
                    <strong>{formatINR(selectedDeclaration.sec80C?.epf)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Public Provident Fund (PPF)</span>
                    <strong>{formatINR(selectedDeclaration.sec80C?.ppf)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Life Insurance Premium (LIC)</span>
                    <strong>{formatINR(selectedDeclaration.sec80C?.lic)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>ELSS Tax Saver Mutual Funds</span>
                    <strong>{formatINR(selectedDeclaration.sec80C?.elss)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Children School Tuition Fees</span>
                    <strong>{formatINR(selectedDeclaration.sec80C?.tuitionFees)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 6, fontWeight: 700 }}>
                    <span>Total Declared 80C</span>
                    <span>{formatINR(selectedDeclaration.sec80C?.totalDeclared)}</span>
                  </div>
                </div>
              </div>

              {/* HRA Details */}
              {selectedDeclaration.hraDeclaration?.isOpted && (
                <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#166534', marginBottom: 8 }}>
                    House Rent Allowance (HRA) Exemption u/s 10(13A)
                  </div>
                  <div className={styles.grid2}>
                    <div>
                      <span style={{ color: '#166534', fontSize: '11px', display: 'block' }}>Annual Rent Paid</span>
                      <strong>{formatINR(selectedDeclaration.hraDeclaration.annualRentPaid)} ({formatINR(selectedDeclaration.hraDeclaration.monthlyRent)}/mo)</strong>
                    </div>
                    <div>
                      <span style={{ color: '#166534', fontSize: '11px', display: 'block' }}>City Category</span>
                      <strong>{selectedDeclaration.hraDeclaration.cityType} (50% Metro)</strong>
                    </div>
                    <div>
                      <span style={{ color: '#166534', fontSize: '11px', display: 'block' }}>Landlord Name &amp; PAN</span>
                      <strong>{selectedDeclaration.hraDeclaration.landlordName || '—'} ({selectedDeclaration.hraDeclaration.landlordPan || 'No PAN'})</strong>
                    </div>
                    <div>
                      <span style={{ color: '#166534', fontSize: '11px', display: 'block' }}>Calculated Tax Exemption</span>
                      <strong style={{ color: '#15803d', fontSize: '14px' }}>{formatINR(selectedDeclaration.hraDeclaration.exemptAmount)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 80D & Other Deductions */}
              <div style={{ border: '1px solid #ddd6fe', background: '#f5f3ff', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#6d28d9', marginBottom: 8 }}>
                  Section 80D (Health Insurance) &amp; Section 80CCD (NPS)
                </div>
                <div className={styles.grid3}>
                  <div>
                    <span style={{ color: '#6d28d9', fontSize: '11px', display: 'block' }}>Self &amp; Family Medical</span>
                    <strong>{formatINR(selectedDeclaration.sec80D?.selfAndFamily)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6d28d9', fontSize: '11px', display: 'block' }}>Senior Citizen Parents</span>
                    <strong>{formatINR(selectedDeclaration.sec80D?.parentsSenior)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6d28d9', fontSize: '11px', display: 'block' }}>80CCD(1B) NPS</span>
                    <strong>{formatINR(selectedDeclaration.sec80CCD)}</strong>
                  </div>
                </div>
              </div>

              {/* Net Tax Liability Box */}
              <div className={styles.netTaxLiabilityBox}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#047857' }}>
                    Net Taxable Projected Income
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#065f46', marginTop: 2 }}>
                    {formatINR(selectedDeclaration.netTaxableIncome)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: 2 }}>
                    Projected TDS per Month: <strong>{formatINR(selectedDeclaration.monthlyTdsDeduction)}</strong>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: '#ffffff', color: '#059669', border: '1px solid #a7f3d0' }}>
                    Rebate 87A: {selectedDeclaration.netTaxableIncome <= 700000 ? 'Eligible (NIL Tax)' : 'Not Eligible'}
                  </span>
                </div>
              </div>

              {/* Verification Remarks */}
              {selectedDeclaration.remarks && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>HR Auditor Remarks:</span>
                  <p style={{ margin: '3px 0 0', color: '#0f172a' }}>{selectedDeclaration.remarks}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className={styles.drawerFooter}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={14} /> Print Summary
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {selectedDeclaration.status !== 'Approved' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedDeclaration)}
                      style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Request Re-upload
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedDeclaration)}
                      style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={14} /> Approve Declaration
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
