import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Users,
  ShieldCheck,
  Clock,
  Building,
} from 'lucide-react';
import {
  downloadEsicForm3Pdf,
  downloadEsicForm3Excel,
  downloadEsicForm3Csv,
} from '../../utils/esicForm3Export';
import styles from './EsicForm3ReportView.module.css';

/**
 * =========================================================================
 * ESIC FORM 3 RETURN OF DECLARATION FORM VIEW
 * Statutory component matching the exact bilingual template in Images 2 & 3:
 * - Header: ESIC Emblem, Title, Form 3 / In Duplicate
 * - Establishment Details: Name & Address
 * - Employer's Code No. (Box grid)
 * - Statutory Declaration (Bilingual)
 * - Metadata row: Place, Date, Local Office, Signature, Designation
 * - 5-Column Table: S. No., Name of Employee, Distinguishing No., Father's Name, Insurance No.
 * - Footer: Encl. Declaration Form / P.T.O. / Continuation
 * =========================================================================
 */
export default function EsicForm3ReportView({
  reportData = {},
  filters = {},
}) {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};
  const totals = safeData.totals || {};

  const companyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = clientInfo?.address || companyInfo?.address || 'G-75/A, BLOCK-G M.B.EXTN., BADARPUR NEW DELHI-110044';
  const employerCode = companyInfo?.employerCode || '20001853160000999';
  const place = companyInfo?.place || 'New Delhi';
  const localOffice = companyInfo?.localOffice || 'Local Office Badarpur / Okhla, New Delhi';
  const declarationDate = companyInfo?.date || period.declarationDate || '01/10/2026';
  const designation = companyInfo?.designation || 'Authorized Signatory';

  const codeDigits = employerCode.padEnd(17, ' ').slice(0, 17).split('');

  const handleDownloadPdf = async () => {
    await downloadEsicForm3Pdf(safeData, { mode: 'download' });
  };

  const handlePrint = async () => {
    await downloadEsicForm3Pdf(safeData, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsicForm3Excel(safeData);
  };

  const handleDownloadCsv = () => {
    downloadEsicForm3Csv(safeData);
  };

  return (
    <div className={styles.container}>
      {/* 1. Quick KPI Summary Badges */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Declarations</span>
            <span className={styles.kpiValue}>{totals.totalEmployees ?? records.length} Employees</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <Users size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>IP Numbers Allotted</span>
            <span className={styles.kpiValue}>{totals.allottedInsuranceCount ?? 0} Allotted</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Pending Allotment</span>
            <span className={styles.kpiValue}>{totals.pendingInsuranceCount ?? 0} Pending</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconOrange}`}>
            <Clock size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Employer Code</span>
            <span className={styles.kpiValue}>{employerCode}</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconIndigo}`}>
            <Building size={20} />
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className={styles.actionBar}>
        <div className={styles.actionTitle}>
          <FileText size={18} color="#2563eb" />
          <span>ESIC Form 3 Return of Declaration Form (Regulation 14)</span>
        </div>
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleDownloadPdf}
            title="Download official bilingual statutory PDF"
          >
            <Download size={14} />
            Download PDF
          </button>
          <button
            type="button"
            className={styles.btnSuccess}
            onClick={handleDownloadExcel}
            title="Download Excel Workbook"
          >
            <FileSpreadsheet size={14} />
            Download Excel
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handleDownloadCsv}
            title="Download CSV"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handlePrint}
            title="Print Declaration Return"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* 3. Official Printable Paper Document Container */}
      <div className={styles.paperCard}>
        {/* Header Block */}
        <div className={styles.formHeader}>
          {/* Left Emblem */}
          <div className={styles.emblemWrapper}>
            <div className={styles.emblemCircle}>
              <span className={styles.emblemText}>ESIC</span>
              <span className={styles.emblemSub}>सुरक्षा SOCIAL</span>
            </div>
          </div>

          {/* Center Titles */}
          <div className={styles.headerTitleBlock}>
            <div className={styles.hindiOrg}>कर्मचारी राज्य बीमा निगम</div>
            <div className={styles.engOrg}>EMPLOYEES’ STATE INSURANCE CORPORATION</div>
            <div className={styles.formSubtitle}>
              घोषणा पत्र विवरणी Return of Declaration Form
            </div>
            <div className={styles.regulationTag}>[विनियम Regulation 14]</div>
          </div>

          {/* Right Reference */}
          <div className={styles.headerRightBlock}>
            <div>दो प्रतियों में &nbsp; In Duplicate</div>
            <div>प्रपत्र ३ &nbsp; Form 3</div>
          </div>
        </div>

        {/* Establishment Details */}
        <div className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>
            कारखाने या प्रतिष्ठान का नाम तथा पता / Name & Address of factory or Establishment:&nbsp;
          </span>
          <span className={styles.fieldDottedValue}>
            {companyName}, {companyAddress}
          </span>
        </div>

        {/* Employer's Code No. Boxed Grid */}
        <div className={styles.codeRow}>
          <span className={styles.codeLabel}>
            नियोजक कूट संख्या / Employer's Code No.:
          </span>
          <div className={styles.codeBoxGrid}>
            {codeDigits.map((char, i) => (
              <div key={i} className={styles.codeDigitBox}>
                {char.trim()}
              </div>
            ))}
          </div>
        </div>

        {/* Statutory Declaration Paragraph (Bilingual) */}
        <div className={styles.declarationBlock}>
          <div className={styles.declarationHindi}>
            मैं इनके साथ नीचे दिये हुए कर्मचारियों के घोषणा पत्र आपकी सेवा में प्रेषित करता हूं। मैं एतद्द्वारा घोषित करता हूं कि मैं कर्मचारी राज्य बीमा निगम अधिनियम १९४८ की धारा २(६) की परिभाषा के अन्तर्गत प्रत्येक कर्मचारी जो इस कारखाने या प्रतिष्ठान में दिनांक <strong>{declarationDate}</strong> को कार्य कर रहे हैं और रु १०,०००/- से अधिक पारिश्रमिक (अतिरिक्त कार्यकाल का पारिश्रमिक छोड़कर) प्रतिमाह नहीं पा रहे हैं इस सूची में सम्मिलित कर लिया गया है (केवल उन्हें छोड़कर जिनके घोषणा पत्र निगम को पहले ही भेजे जा चुके हैं)
          </div>
          <div className={styles.declarationEng}>
            I send herewith Declaration Forms in respect of the employees mentioned below. I hereby declare that every person employed as an employee within the meaning of Section 2(9) of the Employees' State Insurance Act, 1948 on <strong>{declarationDate}</strong> in this factory or establishment and in respect of a remuneration not exceeding the statutory wage ceiling (excluding remuneration for overtime work) per month has been included in this list (excepting only those in respect of whom declaration forms have been sent to the Corporation in the past).
          </div>
        </div>

        {/* Place, Date, Local Office, Signature Grid */}
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>स्थान Place:</span>
            <span className={styles.metaVal}>{place}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>स्थानीय कार्यालय Local Office:</span>
            <span className={styles.metaVal}>{localOffice}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>हस्ताक्षर Signature:</span>
            <span className={styles.metaVal} style={{ fontStyle: 'italic' }}>Authorized Signatory</span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>दिनांक Date:</span>
            <span className={styles.metaVal}>{declarationDate}</span>
          </div>
          <div className={styles.metaItem}></div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>पद Designation:</span>
            <span className={styles.metaVal}>{designation}</span>
          </div>
        </div>

        {/* 5-Column Statutory Table Matching Images 2 & 3 */}
        <div className={styles.tableWrap}>
          <table className={styles.statutoryTable}>
            <thead>
              <tr>
                <th style={{ width: '6%' }}>
                  <span className={styles.thHindi}>क्र. सं.</span>
                  <span className={styles.thEng}>S. No.</span>
                </th>
                <th style={{ width: '28%', textAlign: 'left' }}>
                  <span className={styles.thHindi}>कर्मचारी का नाम</span>
                  <span className={styles.thEng}>Name of the Employee</span>
                </th>
                <th style={{ width: '20%' }}>
                  <span className={styles.thHindi}>नियोजक के पास पहचान संख्या यदि हो</span>
                  <span className={styles.thEng}>Distinguishing No. with the employer if any</span>
                </th>
                <th style={{ width: '24%', textAlign: 'left' }}>
                  <span className={styles.thHindi}>पिता या पति का नाम</span>
                  <span className={styles.thEng}>Father's or Husband's Name</span>
                </th>
                <th style={{ width: '22%' }}>
                  <span className={styles.thHindi}>निगम द्वारा नियत बीमांक (स्थानीय कार्यालय से अंकित होना चाहिए)</span>
                  <span className={styles.thEng}>Insurance No. allotted by the Corporation (to be entered at Local Office)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No declaration records found for the selected period.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.distinguishingNo ? `${r.distinguishingNo}-${idx}` : `form3-${idx}`}>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.srNo || idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.employeeName}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.distinguishingNo || '—'}
                    </td>
                    <td>{r.fatherHusbandName || '—'}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.insuranceNo ? (
                        <span style={{ color: '#166534' }}>{r.insuranceNo}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending Allotment</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Document Statutory Footers */}
        <div className={styles.docBottomFooter}>
          <span>संलग्न घोषणा पत्र Encl. Declaration Form</span>
          <span>P.T.O. / अग्रिम पृष्ठ Continuation</span>
        </div>
      </div>
    </div>
  );
}
