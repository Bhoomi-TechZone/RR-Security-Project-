import React, { useMemo, useState, useEffect } from 'react';
import { Download, HelpCircle } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import styles from './SalaryStructureStep.module.css';

const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const DEFAULT_FALLBACK_EARNINGS = [
  { name: 'Basic Salary', code: 'Basic', type: 'earning', status: 'active' },
  { name: 'Dearness Allowance', code: 'DA', type: 'earning', status: 'active' },
  { name: 'House Rent Allowance', code: 'HRA', type: 'earning', status: 'active' },
  { name: 'Conveyance Allowance', code: 'Conv', type: 'earning', status: 'active' },
  { name: 'Special Allowance', code: 'Spl Allo', type: 'earning', status: 'active' },
  { name: 'Other Allowance', code: 'Other Allo', type: 'earning', status: 'active' }
];

const DEFAULT_FALLBACK_DEDUCTIONS = [
  { name: 'Uniform', code: 'UF', type: 'deduction', status: 'active' },
  { name: 'Advance', code: 'Adv', type: 'deduction', status: 'active' },
  { name: 'Loan', code: 'Loan', type: 'deduction', status: 'active' }
];

function getComponentFieldKey(comp) {
  const name = (comp.name || '').toLowerCase().trim();
  const code = (comp.code || comp.shortName || '').toLowerCase().trim();

  if (name.includes('basic') || code === 'basic') return 'basic';
  if (name.includes('dearness') || name.includes('vda') || code === 'da' || code === 'vda') return 'vda';
  if (name.includes('house rent') || code === 'hra') return 'hra';
  if (name.includes('conveyance') || code === 'conv') return 'conveyance';
  if (name.includes('special') || code.includes('spl')) return 'specialAllowance';
  if (name.includes('other') || code.includes('other')) return 'otherAllowance';

  const cleanName = (comp.name || comp.code || 'allowance')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w, idx) => (idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');

  return cleanName || `earning_${comp.id || comp._id}`;
}

function getDeductionFieldKey(comp) {
  const name = (comp.name || '').toLowerCase().trim();
  const code = (comp.code || comp.shortName || '').toLowerCase().trim();

  if (name.includes('uniform') || code === 'uf') return 'uniformDeduction';
  if (name.includes('advance') || code === 'adv') return 'advanceDeduction';
  if (name.includes('loan')) return 'loanDeduction';

  const cleanName = (comp.name || comp.code || 'deduction')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w, idx) => (idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');

  return cleanName.endsWith('Deduction') ? cleanName : `${cleanName}Deduction`;
}

const INDIAN_STATES = [
  'Delhi',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

function SalaryStructureStep({ data, onChange }) {
  const { activeCompany, activeCompanyId } = useCompany();
  const companyId = data.companyId || activeCompanyId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [earningComponents, setEarningComponents] = useState([]);
  const [deductionComponents, setDeductionComponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [hasConfiguredMasters, setHasConfiguredMasters] = useState(false);

  // Dynamically load company-isolated active earning & deduction components from Masters API
  useEffect(() => {
    let isMounted = true;
    async function loadSalaryComponents() {
      try {
        setLoadingComponents(true);
        const allComponents = await masterService.getMasters('salary-components', companyId, true);
        if (isMounted) {
          const compsList = Array.isArray(allComponents) ? allComponents : [];

          // Only show active components
          const activeOnly = compsList.filter((c) => {
            const status = (c.status || 'active').toLowerCase().trim();
            return status === 'active';
          });

          const earningsOnly = activeOnly.filter((c) => {
            const kind = (c.type || c.type_kind || 'earning').toLowerCase().trim();
            return kind === 'earning';
          });

          const deductionsOnly = activeOnly.filter((c) => {
            const kind = (c.type || c.type_kind || '').toLowerCase().trim();
            return kind === 'deduction';
          });

          if (compsList.length > 0) {
            setHasConfiguredMasters(true);
            setEarningComponents(earningsOnly);
            setDeductionComponents(deductionsOnly);
          } else {
            setHasConfiguredMasters(false);
            setEarningComponents(DEFAULT_FALLBACK_EARNINGS);
            setDeductionComponents(DEFAULT_FALLBACK_DEDUCTIONS);
          }
        }
      } catch (err) {
        console.error('Failed to load company salary components:', err);
      } finally {
        if (isMounted) setLoadingComponents(false);
      }
    }

    if (companyId) {
      loadSalaryComponents();
    }

    // Live update when salary components are added/edited in Masters
    const handleSync = () => loadSalaryComponents();
    window.addEventListener('salary-components-updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('salary-components-updated', handleSync);
    };
  }, [companyId]);

  const dynamicComponentsList = hasConfiguredMasters
    ? earningComponents
    : (earningComponents.length > 0 ? earningComponents : DEFAULT_FALLBACK_EARNINGS);

  const dynamicDeductionsList = hasConfiguredMasters
    ? deductionComponents
    : (deductionComponents.length > 0 ? deductionComponents : DEFAULT_FALLBACK_DEDUCTIONS);

  const calculateDynamicGross = (currentData, components) => {
    const comps = components && components.length > 0 ? components : dynamicComponentsList;
    let total = 0;
    comps.forEach((comp) => {
      const key = getComponentFieldKey(comp);
      const val = currentData[key] ?? currentData.customEarnings?.[key] ?? currentData.customEarnings?.[comp.name] ?? 0;
      total += Number(val) || 0;
    });
    return total;
  };

  const calculateDynamicTotalDeductions = (currentData, deductions) => {
    const comps = deductions && deductions.length > 0 ? deductions : dynamicDeductionsList;
    let total = 0;
    comps.forEach((comp) => {
      const key = getDeductionFieldKey(comp);
      const val = currentData[key] ?? currentData.deductions?.[key] ?? currentData.deductions?.[comp.name] ?? 0;
      total += Number(val) || 0;
    });
    return total;
  };

  const handleComponentChange = (comp, value) => {
    const key = getComponentFieldKey(comp);
    const numVal = value === '' ? '' : parseFloat(value) || 0;

    const updatedData = {
      ...data,
      [key]: numVal,
      customEarnings: {
        ...(data.customEarnings || {}),
        [key]: numVal,
        [comp.name]: numVal
      }
    };

    const newGross = calculateDynamicGross(updatedData, dynamicComponentsList);
    const currentDeductions = calculateDynamicTotalDeductions(updatedData, dynamicDeductionsList);
    updatedData.grossSalary = newGross;
    updatedData.totalSalary = newGross;
    updatedData.netSalary = Math.max(0, newGross - currentDeductions);
    onChange(updatedData);
  };

  const handleDeductionChange = (comp, value) => {
    const key = getDeductionFieldKey(comp);
    const numVal = value === '' ? '' : parseFloat(value) || 0;

    const updatedData = {
      ...data,
      [key]: numVal,
      deductions: {
        ...(data.deductions || {}),
        [key]: numVal,
        [comp.name]: numVal
      }
    };

    const currentGross = updatedData.grossSalary !== undefined && updatedData.grossSalary !== ''
      ? Number(updatedData.grossSalary) || 0
      : calculateDynamicGross(updatedData, dynamicComponentsList);
    const currentDeductions = calculateDynamicTotalDeductions(updatedData, dynamicDeductionsList);
    updatedData.netSalary = Math.max(0, currentGross - currentDeductions);
    onChange(updatedData);
  };

  const handleChange = (field, value) => {
    const isStringField = [
      'salaryType',
      'salaryStructureType',
      'minimumWageCategory',
      'salaryEffectiveFrom',
      'pfApplicable',
      'esiApplicable',
      'ptApplicable',
      'tdsApplicable',
      'lwfApplicable',
      'lwf',
      'lwfNo',
      'uan',
      'pfNo',
      'esicNo',
      'dispensaryNo',
      'pan',
      'ptTaxState',
      'lwfTaxState'
    ].includes(field);

    const isBooleanField = [
      'isIncrement',
      'doNotDeductEsi',
      'deductEsiAboveCeiling',
      'doNotDeductPf',
      'doNotDeductPension',
      'deductPfAboveCeilingEmployee',
      'deductPfAboveCeilingEmployer',
      'deductPfOnGrossSalary',
      'deductPfExtraContribution',
      'doNotDeductPt',
      'doNotDeductTds',
      'metroCityResident',
      'doNotDeductLwf'
    ].includes(field);

    const formattedValue = isBooleanField
      ? Boolean(value)
      : isStringField
      ? value
      : (value === '' ? '' : parseFloat(value) || 0);

    const updatedData = { ...data, [field]: formattedValue };

    // Auto-calculate gross salary when gross salary is not explicitly overridden
    if (field === 'grossSalary') {
      updatedData.grossSalary = formattedValue;
    }

    onChange(updatedData);
  };

  const displayGross =
    data.grossSalary !== undefined && data.grossSalary !== '' && data.grossSalary !== 0
      ? data.grossSalary
      : (calculateDynamicGross(data, dynamicComponentsList) || '');

  const totalDeductions = calculateDynamicTotalDeductions(data, dynamicDeductionsList);
  const displayNet = Math.max(0, (Number(displayGross) || 0) - totalDeductions);

  const isPfActive = Boolean(data.pfApplicable === true || data.pfApplicable === 'Yes');
  const isEsiActive = Boolean(data.esiApplicable === true || data.esiApplicable === 'Yes');
  const isTdsActive = Boolean(data.tdsApplicable === true || data.tdsApplicable === 'Yes');
  const isLwfActive = Boolean(data.lwfApplicable === true || data.lwfApplicable === 'Yes' || data.lwf === true || data.lwf === 'Yes');
  const isPtActive = Boolean(data.ptApplicable === true || data.ptApplicable === 'Yes');

  const handleDownloadStatement = () => {
    downloadEmployeeProfile(data, activeCompany);
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Salary & Statutory</h3>
          <p className={styles.headerSubtitle}>Manage wage structure, basic salary, allowances, PF, ESI, TDS, LWF and compliance.</p>
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
            title="View salary & statutory help documentation"
          >
            <HelpCircle size={13} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TWO-COLUMN LAYOUT (FORM ON LEFT, SIDEBAR CARDS ON RIGHT)
         ======================================================== */}
      <div className={styles.mainLayout}>
        {/* Left Form Column */}
        <div className={styles.mainForm}>
          {/* Section 1: Wage & Salary Structure */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Wage & Salary Structure</h4>

            {/* Salary Type */}
            <div className={styles.formRow}>
              <label htmlFor="salary-type" className={styles.rowLabel}>
                <span>Salary Type</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="salary-type"
                  className={styles.select}
                  value={data.salaryType || ''}
                  onChange={(e) => handleChange('salaryType', e.target.value)}
                >
                  <option value="">Select Salary Type</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Daily">Daily</option>
                  <option value="Hourly">Hourly</option>
                </select>
              </div>
            </div>

            {/* Salary Structure */}
            <div className={styles.formRow}>
              <label htmlFor="salary-structure" className={styles.rowLabel}>
                <span>Salary Structure</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="salary-structure"
                  className={styles.select}
                  value={data.salaryStructureType || ''}
                  onChange={(e) => handleChange('salaryStructureType', e.target.value)}
                >
                  <option value="">Select Structure</option>
                  <option value="Regular">Regular</option>
                  <option value="Contract">Contract</option>
                  <option value="Shift Based">Shift Based</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>

            {/* Salary Effective From */}
            <div className={styles.formRow}>
              <label htmlFor="salary-effective" className={styles.rowLabel}>
                <span>Salary Effective From</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="salary-effective"
                  type="date"
                  className={styles.input}
                  value={data.salaryEffectiveFrom || ''}
                  onChange={(e) => handleChange('salaryEffectiveFrom', e.target.value)}
                />
              </div>
            </div>

            {/* Minimum Wage Category */}
            <div className={styles.formRow}>
              <label htmlFor="salary-min-wage" className={styles.rowLabel}>
                <span>Minimum Wage Category</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="salary-min-wage"
                  type="text"
                  className={styles.input}
                  placeholder="Enter Minimum Wage Category"
                  value={data.minimumWageCategory || ''}
                  onChange={(e) => handleChange('minimumWageCategory', e.target.value)}
                />
              </div>
            </div>

            {/* Dynamic Earning Components Loaded from Masters for Current Company */}
            {loadingComponents && dynamicComponentsList.length === 0 ? (
              <div className={styles.loadingRow}>
                <span className={styles.loadingText}>Loading earning components...</span>
              </div>
            ) : (
              dynamicComponentsList.map((comp) => {
                const key = getComponentFieldKey(comp);
                const isRequired = key === 'basic' || (comp.name || '').toLowerCase().includes('basic');
                const rawVal = data[key] ?? data.customEarnings?.[key] ?? data.customEarnings?.[comp.name];
                const displayVal = rawVal === 0 ? '0' : (rawVal || '');

                return (
                  <div key={comp.id || comp._id || comp.code || comp.name} className={styles.formRow}>
                    <label htmlFor={`salary-${key}`} className={styles.rowLabel}>
                      <span>{comp.name}</span>
                      {isRequired && <span className={styles.requiredStar}>*</span>}
                    </label>
                    <div className={styles.rowControl}>
                      <div className={styles.currencyWrapper}>
                        <span className={styles.currencySymbol}>₹</span>
                        <input
                          id={`salary-${key}`}
                          type="number"
                          min="0"
                          className={styles.currencyInput}
                          placeholder="0"
                          value={displayVal}
                          onChange={(e) => handleComponentChange(comp, e.target.value)}
                          onWheel={(e) => e.target.blur()}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Gross Salary (Non-clickable) */}
            <div className={styles.formRow}>
              <label htmlFor="salary-gross" className={styles.boldRowLabel}>
                <span>Gross Salary</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-gross"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={displayGross === 0 ? '0' : (displayGross || '')}
                  />
                </div>
              </div>
            </div>

            {/* Total Salary (Non-clickable) */}
            <div className={styles.formRow}>
              <label htmlFor="salary-total" className={styles.boldRowLabel}>
                <span>Total Salary</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-total"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={displayGross === 0 ? '0' : (displayGross || '')}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Active Deductions (Rendered after Total Salary - Non-editable) */}
            {dynamicDeductionsList.map((comp) => {
              const key = getDeductionFieldKey(comp);
              const rawVal = data[key] ?? data.deductions?.[key] ?? data.deductions?.[comp.name];
              const displayVal = rawVal === 0 ? '0' : (rawVal || '');

              return (
                <div key={comp.id || comp._id || comp.code || comp.name} className={styles.formRow}>
                  <label htmlFor={`deduction-${key}`} className={styles.rowLabel}>
                    <span>{comp.name}</span>
                  </label>
                  <div className={styles.rowControl}>
                    <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                      <span className={styles.currencySymbol}>₹</span>
                      <input
                        id={`deduction-${key}`}
                        type="number"
                        readOnly
                        tabIndex={-1}
                        className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                        placeholder="0"
                        value={displayVal}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Net Salary (Non-clickable, Auto-calculated, Bolder label) */}
            <div className={styles.formRow}>
              <label htmlFor="salary-net" className={styles.boldRowLabel}>
                <span>Net Salary</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-net"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={displayNet === 0 ? '0' : (displayNet || '')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory & Compliance */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Statutory & Compliance</h4>

            {/* PF Applicable */}
            <div className={styles.formRow}>
              <label htmlFor="emp-pf" className={styles.rowLabel}>
                <span>PF Applicable</span>
              </label>
              <div className={styles.rowControl}>
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
            </div>

            {/* PF Subfields if Yes */}
            {isPfActive && (
              <>
                <div className={styles.formRow}>
                  <label htmlFor="emp-uan" className={styles.rowLabel}>
                    <span>UAN</span>
                  </label>
                  <div className={styles.rowControl}>
                    <input
                      id="emp-uan"
                      type="text"
                      className={styles.input}
                      placeholder="Enter UAN Number"
                      value={data.uan || ''}
                      onChange={(e) => handleChange('uan', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="emp-pf-no" className={styles.rowLabel}>
                    <span>PF Number</span>
                  </label>
                  <div className={styles.rowControl}>
                    <input
                      id="emp-pf-no"
                      type="text"
                      className={styles.input}
                      placeholder="Enter PF Account Number"
                      value={data.pfNo || ''}
                      onChange={(e) => handleChange('pfNo', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ESI Applicable */}
            <div className={styles.formRow}>
              <label htmlFor="emp-esi" className={styles.rowLabel}>
                <span>ESI Applicable</span>
              </label>
              <div className={styles.rowControl}>
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
            </div>

            {/* ESI Subfields if Yes */}
            {isEsiActive && (
              <>
                <div className={styles.formRow}>
                  <label htmlFor="emp-esic" className={styles.rowLabel}>
                    <span>ESI Number</span>
                  </label>
                  <div className={styles.rowControl}>
                    <input
                      id="emp-esic"
                      type="text"
                      className={styles.input}
                      placeholder="Enter ESI Number"
                      value={data.esicNo || ''}
                      onChange={(e) => handleChange('esicNo', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="emp-dispensary-no" className={styles.rowLabel}>
                    <span>Dispensary Name</span>
                  </label>
                  <div className={styles.rowControl}>
                    <input
                      id="emp-dispensary-no"
                      type="text"
                      className={styles.input}
                      placeholder="Enter Dispensary Name"
                      value={data.dispensaryNo || ''}
                      onChange={(e) => handleChange('dispensaryNo', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* TDS Applicable */}
            <div className={styles.formRow}>
              <label htmlFor="emp-tds" className={styles.rowLabel}>
                <span>TDS Applicable</span>
              </label>
              <div className={styles.rowControl}>
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
            </div>

            {/* TDS Subfields if Yes */}
            {isTdsActive && (
              <div className={styles.formRow}>
                <label htmlFor="emp-tds-pan" className={styles.rowLabel}>
                  <span>PAN (for TDS)</span>
                </label>
                <div className={styles.rowControl}>
                  <input
                    id="emp-tds-pan"
                    type="text"
                    className={styles.input}
                    placeholder="Enter PAN Number"
                    value={data.pan || ''}
                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            )}

            {/* LWF Applicable */}
            <div className={styles.formRow}>
              <label htmlFor="emp-lwf" className={styles.rowLabel}>
                <span>LWF Applicable</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-lwf"
                  className={styles.select}
                  value={isLwfActive ? 'Yes' : (data.lwfApplicable === false || data.lwfApplicable === 'No' || data.lwf === 'No' ? 'No' : '')}
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
            </div>

            {/* LWF Subfields if Yes */}
            {isLwfActive && (
              <div className={styles.formRow}>
                <label htmlFor="emp-lwf-no" className={styles.rowLabel}>
                  <span>LWF Number</span>
                </label>
                <div className={styles.rowControl}>
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
              </div>
            )}

            {/* PT Applicable */}
            <div className={styles.formRow}>
              <label htmlFor="emp-pt" className={styles.rowLabel}>
                <span>PT Applicable</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="emp-pt"
                  className={styles.select}
                  value={data.ptApplicable === true || data.ptApplicable === 'Yes' ? 'Yes' : data.ptApplicable === false || data.ptApplicable === 'No' ? 'No' : ''}
                  onChange={(e) => handleChange('ptApplicable', e.target.value === 'Yes' ? true : e.target.value === 'No' ? false : '')}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Salary & Statutory Options Panel (Matching Screenshot Exactly) */}
        <aside className={styles.rightSidebar}>
          {/* Top Header: Salary Options */}
          <div className={styles.optionsHeader}>
            <h4 className={styles.optionsTitle}>Salary Options</h4>
            <p className={styles.optionsSubtitle}>Select options for the selected salary revision.</p>
          </div>

          {/* Increment Toggle */}
          <div className={styles.toggleRow} onClick={() => handleChange('isIncrement', !data.isIncrement)}>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data.isIncrement)}
              className={`${styles.toggleSwitch} ${data.isIncrement ? styles.toggleSwitchBlue : ''}`}
            >
              <span className={`${styles.toggleKnob} ${data.isIncrement ? styles.toggleKnobActive : ''}`} />
            </button>
            <span className={styles.toggleLabel}>This is an Increment</span>
          </div>

          {/* Card 1: Employee's State Insurance (ESI) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Employee's State Insurance (ESI)</h5>
            <div className={styles.toggleRow} onClick={() => handleChange('doNotDeductEsi', !data.doNotDeductEsi)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.doNotDeductEsi)}
                className={`${styles.toggleSwitch} ${data.doNotDeductEsi ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.doNotDeductEsi ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct ESI</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('deductEsiAboveCeiling', data.deductEsiAboveCeiling !== false ? !data.deductEsiAboveCeiling : true)}>
              <button
                type="button"
                role="switch"
                aria-checked={data.deductEsiAboveCeiling !== false}
                className={`${styles.toggleSwitch} ${data.deductEsiAboveCeiling !== false ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.deductEsiAboveCeiling !== false ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>Deduct ESI Above Ceiling</span>
            </div>
          </div>

          {/* Card 2: Provident Fund (PF) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Provident Fund (PF)</h5>
            <div className={styles.toggleRow} onClick={() => handleChange('doNotDeductPf', !data.doNotDeductPf)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.doNotDeductPf)}
                className={`${styles.toggleSwitch} ${data.doNotDeductPf ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.doNotDeductPf ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct PF</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('doNotDeductPension', !data.doNotDeductPension)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.doNotDeductPension)}
                className={`${styles.toggleSwitch} ${data.doNotDeductPension ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.doNotDeductPension ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct Pension (PF)</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('deductPfAboveCeilingEmployee', !data.deductPfAboveCeilingEmployee)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.deductPfAboveCeilingEmployee)}
                className={`${styles.toggleSwitch} ${data.deductPfAboveCeilingEmployee ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.deductPfAboveCeilingEmployee ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>Deduct PF Above Ceiling (Employee)</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('deductPfAboveCeilingEmployer', !data.deductPfAboveCeilingEmployer)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.deductPfAboveCeilingEmployer)}
                className={`${styles.toggleSwitch} ${data.deductPfAboveCeilingEmployer ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.deductPfAboveCeilingEmployer ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>Deduct PF Above Ceiling (Employer)</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('deductPfOnGrossSalary', !data.deductPfOnGrossSalary)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.deductPfOnGrossSalary)}
                className={`${styles.toggleSwitch} ${data.deductPfOnGrossSalary ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.deductPfOnGrossSalary ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>Deduct PF on Gross Salary</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('deductPfExtraContribution', !data.deductPfExtraContribution)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.deductPfExtraContribution)}
                className={`${styles.toggleSwitch} ${data.deductPfExtraContribution ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.deductPfExtraContribution ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>Deduct PF Extra Contribution</span>
              <span className={styles.infoBadge} title="Extra PF contribution details">i</span>
            </div>
            <div className={styles.optionInlineRow}>
              <div className={styles.optionInlineLabel}>
                <span>Min. Deduction</span>
                <span className={styles.infoBadge} title="Minimum deduction amount">i</span>
              </div>
              <input
                type="number"
                min="0"
                className={styles.smallInput}
                value={data.minPfDeduction === 0 ? '0' : (data.minPfDeduction || '0')}
                onChange={(e) => handleChange('minPfDeduction', e.target.value)}
                onWheel={(e) => e.target.blur()}
              />
            </div>
          </div>

          {/* Card 3: Professional Tax */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Professional Tax</h5>
            <div className={styles.toggleRow} onClick={() => handleChange('doNotDeductPt', !data.doNotDeductPt)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.doNotDeductPt)}
                className={`${styles.toggleSwitch} ${data.doNotDeductPt ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.doNotDeductPt ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct</span>
              <span className={styles.infoBadge} title="Professional Tax exemption">i</span>
            </div>
            <div className={styles.optionInlineRow}>
              <span className={styles.optionInlineLabel}>Tax State</span>
              <select
                className={styles.smallSelect}
                value={data.ptTaxState || 'Delhi'}
                onChange={(e) => handleChange('ptTaxState', e.target.value)}
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 4: Income Tax (TDS) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Income Tax (TDS)</h5>
            <div className={styles.toggleRow} onClick={() => handleChange('doNotDeductTds', !data.doNotDeductTds)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.doNotDeductTds)}
                className={`${styles.toggleSwitch} ${data.doNotDeductTds ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.doNotDeductTds ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct</span>
              <span className={styles.infoBadge} title="TDS deduction exemption">i</span>
            </div>
            <div className={styles.toggleRow} onClick={() => handleChange('metroCityResident', !data.metroCityResident)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.metroCityResident)}
                className={`${styles.toggleSwitch} ${data.metroCityResident ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.metroCityResident ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>Metro City Resident (HRA Exemption)</span>
            </div>
          </div>

          {/* Card 5: Labour Welfare Fund (LWF) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Labour Welfare Fund (LWF)</h5>
            <div className={styles.toggleRow} onClick={() => handleChange('doNotDeductLwf', !data.doNotDeductLwf)}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(data.doNotDeductLwf)}
                className={`${styles.toggleSwitch} ${data.doNotDeductLwf ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${data.doNotDeductLwf ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct</span>
              <span className={styles.infoBadge} title="Labour Welfare Fund exemption">i</span>
            </div>
            <div className={styles.optionInlineRow}>
              <span className={styles.optionInlineLabel}>Tax State</span>
              <select
                className={styles.smallSelect}
                value={data.lwfTaxState || 'Delhi'}
                onChange={(e) => handleChange('lwfTaxState', e.target.value)}
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SalaryStructureStep;
