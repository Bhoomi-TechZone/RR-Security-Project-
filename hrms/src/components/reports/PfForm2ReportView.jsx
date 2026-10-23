import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  UserCheck,
  Users,
  Building,
  Layers,
} from 'lucide-react';
import { downloadPfForm2Pdf } from '../../utils/pfForm2Export';
import styles from './PfForm2ReportView.module.css';

/**
 * =========================================================================
 * STATUTORY PF FORM 2 (REVISED) - NOMINATION AND DECLARATION FORM VIEW
 * =========================================================================
 */
export default function PfForm2ReportView({
  reportData = {},
  filters = {},
  onSelectEmployee,
}) {
  const records = reportData?.records || [];
  const companyInfo = reportData?.companyInfo || {};

  const [selectedEmpId, setSelectedEmpId] = useState(
    records[0]?.employeeId || records[0]?.id || ''
  );
  const [activePageTab, setActivePageTab] = useState('both'); // 'both' | 'page1' | 'page2'

  const activeEmp =
    records.find((r) => r.employeeId === selectedEmpId || r.id === selectedEmpId) ||
    records[0] ||
    {};

  const companyName = (
    companyInfo?.name ||
    activeEmp.adminCompanyName ||
    'RR SECURITY & FACILITIES'
  ).toUpperCase();

  const companyAddress = (
    companyInfo?.address ||
    'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI - 110044'
  );

  const todayStr = new Date().toLocaleDateString('en-GB');

  const handleDownloadSinglePdf = () => {
    downloadPfForm2Pdf(activeEmp, companyInfo, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadPfForm2Pdf(activeEmp, companyInfo, { mode: 'print' });
  };

  const handleDownloadAllPdf = () => {
    downloadPfForm2Pdf(records, companyInfo, { mode: 'download' });
  };

  // Nominees & Family lists
  const epfNominees = activeEmp.epfNominees || [];
  const epsFamilyMembers = activeEmp.epsFamilyMembers || [];
  const epsNominees = activeEmp.epsNominees || [];

  return (
    <div className={styles.container}>
      {/* 1. Header Toolbar (Strictly PDF only) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.titleBadge}>
            <ShieldCheck size={18} className={styles.iconRed} />
            <div>
              <h2 className={styles.reportTitle}>PF-Form-2_Revised_</h2>
              <span className={styles.reportSubtitle}>Nomination and Declaration Form for EPF & EPS Schemes</span>
            </div>
          </span>

          {records.length > 0 && (
            <div className={styles.employeeSelectorWrap}>
              <UserCheck size={15} className={styles.selectIcon} />
              <select
                className={styles.employeeSelect}
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  if (onSelectEmployee) onSelectEmployee(e.target.value);
                }}
                title="Select Employee for Form 2"
              >
                {records.map((emp) => (
                  <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                    {emp.name} {emp.allottedPfNo ? `(${emp.allottedPfNo})` : `(${emp.employeeId})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleDownloadSinglePdf}
            title="Download Form 2 PDF for current employee"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={handlePrint}
            title="Print Form 2"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {records.length > 1 && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleDownloadAllPdf}
              title={`Download all ${records.length} Employees Form 2 PDFs`}
            >
              <Users size={15} />
              <span>Download All ({records.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={18} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Selected Member</div>
            <div className={styles.kpiValue}>{activeEmp.name || 'Staff Member'}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
            <Building size={18} />
          </div>
          <div>
            <div className={styles.kpiLabel}>PF Account No.</div>
            <div className={styles.kpiValue}>{activeEmp.allottedPfNo || 'Active'}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#fef3c7', color: '#d97706' }}>
            <Layers size={18} />
          </div>
          <div>
            <div className={styles.kpiLabel}>EPF Nominees (Part A)</div>
            <div className={styles.kpiValue}>
              {epfNominees.length > 0 ? `${epfNominees.length} Registered` : 'Self / Dependent'}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className={styles.kpiLabel}>EPS Family Members (Part B)</div>
            <div className={styles.kpiValue}>
              {epsFamilyMembers.length > 0 ? `${epsFamilyMembers.length} Members` : '1 Nominee'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Page View Switcher Tabs */}
      <div className={styles.viewTabContainer}>
        <button
          type="button"
          className={`${styles.viewTab} ${activePageTab === 'both' ? styles.viewTabActive : ''}`}
          onClick={() => setActivePageTab('both')}
        >
          Both Pages (Full Statutory Form)
        </button>
        <button
          type="button"
          className={`${styles.viewTab} ${activePageTab === 'page1' ? styles.viewTabActive : ''}`}
          onClick={() => setActivePageTab('page1')}
        >
          Page 1: Member & PART A (EPF)
        </button>
        <button
          type="button"
          className={`${styles.viewTab} ${activePageTab === 'page2' ? styles.viewTabActive : ''}`}
          onClick={() => setActivePageTab('page2')}
        >
          Page 2: PART B (EPS) & Employer Certificate
        </button>
      </div>

      {/* 4. Document Preview Sheets */}
      <div className={styles.previewContainer}>
        {/* ======================= PAGE 1 PREVIEW ======================= */}
        {(activePageTab === 'both' || activePageTab === 'page1') && (
          <div className={styles.paperSheet}>
            <div className={styles.pageBadge}>Page 1 of 2</div>

            {/* Boxed Title */}
            <div className={styles.boxTitleWrapper}>
              <div className={styles.formNoBox}>FORM NO. 2 (Revised)</div>
              <div className={styles.formMainTitle}>NOMINATION AND DECLARATION FORM</div>
              <div className={styles.formSubHead}>(For Unexempted/Exempted Establishment)</div>
              <div className={styles.formDesc}>
                Declaration and Nomination Form under the Employees Provident Fund & Employees Pension Scheme
              </div>
              <div className={styles.formSchemePara}>
                (Paragraph 33 and 61 (1) of the Employees Provident Fund Scheme, 1952 & Paragraph 18 of the Employees Pension Scheme, 1995)
              </div>
            </div>

            {/* Personal Details */}
            <div className={styles.detailsSection}>
              <div className={styles.fieldLine}>
                <span className={styles.fieldLabel}>1. Name</span>
                <span className={styles.fieldValueUnderline}>{activeEmp.name || ''}</span>
              </div>
              <div className={styles.capitalSubtext}>(In capital letters)</div>

              <div className={styles.fieldLine}>
                <span className={styles.fieldLabel}>2. S/o, W/o, D/o Name</span>
                <span className={styles.fieldValueUnderline}>{activeEmp.fatherHusbandName || '—'}</span>
              </div>

              <div className={styles.fieldRow3}>
                <div className={styles.fieldLineFlex}>
                  <span className={styles.fieldLabel}>3. Date of Birth</span>
                  <span className={styles.fieldValueUnderline}>{activeEmp.dob || '—'}</span>
                </div>
                <div className={styles.fieldLineFlex}>
                  <span className={styles.fieldLabel}>4. Sex</span>
                  <span className={styles.fieldValueUnderline}>{activeEmp.gender || 'MALE'}</span>
                </div>
                <div className={styles.fieldLineFlex}>
                  <span className={styles.fieldLabel}>5. Date of Joining</span>
                  <span className={styles.fieldValueUnderline}>{activeEmp.joiningDate || '—'}</span>
                </div>
              </div>

              <div className={styles.fieldRow2}>
                <div className={styles.fieldLineFlex}>
                  <span className={styles.fieldLabel}>6. Marital Status</span>
                  <span className={styles.fieldValueUnderline}>{activeEmp.maritalStatus || 'MARRIED'}</span>
                </div>
                <div className={styles.fieldLineFlex}>
                  <span className={styles.fieldLabel}>7. P.F. Account No.</span>
                  <span className={styles.fieldValueUnderline}>{activeEmp.allottedPfNo || '—'}</span>
                </div>
              </div>

              <div className={styles.fieldLine}>
                <span className={styles.fieldLabel}>8. (A) Address Permanent</span>
                <span className={styles.fieldValueUnderline}>{activeEmp.permanentAddress || '—'}</span>
              </div>
              <div className={styles.underlineBlankLine}></div>

              <div className={styles.fieldLine}>
                <span className={styles.fieldLabel} style={{ paddingLeft: '1.25rem' }}>(B) Address Temporary</span>
                <span className={styles.fieldValueUnderline}>{activeEmp.temporaryAddress || '—'}</span>
              </div>
              <div className={styles.underlineBlankLine}></div>
            </div>

            {/* PART A (EPF) Header */}
            <div className={styles.sectionHeader}>PART A (EPF)</div>

            {/* Part A Table */}
            <table className={styles.statutoryTable}>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Name of the Nominee/Nominees</th>
                  <th style={{ width: '27%' }}>Address</th>
                  <th style={{ width: '13%' }}>Nominees relation with the member</th>
                  <th style={{ width: '11%' }}>Date of Birth</th>
                  <th style={{ width: '15%' }}>Total amount of share of Accumulation in PF to be paid to each Nominee</th>
                  <th style={{ width: '16%' }}>If the Nominee is a minor, Name & Relationship & Address of the guardian who may receive the amount during minority of nominee</th>
                </tr>
                <tr className={styles.colNumberRow}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                </tr>
              </thead>
              <tbody>
                {epfNominees.length > 0 ? (
                  epfNominees.map((nom, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellBold}>{nom.name}</td>
                      <td>{nom.address}</td>
                      <td className={styles.cellCenter}>{nom.relation}</td>
                      <td className={styles.cellCenter}>{nom.dob}</td>
                      <td className={styles.cellCenterBold}>{nom.share}</td>
                      <td>{nom.guardianInfo || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.cellBold}>{activeEmp.spouseName || activeEmp.fatherHusbandName || 'Nominee As Per Declaration'}</td>
                    <td>{activeEmp.permanentAddress || '—'}</td>
                    <td className={styles.cellCenter}>{activeEmp.isSpouse ? 'Spouse' : 'Father / Dependent'}</td>
                    <td className={styles.cellCenter}>—</td>
                    <td className={styles.cellCenterBold}>100%</td>
                    <td>—</td>
                  </tr>
                )}
                {/* Visual Empty Rows matching blank document lines */}
                {Array.from({ length: Math.max(0, 5 - (epfNominees.length || 1)) }).map((_, i) => (
                  <tr key={`blank-a-${i}`} className={styles.blankRow}>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Page 1 Declarations */}
            <div className={styles.declarationList}>
              <div>
                1. &nbsp; *Certified that I have no family as defined in para 2(g) of the Employee's Provident Fund Scheme, 1952 and should I acquire a family hereafter the above nomination should be deemed as cancelled.
              </div>
              <div style={{ marginTop: '0.35rem' }}>
                2. &nbsp; *Certified that my father/mother is/are dependent upon me.
              </div>
            </div>

            {/* Page 1 Signatures */}
            <div className={styles.signatureFooterRow}>
              <div>*Strike out whichever is not applicable</div>
              <div>Signature or thumb impression of the subscriber</div>
            </div>
          </div>
        )}

        {/* ======================= PAGE 2 PREVIEW ======================= */}
        {(activePageTab === 'both' || activePageTab === 'page2') && (
          <div className={styles.paperSheet} style={{ marginTop: activePageTab === 'both' ? '2rem' : '0' }}>
            <div className={styles.pageBadge}>Page 2 of 2</div>

            {/* PART B (EPS) Header */}
            <div className={styles.sectionHeader} style={{ marginTop: '0.5rem' }}>PART B (EPS) (Para 18)</div>
            <div className={styles.paraStatement}>
              I hereby furnish below particulars of the members of my family who would be eligible to receive widow children pension in the event of my death.
            </div>

            {/* Part B Table 1 */}
            <table className={styles.statutoryTable}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width: '8%' }}>Sl. No.</th>
                  <th colSpan="2" style={{ width: '60%' }}>Name and Address of the Family member(s)</th>
                  <th rowSpan="2" style={{ width: '16%' }}>Date of Birth</th>
                  <th rowSpan="2" style={{ width: '16%' }}>Relationship with member</th>
                </tr>
                <tr>
                  <th style={{ width: '28%' }}>Name</th>
                  <th style={{ width: '32%' }}>Address</th>
                </tr>
                <tr className={styles.colNumberRow}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                </tr>
              </thead>
              <tbody>
                {epsFamilyMembers.length > 0 ? (
                  epsFamilyMembers.map((fam, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellCenter}>{fam.slNo || idx + 1}</td>
                      <td className={styles.cellBold}>{fam.name}</td>
                      <td>{fam.address}</td>
                      <td className={styles.cellCenter}>{fam.dob}</td>
                      <td className={styles.cellCenter}>{fam.relation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.cellCenter}>1</td>
                    <td className={styles.cellBold}>{activeEmp.spouseName || activeEmp.fatherHusbandName || 'Eligible Family Member'}</td>
                    <td>{activeEmp.permanentAddress || '—'}</td>
                    <td className={styles.cellCenter}>—</td>
                    <td className={styles.cellCenter}>{activeEmp.isSpouse ? 'Spouse' : 'Dependent'}</td>
                  </tr>
                )}
                {/* Visual Empty Rows */}
                {Array.from({ length: Math.max(0, 4 - (epsFamilyMembers.length || 1)) }).map((_, i) => (
                  <tr key={`blank-b1-${i}`} className={styles.blankRow}>
                    <td className={styles.cellCenter}>{epsFamilyMembers.length + i + 1}</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Part B Clause */}
            <div className={styles.paraStatement} style={{ marginTop: '0.85rem' }}>
              ** Certified that I have no family as defined in Para 2 (vii) of Employees' Pension Sheme, 1995 and should I acquire a family hereafter I shall furnish particulars thereon in the above form.
              <br />
              I hereby nominate the following person for receiving the monthly pension (admissible under Para 16 2(a) (i) & (ii) in event of my death without leaving any eligible family member for receiving pension.
            </div>

            {/* Part B Table 2 */}
            <table className={styles.statutoryTable}>
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>Sl. No.</th>
                  <th style={{ width: '50%' }}>Name & address of the Nominee</th>
                  <th style={{ width: '18%' }}>Date of birth</th>
                  <th style={{ width: '24%' }}>Relationship with the member.</th>
                </tr>
                <tr className={styles.colNumberRow}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                </tr>
              </thead>
              <tbody>
                {epsNominees.length > 0 ? (
                  epsNominees.map((nom, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellCenter}>{nom.slNo || idx + 1}</td>
                      <td>{nom.nameAndAddress}</td>
                      <td className={styles.cellCenter}>{nom.dob}</td>
                      <td className={styles.cellCenter}>{nom.relation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.cellCenter}>1</td>
                    <td>{activeEmp.spouseName || activeEmp.fatherHusbandName || 'Nominee'}, {activeEmp.permanentAddress || '—'}</td>
                    <td className={styles.cellCenter}>—</td>
                    <td className={styles.cellCenter}>{activeEmp.isSpouse ? 'Spouse' : 'Dependent'}</td>
                  </tr>
                )}
                {Array.from({ length: Math.max(0, 4 - (epsNominees.length || 1)) }).map((_, i) => (
                  <tr key={`blank-b2-${i}`} className={styles.blankRow}>
                    <td className={styles.cellCenter}>{epsNominees.length + i + 1}</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Date & Subscriber Signature */}
            <div className={styles.signatureFooterRow} style={{ marginTop: '1.25rem' }}>
              <div>Date : - {todayStr}</div>
              <div>Signature or thumb impression of the subscriber</div>
            </div>

            {/* CERTIFICATE BY EMPLOYER */}
            <div className={styles.certificateEmployerBox}>
              <div className={styles.certEmployerTitle}>CERTIFICATE BY EMPLOYER</div>
              <div className={styles.certEmployerText}>
                Certified that the above declaration and nomination has been signed/thumb impressed before me by Shri/Smt./Kum <strong>{activeEmp.name || '____________________________________'}</strong> employed in my establishment after he/she has read the entries have read over to him/her by me and got confirmed by him/her.
              </div>

              <div className={styles.certGrid}>
                <div className={styles.certGridLeft}>
                  <div>Place : <strong>{companyInfo.city || 'Delhi'}</strong></div>
                  <div style={{ marginTop: '1.25rem' }}>Dated :- <strong>{todayStr}</strong></div>
                </div>

                <div className={styles.certGridRight}>
                  <div>Signature of the employer or other</div>
                  <div>Authorized officers of the establishment :- _______________________</div>
                  <div style={{ marginTop: '0.45rem' }}>Designation :- <strong>Authorized Signatory</strong></div>
                  <div style={{ marginTop: '0.45rem' }}>Name and address of the factory / Establishment or rubber stamp there of :</div>
                  <div className={styles.certCompanyBold}>{companyName}</div>
                  <div className={styles.certAddressText}>{companyAddress}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
