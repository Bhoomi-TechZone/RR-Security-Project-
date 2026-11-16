import React, { useState } from 'react';
import {
  ExternalLink,
  Save,
  Check,
  X,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import styles from './AdditionalInfoStep.module.css';

const DEFAULT_FIELD_LABELS = {
  otherInfo1: 'Other Info 1',
  otherInfo2: 'Other Info 2',
  otherInfo3: 'Other Info 3',
  otherInfo4: 'Other Info 4',
  otherInfo5: 'Other Info 5',
  otherInfo6: 'Other Info 6',
  otherInfo7: 'Other Info 7',
  otherInfo8: 'Other Info 8',
  otherInfo9: 'Other Info 9',
  otherInfo10: 'Other Info 10',
};

function AdditionalInfoStep({ data, onChange, onSave, isSubmitting = false }) {
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [fieldLabels, setFieldLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('rr_hrms_additional_info_labels');
      return saved ? { ...DEFAULT_FIELD_LABELS, ...JSON.parse(saved) } : DEFAULT_FIELD_LABELS;
    } catch {
      return DEFAULT_FIELD_LABELS;
    }
  });

  const [tempLabels, setTempLabels] = useState(fieldLabels);

  const handleFieldChange = (key, val) => {
    const updatedAdditional = {
      ...(data.additionalInfo || {}),
      [key]: val
    };

    onChange({
      ...data,
      [key]: val,
      additionalInfo: updatedAdditional
    });
  };

  const handleSaveCustomLabels = () => {
    setFieldLabels(tempLabels);
    try {
      localStorage.setItem('rr_hrms_additional_info_labels', JSON.stringify(tempLabels));
    } catch (e) {
      console.warn('Could not save custom field labels to storage:', e);
    }
    setShowCustomizeModal(false);
  };

  return (
    <div className={styles.container}>
      {/* Header matching the uploaded image */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Additional Info</h2>
          <p className={styles.subtitle}>
            Save extra information as per customized fields.
          </p>
          <a
            href="#customize"
            className={styles.customizeLink}
            onClick={(e) => {
              e.preventDefault();
              setTempLabels(fieldLabels);
              setShowCustomizeModal(true);
            }}
          >
            <span>Click here</span>
            <ExternalLink size={13} />
            <span>to customize fields names</span>
          </a>
        </div>
      </div>

      {/* Form Fields: Notes and Other Info 1 to 10 */}
      <div className={styles.formRows}>
        {/* Notes */}
        <div className={styles.formRow}>
          <label className={styles.label}>Notes</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Any additional information not covered elsewhere"
            value={data.notes ?? data.additionalInfo?.notes ?? ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
          />
        </div>

        {/* Other Info 1 to 10 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
          const key = `otherInfo${num}`;
          const label = fieldLabels[key] || `Other Info ${num}`;
          const value = data[key] ?? data.additionalInfo?.[key] ?? '';

          return (
            <div key={key} className={styles.formRow}>
              <label className={styles.label}>{label}</label>
              <input
                type="text"
                className={styles.input}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {/* Footer Save Button matching the image */}
      {onSave && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={onSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Customize Field Names Modal */}
      {showCustomizeModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowCustomizeModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Customize Field Names</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowCustomizeModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Rename the 10 additional info fields to fit your organization's exact requirements:
              </p>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const key = `otherInfo${num}`;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 100, fontSize: 13, fontWeight: 500, color: '#475569' }}>
                      Field #{num}:
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={tempLabels[key] || ''}
                      placeholder={`Other Info ${num}`}
                      onChange={(e) => setTempLabels({ ...tempLabels, [key]: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryModalBtn}
                onClick={() => setShowCustomizeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryModalBtn}
                onClick={handleSaveCustomLabels}
              >
                Apply Names
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdditionalInfoStep;
