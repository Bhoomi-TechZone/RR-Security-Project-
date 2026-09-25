import React from 'react';
import styles from './EmployeeFormSteps.module.css';
import { Plus, Trash2 } from 'lucide-react';

function AddressFamilyStep({ data, onChange }) {
  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    if (field === 'presentAddress' && data.sameAsPresentAddress) {
      updated.permanentAddress = value;
    }
    onChange(updated);
  };

  const handleSameAddressChange = (isSame) => {
    onChange({
      ...data,
      sameAsPresentAddress: isSame,
      permanentAddress: isSame ? (data.presentAddress || '') : data.permanentAddress
    });
  };

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
    <div className={styles.stepContainer}>
      {/* Address Section */}
      <div className={styles.twoColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="present-address" className={styles.label}>Present Address</label>
          <textarea
            id="present-address"
            className={styles.textarea}
            rows={3}
            placeholder="Enter full present address"
            value={data.presentAddress || ''}
            onChange={(e) => handleChange('presentAddress', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="permanent-address" className={styles.label}>Permanent Address</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={!!data.sameAsPresentAddress}
                onChange={(e) => handleSameAddressChange(e.target.checked)}
                style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
              />
              Same as Present Address
            </label>
          </div>
          <textarea
            id="permanent-address"
            className={styles.textarea}
            rows={3}
            placeholder="Enter full permanent address"
            value={data.permanentAddress || ''}
            onChange={(e) => handleChange('permanentAddress', e.target.value)}
          />
        </div>
      </div>

      {/* Multiple Family Members Section */}
      <div className={styles.familyHeaderRow}>
        <h4 className={styles.familySectionTitle}>Family Details</h4>
        <button
          type="button"
          className={styles.addMemberBtn}
          onClick={addFamilyMember}
        >
          <Plus size={15} /> Add Family Member
        </button>
      </div>

      <div className={styles.familyList}>
        {familyMembers.map((member, idx) => (
          <div key={idx} className={styles.familyCard}>
            <div className={styles.familyCardHeader}>
              <span className={styles.memberIndexTitle}>Family Member {idx + 1}</span>
              {familyMembers.length > 1 && (
                <button
                  type="button"
                  className={styles.removeMemberBtn}
                  onClick={() => removeFamilyMember(idx)}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>

            {/* Row 1 (4 Columns): Name, Relation, DOB/Age, Aadhaar Number */}
            <div className={styles.fourColumnGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-name-${idx}`} className={styles.label}>Family Member Name</label>
                <input
                  id={`fam-name-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Suman Kumar"
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
                  <option value="">Select</option>
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
                <label htmlFor={`fam-dob-${idx}`} className={styles.label}>DOB</label>
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
                  placeholder="12-digit Aadhaar Number"
                  value={member.aadhaarNumber || ''}
                  onChange={(e) => handleMemberChange(idx, 'aadhaarNumber', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2 (4 Columns): Address, Nominee, Nominee Share %, Aadhaar Photo */}
            <div className={styles.fourColumnGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-addr-${idx}`} className={styles.label}>Address</label>
                <input
                  id={`fam-addr-${idx}`}
                  type="text"
                  className={styles.input}
                  placeholder="Address if different"
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
                  placeholder="e.g. 50"
                  value={member.nomineeSharePercent || ''}
                  onChange={(e) => handleMemberChange(idx, 'nomineeSharePercent', e.target.value)}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`fam-photo-${idx}`} className={styles.label}>Aadhaar Photo</label>
                <div className={styles.fileUploadWrapper}>
                  <div className={styles.fileUploadBox}>
                    <span className={styles.fileUploadText}>
                      {member.aadhaarPhoto || 'Choose File'}
                    </span>
                  </div>
                  <label className={styles.fileUploadButton} htmlFor={`fam-photo-${idx}`}>
                    Choose File
                  </label>
                  <input
                    id={`fam-photo-${idx}`}
                    type="file"
                    accept="image/*,.pdf"
                    className={styles.fileInputHidden}
                    onChange={(e) => handleMemberChange(idx, 'aadhaarPhoto', e.target.files?.[0]?.name || '')}
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

export default AddressFamilyStep;
