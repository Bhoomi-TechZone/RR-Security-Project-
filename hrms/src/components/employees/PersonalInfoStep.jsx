import React from 'react';
import styles from './EmployeeFormSteps.module.css';

function PersonalInfoStep({ data, onChange, errors }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className={styles.stepContainer}>
      {/* Row 1: 3 fields */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-code" className={styles.label}>Employee Code</label>
          <input
            id="emp-code"
            type="text"
            className={styles.input}
            value={data.employeeCode || ''}
            onChange={(e) => handleChange('employeeCode', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="joining-date" className={styles.label}>Joining Date</label>
          <input
            id="joining-date"
            type="date"
            className={styles.input}
            value={data.joiningDate || ''}
            onChange={(e) => handleChange('joiningDate', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-name" className={styles.label}>Employee Name</label>
          <input
            id="emp-name"
            type="text"
            className={styles.input}
            placeholder="e.g. Rahul Kumar"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: 3 fields */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-father" className={styles.label}>Father/Husband Name</label>
          <input
            id="emp-father"
            type="text"
            className={styles.input}
            placeholder="Enter father or husband name"
            value={data.fatherHusbandName || ''}
            onChange={(e) => handleChange('fatherHusbandName', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-father-relation" className={styles.label}>Relation</label>
          <select
            id="emp-father-relation"
            className={styles.select}
            value={data.fatherHusbandRelation || ''}
            onChange={(e) => handleChange('fatherHusbandRelation', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Father">Father</option>
            <option value="Husband">Husband</option>
            <option value="Mother">Mother</option>
            <option value="Spouse">Spouse</option>
            <option value="Guardian">Guardian</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-gender" className={styles.label}>Gender</label>
          <select
            id="emp-gender"
            className={styles.select}
            value={data.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Row 3: 3 fields (4 fields when Married is selected) */}
      <div className={data.maritalStatus === 'Married' ? styles.fourColumnGrid : styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-dob" className={styles.label}>DOB</label>
          <input
            id="emp-dob"
            type="date"
            className={styles.input}
            value={data.dob || ''}
            onChange={(e) => handleChange('dob', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-blood" className={styles.label}>Blood Group</label>
          <select
            id="emp-blood"
            className={styles.select}
            value={data.bloodGroup || ''}
            onChange={(e) => handleChange('bloodGroup', e.target.value)}
          >
            <option value="">Select</option>
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

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-marital" className={styles.label}>Marital Status</label>
          <select
            id="emp-marital"
            className={styles.select}
            value={data.maritalStatus || ''}
            onChange={(e) => handleChange('maritalStatus', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Divorced">Divorced</option>
          </select>
        </div>

        {data.maritalStatus === 'Married' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="emp-spouse" className={styles.label}>Spouse Name</label>
            <input
              id="emp-spouse"
              type="text"
              className={styles.input}
              placeholder="Enter spouse name"
              value={data.spouseName || ''}
              onChange={(e) => handleChange('spouseName', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Row 4: Aadhaar No., PAN No., Religion, Nationality */}
      <div className={styles.fourColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-aadhaar" className={styles.label}>Aadhaar No.</label>
          <input
            id="emp-aadhaar"
            type="text"
            className={styles.input}
            placeholder="12-digit Aadhaar No."
            value={data.aadhaar || ''}
            onChange={(e) => handleChange('aadhaar', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-pan" className={styles.label}>PAN No.</label>
          <input
            id="emp-pan"
            type="text"
            className={styles.input}
            placeholder="10-digit PAN No."
            value={data.pan || ''}
            onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-religion" className={styles.label}>Religion</label>
          <select
            id="emp-religion"
            className={styles.select}
            value={data.religion || ''}
            onChange={(e) => handleChange('religion', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Sikh">Sikh</option>
            <option value="Christian">Christian</option>
            <option value="Buddhist">Buddhist</option>
            <option value="Jain">Jain</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-nationality" className={styles.label}>Nationality</label>
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

      {/* Row 5: Mobile, Emergency Mobile No., Email, Employee Photo */}
      <div className={styles.fourColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-mobile" className={styles.label}>Mobile</label>
          <input
            id="emp-mobile"
            type="tel"
            className={styles.input}
            placeholder="+91 98765 43210"
            value={data.mobile || ''}
            onChange={(e) => handleChange('mobile', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-alt-mobile" className={styles.label}>Emergency Mobile No.</label>
          <input
            id="emp-alt-mobile"
            type="tel"
            className={styles.input}
            placeholder="+91 98765 43210"
            value={data.emergencyMobile || data.alternateMobile || ''}
            onChange={(e) => {
              handleChange('emergencyMobile', e.target.value);
              handleChange('alternateMobile', e.target.value);
            }}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-email" className={styles.label}>Email</label>
          <input
            id="emp-email"
            type="email"
            className={styles.input}
            placeholder="example@email.com"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="emp-photo" className={styles.label}>Employee Photo</label>
          <div className={styles.fileUploadWrapper}>
            <div className={styles.fileUploadBox}>
              <span className={styles.fileUploadText}>{data.employeePhoto || 'Choose File'}</span>
            </div>
            <label className={styles.fileUploadButton} htmlFor="emp-photo">
              Choose File
            </label>
            <input
              id="emp-photo"
              type="file"
              className={styles.fileInputHidden}
              onChange={(e) => handleChange('employeePhoto', e.target.files?.[0]?.name || '')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoStep;
