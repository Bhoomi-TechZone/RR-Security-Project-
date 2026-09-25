import React from 'react';
import styles from './EmployeeFormSteps.module.css';
import { mockDepartments, mockDesignations } from '../../data/employeeData';

function EmploymentStep({ data, onChange, errors, clients = [] }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleCompanyChange = (selectedClientId) => {
    const selectedClient = (clients || []).find(c => (c.clientId === selectedClientId || c.id === selectedClientId || c._id === selectedClientId));
    onChange({
      ...data,
      clientId: selectedClientId,
      clientName: selectedClient ? selectedClient.name : '',
      companyName: selectedClient ? selectedClient.name : ''
    });
  };

  const selectedClientId = data.clientId || ((clients || []).find(c => c.name === data.clientName || c.name === data.companyName)?.clientId) || ((clients || []).find(c => c.name === data.clientName || c.name === data.companyName)?.id) || '';

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
            <option value="">Select Client Company</option>
            {(clients || []).map(c => {
              const val = c.clientId || c.id || c._id;
              return (
                <option key={val} value={val}>{c.name}</option>
              );
            })}
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
            <option value="">Select</option>
            <option value="Permanent">Permanent</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
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
            <option value="">Select Designation</option>
            {mockDesignations.map(desg => (
              <option key={desg} value={desg}>{desg}</option>
            ))}
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
            <option value="">Select Department</option>
            {mockDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Site/Location */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-site-location" className={styles.label}>Site/Location</label>
          <input
            id="emp-site-location"
            type="text"
            className={styles.input}
            placeholder="e.g. Main Gate, Plant 1"
            value={data.siteLocation || ''}
            onChange={(e) => handleChange('siteLocation', e.target.value)}
          />
        </div>

        {/* Duty Post */}
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-duty-post" className={styles.label}>Duty Post</label>
          <input
            id="emp-duty-post"
            type="text"
            className={styles.input}
            placeholder="e.g. Gate Security"
            value={data.dutyPost || ''}
            onChange={(e) => handleChange('dutyPost', e.target.value)}
          />
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
            <option value="">Select</option>
            <option value="Day">Day</option>
            <option value="Night">Night</option>
            <option value="Rotational">Rotational</option>
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
          <input
            id="emp-joining-location"
            type="text"
            className={styles.input}
            placeholder="e.g. Bareilly"
            value={data.joiningLocation || ''}
            onChange={(e) => handleChange('joiningLocation', e.target.value)}
          />
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
