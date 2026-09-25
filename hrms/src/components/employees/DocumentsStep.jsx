import React from 'react';
import styles from './EmployeeFormSteps.module.css';
import { Plus, Trash2 } from 'lucide-react';

const LICENSE_TYPE_OPTIONS = [
  'Driving License',
  'Commercial Driving License',
  'Heavy Motor Vehicle (HMV)',
  'Light Motor Vehicle (LMV)',
  'Two Wheeler (MCWG)',
  'Arms / Gun License',
  'Other License'
];

function DocumentsStep({ data, onChange }) {
  // Ensure licenseList array exists
  const licenseList = (Array.isArray(data.licenseList) && data.licenseList.length > 0)
    ? data.licenseList
    : [
        {
          licenseType: data.licenseType || data.drivingLicenseType || 'Driving License',
          licenseNo: data.drivingLicenseNo || '',
          expiryDate: data.dlExpiryDate || '',
          photo: data.drivingLicenseCopy || ''
        }
      ];

  const handleLicenseChange = (index, field, value) => {
    const updated = [...licenseList];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    const first = updated[0] || {};
    onChange({
      ...data,
      licenseList: updated,
      licenseType: first.licenseType || 'Driving License',
      drivingLicenseType: first.licenseType || 'Driving License',
      drivingLicenseNo: first.licenseNo || '',
      dlExpiryDate: first.expiryDate || '',
      drivingLicenseCopy: first.photo || ''
    });
  };

  const addLicense = () => {
    const updated = [
      ...licenseList,
      {
        licenseType: 'Driving License',
        licenseNo: '',
        expiryDate: '',
        photo: ''
      }
    ];

    const first = updated[0] || {};
    onChange({
      ...data,
      licenseList: updated,
      licenseType: first.licenseType || 'Driving License',
      drivingLicenseType: first.licenseType || 'Driving License',
      drivingLicenseNo: first.licenseNo || '',
      dlExpiryDate: first.expiryDate || '',
      drivingLicenseCopy: first.photo || ''
    });
  };

  const removeLicense = (indexToRemove) => {
    if (licenseList.length <= 1) return;
    const updated = licenseList.filter((_, idx) => idx !== indexToRemove);
    const first = updated[0] || {};

    onChange({
      ...data,
      licenseList: updated,
      licenseType: first.licenseType || 'Driving License',
      drivingLicenseType: first.licenseType || 'Driving License',
      drivingLicenseNo: first.licenseNo || '',
      dlExpiryDate: first.expiryDate || '',
      drivingLicenseCopy: first.photo || ''
    });
  };

  // Ensure documentList array exists
  const documentList = (Array.isArray(data.documentList) && data.documentList.length > 0)
    ? data.documentList
    : [
        {
          name: '',
          photo: ''
        }
      ];

  const handleDocChange = (index, field, value) => {
    const updated = [...documentList];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange({
      ...data,
      documentList: updated
    });
  };

  const addDocument = () => {
    const updated = [
      ...documentList,
      {
        name: '',
        photo: ''
      }
    ];
    onChange({
      ...data,
      documentList: updated
    });
  };

  const removeDocument = (indexToRemove) => {
    if (documentList.length <= 1) return;
    const updated = documentList.filter((_, idx) => idx !== indexToRemove);
    onChange({
      ...data,
      documentList: updated
    });
  };

  return (
    <div className={styles.stepContainer}>
      {/* Licenses Header Row */}
      <div className={styles.familyHeaderRow}>
        <h4 className={styles.familySectionTitle}>Licenses</h4>
        <button
          type="button"
          className={styles.addMemberBtn}
          onClick={addLicense}
        >
          <Plus size={15} /> Add License
        </button>
      </div>

      {/* Dynamic Licenses List */}
      <div className={styles.familyList}>
        {licenseList.map((license, idx) => (
          <div key={idx} className={styles.familyCard}>
            <div className={styles.familyCardHeader}>
              <span className={styles.memberIndexTitle}>License {idx + 1}</span>
              {licenseList.length > 1 && (
                <button
                  type="button"
                  className={styles.removeMemberBtn}
                  onClick={() => removeLicense(idx)}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>

            {/* Row 1 (4 Columns): Type of License, License No., Expiry Date, Attached Copy */}
            <div className={styles.fourColumnGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor={`lic-type-${idx}`} className={styles.label}>Type of License</label>
                <select
                  id={`lic-type-${idx}`}
                  className={styles.select}
                  value={license.licenseType || 'Driving License'}
                  onChange={(e) => handleLicenseChange(idx, 'licenseType', e.target.value)}
                >
                  {LICENSE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`lic-no-${idx}`} className={styles.label}>License No.</label>
                <input
                  id={`lic-no-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="e.g. DL-1420110012345"
                  value={license.licenseNo || ''}
                  onChange={(e) => handleLicenseChange(idx, 'licenseNo', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`lic-expiry-${idx}`} className={styles.label}>Expiry Date</label>
                <input
                  id={`lic-expiry-${idx}`}
                  type="date"
                  className={styles.input}
                  value={license.expiryDate || ''}
                  onChange={(e) => handleLicenseChange(idx, 'expiryDate', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`lic-photo-${idx}`} className={styles.label}>Attached Copy of License</label>
                <div className={styles.fileUploadWrapper}>
                  <div className={styles.fileUploadBox}>
                    <span className={styles.fileUploadText}>
                      {license.photo || 'Choose File'}
                    </span>
                  </div>
                  <label className={styles.fileUploadButton} htmlFor={`lic-photo-${idx}`}>
                    Choose File
                  </label>
                  <input
                    id={`lic-photo-${idx}`}
                    type="file"
                    accept="image/*,.pdf"
                    className={styles.fileInputHidden}
                    onChange={(e) => handleLicenseChange(idx, 'photo', e.target.files?.[0]?.name || '')}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header with Add Document Button */}
      <div className={styles.familyHeaderRow} style={{ marginTop: '10px' }}>
        <h4 className={styles.familySectionTitle}>Documents</h4>
        <button
          type="button"
          className={styles.addMemberBtn}
          onClick={addDocument}
        >
          <Plus size={15} /> Add Document
        </button>
      </div>

      {/* Dynamic Documents List */}
      <div className={styles.familyList}>
        {documentList.map((doc, idx) => (
          <div key={idx} className={styles.docRowCard}>
            <div className={styles.docRowHeader}>
              <span className={styles.docIndexTitle}>Document {idx + 1}</span>
              {documentList.length > 1 && (
                <button
                  type="button"
                  className={styles.removeMemberBtn}
                  onClick={() => removeDocument(idx)}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>

            <div className={styles.docRowGrid}>
              {/* Field 1: Document Name */}
              <div className={styles.fieldGroup}>
                <label htmlFor={`doc-name-${idx}`} className={styles.label}>Document Name</label>
                <input
                  id={`doc-name-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Aadhaar Card, PAN Card, Resume"
                  value={doc.name || ''}
                  onChange={(e) => handleDocChange(idx, 'name', e.target.value)}
                />
              </div>

              {/* Field 2: Photo / Document File */}
              <div className={styles.fieldGroup}>
                <label htmlFor={`doc-photo-${idx}`} className={styles.label}>Document Photo / File</label>
                <div className={styles.fileUploadWrapper}>
                  <div className={styles.fileUploadBox}>
                    <span className={styles.fileUploadText}>
                      {doc.photo || 'Choose File'}
                    </span>
                  </div>
                  <label className={styles.fileUploadButton} htmlFor={`doc-photo-${idx}`}>
                    Choose File
                  </label>
                  <input
                    id={`doc-photo-${idx}`}
                    type="file"
                    accept="image/*,.pdf"
                    className={styles.fileInputHidden}
                    onChange={(e) => handleDocChange(idx, 'photo', e.target.files?.[0]?.name || '')}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remarks */}
      <div className={styles.fieldGroup} style={{ marginTop: '8px' }}>
        <label htmlFor="emp-remarks" className={styles.label}>Remarks</label>
        <textarea
          id="emp-remarks"
          className={styles.textarea}
          rows={3}
          placeholder="Enter any additional remarks or verification notes"
          value={data.remarks || ''}
          onChange={(e) => onChange({ ...data, remarks: e.target.value })}
        />
      </div>
    </div>
  );
}

export default DocumentsStep;
