import React, { useState } from 'react';
import { PlusCircle, Trash2, Pencil, HelpCircle, Upload, Eye, X, Check } from 'lucide-react';
import styles from './FamilyStep.module.css';

/**
 * Formats date into "18-Mar-2010" format matching screenshot
 */
function formatDisplayDate(dateVal) {
  if (!dateVal) return '—';
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

const DEFAULT_MEMBER = {
  name: '',
  relation: '',
  dob: '',
  dobAge: '',
  residentWith: 'Yes',
  residingWith: 'Yes',
  aadhaarNumber: '',
  aadhaarPhoto: ''
};

function FamilyStep({ data, onChange }) {
  // Normalize family members list
  const rawMembers = Array.isArray(data.familyMembers) ? data.familyMembers : [];
  const familyMembers = rawMembers.length > 0
    ? rawMembers
    : (data.familyMemberName ? [{
        name: data.familyMemberName || '',
        relation: data.relation || '',
        dob: data.dob || data.dobAge || '',
        dobAge: data.dobAge || data.dob || '',
        residentWith: data.residentWith || data.residingWith || 'Yes',
        residingWith: data.residentWith || data.residingWith || 'Yes',
        aadhaarNumber: data.aadhaarNumber || '',
        aadhaarPhoto: data.aadhaarPhoto || ''
      }] : []);

  // Filter out completely blank initial placeholders for clean table rendering
  const activeMembers = familyMembers.filter(m => m && (m.name || m.relation || m.dob || m.aadhaarNumber));

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingIndex, setEditingIndex] = useState(null);
  const [formMember, setFormMember] = useState(DEFAULT_MEMBER);

  // Photo Preview State
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingIndex(null);
    setFormMember({ ...DEFAULT_MEMBER });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (index) => {
    setModalMode('edit');
    setEditingIndex(index);
    const m = activeMembers[index] || DEFAULT_MEMBER;
    setFormMember({
      name: m.name || '',
      relation: m.relation || '',
      dob: m.dob || m.dobAge || '',
      dobAge: m.dobAge || m.dob || '',
      residentWith: m.residentWith || m.residingWith || 'Yes',
      residingWith: m.residingWith || m.residentWith || 'Yes',
      aadhaarNumber: m.aadhaarNumber || '',
      aadhaarPhoto: m.aadhaarPhoto || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e?.preventDefault();
    if (!formMember.name.trim()) {
      alert('Please enter member name.');
      return;
    }

    let updated;
    if (modalMode === 'add') {
      updated = [...activeMembers, { ...formMember, residingWith: formMember.residentWith }];
    } else {
      updated = [...activeMembers];
      updated[editingIndex] = { ...formMember, residingWith: formMember.residentWith };
    }

    const first = updated[0] || {};
    onChange({
      ...data,
      familyMembers: updated,
      familyMemberName: first.name || '',
      relation: first.relation || '',
      dobAge: first.dob || first.dobAge || '',
      aadhaarNumber: first.aadhaarNumber || '',
      residentWith: first.residentWith || 'Yes',
      residingWith: first.residentWith || 'Yes'
    });

    setIsModalOpen(false);
  };

  const handleRemoveMember = (indexToRemove) => {
    const memberName = activeMembers[indexToRemove]?.name || 'this member';
    if (!window.confirm(`Are you sure you want to remove ${memberName}?`)) return;

    const updated = activeMembers.filter((_, idx) => idx !== indexToRemove);
    const first = updated[0] || {};

    onChange({
      ...data,
      familyMembers: updated,
      familyMemberName: first.name || '',
      relation: first.relation || '',
      dobAge: first.dob || first.dobAge || '',
      aadhaarNumber: first.aadhaarNumber || '',
      residentWith: first.residentWith || 'Yes',
      residingWith: first.residentWith || 'Yes'
    });
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Family Members</h3>
          <p className={styles.headerSubtitle}>View or update employee's family member details.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenAdd}
            title="Add a new family member"
          >
            <PlusCircle size={15} />
            <span>Add Member</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View family documentation"
          >
            <HelpCircle size={15} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. FAMILY MEMBERS TABLE (MATCHING SCREENSHOT EXACTLY)
         ======================================================== */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '28%' }}>RELATION & NAME</th>
              <th style={{ width: '22%' }}>DATE OF BIRTH</th>
              <th style={{ width: '24%' }}>AADHAAR NUMBER</th>
              <th style={{ width: '14%' }}>RESIDENT WITH</th>
              <th style={{ width: '12%', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {activeMembers.length > 0 ? (
              activeMembers.map((member, idx) => (
                <tr key={idx}>
                  {/* Column 1: Relation Badges & Name */}
                  <td>
                    <div className={styles.relationCol}>
                      <div className={styles.badgesRow}>
                        {member.relation && (
                          <span className={styles.badgeRelation}>
                            {member.relation}
                          </span>
                        )}
                        <span className={member.residentWith === 'No' ? styles.badgeNonResident : styles.badgeResident}>
                          {member.residentWith === 'No' ? 'Non-Resident' : 'Resident'}
                        </span>
                      </div>
                      <div className={styles.memberName}>
                        {member.name || 'Unnamed Member'}
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Date of Birth */}
                  <td>
                    <span className={styles.dobText}>
                      {formatDisplayDate(member.dob || member.dobAge)}
                    </span>
                  </td>

                  {/* Column 3: Aadhaar Number & Document */}
                  <td>
                    <div className={styles.aadhaarCol}>
                      <span className={styles.aadhaarNumber}>
                        {member.aadhaarNumber || '—'}
                      </span>
                      {member.aadhaarPhoto && (
                        <button
                          type="button"
                          className={styles.photoViewBtn}
                          onClick={() => setPreviewPhoto({ url: member.aadhaarPhoto, name: member.name })}
                          title="View uploaded Aadhaar photo"
                        >
                          <Eye size={12} />
                          <span>View Photo</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Column 4: Resident With */}
                  <td>
                    <span className={member.residentWith === 'No' ? styles.residentBadgeNo : styles.residentBadgeCol}>
                      {member.residentWith || 'Yes'}
                    </span>
                  </td>

                  {/* Column 5: Action Icons (Edit / Delete) */}
                  <td style={{ textAlign: 'center' }}>
                    <div className={styles.actionsCell} style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        className={styles.editActionBtn}
                        onClick={() => handleOpenEdit(idx)}
                        title="Edit family member"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteActionBtn}
                        onClick={() => handleRemoveMember(idx)}
                        title="Delete family member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <p style={{ margin: 0, fontWeight: 500 }}>No family members recorded yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================
          3. ADD / EDIT FAMILY MEMBER MODAL
         ======================================================== */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === 'edit' ? 'Update Family Member' : 'Add Family Member'}
              </h3>
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
                {/* Row 1: Name & Relation */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Member Name</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Rishant"
                      value={formMember.name}
                      onChange={(e) => setFormMember({ ...formMember, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Relation</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formMember.relation}
                      onChange={(e) => setFormMember({ ...formMember, relation: e.target.value })}
                      required
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
                </div>

                {/* Row 2: Date of Birth & Resident With */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formMember.dob || formMember.dobAge || ''}
                      onChange={(e) => setFormMember({
                        ...formMember,
                        dob: e.target.value,
                        dobAge: e.target.value
                      })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span>Resident With</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formMember.residentWith || 'Yes'}
                      onChange={(e) => setFormMember({
                        ...formMember,
                        residentWith: e.target.value,
                        residingWith: e.target.value
                      })}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Aadhaar Number */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Aadhaar Number</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Enter 12-digit Aadhaar number"
                    value={formMember.aadhaarNumber}
                    onChange={(e) => setFormMember({ ...formMember, aadhaarNumber: e.target.value })}
                  />
                </div>

                {/* Row 4: Aadhaar Photo */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Aadhaar Photo / Document</span>
                  </label>
                  <div className={styles.fileUploadBox}>
                    <label className={styles.fileUploadBtn} htmlFor="fam-modal-photo">
                      <Upload size={14} />
                      <span>{formMember.aadhaarPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                    </label>
                    {formMember.aadhaarPhoto && (
                      <span className={styles.fileStatusText}>✓ Photo Attached</span>
                    )}
                    <input
                      id="fam-modal-photo"
                      type="file"
                      accept="image/*,.pdf"
                      className={styles.fileInputHidden}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormMember({ ...formMember, aadhaarPhoto: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
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
                  <span>{modalMode === 'edit' ? 'Update Member' : 'Save Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. PHOTO PREVIEW MODAL
         ======================================================== */}
      {previewPhoto && (
        <div className={styles.modalOverlay} onClick={() => setPreviewPhoto(null)}>
          <div className={`${styles.modalContent} ${styles.imagePreviewModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Aadhaar Photo - {previewPhoto.name || 'Family Member'}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPreviewPhoto(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ alignItems: 'center' }}>
              <img
                src={previewPhoto.url}
                alt="Aadhaar Document"
                className={styles.previewImg}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyStep;
