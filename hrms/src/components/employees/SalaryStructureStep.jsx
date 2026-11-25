import React, { useMemo, useState, useEffect } from 'react';
import { Download, HelpCircle, Plus, Edit2, Trash2, AlertCircle, RotateCcw, X } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import styles from './SalaryStructureStep.module.css';

const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const formatRevisionDate = (dateVal) => {
  if (!dateVal) return '—';
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
  if (!dateVal) return '—';
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

const MONTH_OPTIONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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
    const esiActive = currentData?.doNotDeductEsi !== undefined ? !currentData.doNotDeductEsi : (currentData?.deductEsi !== undefined ? Boolean(currentData.deductEsi) : (currentData?.esiApplicable !== false && currentData?.esiApplicable !== 'No'));
    const pfActive = currentData?.doNotDeductPf !== undefined ? !currentData.doNotDeductPf : (currentData?.deductPf !== undefined ? Boolean(currentData.deductPf) : (currentData?.pfApplicable !== false && currentData?.pfApplicable !== 'No'));
    const ptActive = currentData?.doNotDeductPt !== undefined ? !currentData.doNotDeductPt : (currentData?.deductPt !== undefined ? Boolean(currentData.deductPt) : (currentData?.ptApplicable !== false && currentData?.ptApplicable !== 'No'));
    const lwfActive = currentData?.doNotDeductLwf !== undefined ? !currentData.doNotDeductLwf : (currentData?.deductLwf !== undefined ? Boolean(currentData.deductLwf) : (currentData?.lwfApplicable !== false && currentData?.lwfApplicable !== 'No'));
    const tdsActive = currentData?.doNotDeductTds !== undefined ? !currentData.doNotDeductTds : (currentData?.deductTds !== undefined ? Boolean(currentData.deductTds) : (currentData?.tdsApplicable !== false && currentData?.tdsApplicable !== 'No'));

    let total = 0;
    comps.forEach((comp) => {
      const name = (comp.name || '').toLowerCase();
      const code = (comp.code || '').toLowerCase();
      if ((name.includes('esi') || code.includes('esi')) && !esiActive) return;
      if ((name.includes('pf') || name.includes('provident') || code.includes('pf')) && !pfActive) return;
      if ((name.includes('pt') || name.includes('professional') || code.includes('pt')) && !ptActive) return;
      if ((name.includes('lwf') || name.includes('welfare') || code.includes('lwf')) && !lwfActive) return;
      if ((name.includes('tds') || name.includes('tax') || code.includes('tds')) && !tdsActive) return;

      const key = getDeductionFieldKey(comp);
      const val = currentData[key] ?? currentData.deductions?.[key] ?? currentData.deductions?.[comp.name] ?? 0;
      total += Number(val) || 0;
    });
    return total;
  };

  /**
   * Unified comprehensive salary & statutory calculation engine for frontend preview
   */
  const calculateComprehensiveSalary = (currentData = {}) => {
    const basic = Number(currentData.basic) || 0;
    const vda = Number(currentData.vda) || 0;
    const hra = Number(currentData.hra) || 0;
    const conveyance = Number(currentData.conveyance) || 0;
    const specialAllowance = Number(currentData.specialAllowance) || 0;
    const otherAllowance = Number(currentData.otherAllowance) || 0;

    let customGross = 0;
    dynamicComponentsList.forEach((comp) => {
      const key = getComponentFieldKey(comp);
      if (!['basic', 'vda', 'hra', 'conveyance', 'specialAllowance', 'otherAllowance'].includes(key)) {
        const val = Number(currentData[key] ?? currentData.customEarnings?.[key] ?? currentData.customEarnings?.[comp.name] ?? 0) || 0;
        customGross += val;
      }
    });

    const grossSalary = basic + vda + hra + conveyance + specialAllowance + otherAllowance + customGross;

    // Statutory switches
    const doNotDeductEsi = currentData.doNotDeductEsi !== undefined
      ? Boolean(currentData.doNotDeductEsi)
      : (currentData.deductEsi !== undefined ? !currentData.deductEsi : (currentData.esiApplicable === false || currentData.esiApplicable === 'No'));
    const isEsiDeduct = !doNotDeductEsi;

    const doNotDeductPf = currentData.doNotDeductPf !== undefined
      ? Boolean(currentData.doNotDeductPf)
      : (currentData.deductPf !== undefined ? !currentData.deductPf : (currentData.pfApplicable === false || currentData.pfApplicable === 'No'));
    const isPfDeduct = !doNotDeductPf;

    const doNotDeductPt = currentData.doNotDeductPt !== undefined
      ? Boolean(currentData.doNotDeductPt)
      : (currentData.deductPt !== undefined ? !currentData.deductPt : (currentData.ptApplicable === false || currentData.ptApplicable === 'No'));
    const isPtDeduct = !doNotDeductPt;

    const doNotDeductLwf = currentData.doNotDeductLwf !== undefined
      ? Boolean(currentData.doNotDeductLwf)
      : (currentData.deductLwf !== undefined ? !currentData.deductLwf : (currentData.lwfApplicable === false || currentData.lwfApplicable === 'No' || currentData.lwf === 'No'));
    const isLwfDeduct = !doNotDeductLwf;

    const doNotDeductTds = currentData.doNotDeductTds !== undefined
      ? Boolean(currentData.doNotDeductTds)
      : (currentData.deductTds !== undefined ? !currentData.deductTds : (currentData.tdsApplicable === false || currentData.tdsApplicable === 'No'));
    const isTdsDeduct = !doNotDeductTds;

    // 1. PF Calculations
    let employeePf = 0;
    let employerPf = 0;
    let epsPension = 0;
    let edliAndAdmin = 0;

    if (isPfDeduct) {
      const pfWageBase = Boolean(currentData.deductPfOnGrossSalary)
        ? grossSalary
        : ((basic + vda) > 0 ? (basic + vda) : Math.min(grossSalary, 15000));

      const isEmployeeAboveCeiling = Boolean(currentData.deductPfAboveCeilingEmployee);
      const isEmployerAboveCeiling = Boolean(currentData.deductPfAboveCeilingEmployer);

      const pfWageEmployee = isEmployeeAboveCeiling ? pfWageBase : Math.min(pfWageBase, 15000);
      const pfWageEmployer = isEmployerAboveCeiling ? pfWageBase : Math.min(pfWageBase, 15000);
      const epsWage = Math.min(pfWageBase, 15000);

      employeePf = Math.round(pfWageEmployee * 0.12);
      if (currentData.minPfDeduction && Number(currentData.minPfDeduction) > 0 && employeePf < Number(currentData.minPfDeduction)) {
        employeePf = Number(currentData.minPfDeduction);
      }

      if (currentData.doNotDeductPension) {
        epsPension = 0;
        employerPf = Math.round(pfWageEmployer * 0.12);
      } else {
        epsPension = Math.round(epsWage * 0.0833);
        employerPf = Math.max(0, Math.round(pfWageEmployer * 0.12) - epsPension);
      }

      const edli = Math.round(epsWage * 0.005);
      const admin = Math.round(pfWageEmployer * 0.005);
      edliAndAdmin = edli + admin;
    }

    // 2. ESI Calculations
    let employeeEsi = 0;
    let employerEsi = 0;
    if (isEsiDeduct) {
      const allowAboveCeiling = currentData.deductEsiAboveCeiling !== false;
      if (grossSalary <= 21000 || allowAboveCeiling) {
        employeeEsi = Math.round(grossSalary * 0.0075);
        employerEsi = Math.round(grossSalary * 0.0325);
      }
    }

    // 3. PT Calculations
    let ptDeduction = 0;
    if (isPtDeduct) {
      const ptState = String(currentData.ptTaxState || 'Delhi').toLowerCase();
      if (ptState.includes('maharashtra')) {
        ptDeduction = grossSalary > 10000 ? 200 : (grossSalary > 7500 ? 175 : 0);
      } else if (ptState.includes('karnataka')) {
        ptDeduction = grossSalary > 15000 ? 200 : 0;
      } else if (ptState.includes('gujarat')) {
        ptDeduction = grossSalary > 12000 ? 200 : (grossSalary > 9000 ? 150 : (grossSalary > 6000 ? 80 : 0));
      } else if (ptState.includes('west bengal') || ptState.includes('bengal')) {
        ptDeduction = grossSalary > 40000 ? 200 : (grossSalary > 25000 ? 150 : (grossSalary > 15000 ? 130 : 0));
      } else if (ptState.includes('delhi')) {
        ptDeduction = 0;
      } else if (ptState.includes('telangana') || ptState.includes('andhra')) {
        ptDeduction = grossSalary > 20000 ? 200 : (grossSalary > 15000 ? 150 : 0);
      } else if (ptState.includes('tamil')) {
        ptDeduction = grossSalary > 15000 ? 208 : 0;
      } else if (ptState.includes('madhya')) {
        ptDeduction = grossSalary > 18750 ? 208 : 0;
      } else {
        ptDeduction = grossSalary > 15000 ? 200 : 0;
      }
    }

    // 4. LWF Calculations
    let employeeLwf = 0;
    let employerLwf = 0;
    if (isLwfDeduct) {
      const lwfState = String(currentData.lwfTaxState || 'Delhi').toLowerCase();
      if (lwfState.includes('delhi')) {
        employeeLwf = 0.75;
        employerLwf = 2.25;
      } else if (lwfState.includes('maharashtra')) {
        employeeLwf = 12;
        employerLwf = 36;
      } else if (lwfState.includes('gujarat')) {
        employeeLwf = 6;
        employerLwf = 12;
      } else if (lwfState.includes('karnataka')) {
        employeeLwf = 20;
        employerLwf = 40;
      } else {
        employeeLwf = 5;
        employerLwf = 15;
      }
    }

    // 5. TDS Calculations
    let tdsDeduction = 0;
    if (isTdsDeduct && Number(currentData.tdsAmount) > 0) {
      tdsDeduction = Number(currentData.tdsAmount);
    }

    // 6. Manual Deductions
    let customDeductions = 0;
    dynamicDeductionsList.forEach((comp) => {
      const key = getDeductionFieldKey(comp);
      const val = Number(currentData[key] ?? currentData.deductions?.[key] ?? currentData.deductions?.[comp.name] ?? 0) || 0;
      customDeductions += val;
    });

    const totalDeductions = Math.round(employeePf + employeeEsi + ptDeduction + employeeLwf + tdsDeduction + customDeductions);
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    const totalEmployerContributions = Math.round(employerPf + epsPension + edliAndAdmin + employerEsi + employerLwf);
    const totalCtc = grossSalary + totalEmployerContributions;

    return {
      grossSalary,
      totalSalary: grossSalary,
      netSalary,
      totalDeductions,
      employeePf,
      employeeEsi,
      ptDeduction,
      employeeLwf,
      tdsDeduction,
      customDeductions,
      employerContributions: {
        pfEmployer: employerPf,
        pensionEmployer: epsPension,
        eps: epsPension,
        epfEmployer: employerPf,
        edliAndAdmin,
        esiEmployer: employerEsi,
        lwfEmployer: employerLwf,
        totalEmployerContributions,
        totalCtc
      },
      ctc: totalCtc,
      totalCtc
    };
  };

  const syncRevisionsWithData = (updatedData, calc) => {
    if (!activeRevisionId || revisions.length === 0) {
      return revisions;
    }
    const updated = revisions.map((r) => {
      if (r.id === activeRevisionId) {
        return {
          ...r,
          ...updatedData,
          grossSalary: calc.grossSalary,
          totalSalary: calc.grossSalary,
          netSalary: calc.netSalary,
          ctc: calc.totalCtc,
          totalCtc: calc.totalCtc,
          employerContributions: calc.employerContributions
        };
      }
      return r;
    });
    setRevisions(updated);
    return updated;
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

    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

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

    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.netSalary = calc.netSalary;
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

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
      'ptNo',
      'ptNumber',
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

    if (field === 'grossSalary') {
      updatedData.grossSalary = formattedValue;
    }

    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const doNotDeductEsi = data.doNotDeductEsi !== undefined
    ? Boolean(data.doNotDeductEsi)
    : (data.deductEsi !== undefined ? !data.deductEsi : (data.esiApplicable === false || data.esiApplicable === 'No'));
  const isEsiDeduct = !doNotDeductEsi;

  const doNotDeductPf = data.doNotDeductPf !== undefined
    ? Boolean(data.doNotDeductPf)
    : (data.deductPf !== undefined ? !data.deductPf : (data.pfApplicable === false || data.pfApplicable === 'No'));
  const isPfDeduct = !doNotDeductPf;

  const doNotDeductTds = data.doNotDeductTds !== undefined
    ? Boolean(data.doNotDeductTds)
    : (data.deductTds !== undefined ? !data.deductTds : (data.tdsApplicable === false || data.tdsApplicable === 'No'));
  const isTdsDeduct = !doNotDeductTds;

  const doNotDeductLwf = data.doNotDeductLwf !== undefined
    ? Boolean(data.doNotDeductLwf)
    : (data.deductLwf !== undefined ? !data.deductLwf : (data.lwfApplicable === false || data.lwfApplicable === 'No' || data.lwf === 'No'));
  const isLwfDeduct = !doNotDeductLwf;

  const doNotDeductPt = data.doNotDeductPt !== undefined
    ? Boolean(data.doNotDeductPt)
    : (data.deductPt !== undefined ? !data.deductPt : (data.ptApplicable === false || data.ptApplicable === 'No'));
  const isPtDeduct = !doNotDeductPt;

  const isPfActive = isPfDeduct;
  const isEsiActive = isEsiDeduct;
  const isTdsActive = isTdsDeduct;
  const isLwfActive = isLwfDeduct;
  const isPtActive = isPtDeduct;

  const currentCalc = useMemo(() => {
    return calculateComprehensiveSalary(data);
  }, [
    data,
    dynamicComponentsList,
    dynamicDeductionsList,
    isEsiDeduct,
    data.deductEsiAboveCeiling,
    isPfDeduct,
    data.deductPfAboveCeilingEmployee,
    data.deductPfAboveCeilingEmployer,
    data.deductPfOnGrossSalary,
    data.doNotDeductPension,
    data.minPfDeduction,
    isPtDeduct,
    data.ptTaxState,
    isLwfDeduct,
    data.lwfTaxState,
    isTdsDeduct,
    data.tdsAmount
  ]);

  const displayGross = currentCalc.grossSalary;
  const displayNet = currentCalc.netSalary;
  const calculatedContributions = useMemo(() => ({
    esiContribution: currentCalc.employerContributions.esiEmployer,
    pfContribution: currentCalc.employerContributions.pfEmployer,
    pensionContribution: currentCalc.employerContributions.pensionEmployer,
    edliAndAdmin: currentCalc.employerContributions.edliAndAdmin,
    totalCtc: currentCalc.totalCtc
  }), [currentCalc]);

  const handleToggleEsiDeduct = () => {
    const nextDoNotDeduct = !doNotDeductEsi;
    const nextDeduct = !nextDoNotDeduct;
    const updatedData = {
      ...data,
      doNotDeductEsi: nextDoNotDeduct,
      deductEsi: nextDeduct,
      esiApplicable: nextDeduct
    };
    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const handleTogglePfDeduct = () => {
    const nextDoNotDeduct = !doNotDeductPf;
    const nextDeduct = !nextDoNotDeduct;
    const updatedData = {
      ...data,
      doNotDeductPf: nextDoNotDeduct,
      deductPf: nextDeduct,
      pfApplicable: nextDeduct
    };
    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const handleToggleTdsDeduct = () => {
    const nextDoNotDeduct = !doNotDeductTds;
    const nextDeduct = !nextDoNotDeduct;
    const updatedData = {
      ...data,
      doNotDeductTds: nextDoNotDeduct,
      deductTds: nextDeduct,
      tdsApplicable: nextDeduct
    };
    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const handleToggleLwfDeduct = () => {
    const nextDoNotDeduct = !doNotDeductLwf;
    const nextDeduct = !nextDoNotDeduct;
    const updatedData = {
      ...data,
      doNotDeductLwf: nextDoNotDeduct,
      deductLwf: nextDeduct,
      lwfApplicable: nextDeduct
    };
    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const handleTogglePtDeduct = () => {
    const nextDoNotDeduct = !doNotDeductPt;
    const nextDeduct = !nextDoNotDeduct;
    const updatedData = {
      ...data,
      doNotDeductPt: nextDoNotDeduct,
      deductPt: nextDeduct,
      ptApplicable: nextDeduct
    };
    const calc = calculateComprehensiveSalary(updatedData);
    updatedData.grossSalary = calc.grossSalary;
    updatedData.totalSalary = calc.grossSalary;
    updatedData.netSalary = calc.netSalary;
    updatedData.ctc = calc.totalCtc;
    updatedData.totalCtc = calc.totalCtc;
    updatedData.employerContributions = calc.employerContributions;

    const updatedRevisions = syncRevisionsWithData(updatedData, calc);
    updatedData.salaryRevisions = updatedRevisions;

    setHasUnsavedChanges(true);
    onChange(updatedData);
  };

  const handleDownloadStatement = () => {
    downloadEmployeeProfile(data, activeCompany);
  };

  // Revisions State & Dynamic Initialization (Loaded strictly from this employee's live record)
  const [revisions, setRevisions] = useState(() => {
    if (Array.isArray(data.salaryRevisions) && data.salaryRevisions.length > 0) {
      return data.salaryRevisions;
    }
    return [];
  });

  const [activeRevisionId, setActiveRevisionId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddRevisionOpen, setIsAddRevisionOpen] = useState(false);
  const [revisionMonth, setRevisionMonth] = useState(() => {
    return MONTH_OPTIONS[new Date().getMonth()] || 'JAN';
  });
  const [revisionYear, setRevisionYear] = useState(() => {
    return String(new Date().getFullYear());
  });
  const [newRevisionRate, setNewRevisionRate] = useState('');

  // Sync revisions strictly when employee record loads from database
  useEffect(() => {
    setHasUnsavedChanges(false);
    setActiveRevisionId(null);
    setShowEditor(false);
    if (Array.isArray(data.salaryRevisions) && data.salaryRevisions.length > 0) {
      setRevisions(data.salaryRevisions);
    } else {
      setRevisions([]);
    }
  }, [data._id, data.id, data.employeeId, data.employeeCode]);

  useEffect(() => {
    const handleSaved = () => setHasUnsavedChanges(false);
    window.addEventListener('employee-saved', handleSaved);
    window.addEventListener('employees-updated', handleSaved);
    return () => {
      window.removeEventListener('employee-saved', handleSaved);
      window.removeEventListener('employees-updated', handleSaved);
    };
  }, []);

  const activeRevision = useMemo(() => {
    return revisions.find((r) => r.id === activeRevisionId) || revisions[0] || null;
  }, [revisions, activeRevisionId]);

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

  const handleToggleAddRevisionCard = () => {
    setIsAddRevisionOpen((prev) => {
      const next = !prev;
      if (next) {
        setRevisionMonth(MONTH_OPTIONS[new Date().getMonth()] || 'JAN');
        setRevisionYear(String(new Date().getFullYear()));
        setNewRevisionRate('');
      }
      return next;
    });
  };

  const handleConfirmAddRevision = () => {
    const monthIdx = MONTH_OPTIONS.indexOf(revisionMonth);
    const mStr = String(monthIdx >= 0 ? monthIdx + 1 : 1).padStart(2, '0');
    const yStr = String(revisionYear || new Date().getFullYear()).trim();
    const effectiveFromIso = `${yStr}-${mStr}-01`;

    const rateNum = Number(newRevisionRate);
    if (!newRevisionRate || isNaN(rateNum) || rateNum <= 0) {
      alert('Please enter a valid New Monthly Rate.');
      return;
    }

    const newRevId = `rev-${Date.now()}`;
    const oldGross = Number(displayGross) || 0;

    let newBasic = 0;
    let newVda = 0;
    let newHra = 0;
    let newConveyance = 0;
    let newSpecialAllowance = 0;

    if (oldGross > 0) {
      const ratio = rateNum / oldGross;
      newBasic = Math.round((Number(data.basic) || 0) * ratio);
      newVda = Math.round((Number(data.vda) || 0) * ratio);
      newHra = Math.round((Number(data.hra) || 0) * ratio);
      newConveyance = Math.round((Number(data.conveyance) || 0) * ratio);
      newSpecialAllowance = Math.max(0, rateNum - (newBasic + newVda + newHra + newConveyance));
    } else {
      newBasic = Math.round(rateNum * 0.6);
      newVda = Math.round(rateNum * 0.1);
      newHra = Math.round(rateNum * 0.15);
      newConveyance = Math.round(rateNum * 0.05);
      newSpecialAllowance = Math.max(0, rateNum - (newBasic + newVda + newHra + newConveyance));
    }

    const calc = calculateComprehensiveSalary({
      ...data,
      basic: newBasic,
      vda: newVda,
      hra: newHra,
      conveyance: newConveyance,
      specialAllowance: newSpecialAllowance,
      grossSalary: rateNum,
      totalSalary: rateNum
    });

    const newRev = {
      ...data,
      id: newRevId,
      effectiveFrom: effectiveFromIso,
      salaryEffectiveFrom: effectiveFromIso,
      grossSalary: rateNum,
      totalSalary: rateNum,
      basic: newBasic,
      vda: newVda,
      hra: newHra,
      conveyance: newConveyance,
      specialAllowance: newSpecialAllowance,
      netSalary: calc.netSalary,
      ctc: calc.totalCtc,
      totalCtc: calc.totalCtc,
      employerContributions: calc.employerContributions,
      isIncrement: true
    };

    const updated = [newRev, ...revisions];
    setRevisions(updated);
    setActiveRevisionId(newRevId);
    setShowEditor(true);
    setIsAddRevisionOpen(false);
    setNewRevisionRate('');
    setHasUnsavedChanges(true);

    onChange({
      ...data,
      ...newRev,
      salaryEffectiveFrom: effectiveFromIso,
      grossSalary: rateNum,
      totalSalary: rateNum,
      basic: newBasic,
      vda: newVda,
      hra: newHra,
      conveyance: newConveyance,
      specialAllowance: newSpecialAllowance,
      netSalary: calc.netSalary,
      ctc: calc.totalCtc,
      totalCtc: calc.totalCtc,
      employerContributions: calc.employerContributions,
      salaryRevisions: updated
    });
  };

  const handleDeleteRevision = (revId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const updated = revisions.filter((r) => r.id !== revId);
    setRevisions(updated);
    if (activeRevisionId === revId) {
      const nextRev = updated[0];
      setActiveRevisionId(nextRev?.id || null);
      setShowEditor(Boolean(nextRev));
      if (nextRev) {
        onChange({
          ...data,
          ...nextRev,
          salaryRevisions: updated
        });
      } else {
        onChange({
          ...data,
          salaryRevisions: []
        });
      }
    } else {
      onChange({
        ...data,
        salaryRevisions: updated
      });
    }
    setHasUnsavedChanges(true);
  };

  const handleRecalculate = () => {
    const calc = calculateComprehensiveSalary(data);
    const targetRevId = activeRevisionId || (revisions[0] ? revisions[0].id : null);

    let updatedRevisions = revisions;
    if (revisions.length > 0) {
      updatedRevisions = revisions.map((r) => {
        if (!targetRevId || r.id === targetRevId) {
          return {
            ...r,
            ...data,
            effectiveFrom: data.salaryEffectiveFrom || r.effectiveFrom,
            grossSalary: calc.grossSalary,
            totalSalary: calc.grossSalary,
            basic: Number(data.basic) || 0,
            vda: Number(data.vda) || 0,
            hra: Number(data.hra) || 0,
            conveyance: Number(data.conveyance) || 0,
            specialAllowance: Number(data.specialAllowance) || 0,
            otherAllowance: Number(data.otherAllowance) || 0,
            netSalary: calc.netSalary,
            ctc: calc.totalCtc,
            totalCtc: calc.totalCtc,
            employerContributions: calc.employerContributions
          };
        }
        return r;
      });
    } else {
      updatedRevisions = [
        {
          id: `rev-${Date.now()}`,
          effectiveFrom: data.salaryEffectiveFrom || new Date().toISOString().split('T')[0],
          salaryType: data.salaryType || 'Monthly',
          salaryStructureType: data.salaryStructureType || 'Regular',
          grossSalary: calc.grossSalary,
          totalSalary: calc.grossSalary,
          basic: Number(data.basic) || 0,
          vda: Number(data.vda) || 0,
          hra: Number(data.hra) || 0,
          conveyance: Number(data.conveyance) || 0,
          specialAllowance: Number(data.specialAllowance) || 0,
          otherAllowance: Number(data.otherAllowance) || 0,
          netSalary: calc.netSalary,
          ctc: calc.totalCtc,
          totalCtc: calc.totalCtc,
          employerContributions: calc.employerContributions
        }
      ];
    }

    setRevisions(updatedRevisions);
    if (!activeRevisionId && updatedRevisions[0]) {
      setActiveRevisionId(updatedRevisions[0].id);
    }
    setHasUnsavedChanges(true);

    onChange({
      ...data,
      grossSalary: calc.grossSalary,
      totalSalary: calc.grossSalary,
      netSalary: calc.netSalary,
      ctc: calc.totalCtc,
      totalCtc: calc.totalCtc,
      employerContributions: calc.employerContributions,
      salaryRevisions: updatedRevisions
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
              onClick={handleToggleAddRevisionCard}
              title="Add new salary revision"
            >
              <Plus size={12} />
              <span>Add Revision</span>
            </button>
          </div>
        </div>

        {/* Add Salary Revision Modal (Popup Dialog with Blue Buttons) */}
        {isAddRevisionOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsAddRevisionOpen(false)}>
            <div className={styles.revisionModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>Add Salary Revision</h4>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsAddRevisionOpen(false)}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Effective From */}
                <div className={styles.modalRow}>
                  <label className={styles.modalLabel}>Effective From</label>
                  <div className={styles.effectiveFromGroup}>
                    <select
                      className={styles.modalMonthSelect}
                      value={revisionMonth}
                      onChange={(e) => setRevisionMonth(e.target.value)}
                    >
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className={styles.modalYearInput}
                      value={revisionYear}
                      onChange={(e) => setRevisionYear(e.target.value)}
                      min="2000"
                      max="2099"
                    />
                  </div>
                </div>

                {/* New Monthly Rate */}
                <div className={styles.modalRow}>
                  <label className={styles.modalLabel}>New Monthly Rate</label>
                  <div className={styles.modalInputWrapper}>
                    <div className={styles.currencyWrapper}>
                      <span className={styles.currencySymbol}>₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter New Monthly Rate"
                        className={styles.currencyInput}
                        value={newRevisionRate}
                        onChange={(e) => setNewRevisionRate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmAddRevision();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCloseTextBtn}
                  onClick={() => setIsAddRevisionOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.modalAddBtn}
                  onClick={handleConfirmAddRevision}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.revisionsList}>
          {revisions.length === 0 ? (
            <div className={styles.emptyRevisionsBox}>
              <p className={styles.emptyRevisionsText}>No salary revisions recorded yet.</p>
            </div>
          ) : (
            revisions.map((rev) => {
              const isActive = rev.id === activeRevisionId;
              const revEff = formatRevisionDate(rev.effectiveFrom);
              const netVal = rev.netSalary !== undefined ? rev.netSalary : (isActive ? displayNet : 0);
              const ctcVal = rev.ctc !== undefined ? rev.ctc : (isActive ? calculatedContributions.totalCtc : 0);
              const annualCtc = (Number(ctcVal) || 0) * 12;

              return (
                <div
                  key={rev.id}
                  className={`${styles.revisionRow} ${isActive ? styles.revisionRowActive : ''}`}
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
            })
          )}
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
            {dynamicDeductionsList.filter((comp) => {
              const name = (comp.name || '').toLowerCase();
              const code = (comp.code || '').toLowerCase();
              if ((name.includes('esi') || code.includes('esi')) && !isEsiDeduct) return false;
              if ((name.includes('pf') || name.includes('provident') || code.includes('pf')) && !isPfDeduct) return false;
              if ((name.includes('pt') || name.includes('professional') || code.includes('pt')) && !isPtDeduct) return false;
              if ((name.includes('lwf') || name.includes('welfare') || code.includes('lwf')) && !isLwfDeduct) return false;
              if ((name.includes('tds') || name.includes('tax') || code.includes('tds')) && !isTdsDeduct) return false;
              return true;
            }).map((comp) => {
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
                aria-checked={Boolean(doNotDeductEsi)}
                className={`${styles.toggleSwitch} ${doNotDeductEsi ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${doNotDeductEsi ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct ESI</span>
            </div>

            {!doNotDeductEsi && (
              <>
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
              </>
            )}
          </div>

          {/* Card 2: Provident Fund (PF) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Provident Fund (PF)</h5>
            <div className={styles.toggleRow} onClick={handleTogglePfDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(doNotDeductPf)}
                className={`${styles.toggleSwitch} ${doNotDeductPf ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${doNotDeductPf ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct PF</span>
            </div>

            {!doNotDeductPf && (
              <>
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
              </>
            )}
          </div>

          {/* Card 3: Professional Tax */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Professional Tax</h5>
            <div className={styles.toggleRow} onClick={handleTogglePtDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(doNotDeductPt)}
                className={`${styles.toggleSwitch} ${doNotDeductPt ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${doNotDeductPt ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct PT</span>
              <span className={styles.infoBadge} title="Professional Tax exemption">i</span>
            </div>

            {!doNotDeductPt && (
              <div className={styles.cardFieldsWrapper}>
                <div className={styles.optionInlineRow}>
                  <span className={styles.optionInlineLabel}>PT Number</span>
                  <input
                    type="text"
                    className={styles.optionTextInput}
                    placeholder="Enter PT Number"
                    value={data.ptNo || data.ptNumber || ''}
                    onChange={(e) => handleChange('ptNo', e.target.value)}
                  />
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
            )}
          </div>

          {/* Card 4: Income Tax (TDS) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Income Tax (TDS)</h5>
            <div className={styles.toggleRow} onClick={handleToggleTdsDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(doNotDeductTds)}
                className={`${styles.toggleSwitch} ${doNotDeductTds ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${doNotDeductTds ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct TDS</span>
              <span className={styles.infoBadge} title="TDS deduction exemption">i</span>
            </div>

            {!doNotDeductTds && (
              <>
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
              </>
            )}
          </div>

          {/* Card 5: Labour Welfare Fund (LWF) */}
          <div className={styles.optionCard}>
            <h5 className={styles.optionCardTitle}>Labour Welfare Fund (LWF)</h5>
            <div className={styles.toggleRow} onClick={handleToggleLwfDeduct}>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(doNotDeductLwf)}
                className={`${styles.toggleSwitch} ${doNotDeductLwf ? styles.toggleSwitchBlue : ''}`}
              >
                <span className={`${styles.toggleKnob} ${doNotDeductLwf ? styles.toggleKnobActive : ''}`} />
              </button>
              <span className={styles.toggleLabel}>DO NOT Deduct LWF</span>
              <span className={styles.infoBadge} title="Labour Welfare Fund exemption">i</span>
            </div>

            {!doNotDeductLwf && (
              <>
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
              </>
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
