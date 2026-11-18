import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Copy, Check, HelpCircle, Users, Upload } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import styles from './AddressFamilyStep.module.css';

function AddressFamilyStep({ data, onChange }) {
  const { activeCompany } = useCompany();

  const [editingType, setEditingType] = useState(null); // 'present' | 'permanent' | null
  const [copiedType, setCopiedType] = useState(null); // 'present' | 'permanent' | null
  const [draftAddress, setDraftAddress] = useState('');

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

  const startEdit = (type) => {
    setEditingType(type);
    setDraftAddress(type === 'present' ? (data.presentAddress || '') : (data.permanentAddress || ''));
  };

  const saveEdit = (type) => {
    if (type === 'present') {
      const updated = { ...data, presentAddress: draftAddress };
      if (data.sameAsPresentAddress) {
        updated.permanentAddress = draftAddress;
      }
      onChange(updated);
    } else {
      onChange({ ...data, permanentAddress: draftAddress });
    }
    setEditingType(null);
  };

  const cancelEdit = () => {
    setEditingType(null);
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  const deleteAddress = (type) => {
    if (type === 'present') {
      onChange({ ...data, presentAddress: '' });
    } else {
      onChange({ ...data, permanentAddress: '' });
    }
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
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Addresses</h3>
          <p className={styles.headerSubtitle}>Keep record of employee's present and permanent address.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => startEdit(data.presentAddress ? 'permanent' : 'present')}
            title="Add or edit address"
          >
            <Plus size={14} />
            <span>Add Address</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View address help documentation"
          >
            <HelpCircle size={13} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. ADDRESS CARDS SECTION (MATCHING SCREENSHOT)
         ======================================================== */}
      <div className={styles.addressList}>
        {/* Present Address Card */}
        <div className={styles.addressCard}>
          <div className={styles.cardHeaderRow}>
            <h4 className={styles.cardTypeTitle}>Present</h4>
            <div className={styles.cardActionIcons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => startEdit('present')}
                title="Edit present address"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => copyToClipboard(data.presentAddress, 'present')}
                title="Copy present address"
              >
                {copiedType === 'present' ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                className={styles.deleteIconBtn}
                onClick={() => deleteAddress('present')}
                title="Delete present address"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {editingType === 'present' ? (
            <div className={styles.editAddressBox}>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="Enter complete present address (Street, Colony, City, State, Pincode, Country)"
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                autoFocus
              />
              <div className={styles.editActionsRow}>
                <button
                  type="button"
                  className={styles.cancelAddressBtn}
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveAddressBtn}
                  onClick={() => saveEdit('present')}
                >
                  Save Address
                </button>
              </div>
            </div>
          ) : (
            <div>
              {data.presentAddress ? (
                <p className={styles.addressText}>{data.presentAddress}</p>
              ) : (
                <p className={styles.emptyAddressText}>No present address added yet. Click edit to add.</p>
              )}
            </div>
          )}
        </div>

        {/* Permanent Address Card */}
        <div className={styles.addressCard}>
          <div className={styles.cardHeaderRow}>
            <h4 className={styles.cardTypeTitle}>Permanent</h4>
            <div className={styles.cardActionIcons}>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => startEdit('permanent')}
                title="Edit permanent address"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => copyToClipboard(data.permanentAddress, 'permanent')}
                title="Copy permanent address"
              >
                {copiedType === 'permanent' ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                className={styles.deleteIconBtn}
                onClick={() => deleteAddress('permanent')}
                title="Delete permanent address"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {editingType === 'permanent' ? (
            <div className={styles.editAddressBox}>
              <label className={styles.sameAddressCheckbox}>
                <input
                  type="checkbox"
                  checked={!!data.sameAsPresentAddress}
                  onChange={(e) => {
                    handleSameAddressChange(e.target.checked);
                    if (e.target.checked) {
                      setDraftAddress(data.presentAddress || '');
                    }
                  }}
                  style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <span>Same as Present Address</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="Enter complete permanent address (Street, Colony, City, State, Pincode, Country)"
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                disabled={!!data.sameAsPresentAddress}
                autoFocus
              />
              <div className={styles.editActionsRow}>
                <button
                  type="button"
                  className={styles.cancelAddressBtn}
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveAddressBtn}
                  onClick={() => saveEdit('permanent')}
                >
                  Save Address
                </button>
              </div>
            </div>
          ) : (
            <div>
              {data.permanentAddress ? (
                <p className={styles.addressText}>{data.permanentAddress}</p>
              ) : (
                <p className={styles.emptyAddressText}>No permanent address added yet. Click edit to add.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          3. FAMILY MEMBERS & NOMINEES SECTION
         ======================================================== */}
      <div className={styles.familySection}>
        <div className={styles.familySectionHeader}>
          <div>
            <h4 className={styles.familySectionTitle}>Family Details & Nominees</h4>
            <p className={styles.familySubtitle}>Record employee's dependents, emergency contacts and insurance nominees.</p>
          </div>
          <button
            type="button"
            className={styles.addMemberBtn}
            onClick={addFamilyMember}
          >
            <Plus size={14} />
            <span>Add Family Member</span>
          </button>
        </div>

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
                    placeholder="12-digit Aadhaar Number"
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
                    placeholder="e.g. 100"
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
    </div>
  );
}

export default AddressFamilyStep;
