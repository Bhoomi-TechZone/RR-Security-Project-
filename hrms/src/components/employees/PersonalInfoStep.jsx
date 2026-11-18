import React, { useState } from 'react';
import { Camera, Info, X, Plus, Download, HelpCircle, ExternalLink, Pencil, Clock } from 'lucide-react';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import { useCompany } from '../../context/CompanyContext';
import styles from './PersonalInfoStep.module.css';

function PersonalInfoStep({ data, onChange, errors = {} }) {
  const { activeCompany } = useCompany();
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [editingJoiningDate, setEditingJoiningDate] = useState(false);

  const handleChange = (field, value) => {
    if (field === 'employeeCode') {
      onChange({ ...data, employeeCode: value, employeeId: value });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  // Name splitting & syncing
  const nameParts = (data.name || '').trim().split(/\s+/);
  const firstName = data.firstName ?? (nameParts[0] || '');
  const middleName = data.middleName ?? (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '');
  const lastName = data.lastName ?? (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');

  const handleNamePartChange = (part, val) => {
    const updatedFirst = part === 'firstName' ? val : firstName;
    const updatedMiddle = part === 'middleName' ? val : middleName;
    const updatedLast = part === 'lastName' ? val : lastName;
    const fullName = [updatedFirst, updatedMiddle, updatedLast].filter(Boolean).join(' ');

    onChange({
      ...data,
      [part]: val,
      name: fullName
    });
  };

  const tags = Array.isArray(data.tags) ? data.tags : [];

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      handleChange('tags', [...tags, trimmed]);
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    handleChange('tags', tags.filter(t => t !== tagToRemove));
  };

  const handleDownloadStatement = () => {
    downloadEmployeeProfile(data, activeCompany);
  };

  const formatDisplayDateDDMMYYYY = (dStr) => {
    if (!dStr) return 'Not Set';
    try {
      const parts = String(dStr).split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD -> DD-MM-YYYY
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dStr;
      }
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}-${month}-${d.getFullYear()}`;
      }
    } catch (e) {}
    return dStr;
  };

  const initial = (data.name || firstName || 'E').charAt(0).toUpperCase();

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Basic Info</h3>
          <p className={styles.headerSubtitle}>Manage core HR related employee information.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.statementBtn}
            onClick={handleDownloadStatement}
            title="Download employee profile statement"
          >
            <Download size={13} />
            <span>Statement</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View help & documentation"
          >
            <HelpCircle size={13} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TOP PROFILE CARD: CIRCULAR PHOTO + 3-COL NAME GRID
         ======================================================== */}
      <div className={styles.profileCard}>
        {/* Avatar Column */}
        <div className={styles.avatarColumn}>
          <label htmlFor="emp-avatar-upload" className={styles.avatarWrapper} title="Click to change profile photo">
            <div className={styles.avatarCircle}>
              {data.employeePhoto &&
              typeof data.employeePhoto === 'string' &&
              data.employeePhoto.trim() !== '' &&
              data.employeePhoto !== 'Choose File' ? (
                <img
                  src={data.employeePhoto}
                  alt={data.name || 'Employee Photo'}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarInitial}>{initial}</span>
              )}
            </div>
            {data.employeePhoto && (
              <span
                className={styles.removeAvatarBadge}
                title="Remove photo"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleChange('employeePhoto', '');
                }}
              >
                <X size={12} />
              </span>
            )}
          </label>
          <input
            id="emp-avatar-upload"
            type="file"
            accept="image/*"
            className={styles.fileInputHidden}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  handleChange('employeePhoto', reader.result);
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
          <p className={styles.avatarMetaText}>Maximum File Size: 1 MB</p>
          <label htmlFor="emp-avatar-upload" className={styles.avatarHintAction}>
            <span>👆 Click on the image to change</span>
          </label>
        </div>

        {/* 3-Column Name Grid */}
        <div className={styles.nameGrid}>
          {/* First Name */}
          <div className={styles.nameCol}>
            <label htmlFor="emp-first-name" className={styles.nameInputLabel}>
              <span>First Name</span>
              <span className={styles.requiredStar}> *</span>
            </label>
            <input
              id="emp-first-name"
              type="text"
              className={styles.input}
              placeholder="First Name"
              value={firstName}
              onChange={(e) => handleNamePartChange('firstName', e.target.value)}
            />
            <div className={styles.verificationBox}>
              <span className={styles.verifyTitle}>Name as per Aadhaar</span>
              <span className={data.aadhaarVerified ? styles.statusVerified : styles.statusUnverified}>
                {data.nameAsPerAadhaar || (data.aadhaar ? 'Not Verified' : 'Not Verified')}
              </span>
            </div>
          </div>

          {/* Middle Name */}
          <div className={styles.nameCol}>
            <label htmlFor="emp-middle-name" className={styles.nameInputLabel}>
              <span>Middle Name</span>
            </label>
            <input
              id="emp-middle-name"
              type="text"
              className={styles.input}
              placeholder="Middle Name"
              value={middleName}
              onChange={(e) => handleNamePartChange('middleName', e.target.value)}
            />
            <div className={styles.verificationBox}>
              <span className={styles.verifyTitle}>Name as per Bank</span>
              <span className={`${styles.verifyValueStatus} ${styles.statusNormal}`}>
                {data.nameAsPerBank || data.name || firstName || 'Not Added'}
              </span>
            </div>
          </div>

          {/* Last Name */}
          <div className={styles.nameCol}>
            <label htmlFor="emp-last-name" className={styles.nameInputLabel}>
              <span>Last Name</span>
            </label>
            <input
              id="emp-last-name"
              type="text"
              className={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => handleNamePartChange('lastName', e.target.value)}
            />
            <div className={styles.verificationBox}>
              <span className={styles.verifyTitle}>Name as per PAN</span>
              <span className={data.panVerified ? styles.statusVerified : styles.statusUnverified}>
                {data.nameAsPerPan || (data.pan ? 'Not Verified' : 'Not Verified')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. LOWER TWO-COLUMN LAYOUT: FORM ON LEFT, CARDS ON RIGHT
         ======================================================== */}
      <div className={styles.lowerLayout}>
        {/* Left Column Form */}
        <div className={styles.mainForm}>
          {/* 1. Official Record */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Official Record</h4>

            {/* Date of Joining */}
            <div className={styles.formRow}>
              <label htmlFor="joining-date" className={styles.rowLabel}>
                <span>Date of Joining</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                {editingJoiningDate ? (
                  <div className={styles.dateEditWrap}>
                    <input
                      id="joining-date"
                      type="date"
                      className={styles.input}
                      value={data.joiningDate || ''}
                      onChange={(e) => handleChange('joiningDate', e.target.value)}
                      autoFocus
                      onBlur={() => setEditingJoiningDate(false)}
                    />
                    <button
                      type="button"
                      className={styles.pencilCircleBtn}
                      onClick={() => setEditingJoiningDate(false)}
                      title="Done editing date"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className={styles.dateDisplayWrap}>
                    <span className={styles.dateDisplayText}>
                      {formatDisplayDateDDMMYYYY(data.joiningDate)}
                    </span>
                    <button
                      type="button"
                      className={styles.pencilCircleBtn}
                      onClick={() => setEditingJoiningDate(true)}
                      title="Edit Date of Joining"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Date of Confirmation */}
            <div className={styles.formRow}>
              <label htmlFor="confirmation-date" className={styles.rowLabel}>
                <span>Date of Confirmation</span>
              </label>
              <div className={styles.rowControl} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div className={styles.inputWithIconRow}>
                  <input
                    id="confirmation-date"
                    type="date"
                    className={styles.input}
                    value={data.confirmationDate || ''}
                    onChange={(e) => handleChange('confirmationDate', e.target.value)}
                  />
                  <span className={styles.blueClockBadge} title="Confirmation status clock">
                    <Clock size={11} />
                  </span>
                </div>
                <span
                  className={styles.confirmEmployeeLink}
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleChange('confirmationDate', today);
                  }}
                  title="Confirm employee as permanent"
                >
                  <span>Confirm Employee</span>
                  <ExternalLink size={11} />
                </span>
              </div>
            </div>

            {/* Mobile Number (Official) */}
            <div className={styles.formRow}>
              <label htmlFor="emp-mobile" className={styles.rowLabel}>
                <span>Mobile Number</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-mobile"
                  type="tel"
                  className={styles.input}
                  placeholder="e.g. 9999890891"
                  value={data.mobile || ''}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                />
              </div>
            </div>

            {/* Office Phone */}
            <div className={styles.formRow}>
              <label htmlFor="office-phone" className={styles.rowLabel}>
                <span>Office Phone</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="office-phone"
                  type="tel"
                  className={styles.input}
                  placeholder="e.g. 01122658779"
                  value={data.officePhone || ''}
                  onChange={(e) => handleChange('officePhone', e.target.value)}
                />
              </div>
            </div>

            {/* Official E-Mail */}
            <div className={styles.formRow}>
              <label htmlFor="official-email" className={styles.rowLabel}>
                <span>Official E-Mail</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="official-email"
                  type="email"
                  className={styles.input}
                  placeholder="office.rrsf@gmail.com"
                  value={data.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>

            {/* Employee Code */}
            <div className={styles.formRow}>
              <label htmlFor="emp-code" className={styles.rowLabel}>
                <span>Employee Code</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-code"
                  type="text"
                  className={`${styles.input} ${styles.readOnlyInput}`}
                  placeholder="RRS001"
                  value={data.employeeCode || data.employeeId || ''}
                  readOnly
                  disabled
                />
              </div>
            </div>

            {/* Biometric Code */}
            <div className={styles.formRow}>
              <label htmlFor="biometric-code" className={styles.rowLabel}>
                <span>Biometric Code</span>
                <span className={styles.blueInfoBadge} title="Biometric machine attendance code">
                  i
                </span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="biometric-code"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. BIO001"
                  value={data.biometricCode || ''}
                  onChange={(e) => handleChange('biometricCode', e.target.value)}
                />
              </div>
            </div>

            {/* Notice Period */}
            <div className={styles.formRow}>
              <label htmlFor="notice-period" className={styles.rowLabel}>
                <span>Notice Period</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.suffixWrapper}>
                  <input
                    id="notice-period"
                    type="number"
                    min="0"
                    className={styles.numberInput}
                    placeholder="30"
                    value={data.noticePeriod ?? 30}
                    onChange={(e) => handleChange('noticePeriod', e.target.value)}
                  />
                  <span className={styles.suffixText}>days</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Record */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Personal Record</h4>

            {/* Date of Birth */}
            <div className={styles.formRow}>
              <label htmlFor="emp-dob" className={styles.rowLabel}>
                <span>Date of Birth</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-dob"
                  type="date"
                  className={styles.input}
                  value={data.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                />
              </div>
            </div>

            {/* Gender */}
            <div className={styles.formRow}>
              <label className={styles.rowLabel}>
                <span>Gender</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={data.gender === 'Male'}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className={styles.radioInput}
                    />
                    <span>Male</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={data.gender === 'Female'}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className={styles.radioInput}
                    />
                    <span>Female</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="gender"
                      value="Transgender"
                      checked={data.gender === 'Transgender' || data.gender === 'Other'}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className={styles.radioInput}
                    />
                    <span>Transgender</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Marital Status */}
            <div className={styles.formRow}>
              <label className={styles.rowLabel}>
                <span>Marital Status</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="maritalStatus"
                      value="Single"
                      checked={data.maritalStatus === 'Single' || data.maritalStatus === 'Unmarried' || !data.maritalStatus}
                      onChange={() => handleChange('maritalStatus', 'Single')}
                      className={styles.radioInput}
                    />
                    <span>Unmarried</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="maritalStatus"
                      value="Married"
                      checked={data.maritalStatus === 'Married'}
                      onChange={() => handleChange('maritalStatus', 'Married')}
                      className={styles.radioInput}
                    />
                    <span>Married</span>
                  </label>
                  <input
                    type="date"
                    className={styles.anniversaryDateInput}
                    placeholder="mm/dd/yyyy"
                    value={data.marriageDate || ''}
                    onChange={(e) => handleChange('marriageDate', e.target.value)}
                    title="Marriage Date / Anniversary"
                  />
                </div>
              </div>
            </div>

            {/* Spouse Name (Shown when Married) */}
            {data.maritalStatus === 'Married' && (
              <div className={styles.formRow}>
                <label htmlFor="emp-spouse" className={styles.rowLabel}>
                  <span>Spouse Name</span>
                </label>
                <div className={styles.rowControl}>
                  <input
                    id="emp-spouse"
                    type="text"
                    className={styles.input}
                    placeholder="Enter spouse name"
                    value={data.spouseName || ''}
                    onChange={(e) => handleChange('spouseName', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Personal E-Mail */}
            <div className={styles.formRow}>
              <label htmlFor="personal-email" className={styles.rowLabel}>
                <span>Personal E-Mail</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="personal-email"
                  type="email"
                  className={styles.input}
                  placeholder="rrsecurity@gmail.com"
                  value={data.personalEmail || ''}
                  onChange={(e) => handleChange('personalEmail', e.target.value)}
                />
              </div>
            </div>

            {/* Personal Phone */}
            <div className={styles.formRow}>
              <label htmlFor="personal-phone" className={styles.rowLabel}>
                <span>Personal Phone</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="personal-phone"
                  type="tel"
                  className={styles.input}
                  placeholder="9978798978"
                  value={data.emergencyMobile || data.alternateMobile || ''}
                  onChange={(e) => {
                    handleChange('emergencyMobile', e.target.value);
                    handleChange('alternateMobile', e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Father/Husband Name */}
            <div className={styles.formRow}>
              <label htmlFor="emp-father" className={styles.rowLabel}>
                <span>Father/Husband Name</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-father"
                  type="text"
                  className={styles.input}
                  placeholder="Enter father or husband name"
                  value={data.fatherHusbandName || ''}
                  onChange={(e) => handleChange('fatherHusbandName', e.target.value)}
                />
              </div>
            </div>

            {/* Relation */}
            <div className={styles.formRow}>
              <label htmlFor="emp-father-relation" className={styles.rowLabel}>
                <span>Relation</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-father-relation"
                  className={styles.select}
                  value={data.fatherHusbandRelation || ''}
                  onChange={(e) => handleChange('fatherHusbandRelation', e.target.value)}
                >
                  <option value="">Select Relation</option>
                  <option value="Father">Father</option>
                  <option value="Husband">Husband</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Blood Group */}
            <div className={styles.formRow}>
              <label htmlFor="emp-blood" className={styles.rowLabel}>
                <span>Blood Group</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-blood"
                  className={styles.select}
                  value={data.bloodGroup || ''}
                  onChange={(e) => handleChange('bloodGroup', e.target.value)}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Identity & Additional Record */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Identity & Additional Record</h4>

            {/* Aadhaar No. */}
            <div className={styles.formRow}>
              <label htmlFor="emp-aadhaar" className={styles.rowLabel}>
                <span>Aadhaar No.</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-aadhaar"
                  type="text"
                  className={styles.input}
                  placeholder="12-digit Aadhaar No."
                  value={data.aadhaar || ''}
                  onChange={(e) => handleChange('aadhaar', e.target.value)}
                />
              </div>
            </div>

            {/* PAN No. */}
            <div className={styles.formRow}>
              <label htmlFor="emp-pan" className={styles.rowLabel}>
                <span>PAN No.</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-pan"
                  type="text"
                  className={styles.input}
                  placeholder="10-digit PAN No."
                  value={data.pan || ''}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* Religion */}
            <div className={styles.formRow}>
              <label htmlFor="emp-religion" className={styles.rowLabel}>
                <span>Religion</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-religion"
                  className={styles.select}
                  value={data.religion || ''}
                  onChange={(e) => handleChange('religion', e.target.value)}
                >
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Christian">Christian</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Jain">Jain</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Nationality */}
            <div className={styles.formRow}>
              <label htmlFor="emp-nationality" className={styles.rowLabel}>
                <span>Nationality</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-nationality"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Indian"
                  value={data.nationality ?? 'Indian'}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Cards */}
        <div className={styles.rightSidebar}>
          {/* Card 1: Registered Face (For Selfie Punch) */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h4 className={styles.sideCardTitle}>Registered Face</h4>
              <span className={styles.sideCardSubtitle}>(For Selfie Punch)</span>
            </div>

            <label htmlFor="emp-face-photo" className={styles.facePortraitBox} title="Click to upload/change selfie face">
              {data.employeePhoto &&
              typeof data.employeePhoto === 'string' &&
              data.employeePhoto.trim() !== '' &&
              data.employeePhoto !== 'Choose File' ? (
                <img
                  src={data.employeePhoto}
                  alt="Registered Face"
                  className={styles.faceImg}
                />
              ) : (
                <div className={styles.facePlaceholder}>
                  <span className={styles.faceQuestionMark}>?</span>
                </div>
              )}
            </label>
            <input
              id="emp-face-photo"
              type="file"
              accept="image/*"
              className={styles.fileInputHidden}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    handleChange('employeePhoto', reader.result);
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
            />
          </div>

          {/* Card 2: Tags */}
          <div className={`${styles.sideCard} ${styles.tagsCard}`}>
            <div className={styles.tagsCardTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h4 className={styles.sideCardTitle}>Tags</h4>
                <span className={styles.blueInfoBadge} title="Employee tags">
                  i
                </span>
              </div>
              <button
                type="button"
                className={styles.addTagBtn}
                onClick={() => setShowTagInput(!showTagInput)}
              >
                <Plus size={11} />
                <span>Add New</span>
              </button>
            </div>

            <div className={styles.tagsBody}>
              {tags.length > 0 ? (
                <div className={styles.tagList}>
                  {tags.map((tag) => (
                    <span key={tag} className={styles.tagPill}>
                      <span>{tag}</span>
                      <button
                        type="button"
                        className={styles.tagRemoveBtn}
                        onClick={() => handleRemoveTag(tag)}
                        title="Remove tag"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.noTagsText}>No tags assigned</span>
              )}

              {showTagInput && (
                <div className={styles.tagInputWrapper}>
                  <input
                    type="text"
                    className={styles.tagInput}
                    placeholder="Enter tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={styles.tagSaveBtn}
                    onClick={handleAddTag}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoStep;
