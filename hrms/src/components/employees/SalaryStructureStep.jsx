import React, { useMemo, useState, useEffect } from 'react';
import { Download, HelpCircle, Plus, Edit2, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import styles from './SalaryStructureStep.module.css';

const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const formatRevisionDate = (dateVal) => {
  if (!dateVal) return '01-NOV-2026';
  const str = String(dateVal).trim();
  if (/^\d{2}-[A-Z]{3}-\d{4}$/i.test(str)) {
    return str.toUpperCase();
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }
  } catch {}
  return str;
};

const formatHeaderMonthYear = (dateVal) => {
  if (!dateVal) return 'JAN-2026';
  const str = String(dateVal).trim();
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${months[d.getMonth()]}-${d.getFullYear()}`;
    }
  } catch {}
  return str;
};

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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
      'deductEsi',
      'doNotDeductEsi',
      'deductEsiAboveCeiling',
      'deductPf',
      'doNotDeductPf',
      'doNotDeductPension',
      'deductPfAboveCeilingEmployee',
      'deductPfAboveCeilingEmployer',
      'deductPfOnGrossSalary',
      'deductPfExtraContribution',
      'deductPt',
      'doNotDeductPt',
      'deductTds',
      'doNotDeductTds',
      'metroCityResident',
      'deductLwf',
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

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const displayGross =
    data.grossSalary !== undefined && data.grossSalary !== '' && data.grossSalary !== 0
      ? data.grossSalary
      : (calculateDynamicGross(data, dynamicComponentsList) || '');

  const totalDeductions = calculateDynamicTotalDeductions(data, dynamicDeductionsList);
  const displayNet = Math.max(0, (Number(displayGross) || 0) - totalDeductions);

  const isEsiDeduct = data.deductEsi !== undefined
    ? Boolean(data.deductEsi)
    : (data.doNotDeductEsi !== undefined ? !data.doNotDeductEsi : Boolean(data.esiApplicable === true || data.esiApplicable === 'Yes'));

  const isPfDeduct = data.deductPf !== undefined
    ? Boolean(data.deductPf)
    : (data.doNotDeductPf !== undefined ? !data.doNotDeductPf : Boolean(data.pfApplicable === true || data.pfApplicable === 'Yes'));

  const isTdsDeduct = data.deductTds !== undefined
    ? Boolean(data.deductTds)
    : (data.doNotDeductTds !== undefined ? !data.doNotDeductTds : Boolean(data.tdsApplicable === true || data.tdsApplicable === 'Yes'));

  const isLwfDeduct = data.deductLwf !== undefined
    ? Boolean(data.deductLwf)
    : (data.doNotDeductLwf !== undefined ? !data.doNotDeductLwf : Boolean(data.lwfApplicable === true || data.lwfApplicable === 'Yes' || (data.lwf && data.lwf !== 'No')));

  const isPtDeduct = data.deductPt !== undefined
    ? Boolean(data.deductPt)
    : (data.doNotDeductPt !== undefined ? !data.doNotDeductPt : Boolean(data.ptApplicable === true || data.ptApplicable === 'Yes'));

  const isPfActive = isPfDeduct;
  const isEsiActive = isEsiDeduct;
  const isTdsActive = isTdsDeduct;
  const isLwfActive = isLwfDeduct;
  const isPtActive = isPtDeduct;

  const handleToggleEsiDeduct = () => {
    const nextVal = !isEsiDeduct;
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      deductEsi: nextVal,
      doNotDeductEsi: !nextVal,
      esiApplicable: nextVal
    });
  };

  const handleTogglePfDeduct = () => {
    const nextVal = !isPfDeduct;
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      deductPf: nextVal,
      doNotDeductPf: !nextVal,
      pfApplicable: nextVal
    });
  };

  const handleToggleTdsDeduct = () => {
    const nextVal = !isTdsDeduct;
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      deductTds: nextVal,
      doNotDeductTds: !nextVal,
      tdsApplicable: nextVal
    });
  };

  const handleToggleLwfDeduct = () => {
    const nextVal = !isLwfDeduct;
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      deductLwf: nextVal,
      doNotDeductLwf: !nextVal,
      lwfApplicable: nextVal
    });
  };

  const handleTogglePtDeduct = () => {
    const nextVal = !isPtDeduct;
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      deductPt: nextVal,
      doNotDeductPt: !nextVal,
      ptApplicable: nextVal
    });
  };

  // Employer Contributions & CTC Calculations (All Non-Editable)
  const calculatedContributions = useMemo(() => {
    const gross = Number(displayGross) || 0;
    const basic = Number(data.basic) || 0;
    const vda = Number(data.vda) || 0;
    const pfWageBase = basic + vda > 0 ? (basic + vda) : (gross > 0 ? Math.min(gross, 15000) : 0);

    // ESI Contribution (Employer 3.25%)
    let esiContribution = 0;
    if (isEsiDeduct) {
      const allowAboveCeiling = data.deductEsiAboveCeiling !== false;
      if (gross <= 21000 || allowAboveCeiling) {
        esiContribution = Math.round(gross * 0.0325);
      }
    }

    // PF Contribution, Pension Contribution, EDLI & Admin Charges
    let pfContribution = 0;
    let pensionContribution = 0;
    let edliAndAdmin = 0;

    if (isPfDeduct && pfWageBase > 0) {
      const isEmployerAboveCeiling = Boolean(data.deductPfAboveCeilingEmployer);
      const pfWage = isEmployerAboveCeiling ? pfWageBase : Math.min(pfWageBase, 15000);
      const epsWage = Math.min(pfWageBase, 15000);

      if (data.doNotDeductPension) {
        pensionContribution = 0;
        pfContribution = Math.round(pfWage * 0.12);
      } else {
        pensionContribution = Math.round(epsWage * 0.0833);
        pfContribution = Math.max(0, Math.round(pfWage * 0.12) - pensionContribution);
      }

      const edli = Math.round(epsWage * 0.005);
      const admin = Math.round(pfWage * 0.005);
      edliAndAdmin = edli + admin;
    }

    const totalCtc = Math.round(gross + esiContribution + pfContribution + pensionContribution + edliAndAdmin);

    return {
      esiContribution,
      pfContribution,
      pensionContribution,
      edliAndAdmin,
      totalCtc
    };
  }, [
    displayGross,
    data.basic,
    data.vda,
    isEsiDeduct,
    data.deductEsiAboveCeiling,
    isPfDeduct,
    data.deductPfAboveCeilingEmployer,
    data.doNotDeductPension
  ]);

  const handleDownloadStatement = () => {
    downloadEmployeeProfile(data, activeCompany);
  };

  // Revisions State & Handlers
  const defaultRevisions = useMemo(() => {
    if (Array.isArray(data.salaryRevisions) && data.salaryRevisions.length > 0) {
      return data.salaryRevisions;
    }
    const currentGross = Number(displayGross) || 22000;
    const currentNet = Number(displayNet) || 19592;
    const currentCtc = Number(calculatedContributions.totalCtc) || 24927;
    return [
      {
        id: 'rev-1',
        effectiveFrom: data.salaryEffectiveFrom || '2026-11-01',
        salaryType: data.salaryType || 'Monthly',
        salaryStructureType: data.salaryStructureType || 'Regular',
        minimumWageCategory: data.minimumWageCategory || '',
        basic: Number(data.basic) || 17000,
        vda: Number(data.vda) || 2000,
        hra: Number(data.hra) || 1500,
        conveyance: Number(data.conveyance) || 1000,
        specialAllowance: Number(data.specialAllowance) || 500,
        grossSalary: currentGross,
        totalSalary: currentGross,
        netSalary: currentNet,
        ctc: currentCtc,
        isIncrement: Boolean(data.isIncrement)
      },
      {
        id: 'rev-2',
        effectiveFrom: '2026-01-01',
        salaryType: 'Monthly',
        salaryStructureType: 'Regular',
        minimumWageCategory: '',
        basic: 15000,
        vda: 2000,
        hra: 1500,
        conveyance: 1000,
        specialAllowance: 500,
        grossSalary: 20000,
        totalSalary: 20000,
        netSalary: 22000,
        ctc: 22000,
        isIncrement: false
      }
    ];
  }, []);

  const [revisions, setRevisions] = useState(() => {
    if (Array.isArray(data.salaryRevisions) && data.salaryRevisions.length > 0) {
      return data.salaryRevisions;
    }
    return defaultRevisions;
  });

  const [activeRevisionId, setActiveRevisionId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleSaved = () => setHasUnsavedChanges(false);
    window.addEventListener('employee-saved', handleSaved);
    return () => window.removeEventListener('employee-saved', handleSaved);
  }, []);

  const activeRevision = useMemo(() => {
    return revisions.find((r) => r.id === activeRevisionId) || revisions[0] || null;
  }, [revisions, activeRevisionId]);

  // Keep active revision in sync with current form inputs
  useEffect(() => {
    if (!activeRevisionId) return;
    setRevisions((prevRevisions) => {
      let hasChange = false;
      const next = prevRevisions.map((r) => {
        if (r.id === activeRevisionId) {
          const newGross = Number(displayGross) || 0;
          const newNet = Number(displayNet) || 0;
          const newCtc = Number(calculatedContributions.totalCtc) || 0;
          const newEff = data.salaryEffectiveFrom || r.effectiveFrom;
          if (
            r.grossSalary !== newGross ||
            r.netSalary !== newNet ||
            r.ctc !== newCtc ||
            r.effectiveFrom !== newEff
          ) {
            hasChange = true;
            return {
              ...r,
              ...data,
              effectiveFrom: newEff,
              grossSalary: newGross,
              totalSalary: newGross,
              netSalary: newNet,
              ctc: newCtc
            };
          }
        }
        return r;
      });
      return hasChange ? next : prevRevisions;
    });
  }, [activeRevisionId, data, displayGross, displayNet, calculatedContributions.totalCtc]);

  const handleEditRevision = (rev) => {
    setActiveRevisionId(rev.id);
    setShowEditor(true);
    setHasUnsavedChanges(false);
    onChange({
      ...data,
      ...rev,
      salaryEffectiveFrom: rev.effectiveFrom || data.salaryEffectiveFrom,
      grossSalary: rev.grossSalary || data.grossSalary,
      totalSalary: rev.totalSalary || data.totalSalary,
      netSalary: rev.netSalary || data.netSalary,
      ctc: rev.ctc || data.ctc
    });
  };

  const handleAddRevision = () => {
    const newRevId = `rev-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newRev = {
      ...data,
      id: newRevId,
      effectiveFrom: today,
      isIncrement: true,
      grossSalary: Number(displayGross) || 0,
      totalSalary: Number(displayGross) || 0,
      netSalary: Number(displayNet) || 0,
      ctc: Number(calculatedContributions.totalCtc) || 0
    };
    const updated = [newRev, ...revisions];
    setRevisions(updated);
    setActiveRevisionId(newRevId);
    setShowEditor(true);
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      ...newRev,
      salaryEffectiveFrom: today,
      salaryRevisions: updated
    });
  };

  const handleDeleteRevision = (revId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (revisions.length <= 1) {
      alert('At least one salary revision record must be maintained.');
      return;
    }
    const updated = revisions.filter((r) => r.id !== revId);
    setRevisions(updated);
    if (activeRevisionId === revId) {
      const nextRev = updated[0];
      setActiveRevisionId(nextRev?.id || null);
      if (nextRev) {
        onChange({
          ...data,
          ...nextRev,
          salaryRevisions: updated
        });
      }
    } else {
      onChange({
        ...data,
        salaryRevisions: updated
      });
    }
  };

  const handleRecalculate = () => {
    const newGross = calculateDynamicGross(data, dynamicComponentsList);
    const newDeductions = calculateDynamicTotalDeductions(data, dynamicDeductionsList);
    const newNet = Math.max(0, newGross - newDeductions);
    setHasUnsavedChanges(true);
    onChange({
      ...data,
      grossSalary: newGross,
      totalSalary: newGross,
      netSalary: newNet,
      ctc: calculatedContributions.totalCtc,
      totalCtc: calculatedContributions.totalCtc
    });
  };

  const handleSaveRevision = () => {
    const updated = revisions.map((r) => {
      if (r.id === activeRevisionId) {
        return {
          ...r,
          ...data,
          effectiveFrom: data.salaryEffectiveFrom || r.effectiveFrom,
          grossSalary: Number(displayGross) || 0,
          totalSalary: Number(displayGross) || 0,
          netSalary: Number(displayNet) || 0,
          ctc: Number(calculatedContributions.totalCtc) || 0
        };
      }
      return r;
    });
    setRevisions(updated);
    onChange({
      ...data,
      salaryRevisions: updated
    });
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Salary</h3>
          <p className={styles.headerSubtitle}>Manage employee salary, increment and revisions.</p>
        </div>
        <div className={styles.headerActions}>
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
          2. SALARY REVISIONS CARD (WITH BLUE ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.revisionsCard}>
        <div className={styles.revisionsCardHeader}>
          <h4 className={styles.revisionsTitle}>Salary Revisions</h4>
          <div className={styles.revisionsHeaderActions}>
            <button
              type="button"
              className={styles.statementBtn}
              onClick={handleDownloadStatement}
              title="Download employee salary revisions statement"
            >
              <Download size={12} />
              <span>Download</span>
            </button>
            <button
              type="button"
              className={styles.statementBtn}
              onClick={handleAddRevision}
              title="Add new salary revision"
            >
              <Plus size={12} />
              <span>Add Revision</span>
            </button>
          </div>
        </div>

        <div className={styles.revisionsList}>
          {revisions.map((rev) => {
            const isActive = rev.id === activeRevisionId;
            const revEff = formatRevisionDate(rev.effectiveFrom);
            const netVal = rev.netSalary !== undefined ? rev.netSalary : (isActive ? displayNet : 0);
            const ctcVal = rev.ctc !== undefined ? rev.ctc : (isActive ? calculatedContributions.totalCtc : 0);
            const annualCtc = (Number(ctcVal) || 0) * 12;

            return (
              <div
                key={rev.id}
                className={`${styles.revisionRow} ${isActive ? styles.revisionRowActive : ''}`}
                onClick={() => handleEditRevision(rev)}
              >
                <div className={styles.tableCol}>
                  <div className={styles.colHeader}>Effective From</div>
                  <div className={styles.colValue}>{revEff}</div>
                </div>

                <div className={styles.tableCol}>
                  <div className={styles.colHeader}>Net Salary (In-Hand)</div>
                  <div className={styles.colValue}>
                    <span>{Number(netVal).toLocaleString('en-IN')}</span>
                    <span className={styles.unitSuffix}>/m</span>
                  </div>
                </div>

                <div className={styles.tableCol}>
                  <div className={styles.colHeader}>CTC</div>
                  <div className={styles.colValue}>
                    <span>{Number(ctcVal).toLocaleString('en-IN')}</span>
                    <span className={styles.unitSuffix}>/m</span>
                  </div>
                </div>

                <div className={styles.tableCol}>
                  <div className={styles.colHeader}>CTC</div>
                  <div className={styles.colValue}>
                    <span>{Number(annualCtc).toLocaleString('en-IN')}</span>
                    <span className={styles.unitSuffix}>/y</span>
                  </div>
                </div>

                <div className={styles.tableActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.actionBtnEdit}
                    onClick={() => handleEditRevision(rev)}
                    title="Edit Revision"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtnDelete}
                    onClick={(e) => handleDeleteRevision(rev.id, e)}
                    title="Delete Revision"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          3. ACTIVE REVISION DETAILS (OPENING BELOW ON EDIT)
         ======================================================== */}
      {showEditor && (
        <div className={styles.editorCard}>
          <div className={styles.editorHeaderBar}>
            <div className={styles.editorHeaderLeft}>
              <h4 className={styles.editorTitle}>
                Effective From:{' '}
                <span className={styles.editorDateText}>
                  {formatHeaderMonthYear(activeRevision?.effectiveFrom || data.salaryEffectiveFrom)}
                </span>
              </h4>
            </div>
            {hasUnsavedChanges && (
              <div className={styles.editorHeaderRight}>
                <p className={styles.previewNotice}>Preview shown. Don't forget to save.</p>
                <span className={styles.unsavedBadge}>
                  <AlertCircle size={12} />
                  <span>Unsaved Changes</span>
                </span>
              </div>
            )}
          </div>

          <div className={styles.mainLayout}>
        {/* Left Form Column */}
        <div className={styles.mainForm}>
          {/* Section 1: Wage & Salary Structure */}
          <div className={styles.sectionGroup}>
            <div className={styles.recalcBtnRow}>
              <div className={styles.rowLabel} />
              <div className={styles.rowControl}>
                <button
                  type="button"
                  className={styles.recalcBtn}
                  onClick={handleRecalculate}
                  title="Recalculate salary structure"
                >
                  <RotateCcw size={12} />
                  <span>Recalculate</span>
                </button>
              </div>
            </div>

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

            {/* Employer Contributions & CTC (Non-editable) */}
            {/* ESI Contribution */}
            <div className={styles.formRow}>
              <label htmlFor="ctc-esi" className={styles.rowLabel}>
                <span>ESI Contribution</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="ctc-esi"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={calculatedContributions.esiContribution}
                  />
                </div>
              </div>
            </div>

            {/* PF Contribution */}
            <div className={styles.formRow}>
              <label htmlFor="ctc-pf" className={styles.rowLabel}>
                <span>PF Contribution</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="ctc-pf"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={calculatedContributions.pfContribution}
                  />
                </div>
              </div>
            </div>

            {/* Pension Contribution */}
            <div className={styles.formRow}>
              <label htmlFor="ctc-pension" className={styles.rowLabel}>
                <span>Pension Contribution</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="ctc-pension"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={calculatedContributions.pensionContribution}
                  />
                </div>
              </div>
            </div>

            {/* EDLI & Admin Charges */}
            <div className={styles.formRow}>
              <label htmlFor="ctc-edli" className={styles.rowLabel}>
                <span>EDLI & Admin Charges</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="ctc-edli"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput}`}
                    placeholder="0"
                    value={calculatedContributions.edliAndAdmin}
                  />
                </div>
              </div>
            </div>

            {/* Total CTC (Bold label & Bold input) */}
            <div className={styles.formRow}>
              <label htmlFor="ctc-total" className={styles.boldRowLabel}>
                <span>Total CTC</span>
              </label>
              <div className={styles.rowControl}>
                <div className={`${styles.currencyWrapper} ${styles.readOnlyWrapper}`}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    id="ctc-total"
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className={`${styles.currencyInput} ${styles.readOnlyInput} ${styles.boldInput}`}
                    placeholder="0"
                    value={calculatedContributions.totalCtc}
                  />
                </div>
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
            <div className={styles.toggleRow} onClick={handleToggleEsiDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(isEsiDeduct)}
                className={`${styles.toggleSwitch} ${isEsiDeduct ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${isEsiDeduct ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>
                {isEsiDeduct ? 'Deduct ESI' : 'DO NOT Deduct ESI'}
              </span>
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

            {isEsiDeduct && (
              <div className={styles.cardFieldsWrapper}>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>ESI Number</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
                    placeholder="Enter ESI Number"
                    value={data.esicNo || ''}
                    onChange={(e) => handleChange('esicNo', e.target.value)}
                  />
                </div>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>Dispensary Name</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
                    placeholder="Enter Dispensary Name"
                    value={data.dispensaryNo || ''}
                    onChange={(e) => handleChange('dispensaryNo', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Provident Fund (PF) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Provident Fund (PF)</h5>
            <div className={styles.toggleRow} onClick={handleTogglePfDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(isPfDeduct)}
                className={`${styles.toggleSwitch} ${isPfDeduct ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${isPfDeduct ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>
                {isPfDeduct ? 'Deduct PF' : 'DO NOT Deduct PF'}
              </span>
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

            {isPfDeduct && (
              <div className={styles.cardFieldsWrapper}>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>UAN Number</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
                    placeholder="Enter UAN Number"
                    value={data.uan || ''}
                    onChange={(e) => handleChange('uan', e.target.value)}
                  />
                </div>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>PF Number</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
                    placeholder="Enter PF Number"
                    value={data.pfNo || ''}
                    onChange={(e) => handleChange('pfNo', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Professional Tax */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Professional Tax</h5>
            <div className={styles.toggleRow} onClick={handleTogglePtDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(isPtDeduct)}
                className={`${styles.toggleSwitch} ${isPtDeduct ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${isPtDeduct ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>
                {isPtDeduct ? 'Deduct PT' : 'DO NOT Deduct PT'}
              </span>
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
            <div className={styles.toggleRow} onClick={handleToggleTdsDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(isTdsDeduct)}
                className={`${styles.toggleSwitch} ${isTdsDeduct ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${isTdsDeduct ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>
                {isTdsDeduct ? 'Deduct TDS' : 'DO NOT Deduct TDS'}
              </span>
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

            {isTdsDeduct && (
              <div className={styles.cardFieldsWrapper}>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>PAN Number</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
                    placeholder="Enter PAN Number"
                    maxLength={10}
                    value={data.pan || ''}
                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 5: Labour Welfare Fund (LWF) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Labour Welfare Fund (LWF)</h5>
            <div className={styles.toggleRow} onClick={handleToggleLwfDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(isLwfDeduct)}
                className={`${styles.toggleSwitch} ${isLwfDeduct ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${isLwfDeduct ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>
                {isLwfDeduct ? 'Deduct LWF' : 'DO NOT Deduct LWF'}
              </span>
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

            {isLwfDeduct && (
              <div className={styles.cardFieldsWrapper}>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>LWF Number</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
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
          </div>
        </aside>
      </div>
    </div>
  )}
</div>
  );
}

export default SalaryStructureStep;
