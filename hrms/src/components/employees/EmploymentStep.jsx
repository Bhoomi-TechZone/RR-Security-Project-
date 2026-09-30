import React, { useMemo } from 'react';
import styles from './EmployeeFormSteps.module.css';

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
    onChange({
      ...data,
      clientId: selectedClientId,
      clientName: selectedClient ? selectedClient.name : '',
      companyName: selectedClient ? selectedClient.name : ''
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

  // Extract department names strictly from dynamic master records
  const deptList = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === data.department)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d));
    }
    return [];
  }, [departments, data.department]);

  // Extract designation names strictly from dynamic master records
  const desgList = useMemo(() => {
    if (designations && designations.length > 0) {
      return designations
        .filter(d => typeof d === 'string' || !d.status || d.status === 'active' || d.name === data.designation)
        .map(d => (typeof d === 'string' ? d : d.name || d.label || d));
    }
    return [];
  }, [designations, data.designation]);

  // Extract employee types strictly from dynamic master records
  const empTypeList = useMemo(() => {
    if (employeeTypes && employeeTypes.length > 0) {
      return employeeTypes
        .filter(t => typeof t === 'string' || !t.status || t.status === 'active' || t.name === data.employeeType)
        .map(t => (typeof t === 'string' ? t : t.name || t.label || t));
    }
    return [];
  }, [employeeTypes, data.employeeType]);

  // Extract shifts strictly from dynamic master records
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

  // Extract duty posts strictly from dynamic master records
  const postList = useMemo(() => {
    if (posts && posts.length > 0) {
      return posts
        .filter(p => typeof p === 'string' || !p.status || p.status === 'active' || p.name === data.dutyPost)
        .map(p => (typeof p === 'string' ? p : p.name || p.label || p));
    }
    return [];
  }, [posts, data.dutyPost]);

  // Filter or list sites strictly from dynamic master records
  const siteList = useMemo(() => {
    if (!sites || sites.length === 0) return [];
    const activeSites = sites.filter(s => typeof s === 'string' || !s.status || s.status === 'active' || (s.name || s.siteName) === data.siteLocation);
    if (selectedClientId) {
      const filtered = activeSites.filter(s => {
        const cId = s.clientId || s.client || '';
        const cName = s.clientName || '';
        return cId === selectedClientId || (data.clientName && cName === data.clientName);
      });
      return filtered.length > 0 ? filtered : activeSites;
    }
    return activeSites;
  }, [sites, selectedClientId, data.clientName, data.siteLocation]);

  // Work locations list strictly from dynamic records
  const locList = useMemo(() => {
    if (workLocations && workLocations.length > 0) {
      return workLocations
        .filter(l => typeof l === 'string' || !l.status || l.status === 'active' || (l.locationName || l.name) === data.joiningLocation)
        .map(l => (typeof l === 'string' ? l : l.locationName || l.name || l));
    }
    return [];
  }, [workLocations, data.joiningLocation]);

  return (
    <div className={styles.stepContainer}>
      <div className={styles.fourColumnGrid}>
        {/* Client Name */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-company" className={styles.label}>Client Name *</label>
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

        {/* Employee Type */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-type" className={styles.label}>Employee Type</label>
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

        {/* Designation */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-designation" className={styles.label}>Designation</label>
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

        {/* Department */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-department" className={styles.label}>Department</label>
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

        {/* Site/Location */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-site-location" className={styles.label}>Site/Location</label>
          <select
            id="emp-site-location"
            className={styles.select}
            value={data.siteLocation || ''}
            onChange={(e) => {
              const val = e.target.value;
              const foundSite = siteList.find(s => (s.name || s.siteName) === val);
              if (foundSite) {
                const clientOfSite = (clients || []).find(c => (c.clientId === foundSite.clientId || c.id === foundSite.clientId || c._id === foundSite.clientId || c.name === foundSite.clientName));
                onChange({
                  ...data,
                  siteLocation: val,
                  clientId: clientOfSite ? (clientOfSite.clientId || clientOfSite.id || clientOfSite._id) : (foundSite.clientId || data.clientId),
                  clientName: clientOfSite ? clientOfSite.name : (foundSite.clientName || data.clientName)
                });
              } else {
                handleChange('siteLocation', val);
              }
            }}
          >
            <option value="">
              {siteList.length > 0 ? 'Select Site' : 'No active sites in Masters'}
            </option>
            {siteList.map(s => {
              const sName = s.name || s.siteName || s;
              return <option key={sName} value={sName}>{sName}</option>;
            })}
            {data.siteLocation && !siteList.some(s => (s.name || s.siteName || s) === data.siteLocation) && (
              <option value={data.siteLocation}>{data.siteLocation}</option>
            )}
          </select>
        </div>

        {/* Duty Post */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-duty-post" className={styles.label}>Duty Post</label>
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

        {/* Shift */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-shift" className={styles.label}>Shift</label>
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

        {/* Reporting Supervisor */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-reporting" className={styles.label}>Reporting Supervisor</label>
          <input
            id="emp-reporting"
            type="text"
            className={styles.input}
            placeholder="Supervisor name"
            value={data.reportingSupervisor || ''}
            onChange={(e) => handleChange('reportingSupervisor', e.target.value)}
          />
        </div>

        {/* Joining Location */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-joining-location" className={styles.label}>Joining Location</label>
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

        {/* Previous Experience */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-prev-exp" className={styles.label}>Previous Experience</label>
          <input
            id="emp-prev-exp"
            type="text"
            className={styles.input}
            placeholder="e.g. 2 years"
            value={data.previousExperience || ''}
            onChange={(e) => handleChange('previousExperience', e.target.value)}
          />
        </div>

        {/* Language */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-language" className={styles.label}>Language (Read + Write)</label>
          <input
            id="emp-language"
            type="text"
            className={styles.input}
            placeholder="e.g. Hindi, English"
            value={data.language || ''}
            onChange={(e) => handleChange('language', e.target.value)}
          />
        </div>

        {/* Qualification */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-qualification" className={styles.label}>Qualification</label>
          <input
            id="emp-qualification"
            type="text"
            className={styles.input}
            placeholder="e.g. 10th, 12th, Graduate"
            value={data.qualification || ''}
            onChange={(e) => handleChange('qualification', e.target.value)}
          />
        </div>

        {/* Technical Qualification */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-tech-qualification" className={styles.label}>Technical Qualification</label>
          <input
            id="emp-tech-qualification"
            type="text"
            className={styles.input}
            placeholder="e.g. ITI, Diploma, Computer"
            value={data.technicalQualification || ''}
            onChange={(e) => handleChange('technicalQualification', e.target.value)}
          />
        </div>

        {/* Employee Status */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-status" className={styles.label}>Employee Status</label>
          <select
            id="emp-status"
            className={styles.select}
            value={data.employeeStatus || ''}
            onChange={(e) => handleChange('employeeStatus', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
          </select>
        </div>

        {/* Exit Date */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-exit-date" className={styles.label}>Exit Date</label>
          <input
            id="emp-exit-date"
            type="date"
            className={styles.input}
            value={data.exitDate || ''}
            onChange={(e) => handleChange('exitDate', e.target.value)}
          />
        </div>

        {/* Exit Reason */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-exit-reason" className={styles.label}>Exit Reason</label>
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
  );
}

export default EmploymentStep;
