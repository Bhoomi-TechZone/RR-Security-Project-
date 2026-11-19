import React from 'react';
import { Plus, Trash2, HelpCircle, Upload } from 'lucide-react';
import styles from './FamilyStep.module.css';

function FamilyStep({ data, onChange }) {
  // Ensure familyMembers array exists
  const familyMembers = (Array.isArray(data.familyMembers) && data.familyMembers.length > 0)
    ? data.familyMembers
    : [
        {
          name: data.familyMemberName || '',
          relation: data.relation || '',
          dobAge: data.dobAge || '',
          aadhaarNumber: data.aadhaarNumber || '',
          address: data.address || '',
          nomineeYesNo: data.nomineeYesNo || 'No',
          nomineeSharePercent: data.nomineeSharePercent || '',
          aadhaarPhoto: data.aadhaarPhoto || ''
        }
      ];

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };

    const first = updatedMembers[0] || {};
    onChange({
      ...data,
      familyMembers: updatedMembers,
      familyMemberName: first.name || '',
      relation: first.relation || '',
      dobAge: first.dobAge || '',
      address: first.address || '',
      nomineeYesNo: first.nomineeYesNo || '',
      nomineeSharePercent: first.nomineeSharePercent || ''
    });
  };

  const addFamilyMember = () => {
    const updatedMembers = [
      ...familyMembers,
      {
        name: '',
        relation: '',
        dobAge: '',
        aadhaarNumber: '',
        address: '',
        nomineeYesNo: 'No',
        nomineeSharePercent: '',
        aadhaarPhoto: ''
      }
    ];

    onChange({
      ...data,
      familyMembers: updatedMembers
    });
  };

  const removeFamilyMember = (indexToRemove) => {
    if (familyMembers.length <= 1) return;
    const updatedMembers = familyMembers.filter((_, idx) => idx !== indexToRemove);
    const first = updatedMembers[0] || {};

    onChange({
      ...data,
      familyMembers: updatedMembers,
      familyMemberName: first.name || '',
      relation: first.relation || '',
      dobAge: first.dobAge || '',
      address: first.address || '',
      nomineeYesNo: first.nomineeYesNo || '',
      nomineeSharePercent: first.nomineeSharePercent || ''
    });
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Family Details</h3>
          <p className={styles.headerSubtitle}>Record employee's dependents, emergency contacts and insurance nominees.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={addFamilyMember}
            title="Add a new family member"
          >
            <Plus size={14} />
            <span>Add Family Member</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View family documentation"
          >
            <HelpCircle size={13} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. FAMILY MEMBERS & NOMINEES LIST
         ======================================================== */}
      <div className={styles.familyGrid}>
        {familyMembers.map((member, idx) => (
          <div key={idx} className={styles.memberCard}>
            <div className={styles.memberCardHeader}>
              <span className={styles.memberCardTitle}>Family Member #{idx + 1}</span>
              {familyMembers.length > 1 && (
                <button
                  type="button"
                  className={styles.removeMemberBtn}
                  onClick={() => removeFamilyMember(idx)}
                >
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Row 1: Name, Relation, DOB, Aadhaar */}
            <div className={styles.fieldsRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-name-${idx}`} className={styles.label}>Member Name</label>
                <input
                  id={`fam-name-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="Enter Member Name"
                  value={member.name || ''}
                  onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-rel-${idx}`} className={styles.label}>Relation</label>
                <select
                  id={`fam-rel-${idx}`}
                  className={styles.select}
                  value={member.relation || ''}
                  onChange={(e) => handleMemberChange(idx, 'relation', e.target.value)}
                >
                  <option value="">Select Relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Husband">Husband</option>
                  <option value="Wife">Wife</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-dob-${idx}`} className={styles.label}>Date of Birth</label>
                <input
                  id={`fam-dob-${idx}`}
                  type="date"
                  className={styles.input}
                  value={member.dob || member.dobAge || ''}
                  onChange={(e) => handleMemberChange(idx, 'dob', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-aadhaar-${idx}`} className={styles.label}>Aadhaar Number</label>
                <input
                  id={`fam-aadhaar-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="Enter Aadhaar Number"
                  value={member.aadhaarNumber || ''}
                  onChange={(e) => handleMemberChange(idx, 'aadhaarNumber', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Address, Nominee, Share %, Aadhaar Photo */}
            <div className={styles.fieldsRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-addr-${idx}`} className={styles.label}>Residential Address</label>
                <input
                  id={`fam-addr-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="Enter Residential Address"
                  value={member.address || ''}
                  onChange={(e) => handleMemberChange(idx, 'address', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-nominee-${idx}`} className={styles.label}>Nominee</label>
                <select
                  id={`fam-nominee-${idx}`}
                  className={styles.select}
                  value={member.nomineeYesNo || ''}
                  onChange={(e) => handleMemberChange(idx, 'nomineeYesNo', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-share-${idx}`} className={styles.label}>Nominee Share %</label>
                <input
                  id={`fam-share-${idx}`}
                  type="number"
                  min="0"
                  max="100"
                  className={styles.input}
                  placeholder="Enter Share %"
                  value={member.nomineeSharePercent || ''}
                  onChange={(e) => handleMemberChange(idx, 'nomineeSharePercent', e.target.value)}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-photo-${idx}`} className={styles.label}>Aadhaar Photo</label>
                <div className={styles.fileUploadBox}>
                  <label className={styles.fileUploadBtn} htmlFor={`fam-photo-${idx}`}>
                    <Upload size={13} />
                    <span>{member.aadhaarPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                  </label>
                  {member.aadhaarPhoto && (
                    <span className={styles.fileStatusText}>✓ Uploaded</span>
                  )}
                  <input
                    id={`fam-photo-${idx}`}
                    type="file"
                    accept="image/*,.pdf"
                    className={styles.fileInputHidden}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleMemberChange(idx, 'aadhaarPhoto', reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FamilyStep;
