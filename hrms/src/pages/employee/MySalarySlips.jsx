import React, { useState, useMemo } from 'react';
import {
  Banknote,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import SalarySlipPreview from '../../components/payroll/SalarySlipPreview';
import { formatRupee, formatDate } from '../../utils/payrollUtils';
import authService from '../../services/authService';
import { useCompany } from '../../context/CompanyContext';
import styles from './MySalarySlips.module.css';

/* ─────────────────────────────────────────
   Dynamic Salary Slips Generator
   ───────────────────────────────────────── */
function generateDynamicSlips(currentUser, companyName) {
  if (!currentUser) return [];

  const empName = currentUser.name || currentUser.employeeName || 'Employee';
  const empId = currentUser.employeeId || currentUser.employeeCode || currentUser.id || 'EMP-001';
  const designation = currentUser.designation || currentUser.role || 'Security Staff';
  const department = currentUser.department || 'Operations';
  const compName = companyName || currentUser.companyName || 'RR Security & Facilities';

  const basic = Number(currentUser.basic || currentUser.basicSalary || (currentUser.grossSalary ? Math.round(currentUser.grossSalary * 0.5) : 28000));
  const hra = Number(currentUser.hra || Math.round(basic * 0.4));
  const conveyance = Number(currentUser.conveyance || 1600);
  const specialAllowance = Number(currentUser.specialAllowance || currentUser.otherAllowance || Math.max(0, (currentUser.grossSalary || (basic + hra + 1600 + 3500)) - basic - hra - conveyance));
  const vda = Number(currentUser.vda || 0);
  const grossSalary = basic + hra + conveyance + specialAllowance + vda;

  const isPf = currentUser.pfApplicable !== false && currentUser.pfApplicable !== 'false';
  const isEsi = currentUser.esiApplicable !== false && currentUser.esiApplicable !== 'false' && grossSalary <= 21000;
  const pf = isPf ? Math.round(basic * 0.12) : 0;
  const esi = isEsi ? Math.round(grossSalary * 0.0075) : 0;
  const pt = 200;
  const totalDeductions = pf + esi + pt;
  const netSalary = grossSalary - totalDeductions;

  const today = new Date();
  const slips = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const salaryMonth = `${monthName} ${year}`;
    const lastDayOfMonth = new Date(year, d.getMonth() + 1, 0).getDate();

    // Past months are Generated; current month is Generated after the 25th or otherwise Pending
    const isCurrentMonth = i === 0;
    const isGenerated = !isCurrentMonth || today.getDate() >= 25;
    const status = isGenerated ? 'Generated' : 'Pending';

    slips.push({
      id: `SLIP-${year}-${d.getMonth() + 1}-${empId}`,
      slipNumber: `PAY-${year}${String(d.getMonth() + 1).padStart(2, '0')}-${empId.replace(/[^A-Za-z0-9]/g, '') || '001'}`,
      salaryMonth,
      monthKey,
      status,
      generatedDate: isGenerated ? `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}` : null,
      payPeriod: `01/${String(d.getMonth() + 1).padStart(2, '0')}/${year} - ${lastDayOfMonth}/${String(d.getMonth() + 1).padStart(2, '0')}/${year}`,
      payDate: `${lastDayOfMonth} ${monthName} ${year}`,
      workingDays: lastDayOfMonth - 4,
      presentDays: isGenerated ? lastDayOfMonth - 4 : Math.min(today.getDate(), lastDayOfMonth - 4),
      lopDays: 0,
      employeeName: empName,
      employeeId: empId,
      designation,
      department,
      company: compName,
      pan: currentUser.pan || '—',
      bankName: currentUser.bankName || 'State Bank of India',
      bankAccount: currentUser.accountNumber || currentUser.bankAccount || '•••• •••• 4892',
      ifscCode: currentUser.ifscCode || 'SBIN0001234',
      uan: currentUser.uan || '101234567890',
      pfNumber: currentUser.pfNo || 'DL/CPM/0012345/000',
      esiNumber: currentUser.esicNo || '1122334455001',
      earnings: {
        basicSalary: basic,
        hra,
        conveyanceAllowance: conveyance,
        specialAllowance,
        vda,
        totalEarnings: grossSalary,
        grossSalary,
      },
      deductions: {
        providentFund: pf,
        esic: esi,
        professionalTax: pt,
        totalDeductions,
      },
      netSalary,
    });
  }

  return slips;
}

/* ─────────────────────────────────────────
   Main Component
   ───────────────────────────────────────── */
function MySalarySlips() {
  const { activeCompany } = useCompany();
  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const companyName = activeCompany?.name || currentUser.companyName || 'RR Security & Facilities';

  const employeeName = currentUser.name || currentUser.employeeName || 'Employee';
  const employeeInitials = (employeeName.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'EM').toUpperCase();
  const employeeId = currentUser.employeeId || currentUser.employeeCode || currentUser.id || '—';
  const designation = currentUser.designation || currentUser.role || 'Staff Member';
  const department = currentUser.department || 'Operations';

  // Dynamic salary slips generated for the logged-in employee
  const slipsList = useMemo(() => {
    return generateDynamicSlips(currentUser, companyName);
  }, [currentUser, companyName]);

  // Filter state
  const [draftMonth, setDraftMonth] = useState('all');
  const [draftStatus, setDraftStatus] = useState('all');
  const [appliedMonth, setAppliedMonth] = useState('all');
  const [appliedStatus, setAppliedStatus] = useState('all');

  // Preview modal state
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Month filter dropdown options
  const monthOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Months' }];
    slipsList.forEach((s) => {
      opts.push({ value: s.salaryMonth, label: s.salaryMonth });
    });
    return opts;
  }, [slipsList]);

  /* Apply filters */
  const handleApply = () => {
    setAppliedMonth(draftMonth);
    setAppliedStatus(draftStatus);
  };

  const handleReset = () => {
    setDraftMonth('all');
    setDraftStatus('all');
    setAppliedMonth('all');
    setAppliedStatus('all');
  };

  /* Filtered slips */
  const filteredSlips = useMemo(() => {
    return slipsList.filter((slip) => {
      const monthMatch = appliedMonth === 'all' || slip.salaryMonth === appliedMonth;
      const isGenerated = slip.status?.toLowerCase() === 'generated';
      const statusMatch =
        appliedStatus === 'all' ||
        (appliedStatus === 'generated' && isGenerated) ||
        (appliedStatus === 'pending' && !isGenerated);
      return monthMatch && statusMatch;
    });
  }, [slipsList, appliedMonth, appliedStatus]);

  /* Latest slip for summary cards */
  const latestSlip = slipsList.find((s) => s.status?.toLowerCase() === 'generated') || slipsList[0];

  /* Open preview */
  const handleViewSlip = (slip) => {
    setSelectedSlip(slip);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedSlip(null);
  };

  /* Download handler */
  const handleDownloadSlip = (slip) => {
    setSelectedSlip(slip);
    setPreviewOpen(true);
  };

  /* Print */
  const handlePrintSlip = (slip) => {
    setSelectedSlip(slip);
    setPreviewOpen(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ── Page Header ── */}
        <header className={styles.pageHeader}>
          <div>
            <h1>My Salary Slips</h1>
            <p>View and download your dynamic salary slips.</p>
          </div>
        </header>

        {/* ── Employee Identity Card ── */}
        <section className={styles.identityCard} aria-label="Employee identity">
          <div className={styles.avatar} aria-hidden="true">
            {employeeInitials}
          </div>
          <div className={styles.identityInfo}>
            <h2>{employeeName}</h2>
            <div className={styles.identityMeta}>
              <span>
                Employee ID: <strong>{employeeId}</strong>
              </span>
              <span>
                Designation: <strong>{designation}</strong>
              </span>
              <span>
                Department: <strong>{department}</strong>
              </span>
              <span>
                Company: <strong>{companyName}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* ── Salary Summary Cards ── */}
        {latestSlip ? (
          <section
            className={styles.summaryGrid}
            aria-label="Latest salary summary"
          >
            {/* Net / Latest Salary */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardLabel}>
                <span className={`${styles.summaryCardIcon} ${styles.net}`}>
                  <Wallet size={14} />
                </span>
                Latest Net Salary
              </div>
              <div className={`${styles.summaryCardValue} ${styles.net}`}>
                {formatRupee(latestSlip.netSalary)}
              </div>
              <div className={styles.summaryCardSub}>
                {latestSlip.salaryMonth}
              </div>
            </div>

            {/* Gross */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardLabel}>
                <span className={`${styles.summaryCardIcon} ${styles.gross}`}>
                  <TrendingUp size={14} />
                </span>
                Gross Salary
              </div>
              <div className={styles.summaryCardValue}>
                {formatRupee(latestSlip.earnings?.grossSalary)}
              </div>
              <div className={styles.summaryCardSub}>
                {latestSlip.salaryMonth}
              </div>
            </div>

            {/* Deductions */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardLabel}>
                <span className={`${styles.summaryCardIcon} ${styles.deduct}`}>
                  <TrendingDown size={14} />
                </span>
                Deductions
              </div>
              <div className={`${styles.summaryCardValue} ${styles.deduct}`}>
                {formatRupee(latestSlip.deductions?.totalDeductions)}
              </div>
              <div className={styles.summaryCardSub}>
                {latestSlip.salaryMonth}
              </div>
            </div>

            {/* Status */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardLabel}>
                <span className={`${styles.summaryCardIcon} ${styles.status}`}>
                  <Banknote size={14} />
                </span>
                Status
              </div>
              <div className={styles.summaryCardValue}>
                {latestSlip.status?.toLowerCase() === 'generated' ? (
                  <span className={styles.statusBadgeProcessed}>
                    Processed
                  </span>
                ) : (
                  <span className={styles.statusBadgePending}>Pending</span>
                )}
              </div>
              <div className={styles.summaryCardSub}>
                {latestSlip.salaryMonth}
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.summaryGrid} aria-label="No salary data">
            <div className={styles.summaryCard} style={{ gridColumn: '1/-1' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                No salary data available yet. Summary will appear here once payroll is processed.
              </p>
            </div>
          </section>
        )}

        {/* ── Salary Slip History Section ── */}
        <section>
          <div className={styles.sectionHeading}>
            <div>
              <h2>View your previous salary slips.</h2>
            </div>
          </div>
        </section>

        {/* ── Filter Bar ── */}
        <div className={styles.filterBar} role="search" aria-label="Filter salary slips">
          <div className={styles.filterField}>
            <label htmlFor="filter-month">Month</label>
            <select
              id="filter-month"
              value={draftMonth}
              onChange={(e) => setDraftMonth(e.target.value)}
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="generated">Processed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApply}
              id="salary-filter-apply"
            >
              Apply
            </button>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
              id="salary-filter-reset"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className={styles.tableSection}>
          <div className={styles.tableResponsive}>
            {filteredSlips.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrap}>
                  <FileText size={28} />
                </div>
                <h3>No salary slips available</h3>
                <p>
                  Your salary slips will appear here once payroll is processed.
                </p>
              </div>
            ) : (
              <table className={styles.table} aria-label="Salary slip history">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Gross Salary</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Processed Date</th>
                    <th className={styles.thActions}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlips.map((slip) => {
                    const isGenerated = slip.status?.toLowerCase() === 'generated';
                    return (
                      <tr key={slip.id} className={styles.tableRow}>
                        <td>{slip.salaryMonth}</td>
                        <td>
                          {isGenerated
                            ? formatRupee(slip.earnings?.grossSalary)
                            : '—'}
                        </td>
                        <td className={styles.deductCell}>
                          {isGenerated
                            ? `-${formatRupee(slip.deductions?.totalDeductions)}`
                            : '—'}
                        </td>
                        <td>
                          <strong className={styles.netSalaryCell}>
                            {isGenerated ? formatRupee(slip.netSalary) : '—'}
                          </strong>
                        </td>
                        <td>
                          {isGenerated ? (
                            <span className={styles.badgeGenerated}>
                              Processed
                            </span>
                          ) : (
                            <span className={styles.badgePending}>Pending</span>
                          )}
                        </td>
                        <td className={styles.dateCell}>
                          {slip.generatedDate
                            ? formatDate(slip.generatedDate)
                            : '—'}
                        </td>
                        <td className={styles.tdActions}>
                          <div className={styles.actionBtns}>
                            {isGenerated ? (
                              <>
                                <button
                                  type="button"
                                  className={styles.viewBtn}
                                  onClick={() => handleViewSlip(slip)}
                                  title="View Salary Slip"
                                  id={`view-slip-${slip.id}`}
                                >
                                  <Eye size={14} />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => handleDownloadSlip(slip)}
                                  title="Download PDF"
                                  aria-label="Download salary slip"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => handlePrintSlip(slip)}
                                  title="Print Slip"
                                  aria-label="Print salary slip"
                                >
                                  <Printer size={14} />
                                </button>
                              </>
                            ) : (
                              <span
                                className={styles.viewUnavailable}
                                title="Salary slip not yet processed"
                              >
                                View unavailable
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Mobile Cards ── */}
          <div className={styles.mobileList} aria-label="Salary slip history (mobile)">
            {filteredSlips.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrap}>
                  <FileText size={28} />
                </div>
                <h3>No salary slips available</h3>
                <p>
                  Your salary slips will appear here once payroll is processed.
                </p>
              </div>
            ) : (
              filteredSlips.map((slip) => {
                const isGenerated = slip.status?.toLowerCase() === 'generated';
                return (
                  <div key={slip.id} className={styles.mobileCard}>
                    <div className={styles.mobileCardHeader}>
                      <span className={styles.mobileMonthLabel}>
                        {slip.salaryMonth}
                      </span>
                      {isGenerated ? (
                        <span className={styles.badgeGenerated}>Processed</span>
                      ) : (
                        <span className={styles.badgePending}>Pending</span>
                      )}
                    </div>

                    {isGenerated && (
                      <div className={styles.mobileGrid}>
                        <div className={styles.mobileRow}>
                          <span>Gross Salary</span>
                          <span>
                            {formatRupee(slip.earnings?.grossSalary)}
                          </span>
                        </div>
                        <div className={styles.mobileRow}>
                          <span>Deductions</span>
                          <span className={styles.deductCell}>
                            -{formatRupee(slip.deductions?.totalDeductions)}
                          </span>
                        </div>
                        <div
                          className={`${styles.mobileRow} ${styles.mobileNetRow}`}
                        >
                          <span>Net Salary</span>
                          <strong>{formatRupee(slip.netSalary)}</strong>
                        </div>
                        {slip.generatedDate && (
                          <div className={styles.mobileRow}>
                            <span>Processed Date</span>
                            <span>{formatDate(slip.generatedDate)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!isGenerated && (
                      <div className={styles.mobileGrid}>
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            margin: 0,
                          }}
                        >
                          Your salary slip is not available yet.
                        </p>
                      </div>
                    )}

                    <div className={styles.mobileActions}>
                      {isGenerated ? (
                        <>
                          <button
                            type="button"
                            className={styles.mobilePrimaryBtn}
                            onClick={() => handleViewSlip(slip)}
                          >
                            <Eye size={14} />
                            <span>View Slip</span>
                          </button>
                          <button
                            type="button"
                            className={styles.mobileOutlineBtn}
                            onClick={() => handleDownloadSlip(slip)}
                            title="Download"
                            aria-label="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.mobileOutlineBtn}
                            onClick={() => handlePrintSlip(slip)}
                            title="Print"
                            aria-label="Print"
                          >
                            <Printer size={14} />
                          </button>
                        </>
                      ) : (
                        <span className={styles.mobileUnavailableBtn}>
                          View unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── SalarySlipPreview Modal ── */}
      <SalarySlipPreview
        isOpen={previewOpen}
        slip={selectedSlip}
        onClose={handleClosePreview}
        onDownload={() => window.print()}
      />
    </main>
  );
}

export default MySalarySlips;
