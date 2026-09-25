import React, { useState } from 'react';
import { Download, FileSpreadsheet, ShieldCheck, Users, FileText, ChevronRight, Eye } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './StatutoryReports.module.css';

export default function StatutoryReports({
  pfRecords = [],
  esiRecords = [],
  summary,
  selectedMonth = '2026-08',
  monthLabel = 'August 2026',
  companies = [],
  departments = [],
  onOpenDownloadModal
}) {
  const [activeReportTab, setActiveReportTab] = useState('pf'); // 'pf' | 'esi' | 'cards'
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Filter records
  const filteredPF = pfRecords.filter((item) => {
    if (clientFilter && item.clientName !== clientFilter) return false;
    if (deptFilter && item.department !== deptFilter) return false;
    return true;
  });

  const filteredESI = esiRecords.filter((item) => {
    if (clientFilter && item.clientName !== clientFilter) return false;
    if (deptFilter && item.department !== deptFilter) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* 4 Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>PF Contribution</span>
            <strong className={styles.cardVal}>{formatRupee(summary?.pfContribution || 842500)}</strong>
            <small className={styles.cardSub}>Employee: ₹4.21L + Employer: ₹4.21L</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.blueIcon}`}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>ESI Contribution</span>
            <strong className={styles.cardVal}>{formatRupee(summary?.esiContribution || 218400)}</strong>
            <small className={styles.cardSub}>Employee: ₹1.09L + Employer: ₹1.09L</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.greenIcon}`}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Employees Covered</span>
            <strong className={styles.cardVal}>{(summary?.employeesCovered || 1184).toLocaleString('en-IN')}</strong>
            <small className={styles.cardSub}>Statutory compliance active</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.purpleIcon}`}>
            <Users size={22} />
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Reports Generated</span>
            <strong className={styles.cardVal}>{summary?.reportsGenerated || 6}</strong>
            <small className={styles.cardSub}>PF, ESI, Form 5 &amp; Form 10</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.amberIcon}`}>
            <FileSpreadsheet size={22} />
          </div>
        </div>
      </div>

      {/* Compliance Overview Cards (PF & ESI) */}
      <div className={styles.reportCardsGrid}>
        {/* PF Card */}
        <div className={styles.reportCard}>
          <div className={styles.reportCardHeader}>
            <div>
              <span className={styles.statutoryTag}>Statutory Return</span>
              <h3 className={styles.reportCardTitle}>Provident Fund (PF)</h3>
              <span className={styles.reportMonth}>{monthLabel}</span>
            </div>
            <div className={styles.pfLogo}>EPFO</div>
          </div>

          <div className={styles.reportStatsGrid}>
            <div className={styles.reportStat}>
              <span>Employees</span>
              <strong>1,184</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employee Contribution</span>
              <strong>{formatRupee(421250)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employer Contribution</span>
              <strong>{formatRupee(421250)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Total PF Remittance</span>
              <strong className={styles.textGreen}>{formatRupee(842500)}</strong>
            </div>
          </div>

          <div className={styles.reportCardActions}>
            <button
              type="button"
              className={styles.viewReportBtn}
              onClick={() => setActiveReportTab('pf')}
            >
              <Eye size={15} />
              <span>View Report</span>
            </button>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={() => onOpenDownloadModal('pf')}
            >
              <Download size={15} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* ESI Card */}
        <div className={styles.reportCard}>
          <div className={styles.reportCardHeader}>
            <div>
              <span className={styles.statutoryTag}>Statutory Return</span>
              <h3 className={styles.reportCardTitle}>Employee State Insurance (ESI)</h3>
              <span className={styles.reportMonth}>{monthLabel}</span>
            </div>
            <div className={styles.esiLogo}>ESIC</div>
          </div>

          <div className={styles.reportStatsGrid}>
            <div className={styles.reportStat}>
              <span>Employees</span>
              <strong>1,184</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employee Contribution</span>
              <strong>{formatRupee(109200)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employer Contribution</span>
              <strong>{formatRupee(109200)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Total ESI Remittance</span>
              <strong className={styles.textGreen}>{formatRupee(218400)}</strong>
            </div>
          </div>

          <div className={styles.reportCardActions}>
            <button
              type="button"
              className={styles.viewReportBtn}
              onClick={() => setActiveReportTab('esi')}
            >
              <Eye size={15} />
              <span>View Report</span>
            </button>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={() => onOpenDownloadModal('esi')}
            >
              <Download size={15} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Switcher Sub-header */}
      <div className={styles.reportSectionHeader}>
        <div className={styles.subTabs}>
          <button
            type="button"
            className={activeReportTab === 'pf' ? styles.subTabActive : styles.subTab}
            onClick={() => setActiveReportTab('pf')}
          >
            Provident Fund (PF) Breakdown ({filteredPF.length})
          </button>
          <button
            type="button"
            className={activeReportTab === 'esi' ? styles.subTabActive : styles.subTab}
            onClick={() => setActiveReportTab('esi')}
          >
            ESI Contribution Breakdown ({filteredESI.length})
          </button>
        </div>

        <button
          type="button"
          className={styles.mainDownloadBtn}
          onClick={() => onOpenDownloadModal('combined')}
        >
          <Download size={16} />
          <span>Download Statutory Reports</span>
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label>Client</label>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {companies.map((c) => (
              <option key={c.id || c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Department</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id || d.name || d} value={d.name || d}>{d.name || d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Detailed Tables */}
      {activeReportTab === 'pf' && (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>UAN / PF Number</th>
                  <th>Basic / Eligible Salary</th>
                  <th>Employee PF (12%)</th>
                  <th>Employer PF (12%)</th>
                  <th>Total PF (24%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPF.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.employeeCell}>
                        <Avatar initials={row.initials} name={row.employeeName} size="sm" />
                        <div>
                          <span className={styles.empName}>{row.employeeName}</span>
                          <span className={styles.empSub}>{row.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.idCode}>{row.employeeId}</span></td>
                    <td>
                      <div className={styles.uanCell}>
                        <span>{row.uan}</span>
                        <small>{row.pfNumber}</small>
                      </div>
                    </td>
                    <td>{formatRupee(row.eligibleSalary)}</td>
                    <td>{formatRupee(row.employeePF)}</td>
                    <td>{formatRupee(row.employerPF)}</td>
                    <td><strong className={styles.textGreen}>{formatRupee(row.totalPF)}</strong></td>
                    <td><span className={styles.badgeSuccess}>Compliant</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'esi' && (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>ESI IP Number</th>
                  <th>Gross / Eligible Salary</th>
                  <th>Employee ESI (0.75%)</th>
                  <th>Employer ESI (3.25%)</th>
                  <th>Total ESI (4.0%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredESI.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.employeeCell}>
                        <Avatar initials={row.initials} name={row.employeeName} size="sm" />
                        <div>
                          <span className={styles.empName}>{row.employeeName}</span>
                          <span className={styles.empSub}>{row.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.idCode}>{row.employeeId}</span></td>
                    <td><span className={styles.idCode}>{row.esiNumber}</span></td>
                    <td>{formatRupee(row.eligibleSalary)}</td>
                    <td>{formatRupee(row.employeeESI)}</td>
                    <td>{formatRupee(row.employerESI)}</td>
                    <td><strong className={styles.textGreen}>{formatRupee(row.totalESI)}</strong></td>
                    <td><span className={styles.badgeSuccess}>Compliant</span></td>
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
