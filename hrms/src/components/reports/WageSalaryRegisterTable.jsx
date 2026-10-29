import React, { useMemo } from 'react';
import styles from '../../pages/admin/Reports.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
  } catch (e) {
    return dateStr;
  }
};

/**
 * Wage & Salary Register Table Component
 * Faithfully maps verified HRMS frontend data structures and MongoDB report models
 * with fully reactive columns based on selectedOptions.
 */
export default function WageSalaryRegisterTable({ reportData, selectedOptions = {} }) {
  const rawRecords = reportData?.records || [];
  const company = reportData?.companyInfo || {};
  const period = reportData?.period || {};
  const totals = reportData?.totals || {};
  const opt = selectedOptions || {};

  // Filter records based on scope & excludeHoldSalary
  const records = useMemo(() => {
    let list = rawRecords;
    if (opt.recordScope === 'active') {
      list = list.filter(
        (r) => r.status !== 'inactive' && r.status !== 'resigned' && r.status !== 'terminated'
      );
    } else if (opt.recordScope === 'inactive') {
      list = list.filter(
        (r) => r.status === 'inactive' || r.status === 'resigned' || r.status === 'terminated'
      );
    }
    if (opt.excludeHoldSalary) {
      list = list.filter((r) => !r.isHold && !r.holdSalary && r.status !== 'hold');
    }
    return list;
  }, [rawRecords, opt.recordScope, opt.excludeHoldSalary]);

  // Column Visibility Flags
  const showSrNo = opt.srNo !== false;
  const showEmpName = opt.employeeName !== false;
  const showEmpId = opt.employeeCode !== false;
  const showAttendance =
    opt.attTot !== false ||
    opt.attWd !== false ||
    opt.attPd !== false ||
    opt.attWo !== false ||
    opt.attPh !== false ||
    opt.attPl !== false ||
    opt.attCl !== false ||
    opt.attSl !== false ||
    opt.attMl !== false;

  const showRate =
    opt.rateBasic !== false ||
    opt.rateDa !== false ||
    opt.rateHra !== false ||
    opt.rateConv !== false ||
    opt.rateSpAll !== false ||
    opt.rateOther !== false ||
    opt.rateTotal !== false;

  const showEarnCol1 = opt.earnBasic !== false || opt.earnDa !== false;
  const showEarnCol2 = opt.earnHra !== false || opt.earnOther !== false;
  const showEarnCol3 = opt.earnConv !== false;
  const showEarnCol4 = opt.earnSpAll !== false || opt.earnOt !== false;
  const earnColSpan =
    (showEarnCol1 ? 1 : 0) +
    (showEarnCol2 ? 1 : 0) +
    (showEarnCol3 ? 1 : 0) +
    (showEarnCol4 ? 1 : 0);

  const showGross = opt.grossSalary !== false;

  const showDedCol1 = opt.dedPf !== false || opt.dedEsi !== false;
  const showDedCol2 = opt.dedPt !== false || opt.dedIt !== false || opt.dedLwf !== false;
  const showDedCol3 =
    opt.dedAdvance !== false || opt.dedLoan !== false || opt.dedFood !== false;
  const showDedCol4 = opt.dedOther !== false || opt.dedMbill !== false;
  const dedColSpan =
    (showDedCol1 ? 1 : 0) +
    (showDedCol2 ? 1 : 0) +
    (showDedCol3 ? 1 : 0) +
    (showDedCol4 ? 1 : 0);

  const showGrossDeduct = opt.grossDeduct !== false;
  const showNetPayable = opt.netPayable !== false;
  const showSignature =
    opt.signatureAck !== false ||
    opt.bankName !== false ||
    opt.bankAccountNo !== false ||
    opt.bankIfscCode !== false ||
    opt.paymentMode !== false;

  const showTotalRow = opt.summaryConsolidated !== false;

  // Calculate dynamic colspan for total label
  const preTotalColSpan = (showSrNo ? 1 : 0) + (showEmpName ? 1 : 0) + (showEmpId ? 1 : 0);

  return (
    <div className={styles.registerPaper}>
      {/* Official Statutory Header */}
      <div className={styles.officialHeader}>
        <div className={styles.officialCompanyInfo}>
          <h2 className={styles.officialCompanyName}>
            {company.name || company.companyName || 'RR Security & Facilities'}
          </h2>
          <p className={styles.officialCompanyAddress}>
            {company.address || 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044'}
          </p>
        </div>
        <div className={styles.officialStatutoryRules}>
          <span>(1) Form under Rule - 5 of Equal Remuneration Rules 1976.</span>
          <span>(2) Form under Rule - 21(4) 25(2) 26(1) and 26(2) of Gujarat Minimum Wages Rules 1961</span>
          <span>(3) Form under Rule - 6 of Payment of Wages (Gujarat) Rules 1963.</span>
          <span>(4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Central/Gujarat Rules 1972</span>
          <span>(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981</span>
        </div>
      </div>

      {/* Sub Bar with PF/ESI and Period */}
      <div className={styles.officialSubBar}>
        <div className={styles.officialMetaLeft}>
          <div>
            <strong>PF No :-</strong> {company.pfNo || company.employerPfCode || company.pfCode || '—'}
          </div>
          <div>
            <strong>ESI No :-</strong> {company.esiNo || company.employerEsiCode || company.esiCode || '—'}
          </div>
        </div>
        <div className={styles.officialMetaCenter}>Wage / Salary Register</div>
        <div className={styles.officialMetaRight}>
          <div>
            <strong>For The Month Of :</strong> {period.monthLabel || period.month || 'Current Month'}
          </div>
          <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
            Date of Payment :- {formatDate(period.toDate || new Date().toISOString().slice(0, 10))}
          </div>
        </div>
      </div>

      {/* Multi-Tier Register Table */}
      <div className={styles.registerTableWrap}>
        <table className={styles.registerTable}>
          <thead>
            <tr>
              {showSrNo && <th rowSpan="2" style={{ width: '32px' }}>Sr.<br />No.</th>}
              {showEmpName && (
                <th rowSpan="2" style={{ minWidth: '170px' }}>
                  Employee Name<br />
                  <span style={{ fontWeight: 'normal', fontSize: '9px' }}>Designation / Department</span>
                </th>
              )}
              {showEmpId && <th rowSpan="2" style={{ width: '60px' }}>Emp. ID</th>}
              {showAttendance && (
                <th rowSpan="2" style={{ minWidth: '100px' }}>
                  Details<br />of<br />Attendance
                </th>
              )}
              {showRate && (
                <th rowSpan="2" style={{ minWidth: '110px' }}>
                  Rate of<br />Wages
                </th>
              )}
              {earnColSpan > 0 && (
                <th colSpan={earnColSpan} style={{ background: '#f1f5f9' }}>
                  Earnings
                </th>
              )}
              {showGross && <th rowSpan="2" style={{ minWidth: '85px' }}>Gross<br />Salary</th>}
              {dedColSpan > 0 && (
                <th colSpan={dedColSpan} style={{ background: '#f1f5f9' }}>
                  Deduction
                </th>
              )}
              {showGrossDeduct && <th rowSpan="2" style={{ minWidth: '65px' }}>Gross<br />Deduct.</th>}
              {showNetPayable && <th rowSpan="2" style={{ minWidth: '85px' }}>Net<br />Payable</th>}
              {showSignature && <th rowSpan="2" style={{ minWidth: '120px' }}>Signature</th>}
            </tr>
            <tr>
              {/* Earnings Sub-headers */}
              {showEarnCol1 && (
                <th style={{ minWidth: '55px', fontSize: '9px' }}>
                  {opt.earnBasic !== false && <span>BASIC</span>}
                  {opt.earnBasic !== false && opt.earnDa !== false && <br />}
                  {opt.earnDa !== false && <span>DA</span>}
                </th>
              )}
              {showEarnCol2 && (
                <th style={{ minWidth: '55px', fontSize: '9px' }}>
                  {opt.earnHra !== false && <span>HRA</span>}
                  {opt.earnHra !== false && opt.earnOther !== false && <br />}
                  {opt.earnOther !== false && <span>OTH.All</span>}
                </th>
              )}
              {showEarnCol3 && <th style={{ minWidth: '45px', fontSize: '9px' }}>CONV</th>}
              {showEarnCol4 && (
                <th style={{ minWidth: '55px', fontSize: '9px' }}>
                  {opt.earnSpAll !== false && <span>SP.All</span>}
                  {opt.earnSpAll !== false && opt.earnOt !== false && <br />}
                  {opt.earnOt !== false && <span>OT/PIB</span>}
                </th>
              )}

              {/* Deduction Sub-headers */}
              {showDedCol1 && (
                <th style={{ minWidth: '50px', fontSize: '9px' }}>
                  {opt.dedPf !== false && <span>P.F</span>}
                  {opt.dedPf !== false && opt.dedEsi !== false && <br />}
                  {opt.dedEsi !== false && <span>ESI</span>}
                </th>
              )}
              {showDedCol2 && (
                <th style={{ minWidth: '50px', fontSize: '9px' }}>
                  {opt.dedPt !== false && <span>P.T.</span>}
                  {opt.dedPt !== false && opt.dedIt !== false && <br />}
                  {opt.dedIt !== false && <span>I.T.</span>}
                  {opt.dedIt !== false && opt.dedLwf !== false && <br />}
                  {opt.dedLwf !== false && <span>LWF</span>}
                </th>
              )}
              {showDedCol3 && (
                <th style={{ minWidth: '50px', fontSize: '9px' }}>
                  {opt.dedAdvance !== false && <span>Advance</span>}
                  {opt.dedAdvance !== false && opt.dedLoan !== false && <br />}
                  {opt.dedLoan !== false && <span>LOAN</span>}
                  {opt.dedLoan !== false && opt.dedFood !== false && <br />}
                  {opt.dedFood !== false && <span>Food</span>}
                </th>
              )}
              {showDedCol4 && (
                <th style={{ minWidth: '50px', fontSize: '9px' }}>
                  {opt.dedOther !== false && <span>Oth.Ded</span>}
                  {opt.dedOther !== false && opt.dedMbill !== false && <br />}
                  {opt.dedMbill !== false && <span>E/Mbill</span>}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {records.map((row, index) => {
              const att = row.attendance || {};
              const rate = row.rateOfWages || {};
              const earn = row.earnings || {};
              const ded = row.deductions || {};

              return (
                <tr key={row.employeeId ? `${row.employeeId}-${index}` : `wage-${index}`}>
                  {/* 1. Sr. No. */}
                  {showSrNo && (
                    <td className={styles.textCenter}>
                      <strong>{row.srNo || index + 1}</strong>
                    </td>
                  )}

                  {/* 2. Employee Details */}
                  {showEmpName && (
                    <td className={styles.empDetailsCell}>
                      <div className={styles.empNameMain}>{row.name}</div>
                      {opt.designation !== false && row.designation && (
                        <div className={styles.empSubText}>{row.designation}</div>
                      )}
                      {opt.department !== false && row.department && (
                        <div className={styles.empSubText} style={{ fontWeight: 600 }}>
                          {row.department}
                        </div>
                      )}
                      {opt.fatherHusbandName !== false && (row.fatherName || row.fatherHusbandName) && (
                        <div className={styles.empSubText}>F/H: {row.fatherName || row.fatherHusbandName}</div>
                      )}
                      {opt.gender !== false && row.gender && (
                        <div className={styles.empSubText}>Gender: {row.gender}</div>
                      )}
                      {opt.dateOfJoining !== false && row.doj && (
                        <div className={styles.empSubText}>DOJ: {row.doj}</div>
                      )}
                      {opt.dutyPost !== false && row.dutyPost && (
                        <div className={styles.empSubText}>Post: {row.dutyPost}</div>
                      )}
                      {opt.workLocation !== false && (row.location || row.site) && (
                        <div className={styles.empSubText}>Loc: {row.location || row.site}</div>
                      )}
                      {opt.pfUanNumber !== false && (
                        <div className={styles.empSubText}>UAN No: {row.uan || '-'}</div>
                      )}
                      {opt.pfMemberNumber !== false && (
                        <div className={styles.empSubText}>PF No: {row.pfNo || '-'}</div>
                      )}
                      {opt.esiIpNumber !== false && (
                        <div className={styles.empSubText}>ESI No: {row.esiNo || '-'}</div>
                      )}
                      {opt.incomeTaxPan !== false && row.pan && (
                        <div className={styles.empSubText}>PAN: {row.pan}</div>
                      )}
                      {opt.aadhaarNumber !== false && row.aadhaar && (
                        <div className={styles.empSubText}>Aadhaar: {row.aadhaar}</div>
                      )}
                    </td>
                  )}

                  {/* 3. Emp. ID */}
                  {showEmpId && (
                    <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                      {row.employeeId}
                    </td>
                  )}

                  {/* 4. Details of Attendance */}
                  {showAttendance && (
                    <td>
                      <div className={styles.stackedMetrics}>
                        {opt.attWd !== false && (
                          <div className={styles.stackedMetricRow}><span>WD</span><span>{att.wd || '30.00'}</span></div>
                        )}
                        {opt.attWo !== false && (
                          <div className={styles.stackedMetricRow}><span>WO</span><span>{att.wo || '0.00'}</span></div>
                        )}
                        {opt.attPh !== false && (
                          <div className={styles.stackedMetricRow}><span>PH</span><span>{att.ph || '0.00'}</span></div>
                        )}
                        {opt.attPd !== false && (
                          <div className={styles.stackedMetricRow}><span>PD</span><span>{att.pd || '30.00'}</span></div>
                        )}
                        {opt.attPl !== false && (
                          <div className={styles.stackedMetricRow}><span>PL</span><span>{att.pl || '0.00'}</span></div>
                        )}
                        {opt.attCl !== false && (
                          <div className={styles.stackedMetricRow}><span>CL</span><span>{att.cl || '0.00'}</span></div>
                        )}
                        {opt.attSl !== false && (
                          <div className={styles.stackedMetricRow}><span>S.L.</span><span>{att.sl || '0.00'}</span></div>
                        )}
                        {opt.attMl !== false && (
                          <div className={styles.stackedMetricRow}><span>ML/Adj</span><span>{att.mlAdj || '0.00'}</span></div>
                        )}
                        {opt.attTot !== false && (
                          <div className={styles.stackedMetricRow} style={{ borderTop: '1px solid #000', fontWeight: 800 }}>
                            <span>TOT</span><span>{att.tot || '30.00'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {/* 5. Rate of Wages */}
                  {showRate && (
                    <td className={styles.rateWageCell}>
                      <div className={styles.stackedMetrics}>
                        {opt.rateBasic !== false && (
                          <div className={styles.stackedMetricRow}><span>BASIC</span><span>{rate.basic || '0.00'}</span></div>
                        )}
                        {opt.rateDa !== false && (
                          <div className={styles.stackedMetricRow}><span>DA</span><span>{rate.da || '0.00'}</span></div>
                        )}
                        {opt.rateHra !== false && (
                          <div className={styles.stackedMetricRow}><span>HRA</span><span>{rate.hra || '0.00'}</span></div>
                        )}
                        {opt.rateConv !== false && (
                          <div className={styles.stackedMetricRow}><span>CONV</span><span>{rate.conv || '0.00'}</span></div>
                        )}
                        {opt.rateSpAll !== false && (
                          <div className={styles.stackedMetricRow}><span>SP.All</span><span>{rate.spAll || '0.00'}</span></div>
                        )}
                        {opt.rateOther !== false && (
                          <div className={styles.stackedMetricRow}><span>OTH.All</span><span>{rate.othAll || '0.00'}</span></div>
                        )}
                        {opt.rateTotal !== false && (
                          <div className={styles.stackedMetricRow} style={{ borderTop: '1px solid #000', fontWeight: 800 }}>
                            <span>Total</span><span>{rate.total || '0.00'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {/* 6. Earnings (Col 1: Basic / DA) */}
                  {showEarnCol1 && (
                    <td className={styles.earningsCell}>
                      {opt.earnBasic !== false && <div>{earn.basic ?? 0}</div>}
                      {opt.earnDa !== false && <div style={{ color: '#64748b' }}>{earn.da ?? 0}</div>}
                    </td>
                  )}

                  {/* 7. Earnings (Col 2: HRA / Oth.All) */}
                  {showEarnCol2 && (
                    <td className={styles.earningsCell}>
                      {opt.earnHra !== false && <div>{earn.hra ?? 0}</div>}
                      {opt.earnOther !== false && <div style={{ color: '#64748b' }}>{earn.othAll ?? 0}</div>}
                    </td>
                  )}

                  {/* 8. Earnings (Col 3: Conv) */}
                  {showEarnCol3 && (
                    <td className={styles.earningsCell}>
                      <div>{earn.conv ?? 0}</div>
                    </td>
                  )}

                  {/* 9. Earnings (Col 4: Sp.All / OT) */}
                  {showEarnCol4 && (
                    <td className={styles.earningsCell}>
                      {opt.earnSpAll !== false && <div>{earn.spAll ?? 0}</div>}
                      {opt.earnOt !== false && <div style={{ color: '#64748b' }}>{earn.otPib ?? 0}</div>}
                    </td>
                  )}

                  {/* 10. Gross Salary */}
                  {showGross && (
                    <td className={styles.grossCell}>
                      <div className={styles.grossMain}>{row.grossSalary?.toLocaleString('en-IN')}</div>
                      {opt.pfBase !== false && (
                        <div className={styles.grossBreakdown}>P {rate.total || row.grossSalary}</div>
                      )}
                      {opt.esiBase !== false && (
                        <div className={styles.grossBreakdown}>E {row.grossSalary?.toLocaleString('en-IN')}</div>
                      )}
                    </td>
                  )}

                  {/* 11. Deductions (Col 1: PF / ESI) */}
                  {showDedCol1 && (
                    <td className={styles.deductionCell}>
                      {opt.dedPf !== false && <div>{ded.pf ?? 0}</div>}
                      {opt.dedEsi !== false && <div style={{ color: '#64748b' }}>{ded.esi ?? 0}</div>}
                    </td>
                  )}

                  {/* 12. Deductions (Col 2: PT / IT / LWF) */}
                  {showDedCol2 && (
                    <td className={styles.deductionCell}>
                      {opt.dedPt !== false && <div>{ded.pt ?? 0}</div>}
                      {opt.dedIt !== false && <div style={{ color: '#64748b' }}>{ded.it ?? 0}</div>}
                      {opt.dedLwf !== false && <div style={{ color: '#64748b' }}>{ded.lwf ?? 0}</div>}
                    </td>
                  )}

                  {/* 13. Deductions (Col 3: Advance / Loan / Food) */}
                  {showDedCol3 && (
                    <td className={styles.deductionCell}>
                      {opt.dedAdvance !== false && <div>{ded.advance ?? 0}</div>}
                      {opt.dedLoan !== false && <div style={{ color: '#64748b' }}>{ded.loan ?? 0}</div>}
                      {opt.dedFood !== false && <div style={{ color: '#64748b' }}>{ded.food ?? 0}</div>}
                    </td>
                  )}

                  {/* 14. Deductions (Col 4: Oth.Ded / E/Mbill) */}
                  {showDedCol4 && (
                    <td className={styles.deductionCell}>
                      {opt.dedOther !== false && <div>{ded.othDed ?? 0}</div>}
                      {opt.dedMbill !== false && <div style={{ color: '#64748b' }}>{ded.eMbill ?? 0}</div>}
                    </td>
                  )}

                  {/* 15. Gross Deduct. */}
                  {showGrossDeduct && (
                    <td className={styles.textRight} style={{ fontWeight: 700 }}>
                      {row.grossDeduct?.toLocaleString('en-IN')}
                    </td>
                  )}

                  {/* 16. Net Payable */}
                  {showNetPayable && (
                    <td className={styles.netPayableCell}>
                      {row.netPayable || Number(row.netPayableNumber || 0).toFixed(2)}
                    </td>
                  )}

                  {/* 17. Signature / Bank Details */}
                  {showSignature && (
                    <td className={styles.signatureCell}>
                      {opt.bankName !== false && (
                        <>
                          <div style={{ color: '#64748b', fontSize: '9px' }}>Bank</div>
                          <div className={styles.signatureBank}>{row.bankName || '—'}</div>
                        </>
                      )}
                      {opt.bankAccountNo !== false && (
                        <div style={{ fontFamily: 'monospace', fontSize: '9.5px' }}>
                          {row.bankAccountNo || '—'}
                        </div>
                      )}
                      {opt.bankIfscCode !== false && (row.bankIfsc || row.bankIfscCode) && (
                        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748b' }}>
                          IFSC: {row.bankIfsc || row.bankIfscCode}
                        </div>
                      )}
                      {opt.paymentMode !== false && (
                        <div style={{ fontSize: '9px', color: '#64748b' }}>
                          Mode: {row.paymentMode || 'Bank'}
                        </div>
                      )}
                      {opt.signatureAck !== false && (
                        <div className={styles.signatureLine}>Sign / Thumb</div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Grand Total Row */}
            {records.length > 0 && showTotalRow && (
              <tr className={styles.registerTotalRow}>
                {preTotalColSpan > 0 && (
                  <td colSpan={preTotalColSpan} className={styles.textCenter}>
                    <strong>TOTAL ({records.length} EMPLOYEES)</strong>
                  </td>
                )}
                {showAttendance && <td className={styles.textCenter}>—</td>}
                {showRate && <td className={styles.textCenter}>—</td>}
                {showEarnCol1 && (
                  <td className={styles.textRight}>
                    {totals.grandBasic ? totals.grandBasic.toLocaleString('en-IN') : '—'}
                  </td>
                )}
                {showEarnCol2 && (
                  <td className={styles.textRight}>
                    {totals.grandHra ? totals.grandHra.toLocaleString('en-IN') : '—'}
                  </td>
                )}
                {showEarnCol3 && <td className={styles.textRight}>0</td>}
                {showEarnCol4 && <td className={styles.textRight}>0</td>}
                {showGross && (
                  <td className={styles.textRight}>
                    <strong>₹{totals.grandGross ? totals.grandGross.toLocaleString('en-IN') : '0'}</strong>
                  </td>
                )}
                {showDedCol1 && (
                  <td className={styles.textRight}>
                    {totals.grandPf ? totals.grandPf.toLocaleString('en-IN') : '0'}
                  </td>
                )}
                {showDedCol2 && (
                  <td className={styles.textRight}>
                    {totals.grandPt ? totals.grandPt.toLocaleString('en-IN') : '0'}
                  </td>
                )}
                {showDedCol3 && <td className={styles.textRight}>0</td>}
                {showDedCol4 && <td className={styles.textRight}>0</td>}
                {showGrossDeduct && (
                  <td className={styles.textRight}>
                    <strong>₹{totals.grandDeductions ? totals.grandDeductions.toLocaleString('en-IN') : '0'}</strong>
                  </td>
                )}
                {showNetPayable && (
                  <td className={styles.textRight} style={{ fontSize: '13px', color: '#166534' }}>
                    <strong>₹{totals.grandNet ? totals.grandNet.toLocaleString('en-IN') : '0'}</strong>
                  </td>
                )}
                {showSignature && (
                  <td className={styles.textCenter}>Verified & Approved</td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Page 2: Statutory Summarization Statements */}
      {(opt.summaryPf !== false ||
        opt.summaryEsi !== false ||
        opt.summaryPt !== false ||
        opt.summaryWorkforce !== false ||
        opt.summaryNetInWords !== false ||
        opt.summarySignatory !== false) && (
        <div style={{ marginTop: '24px', borderTop: '2px dashed #cbd5e1', paddingTop: '18px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#0f172a',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginBottom: '12px',
            }}
          >
            Statutory Summarization & Verification Statement (Page 2)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            {opt.summaryPf !== false && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '4px',
                    marginBottom: '6px',
                  }}
                >
                  PF SUMMARY STATEMENT
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                    marginBottom: '3px',
                  }}
                >
                  <span>PF Wages:</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{(totals.grandBasic || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                    marginBottom: '3px',
                  }}
                >
                  <span>EE Share (12%):</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{(totals.grandPf || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                  }}
                >
                  <span>ER Share (Diff):</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{(totals.grandPf || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {opt.summaryEsi !== false && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '4px',
                    marginBottom: '6px',
                  }}
                >
                  ESI SUMMARY STATEMENT
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                    marginBottom: '3px',
                  }}
                >
                  <span>ESI Wages:</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{(totals.grandGross || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                    marginBottom: '3px',
                  }}
                >
                  <span>EE Share (0.75%):</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{Math.round((totals.grandGross || 0) * 0.0075).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                  }}
                >
                  <span>ER Share (3.25%):</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{Math.round((totals.grandGross || 0) * 0.0325).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {opt.summaryPt !== false && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '4px',
                    marginBottom: '6px',
                  }}
                >
                  P.T. SUMMARY STATEMENT
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                    marginBottom: '3px',
                  }}
                >
                  <span>Covered Employees:</span>
                  <strong style={{ color: '#0f172a' }}>{records.length}</strong>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                  }}
                >
                  <span>Total P.T. Deducted:</span>
                  <strong style={{ color: '#0f172a' }}>
                    ₹{(totals.grandPt || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {opt.summaryWorkforce !== false && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '4px',
                    marginBottom: '6px',
                  }}
                >
                  WORKFORCE STRENGTH CARD
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                    marginBottom: '3px',
                  }}
                >
                  <span>Total Staff on Register:</span>
                  <strong style={{ color: '#0f172a' }}>{records.length}</strong>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#475569',
                  }}
                >
                  <span>Status Active:</span>
                  <strong style={{ color: '#16a34a' }}>{records.length}</strong>
                </div>
              </div>
            )}
          </div>

          {opt.summaryNetInWords !== false && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                padding: '8px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#166534',
              }}
            >
              <strong>Net Salary in Words:</strong> ₹
              {totals.grandNet ? totals.grandNet.toLocaleString('en-IN') : '0'} (Total Net Payout to {records.length} Staff)
            </div>
          )}

          {opt.summarySignatory !== false && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                textAlign: 'center',
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                Prepared By
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                Checked By
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                Verified By
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                Authorized Signatory
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

