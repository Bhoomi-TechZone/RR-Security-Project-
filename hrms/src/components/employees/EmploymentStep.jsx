import React, { useMemo, useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { userService } from '../../services/userService';
import roleService from '../../services/roleService';
import styles from './EmploymentStep.module.css';

export const ATTENDANCE_METHODS_LIST = [
  'Default / WiFi / Geolocation',
  'Biometric Device',
  'QR Code',
  'NFC',
  'Selfie Attendance',
  'Face Scan Terminal'
];

export const DEFAULT_WEEK_OFFS = [
  'Sunday Fixed',
  'Rotational (6 Days Working)',
  'Saturday & Sunday (5 Days Working)',
  'Monday Fixed',
  'Tuesday Fixed',
  'Wednesday Fixed',
  'Thursday Fixed',
  'Friday Fixed',
  'Saturday Fixed',
  'No Week Off'
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
  shifts = [],
  workLocations = []
}) {
  const { activeCompany } = useCompany();
  const companyId = data.companyId || activeCompany?.companyId || activeCompany?.id || '';

  const [managerOptions, setManagerOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);

  useEffect(() => {
    let isCancelled = false;
    const fetchReportingUsers = async () => {
      if (!companyId) return;
      try {
        const [usersRes, rolesRes] = await Promise.allSettled([
          userService.getUsers(companyId),
          roleService.getRoles(companyId)
        ]);

        if (isCancelled) return;

        const userList = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
        const roleList = rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value) ? rolesRes.value : [];

        // Build role lookup map by ID and Name
        const roleMap = new Map();
        roleList.forEach(r => {
          const rId = String(r.id || r._id || r.roleId || '').trim();
          if (rId) roleMap.set(rId, String(r.name || '').toLowerCase());
        });

        const managers = [];
        const supervisors = [];
        const seenMgr = new Set();
        const seenSup = new Set();

        userList.forEach(u => {
          const name = (u.name || u.fullName || u.username || '').trim();
          if (!name) return;

          // Check role name from user directly or via role lookup
          const directRole = String(u.roleName || u.role || u.assignedRole || '').toLowerCase().trim();
          const mappedRole = u.roleId ? (roleMap.get(String(u.roleId).trim()) || '') : '';
          const roleCombined = `${directRole} ${mappedRole}`;

          const isSupervisor = (roleCombined.includes('supervisor') || roleCombined.includes('superviser')) && !roleCombined.includes('manager');
          const isManager = (roleCombined.includes('manager') || roleCombined.includes('mgr')) && !roleCombined.includes('supervisor');

          const userId = u.userId || u.id || u.user_id || '';
          const label = userId ? `${name} (${userId})` : name;

          if (isManager && !seenMgr.has(name.toLowerCase())) {
            seenMgr.add(name.toLowerCase());
            managers.push({
              key: `mgr-${u._id || u.id || userId || name}`,
              name: name,
              userId: userId,
              label: label,
              role: u.roleName || 'Manager'
            });
          }

          if (isSupervisor && !seenSup.has(name.toLowerCase())) {
            seenSup.add(name.toLowerCase());
            supervisors.push({
              key: `sup-${u._id || u.id || userId || name}`,
              name: name,
              userId: userId,
              label: label,
              role: u.roleName || 'Supervisor'
            });
          }
        });

        setManagerOptions(managers);
        setSupervisorOptions(supervisors);
      } catch (err) {
        console.error('Error fetching reporting users:', err);
      }
    };

    fetchReportingUsers();

    return () => {
      isCancelled = true;
    };
  }, [companyId]);

  const currentMgrValue = useMemo(() => {
    if (!data.reportingManager) return '';
    const match = managerOptions.find(
      m => m.name === data.reportingManager || m.label === data.reportingManager || m.userId === data.reportingManager
    );
    return match ? match.label : data.reportingManager;
  }, [data.reportingManager, managerOptions]);

  const currentSupValue = useMemo(() => {
    if (!data.reportingSupervisor) return '';
    const match = supervisorOptions.find(
      s => s.name === data.reportingSupervisor || s.label === data.reportingSupervisor || s.userId === data.reportingSupervisor
    );
    return match ? match.label : data.reportingSupervisor;
  }, [data.reportingSupervisor, supervisorOptions]);

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

    const siteWithAddr = matchingSites.find(s => s.address || s.city);
    const resolvedAddress = clientAddress || (siteWithAddr && (siteWithAddr.address || siteWithAddr.city)
      ? [siteWithAddr.address, siteWithAddr.city, siteWithAddr.state, siteWithAddr.pinCode].filter(Boolean).join(', ')
      : '');

    onChange({
      ...data,
      clientId: selectedClientId,
      clientName: clientName,
      companyName: clientName,
      site: resolvedAddress || clientAddress,
      siteLocation: resolvedAddress || clientAddress,
      clientAddress: resolvedAddress || clientAddress
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

  const selectedClient = useMemo(() => {
    return (clients || []).find(
      c => (c.clientId && (c.clientId === selectedClientId || c.clientId === data.clientId)) ||
           (c.id && (c.id === selectedClientId || c.id === data.clientId)) ||
           (c._id && (c._id === selectedClientId || c._id === data.clientId)) ||
           (c.name && (c.name === data.clientName || c.name === data.companyName))
    );
  }, [clients, selectedClientId, data.clientId, data.clientName, data.companyName]);

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

  // Current client location address derived from selected client
  const clientLocationAddress = useMemo(() => {
    // 1. If selected client has address, prioritize that
    if (selectedClient?.address) {
      return selectedClient.address;
    }
    // 2. If data has clientAddress (and it's not a dummy site name like 'Branch Office' or 'Main Site')
    if (data.clientAddress && data.clientAddress !== 'Branch Office' && data.clientAddress !== 'Main Site') {
      return data.clientAddress;
    }
    // 3. Try matching site address for the selected client
    const siteWithAddr = (sites || []).find(s => {
      if (typeof s !== 'object' || !s) return false;
      const cId = String(s.clientId || s.client || '').trim();
      const cName = String(s.clientName || '').trim().toLowerCase();
      const selName = String(data.clientName || data.companyName || '').trim().toLowerCase();
      const selId = String(selectedClientId || data.clientId || '').trim();
      return (selId && cId === selId) || (selName && cName && (cName === selName || cName.includes(selName)));
    });
    if (siteWithAddr?.address) {
      const full = [siteWithAddr.address, siteWithAddr.city, siteWithAddr.state, siteWithAddr.pinCode].filter(Boolean).join(', ');
      if (full) return full;
      return siteWithAddr.address;
    }
    if (data.siteLocation && data.siteLocation !== 'Branch Office' && data.siteLocation !== 'Main Site') {
      return data.siteLocation;
    }
    return '';
  }, [selectedClient, data.clientAddress, data.siteLocation, sites, selectedClientId, data.clientName, data.companyName]);

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

            {/* Client Location */}
            <div className={styles.formRow}>
              <label className={styles.rowLabel}>
                <span>Client Location</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-client-location"
                  type="text"
                  className={styles.input}
                  readOnly
                  disabled
                  tabIndex={-1}
                  placeholder={selectedClientId || data.clientName ? 'No address specified for selected client' : 'Select Client Company to view address'}
                  value={clientLocationAddress || ''}
                  style={{
                    backgroundColor: '#f8fafc',
                    color: clientLocationAddress ? '#334155' : '#94a3b8',
                    cursor: 'not-allowed',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
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
              <label htmlFor="emp-reporting-supervisor" className={styles.rowLabel}>
                <span>Reporting Supervisor</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-reporting-supervisor"
                  className={styles.select}
                  value={currentSupValue}
                  onChange={(e) => handleChange('reportingSupervisor', e.target.value)}
                >
                  <option value="">
                    {supervisorOptions.length > 0 ? 'Select Reporting Supervisor' : 'No users with Supervisor role found'}
                  </option>
                  {supervisorOptions.map((sup) => (
                    <option key={sup.key} value={sup.label}>
                      {sup.label}
                    </option>
                  ))}
                  {currentSupValue && !supervisorOptions.some(s => s.label === currentSupValue) && (
                    <option value={currentSupValue}>{currentSupValue}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Reporting Manager */}
            <div className={styles.formRow}>
              <label htmlFor="emp-reporting-manager" className={styles.rowLabel}>
                <span>Reporting Manager</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-reporting-manager"
                  className={styles.select}
                  value={currentMgrValue}
                  onChange={(e) => handleChange('reportingManager', e.target.value)}
                >
                  <option value="">
                    {managerOptions.length > 0 ? 'Select Reporting Manager' : 'No users with Manager role found'}
                  </option>
                  {managerOptions.map((mgr) => (
                    <option key={mgr.key} value={mgr.label}>
                      {mgr.label}
                    </option>
                  ))}
                  {currentMgrValue && !managerOptions.some(m => m.label === currentMgrValue) && (
                    <option value={currentMgrValue}>{currentMgrValue}</option>
                  )}
                </select>
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
                  placeholder="Enter Previous Experience"
                  value={data.previousExperience || ''}
                  onChange={(e) => handleChange('previousExperience', e.target.value)}
                />
              </div>
            </div>

            {/* Language (Read + Write) */}
            <div className={styles.formRow}>
              <label htmlFor="emp-language" className={styles.rowLabel}>
                <span>Language (Read + Write)</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-language"
                  type="text"
                  className={styles.input}
                  placeholder="Enter Languages Known"
                  value={data.language || ''}
                  onChange={(e) => handleChange('language', e.target.value)}
                />
              </div>
            </div>

            {/* Highest Qualification */}
            <div className={styles.formRow}>
              <label htmlFor="emp-qualification" className={styles.rowLabel}>
                <span>Highest Qualification</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="emp-qualification"
                  type="text"
                  className={styles.input}
                  placeholder="Enter Highest Qualification"
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
                  placeholder="Enter Technical Qualification"
                  value={data.technicalQualification || ''}
                  onChange={(e) => handleChange('technicalQualification', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Employment Status & Policies */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Employment Status & Policies</h4>

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

            {/* Shift Policy */}
            <div className={styles.formRow}>
              <label htmlFor="emp-shift-policy" className={styles.rowLabel}>
                <span>Shift Policy</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-shift-policy"
                  className={styles.select}
                  value={data.shiftPolicy || data.shift || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange({
                      ...data,
                      shiftPolicy: val,
                      shift: val
                    });
                  }}
                >
                  <option value="">Select Shift Policy</option>
                  {shiftList.map(s => (
                    <option key={s.name} value={s.name}>{s.label}</option>
                  ))}
                  {data.shiftPolicy && !shiftList.some(s => s.name === data.shiftPolicy) && (
                    <option value={data.shiftPolicy}>{data.shiftPolicy}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Weekoff Policy */}
            <div className={styles.formRow}>
              <label htmlFor="emp-weekoff-policy" className={styles.rowLabel}>
                <span>Weekoff Policy</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-weekoff-policy"
                  className={styles.select}
                  value={data.weekOffPolicy || ''}
                  onChange={(e) => handleChange('weekOffPolicy', e.target.value)}
                >
                  <option value="">Select Weekoff Policy</option>
                  {DEFAULT_WEEK_OFFS.map(wo => (
                    <option key={wo} value={wo}>{wo}</option>
                  ))}
                  {data.weekOffPolicy && !DEFAULT_WEEK_OFFS.includes(data.weekOffPolicy) && (
                    <option value={data.weekOffPolicy}>{data.weekOffPolicy}</option>
                  )}
                </select>
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
                <span className={styles.summaryLabel}>Location</span>
                <span className={styles.summaryValue} title={clientLocationAddress || 'Not Assigned'}>
                  {clientLocationAddress || 'Not Assigned'}
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
                    <div className={`${styles.checkboxBox} ${isSelected ? styles.checkboxChecked : ''}`}>
                      {isSelected && (
                        <svg viewBox="0 0 16 16" fill="none" className={styles.checkIcon}>
                          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles.methodName}>{method}</span>
                  </div>
                );
              })}
            </div>
            <p className={styles.helpText}>Select authorized attendance punch channels for this employee profile.</p>
          </div>

          {/* Card 3: Shift Timings & Rules */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h4 className={styles.sideCardTitle}>Shift Timings & Rules</h4>
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
