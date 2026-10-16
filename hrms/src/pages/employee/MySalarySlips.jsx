import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import SalarySlipPreview from '../../components/payroll/SalarySlipPreview';
import { formatRupee, formatDate } from '../../utils/payrollUtils';
import { generateSalarySlipPdf } from '../../utils/salarySlipPdfUtil';
import authService from '../../services/authService';
import payrollService from '../../services/payrollService';
import { useCompany } from '../../context/CompanyContext';
import styles from './MySalarySlips.module.css';

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

  // Live dynamic salary slips from MongoDB database
  const [slipsList, setSlipsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSalarySlips = useCallback(async () => {
    try {
      setLoading(true);
      const compId = activeCompany?._id || activeCompany?.companyId || currentUser.companyId || 'RRS8392014SEC';
      const empId = currentUser.employeeId || currentUser.employeeCode || currentUser.id;

      const data = await payrollService.getSalarySlips(compId, { employeeId: empId });

      const rawSlips = Array.isArray(data) ? data : [];
      const normalized = rawSlips.map((s, idx) => {
        const earnings = s.earnings || s.earningsBreakdown || {};
        const deductions = s.deductions || s.deductionsBreakdown || {};
        const grossSalary = s.grossSalary !== undefined ? Number(s.grossSalary) : (Number(earnings.totalGross || earnings.grossSalary) || 0);
        const totalDeductions = s.totalDeductions !== undefined ? Number(s.totalDeductions) : (Number(deductions.totalDeductions) || 0);
        const netSalary = s.netSalary !== undefined ? Number(s.netSalary) : Math.max(0, grossSalary - totalDeductions);

        const monthKey = s.month || '';
        let salaryMonth = s.salaryMonth || s.monthLabel || '';
        if (!salaryMonth && monthKey) {
          const [y, m] = monthKey.split('-');
          if (y && m) {
            const d = new Date(Number(y), Number(m) - 1, 1);
            salaryMonth = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        }

        return {
          ...s,
          id: s._id || s.id || `slip-${idx}`,
          slipNumber: s.slipNumber || `PAY-${(monthKey || '0000-00').replace('-', '')}-${String(s.employeeId || empId || '001').replace(/[^A-Za-z0-9]/g, '')}`,
          salaryMonth: salaryMonth || 'Current Month',
          monthKey,
          status: s.status || 'Generated',
          generatedDate: s.generatedDate || (s.createdAt ? s.createdAt.split('T')[0] : null),
          workingDays: s.workingDays !== undefined ? s.workingDays : 30,
          presentDays: s.presentDays !== undefined ? s.presentDays : (s.paidDays !== undefined ? s.paidDays : 30),
          paidDays: s.paidDays !== undefined ? s.paidDays : (s.presentDays !== undefined ? s.presentDays : 30),
          lopDays: s.lopDays || 0,
          employeeName: s.employeeName || currentUser.name || 'Employee',
          employeeId: s.employeeId || empId || '—',
          designation: s.designation || currentUser.designation || 'Staff',
          department: s.department || currentUser.department || 'Operations',
          company: s.companyName || activeCompany?.name || currentUser.companyName || 'RR Security & Facilities',
          companyName: s.companyName || activeCompany?.name || currentUser.companyName || 'RR Security & Facilities',
          companyAddress: s.companyAddress || [activeCompany?.address, activeCompany?.city, activeCompany?.state, activeCompany?.pinCode].filter(Boolean).join(', ') || activeCompany?.address || '',
          companyEmail: s.companyEmail || activeCompany?.email || '',
          companyPhone: s.companyPhone || activeCompany?.phone || '',
          companyGstin: s.companyGstin || activeCompany?.gstin || '',
          companyPan: s.companyPan || activeCompany?.pan || '',
          companyLogo: s.companyLogo || activeCompany?.logo || null,
          pan: s.pan || currentUser.pan || '—',
          bankName: s.bankName || currentUser.bankName || '—',
          bankAccount: s.bankAccountNo || s.bankAccount || currentUser.bankAccount || currentUser.accountNumber || '—',
          bankAccountNo: s.bankAccountNo || s.bankAccount || currentUser.bankAccount || currentUser.accountNumber || '—',
          ifscCode: s.ifscCode || currentUser.ifscCode || '—',
          uan: s.uan || currentUser.uan || '—',
          pfNumber: s.pfNo || s.pfNumber || currentUser.pfNo || '—',
          esiNumber: s.esicNo || s.esiNumber || currentUser.esicNo || '—',
          grossSalary,
          totalDeductions,
          netSalary,
          earnings: {
            basicSalary: earnings.basicSalary || earnings.basic || 0,
            basic: earnings.basic || earnings.basicSalary || 0,
            hra: earnings.hra || 0,
            conveyanceAllowance: earnings.conveyanceAllowance || earnings.conveyance || 0,
            conveyance: earnings.conveyance || earnings.conveyanceAllowance || 0,
            specialAllowance: earnings.specialAllowance || 0,
            otherAllowance: earnings.otherAllowance || 0,
            vda: earnings.vda || 0,
            bonus: earnings.bonus || 0,
            overtime: earnings.overtime || 0,
            totalEarnings: grossSalary,
            grossSalary,
          },
          deductions: {
            providentFund: deductions.providentFund || deductions.pfEmployee || deductions.pf || 0,
            pfEmployee: deductions.pfEmployee || deductions.pf || 0,
            esic: deductions.esic || deductions.esiEmployee || deductions.esi || 0,
            esiEmployee: deductions.esiEmployee || deductions.esi || 0,
            professionalTax: deductions.professionalTax || deductions.pt || 0,
            pt: deductions.pt || deductions.professionalTax || 0,
            tds: deductions.tds || 0,
            advances: deductions.advances || 0,
            totalDeductions,
          },
        };
      });

      setSlipsList(normalized);
    } catch (err) {
      console.error('Failed to load employee salary slips:', err);
      setSlipsList([]);
    } finally {
      setLoading(false);
    }
  }, [activeCompany?._id, activeCompany?.companyId, currentUser.companyId, currentUser.employeeId, currentUser.employeeCode, currentUser.id, currentUser.name]);

  useEffect(() => {
    loadSalarySlips();
  }, [loadSalarySlips]);

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
    generateSalarySlipPdf({
      slip,
      company: activeCompany,
      mode: 'download'
    });
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
          <button
            type="button"
            className={styles.resetBtn}
            onClick={loadSalarySlips}
            disabled={loading}
            title="Refresh verified salary slips"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
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
        {loading ? (
          <section className={styles.summaryGrid} aria-label="Loading salary data">
            <div className={styles.summaryCard} style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px', gap: '10px' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading verified salary slips from database...</span>
            </div>
          </section>
        ) : latestSlip ? (
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
                {formatRupee(latestSlip.grossSalary || latestSlip.earnings?.grossSalary || latestSlip.earnings?.totalGross)}
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
                {formatRupee(latestSlip.totalDeductions || latestSlip.deductions?.totalDeductions)}
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
                {latestSlip.status?.toLowerCase() === 'generated' || latestSlip.status?.toLowerCase() === 'processed' ? (
                  <span className={styles.statusBadgeProcessed}>
                    Processed
                  </span>
                ) : (
                  <span className={styles.statusBadgePending}>{latestSlip.status || 'Pending'}</span>
                )}
              </div>
              <div className={styles.summaryCardSub}>
                {latestSlip.salaryMonth}
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.summaryGrid} aria-label="No salary data">
            <div className={styles.summaryCard} style={{ gridColumn: '1/-1', padding: '20px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                No salary slips generated yet. Once your salary slip is processed and generated by HR / Administration, your verified earnings and deductions will appear here dynamically.
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
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Fetching verified salary slips...</span>
              </div>
            ) : filteredSlips.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrap}>
                  <FileText size={28} />
                </div>
                <h3>No salary slips available</h3>
                <p>
                  Your verified salary slips will appear here once payroll is processed by HR / Admin.
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
                    const isGenerated = slip.status?.toLowerCase() === 'generated' || slip.status?.toLowerCase() === 'processed';
                    return (
                      <tr key={slip.id} className={styles.tableRow}>
                        <td>{slip.salaryMonth}</td>
                        <td>
                          {isGenerated
                            ? formatRupee(slip.grossSalary || slip.earnings?.grossSalary || slip.earnings?.totalGross)
                            : '—'}
                        </td>
                        <td className={styles.deductCell}>
                          {isGenerated
                            ? `-${formatRupee(slip.totalDeductions || slip.deductions?.totalDeductions)}`
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
                            <span className={styles.badgePending}>{slip.status || 'Pending'}</span>
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
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '10px' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading slips...</span>
              </div>
            ) : filteredSlips.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrap}>
                  <FileText size={28} />
                </div>
                <h3>No salary slips available</h3>
                <p>
                  Your verified salary slips will appear here once payroll is processed by HR / Admin.
                </p>
              </div>
            ) : (
              filteredSlips.map((slip) => {
                const isGenerated = slip.status?.toLowerCase() === 'generated' || slip.status?.toLowerCase() === 'processed';
                return (
                  <div key={slip.id} className={styles.mobileCard}>
                    <div className={styles.mobileCardHeader}>
                      <span className={styles.mobileMonthLabel}>
                        {slip.salaryMonth}
                      </span>
                      {isGenerated ? (
                        <span className={styles.badgeGenerated}>Processed</span>
                      ) : (
                        <span className={styles.badgePending}>{slip.status || 'Pending'}</span>
                      )}
                    </div>

                    {isGenerated && (
                      <div className={styles.mobileGrid}>
                        <div className={styles.mobileRow}>
                          <span>Gross Salary</span>
                          <span>
                            {formatRupee(slip.grossSalary || slip.earnings?.grossSalary || slip.earnings?.totalGross)}
                          </span>
                        </div>
                        <div className={styles.mobileRow}>
                          <span>Deductions</span>
                          <span className={styles.deductCell}>
                            -{formatRupee(slip.totalDeductions || slip.deductions?.totalDeductions)}
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
        company={activeCompany}
        onClose={handleClosePreview}
        onDownload={(slip) => generateSalarySlipPdf({
          slip,
          company: activeCompany,
          mode: 'download'
        })}
      />
    </main>
  );
}

export default MySalarySlips;
