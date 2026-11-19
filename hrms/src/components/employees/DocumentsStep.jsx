import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  HelpCircle,
  Download,
  Trash2,
  X,
  Check,
  Eye,
  Upload
} from 'lucide-react';
import styles from './DocumentsStep.module.css';

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

const DEFAULT_DOC_TYPES = [
  'Driving License',
  'Commercial Driving License',
  'Arms / Gun License',
  'Aadhaar Card',
  'PAN Card',
  'Voter ID Card',
  'Passport',
  'Bank Passbook / Cheque',
  'Police Verification Report',
  'Educational Certificate',
  'Experience Certificate',
  'Medical Fitness Certificate',
  'Other Document'
];

function DocumentsStep({ data, onChange, designation, documentTypes = [] }) {
  const employeeCode = data?.employeeCode || data?.employeeId || 'RR-020';
  const employeeName = data?.name || 'Ramesh Kumar';
  const cleanCode = String(employeeCode).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const cleanName = String(employeeName).trim().replace(/\s+/g, '_').toUpperCase();

  const storageKey = `novaspark_documents_emp_${employeeCode}`;

  // Master document types list
  const availableDocTypes = useMemo(() => {
    if (documentTypes && documentTypes.length > 0) {
      const custom = documentTypes
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active')
        .map(d => (typeof d === 'string' ? d : d.name || d.documentName || d));
      return Array.from(new Set([...custom, ...DEFAULT_DOC_TYPES]));
    }
    return DEFAULT_DOC_TYPES;
  }, [documentTypes]);

  // Initial compilation of documents
  const getInitialDocs = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}

    const list = [];

    // From licenseList
    if (Array.isArray(data.licenseList) && data.licenseList.length > 0) {
      data.licenseList.forEach((lic, idx) => {
        if (lic.licenseNo || lic.photo || lic.licenseType) {
          const typeName = lic.licenseType || 'Driving License';
          list.push({
            id: `lic-${idx}-${Date.now()}`,
            category: 'license',
            name: typeName,
            number: lic.licenseNo || '',
            date: lic.expiryDate || '2026-11-12',
            file: lic.photo || '',
            isHidden: lic.isHidden !== false,
            title: `${typeName.toUpperCase()}${lic.licenseNo ? ` [${lic.licenseNo}]` : ' [SAMPLE]'} uploaded on ${formatDisplayDate(lic.expiryDate || '2026-11-12')}`,
            fileName: `${typeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_SAMPLE_${cleanCode}_${cleanName}.PDF`
          });
        }
      });
    }

    // From documentList
    if (Array.isArray(data.documentList) && data.documentList.length > 0) {
      data.documentList.forEach((doc, idx) => {
        if (doc.name || doc.photo) {
          const typeName = doc.name || 'KYC Document';
          list.push({
            id: `doc-${idx}-${Date.now()}`,
            category: 'document',
            name: typeName,
            number: doc.number || '',
            date: doc.date || '2026-11-12',
            file: doc.photo || '',
            isHidden: doc.isHidden !== false,
            title: `${typeName.toUpperCase()} [KYC] uploaded on ${formatDisplayDate(doc.date || '2026-11-12')}`,
            fileName: `${typeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_SAMPLE_${cleanCode}_${cleanName}.PDF`
          });
        }
      });
    }

    // Top-level driving license
    if (data.drivingLicenseCopy || data.drivingLicenseNo) {
      const existing = list.some(d => d.name === 'Driving License');
      if (!existing) {
        list.push({
          id: `dl-top-${Date.now()}`,
          category: 'license',
          name: 'Driving License',
          number: data.drivingLicenseNo || '',
          date: data.dlExpiryDate || '2026-11-12',
          file: data.drivingLicenseCopy || '',
          isHidden: true,
          title: `DRIVING LICENSE${data.drivingLicenseNo ? ` [${data.drivingLicenseNo}]` : ' [SAMPLE]'} uploaded on ${formatDisplayDate(data.dlExpiryDate || '2026-11-12')}`,
          fileName: `DRIVING_LICENSE_SAMPLE_${cleanCode}_${cleanName}.PDF`
        });
      }
    }

    // If still empty, provide clean sample matching screenshot
    if (list.length === 0) {
      return [
        {
          id: `DOC-${cleanCode}-01`,
          category: 'license',
          name: 'Driving License',
          number: 'DL-0920190012345',
          date: '2026-11-12',
          file: '',
          isHidden: true,
          title: `DRIVING LICENSE [SAMPLE] uploaded on 12-Nov-2026`,
          fileName: `DRIVING_LICENSE_SAMPLE_${cleanCode}_${cleanName}.PDF`
        },
        {
          id: `DOC-${cleanCode}-02`,
          category: 'document',
          name: 'Aadhaar Card',
          number: data.aadhaar || 'XXXX-XXXX-1234',
          date: '2026-11-12',
          file: '',
          isHidden: true,
          title: `AADHAAR CARD [KYC] uploaded on 12-Nov-2026`,
          fileName: `AADHAAR_CARD_SAMPLE_${cleanCode}_${cleanName}.PDF`
        }
      ];
    }

    return list;
  };

  const [documents, setDocuments] = useState(getInitialDocs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form State for new document
  const [formDocType, setFormDocType] = useState('Driving License');
  const [formDocNo, setFormDocNo] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formFile, setFormFile] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Save changes to parent data & storage
  const syncWithParent = (updatedDocs) => {
    setDocuments(updatedDocs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedDocs));
    } catch {}

    const newLicenses = updatedDocs
      .filter(d => d.category === 'license')
      .map(d => ({
        licenseType: d.name,
        licenseNo: d.number,
        expiryDate: d.date,
        photo: d.file,
        isHidden: d.isHidden
      }));

    const newDocs = updatedDocs
      .filter(d => d.category !== 'license')
      .map(d => ({
        name: d.name,
        photo: d.file,
        number: d.number,
        date: d.date,
        isHidden: d.isHidden
      }));

    const firstLic = newLicenses[0] || {};
    onChange({
      ...data,
      licenseList: newLicenses,
      documentList: newDocs,
      licenseType: firstLic.licenseType || data.licenseType || 'Driving License',
      drivingLicenseNo: firstLic.licenseNo || data.drivingLicenseNo || '',
      dlExpiryDate: firstLic.expiryDate || data.dlExpiryDate || '',
      drivingLicenseCopy: firstLic.photo || data.drivingLicenseCopy || ''
    });
  };

  // Toggle Hidden / Visible
  const handleToggleHidden = (docId) => {
    const updated = documents.map(d => {
      if (d.id === docId) {
        return { ...d, isHidden: !d.isHidden };
      }
      return d;
    });
    syncWithParent(updated);
  };

  // Delete Document
  const handleDeleteDoc = (docId) => {
    const doc = documents.find(d => d.id === docId);
    const docName = doc?.name || 'this document';
    if (!window.confirm(`Are you sure you want to delete ${docName}?`)) return;

    const updated = documents.filter(d => d.id !== docId);
    syncWithParent(updated);
  };

  // Download File / Document
  const handleDownloadDoc = (doc) => {
    if (doc.file && doc.file.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.file;
      link.download = doc.fileName || `${doc.name || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a clean sample certificate blob to download
      const content = `========================================================\nDOCUMENT RECORD: ${doc.title || doc.name}\n========================================================\n\nEmployee Name: ${employeeName}\nEmployee Code: ${employeeCode}\nDocument Type: ${doc.name}\nDocument No.: ${doc.number || 'N/A'}\nVerification Date: ${formatDisplayDate(doc.date)}\nStatus: Verified\n\nRR Security & Facilities Verification Authority\nPlot 45, Sector 18, Gurugram, Haryana - 122008\n========================================================`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName ? doc.fileName.replace('.PDF', '.txt') : `${doc.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (documents.length >= 50) {
      alert('Maximum 50 documents can be uploaded for one employee.');
      return;
    }
    setFormDocType(availableDocTypes[0] || 'Driving License');
    setFormDocNo('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormFile('');
    setFormFileName('');
    setUploadError('');
    setIsModalOpen(true);
  };

  // Handle file selection with validation (Max 5MB, allowed formats: jpg, jpeg, png, pdf, max name length: 100)
  const handleFileInputChange = (e) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (file) {
      // Validate 5 MB file size limit
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Maximum file size allowed: 5 MB per document.');
        e.target.value = '';
        return;
      }

      // Validate allowed file formats
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
      if (!allowedExts.includes(ext)) {
        setUploadError('Invalid file type. Allowed formats: jpg, jpeg, png, pdf');
        e.target.value = '';
        return;
      }

      // Validate file name length (max 100 characters)
      if (file.name.length > 100) {
        setUploadError('File name should not be more than 100 characters long.');
        e.target.value = '';
        return;
      }

      setFormFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFile(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save New Document
  const handleSaveModal = (e) => {
    e?.preventDefault();
    if (documents.length >= 50) {
      setUploadError('Maximum 50 documents can be uploaded for one employee.');
      return;
    }
    if (!formFile) {
      setUploadError('Please choose a document file to attach.');
      return;
    }

    const isLic = formDocType.toLowerCase().includes('license');
    const newId = `doc-${Date.now()}`;
    const dateFormatted = formatDisplayDate(formDate);

    const typePrefix = formDocType.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanFileName = formFileName
      ? formFileName.toUpperCase()
      : `${typePrefix}_SAMPLE_${cleanCode}_${cleanName}.PDF`;

    const newDoc = {
      id: newId,
      category: isLic ? 'license' : 'document',
      name: formDocType,
      number: formDocNo,
      date: formDate,
      file: formFile,
      isHidden: true,
      title: `${formDocType.toUpperCase()}${formDocNo ? ` [${formDocNo}]` : ' [SAMPLE]'} uploaded on ${dateFormatted}`,
      fileName: cleanFileName
    };

    const updated = [newDoc, ...documents];
    syncWithParent(updated);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Documents</h3>
          <p className={styles.headerSubtitle}>
            Driving & armed licenses, KYC documents and administrative verification.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenAddModal}
            title="Upload new document or license"
          >
            <PlusCircle size={15} />
            <span>Add Document</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View document requirements"
          >
            <HelpCircle size={15} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. DOCUMENTS LIST (CARD ROWS MATCHING LETTER INBOX)
         ======================================================== */}
      <div className={styles.documentsList}>
        {documents.length > 0 ? (
          documents.map((doc) => {
            const isHidden = doc.isHidden !== false;
            return (
              <div key={doc.id} className={styles.docCard}>
                {/* Left Side: Title & Filename */}
                <div className={styles.docInfo}>
                  <div
                    className={styles.docTitle}
                    onClick={() => {
                      if (doc.file) setPreviewDoc(doc);
                    }}
                    title={doc.file ? "Click to preview document" : ""}
                  >
                    {doc.title || `${doc.name} uploaded on ${formatDisplayDate(doc.date)}`}
                  </div>
                  <div className={styles.docFileName}>
                    {doc.fileName || `${doc.name}_${cleanCode}_${cleanName}.PDF`}
                  </div>
                </div>

                {/* Middle: Toggle Switch (Hidden / Visible) */}
                <div className={styles.toggleWrapper}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isHidden}
                    className={`${styles.toggleSwitch} ${!isHidden ? styles.toggleSwitchActive : ''}`}
                    onClick={() => handleToggleHidden(doc.id)}
                    title={isHidden ? 'Currently hidden from employee portal' : 'Visible on employee portal'}
                  >
                    <span className={`${styles.toggleKnob} ${!isHidden ? styles.toggleKnobActive : ''}`} />
                  </button>
                  <span className={styles.toggleLabel}>
                    {isHidden ? 'Hidden' : 'Visible'}
                  </span>
                </div>

                {/* Right Side: Download & Delete Buttons */}
                <div className={styles.docActions}>
                  <button
                    type="button"
                    className={styles.downloadBtn}
                    onClick={() => handleDownloadDoc(doc)}
                    title="Download Document"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteDoc(doc.id)}
                    title="Delete Document"
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
            <p style={{ margin: 0, fontWeight: 500 }}>No documents uploaded for this employee yet.</p>
          </div>
        )}
      </div>

      {/* ========================================================
          3. DOCUMENT UPLOAD GUIDELINES (MATCHING USER SCREENSHOT)
         ======================================================== */}
      <div className={styles.guidelinesSection}>
        <h4 className={styles.guidelinesTitle}>Document Upload Guidelines</h4>
        <ul className={styles.guidelinesList}>
          <li>Maximum file size allowed: 5 MB per document</li>
          <li>File Types allowed: jpg, jpeg, png, pdf</li>
          <li>File name should not be more than 100 characters long</li>
          <li>Maximum 50 documents can be uploaded for one employee</li>
          <li>Hidden documents are not visible to employees on mobile and web app</li>
        </ul>
      </div>

      {/* ========================================================
          4. VERIFICATION REMARKS & NOTES
         ======================================================== */}
      <div className={styles.remarksCard}>
        <label htmlFor="emp-doc-remarks" className={styles.remarksLabel}>
          Verification Remarks & Notes
        </label>
        <textarea
          id="emp-doc-remarks"
          className={styles.remarksTextarea}
          placeholder="Enter any additional remarks, police verification reference, or administrative notes..."
          value={data.remarks || ''}
          onChange={(e) => onChange({ ...data, remarks: e.target.value })}
        />
      </div>

      {/* ========================================================
          4. UPLOAD / ADD DOCUMENT MODAL
         ======================================================== */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Upload Document for {employeeName}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className={styles.modalBody}>
                {/* Row 1: Document Type */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Document / License Type</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value)}
                    required
                  >
                    {availableDocTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Document / License Number & Expiry Date */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Document / License No.</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. DL-0920190012345"
                      value={formDocNo}
                      onChange={(e) => setFormDocNo(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Expiry / Issue Date</span>
                    </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 3: File Upload */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Attach Document File / Photo</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.fileUploadBox}>
                    <label className={styles.fileUploadBtn} htmlFor="doc-modal-upload">
                      <Upload size={14} />
                      <span>{formFile ? 'Change File' : 'Choose File'}</span>
                    </label>
                    {formFileName ? (
                      <span className={styles.fileStatusText}>✓ {formFileName}</span>
                    ) : formFile ? (
                      <span className={styles.fileStatusText}>✓ File Attached</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>PDF, JPG, JPEG, PNG up to 5MB</span>
                    )}
                    <input
                      id="doc-modal-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,image/jpg"
                      className={styles.fileInputHidden}
                      onChange={handleFileInputChange}
                    />
                  </div>
                  {uploadError && (
                    <div className={styles.uploadErrorText}>{uploadError}</div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                >
                  <Check size={14} />
                  <span>Save Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          5. DOCUMENT IMAGE / FILE PREVIEW MODAL
         ======================================================== */}
      {previewDoc && (
        <div className={styles.modalOverlay} onClick={() => setPreviewDoc(null)}>
          <div className={`${styles.modalContent} ${styles.imagePreviewModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{previewDoc.name} - Preview</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPreviewDoc(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ alignItems: 'center' }}>
              {previewDoc.file && previewDoc.file.startsWith('data:image/') ? (
                <img
                  src={previewDoc.file}
                  alt={previewDoc.name}
                  className={styles.previewImg}
                />
              ) : (
                <div style={{ padding: '30px', textAlign: 'center' }}>
                  <p style={{ fontWeight: 600 }}>{previewDoc.fileName}</p>
                  <button
                    type="button"
                    className={styles.downloadBtn}
                    onClick={() => handleDownloadDoc(previewDoc)}
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsStep;
