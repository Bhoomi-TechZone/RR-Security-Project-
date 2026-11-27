import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  HelpCircle,
  Download,
  Trash2,
  X,
  Check,
  Eye
} from 'lucide-react';
import styles from './LetterInboxStep.module.css';
import { useCompany } from '../../context/CompanyContext';
import letterService from '../../services/letterService';
import { generateLetterPdf } from '../../utils/letterPdfUtil';
import { LETTER_TYPES } from '../../data/letterManagementData';

/**
 * Formats a date string into "12-Nov-2026"
 */
function formatDisplayDate(dateVal) {
  if (!dateVal) return '12-Nov-2026';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateVal;
  }
}

function LetterInboxStep({ data, employee }) {
  const { activeCompany } = useCompany();
  const companyId = data?.companyId || activeCompany?.companyId || activeCompany?.id || '';
  const companyName = activeCompany?.name || data?.companyName || 'RR Security & Facilities';
  const companyAddress = activeCompany?.address || '';

  const employeeCode = data?.employeeCode || data?.employeeId || employee?.employeeCode || employee?.employeeId || '';
  const employeeName = data?.name || employee?.name || '';
  const designation = data?.designation || employee?.designation || '';
  const department = data?.department || employee?.department || '';
  const joiningDate = data?.joiningDate || employee?.joiningDate || '';
  const grossSalary = data?.grossSalary || employee?.grossSalary || 0;

  const storageKey = `novaspark_letters_emp_${employeeCode}`;

  const cleanCode = String(employeeCode).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const cleanName = String(employeeName).trim().replace(/\s+/g, '_').toUpperCase();

  // Helper to construct title
  const getLetterTitle = (letter) => {
    if (letter.displayTitle) return letter.displayTitle.replace(/\s*\[SAMPLE\]/gi, '');
    const typeObj = LETTER_TYPES.find(t => t.id === letter.letterType);
    const typeName = (typeObj?.name || letter.templateName || 'Appointment Letter').toUpperCase();
    const dateStr = formatDisplayDate(letter.issueDate || letter.createdAt);
    return `${typeName} generated on ${dateStr}`;
  };

  // Helper to construct filename
  const getLetterFileName = (letter) => {
    if (letter.fileName) return letter.fileName.replace(/_SAMPLE_/gi, '_');
    const typePrefix = (letter.letterType || 'APPOINTMENT_LETTER').replace(/-/g, '_').toUpperCase();
    return `${typePrefix}_${cleanCode || 'EMP'}_${cleanName || 'DOCUMENT'}.PDF`;
  };

  // Dynamic Initial Letters (NO static fake samples!)
  const getInitialLetters = () => {
    try {
      if (Array.isArray(data?.letters) && data.letters.length > 0) {
        return data.letters;
      }
      if (Array.isArray(employee?.letters) && employee.letters.length > 0) {
        return employee.letters;
      }
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  };

  const [letters, setLetters] = useState(getInitialLetters);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [previewLetter, setPreviewLetter] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State for new Letter
  const [formLetterType, setFormLetterType] = useState('appointment-letter');
  const [formRefNo, setFormRefNo] = useState('');
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDesignation, setFormDesignation] = useState(designation);
  const [formDepartment, setFormDepartment] = useState(department);
  const [formSalary, setFormSalary] = useState(grossSalary);
  const [formSignatory, setFormSignatory] = useState('Authorized Signatory');

  // Sync dynamically with backend
  useEffect(() => {
    let isMounted = true;
    const fetchBackendLetters = async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        const res = await letterService.getLetters(companyId, { employeeCode });
        const allLetters = (res && Array.isArray(res.letters)) ? res.letters : [];

        // Check localStorage as well
        let localLetters = [];
        try {
          const s1 = localStorage.getItem('novaspark_issued_letters');
          if (s1) {
            const parsed = JSON.parse(s1);
            if (Array.isArray(parsed)) localLetters.push(...parsed);
          }
          const s2 = localStorage.getItem(`novaspark_letters_emp_${employeeCode}`);
          if (s2) {
            const parsed = JSON.parse(s2);
            if (Array.isArray(parsed)) localLetters.push(...parsed);
          }
        } catch {}

        const combined = [...allLetters, ...localLetters];

        const isMatch = (l) => {
          if (!l) return false;
          const lCode = String(l.employeeCode || l.employeeId || '').toLowerCase().trim();
          const eCode = String(employeeCode || '').toLowerCase().trim();
          const lName = String(l.employeeName || '').toLowerCase().trim();
          const eName = String(employeeName || '').toLowerCase().trim();

          const normLCode = lCode.replace(/[^a-z0-9]/g, '');
          const normECode = eCode.replace(/[^a-z0-9]/g, '');

          if (normECode && normLCode && (normLCode === normECode || normLCode.includes(normECode) || normECode.includes(normLCode))) {
            return true;
          }
          if (eName && lName && (lName === eName || lName.includes(eName) || eName.includes(lName))) {
            return true;
          }
          return false;
        };

        const matched = combined.filter(isMatch);
        if (isMounted) {
          // Deduplicate by refNo or id
          const seen = new Set();
          const deduped = [];
          for (const item of matched) {
            const key = item.refNo || item.letterId || item.id || item._id;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push({
                ...item,
                isHidden: item.isHidden !== false,
                displayTitle: item.displayTitle ? item.displayTitle.replace(/\s*\[SAMPLE\]/gi, '') : undefined,
                fileName: item.fileName ? item.fileName.replace(/_SAMPLE_/gi, '_') : undefined,
                issueDate: item.issueDate || item.createdAt || ''
              });
            }
          }
          setLetters(deduped);
          if (deduped.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(deduped));
          }
        }
      } catch (err) {
        console.warn('Letter inbox sync notice:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBackendLetters();
    return () => { isMounted = false; };
  }, [companyId, employeeCode, employeeName, storageKey]);

  // Toggle Hidden / Visible
  const handleToggleHidden = (letterId) => {
    const updated = letters.map(l => {
      if ((l.id || l.letterId) === letterId) {
        return {
          ...l,
          isHidden: !l.isHidden
        };
      }
      return l;
    });
    setLetters(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Delete Letter
  const handleDeleteLetter = (letterId) => {
    const letter = letters.find(l => (l.id || l.letterId) === letterId);
    const letterName = letter?.templateName || 'this letter';
    if (!window.confirm(`Are you sure you want to delete ${letterName}?`)) return;

    const updated = letters.filter(l => (l.id || l.letterId) !== letterId);
    setLetters(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    try {
      if (companyId) {
        letterService.deleteLetter(companyId, letterId).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  // Open Issue Modal
  const handleOpenIssueModal = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormRefNo(`RRS/LET/${new Date().getFullYear()}/${randomNum}`);
    setFormIssueDate(new Date().toISOString().split('T')[0]);
    setFormDesignation(designation);
    setFormDepartment(department);
    setFormSalary(grossSalary);
    setIsIssueModalOpen(true);
  };

  // Save Issued Letter
  const handleSaveIssueLetter = async (e) => {
    e?.preventDefault();

    const typeConfig = LETTER_TYPES.find(t => t.id === formLetterType) || LETTER_TYPES[0];
    const newId = `LET-${Date.now()}`;
    const dateFormatted = formatDisplayDate(formIssueDate);
    const newLetter = {
      id: newId,
      letterId: newId,
      refNo: formRefNo || `RRS/LET/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      letterType: formLetterType,
      templateName: typeConfig.name,
      issueDate: formIssueDate,
      isHidden: true,
      displayTitle: `${typeConfig.name.toUpperCase()} generated on ${dateFormatted}`,
      fileName: `${formLetterType.replace(/-/g, '_').toUpperCase()}_${cleanCode || 'EMP'}_${cleanName || 'DOC'}.PDF`,
      employeeId: employeeCode,
      employeeCode,
      employeeName,
      designation: formDesignation,
      department: formDepartment,
      monthlySalary: formSalary,
      signatory: formSignatory,
      status: 'Issued',
      content: `With reference to your engagement, we are pleased to issue this ${typeConfig.name} for the position of ${formDesignation} in ${companyName}.\n\nYour compensation will be governed by company policy and offer terms.`
    };

    const updated = [newLetter, ...letters];
    setLetters(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    try {
      await letterService.createLetter(companyId, newLetter);
    } catch {
      // ignore
    }

    setIsIssueModalOpen(false);
  };

  // Download PDF
  const handleDownloadPdf = async (letter) => {
    try {
      setIsGeneratingPdf(true);
      const companyConfig = {
        name: companyName,
        address: companyAddress,
        phone: activeCompany?.phone || '+91 98765 43210',
        email: activeCompany?.email || 'admin@rrsecurity.com',
        gstin: activeCompany?.gstin || '',
        pan: activeCompany?.pan || '',
        logo: activeCompany?.logo || null
      };
      await generateLetterPdf(letter, companyConfig);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPreviewLetter(letter);
      setTimeout(() => window.print(), 300);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Letter Inbox</h3>
          <p className={styles.headerSubtitle}>
            Issued letters, official appointments, and certificates for this employee.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View letter documentation"
          >
            <HelpCircle size={15} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. LETTERS LIST (CARD ROWS MATCHING USER SCREENSHOT)
         ======================================================== */}
      <div className={styles.lettersList}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px 20px',
            gap: '12px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
              Loading employee letters...
            </span>
          </div>
        ) : letters.length > 0 ? (
          letters.map((letter) => {
            const letterId = letter.id || letter.letterId;
            const isHidden = letter.isHidden !== false;
            const title = getLetterTitle(letter);
            const fileName = getLetterFileName(letter);

            return (
              <div key={letterId} className={styles.letterCard}>
                {/* Left Side: Title & Filename */}
                <div className={styles.letterInfo}>
                  <div
                    className={styles.letterTitle}
                    onClick={() => setPreviewLetter(letter)}
                    title="Click to view letterhead preview"
                  >
                    {title}
                  </div>
                  <div className={styles.letterFileName}>
                    {fileName}
                  </div>
                </div>

                {/* Middle: Toggle Switch (Hidden / Visible) */}
                <div className={styles.toggleWrapper}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isHidden}
                    className={`${styles.toggleSwitch} ${!isHidden ? styles.toggleSwitchActive : ''}`}
                    onClick={() => handleToggleHidden(letterId)}
                    title={isHidden ? 'Currently hidden from employee portal' : 'Visible on employee portal'}
                  >
                    <span className={`${styles.toggleKnob} ${!isHidden ? styles.toggleKnobActive : ''}`} />
                  </button>
                  <span className={styles.toggleLabel}>
                    {isHidden ? 'Hidden' : 'Visible'}
                  </span>
                </div>

                {/* Right Side: Download & Delete Buttons */}
                <div className={styles.letterActions}>
                  <button
                    type="button"
                    className={styles.downloadBtn}
                    onClick={() => handleDownloadPdf(letter)}
                    disabled={isGeneratingPdf}
                    title="Download Letter PDF"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteLetter(letterId)}
                    title="Delete Letter"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '14px' }}>
              No letters issued to this employee yet.
            </p>
            <p style={{ margin: '6px 0 16px', color: '#64748b', fontSize: '13px' }}>
              Click "+ Issue Letter" to generate an appointment, joining, increment, or confirmation letter.
            </p>
            <button
              type="button"
              className={styles.issueBtn}
              onClick={handleOpenIssueModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={15} />
              <span>Issue Letter</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          3. ISSUE LETTER MODAL
         ======================================================== */}
      {isIssueModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsIssueModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Issue Letter to {employeeName}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsIssueModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIssueLetter}>
              <div className={styles.modalBody}>
                {/* Row 1: Letter Type & Reference Number */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Letter Type</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formLetterType}
                      onChange={(e) => setFormLetterType(e.target.value)}
                      required
                    >
                      {LETTER_TYPES.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Reference No.</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formRefNo}
                      onChange={(e) => setFormRefNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Issue Date & Salary */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Issue Date</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formIssueDate}
                      onChange={(e) => setFormIssueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Monthly Gross CTC (₹)</span>
                    </label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 3: Designation & Department */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Designation</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Department</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 4: Signatory */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Authorized Signatory</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formSignatory}
                    onChange={(e) => setFormSignatory(e.target.value)}
                    placeholder="e.g. Authorized Signatory, HR Dept"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsIssueModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                >
                  <Check size={14} />
                  <span>Issue Letter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. VIEW LETTERHEAD PREVIEW MODAL
         ======================================================== */}
      {previewLetter && (
        <div className={styles.modalOverlay} onClick={() => setPreviewLetter(null)}>
          <div className={`${styles.modalContent} ${styles.previewModalContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {previewLetter.templateName || 'Official Letter'} - {previewLetter.refNo}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={() => handleDownloadPdf(previewLetter)}
                  title="Download PDF"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setPreviewLetter(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.letterheadContainer}>
                {/* Company Header */}
                <div className={styles.letterheadHeader}>
                  <div>
                    <h2 className={styles.companyName}>{companyName}</h2>
                    <p className={styles.companyMeta}>{companyAddress}</p>
                    <p className={styles.companyMeta}>
                      Phone: {activeCompany?.phone || '+91 98765 43210'} | Email: {activeCompany?.email || 'admin@rrsecurity.com'}
                    </p>
                  </div>
                </div>

                {/* Letter Metadata */}
                <div className={styles.letterMetaRow}>
                  <div><strong>Ref:</strong> {previewLetter.refNo}</div>
                  <div><strong>Date:</strong> {formatDisplayDate(previewLetter.issueDate)}</div>
                </div>

                {/* Recipient */}
                <div style={{ marginBottom: '18px', fontSize: '13px' }}>
                  <div>To,</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{employeeName}</div>
                  <div>Employee Code: {employeeCode || '—'}</div>
                  <div>Designation: {previewLetter.designation || designation}</div>
                  <div>Department: {previewLetter.department || department}</div>
                </div>

                {/* Subject */}
                <div className={styles.letterSubject}>
                  SUB: {(previewLetter.templateName || 'Appointment Letter').toUpperCase()}
                </div>

                {/* Letter Body */}
                <div className={styles.letterBodyText}>
                  {previewLetter.content}
                </div>

                {/* Signature Block */}
                <div className={styles.signatureSection}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.signatureLine} />
                    <strong>Employee Signature</strong>
                    <div>{employeeName}</div>
                  </div>

                  <div className={styles.signatureBlock} style={{ textAlign: 'right' }}>
                    <div className={styles.signatureLine} style={{ marginLeft: 'auto' }} />
                    <strong>For {companyName}</strong>
                    <div>{previewLetter.signatory || 'Authorized Signatory'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LetterInboxStep;
