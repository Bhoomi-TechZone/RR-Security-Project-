import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Loader2,
  Calendar,
  ChevronDown,
  Info,
  Layers
} from 'lucide-react';
import styles from './NewEmployeeForm.module.css';
import { useCompany } from '../../context/CompanyContext';
import { generateSeriesPreview } from '../../data/numberSeriesData';

const DEFAULT_WEEK_OFFS = [
  'Sunday Fixed',
  'Rotational (6 Days Working)',
  'Saturday & Sunday (5 Days Working)',
  'Monday Fixed',
  'Friday Fixed',
  'No Week Off'
];

export default function NewEmployeeForm({
  onSubmit,
  onSwitchToDetailed,
  clients = [],
  departments = [],
  designations = [],
  employeeTypes = [],
  sites = [],
  posts = [],
  shifts = [],
  workLocations = [],
  employeesCount = 0
}) {
  const { activeCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [confirmationDate, setConfirmationDate] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [employeeCode, setEmployeeCode] = useState('');
  const [biometricCode, setBiometricCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [sendLogin, setSendLogin] = useState(true);

  // Work Profile State
  const [businessUnit, setBusinessUnit] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Policies State
  const [shiftPolicy, setShiftPolicy] = useState('');
  const [weekOffPolicy, setWeekOffPolicy] = useState('');

  // Auto-generate employee code based on active company series
  useEffect(() => {
    let seriesConfig = activeCompany?.employeeCodeSeries;
    const compId = activeCompany?.companyId || activeCompany?.id;
    if (!seriesConfig && compId) {
      const savedComp = localStorage.getItem(`novaspark_number_series_${compId}`);
      if (savedComp) {
        try { seriesConfig = JSON.parse(savedComp); } catch (e) {}
      }
    }
    if (!seriesConfig) {
      const globalSaved = localStorage.getItem('novaspark_number_series');
      if (globalSaved) {
        try {
          const parsed = JSON.parse(globalSaved);
          seriesConfig = parsed.find(s => s.id === 'employee-code');
        } catch (e) {}
      }
    }

    const companyPrefix = (seriesConfig?.prefix || activeCompany?.code || 'RR').trim().toUpperCase();
    const startNum = Number(seriesConfig?.startingNumber) || 1;
    const dynamicNextSeq = startNum + employeesCount;

    const effectiveSeries = {
      prefix: companyPrefix,
      padding: Number(seriesConfig?.padding) || 3,
      separator: seriesConfig?.separator !== undefined ? seriesConfig.separator : '-',
      yearFormat: seriesConfig?.yearFormat || 'None',
      monthFormat: seriesConfig?.monthFormat || 'None',
      startingNumber: startNum,
      currentNumber: dynamicNextSeq,
      ...seriesConfig,
      currentNumber: dynamicNextSeq
    };

    const autoCode = generateSeriesPreview(effectiveSeries);
    setEmployeeCode(autoCode);
  }, [activeCompany, employeesCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName) {
      alert('Please enter Employee Name (First Name).');
      return;
    }

    if (!joiningDate) {
      alert('Please select Joining Date.');
      return;
    }

    if (sendLogin && !email.trim()) {
      alert('Official E-Mail is required when "Send Login" is selected so login credentials can be emailed to the employee.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Please enter a valid Official E-Mail address (e.g. employee@company.com).');
      return;
    }

    // Selected client matching
    const selectedClientObj = clients.find(
      c => (c.clientName || c.name) === businessUnit || c.id === businessUnit || c._id === businessUnit
    );

    const payload = {
      name: fullName,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      joiningDate,
      confirmationDate: confirmationDate || '',
      dob: dob || '',
      gender,
      employeeCode: employeeCode.trim(),
      employeeId: employeeCode.trim(),
      biometricCode: biometricCode.trim(),
      mobile: mobile.trim(),
      contact: mobile.trim(),
      email: email.trim(),
      sendLogin,
      sendMobileLogin: sendLogin,
      sendWebLogin: sendLogin,
      enablePortalAccess: sendLogin,
      allowMobileAppLogin: sendLogin,

      // Work Profile
      businessUnit: businessUnit || activeCompany?.name || '',
      clientUnit: businessUnit || activeCompany?.name || '',
      clientName: selectedClientObj?.clientName || selectedClientObj?.name || businessUnit || activeCompany?.name || '',
      clientId: selectedClientObj?.id || selectedClientObj?._id || '',
      companyName: activeCompany?.name || '',
      companyId: activeCompany?.companyId || activeCompany?._id || activeCompany?.id || '',
      location: location || '',
      siteLocation: location || '',
      site: location || '',
      department: department ? department.trim() : '',
      designation: designation ? designation.trim() : '',
      employeeType: 'Permanent',
      status: 'Active',
      employeeStatus: 'Active',

      // Policies
      shiftPolicy: shiftPolicy || (shifts[0]?.name || shifts[0]?.shiftName || 'Day Shift (08:00 - 20:00)'),
      shift: shiftPolicy || (shifts[0]?.name || shifts[0]?.shiftName || 'Day Shift (08:00 - 20:00)'),
      weekOffPolicy: weekOffPolicy || 'Sunday Fixed'
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      console.error('Error submitting new employee form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>New Employee</h1>
          <p className={styles.subtitle}>
            Add new employee record by entering employee details.
          </p>
        </div>

        <div className={styles.headerActions}>
          {onSwitchToDetailed && (
            <button
              type="button"
              className={styles.toggleDetailedBtn}
              onClick={onSwitchToDetailed}
              title="Open full 11-step comprehensive employee registration form"
            >
              <Layers size={14} />
              <span>Detailed Form</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form FormGrid */}
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* LEFT COLUMN: Core Details */}
        <div className={styles.leftColumn}>
          {/* Employee Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Employee Name <span className={styles.required}>*</span>
            </label>
            <div className={styles.nameRow}>
              <input
                type="text"
                className={styles.inputField}
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                className={styles.inputField}
                placeholder="Middle Name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
              <input
                type="text"
                className={styles.inputField}
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Dates: Joining Date, Confirmation Date, Date of Birth */}
          <div className={styles.threeColRow}>
            {/* Joining Date */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Joining Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                className={styles.inputField}
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
              />
            </div>

            {/* Confirmation Date */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Confirmation Date
              </label>
              <input
                type="date"
                className={styles.inputField}
                value={confirmationDate}
                onChange={(e) => setConfirmationDate(e.target.value)}
              />
              <p className={styles.probationHelper}>
                <span className={styles.probationIcon}>ⓘ</span>
                <span>If not set, default probation period will be used to calculate confirmation date.</span>
              </p>
            </div>

            {/* Date of Birth */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Date of Birth
              </label>
              <input
                type="date"
                className={styles.inputField}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <p className={styles.helperText}>Optional but recommended</p>
            </div>
          </div>

          {/* Gender */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Gender <span className={styles.required}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={gender === 'Male'}
                  onChange={(e) => setGender(e.target.value)}
                  className={styles.radioInput}
                />
                <span>Male</span>
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={gender === 'Female'}
                  onChange={(e) => setGender(e.target.value)}
                  className={styles.radioInput}
                />
                <span>Female</span>
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="Transgender"
                  checked={gender === 'Transgender'}
                  onChange={(e) => setGender(e.target.value)}
                  className={styles.radioInput}
                />
                <span>Transgender</span>
              </label>
            </div>
          </div>

          {/* Employee Code & Biometric Code */}
          <div className={styles.twoColRow}>
            {/* Employee Code */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Employee Code <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`${styles.inputField} ${styles.readOnlyInput}`}
                value={employeeCode}
                readOnly
                tabIndex="-1"
                title="Employee Code is automatically generated and non-editable"
                placeholder="Auto-generated"
                required
              />
              <p className={styles.helperText}>Will be auto-generated</p>
            </div>

            {/* Biometric Code */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <span>Biometric Code</span>
                <Info size={13} style={{ color: '#94a3b8', cursor: 'help' }} title="Biometric attendance machine ID" />
              </label>
              <input
                type="text"
                className={styles.inputField}
                value={biometricCode}
                onChange={(e) => setBiometricCode(e.target.value)}
                placeholder="Enter biometric machine user ID"
              />
            </div>
          </div>

          {/* Mobile Number & Official E-Mail */}
          <div className={styles.twoColRow}>
            {/* Mobile Number */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                className={styles.inputField}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 9876543210"
              />
              <p className={styles.helperText}>Enter 10-digits only</p>
            </div>

            {/* Official E-Mail */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Official E-Mail {sendLogin && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <input
                type="email"
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={sendLogin ? 'Enter official email (required for login email)' : 'employee@company.com'}
              />
            </div>
          </div>

          {/* Employee Self-Service Access */}
          <div className={styles.selfServiceSection}>
            <label className={styles.fieldLabel} style={{ fontWeight: 700 }}>
              Employee Self-Service Access
            </label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={sendLogin}
                  onChange={(e) => setSendLogin(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Send Login</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className={styles.saveBtnRow}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>Saving Employee...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Work Profile & Policies Card */}
        <div className={styles.rightCard}>
          {/* Work Profile Section */}
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <h3 className={styles.cardSectionTitle}>Work Profile (Optional)</h3>
              <p className={styles.cardSectionDesc}>
                Select work profile for this employee.
              </p>
            </div>

            {/* Client Unit */}
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Client Unit</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectField}
                  value={businessUnit}
                  onChange={(e) => setBusinessUnit(e.target.value)}
                >
                  <option value="">- Select -</option>
                  {activeCompany?.name && (
                    <option value={activeCompany.name}>{activeCompany.name} (Primary)</option>
                  )}
                  {clients.map((c, i) => {
                    const cName = c.clientName || c.name || `Client ${i + 1}`;
                    if (cName === activeCompany?.name) return null;
                    return (
                      <option key={c.id || c._id || i} value={cName}>
                        {cName}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
            </div>

            {/* Location */}
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Location</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectField}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">- Select -</option>
                  {sites.map((s, i) => {
                    const sName = s.name || s.siteName || `Site ${i + 1}`;
                    return <option key={s.id || s._id || i} value={sName}>{sName}</option>;
                  })}
                  {workLocations.map((w, i) => {
                    const wName = w.name || w.locationName || `Location ${i + 1}`;
                    return <option key={w.id || w._id || `wl-${i}`} value={wName}>{wName}</option>;
                  })}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
            </div>

            {/* Department */}
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Department</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectField}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">- Select -</option>
                  {departments.map((d, i) => {
                    const dName = d.name || d.departmentName || `Department ${i + 1}`;
                    return <option key={d.id || d._id || i} value={dName}>{dName}</option>;
                  })}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
            </div>

            {/* Designation */}
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Designation</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectField}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                >
                  <option value="">- Select -</option>
                  {designations.map((des, i) => {
                    const desName = des.name || des.designationName || `Designation ${i + 1}`;
                    return <option key={des.id || des._id || i} value={desName}>{desName}</option>;
                  })}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
            </div>
          </div>

          {/* Policies Section */}
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <h3 className={styles.cardSectionTitle}>Policies (Optional)</h3>
              <p className={styles.cardSectionDesc}>
                Select policies applicable to this employee.
              </p>
            </div>

            {/* Shift Policy */}
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Shift Policy</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectField}
                  value={shiftPolicy}
                  onChange={(e) => setShiftPolicy(e.target.value)}
                >
                  <option value="">- Select -</option>
                  {shifts.map((s, i) => {
                    const sName = s.name || s.shiftName || `Shift ${i + 1}`;
                    return <option key={s.id || s._id || i} value={sName}>{sName}</option>;
                  })}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
            </div>

            {/* Week Off Policy */}
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Week Off Policy</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectField}
                  value={weekOffPolicy}
                  onChange={(e) => setWeekOffPolicy(e.target.value)}
                >
                  <option value="">- Select -</option>
                  {DEFAULT_WEEK_OFFS.map((wo) => (
                    <option key={wo} value={wo}>{wo}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
