import React, { useMemo } from 'react';
import styles from './EmploymentStep.module.css';

export const ATTENDANCE_METHODS_LIST = [
  'Default / WiFi / Geolocation',
  'Biometric Device',
  'QR Code',
  'NFC',
  'Selfie Attendance',
  'Face Scan Terminal'
];

function EmploymentStep({
  data,
  onChange,
  errors,
  clients = [],
  departments = [],
  designations = [],
  employeeTypes = [],
  sites = [],
  posts = [],
  shifts = [],
  workLocations = []
}) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleCompanyChange = (selectedClientId) => {
    const selectedClient = (clients || []).find(
      c => (c.clientId === selectedClientId || c.id === selectedClientId || c._id === selectedClientId)
    );
    const clientName = selectedClient ? (selectedClient.name || selectedClient.clientName || '') : '';
    const clientAddress = selectedClient ? (selectedClient.address || '') : '';

    const matchingSites = (sites || []).filter(s => {
      if (typeof s === 'string') return false;
      const cId = String(s.clientId || s.client || '').trim();
      const cName = String(s.clientName || '').trim().toLowerCase();
      const selName = clientName.trim().toLowerCase();
      return (selectedClientId && cId === String(selectedClientId)) ||
             (selName && (cName === selName || cName.includes(selName) || selName.includes(cName)));
    });

    const defaultSite = matchingSites.length === 1 ? (matchingSites[0].name || matchingSites[0].siteName || '') : '';
    const defaultSiteAddress = matchingSites.length === 1 && (matchingSites[0].address || matchingSites[0].city)
      ? [matchingSites[0].address, matchingSites[0].city, matchingSites[0].state].filter(Boolean).join(', ')
      : clientAddress;

    onChange({
      ...data,
      clientId: selectedClientId,
      clientName: clientName,
      companyName: clientName,
      site: defaultSite,
      siteLocation: defaultSite,
      clientAddress: defaultSiteAddress
    });
  };

  const selectedClientId =
    data.clientId ||
    ((clients || []).find(c => c.name === data.clientName || c.name === data.companyName)?.clientId) ||
    ((clients || []).find(c => c.name === data.clientName || c.name === data.companyName)?.id) ||
    '';

  const activeClients = useMemo(() => {
    return (clients || []).filter(c => {
      const isActive = !c.status || c.status === 'active';
      const isCurrent = (c.clientId && c.clientId === data.clientId) ||
                        (c.id && c.id === data.clientId) ||
                        (c._id && c._id === data.clientId) ||
                        (data.clientName && c.name === data.clientName) ||
                        (data.companyName && c.name === data.companyName);
      return isActive || isCurrent;
    });
  }, [clients, data.clientId, data.clientName, data.companyName]);

  const deptList = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === data.department)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d));
    }
    return [];
  }, [departments, data.department]);

  const desgList = useMemo(() => {
    if (designations && designations.length > 0) {
      return designations
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === data.designation)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d));
    }
    return [];
  }, [designations, data.designation]);

  const empTypeList = useMemo(() => {
    if (employeeTypes && employeeTypes.length > 0) {
      return employeeTypes
        .filter(t => typeof t === 'string' || !t.status || t.status === 'active' || t.name === data.employeeType)
        .map(t => (typeof t === 'string' ? t : t.name || t.label || t));
    }
    return [];
  }, [employeeTypes, data.employeeType]);

  const shiftList = useMemo(() => {
    if (shifts && shifts.length > 0) {
      return shifts
        .filter(s => typeof s === 'string' || !s.status || s.status === 'active' || s.name === data.shift)
        .map(s => {
          if (typeof s === 'string') return { name: s, label: s };
          const timeInfo = s.startTime && s.endTime ? ` (${s.startTime} - ${s.endTime})` : '';
          return { name: s.name, label: `${s.name}${timeInfo}` };
        });
    }
    return [];
  }, [shifts, data.shift]);

  const postList = useMemo(() => {
    if (posts && posts.length > 0) {
      return posts
        .filter(p => typeof p === 'string' || !p.status || p.status === 'active' || p.name === data.dutyPost)
        .map(p => (typeof p === 'string' ? p : p.name || p.label || p));
    }
    return [];
  }, [posts, data.dutyPost]);

  const siteList = useMemo(() => {
    if (!sites || sites.length === 0) return [];

    const activeSites = sites.filter(s => {
      if (typeof s === 'string') return true;
      const sName = s.name || s.siteName || '';
      return !s.status || s.status === 'active' || s.status === 'Active' || sName === data.site || sName === data.siteLocation;
    });

    if (selectedClientId || data.clientName || data.companyName) {
      const selName = String(data.clientName || data.companyName || '').trim().toLowerCase();
      const selId = String(selectedClientId || data.clientId || '').trim();

      const filtered = activeSites.filter(s => {
        if (typeof s === 'string') return true;
        const cId = String(s.clientId || s.client || '').trim();
        const cName = String(s.clientName || '').trim().toLowerCase();

        const matchesId = selId && cId && (cId === selId);
        const matchesName = selName && cName && (cName === selName || cName.includes(selName) || selName.includes(cName));
        return matchesId || matchesName;
      });

      return filtered;
    }

    return activeSites;
  }, [sites, selectedClientId, data.clientId, data.clientName, data.companyName, data.siteLocation, data.site]);

  const locList = useMemo(() => {
    if (workLocations && workLocations.length > 0) {
      return workLocations
        .filter(l => typeof l === 'string' || !l.status || l.status === 'active' || (l.locationName || l.name) === data.joiningLocation)
        .map(l => (typeof l === 'string' ? l : l.locationName || l.name || l));
    }
    return [];
  }, [workLocations, data.joiningLocation]);

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Employment Details</h3>
          <p className={styles.headerSubtitle}>
            Client company allocation, site location, designation, department and shift roster.
          </p>
        </div>
      </div>

      {/* ========================================================
          2. TWO-COLUMN LAYOUT (FORM ON LEFT, SIDEBAR CARDS ON RIGHT)
         ======================================================== */}
      <div className={styles.mainLayout}>
        {/* Left Form Column */}
        <div className={styles.mainForm}>
          {/* Section 1: Placement & Organization */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Deployment & Organization</h4>

            {/* Client Name */}
            <div className={styles.formRow}>
              <label htmlFor="emp-company" className={styles.rowLabel}>
                <span>Client Name</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-company"
                  className={styles.select}
                  value={selectedClientId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                >
                  <option value="">
                    {activeClients.length > 0 ? 'Select Client Company' : 'No active clients found'}
                  </option>
                  {activeClients.map(c => {
                    const val = c.clientId || c.id || c._id;
                    return (
                      <option key={val} value={val}>{c.name}</option>
                    );
                  })}
                  {data.clientName && !activeClients.some(c => c.name === data.clientName) && (
                    <option value={data.clientId || data.clientName}>{data.clientName}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Client Site */}
            <div className={styles.formRow}>
              <label htmlFor="emp-client-site" className={styles.rowLabel}>
                <span>Client Site</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-client-site"
                  className={styles.select}
                  value={data.site || data.siteLocation || ''}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    const matchedSite = siteList.find(s => (typeof s === 'string' ? s : s.name || s.siteName) === selectedVal);
                    const siteName = matchedSite ? (typeof matchedSite === 'string' ? matchedSite : matchedSite.name || matchedSite.siteName) : selectedVal;
                    const siteAddress = (matchedSite && typeof matchedSite === 'object' && (matchedSite.address || matchedSite.city))
                      ? [matchedSite.address, matchedSite.city, matchedSite.state].filter(Boolean).join(', ')
                      : '';
                    onChange({
                      ...data,
                      site: siteName,
                      siteLocation: siteName,
                      clientAddress: siteAddress || data.clientAddress || ''
                    });
                  }}
                >
                  <option value="">
                    {!selectedClientId
                      ? 'Select Client Company first'
                      : siteList.length > 0
                        ? 'Select Client Site'
                        : 'No sites found for this client'}
                  </option>
                  {siteList.map((site) => {
                    const siteName = typeof site === 'string' ? site : site.name || site.siteName || '';
                    const siteCode = typeof site === 'object' && site.code ? ` (${site.code})` : '';
                    const siteBranch = typeof site === 'object' && (site.workLocationName || site.city)
                      ? ` - ${site.workLocationName || site.city}`
                      : '';
                    return (
                      <option key={typeof site === 'object' ? (site._id || site.id || site.code || siteName) : site} value={siteName}>
                        {siteName}{siteCode}{siteBranch}
                      </option>
                    );
                  })}
                  {(data.site || data.siteLocation) &&
                    !siteList.some(s => (typeof s === 'string' ? s : s.name || s.siteName) === (data.site || data.siteLocation)) && (
                      <option value={data.site || data.siteLocation}>
                        {data.site || data.siteLocation}
                      </option>
                  )}
                </select>
              </div>
            </div>

            {/* Designation */}
            <div className={styles.formRow}>
              <label htmlFor="emp-designation" className={styles.rowLabel}>
                <span>Designation</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-designation"
                  className={styles.select}
                  value={data.designation || ''}
                  onChange={(e) => handleChange('designation', e.target.value)}
                >
                  <option value="">
                    {desgList.length > 0 ? 'Select Designation' : 'No active designations in Masters'}
                  </option>
                  {desgList.map(desg => (
                    <option key={desg} value={desg}>{desg}</option>
                  ))}
                  {data.designation && !desgList.includes(data.designation) && (
                    <option value={data.designation}>{data.designation}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Department */}
            <div className={styles.formRow}>
              <label htmlFor="emp-department" className={styles.rowLabel}>
                <span>Department</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-department"
                  className={styles.select}
                  value={data.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                >
                  <option value="">
                    {deptList.length > 0 ? 'Select Department' : 'No active departments in Masters'}
                  </option>
                  {deptList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  {data.department && !deptList.includes(data.department) && (
                    <option value={data.department}>{data.department}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Duty Post */}
            <div className={styles.formRow}>
              <label htmlFor="emp-duty-post" className={styles.rowLabel}>
                <span>Duty Post</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-duty-post"
                  className={styles.select}
                  value={data.dutyPost || ''}
                  onChange={(e) => handleChange('dutyPost', e.target.value)}
                >
                  <option value="">
                    {postList.length > 0 ? 'Select Duty Post' : 'No active posts in Masters'}
                  </option>
                  {postList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  {data.dutyPost && !postList.includes(data.dutyPost) && (
                    <option value={data.dutyPost}>{data.dutyPost}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Employee Type */}
            <div className={styles.formRow}>
              <label htmlFor="emp-type" className={styles.rowLabel}>
                <span>Employee Type</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-type"
                  className={styles.select}
                  value={data.employeeType || ''}
                  onChange={(e) => handleChange('employeeType', e.target.value)}
                >
                  <option value="">
                    {empTypeList.length > 0 ? 'Select Employee Type' : 'No active employee types in Masters'}
                  </option>
                  {empTypeList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  {data.employeeType && !empTypeList.includes(data.employeeType) && (
                    <option value={data.employeeType}>{data.employeeType}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Joining Location */}
            <div className={styles.formRow}>
              <label htmlFor="emp-joining-location" className={styles.rowLabel}>
                <span>Joining Location</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-joining-location"
                  className={styles.select}
                  value={data.joiningLocation || ''}
                  onChange={(e) => handleChange('joiningLocation', e.target.value)}
                >
                  <option value="">
                    {locList.length > 0 ? 'Select Joining Location' : 'No active locations in Masters'}
                  </option>
                  {locList.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                  {data.joiningLocation && !locList.includes(data.joiningLocation) && (
                    <option value={data.joiningLocation}>{data.joiningLocation}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Shift & Reporting */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Shift & Reporting</h4>

            {/* Shift */}
            <div className={styles.formRow}>
              <label htmlFor="emp-shift" className={styles.rowLabel}>
                <span>Shift</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-shift"
                  className={styles.select}
                  value={data.shift || ''}
                  onChange={(e) => handleChange('shift', e.target.value)}
                >
                  <option value="">
                    {shiftList.length > 0 ? 'Select Shift' : 'No active shifts in Masters'}
                  </option>
                  {shiftList.map(s => (
                    <option key={s.name} value={s.name}>{s.label}</option>
                  ))}
                  {data.shift && !shiftList.some(s => s.name === data.shift) && (
                    <option value={data.shift}>{data.shift}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Reporting Supervisor */}
            <div className={styles.formRow}>
              <label htmlFor="emp-reporting" className={styles.rowLabel}>
                <span>Reporting Supervisor</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-reporting"
                  type="text"
                  className={styles.input}
                  placeholder="Supervisor name"
                  value={data.reportingSupervisor || ''}
                  onChange={(e) => handleChange('reportingSupervisor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Background & Qualification */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Background & Qualification</h4>

            {/* Previous Experience */}
            <div className={styles.formRow}>
              <label htmlFor="emp-prev-exp" className={styles.rowLabel}>
                <span>Previous Experience</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-prev-exp"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 2 years"
                  value={data.previousExperience || ''}
                  onChange={(e) => handleChange('previousExperience', e.target.value)}
                />
              </div>
            </div>

            {/* Language */}
            <div className={styles.formRow}>
              <label htmlFor="emp-language" className={styles.rowLabel}>
                <span>Language (Read + Write)</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-language"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Hindi, English"
                  value={data.language || ''}
                  onChange={(e) => handleChange('language', e.target.value)}
                />
              </div>
            </div>

            {/* Qualification */}
            <div className={styles.formRow}>
              <label htmlFor="emp-qualification" className={styles.rowLabel}>
                <span>Qualification</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-qualification"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 10th, 12th, Graduate"
                  value={data.qualification || ''}
                  onChange={(e) => handleChange('qualification', e.target.value)}
                />
              </div>
            </div>

            {/* Technical Qualification */}
            <div className={styles.formRow}>
              <label htmlFor="emp-tech-qualification" className={styles.rowLabel}>
                <span>Technical Qualification</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-tech-qualification"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ITI, Diploma, Computer"
                  value={data.technicalQualification || ''}
                  onChange={(e) => handleChange('technicalQualification', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Employment Status & Separation */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Employment Status & Exit</h4>

            {/* Employee Status */}
            <div className={styles.formRow}>
              <label htmlFor="emp-status" className={styles.rowLabel}>
                <span>Employee Status</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-status"
                  className={styles.select}
                  value={data.employeeStatus || 'Active'}
                  onChange={(e) => handleChange('employeeStatus', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            </div>

            {/* Exit Date */}
            <div className={styles.formRow}>
              <label htmlFor="emp-exit-date" className={styles.rowLabel}>
                <span>Exit Date</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-exit-date"
                  type="date"
                  className={styles.input}
                  value={data.exitDate || ''}
                  onChange={(e) => handleChange('exitDate', e.target.value)}
                />
              </div>
            </div>

            {/* Exit Reason */}
            <div className={styles.formRow}>
              <label htmlFor="emp-exit-reason" className={styles.rowLabel}>
                <span>Exit Reason</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-exit-reason"
                  type="text"
                  className={styles.input}
                  placeholder="Enter reason for exit"
                  value={data.exitReason || ''}
                  onChange={(e) => handleChange('exitReason', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Cards */}
        <div className={styles.rightSidebar}>
          {/* Card 1: Deployment Summary */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h4 className={styles.sideCardTitle}>Deployment Overview</h4>
              <span className={styles.badgeSuccess}>
                {data.employeeStatus || 'Active'}
              </span>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Client</span>
                <span className={styles.summaryValue} title={data.clientName || data.companyName}>
                  {data.clientName || data.companyName || 'Not Assigned'}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Site</span>
                <span className={styles.summaryValue} title={data.site || data.siteLocation}>
                  {data.site || data.siteLocation || 'Not Assigned'}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Designation</span>
                <span className={styles.summaryValue} title={data.designation}>
                  {data.designation || 'Not Assigned'}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Department</span>
                <span className={styles.summaryValue} title={data.department}>
                  {data.department || 'Not Assigned'}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Shift</span>
                <span className={styles.summaryValue} title={data.shift}>
                  {data.shift || 'Default'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Attendance Methods */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h4 className={styles.sideCardTitle}>Attendance Methods</h4>
              <span className={styles.sideCardSubtitle}>(Multi-Select)</span>
            </div>

            <div className={styles.methodsGrid} role="listbox" aria-multiselectable="true">
              {ATTENDANCE_METHODS_LIST.map((method) => {
                const currentMethods = Array.isArray(data.attendanceMethods) ? data.attendanceMethods : [];
                const isSelected = currentMethods.includes(method);
                return (
                  <div
                    key={method}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.methodItem} ${isSelected ? styles.methodSelected : ''}`}
                    onClick={() => {
                      let nextMethods;
                      if (isSelected) {
                        nextMethods = currentMethods.filter(m => m !== method);
                        if (nextMethods.length === 0) nextMethods = [method];
                      } else {
                        nextMethods = [...currentMethods, method];
                      }
                      onChange({
                        ...data,
                        attendanceMethods: nextMethods,
                        attendanceMethod: nextMethods[0] || 'Manual'
                      });
                    }}
                  >
                    <span>{method}</span>
                    <span className={`${styles.methodCheck} ${isSelected ? styles.methodCheckSelected : ''}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className={styles.helperText}>
              Select authorized attendance punch channels for this employee.
            </p>
          </div>

          {/* Card 3: Attendance & Access Rules */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h4 className={styles.sideCardTitle}>Attendance Rules</h4>
              <span className={styles.sideCardSubtitle}>Permissions</span>
            </div>

            <div className={styles.rulesList}>
              {/* Allow Mobile App Login */}
              <label className={`${styles.ruleCard} ${data.allowMobileAppLogin ? styles.ruleCardActive : ''}`}>
                <input
                  type="checkbox"
                  className={styles.ruleCheckbox}
                  checked={data.allowMobileAppLogin !== undefined ? !!data.allowMobileAppLogin : true}
                  onChange={(e) => handleChange('allowMobileAppLogin', e.target.checked)}
                />
                <div className={styles.ruleContent}>
                  <span className={styles.ruleTitle}>Allow Mobile App Login</span>
                  <p className={styles.ruleDesc}>
                    Permits signing in to the mobile self-service app.
                  </p>
                </div>
              </label>

              {/* Attendance during Holiday and Office off Days */}
              <label className={`${styles.ruleCard} ${data.attendanceHolidayOfficeOff ? styles.ruleCardActive : ''}`}>
                <input
                  type="checkbox"
                  className={styles.ruleCheckbox}
                  checked={!!data.attendanceHolidayOfficeOff}
                  onChange={(e) => handleChange('attendanceHolidayOfficeOff', e.target.checked)}
                />
                <div className={styles.ruleContent}>
                  <span className={styles.ruleTitle}>Punch on Holidays / Off Days</span>
                  <p className={styles.ruleDesc}>
                    Allows recording duty attendance on gazetted holidays and weekly offs.
                  </p>
                </div>
              </label>

              {/* Auto Punch-Out When Location OFF */}
              <label className={`${styles.ruleCard} ${data.autoPunchOutLocationOff ? styles.ruleCardActive : ''}`}>
                <input
                  type="checkbox"
                  className={styles.ruleCheckbox}
                  checked={!!data.autoPunchOutLocationOff}
                  onChange={(e) => handleChange('autoPunchOutLocationOff', e.target.checked)}
                />
                <div className={styles.ruleContent}>
                  <span className={styles.ruleTitle}>Auto Punch-Out Location OFF</span>
                  <p className={styles.ruleDesc}>
                    Auto punch-out & marked absent when GPS is disabled.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmploymentStep;
