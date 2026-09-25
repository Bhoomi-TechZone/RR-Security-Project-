import React, { useMemo } from 'react';
import styles from './EmployeeFormSteps.module.css';

const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

function SalaryStructureStep({ data, onChange }) {
  const calculateGross = (updated) => {
    return (
      (Number(updated.basic) || 0) +
      (Number(updated.hra) || 0) +
      (Number(updated.conveyance) || 0) +
      (Number(updated.otherAllowance) || 0) +
      (Number(updated.specialAllowance) || 0) +
      (Number(updated.vda) || 0)
    );
  };

  const handleChange = (field, value) => {
    const isStringField = [
      'salaryType',
      'salaryStructureType',
      'minimumWageCategory',
      'salaryEffectiveFrom',
      'pfApplicable',
      'esiApplicable',
      'tdsApplicable',
      'lwfApplicable',
      'lwf',
      'lwfNo',
      'uan',
      'pfNo',
      'esicNo',
      'dispensaryNo',
      'pan'
    ].includes(field);
    const formattedValue = isStringField ? value : parseFloat(value) || 0;
    
    const updatedData = { ...data, [field]: formattedValue };

    // Auto-calculate gross salary when any earning component changes
    if (['basic', 'hra', 'conveyance', 'otherAllowance', 'specialAllowance', 'vda'].includes(field)) {
      updatedData.grossSalary = calculateGross(updatedData);
    }

    onChange(updatedData);
  };

  const totalEarnings = useMemo(() => {
    return (Number(data.basic) || 0) + (Number(data.hra) || 0) + (Number(data.conveyance) || 0) + (Number(data.otherAllowance) || 0) + (Number(data.specialAllowance) || 0) + (Number(data.vda) || 0);
  }, [data.basic, data.hra, data.conveyance, data.otherAllowance, data.specialAllowance, data.vda]);

  const totalDeductions = 0;
  const estimatedNet = totalEarnings - totalDeductions;

  const displayGross = data.grossSalary !== undefined && data.grossSalary !== '' && data.grossSalary !== 0
    ? data.grossSalary
    : (totalEarnings || '');

  return (
    <div className={styles.stepContainer}>
      {/* Row 1: 3 fields */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="salary-type" className={styles.label}>Salary Type</label>
          <select
            id="salary-type"
            className={styles.select}
            value={data.salaryType || ''}
            onChange={(e) => handleChange('salaryType', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Monthly">Monthly</option>
            <option value="Daily">Daily</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-structure" className={styles.label}>Salary Structure</label>
          <select
            id="salary-structure"
            className={styles.select}
            value={data.salaryStructureType || ''}
            onChange={(e) => handleChange('salaryStructureType', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Regular">Regular</option>
            <option value="Contract">Contract</option>
            <option value="Shift Based">Shift Based</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-basic" className={styles.label}>Basic</label>
          <input
            id="salary-basic"
            type="number"
            min="0"
            className={styles.input}
            placeholder="0"
            value={data.basic || ''}
            onChange={(e) => handleChange('basic', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>
      </div>

      {/* Row 2: 4 Allowance fields in the same row */}
      <div className={styles.fourColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="salary-hra" className={styles.label}>HRA</label>
          <input
            id="salary-hra"
            type="number"
            min="0"
            className={styles.input}
            placeholder="0"
            value={data.hra || ''}
            onChange={(e) => handleChange('hra', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-conveyance" className={styles.label}>Conveyance</label>
          <input
            id="salary-conveyance"
            type="number"
            min="0"
            className={styles.input}
            placeholder="0"
            value={data.conveyance || ''}
            onChange={(e) => handleChange('conveyance', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-other" className={styles.label}>Other Allowance</label>
          <input
            id="salary-other"
            type="number"
            min="0"
            className={styles.input}
            placeholder="0"
            value={data.otherAllowance || ''}
            onChange={(e) => handleChange('otherAllowance', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-special" className={styles.label}>Special Allowance</label>
          <input
            id="salary-special"
            type="number"
            min="0"
            className={styles.input}
            placeholder="0"
            value={data.specialAllowance || ''}
            onChange={(e) => handleChange('specialAllowance', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>
      </div>

      {/* Row 3: 3 fields */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label htmlFor="salary-gross" className={styles.label} style={{ margin: 0 }}>Gross Salary</label>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Auto-calculated</span>
          </div>
          <input
            id="salary-gross"
            type="number"
            min="0"
            className={styles.input}
            placeholder="0"
            value={displayGross}
            onChange={(e) => handleChange('grossSalary', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-min-wage" className={styles.label}>Minimum Wage Category</label>
          <input
            id="salary-min-wage"
            type="text"
            className={styles.input}
            placeholder="e.g. Semi-Skilled, Skilled"
            value={data.minimumWageCategory || ''}
            onChange={(e) => handleChange('minimumWageCategory', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="salary-effective" className={styles.label}>Salary Effective From</label>
          <input
            id="salary-effective"
            type="date"
            className={styles.input}
            value={data.salaryEffectiveFrom || ''}
            onChange={(e) => handleChange('salaryEffectiveFrom', e.target.value)}
          />
        </div>
      </div>

      {/* Statutory Section: Separate rows for PF, ESI, TDS, LWF with subfields inline */}
      
      {/* 1. PF Row */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-pf" className={styles.label}>PF Applicable</label>
          <select
            id="emp-pf"
            className={styles.select}
            value={data.pfApplicable === true || data.pfApplicable === 'Yes' ? 'Yes' : data.pfApplicable === false || data.pfApplicable === 'No' ? 'No' : ''}
            onChange={(e) => handleChange('pfApplicable', e.target.value === 'Yes' ? true : e.target.value === 'No' ? false : '')}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {(data.pfApplicable === true || data.pfApplicable === 'Yes') && (
          <>
            <div className={styles.fieldGroup}>
              <label htmlFor="emp-uan" className={styles.label}>UAN</label>
              <input
                id="emp-uan"
                type="text"
                className={styles.input}
                placeholder="12-digit UAN"
                value={data.uan || ''}
                onChange={(e) => handleChange('uan', e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="emp-pf-no" className={styles.label}>PF Number</label>
              <input
                id="emp-pf-no"
                type="text"
                className={styles.input}
                placeholder="PF Account Number"
                value={data.pfNo || ''}
                onChange={(e) => handleChange('pfNo', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* 2. ESI Row */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-esi" className={styles.label}>ESI Applicable</label>
          <select
            id="emp-esi"
            className={styles.select}
            value={data.esiApplicable === true || data.esiApplicable === 'Yes' ? 'Yes' : data.esiApplicable === false || data.esiApplicable === 'No' ? 'No' : ''}
            onChange={(e) => handleChange('esiApplicable', e.target.value === 'Yes' ? true : e.target.value === 'No' ? false : '')}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {(data.esiApplicable === true || data.esiApplicable === 'Yes') && (
          <>
            <div className={styles.fieldGroup}>
              <label htmlFor="emp-esic" className={styles.label}>ESI Number</label>
              <input
                id="emp-esic"
                type="text"
                className={styles.input}
                placeholder="17-digit ESIC Number"
                value={data.esicNo || ''}
                onChange={(e) => handleChange('esicNo', e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="emp-dispensary-no" className={styles.label}>Dispensary Name</label>
              <input
                id="emp-dispensary-no"
                type="text"
                className={styles.input}
                placeholder="Enter Dispensary Name"
                value={data.dispensaryNo || ''}
                onChange={(e) => handleChange('dispensaryNo', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* 3. TDS Row */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-tds" className={styles.label}>TDS Applicable</label>
          <select
            id="emp-tds"
            className={styles.select}
            value={data.tdsApplicable === true || data.tdsApplicable === 'Yes' ? 'Yes' : data.tdsApplicable === false || data.tdsApplicable === 'No' ? 'No' : ''}
            onChange={(e) => handleChange('tdsApplicable', e.target.value === 'Yes' ? true : e.target.value === 'No' ? false : '')}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {(data.tdsApplicable === true || data.tdsApplicable === 'Yes') && (
          <div className={styles.fieldGroup}>
            <label htmlFor="emp-tds-pan" className={styles.label}>PAN (for TDS)</label>
            <input
              id="emp-tds-pan"
              type="text"
              className={styles.input}
              placeholder="10-digit PAN (e.g. ABCDE1234F)"
              value={data.pan || ''}
              onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
            />
          </div>
        )}
      </div>

      {/* 4. LWF Row */}
      <div className={styles.threeColumnGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="emp-lwf" className={styles.label}>LWF Applicable</label>
          <select
            id="emp-lwf"
            className={styles.select}
            value={data.lwfApplicable === true || data.lwfApplicable === 'Yes' || data.lwf === true || data.lwf === 'Yes' ? 'Yes' : data.lwfApplicable === false || data.lwfApplicable === 'No' || data.lwf === 'No' ? 'No' : ''}
            onChange={(e) => {
              const isYes = e.target.value === 'Yes';
              const isNo = e.target.value === 'No';
              handleChange('lwfApplicable', isYes ? true : isNo ? false : '');
            }}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {(data.lwfApplicable === true || data.lwfApplicable === 'Yes' || data.lwf === true || data.lwf === 'Yes') && (
          <div className={styles.fieldGroup}>
            <label htmlFor="emp-lwf-no" className={styles.label}>LWF Number</label>
            <input
              id="emp-lwf-no"
              type="text"
              className={styles.input}
              placeholder="Enter LWF Number"
              value={data.lwfNo || (typeof data.lwf === 'string' && data.lwf !== 'Yes' && data.lwf !== 'No' ? data.lwf : '')}
              onChange={(e) => {
                handleChange('lwfNo', e.target.value);
                handleChange('lwf', e.target.value);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SalaryStructureStep;
