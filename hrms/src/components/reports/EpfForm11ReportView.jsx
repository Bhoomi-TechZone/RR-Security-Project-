import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { downloadEpfForm11Pdf } from '../../utils/epfForm11Export';
import styles from './EpfForm11ReportView.module.css';

/**
 * Statutory EPF Form 11 - Declaration Form View Component
 * Matches the official EPFO Form 11 format exactly:
 * - NO LOGO (Per explicit user instruction)
 * - Page 1: Member Particulars, KYC & 6-column sub-table (flawlessly aligned 100% width)
 * - Page 2: Undertaking & Declaration by Present Employer with Seal of Establishment
 */
export default function EpfForm11ReportView({
  reportData = {},
  filters = {},
  onSelectEmployee,
}) {
  const records = reportData?.records || [];
  const companyInfo = reportData?.companyInfo || {};
  const summaryCards = reportData?.summaryCards || [];

  const [selectedEmpId, setSelectedEmpId] = useState(
    records[0]?.employeeId || records[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState('both'); // 'both' | 'page1' | 'page2'

  const activeEmp =
    records.find((r) => r.employeeId === selectedEmpId || r.id === selectedEmpId) ||
    records[0] ||
    {};

  // Always use the primary Admin Company name for statutory establishment reports
  const adminCompanyName = (
    companyInfo?.name ||
    reportData?.companyInfo?.name ||
    activeEmp.adminCompanyName ||
    activeEmp.companyInfo?.name ||
    'RR SECURITY & FACILITIES'
  ).toUpperCase();

  const isFather = activeEmp.isFather !== false && !activeEmp.isSpouse;
  const isSpouse = Boolean(activeEmp.isSpouse);

  const handleDownloadSinglePdf = () => {
    downloadEpfForm11Pdf(activeEmp, companyInfo, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadEpfForm11Pdf(activeEmp, companyInfo, { mode: 'print' });
  };

  const handleDownloadAllPdf = () => {
    downloadEpfForm11Pdf(records, companyInfo, { mode: 'download' });
  };

  const todayStr = new Date().toLocaleDateString('en-GB');

  return (
    <div className={styles.container}>
      {/* Top Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            EPF FORM 11 DECLARATION
          </span>

          {records.length > 0 && (
            <select
              className={styles.employeeSelect}
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                if (onSelectEmployee) onSelectEmployee(e.target.value);
              }}
              title="Select Employee for Form 11"
            >
              {records.map((emp) => (
                <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                  {emp.name} {emp.allottedPfNo ? `(${emp.allottedPfNo})` : `(${emp.employeeId})`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={handleDownloadSinglePdf}
            title="Download this employee's statutory 2-page EPF Form 11 as PDF"
          >
            <Download size={15} />
            <span>Download Form 11 (PDF)</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handlePrint}
            title="Print EPF Form 11 PDF"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {records.length > 1 && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.btnSecondary}`}
              onClick={handleDownloadAllPdf}
              title="Download all employees Form 11 in a combined PDF"
            >
              <FileText size={15} color="#2563eb" />
              <span>Download All ({records.length}) PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summaryCards.length > 0 && (
        <div className={styles.statsRow}>
          {summaryCards.map((card, idx) => (
            <div key={idx} className={styles.statCard}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue}>{card.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* View Tabs */}
      <div className={styles.viewControlsRow}>
        <div className={styles.pageTabs}>
          <button
            type="button"
            className={`${styles.pageTab} ${activeTab === 'both' ? styles.pageTabActive : ''}`}
            onClick={() => setActiveTab('both')}
          >
            Show Both Pages (1 & 2)
          </button>
          <button
            type="button"
            className={`${styles.pageTab} ${activeTab === 'page1' ? styles.pageTabActive : ''}`}
            onClick={() => setActiveTab('page1')}
          >
            Page 1: Member Particulars & KYC
          </button>
          <button
            type="button"
            className={`${styles.pageTab} ${activeTab === 'page2' ? styles.pageTabActive : ''}`}
            onClick={() => setActiveTab('page2')}
          >
            Page 2: Undertaking & Employer Declaration
          </button>
        </div>
      </div>

      {/* Form Presentation Container */}
      <div className={styles.sheetContainer}>
        {/* ================================================================= */}
        {/* PAGE 1 PREVIEW */}
        {/* ================================================================= */}
        {(activeTab === 'both' || activeTab === 'page1') && (
          <div className={styles.sheetWrapper}>
            <div className={styles.pageIndicator}>
              <span>PAGE 1 OF 2 : DECLARATION FORM</span>
            </div>

            <div className={styles.sheet}>
              {/* Top Right Reference */}
              <div className={styles.sheetTopRight}>
                <strong>New Form : 11 - Declaration Form</strong>
                <span>(To be retained by the employer for future reference)</span>
              </div>

              {/* Central Heading with Dynamic Admin Company Name (NO LOGO) */}
              <div className={styles.sheetTitleSection}>
                <div className={styles.companyHeaderTitle}>{adminCompanyName}</div>
                <div className={styles.mainTitle}>EMPLOYEES' PROVIDENT FUND ORGANISATION</div>
                <div className={styles.subTitle}>
                  Employees' Provident Fund Scheme, 1952 (Paragraph 34 & 57) and<br />
                  Employees' Pension Scheme, 1995 (Paragraph 24)
                </div>
                <div className={styles.descNotice}>
                  (Declaration by a person taking up Employment in any Establishment on which EPF Scheme, 1952 and for EPS, 1995 is applicable)
                </div>
              </div>

              {/* Main Table: Items 1 to 12 */}
              <table className={styles.statTable}>
                <colgroup>
                  <col style={{ width: '36px' }} />
                  <col style={{ width: 'calc(52% - 18px)' }} />
                  <col style={{ width: 'calc(48% - 18px)' }} />
                </colgroup>
                <tbody>
                  {/* 1. Name of Member */}
                  <tr>
                    <td className={styles.colSr}>1.</td>
                    <td className={styles.colLabel}>Name of Member</td>
                    <td className={styles.colValue}>{activeEmp.name || '—'}</td>
                  </tr>

                  {/* 2. Father's / Spouse's Name */}
                  <tr>
                    <td className={styles.colSr}>2.</td>
                    <td className={styles.colLabel}>
                      Father's Name{' '}
                      <span className={styles.checkboxSpan}>{isFather ? '✓' : ''}</span>{' '}
                      Spouse's Name{' '}
                      <span className={styles.checkboxSpan}>{isSpouse ? '✓' : ''}</span>
                      <span className={styles.subText}>(Please tick whichever applicable)</span>
                    </td>
                    <td className={styles.colValue}>{activeEmp.fatherHusbandName || '—'}</td>
                  </tr>

                  {/* 3. DOB */}
                  <tr>
                    <td className={styles.colSr}>3.</td>
                    <td className={styles.colLabel}>Date of Birth (dd/mm/yyyy)</td>
                    <td className={styles.colValue}>{activeEmp.dob || '—'}</td>
                  </tr>

                  {/* 4. Gender */}
                  <tr>
                    <td className={styles.colSr}>4.</td>
                    <td className={styles.colLabel}>Gender (Male / Female / Transgender)</td>
                    <td className={styles.colValue}>{activeEmp.gender || 'Male'}</td>
                  </tr>

                  {/* 5. Marital Status */}
                  <tr>
                    <td className={styles.colSr}>5.</td>
                    <td className={styles.colLabel}>Marital Status ? (Single/Married/Widow/Widower/Divorcee)</td>
                    <td className={styles.colValue}>{activeEmp.maritalStatus || 'Married'}</td>
                  </tr>

                  {/* 6. Email & Mobile */}
                  <tr>
                    <td className={styles.colSr} rowSpan={2}>6.</td>
                    <td className={styles.colLabel}>(a) eMail ID</td>
                    <td className={styles.colValue}>{activeEmp.email || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>(b) Mobile No</td>
                    <td className={styles.colValue}>{activeEmp.mobile || '—'}</td>
                  </tr>

                  {/* 7. Earlier member of EPF */}
                  <tr>
                    <td className={styles.colSr}>7.</td>
                    <td className={styles.colLabel}>Whether earlier member of the Employee's Provident Fund Scheme, 1952 ?</td>
                    <td className={styles.colValue}>{activeEmp.isEarlierPfMember || (activeEmp.previousPfNo || activeEmp.uan ? 'Yes' : 'No')}</td>
                  </tr>

                  {/* 8. Earlier member of EPS */}
                  <tr>
                    <td className={styles.colSr}>8.</td>
                    <td className={styles.colLabel}>Whether earlier member of the Employee's Pension Scheme, 1995 ?</td>
                    <td className={styles.colValue}>{activeEmp.isEarlierEpsMember || (activeEmp.previousPfNo || activeEmp.uan ? 'Yes' : 'No')}</td>
                  </tr>

                  {/* 9. Previous Employment details */}
                  <tr>
                    <td className={styles.colSr} rowSpan={6}>9.</td>
                    <td className={styles.colLabel} style={{ fontWeight: 700 }}>Previous Employment details ?</td>
                    <td className={styles.colValue}></td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>a) Universal Account Number (UAN)</td>
                    <td className={styles.colValue}>{activeEmp.uan || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>b) Previous PF Account Number</td>
                    <td className={styles.colValue}>{activeEmp.previousPfNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>c) Date of Exit from previous Employment ? (dd/mm/yyyy)</td>
                    <td className={styles.colValue}>{activeEmp.previousExitDate || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>d) Scheme Certificate No (If issued)</td>
                    <td className={styles.colValue}>{activeEmp.schemeCertificateNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>e) Pension Payment Order (PPO) (If issued)</td>
                    <td className={styles.colValue}>{activeEmp.ppoNo || '—'}</td>
                  </tr>

                  {/* 10. International Worker */}
                  <tr>
                    <td className={styles.colSr} rowSpan={4}>10.</td>
                    <td className={styles.colLabel}>a) International Worker</td>
                    <td className={styles.colValue}>{activeEmp.internationalWorker || 'No'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>b) If Yes, state country of origin (name of other country)</td>
                    <td className={styles.colValue}>{activeEmp.countryOfOrigin || 'India'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>c) Passport No.</td>
                    <td className={styles.colValue}>{activeEmp.passportNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>d) Validity of passport (dd/mm/yyyy) to (dd/mm/yyyy)</td>
                    <td className={styles.colValue}>{activeEmp.passportValidity || '—'}</td>
                  </tr>

                  {/* 11. KYC Details */}
                  <tr>
                    <td className={styles.colSr} rowSpan={4}>11.</td>
                    <td className={styles.colLabel}>
                      <strong>KYC Details :</strong> (attach self attested copies of following KYC's)
                    </td>
                    <td className={styles.colValue} style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>
                      Must Enclose Scan copy for the following documents
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>a) Bank Account No. & IFS Code</td>
                    <td className={styles.colValue}>
                      {activeEmp.bankAccountNo || '—'}<br />
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>{activeEmp.ifscCode || ''}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>b) AADHAR Number</td>
                    <td className={styles.colValue}>{activeEmp.aadhaar || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.colLabel}>c) Permanent Account Number (PAN), If available</td>
                    <td className={styles.colValue}>{activeEmp.pan || '—'}</td>
                  </tr>

                  {/* 12. Special 6-Column Subtable */}
                  <tr>
                    <td className={styles.colSr}>12.</td>
                    <td colSpan={2} className={styles.subTableContainer}>
                      <table className={styles.subTable12}>
                        <colgroup>
                          <col style={{ width: '16.666%' }} />
                          <col style={{ width: '16.666%' }} />
                          <col style={{ width: '16.666%' }} />
                          <col style={{ width: '16.666%' }} />
                          <col style={{ width: '16.666%' }} />
                          <col style={{ width: '16.666%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>First EPF<br />Member<br />Enrolled Date</th>
                            <th>First Employment<br />EPF<br />Wages</th>
                            <th>Are you EPF<br />Member<br />before<br />01/09/2014</th>
                            <th>If Yes, EPF<br />Amount<br />Withdrawn?</th>
                            <th>If Yes, EPS<br />(Pension)<br />Amount<br />Withdrawn?</th>
                            <th>After Sep 2014<br />earned EPS<br />(Pension) Amount<br />Withdrawn before<br />Join Current<br />Employer?</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{activeEmp.firstEnrolledDate || activeEmp.joiningDate || '—'}</td>
                            <td>
                              {activeEmp.firstEpfWages
                                ? `Rs. ${Number(String(activeEmp.firstEpfWages).replace(/[^\d.]/g, '') || 0).toLocaleString('en-IN') || activeEmp.firstEpfWages}`
                                : '—'}
                            </td>
                            <td>{activeEmp.isMemberBefore2014 || 'Yes'}</td>
                            <td>{activeEmp.isEpfWithdrawn || 'No'}</td>
                            <td>{activeEmp.isEpsWithdrawn || 'No'}</td>
                            <td>{activeEmp.isPost2014Withdrawn || 'No'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PAGE 2 PREVIEW */}
        {/* ================================================================= */}
        {(activeTab === 'both' || activeTab === 'page2') && (
          <div className={styles.sheetWrapper}>
            <div className={styles.pageIndicator}>
              <span>PAGE 2 OF 2 : UNDERTAKING & EMPLOYER DECLARATION</span>
            </div>

            <div className={styles.sheet}>
              {/* Top Right Reference */}
              <div className={styles.sheetTopRight}>
                <strong>New Form : 11 - Declaration Form</strong>
                <span>(To be retained by the employer for future reference)</span>
              </div>

              {/* Central Heading with Dynamic Admin Company Name (NO LOGO) */}
              <div className={styles.sheetTitleSection}>
                <div className={styles.companyHeaderTitle}>{adminCompanyName}</div>
                <div className={styles.mainTitle}>EMPLOYEES' PROVIDENT FUND ORGANISATION</div>
                <div className={styles.subTitle}>
                  Employees' Provident Fund Scheme, 1952 (Paragraph 34 & 57) and<br />
                  Employees' Pension Scheme, 1995 (Paragraph 24)
                </div>
                <div className={styles.descNotice}>
                  (Declaration by a person taking up Employment in any Establishment on which EPF Scheme, 1952 and for EPS, 1995 is applicable)
                </div>
              </div>

              {/* Section: UNDERTAKING */}
              <div className={styles.sectionTitle}>UNDERTAKING</div>
              <div className={styles.undertakingList}>
                <p>1) Certified that the particulars are true to the best of my knowledge</p>
                <p>2) I authorise EPFO to use my Aadhar for verification / authentication / eKYC purpose for service delivery</p>
                <p>
                  3) Kindly transfer the fund and service details, if applicable, from the previous PF account as declared above to the present PF account.<br />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                    (The transfer would be possible only if the identified KYC details approved by previous employer has been verified by present employer using his Digital Signature)
                  </span>
                </p>
                <p>4) In case of changes in above details, the same will be intimated to employer at the earliest.</p>
              </div>

              {/* Signatures Row */}
              <div className={styles.signRow}>
                <div>
                  <div>Date : {todayStr}</div>
                  <div style={{ marginTop: '0.5rem' }}>Place : {companyInfo.city || 'New Delhi'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderBottom: '1px solid #000000', width: '200px', marginBottom: '6px' }}></div>
                  <strong>Signature of Member</strong>
                </div>
              </div>

              {/* Section: DECLARATION BY PRESENT EMPLOYER */}
              <div className={styles.sectionTitle} style={{ marginTop: '3rem' }}>
                DECLARATION BY PRESENT EMPLOYER
              </div>

              <div className={styles.declBlock}>
                {/* Point A */}
                <div className={styles.declPoint}>
                  <span className={styles.pointLetter}>A.</span>
                  <div className={styles.pointBody}>
                    The member Mr./Ms./Mrs. <strong>{activeEmp.name}</strong> Has joined on{' '}
                    <strong>{activeEmp.joiningDate || todayStr}</strong> and has been alloted PF Number{' '}
                    <strong>{activeEmp.allottedPfNo || '—'}</strong><br />
                    In case the person was earlier not a member of EPF Scheme, 1952 and EPS, 1995: ((Post allotment of UAN) The UAN alloted or the member is){' '}
                    {activeEmp.uan ? <strong>: {activeEmp.uan}</strong> : ''}
                  </div>
                </div>

                {/* Point B */}
                <div className={styles.declPoint}>
                  <span className={styles.pointLetter}>B.</span>
                  <div className={styles.pointBody}>
                    Please Tick the Appropriate Option : The KYC details of the above member in the JAN database
                    <div className={styles.optionsGrid}>
                      <div className={styles.optionItem}>
                        <span className={styles.checkboxSpan}></span>
                        <span>Have not been uploaded</span>
                      </div>
                      <div className={styles.optionItem}>
                        <span className={styles.checkboxSpan}></span>
                        <span>Have been uploaded but not approved</span>
                      </div>
                      <div className={styles.optionItem}>
                        <span className={styles.checkboxSpan}>✓</span>
                        <span>Have been uploaded and approved with DSC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Point C */}
                <div className={styles.declPoint}>
                  <span className={styles.pointLetter}>C.</span>
                  <div className={styles.pointBody}>
                    In case the person was earlier a member of EPF Scheme, 1952 and EPS 1995;
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.65rem' }}>
                      <div className={styles.optionItem}>
                        <span className={styles.checkboxSpan}>✓</span>
                        <span>
                          The KYC details of the above member in the UAN database have been approved with Digital Signature Certificate and transfer request has been generated on portal
                        </span>
                      </div>
                      <div className={styles.optionItem}>
                        <span className={styles.checkboxSpan}></span>
                        <span>
                          As the DSC of establishment are not registered with EPFO, the member has been informed to file physical claim (Form-13) for transfer of funds from his previous establishment.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Employer Sign with Seal */}
              <div className={styles.signRow} style={{ marginTop: '3.5rem' }}>
                <div>
                  <div>Date : {todayStr}</div>
                  <div className={styles.sealBox}>
                    Official Seal / Stamp Area
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderBottom: '1px solid #000000', width: '260px', marginBottom: '6px' }}></div>
                  <strong>Signate of Employer with Seal of Establishment</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
