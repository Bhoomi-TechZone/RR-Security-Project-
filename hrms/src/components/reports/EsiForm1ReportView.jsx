import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  downloadEsiForm1Pdf,
  downloadEsiForm1Excel,
  downloadEsiForm1Csv,
} from '../../utils/esiForm1Export';
import styles from './EsiForm1ReportView.module.css';

/**
 * Statutory ESI Form 1 Declaration Form & Temporary Identity Card (TIC) Component
 * FORM - 1 [REGULATION 11 & 12, ESI (GENERAL) REGULATIONS, 1950]
 * Exact statutory 2-page declaration form with:
 * - Page 1: Insured Person Particulars, Employer Particulars, Nominee, Signatures, Family Table, TIC Card
 * - Page 2: Statutory Instructions, Branch Office Use Only box, Family Particulars Table
 */
export default function EsiForm1ReportView({
  reportData = {},
  filters = {},
  onSelectEmployee,
}) {
  const [pageView, setPageView] = useState('all'); // 'all' | 'page1' | 'page2'

  const emp = reportData?.selectedEmployeeData || {};
  const comp = reportData?.companyInfo || {};
  const employeeList = reportData?.employeeList || [];
  const nom = emp?.nominee || {};
  const fam = emp?.familyRows || [];

  // Split Employer's Code into 17 boxed cells
  const rawCode = (comp.employerCode || '20001853160000999').replace(/[^0-9]/g, '');
  const codeDigits = rawCode.split('').slice(0, 17);
  while (codeDigits.length < 17) codeDigits.push('');

  // Present & Permanent PIN digits (6 cells)
  const getPinDigits = (pinVal) => {
    const rawPin = Array.isArray(pinVal)
      ? pinVal.join('')
      : String(pinVal || '').replace(/\D/g, '');
    const digits = rawPin.split('').slice(0, 6);
    while (digits.length < 6) digits.push('');
    return digits;
  };

  const presentPinDigits = getPinDigits(emp.presentAddress?.pin);
  const permPinDigits = getPinDigits(emp.permanentAddress?.pin);

  const handleDownloadPdf = () => {
    downloadEsiForm1Pdf(reportData, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadEsiForm1Pdf(reportData, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsiForm1Excel(reportData, { format: 'xlsx' });
  };

  const handleDownloadCsv = () => {
    downloadEsiForm1Csv(reportData, { format: 'csv' });
  };

  const todayStr = new Date().toLocaleDateString('en-GB');
  const isMarried = (emp.maritalStatus || '').toLowerCase().includes('marri');
  const isMale = (emp.gender || 'M').toUpperCase().startsWith('M');

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={15} />
            ESI FORM 1 DECLARATION
          </span>

          {employeeList.length > 0 && (
            <select
              className={styles.employeeSelect}
              value={emp.employeeId || ''}
              onChange={(e) => {
                if (onSelectEmployee) onSelectEmployee(e.target.value);
              }}
              title="Select Employee"
            >
              {employeeList.map((e) => (
                <option key={e.id || e.employeeId} value={e.employeeId || e.id}>
                  {e.name} {e.esicNo ? `(ESI: ${e.esicNo})` : `(${e.employeeId})`}
                </option>
              ))}
            </select>
          )}

          <div className={styles.pageToggleGroup}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${pageView === 'all' ? styles.toggleBtnActive : ''}`}
              onClick={() => setPageView('all')}
            >
              All Pages
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${pageView === 'page1' ? styles.toggleBtnActive : ''}`}
              onClick={() => setPageView('page1')}
            >
              Page 1 (Declaration &amp; TIC)
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${pageView === 'page2' ? styles.toggleBtnActive : ''}`}
              onClick={() => setPageView('page2')}
            >
              Page 2 (Instructions)
            </button>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleDownloadPdf}
            title="Download Official 2-Page Form PDF"
          >
            <Download size={14} /> PDF
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleDownloadExcel}
            title="Download Excel Workbook"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnCsv}`}
            onClick={handleDownloadCsv}
            title="Download CSV"
          >
            <FileText size={14} /> CSV
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Official Form"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiCardBlue}`}>
          <span className={styles.kpiLabel}>Selected Insured Person</span>
          <span className={styles.kpiValue}>{emp.name || 'None Selected'}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
          <span className={styles.kpiLabel}>Insurance (ESIC IP) No.</span>
          <span className={styles.kpiValue}>{emp.insuranceNo || '—'}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardPurple}`}>
          <span className={styles.kpiLabel}>Date of Appointment</span>
          <span className={styles.kpiValue}>{emp.appointmentDate || '—'}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardOrange}`}>
          <span className={styles.kpiLabel}>Employer's Code No.</span>
          <span className={styles.kpiValue}>{comp.employerCode || '20001853160000999'}</span>
        </div>
      </div>

      {/* Main Form Sheets Container */}
      <div className={styles.paperWrapper}>
        {/* =========================================================================
            PAGE 1: DECLARATION FORM & TIC
            ========================================================================= */}
        {(pageView === 'all' || pageView === 'page1') && (
          <div className={styles.paperSheet}>
            {/* Header: Logo, Title, Form Number */}
            <div className={styles.topHeader}>
              <div className={styles.esicLogoWrap}>
                <div className={styles.esicSeal}>ESIC</div>
                <span>E. S. I. C.</span>
              </div>
              <div className={styles.formMainTitle}>DECLARATION FORM.</div>
              <div className={styles.formNumber}>FORM - 1</div>
            </div>

            {/* Employer's code No. 17-digit Segmented Boxes */}
            <div className={styles.employerCodeRow}>
              <span className={styles.codeLabel}>Employer's code No.</span>
              <div className={styles.codeGrid}>
                {codeDigits.map((digit, i) => (
                  <span key={i} className={styles.codeDigitCell}>
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            {/* 2-Column Section (A) & (B) */}
            <div className={styles.twoColGrid}>
              {/* Left Column (A): Insured Person's Particulars */}
              <div className={styles.colA}>
                <div className={styles.sectionHeader}>(A) Insured Person's Particulars</div>

                {/* 1 Insurance No. */}
                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabel}>1 Insurance No.</div>
                  <div className={styles.fieldValue}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {emp.insuranceNo || '—'}
                    </strong>
                  </div>
                </div>

                {/* 2 Name */}
                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabel}>
                    2 Name<br />(in block capital)
                  </div>
                  <div className={styles.fieldValue} style={{ fontWeight: 800 }}>
                    {(emp.name || '').toUpperCase()}
                  </div>
                </div>

                {/* 3 Father's / Husband's Name */}
                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabel}>
                    3 Father's /<br />Husband's Name
                  </div>
                  <div className={styles.fieldValue}>{emp.fatherHusbandName || '—'}</div>
                </div>

                {/* 4 Date of Birth, 5 Marital Status, 6 Sex */}
                <div className={styles.fieldRow} style={{ minHeight: '46px' }}>
                  <div className={styles.fieldLabel}>4 Date of Birth</div>
                  <div className={styles.fieldValue} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <div className={styles.dobWrapper}>
                      <span style={{ fontSize: '9.5px', color: '#475569' }}>DD</span>
                      <div className={styles.dobCell}>{emp.dobParts?.day || '—'}</div>
                      <span style={{ fontSize: '9.5px', color: '#475569' }}>MM</span>
                      <div className={styles.dobCell}>{emp.dobParts?.month || '—'}</div>
                      <span style={{ fontSize: '9.5px', color: '#475569' }}>YY</span>
                      <div className={styles.dobYearCell}>
                        {emp.dobParts?.year ? String(emp.dobParts.year).slice(-2) : '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', lineHeight: 1.35 }}>
                      <div>
                        5. Marital Status : <strong>{isMarried ? 'Married' : emp.maritalStatus || 'Single'}</strong>
                      </div>
                      <div>
                        6. Sex : <strong>{isMale ? 'M' : 'F'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7 Present Address & 8 Permanent Address Side-by-side */}
                <div className={styles.addressGrid}>
                  <div className={styles.addrBox}>
                    <div className={styles.addrTitle}>7 Present Address</div>
                    <div className={styles.addrText}>{emp.presentAddress?.line || '—'}</div>
                    <div style={{ fontSize: '10px', color: '#334155' }}>
                      {emp.presentAddress?.city && <span>{emp.presentAddress.city}, </span>}
                      {emp.presentAddress?.state && <span>{emp.presentAddress.state}</span>}
                    </div>
                    <div className={styles.pinRow}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700 }}>Pin</span>
                      <div className={styles.pinGrid}>
                        {presentPinDigits.map((d, i) => (
                          <div key={i} className={styles.pinDigit}>
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
                      e-mail: {emp.email || '—'}
                    </div>
                  </div>

                  <div className={styles.addrBox}>
                    <div className={styles.addrTitle}>8. Permanent Address</div>
                    <div className={styles.addrText}>{emp.permanentAddress?.line || '—'}</div>
                    <div style={{ fontSize: '10px', color: '#334155' }}>
                      {emp.permanentAddress?.city && <span>{emp.permanentAddress.city}, </span>}
                      {emp.permanentAddress?.state && <span>{emp.permanentAddress.state}</span>}
                    </div>
                    <div className={styles.pinRow}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700 }}>Pin</span>
                      <div className={styles.pinGrid}>
                        {permPinDigits.map((d, i) => (
                          <div key={i} className={styles.pinDigit}>
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
                      e-mail: {emp.email || '—'}
                    </div>
                  </div>
                </div>

                {/* Branch Office */}
                <div className={styles.fieldRow} style={{ borderBottom: 'none' }}>
                  <div className={styles.fieldLabel}>Branch office:</div>
                  <div className={styles.fieldValue}>{emp.branchOffice || 'DELHI'}</div>
                </div>
              </div>

              {/* Right Column (B): Employer's Particulars */}
              <div className={styles.colB}>
                <div className={styles.sectionHeader}>(B) Employer's Particulars</div>

                {/* 10 Date of Appointment */}
                <div className={styles.fieldRow} style={{ minHeight: '44px' }}>
                  <div className={styles.fieldLabel}>
                    10. Date of<br />Appointment
                  </div>
                  <div className={styles.fieldValue}>
                    <div className={styles.dobWrapper}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '8.5px', color: '#64748b', display: 'block' }}>Date</span>
                        <div className={styles.dobCell}>{emp.appointmentParts?.day || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '8.5px', color: '#64748b', display: 'block' }}>Month</span>
                        <div className={styles.dobCell}>{emp.appointmentParts?.month || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '8.5px', color: '#64748b', display: 'block' }}>Year</span>
                        <div className={styles.dobYearCell} style={{ width: '42px' }}>
                          {emp.appointmentParts?.year || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 11 Name & Address of Employer */}
                <div className={styles.fieldRow} style={{ minHeight: '68px', flexDirection: 'column' }}>
                  <div
                    style={{
                      padding: '3px 6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: '#fafafa',
                      borderBottom: '1px solid #000',
                    }}
                  >
                    11. Name &amp; Address of the employer
                  </div>
                  <div style={{ padding: '4px 8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '11px' }}>{comp.name || ''}</div>
                    <div style={{ fontSize: '10px', color: '#334155', lineHeight: 1.35, marginTop: '2px' }}>
                      {comp.address || ''}
                    </div>
                  </div>
                </div>

                {/* 12 In case of previous employment */}
                <div
                  style={{
                    padding: '4px 6px',
                    fontSize: '10px',
                    background: '#fafafa',
                    borderBottom: '1px solid #000',
                    fontWeight: 700,
                  }}
                >
                  12. In case of any previous employment please fillup the details as under:-
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabel} style={{ width: '140px', minWidth: '140px' }}>
                    Previous Ins. No.
                  </div>
                  <div className={styles.fieldValue}>{emp.previousEmployment?.prevInsuranceNo || '—'}</div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldLabel} style={{ width: '140px', minWidth: '140px' }}>
                    Emplrs. Code No.
                  </div>
                  <div className={styles.fieldValue}>{emp.previousEmployment?.prevEmployerCode || '—'}</div>
                </div>

                <div className={styles.fieldRow} style={{ borderBottom: 'none', minHeight: '44px' }}>
                  <div className={styles.fieldLabel} style={{ width: '140px', minWidth: '140px' }}>
                    11. Name &amp; Address of the employer
                  </div>
                  <div className={styles.fieldValue}>{emp.previousEmployment?.prevEmployerDetails || '—'}</div>
                </div>
              </div>
            </div>

            {/* Section (c) Details of Nominee */}
            <div className={styles.nomineeSection}>
              <div className={styles.clauseText}>
                (c) Details of the nominee u/s 71 of ESI Act 1948 / Rule 56(2) of ESI (Central) Rules 1950 for payment of cash benefit in the event of death
              </div>
              <table className={styles.statutoryBorderTable}>
                <colgroup>
                  <col style={{ width: '32%' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '40%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>NAME OF THE NOMINEE</th>
                    <th>RELATIONSHIP WITH INSURED PERSON</th>
                    <th>ADDRESS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{nom.name || '—'}</strong></td>
                    <td>{nom.relationship || '—'}</td>
                    <td>{nom.address || emp.presentAddress?.line || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Declaration & Signatures */}
            <div className={styles.declParagraph}>
              hereby declare that the above particulars have been given by me and are correct to the best of my knowledge and I belief. I also under take to intimate to the corporation any change in the membership of my family within 15 days of such change having occured.
            </div>

            <div style={{ fontWeight: 700, fontSize: '10.5px', marginBottom: '6px' }}>
              Counter Signature of the Employer
            </div>

            <div className={styles.signatureRow}>
              <span>Signature with Seal</span>
              <span>Signature / T.I. of I P</span>
            </div>

            {/* Section (D) Family Particulars Table (Fixed 100% Layout, Never Overflows) */}
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 800, fontSize: '10.5px', marginBottom: '4px' }}>
                (D) FAMILY PARTICULARS OF INSURED PERSON
              </div>
              <table className={styles.statutoryBorderTable}>
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>Sl. No</th>
                    <th rowSpan={2}>Name</th>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>Date of Birth</th>
                    <th rowSpan={2}>Relationship with insured person</th>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>Whether residing with him/her or not</th>
                    <th colSpan={2} style={{ textAlign: 'center' }}>If No, State place of Residence</th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Town</th>
                    <th style={{ textAlign: 'center' }}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {fam.map((f, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{f.slNo || i + 1}</td>
                      <td><strong>{f.name}</strong></td>
                      <td style={{ textAlign: 'center' }}>{f.dob}</td>
                      <td>{f.relationship}</td>
                      <td style={{ textAlign: 'center' }}>{f.residingWith}</td>
                      <td style={{ textAlign: 'center' }}>{f.residenceTown}</td>
                      <td style={{ textAlign: 'center' }}>{f.residenceState}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =========================================================================
                ESI CORPORATION - Temporary Identity Card (TIC)
                Bulletproof Flexbox Frame - Photo Firmly Locked Inside
                ========================================================================= */}
            <div className={styles.ticContainer}>
              <div className={styles.ticMainHeading}>ESI CORPORATION</div>
              <div className={styles.ticHeader}>
                <span className={styles.ticTitle}>Temporary Identity Card</span>
                <span className={styles.ticValidityNote}>Valid for 3 months from the date of appointment</span>
              </div>

              <div className={styles.ticOuterBox}>
                <div className={styles.ticMainTableWrap}>
                  <table className={styles.ticTable}>
                    <colgroup>
                      <col style={{ width: '23%' }} />
                      <col style={{ width: '27%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '28%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th>NAME</th>
                        <td colSpan={3} style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}>
                          {emp.name || '—'}
                        </td>
                      </tr>
                      <tr>
                        <th>INS. NO</th>
                        <td><strong style={{ fontFamily: 'monospace' }}>{emp.insuranceNo || '—'}</strong></td>
                        <th>DATE OF ENTRY</th>
                        <td>{emp.appointmentDate || '—'}</td>
                      </tr>
                      <tr>
                        <th>FATHER'S / HUSBAND'S NAME</th>
                        <td>{emp.fatherHusbandName || '—'}</td>
                        <th>DATE OF BIRTH</th>
                        <td>{emp.dob || '—'}</td>
                      </tr>
                      <tr>
                        <th>BRANCH OFFICE</th>
                        <td>{emp.branchOffice || 'DELHI'}</td>
                        <th>DISPENSARY</th>
                        <td>{emp.dispensary || 'LOCAL DISPENSARY'}</td>
                      </tr>
                      <tr>
                        <th>NAME, ADDRESS &amp; CODE NO. OF THE EMPLOYER</th>
                        <td colSpan={3} style={{ fontSize: '9.5px', lineHeight: 1.3 }}>
                          <strong>{comp.name || ''}</strong> — Code: {comp.employerCode || '20001853160000999'}<br />
                          {comp.address || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Photo Column - Fully Contained Inside Card */}
                <div className={styles.ticPhotoSection}>
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.name || 'Employee'} className={styles.ticPhotoImg} />
                  ) : (
                    <div className={styles.ticPhotoBoxPlaceholder}>
                      <Users size={22} color="#94a3b8" style={{ marginBottom: '4px' }} />
                      <span>Affix Photograph of Insured Person Here</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.ticFooterRow}>
                <div>
                  <div>Validity : <strong>3 Months from appointment</strong></div>
                  <div style={{ marginTop: '2px' }}>Dated &nbsp; : <strong>{todayStr}</strong></div>
                </div>
                <div style={{ fontWeight: 700 }}>Signature / T.I. of I P</div>
                <div style={{ fontWeight: 700 }}>Signature of B.M. with Seal</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PAGE 2: INSTRUCTIONS & BRANCH OFFICE USE
            ========================================================================= */}
        {(pageView === 'all' || pageView === 'page2') && (
          <div className={styles.paperSheet}>
            <div className={styles.instructionsTitle}>INSTRUCTIONS</div>

            <div className={styles.instructionList}>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>1</span>
                <span>Submission of Form 1 is governed by regulations 11 &amp; 12 of ESI (General) Regulations, 1950.</span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>2</span>
                <span>
                  "Family" means all or any one of the following relatives of an insured person namely:-<br />
                  (i) a Spouse (ii) a minor legitimate or adopted child dependent upon the I.P.: (iii) a child who is wholly dependent on the earnings of the I.P and who is (a) receiving education, till he or she attains the age of 21 years (b) an un married daughter; (iv) a child who is infirm by reason of any physical or mental abnormality or injury and is wholly dependent on the earnings of the I.P. so long as the infirmity continues; (v) dependent Parents.
                </span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>3</span>
                <span>Identity Card is Non - Transferable.</span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>4</span>
                <span>Loss of Identity Card be reported to Employer / Branch manager immediately.</span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>5</span>
                <span>Submission of false information attracts penal action under section 84 of ESI Act, 1948.</span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>6</span>
                <span>This form dully filled in must reach the concerned Branch office within 10 Days of appointment of an employee. Delay attracts penal action under section 85 of the Act, against the employer.</span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>7</span>
                <span>As an insured person you and your dependent family members are entitled to full medical benefit from today itself. The other benefits in cash include (1) Sickness Benefit (2) Temporary Disablement Benefit (3) Permanent Disablement Benefit (4) Dependents Benefit and (5) Maternity Benefit (in case of women employees) subject to fulfillment of contributory conditions.</span>
              </div>
              <div className={styles.instructionItem}>
                <span className={styles.instructionNum}>8</span>
                <span>For more details contact website of ESIC at <strong>www.esic.org.in</strong> or contact Regional office or Branch office.</span>
              </div>
            </div>

            {/* FOR BRANCH OFFICE USE ONLY */}
            <div className={styles.branchOfficeBox}>
              <div className={styles.branchOfficeTitle}>FOR BRANCH OFFICE USE ONLY</div>
              <div className={styles.boField}>1. Date of allotment of Ins. No. : ________________________</div>
              <div className={styles.boField}>2. Date of issue of T.I.C : _______________________________</div>
              <div className={styles.boField}>3. Name / No. of Disp. : _________________________________</div>
              <div className={styles.boField}>4. Whether reciprocal Medical arrangements involved, if yes, Please indicate : ________________________</div>
              <div style={{ height: '36px' }}></div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '11px' }}>Signature of Branch Manager</div>
            </div>

            {/* Additional Family Table on Page 2 (Exact 100% Width) */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '10.5px', marginBottom: '4px' }}>
                FAMILY PARTICULARS (CONTINUED)
              </div>
              <table className={styles.statutoryBorderTable}>
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>Sl. No</th>
                    <th rowSpan={2}>Name</th>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>Date of Birth</th>
                    <th rowSpan={2}>Relationship with insured person</th>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>Whether residing with him/her or not</th>
                    <th colSpan={2} style={{ textAlign: 'center' }}>If No, State place of Residence</th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Town</th>
                    <th style={{ textAlign: 'center' }}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {fam.map((f, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{f.slNo || i + 1}</td>
                      <td><strong>{f.name}</strong></td>
                      <td style={{ textAlign: 'center' }}>{f.dob}</td>
                      <td>{f.relationship}</td>
                      <td style={{ textAlign: 'center' }}>{f.residingWith}</td>
                      <td style={{ textAlign: 'center' }}>{f.residenceTown}</td>
                      <td style={{ textAlign: 'center' }}>{f.residenceState}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
