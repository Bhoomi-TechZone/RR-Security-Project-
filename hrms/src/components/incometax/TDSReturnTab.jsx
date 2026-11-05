import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import styles from './TDSReturnTab.module.css';
import { QUARTERS } from '../../data/incomeTaxData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function TDSReturnTab({
  returns = [],
  onNotify
}) {
  const [selectedQuarter, setSelectedQuarter] = useState('Q2 (Jul - Sep)');
  const [activeAnnexure, setActiveAnnexure] = useState('annexure1'); // 'annexure1' | 'annexure2'

  const currentReturn = returns.find((r) => r.quarter === selectedQuarter) || returns[0] || {};

  // Mock Annexure I rows (Deductee-wise mapped to Challans)
  const mockAnnexureI = [
    { id: 'an1-1', pan: 'ABCDE1234F', name: 'Rajesh Kumar Verma', section: '192', payDate: '2026-09-30', amountPaid: 37500, tdsDeducted: 1200, challanCin: '05103040610202603820', rate: 'Normal' },
    { id: 'an1-2', pan: 'BKDPS8921L', name: 'Sanjay Pratap Singh', section: '192', payDate: '2026-09-30', amountPaid: 70000, tdsDeducted: 4800, challanCin: '05103040610202603820', rate: 'Normal' },
    { id: 'an1-3', pan: 'DKXPS4821N', name: 'Priya Nandini Sharma', section: '192', payDate: '2026-09-30', amountPaid: 80000, tdsDeducted: 6200, challanCin: '05103040610202603820', rate: 'Normal' },
    { id: 'an1-4', pan: 'CZKPR9402Q', name: 'Vikramaditya Rathore', section: '192', payDate: '2026-09-30', amountPaid: 30000, tdsDeducted: 0, challanCin: '05103040610202603820', rate: 'Zero Tax (87A)' },
    { id: 'an1-5', pan: 'EQRPF1920L', name: 'Mohammad Farooq', section: '192', payDate: '2026-09-30', amountPaid: 51667, tdsDeducted: 1500, challanCin: '05103040610202603820', rate: 'Normal' }
  ];

  // Mock Annexure II rows (Q4 Salary Summary)
  const mockAnnexureII = [
    { id: 'an2-1', pan: 'ABCDE1234F', name: 'Rajesh Kumar Verma', gross: 450000, sec16: 50000, sec10: 96000, chapterVI: 194800, taxable: 109200, tax: 0, tdsDeducted: 0 },
    { id: 'an2-2', pan: 'BKDPS8921L', name: 'Sanjay Pratap Singh', gross: 840000, sec16: 50000, sec10: 0, chapterVI: 272500, taxable: 517500, tax: 16120, tdsDeducted: 16120 },
    { id: 'an2-3', pan: 'DKXPS4821N', name: 'Priya Nandini Sharma', gross: 960000, sec16: 50000, sec10: 169000, chapterVI: 247000, taxable: 494000, tax: 0, tdsDeducted: 0 },
    { id: 'an2-4', pan: 'CZKPR9402Q', name: 'Vikramaditya Rathore', gross: 360000, sec16: 75000, sec10: 0, chapterVI: 0, taxable: 285000, tax: 0, tdsDeducted: 0 }
  ];

  const handleExportTextFVU = () => {
    const fvuContent = `FH^NSDL^1.0^${currentReturn.financialYear}^24Q^DELR19284F^RR SECURITY & FACILITIES PVT LTD^${currentReturn.tokenNumber || 'PROV2026Q2'}\nBH^1^1^${currentReturn.challansCount}^${currentReturn.deducteesCount}^${currentReturn.totalTdsRemitted}\nCD^1^0510304^06102026^03820^0021^200^${currentReturn.totalTdsRemitted}`;
    const blob = new Blob([fvuContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FORM24Q_${selectedQuarter.slice(0, 2)}_${currentReturn.financialYear.replace(/\s+/g, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onNotify) onNotify(`✓ e-TDS Text File for ${selectedQuarter} exported successfully.`, 'success');
  };

  return (
    <div className={styles.container}>
      {/* Quarter Selector Cards */}
      <div className={styles.quarterGrid}>
        {returns.map((ret) => {
          const isSelected = ret.quarter === selectedQuarter;
          const isFiled = ret.status === 'Filed';

          return (
            <div
              key={ret.id}
              className={isSelected ? styles.quarterCardActive : styles.quarterCard}
              onClick={() => setSelectedQuarter(ret.quarter)}
            >
              <div className={styles.quarterHeader}>
                <span className={styles.quarterTitle}>{ret.quarter}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: isFiled ? '#ecfdf5' : '#fffbeb',
                  color: isFiled ? '#059669' : '#b45309',
                  border: `1px solid ${isFiled ? '#a7f3d0' : '#fde68a'}`
                }}>
                  {ret.status}
                </span>
              </div>
              <div className={styles.quarterPeriod}>{ret.period}</div>
              <div className={styles.quarterAmount}>
                {formatINR(ret.totalTdsRemitted)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4 }}>
                {ret.deducteesCount} Staff • {ret.challansCount} Challans
              </div>
            </div>
          );
        })}
      </div>

      {/* Return Status Overview Banner */}
      <div className={styles.statusBanner}>
        <div className={styles.statusHeader}>
          <div className={styles.statusHeaderLeft}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Form 24Q Dashboard — {selectedQuarter} ({currentReturn.financialYear})
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: currentReturn.status === 'Filed' ? '#ecfdf5' : '#fffbeb',
                  color: currentReturn.status === 'Filed' ? '#059669' : '#b45309',
                  border: '1px solid #cbd5e1'
                }}>
                  {currentReturn.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                TAN: <strong>DELR19284F</strong> • Deductor: <strong>RR Security &amp; Facilities Pvt Ltd</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.btnExportTds}
            onClick={handleExportTextFVU}
          >
            <Download size={14} /> Export e-TDS File (.txt / FVU)
          </button>
        </div>

        {/* Status Metrics Strip */}
        <div className={styles.statusMetricsGrid}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Filing Due Date</span>
            <strong className={styles.metricValue}>{currentReturn.dueDate}</strong>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Actual Filing / Filing Date</span>
            <strong className={styles.metricValue} style={{ color: currentReturn.filingDate ? '#16a34a' : '#d97706' }}>
              {currentReturn.filingDate || 'Under Preparation'}
            </strong>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Provisional Receipt No. (PRN Token)</span>
            <strong className={styles.metricValue} style={{ fontFamily: 'monospace' }}>
              {currentReturn.tokenNumber || 'Pending Filing'}
            </strong>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Quarterly Remitted Tax</span>
            <strong className={styles.metricValue} style={{ color: '#1d4ed8' }}>
              {formatINR(currentReturn.totalTdsRemitted)}
            </strong>
          </div>
        </div>
      </div>

      {/* Annexure Sub-Nav Switcher */}
      <div className={styles.annexureNav}>
        <button
          type="button"
          className={`${styles.annexureTabBtn} ${activeAnnexure === 'annexure1' ? styles.annexureTabBtnActive : ''}`}
          onClick={() => setActiveAnnexure('annexure1')}
        >
          Annexure I — Deductee-wise Challan Mapping ({mockAnnexureI.length} Records)
        </button>

        <button
          type="button"
          className={`${styles.annexureTabBtn} ${activeAnnexure === 'annexure2' ? styles.annexureTabBtnActive : ''}`}
          onClick={() => setActiveAnnexure('annexure2')}
        >
          Annexure II — Salary &amp; Chapter VI-A Summary (Q4 / Annual View)
        </button>
      </div>

      {/* Annexure I Content */}
      {activeAnnexure === 'annexure1' && (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.th}>Deductee PAN</th>
                  <th className={styles.th}>Employee Name</th>
                  <th className={styles.th}>Section</th>
                  <th className={styles.th}>Payment Date</th>
                  <th className={styles.thRight}>Amount Paid (₹)</th>
                  <th className={styles.thRight}>TDS Deducted (₹)</th>
                  <th className={styles.th}>Mapped Challan CIN</th>
                  <th className={styles.th}>Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {mockAnnexureI.map((row) => (
                  <tr key={row.id} className={styles.tr}>
                    <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {row.pan}
                    </td>

                    <td className={styles.td} style={{ fontWeight: 600, color: '#0f172a' }}>
                      {row.name}
                    </td>

                    <td className={styles.td}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', fontWeight: 600, fontSize: '11px' }}>
                        Sec {row.section} (Salaries)
                      </span>
                    </td>

                    <td className={styles.td}>
                      {row.payDate}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 600 }}>
                      {formatINR(row.amountPaid)}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 700, color: row.tdsDeducted > 0 ? '#15803d' : '#64748b' }}>
                      {formatINR(row.tdsDeducted)}
                    </td>

                    <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#475569' }}>
                      {row.challanCin}
                    </td>

                    <td className={styles.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: '11px',
                        fontWeight: 600,
                        background: row.rate.includes('Zero') ? '#f0fdf4' : '#eff6ff',
                        color: row.rate.includes('Zero') ? '#15803d' : '#1d4ed8'
                      }}>
                        {row.rate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Annexure II Content */}
      {activeAnnexure === 'annexure2' && (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.th}>PAN</th>
                  <th className={styles.th}>Employee</th>
                  <th className={styles.thRight}>Gross Salary (₹)</th>
                  <th className={styles.thRight}>Sec 16 Std Ded (₹)</th>
                  <th className={styles.thRight}>Sec 10 Exempt (₹)</th>
                  <th className={styles.thRight}>Chapter VI-A (₹)</th>
                  <th className={styles.thRight}>Net Taxable (₹)</th>
                  <th className={styles.thRight}>Tax Payable (₹)</th>
                  <th className={styles.thRight}>Total TDS (₹)</th>
                </tr>
              </thead>
              <tbody>
                {mockAnnexureII.map((row) => (
                  <tr key={row.id} className={styles.tr}>
                    <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {row.pan}
                    </td>

                    <td className={styles.td} style={{ fontWeight: 600, color: '#0f172a' }}>
                      {row.name}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 600 }}>
                      {formatINR(row.gross)}
                    </td>

                    <td className={styles.tdRight} style={{ color: '#16a34a' }}>
                      -{formatINR(row.sec16)}
                    </td>

                    <td className={styles.tdRight} style={{ color: '#16a34a' }}>
                      -{formatINR(row.sec10)}
                    </td>

                    <td className={styles.tdRight} style={{ color: '#16a34a' }}>
                      -{formatINR(row.chapterVI)}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 700, color: '#0f172a' }}>
                      {formatINR(row.taxable)}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 600, color: row.tax > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatINR(row.tax)}
                    </td>

                    <td className={styles.tdRight} style={{ fontWeight: 800, color: '#15803d' }}>
                      {formatINR(row.tdsDeducted)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
