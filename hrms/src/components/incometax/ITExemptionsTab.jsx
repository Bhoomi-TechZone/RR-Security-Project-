import React, { useState } from 'react';
import {
  Calculator,
  Search,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Info
} from 'lucide-react';
import styles from './ITExemptionsTab.module.css';
import { calculateHRAExemption } from '../../data/incomeTaxData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function ITExemptionsTab({
  exemptions = [],
  onNotify
}) {
  const [search, setSearch] = useState('');

  // Interactive HRA Simulator State
  const [simBasic, setSimBasic] = useState(30000); // monthly
  const [simDA, setSimDA] = useState(2000);
  const [simHRA, setSimHRA] = useState(12000);
  const [simRent, setSimRent] = useState(14000);
  const [simIsMetro, setSimIsMetro] = useState(true);

  // Compute live simulator results
  const simResult = calculateHRAExemption({
    basicAnnual: simBasic * 12,
    daAnnual: simDA * 12,
    hraReceivedAnnual: simHRA * 12,
    rentPaidAnnual: simRent * 12,
    isMetro: simIsMetro
  });

  const filtered = exemptions.filter((e) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchName = (e.employeeName || '').toLowerCase().includes(q);
      const matchCode = (e.employeeCode || '').toLowerCase().includes(q);
      const matchPan = (e.pan || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPan) return false;
    }
    return true;
  });

  // KPI Metrics
  const totalEmployees = exemptions.length;
  const totalHraExempt = exemptions.reduce((sum, r) => sum + (Number(r.finalHraExemption) || 0), 0);
  const totalLtaExempt = exemptions.reduce((sum, r) => sum + (Number(r.ltaExemption) || 0), 0);
  const totalSec10 = exemptions.reduce((sum, r) => sum + (Number(r.totalExemptionSec10) || 0), 0);

  return (
    <div className={styles.container}>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Employees with Sec 10 Exemptions</div>
          <div className={styles.kpiValue}>{totalEmployees}</div>
          <div className={styles.kpiSubtext}>Claiming HRA / LTA / CEA</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelSuccess}>Total Annual HRA Exemption</div>
          <div className={styles.kpiValueSuccess}>{formatINR(totalHraExempt)}</div>
          <div className={styles.kpiSubtextSuccess}>Sec 10(13A) non-taxable value</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPrimary}>Total LTA &amp; Other Allowances</div>
          <div className={styles.kpiValuePrimary}>{formatINR(totalLtaExempt)}</div>
          <div className={styles.kpiSubtextPrimary}>Sec 10(5) travel &amp; education</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPurple}>Cumulative Sec 10 Deduction</div>
          <div className={styles.kpiValuePurple}>{formatINR(totalSec10)}</div>
          <div className={styles.kpiSubtextPurple}>Subtracted before tax slabs</div>
        </div>
      </div>

      {/* Interactive HRA Exemption Simulator */}
      <div className={styles.simulatorCard}>
        <div className={styles.simHeader}>
          <div className={styles.simTitleRow}>
            <Calculator size={18} style={{ color: '#2563eb' }} />
            <h3 className={styles.simTitle}>
              Interactive Section 10(13A) HRA Exemption Simulator
            </h3>
          </div>
          <span className={styles.simSubtitle}>
            Calculates the least of Rule 1, Rule 2 &amp; Rule 3 as prescribed under Income Tax Rule 2A
          </span>
        </div>

        {/* Simulator Controls */}
        <div className={styles.simInputsGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Monthly Basic (₹)</label>
            <input
              type="number"
              className={styles.inputField}
              value={simBasic}
              onChange={(e) => setSimBasic(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Monthly DA (₹)</label>
            <input
              type="number"
              className={styles.inputField}
              value={simDA}
              onChange={(e) => setSimDA(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Monthly HRA Received (₹)</label>
            <input
              type="number"
              className={styles.inputField}
              value={simHRA}
              onChange={(e) => setSimHRA(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Monthly Rent Paid (₹)</label>
            <input
              type="number"
              className={styles.inputField}
              value={simRent}
              onChange={(e) => setSimRent(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>City Category</label>
            <select
              className={styles.selectField}
              value={simIsMetro ? 'metro' : 'non-metro'}
              onChange={(e) => setSimIsMetro(e.target.value === 'metro')}
            >
              <option value="metro">Metro City (50% Basic+DA)</option>
              <option value="non-metro">Non-Metro (40% Basic+DA)</option>
            </select>
          </div>
        </div>

        {/* 3 Conditions Breakdown Cards */}
        <div className={styles.simResultsGrid}>
          <div className={styles.resultCard}>
            <span className={styles.resultTitle}>1. Actual HRA Received</span>
            <strong className={styles.resultValue}>{formatINR(simResult.actualHRA)}/yr</strong>
            <div className={styles.resultSubtext}>{formatINR(simHRA)}/month</div>
          </div>

          <div className={styles.resultCard}>
            <span className={styles.resultTitle}>2. Rent Paid in Excess of 10% Salary</span>
            <strong className={styles.resultValue}>{formatINR(simResult.rentExcessOver10Percent)}/yr</strong>
            <div className={styles.resultSubtext}>Rent ({formatINR(simRent * 12)}) - 10% Sal</div>
          </div>

          <div className={styles.resultCard}>
            <span className={styles.resultTitle}>
              3. {simIsMetro ? '50% (Metro City)' : '40% (Non-Metro)'} of Salary
            </span>
            <strong className={styles.resultValue}>{formatINR(simResult.salaryPercentageThreshold)}/yr</strong>
            <div className={styles.resultSubtext}>{simIsMetro ? '50%' : '40%'} of (Basic + DA)</div>
          </div>

          <div className={styles.resultCardHighlight}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} /> Final Non-Taxable HRA
            </span>
            <strong className={styles.resultValueHighlight}>
              {formatINR(simResult.exemptAmount)}/yr
            </strong>
            <div style={{ fontSize: '11px', color: '#047857', marginTop: 2 }}>
              Taxable HRA: <strong>{formatINR(simResult.taxableHRA)}/yr</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search employee by name, code or PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNotify) onNotify('Exporting active Section 10 exemptions schedule...', 'info');
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Download size={14} /> Export Schedule
        </button>
      </div>

      {/* Exemptions Ledger Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>City Type</th>
                <th className={styles.thRight}>Actual HRA</th>
                <th className={styles.thRight}>Rent Paid</th>
                <th className={styles.thRight}>Exempt HRA (10(13A))</th>
                <th className={styles.thRight}>LTA (10(5))</th>
                <th className={styles.thRight}>Total Sec 10 Deductions</th>
                <th className={styles.th}>Landlord Info</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No employee exemption records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        {item.employeeCode} • {item.pan}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: '11px',
                        fontWeight: 600,
                        background: item.cityType === 'Metro' ? '#f0fdf4' : '#f8fafc',
                        color: item.cityType === 'Metro' ? '#15803d' : '#64748b',
                        border: '1px solid #e2e8f0'
                      }}>
                        {item.cityType} ({item.cityType === 'Metro' ? '50%' : '40%'})
                      </span>
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 600, color: '#0f172a' }}>
                      {formatINR(item.actualHraReceived)}
                    </td>

                    <td className={styles.tdRight}>
                      {formatINR(item.rentPaidAnnual)}
                    </td>

                    <td className={styles.tdRight}>
                      <span style={{ fontWeight: 700, color: '#15803d' }}>
                        {formatINR(item.finalHraExemption)}
                      </span>
                    </td>

                    <td className={styles.tdRight}>
                      {formatINR(item.ltaExemption)}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 800, color: '#1e3a8a' }}>
                      {formatINR(item.totalExemptionSec10)}
                    </td>

                    <td className={styles.td} style={{ fontSize: '11.5px', color: '#475569' }}>
                      {item.landlordPan ? (
                        <span>PAN: <strong style={{ fontFamily: 'monospace' }}>{item.landlordPan}</strong></span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No PAN required (&lt; ₹1L)</span>
                      )}
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
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
