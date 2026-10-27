import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Users,
  Clock,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  downloadWagesRegisterExcel,
  downloadWagesRegisterPdf,
} from '../../utils/wagesRegisterExport';
import styles from './WagesRegisterFormXVIILReportView.module.css';

/**
 * Statutory Register of Wages (Form XVII) Interactive View Component
 * [FORM XVII, See Rule 78 (1) (a) (i) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact layout, columns, grand totals, and statutory reconciliation in user-uploaded images.
 */
export default function WagesRegisterFormXVIILReportView({
  records = [],
  companyInfo = {},
  establishmentInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  filters = {},
}) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const est = establishmentInfo || {};
  const contractorName = est.contractorName || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    est.contractorAddress ||
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const workLocation =
    est.natureAndLocationOfWork ||
    'STAR TRACK TERMINALS PVT. LTD. ICD DADRI TILPATA ROAD, DADRI GREATER NOIDA';
  const establishmentFull =
    est.establishmentName && est.establishmentAddress
      ? `${est.establishmentName}, ${est.establishmentAddress}`
      : 'STAR TRACK TERMINALS PRIVATE LIMITED, ICD DADRI, TILPATA ROAD, DADRI GREATER NOIDA 201311';
  const principalEmployer = est.principalEmployer || 'STAR TRACK TERMINALS PRIVATE LIMITED';
  const wagesPeriod = est.wagesPeriod || period?.wagesPeriod || period?.monthLabel || 'Current Period';

  // Computed Totals
  const totalEmployees = totals?.totalEmployees ?? records.length;
  const totalDays = totals?.grandDaysWorked ?? records.reduce((s, r) => s + (Number(r.daysWorked) || 0), 0);
  const totalGross = totals?.grandGrossEarned ?? records.reduce((s, r) => s + (Number(r.earnings?.totalEarned) || 0), 0);
  const totalNet = totals?.grandNetPaid ?? records.reduce((s, r) => s + (Number(r.netPaid) || 0), 0);

  const handleExportExcel = async () => {
    if (downloadingFormat) return;
    try {
      setDownloadingFormat('excel');
      await new Promise((r) => setTimeout(r, 80));
      await downloadWagesRegisterExcel(records, companyInfo, period, totals, pfSummary, esiSummary, establishmentInfo);
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error('Export Excel failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportPdf = async () => {
    if (downloadingFormat) return;
    try {
      setDownloadingFormat('pdf');
      await new Promise((r) => setTimeout(r, 60));
      await downloadWagesRegisterPdf(records, companyInfo, period, totals, pfSummary, esiSummary, establishmentInfo);
    } catch (err) {
      console.error('Export PDF failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeWorkforce}>
            {records.length} Employees in Register
          </span>
          <span className={styles.badgePeriod}>Period: {wagesPeriod}</span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            disabled={Boolean(downloadingFormat)}
            title="Download Statutory Form XVII as Excel spreadsheet"
          >
            {downloadingFormat === 'excel' ? (
              <>
                <Loader2 size={16} className={styles.spinner} /> Preparing Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} /> Export Excel
              </>
            )}
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            disabled={Boolean(downloadingFormat)}
            title="Download Official Form XVII Printable PDF"
          >
            {downloadingFormat === 'pdf' ? (
              <>
                <Loader2 size={16} className={styles.spinner} /> Generating PDF...
              </>
            ) : (
              <>
                <FileText size={16} /> Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Formal Paper Document Frame */}
      <div className={styles.paperSheet}>
        {/* Statutory Title matching Image 1 */}
        <div className={styles.formHeader}>
          <div className={styles.formMainTitle}>FORM XVII (See rule 78 (1) (a) (i))</div>
          <div className={styles.ruleSubtitle}>
            Contract Labour (Regulation &amp; Abolition) Central Rule, 1971,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Register of Wages
          </div>
        </div>

        {/* Establishment & Contractor Meta Box matching Image 1 */}
        <div className={styles.establishmentBox}>
          {/* Left Column */}
          <div className={styles.boxColLeft}>
            <div className={styles.metaRow}>
              <div className={styles.metaLabel}>Name and Address of Contractor</div>
              <div className={styles.metaColon}>:</div>
              <div className={styles.metaValue}>
                <strong>{contractorName}</strong>
                <br />
                {contractorAddress}
              </div>
            </div>
            <div className={styles.metaRow}>
              <div className={styles.metaLabel}>Nature and location of work</div>
              <div className={styles.metaColon}>:</div>
              <div className={styles.metaValue}>{workLocation}</div>
            </div>
            <div className={styles.metaRow}>
              <div className={styles.metaLabel}>Wages Period</div>
              <div className={styles.metaColon}>:</div>
              <div className={styles.metaValue}>
                <strong>{wagesPeriod}</strong>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.boxColRight}>
            <div className={styles.metaRow}>
              <div className={styles.metaLabel}>
                Name and Address of establishment in/ under which contract is carrier on
              </div>
              <div className={styles.metaColon}>:</div>
              <div className={styles.metaValue}>{establishmentFull}</div>
            </div>
            <div className={styles.metaRow}>
              <div className={styles.metaLabel}>Name &amp; Address of Principal Employer</div>
              <div className={styles.metaColon}>:</div>
              <div className={styles.metaValue}>{principalEmployer}</div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertTriangle size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Wage Records Found</h4>
            <p className={styles.emptyText}>
              There are no payroll records for the selected month and establishment filters. Process monthly payroll or select a different period.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.wagesTable}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>Sr. No.</th>
                  <th style={{ minWidth: 160 }}>
                    Name of workman
                    <br />
                    Father's/ Husband's Name
                    <br />
                    PF No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; D.O.J
                    <br />
                    ESI No / UAN
                  </th>
                  <th style={{ minWidth: 60 }}>
                    S.No. in
                    <br />
                    the
                    <br />
                    register
                    <br />
                    of
                    <br />
                    wrokman
                  </th>
                  <th style={{ minWidth: 80 }}>Designation</th>
                  <th style={{ minWidth: 50 }}>
                    No. of
                    <br />
                    days/
                    <br />
                    Unit of
                    <br />
                    work
                    <br />
                    done
                  </th>
                  <th style={{ minWidth: 35 }}>O.T</th>
                  <th style={{ minWidth: 65 }}>
                    Daily rate
                    <br />
                    of wages/
                    <br />
                    Piece rate
                  </th>
                  <th style={{ minWidth: 260 }}>
                    Amt. of wages earned
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', fontSize: '9px', borderTop: '1px solid #000', marginTop: '3px', paddingTop: '3px' }}>
                      <div>Basic / HRA / O.T.</div>
                      <div>Conv / V.D.A. / Spl / Leave</div>
                      <div>Extra / Other / Total</div>
                    </div>
                  </th>
                  <th style={{ minWidth: 70 }}>
                    P.F.
                    <br />
                    ESIC
                  </th>
                  <th style={{ minWidth: 90 }}>
                    Other Ded.
                    <br />
                    Advance
                    <br />
                    Total Deduction
                  </th>
                  <th style={{ minWidth: 75 }}>
                    Net
                    <br />
                    Amount
                    <br />
                    paid
                  </th>
                  <th style={{ minWidth: 90 }}>
                    Signature/Thumb
                    <br />
                    Impression of
                    <br />
                    Employee
                  </th>
                  <th style={{ minWidth: 110 }}>
                    Initial of
                    <br />
                    contractor
                    <br />
                    or his
                    <br />
                    Rep.
                  </th>
                </tr>
              </thead>

              <tbody>
                {records.map((r, index) => {
                  const ern = r.earnings || {};
                  const ded = r.deductions || {};

                  return (
                    <tr key={r.employeeId || `wage-row-${index}`} className={styles.dataRow}>
                      {/* 1. Sr No */}
                      <td className={styles.textCenter}>{r.srNo || index + 1}</td>

                      {/* 2. Workman Meta */}
                      <td>
                        <div className={styles.workmanCell}>
                          <span className={styles.workmanName}>{r.name}</span>
                          <span className={styles.fatherName}>{r.fatherHusbandName}</span>
                          <div className={styles.pfDojRow}>
                            <span>{r.pfNo}</span>
                            <span>{r.doj ? `DOJ: ${r.doj}` : ''}</span>
                          </div>
                          <div className={styles.uanEsiRow}>
                            <span>{r.uan}</span>
                            <br />
                            <span>{r.esiNo}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. S.No in register */}
                      <td className={styles.textCenter} style={{ fontWeight: 600 }}>
                        {r.sNoInRegisterOfWorkman}
                      </td>

                      {/* 4. Designation */}
                      <td>{r.designation}</td>

                      {/* 5. Days worked */}
                      <td className={styles.textCenter}>{Number(r.daysWorked || 0).toFixed(1)}</td>

                      {/* 6. OT */}
                      <td className={styles.textCenter}>{r.otHours || ''}</td>

                      {/* 7. Daily rate */}
                      <td className={styles.textRight}>{Number(r.dailyRate || 0).toFixed(2)}</td>

                      {/* 8. Earnings 3-Col Micro Grid matching Image 1 */}
                      <td>
                        <div className={styles.earningsGrid}>
                          {/* Col 1 */}
                          <div className={styles.earnCol}>
                            <div className={styles.earnItem}>
                              <span className={styles.earnLabel}>Basic:</span>
                              <span className={styles.earnVal}>{Number(ern.basic || 0).toFixed(2)}</span>
                            </div>
                            <div className={styles.earnItem}>
                              <span className={styles.earnLabel}>HRA:</span>
                              <span className={styles.earnVal}>{Number(ern.hra || 0)}</span>
                            </div>
                            {Number(ern.otAmount || 0) > 0 && (
                              <div className={styles.earnItem}>
                                <span className={styles.earnLabel}>O.T.:</span>
                                <span className={styles.earnVal}>{Number(ern.otAmount).toFixed(2)}</span>
                              </div>
                            )}
                          </div>

                          {/* Col 2 */}
                          <div className={styles.earnCol}>
                            <div className={styles.earnItem}>
                              <span className={styles.earnLabel}>Conv:</span>
                              <span className={styles.earnVal}>{Number(ern.conveyance || 0)}</span>
                            </div>
                            <div className={styles.earnItem}>
                              <span className={styles.earnLabel}>V.D.A.:</span>
                              <span className={styles.earnVal}>{Number(ern.vda || 0)}</span>
                            </div>
                            {Number(ern.splAllo || 0) > 0 && (
                              <div className={styles.earnItem}>
                                <span className={styles.earnLabel}>Spl:</span>
                                <span className={styles.earnVal}>{Number(ern.splAllo)}</span>
                              </div>
                            )}
                            {Number(ern.leavePa || 0) > 0 && (
                              <div className={styles.earnItem}>
                                <span className={styles.earnLabel}>Leave:</span>
                                <span className={styles.earnVal}>{Number(ern.leavePa)}</span>
                              </div>
                            )}
                          </div>

                          {/* Col 3 */}
                          <div className={styles.earnCol}>
                            <div className={styles.earnItem}>
                              <span className={styles.earnLabel}>Extra:</span>
                              <span className={styles.earnVal}>{Number(ern.extraTime || 0)}</span>
                            </div>
                            <div className={styles.earnItem}>
                              <span className={styles.earnLabel}>Other:</span>
                              <span className={styles.earnVal}>{Number(ern.otherAll || 0)}</span>
                            </div>
                          </div>

                          {/* Total Row */}
                          <div className={styles.earnTotalRow}>
                            <span>Total Gross:</span>
                            <span>{Number(ern.totalEarned || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </td>

                      {/* 9. PF / ESIC */}
                      <td>
                        <div className={styles.deductionStack}>
                          <div className={styles.dedItem}>
                            <span className={styles.dedLabel}>PF:</span>
                            <span className={styles.dedVal}>{Number(ded.pf || 0)}</span>
                          </div>
                          <div className={styles.dedItem}>
                            <span className={styles.dedLabel}>ESIC:</span>
                            <span className={styles.dedVal}>{Number(ded.esic || 0)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 10. Other Ded / Advance / Total */}
                      <td>
                        <div className={styles.deductionStack}>
                          <div className={styles.dedItem}>
                            <span className={styles.dedLabel}>Other:</span>
                            <span className={styles.dedVal}>{Number(ded.otherDed || 0)}</span>
                          </div>
                          <div className={styles.dedItem}>
                            <span className={styles.dedLabel}>Adv:</span>
                            <span className={styles.dedVal}>{Number(ded.advance || 0)}</span>
                          </div>
                          <div className={styles.dedTotalRow}>
                            <span>Tot Ded:</span>
                            <span>{Number(ded.totalDeduction || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 11. Net Paid */}
                      <td className={styles.netAmountCell}>
                        {Number(r.netPaid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 12. Signature */}
                      <td></td>

                      {/* 13. Bank A/c / Initial of contractor */}
                      <td className={styles.bankAccountCell}>
                        {r.bankAccount}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Row matching Image 3 */}
                <tr className={styles.grandTotalRow}>
                  <td colSpan={4}>
                    <div className={styles.grandTotalLeftBox}>
                      <span style={{ fontSize: '12px', fontWeight: 900 }}>{contractorName}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800 }}>REGISTER OF WAGES</span>
                      <span>Grand Total {wagesPeriod}</span>
                      <div style={{ marginTop: '4px', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                        <div>Gross Wag. of PF Work: {totals?.grandGrossEarned ? Number(totals.grandBasic + totals.grandVda).toLocaleString('en-IN') : '0'}</div>
                        <div>Tot. wages of PF exempt Wor: 0</div>
                        <div>Tot. No. of PF exempt Worker: 0</div>
                        <div><strong>Total No. of Empl.: {records.length}</strong></div>
                      </div>
                    </div>
                  </td>

                  {/* Total Days */}
                  <td className={styles.textCenter} style={{ verticalAlign: 'middle', fontSize: '12px' }}>
                    {Number(totals?.grandDaysWorked ?? 0).toFixed(1)}
                  </td>

                  {/* Total OT */}
                  <td className={styles.textCenter} style={{ verticalAlign: 'middle', fontSize: '12px' }}>
                    {totals?.grandOtHours ? Number(totals.grandOtHours).toFixed(1) : '***.**'}
                  </td>

                  {/* Daily Rate Blank */}
                  <td></td>

                  {/* Total Wages Breakdown */}
                  <td>
                    <div className={styles.earningsGrid}>
                      <div className={styles.earnCol}>
                        <div className={styles.earnItem}>
                          <span className={styles.earnLabel}>Basic:</span>
                          <span className={styles.earnVal}>{Number(totals?.grandBasic || 0).toFixed(2)}</span>
                        </div>
                        {Number(totals?.grandOtAmount || 0) > 0 && (
                          <div className={styles.earnItem}>
                            <span className={styles.earnLabel}>OT:</span>
                            <span className={styles.earnVal}>{Number(totals.grandOtAmount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.earnCol}>
                        <div className={styles.earnItem}>
                          <span className={styles.earnLabel}>V.D.A:</span>
                          <span className={styles.earnVal}>{Number(totals?.grandVda || 0)}</span>
                        </div>
                        {Number(totals?.grandSplAllo || 0) > 0 && (
                          <div className={styles.earnItem}>
                            <span className={styles.earnLabel}>Spl:</span>
                            <span className={styles.earnVal}>{Number(totals.grandSplAllo)}</span>
                          </div>
                        )}
                        {Number(totals?.grandLeavePa || 0) > 0 && (
                          <div className={styles.earnItem}>
                            <span className={styles.earnLabel}>Leave:</span>
                            <span className={styles.earnVal}>{Number(totals.grandLeavePa)}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.earnTotalRow}>
                        <span>Total Gross:</span>
                        <span>₹{Number(totals?.grandGrossEarned || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </td>

                  {/* Total PF & ESIC */}
                  <td>
                    <div className={styles.deductionStack}>
                      <div className={styles.dedItem}>
                        <span className={styles.earnLabel}>PF:</span>
                        <span className={styles.earnVal}>{Number(totals?.grandPf || 0)}</span>
                      </div>
                      <div className={styles.dedItem}>
                        <span className={styles.earnLabel}>ESIC:</span>
                        <span className={styles.earnVal}>{Number(totals?.grandEsic || 0)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Total Other / Advance / Total Ded */}
                  <td>
                    <div className={styles.deductionStack}>
                      <div className={styles.dedItem}>
                        <span className={styles.earnLabel}>Other:</span>
                        <span className={styles.earnVal}>{Number(totals?.grandOtherDed || 0).toFixed(2)}</span>
                      </div>
                      <div className={styles.dedTotalRow}>
                        <span>Tot Ded:</span>
                        <span>₹{Number(totals?.grandTotalDeduction || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </td>

                  {/* Total Net Paid */}
                  <td className={styles.netAmountCell} style={{ fontSize: '13px', verticalAlign: 'middle' }}>
                    ₹{Number(totals?.grandNetPaid || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Signature */}
                  <td></td>

                  {/* Bank Account */}
                  <td style={{ verticalAlign: 'middle', fontSize: '9.5px', color: '#475569' }}>
                    Bank Transfer Statement
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Statutory Summary Reconciliation Section (from Image 3) */}
        {records.length > 0 && (
          <div className={styles.reconciliationSection}>
            {/* Summary ESI */}
            <div className={styles.reconcileBox}>
              <div className={styles.reconcileTitle}>Summary ESI :-</div>
              <table className={styles.reconcileTable}>
                <tbody>
                  <tr>
                    <td><strong>No. of Employee:</strong></td>
                    <td className={styles.textRight}>{esiSummary?.noOfEmployees || records.length}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Wages:</strong></td>
                    <td className={styles.textRight}>₹{Number(esiSummary?.totalWages || totals?.grandGrossEarned || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>Employer Contri (3.25%):</strong></td>
                    <td className={styles.textRight}>₹{Number(esiSummary?.employerContribution || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>Employee Contri (0.75%):</strong></td>
                    <td className={styles.textRight}>₹{Number(esiSummary?.employeeContribution || totals?.grandEsic || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontWeight: 800, background: '#f8fafc' }}>
                    <td><strong>Total Contribution:</strong></td>
                    <td className={styles.textRight}>₹{Number(esiSummary?.totalContribution || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary PF */}
            <div className={styles.reconcileBox}>
              <div className={styles.reconcileTitle}>Summary P.F :-</div>
              <table className={styles.reconcileTable}>
                <thead>
                  <tr>
                    <th>Particulars</th>
                    <th>A/c No. 1</th>
                    <th>A/c No. 10</th>
                    <th>A/c No. 21</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Total No. of Subscr.:</strong></td>
                    <td className={styles.textCenter}>{pfSummary?.subscribersCount || records.length}</td>
                    <td className={styles.textCenter}>{pfSummary?.subscribersCount || records.length}</td>
                    <td className={styles.textCenter}>{pfSummary?.subscribersCount || records.length}</td>
                    <td className={styles.textCenter}>{pfSummary?.subscribersCount || records.length}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Wages:</strong></td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.totalWages || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.totalWages || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.totalWages || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.totalWages || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>Employee's share A/c 1 (12%):</strong></td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.employeeShareAc1 || totals?.grandPf || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textCenter}>—</td>
                    <td className={styles.textCenter}>—</td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.employeeShareAc1 || totals?.grandPf || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>Employer's share (3.67% / 8.33%):</strong></td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.employerShareAc1 || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.employerShareAc10 || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textCenter}>—</td>
                    <td className={styles.textRight}>₹{Number((pfSummary?.employerShareAc1 || 0) + (pfSummary?.employerShareAc10 || 0)).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>EDLI (0.5%) &amp; Admin Ch. A/c 2 (0.5%):</strong></td>
                    <td className={styles.textCenter}>—</td>
                    <td className={styles.textCenter}>—</td>
                    <td className={styles.textRight}>₹{Number(pfSummary?.ac21Edli || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>₹{Number((pfSummary?.ac21Edli || 0) + (pfSummary?.ac2AdminCharges || 0)).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className={styles.pfTotalPaymentRow}>
                    <td><strong>Total payment of PF:</strong></td>
                    <td colSpan={4} className={styles.textRight}>
                      ₹{Number(pfSummary?.totalPaymentPf || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
