import React, { useMemo } from 'react';
import { FileText, Shield } from 'lucide-react';
import { numberToIndianWords } from '../../utils/payrollUtils';
import hrLogo from '../../assets/hrlogo.png';
import styles from './FnfSettlementReportView.module.css';

/**
 * Format currency to Indian Rupees with two decimal places
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert number into "Indian Rupee [Words] Only"
 */
function getAmountInWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Indian Rupee Zero Only';
  const rawWords = numberToIndianWords(num);
  const clean = rawWords.replace(/\s*Rupees\s*Only$/i, '').trim();
  return `Indian Rupee ${clean} Only`;
}

/**
 * Single Employee Full & Final Settlement Document Sheet Item
 */
function FnfSettlementSheetItem({ record, globalCompanyInfo }) {
  // Dynamic header company resolution: Employee's specific company or global company
  const company = record.companyInfo || globalCompanyInfo || {};
  const companyName = company.name || 'RR Security & Facilities';
  const companyAddress =
    company.address ||
    'G-75/A Block-G M.B. Extn Badarpur New Delhi Delhi 110044 India';

  // Logo resolution priority:
  // 1. Company logo in record
  // 2. Global company info logo
  // 3. LocalStorage company logo
  // 4. Default bundled hrLogo
  const logoSrc =
    company.logo ||
    globalCompanyInfo?.logo ||
    localStorage.getItem('novaspark_company_logo_preview') ||
    hrLogo;

  const earnings = record.earnings || {};
  const deductions = record.deductions || {};
  const netPay = record.netPay || {};

  const grossEarnings = Number(earnings.grossEarnings ?? record.grossSalary ?? 60000);
  const totalDeductions = Number(deductions.totalDeductions ?? record.grossDeduct ?? 23330);
  const netPayable = Number(netPay.netPayable ?? record.netPayableNumber ?? (grossEarnings - totalDeductions));

  const words = getAmountInWords(netPayable);

  return (
    <article className={styles.documentSheet}>
      {/* 1. Header Information & Logo for which company it is made by */}
      <header className={styles.headerRow}>
        <div className={styles.companyInfoBlock}>
          <div className={styles.companyTitle}>{companyName}</div>
          <div className={styles.companyAddress}>{companyAddress}</div>
        </div>

        <div className={styles.logoWrap}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${companyName} Logo`}
              className={styles.companyLogo}
              onError={(e) => {
                // Fallback to bundled logo on error
                if (e.target.src !== hrLogo) {
                  e.target.src = hrLogo;
                }
              }}
            />
          ) : (
            <div className={styles.companyLogoFallback}>
              <Shield size={16} />
              <span>{companyName}</span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Full and Final Settlement Centered Title Banner */}
      <div className={styles.titleBanner}>
        FULL AND FINAL SETTLEMENT
      </div>

      {/* 3. PAY SUMMARY 2-Column Grid */}
      <div className={styles.sectionHeader}>PAY SUMMARY</div>
      <div className={styles.paySummaryGrid}>
        {/* Left Column */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Employee Name</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.name || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Designation</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.designation || 'Staff'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Date of Joining</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.dateOfJoining || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Pay Period</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.payPeriod || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Final Settlement Date</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.finalSettlementDate || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>ESI Number</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.esiNumber || record.esiNo || '—'}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Employee ID</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.employeeId || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Bank Account No</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.bankAccountNo || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>PF A/C Number</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.pfAccountNumber || record.pfNo || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>UAN</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.uan || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Paid Days</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.paidDays ?? 0}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>LOP Days</span>
            <span className={styles.summaryColon}>:</span>
            <span className={styles.summaryValue}>{record.lopDays ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 4. EARNINGS & DEDUCTIONS Table */}
      <table className={styles.statementTable}>
        <thead>
          <tr>
            <th className={styles.textLeft} style={{ width: '28%' }}>EARNINGS</th>
            <th className={styles.textRight} style={{ width: '11%' }}>AMOUNT</th>
            <th className={styles.textRight} style={{ width: '11%' }}>YTD</th>
            <th className={styles.textLeft} style={{ width: '28%' }}>DEDUCTIONS</th>
            <th className={styles.textRight} style={{ width: '11%' }}>AMOUNT</th>
            <th className={styles.textRight} style={{ width: '11%' }}>YTD</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Basic vs Uniform */}
          <tr>
            <td className={styles.textLeft}>Basic</td>
            <td className={styles.textRight}>{formatCurrency(earnings.basic ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdBasic ?? 0)}</td>
            <td className={styles.textLeft}>UNIFORM</td>
            <td className={styles.textRight}>{formatCurrency(deductions.uniform ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(deductions.ytdUniform ?? 0)}</td>
          </tr>

          {/* Row 2: HRA vs Income Tax */}
          <tr>
            <td className={styles.textLeft}>House Rent Allowance</td>
            <td className={styles.textRight}>{formatCurrency(earnings.hra ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdHra ?? 0)}</td>
            <td className={styles.textLeft}>Income Tax</td>
            <td className={styles.textRight}>{formatCurrency(deductions.incomeTax ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(deductions.ytdIncomeTax ?? 0)}</td>
          </tr>

          {/* Row 3: Conveyance Allowance vs Provident Fund (if any) */}
          <tr>
            <td className={styles.textLeft}>Conveyance Allowance</td>
            <td className={styles.textRight}>{formatCurrency(earnings.conveyance ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdConveyance ?? 0)}</td>
            <td className={styles.textLeft}>{deductions.pf > 0 ? 'Provident Fund (PF)' : ''}</td>
            <td className={styles.textRight}>{deductions.pf > 0 ? formatCurrency(deductions.pf) : ''}</td>
            <td className={styles.textRight}>{deductions.pf > 0 ? formatCurrency(deductions.ytdPf) : ''}</td>
          </tr>

          {/* Row 4: Fixed Allowance vs ESI (if any) */}
          <tr>
            <td className={styles.textLeft}>Fixed Allowance</td>
            <td className={styles.textRight}>{formatCurrency(earnings.fixedAllowance ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdFixedAllowance ?? 0)}</td>
            <td className={styles.textLeft}>{deductions.esi > 0 ? 'Employee State Insurance (ESI)' : ''}</td>
            <td className={styles.textRight}>{deductions.esi > 0 ? formatCurrency(deductions.esi) : ''}</td>
            <td className={styles.textRight}>{deductions.esi > 0 ? formatCurrency(deductions.ytdEsi) : ''}</td>
          </tr>

          {/* Row 5: Overtime Allowance vs Professional Tax (if any) */}
          <tr>
            <td className={styles.textLeft}>
              Overtime Allowance
              <span className={styles.subText}>Hours: {earnings.overtimeHours || '00:00'}</span>
            </td>
            <td className={styles.textRight}>{formatCurrency(earnings.overtime ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdOvertime ?? 0)}</td>
            <td className={styles.textLeft}>{deductions.pt > 0 ? 'Professional Tax (PT)' : ''}</td>
            <td className={styles.textRight}>{deductions.pt > 0 ? formatCurrency(deductions.pt) : ''}</td>
            <td className={styles.textRight}>{deductions.pt > 0 ? formatCurrency(deductions.ytdPt) : ''}</td>
          </tr>

          {/* Row 6: Bonus */}
          <tr>
            <td className={styles.textLeft}>Bonus</td>
            <td className={styles.textRight}>{formatCurrency(earnings.bonus ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdBonus ?? 0)}</td>
            <td className={styles.textLeft}>{deductions.advanceLoan > 0 ? 'Advance / Loan EMI' : ''}</td>
            <td className={styles.textRight}>{deductions.advanceLoan > 0 ? formatCurrency(deductions.advanceLoan) : ''}</td>
            <td className={styles.textRight}>{deductions.advanceLoan > 0 ? formatCurrency(deductions.advanceLoan * 6) : ''}</td>
          </tr>

          {/* Row 7: Commission */}
          <tr>
            <td className={styles.textLeft}>Commission</td>
            <td className={styles.textRight}>{formatCurrency(earnings.commission ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdCommission ?? 0)}</td>
            <td className={styles.textLeft}>{deductions.otherDeductions > 0 ? 'Other Deductions' : ''}</td>
            <td className={styles.textRight}>{deductions.otherDeductions > 0 ? formatCurrency(deductions.otherDeductions) : ''}</td>
            <td className={styles.textRight}>{deductions.otherDeductions > 0 ? formatCurrency(deductions.otherDeductions * 6) : ''}</td>
          </tr>

          {/* Row 8: Leave Encashment */}
          <tr>
            <td className={styles.textLeft}>Leave Encashment</td>
            <td className={styles.textRight}>{formatCurrency(earnings.leaveEncashment ?? 0)}</td>
            <td className={styles.textRight}>{formatCurrency(earnings.ytdLeaveEncashment ?? 0)}</td>
            <td className={styles.textLeft}></td>
            <td className={styles.textRight}></td>
            <td className={styles.textRight}></td>
          </tr>

          {/* Row 9: Gross Earnings vs Total Deductions */}
          <tr className={styles.totalRow}>
            <td className={styles.textLeft}>Gross Earnings</td>
            <td className={styles.textRight}>{formatCurrency(grossEarnings)}</td>
            <td className={styles.textRight}></td>
            <td className={styles.textLeft}>Total Deductions</td>
            <td className={styles.textRight}>{formatCurrency(totalDeductions)}</td>
            <td className={styles.textRight}></td>
          </tr>
        </tbody>
      </table>

      {/* 5. NET PAY Summary */}
      <table className={styles.netPayTable}>
        <thead>
          <tr>
            <th className={styles.textLeft}>NET PAY</th>
            <th className={styles.textRight} style={{ width: '22%' }}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.textLeft}>Gross Earnings</td>
            <td className={styles.textRight}>{formatCurrency(grossEarnings)}</td>
          </tr>
          <tr>
            <td className={styles.textLeft}>Total Deductions</td>
            <td className={styles.textRight}>(-) {formatCurrency(totalDeductions)}</td>
          </tr>
          <tr className={styles.netPayTotalRow}>
            <td className={styles.textLeft} style={{ fontWeight: 800 }}>Total Net Payable</td>
            <td className={styles.textRight} style={{ fontWeight: 800 }}>{formatCurrency(netPayable)}</td>
          </tr>
        </tbody>
      </table>

      {/* 6. Total Net Payable in Words & Formula Banner */}
      <div className={styles.wordsBanner}>
        <div className={styles.wordsPrimary}>
          Total Net Payable {formatCurrency(netPayable)} ({words})
        </div>
        <div className={styles.wordsFormula}>
          **Total Net Payable = (Gross Earnings - Total Deductions)
        </div>
      </div>

      {/* 7. Signoff and Notes */}
      <div className={styles.noteSection}>Note:</div>
      <div className={styles.signaturesRow}>
        <div className={styles.signColumn}>
          <div className={styles.signPlaceholder} />
          <span>Prepared By:</span>
        </div>
        <div className={styles.signColumn}>
          <div className={styles.signPlaceholder} />
          <span>Checked By:</span>
        </div>
        <div className={styles.signColumn}>
          <div className={styles.signPlaceholder} />
          <span>Authorised By:</span>
        </div>
      </div>

      {/* 8. Declaration By the Receiver */}
      <div className={styles.declarationBlock}>
        <div className={styles.declarationHeading}>Declaration By the Receiver</div>
        <div className={styles.declarationText}>
          I, the undersigned, hereby state that I have received the above said amount as my full and final settlement out of my own free will and consent, and I have no further claims whatsoever against the company.
        </div>
        <div className={styles.receiverSignRow}>
          <span>Signature of the Employee: _______________________________</span>
          <span>Date: ________________________</span>
        </div>
      </div>
    </article>
  );
}

/**
 * Main Full & Final Settlement Report View
 */
export default function FnfSettlementReportView({
  records = [],
  companyInfo = {},
  filters = {},
}) {
  const selectedEmpFilter = filters?.employee;
  const isAllEmployees = !selectedEmpFilter || selectedEmpFilter === 'All Employees';

  // Target single employee if filter is selected, or all matching records
  const targetEmployee = useMemo(() => {
    if (!records.length) return null;
    if (!isAllEmployees && selectedEmpFilter) {
      const targetTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[0].trim().toLowerCase()
        : selectedEmpFilter.trim().toLowerCase();

      return (
        records.find((r) => {
          const idMatch = String(r.employeeId || '').toLowerCase() === targetTerm;
          const nameMatch = String(r.name || '').toLowerCase().includes(targetTerm);
          return idMatch || nameMatch;
        }) || records[0]
      );
    }
    return records[0];
  }, [records, selectedEmpFilter, isAllEmployees]);

  const employeesToRender = useMemo(() => {
    if (!isAllEmployees && targetEmployee) {
      return [targetEmployee];
    }
    return records;
  }, [records, isAllEmployees, targetEmployee]);

  if (!records || records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileText size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
        <h4 className={styles.emptyTitle}>No Full & Final Settlement Record Found</h4>
        <p className={styles.emptyText}>
          No employee records match your selected filters (Company: {filters?.company || 'All Companies'}, Department: {filters?.department || 'All Departments'}).
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {employeesToRender.map((rec, idx) => (
        <FnfSettlementSheetItem
          key={rec.employeeId || rec.srNo || idx}
          record={rec}
          globalCompanyInfo={companyInfo}
        />
      ))}
    </div>
  );
}
