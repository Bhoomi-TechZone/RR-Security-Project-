import React, { useMemo } from 'react';
import { Download, HelpCircle, CheckCircle2, MinusCircle, ShieldCheck, Info } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import styles from './SalaryStructureStep.module.css';

const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

function SalaryStructureStep({ data, onChange }) {
  const { activeCompany } = useCompany();

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
      'ptApplicable',
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

    const formattedValue = isStringField ? value : (value === '' ? '' : parseFloat(value) || 0);
    const updatedData = { ...data, [field]: formattedValue };

    // Auto-calculate gross salary when any earning component changes
    if (['basic', 'hra', 'conveyance', 'otherAllowance', 'specialAllowance', 'vda'].includes(field)) {
      updatedData.grossSalary = calculateGross(updatedData);
    }

    onChange(updatedData);
  };

  const totalEarnings = useMemo(() => {
    return (
      (Number(data.basic) || 0) +
      (Number(data.hra) || 0) +
      (Number(data.conveyance) || 0) +
      (Number(data.otherAllowance) || 0) +
      (Number(data.specialAllowance) || 0) +
      (Number(data.vda) || 0)
    );
  }, [data.basic, data.hra, data.conveyance, data.otherAllowance, data.specialAllowance, data.vda]);

  const displayGross =
    data.grossSalary !== undefined && data.grossSalary !== '' && data.grossSalary !== 0
      ? data.grossSalary
      : (totalEarnings || '');

  const annualCtcEstimate = (Number(displayGross) || 0) * 12;

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
                  placeholder="e.g. Skilled, Semi-Skilled, Unskilled"
                  value={data.minimumWageCategory || ''}
                  onChange={(e) => handleChange('minimumWageCategory', e.target.value)}
                />
              </div>
            </div>

            {/* Basic Salary */}
            <div className={styles.formRow}>
              <label htmlFor="salary-basic" className={styles.rowLabel}>
                <span>Basic Salary</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-basic"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.basic === 0 ? '0' : (data.basic || '')}
                    onChange={(e) => handleChange('basic', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* VDA (Variable Dearness Allowance) */}
            <div className={styles.formRow}>
              <label htmlFor="salary-vda" className={styles.rowLabel}>
                <span>VDA</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-vda"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.vda === 0 ? '0' : (data.vda || '')}
                    onChange={(e) => handleChange('vda', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* HRA */}
            <div className={styles.formRow}>
              <label htmlFor="salary-hra" className={styles.rowLabel}>
                <span>HRA</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-hra"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.hra === 0 ? '0' : (data.hra || '')}
                    onChange={(e) => handleChange('hra', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Conveyance */}
            <div className={styles.formRow}>
              <label htmlFor="salary-conveyance" className={styles.rowLabel}>
                <span>Conveyance</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-conveyance"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.conveyance === 0 ? '0' : (data.conveyance || '')}
                    onChange={(e) => handleChange('conveyance', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Special Allowance */}
            <div className={styles.formRow}>
              <label htmlFor="salary-special" className={styles.rowLabel}>
                <span>Special Allowance</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-special"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.specialAllowance === 0 ? '0' : (data.specialAllowance || '')}
                    onChange={(e) => handleChange('specialAllowance', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Other Allowance */}
            <div className={styles.formRow}>
              <label htmlFor="salary-other" className={styles.rowLabel}>
                <span>Other Allowance</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-other"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.otherAllowance === 0 ? '0' : (data.otherAllowance || '')}
                    onChange={(e) => handleChange('otherAllowance', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Gross Salary */}
            <div className={styles.formRow}>
              <label htmlFor="salary-gross" className={styles.rowLabel}>
                <span>Gross Salary</span>
                <span className={styles.autoCalcBadge}>Auto</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-gross"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={displayGross === 0 ? '0' : (displayGross || '')}
                    onChange={(e) => handleChange('grossSalary', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Overtime Rate */}
            <div className={styles.formRow}>
              <label htmlFor="salary-ot" className={styles.rowLabel}>
                <span>Overtime Rate</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-ot"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="₹ / Hour"
                    value={data.overtimeRate === 0 ? '0' : (data.overtimeRate || '')}
                    onChange={(e) => handleChange('overtimeRate', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Bonus */}
            <div className={styles.formRow}>
              <label htmlFor="salary-bonus" className={styles.rowLabel}>
                <span>Annual / Periodic Bonus</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-bonus"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.bonus === 0 ? '0' : (data.bonus || '')}
                    onChange={(e) => handleChange('bonus', e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Gratuity */}
            <div className={styles.formRow}>
              <label htmlFor="salary-gratuity" className={styles.rowLabel}>
                <span>Gratuity</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.currencyWrapper}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="salary-gratuity"
                    type="number"
                    min="0"
                    className={styles.currencyInput}
                    placeholder="0"
                    value={data.gratuity === 0 ? '0' : (data.gratuity || '')}
                    onChange={(e) => handleChange('gratuity', e.target.value)}
                    onWheel={(e) => e.target.blur()}
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
                      placeholder="12-digit UAN"
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
                      placeholder="PF Account Number"
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
                      placeholder="17-digit ESIC Number"
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
                    placeholder="10-digit PAN (e.g. ABCDE1234F)"
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

        {/* Right Sidebar Cards */}
        <aside className={styles.rightSidebar}>
          {/* Card 1: Salary Overview Breakdown */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <div>
                <h4 className={styles.sideCardTitle}>Salary Overview</h4>
                <div className={styles.sideCardSubtitle}>Monthly pay structure breakdown</div>
              </div>
            </div>

            {/* Gross Pay Banner */}
            <div className={styles.grossBanner}>
              <div className={styles.grossBannerInfo}>
                <span className={styles.grossBannerLabel}>Gross Salary</span>
                <span className={styles.grossBannerAmount}>{INR(displayGross)}</span>
              </div>
              <span className={styles.grossBannerBadge}>{data.salaryType || 'Monthly'}</span>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Basic Pay</span>
                <span className={styles.summaryValue}>{INR(data.basic)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>HRA</span>
                <span className={styles.summaryValue}>{INR(data.hra)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Conveyance</span>
                <span className={styles.summaryValue}>{INR(data.conveyance)}</span>
              </div>
              {(Number(data.vda) > 0) && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>VDA</span>
                  <span className={styles.summaryValue}>{INR(data.vda)}</span>
                </div>
              )}
              {((Number(data.specialAllowance) > 0) || (Number(data.otherAllowance) > 0)) && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Other Allowances</span>
                  <span className={styles.summaryValue}>
                    {INR((Number(data.specialAllowance) || 0) + (Number(data.otherAllowance) || 0))}
                  </span>
                </div>
              )}
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Annual CTC (Est.)</span>
                <span className={styles.summaryValue}>{INR(annualCtcEstimate)}</span>
              </div>
              {data.salaryEffectiveFrom && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Effective Date</span>
                  <span className={styles.summaryValue}>{data.salaryEffectiveFrom}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Statutory Compliance Overview */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <div>
                <h4 className={styles.sideCardTitle}>Statutory Status</h4>
                <div className={styles.sideCardSubtitle}>Compliance registration overview</div>
              </div>
              <ShieldCheck size={18} color="#2563eb" />
            </div>

            <div className={styles.statutoryList}>
              {/* PF */}
              <div className={`${styles.statutoryItem} ${isPfActive ? styles.statutoryItemActive : ''}`}>
                <div className={styles.statutoryInfo}>
                  <span className={styles.statutoryName}>Provident Fund (PF)</span>
                  <span className={styles.statutoryDetail}>
                    {isPfActive ? (data.uan ? `UAN: ${data.uan}` : data.pfNo ? `PF: ${data.pfNo}` : 'Enrolled') : 'Not Applicable'}
                  </span>
                </div>
                {isPfActive ? (
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={11} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className={styles.badgeMuted}>No</span>
                )}
              </div>

              {/* ESI */}
              <div className={`${styles.statutoryItem} ${isEsiActive ? styles.statutoryItemActive : ''}`}>
                <div className={styles.statutoryInfo}>
                  <span className={styles.statutoryName}>ESIC</span>
                  <span className={styles.statutoryDetail}>
                    {isEsiActive ? (data.esicNo ? `No: ${data.esicNo}` : 'Covered') : 'Not Applicable'}
                  </span>
                </div>
                {isEsiActive ? (
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={11} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className={styles.badgeMuted}>No</span>
                )}
              </div>

              {/* TDS */}
              <div className={`${styles.statutoryItem} ${isTdsActive ? styles.statutoryItemActive : ''}`}>
                <div className={styles.statutoryInfo}>
                  <span className={styles.statutoryName}>TDS / Income Tax</span>
                  <span className={styles.statutoryDetail}>
                    {isTdsActive ? (data.pan ? `PAN: ${data.pan}` : 'Applicable') : 'Exempt'}
                  </span>
                </div>
                {isTdsActive ? (
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={11} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className={styles.badgeMuted}>Exempt</span>
                )}
              </div>

              {/* PT */}
              <div className={`${styles.statutoryItem} ${isPtActive ? styles.statutoryItemActive : ''}`}>
                <div className={styles.statutoryInfo}>
                  <span className={styles.statutoryName}>Professional Tax</span>
                  <span className={styles.statutoryDetail}>{isPtActive ? 'State Applicable' : 'Exempt'}</span>
                </div>
                {isPtActive ? (
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={11} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className={styles.badgeMuted}>No</span>
                )}
              </div>

              {/* LWF */}
              <div className={`${styles.statutoryItem} ${isLwfActive ? styles.statutoryItemActive : ''}`}>
                <div className={styles.statutoryInfo}>
                  <span className={styles.statutoryName}>Labour Welfare (LWF)</span>
                  <span className={styles.statutoryDetail}>
                    {isLwfActive ? (data.lwfNo ? `No: ${data.lwfNo}` : 'Applicable') : 'Exempt'}
                  </span>
                </div>
                {isLwfActive ? (
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={11} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className={styles.badgeMuted}>No</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Compliance Notice Card */}
          <div className={styles.noticeCard}>
            <Info size={16} className={styles.noticeIcon} />
            <span>
              Statutory deductions (PF 12%, ESI 0.75%, PT, LWF) are calculated dynamically during monthly payroll runs as per state regulations and compliance thresholds.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SalaryStructureStep;
