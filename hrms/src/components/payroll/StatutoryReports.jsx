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

  // Dynamic sums for PF & ESI
  const pfEmployeeCount = filteredPF.length;
  const totalEmployeePF = filteredPF.reduce((sum, r) => sum + Number(r.employeePF || 0), 0);
  const totalEmployerPF = filteredPF.reduce((sum, r) => sum + Number(r.employerPF || 0), 0);
  const totalPF = filteredPF.reduce((sum, r) => sum + Number(r.totalPF || (r.employeePF * 2) || 0), 0);

  const esiEmployeeCount = filteredESI.length;
  const totalEmployeeESI = filteredESI.reduce((sum, r) => sum + Number(r.employeeESI || 0), 0);
  const totalEmployerESI = filteredESI.reduce((sum, r) => sum + Number(r.employerESI || 0), 0);
  const totalESI = filteredESI.reduce((sum, r) => sum + Number(r.totalESI || 0), 0);

  const employeesCovered = new Set([...filteredPF.map(r => r.employeeId), ...filteredESI.map(r => r.employeeId)]).size;
  const reportsGenerated = (filteredPF.length > 0 || filteredESI.length > 0) ? 6 : 0;

  return (
    <div className={styles.container}>
      {/* 4 Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>PF Contribution</span>
            <strong className={styles.cardVal}>{formatRupee(totalPF)}</strong>
            <small className={styles.cardSub}>Employee: {formatRupee(totalEmployeePF)} + Employer: {formatRupee(totalEmployerPF)}</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.blueIcon}`}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>ESI Contribution</span>
            <strong className={styles.cardVal}>{formatRupee(totalESI)}</strong>
            <small className={styles.cardSub}>Employee: {formatRupee(totalEmployeeESI)} + Employer: {formatRupee(totalEmployerESI)}</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.greenIcon}`}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Employees Covered</span>
            <strong className={styles.cardVal}>{employeesCovered.toLocaleString('en-IN')}</strong>
            <small className={styles.cardSub}>Statutory compliance active</small>
          </div>
          <div className={`${styles.iconWrap} ${styles.purpleIcon}`}>
            <Users size={22} />
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Reports Generated</span>
            <strong className={styles.cardVal}>{reportsGenerated}</strong>
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
              <strong>{pfEmployeeCount.toLocaleString('en-IN')}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employee Contribution</span>
              <strong>{formatRupee(totalEmployeePF)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employer Contribution</span>
              <strong>{formatRupee(totalEmployerPF)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Total PF Remittance</span>
              <strong className={styles.textGreen}>{formatRupee(totalPF)}</strong>
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
              <strong>{esiEmployeeCount.toLocaleString('en-IN')}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employee Contribution</span>
              <strong>{formatRupee(totalEmployeeESI)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Employer Contribution</span>
              <strong>{formatRupee(totalEmployerESI)}</strong>
            </div>
            <div className={styles.reportStat}>
              <span>Total ESI Remittance</span>
              <strong className={styles.textGreen}>{formatRupee(totalESI)}</strong>
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
