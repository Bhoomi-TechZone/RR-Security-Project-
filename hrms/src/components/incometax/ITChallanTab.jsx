import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Landmark,
  X,
  CreditCard,
  Building,
  Check
} from 'lucide-react';
import styles from './ITChallanTab.module.css';
import { CHALLAN_STATUSES, FINANCIAL_YEARS } from '../../data/incomeTaxData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function ITChallanTab({
  challans = [],
  onAddChallan,
  onNotify
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingChallan, setViewingChallan] = useState(null);

  // New Challan Form State
  const [formData, setFormData] = useState({
    salaryMonth: 'November 2026',
    assessmentYear: 'AY 2027-2028',
    financialYear: 'FY 2026-2027',
    challanType: 'ITNS 281',
    majorHead: '0021 - Income Tax Other than Companies',
    minorHead: '200 - TDS / TCS Payable by Employer',
    bsrCode: '0510304',
    branchName: 'SBI Parliament Street, New Delhi',
    tenderDate: new Date().toISOString().slice(0, 10),
    challanSerialNo: '05819',
    taxAmount: 415000,
    surcharge: 0,
    educationCess: 16600,
    interestOrLateFee: 0,
    paymentMode: 'e-Pay Tax (Net Banking / SBI)',
    bankReferenceNumber: `CPN${Date.now().toString().slice(-10)}`,
    deducteeCount: 144,
    remarks: 'Monthly TDS remittance for corporate & site security staff.'
  });

  const totalDeposited = challans.reduce((sum, c) => sum + (Number(c.totalAmountPaid) || 0), 0);
  const paidCount = challans.filter((c) => c.status === 'Paid & Verified (NSDL)').length;
  const totalEmployeesCovered = challans[0]?.deducteeCount || 142;

  const filtered = challans.filter((c) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchMonth = (c.salaryMonth || '').toLowerCase().includes(q);
      const matchCin = (c.cinNumber || '').toLowerCase().includes(q);
      const matchBsr = (c.bsrCode || '').toLowerCase().includes(q);
      const matchId = (c.challanId || '').toLowerCase().includes(q);
      if (!matchMonth && !matchCin && !matchBsr && !matchId) return false;
    }
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });

  const handleSaveChallan = (e) => {
    e.preventDefault();
    const dateCompact = (formData.tenderDate || '').replace(/-/g, '');
    const cinNumber = `${formData.bsrCode}${dateCompact}${formData.challanSerialNo}`;
    const totalAmountPaid =
      Number(formData.taxAmount || 0) +
      Number(formData.surcharge || 0) +
      Number(formData.educationCess || 0) +
      Number(formData.interestOrLateFee || 0);

    const newRecord = {
      id: `chl-${Date.now()}`,
      challanId: `CHL-${Date.now().toString().slice(-6)}`,
      ...formData,
      cinNumber,
      totalAmountPaid,
      status: 'Paid & Verified (NSDL)'
    };

    onAddChallan(newRecord);
    setIsAddModalOpen(false);
    if (onNotify) onNotify(`✓ IT Challan 281 recorded (CIN: ${cinNumber}) successfully.`, 'success');
  };

  return (
    <div className={styles.container}>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total TDS Remitted (FY 2026-27)</div>
          <div className={styles.kpiValue}>{formatINR(totalDeposited)}</div>
          <div className={styles.kpiSubtext}>Deposited via Challan ITNS 281</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelSuccess}>Verified Challans</div>
          <div className={styles.kpiValueSuccess}>{paidCount} Remittances</div>
          <div className={styles.kpiSubtextSuccess}>100% reconciled on OLTAS</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPrimary}>Workforce Deductees</div>
          <div className={styles.kpiValuePrimary}>{totalEmployeesCovered} Staff</div>
          <div className={styles.kpiSubtextPrimary}>PAN-wise mapped in Annexure I</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPurple}>Statutory Due Date</div>
          <div className={styles.kpiValuePurple}>7th of Month</div>
          <div className={styles.kpiSubtextPurple}>Interest / Late fee: ₹0 (Compliant)</div>
        </div>
      </div>

      {/* Header Actions & Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by CIN, BSR, Month or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.selectField}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {CHALLAN_STATUSES.map((st) => (
              <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={styles.btnAddChallan}
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={15} /> Record IT Challan (281)
        </button>
      </div>

      {/* Challans Ledger Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th}>Challan Ref</th>
                <th className={styles.th}>Salary Month</th>
                <th className={styles.th}>CIN (Challan Identification No)</th>
                <th className={styles.th}>Tender Date</th>
                <th className={styles.th}>Major / Minor Head</th>
                <th className={styles.thRight}>Tax Amount</th>
                <th className={styles.thRight}>Cess</th>
                <th className={styles.thRight}>Total Remitted</th>
                <th className={styles.th}>Deductees</th>
                <th className={styles.th}>Status</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No Challan records found. Click "+ Record IT Challan" to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className={styles.tr}>
                    <td className={styles.td}>
                      <button
                        type="button"
                        onClick={() => setViewingChallan(c)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#2563eb',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {c.challanId}
                      </button>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ITNS 281</div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.salaryMonth}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.assessmentYear}</div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                        {c.cinNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        BSR: {c.bsrCode} • Sr: {c.challanSerialNo}
                      </div>
                    </td>

                    <td className={styles.td}>
                      {c.tenderDate}
                    </td>

                    <td className={styles.td} style={{ fontSize: '11.5px', color: '#475569' }}>
                      <div>0021 (Other than Co.)</div>
                      <div style={{ color: '#64748b' }}>200 (TDS by Employer)</div>
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 600 }}>
                      {formatINR(c.taxAmount)}
                    </td>

                    <td className={styles.tdRight} style={{ color: '#64748b' }}>
                      {formatINR(c.educationCess)}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 800, color: '#15803d', fontSize: '13.5px' }}>
                      {formatINR(c.totalAmountPaid)}
                    </td>

                    <td className={styles.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#334155'
                      }}>
                        {c.deducteeCount} Staff
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0'
                      }}>
                        <CheckCircle2 size={12} /> {c.status}
                      </span>
                    </td>

                    <td className={styles.tdRight}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setViewingChallan(c)}
                          title="View Challan 281 Receipt Counterfoil"
                          style={{
                            padding: '5px 8px',
                            borderRadius: 5,
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          <FileText size={12} /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record New Challan Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Landmark size={18} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Record IT Challan 281 (e-Payment of TDS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChallan}>
              <div className={styles.modalBody}>
                {/* Row 1 */}
                <div className={styles.formGrid3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Salary Month</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.salaryMonth}
                      onChange={(e) => setFormData({ ...formData, salaryMonth: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Assessment Year</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.assessmentYear}
                      onChange={(e) => setFormData({ ...formData, assessmentYear: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tender Date (Paid Date)</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.tenderDate}
                      onChange={(e) => setFormData({ ...formData, tenderDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Major Head</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.majorHead}
                      onChange={(e) => setFormData({ ...formData, majorHead: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Minor Head</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.minorHead}
                      onChange={(e) => setFormData({ ...formData, minorHead: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 3 - BSR & Bank */}
                <div className={styles.formGrid3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>BSR Code (7 Digits)</label>
                    <input
                      type="text"
                      maxLength={7}
                      className={styles.input}
                      value={formData.bsrCode}
                      onChange={(e) => setFormData({ ...formData, bsrCode: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Challan Serial No (5 Digits)</label>
                    <input
                      type="text"
                      maxLength={5}
                      className={styles.input}
                      value={formData.challanSerialNo}
                      onChange={(e) => setFormData({ ...formData, challanSerialNo: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Deductee Count</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.deducteeCount}
                      onChange={(e) => setFormData({ ...formData, deducteeCount: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {/* Row 4 - Amounts */}
                <div className={styles.formGrid3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tax Amount (₹)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Education Cess (4%) (₹)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.educationCess}
                      onChange={(e) => setFormData({ ...formData, educationCess: Number(e.target.value) })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Interest / Fee (₹)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.interestOrLateFee}
                      onChange={(e) => setFormData({ ...formData, interestOrLateFee: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Total Calculated Callout */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <span style={{ fontSize: '12.5px', color: '#166534', fontWeight: 600 }}>
                    Computed Total ITNS 281 Payment:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#15803d' }}>
                    {formatINR(
                      Number(formData.taxAmount || 0) +
                      Number(formData.educationCess || 0) +
                      Number(formData.interestOrLateFee || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save &amp; Generate CIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Government Counterfoil Receipt Modal */}
      {viewingChallan && (
        <div className={styles.modalOverlay} onClick={() => setViewingChallan(null)}>
          <div className={styles.receiptModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Landmark size={18} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Government of India — Income Tax Department Challan 281
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingChallan(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody} style={{ background: '#f8fafc' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 10 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>
                    Income Tax Department (e-Tax Payment Counterfoil)
                  </div>
                  <h2 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    CHALLAN ITNS 281 — TAX DEDUCTED AT SOURCE
                  </h2>
                </div>

                <div className={styles.formGrid2}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>TAN of Employer:</span>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px' }}>DELR19284F</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Name of Deductor:</span>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>RR Security &amp; Facilities Pvt Ltd</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Assessment Year:</span>
                    <div style={{ fontWeight: 700 }}>{viewingChallan.assessmentYear}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Financial Year:</span>
                    <div style={{ fontWeight: 700 }}>{viewingChallan.financialYear}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Major Head:</span>
                    <div style={{ fontWeight: 600 }}>0021 (Income Tax other than Companies)</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Minor Head:</span>
                    <div style={{ fontWeight: 600 }}>200 (TDS/TCS Payable by Taxpayer)</div>
                  </div>
                </div>

                {/* CIN Stamp Box */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px dashed #059669',
                  borderRadius: 8,
                  padding: 14,
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#047857' }}>
                    Challan Identification Number (CIN)
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#065f46', marginTop: 2 }}>
                    {viewingChallan.cinNumber}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: 2 }}>
                    BSR: <strong>{viewingChallan.bsrCode}</strong> • Date: <strong>{viewingChallan.tenderDate}</strong> • Sr: <strong>{viewingChallan.challanSerialNo}</strong>
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, fontSize: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Income Tax (Basic TDS):</span>
                    <strong>{formatINR(viewingChallan.taxAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Health &amp; Education Cess (4%):</span>
                    <strong>{formatINR(viewingChallan.educationCess)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Late Filing / Interest (Sec 201(1A)):</span>
                    <strong>{formatINR(viewingChallan.interestOrLateFee || 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: 6, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                    <span>Total Tax Deposited:</span>
                    <span>{formatINR(viewingChallan.totalAmountPaid)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Printer size={14} /> Print Counterfoil
              </button>
              <button
                type="button"
                onClick={() => setViewingChallan(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
