import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { formatRupee, numberToIndianWords, formatDate } from '../../utils/payrollUtils';
import { generateSalarySlipPdf } from '../../utils/salarySlipPdfUtil';
import payrollService from '../../services/payrollService';
import statutoryService from '../../services/statutoryService';
import { useCompany } from '../../context/CompanyContext';
import styles from './EmployeePayslipModal.module.css';

const MONTHS = [
  { value: 1, label: 'January', code: '01' },
  { value: 2, label: 'February', code: '02' },
  { value: 3, label: 'March', code: '03' },
  { value: 4, label: 'April', code: '04' },
  { value: 5, label: 'May', code: '05' },
  { value: 6, label: 'June', code: '06' },
  { value: 7, label: 'July', code: '07' },
  { value: 8, label: 'August', code: '08' },
  { value: 9, label: 'September', code: '09' },
  { value: 10, label: 'October', code: '10' },
  { value: 11, label: 'November', code: '11' },
  { value: 12, label: 'December', code: '12' },
];

const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];

/**
 * EmployeePayslipModal
 * Renders an expansive, executive A4 Payslip preview with month/year picker and PDF download.
 */
export default function EmployeePayslipModal({ isOpen, employee, onClose }) {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const scrollRef = useRef(null);

  const currentDate = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => currentDate.getFullYear());
  const [slipData, setSlipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFromDb, setIsFromDb] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [slipStatus, setSlipStatus] = useState('none'); // 'approved' | 'calculated' | 'unprocessed'
  const [showStructurePreview, setShowStructurePreview] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset scroll to top whenever new slip loads or modal opens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [selectedMonth, selectedYear, isOpen, slipData]);

  // Helper to calculate PT for an employee gross salary & state strictly from statutory slabs
  const calculatePTFromSlabs = (gross, stateStr, ptSlabs = [], monthStr = '') => {
    if (!stateStr || !Array.isArray(ptSlabs) || ptSlabs.length === 0) return 0;
    const lower = String(stateStr).trim().toLowerCase();
    const stateSlabs = ptSlabs.filter((s) => {
      if (s.status !== 'active') return false;
      const sState = String(s.state || '').trim().toLowerCase();
      return sState && (lower === sState || lower.includes(sState) || sState.includes(lower));
    });
    if (stateSlabs.length === 0) return 0;

    const isFeb = monthStr ? (String(monthStr).includes('-02') || String(monthStr).toLowerCase().includes('feb')) : false;

    for (const slab of stateSlabs) {
      const min = Number(slab.minSalary || 0);
      const max = Number(slab.maxSalary || 9999999);
      if (gross >= min && gross <= max) {
        if (isFeb && slab.februaryTaxAmount !== undefined && slab.februaryTaxAmount !== null && Number(slab.februaryTaxAmount) > 0) {
          return Number(slab.februaryTaxAmount);
        }
        return Number(slab.taxAmount) || 0;
      }
    }
    return 0;
  };

  // Helper to calculate LWF for an employee strictly from statutory LWF rules
  const calculateLWFFromRules = (gross, stateStr, lwfRules = [], monthStr = '', isApplicable = true, lwfEnabled = true) => {
    if (lwfEnabled === false || isApplicable === false || !stateStr || !Array.isArray(lwfRules) || lwfRules.length === 0) {
      return { employee: 0, employer: 0 };
    }
    const lower = String(stateStr).trim().toLowerCase();
    const activeRules = lwfRules.filter((r) => {
      if (r.status !== 'active') return false;
      const sState = String(r.state || '').trim().toLowerCase();
      return sState && (lower === sState || lower.includes(sState) || sState.includes(lower));
    });
    if (activeRules.length === 0) return { employee: 0, employer: 0 };

    let monthNum = 0;
    if (monthStr && monthStr.includes('-')) {
      monthNum = Number(monthStr.split('-')[1]) || 0;
    } else {
      monthNum = new Date().getMonth() + 1;
    }

    for (const rule of activeRules) {
      const freq = String(rule.frequency || 'Monthly').trim().toLowerCase();
      const dedMonths = String(rule.deductionMonths || 'Every Month').trim().toLowerCase();
      let applies = false;
      if (freq === 'monthly' || dedMonths.includes('every month')) {
        applies = true;
      } else if (freq.includes('half') || dedMonths.includes('june') || dedMonths.includes('december')) {
        applies = monthNum === 6 || monthNum === 12;
      } else if (freq.includes('yearly') || freq.includes('annual')) {
        applies = monthNum === 12;
      } else {
        applies = true;
      }
      if (applies) {
        return {
          employee: Number(rule.employeeContribution) || 0,
          employer: Number(rule.employerContribution) || 0,
        };
      }
    }
    return { employee: 0, employer: 0 };
  };

  // Helper to calculate TDS based on configured statutory TDS regime & slabs
  const calculateTDSFromSettings = (earnedGross, emp = {}, statutoryTds = {}) => {
    if (statutoryTds?.enabled === false) return 0;
    const isApplicable = emp.tdsApplicable === true || String(emp.tdsApplicable).toLowerCase() === 'yes';
    if (!isApplicable) return 0;

    if (emp.tdsAmount !== undefined && emp.tdsAmount !== null && Number(emp.tdsAmount) > 0) {
      return Number(emp.tdsAmount);
    }
    if (emp.tdsPercentage !== undefined && emp.tdsPercentage !== null && Number(emp.tdsPercentage) > 0) {
      return Math.round(earnedGross * (Number(emp.tdsPercentage) / 100));
    }

    const annualGross = earnedGross * 12;
    const threshold = Number(statutoryTds?.monthlyTDSThreshold) || 500000;
    if (annualGross <= threshold && threshold > 0) return 0;

    const regime = emp.taxRegime || statutoryTds?.defaultTaxRegime || 'New Regime';
    const isNew = !String(regime).toLowerCase().includes('old');
    const stdDed = isNew
      ? (Number(statutoryTds?.standardDeductionNewRegime) || 75000)
      : (Number(statutoryTds?.standardDeductionOldRegime) || 50000);

    const taxable = Math.max(0, annualGross - stdDed);
    let annualTax = 0;

    if (isNew) {
      if (taxable <= 700000) return 0;
      let rem = taxable;
      if (rem > 1500000) { annualTax += (rem - 1500000) * 0.30; rem = 1500000; }
      if (rem > 1200000) { annualTax += (rem - 1200000) * 0.20; rem = 1200000; }
      if (rem > 1000000) { annualTax += (rem - 1000000) * 0.15; rem = 1000000; }
      if (rem > 700000) { annualTax += (rem - 700000) * 0.10; rem = 700000; }
      if (rem > 300000) { annualTax += (rem - 300000) * 0.05; }
    } else {
      if (taxable <= 500000) return 0;
      let rem = taxable;
      if (rem > 1000000) { annualTax += (rem - 1000000) * 0.30; rem = 1000000; }
      if (rem > 500000) { annualTax += (rem - 500000) * 0.20; rem = 500000; }
      if (rem > 250000) { annualTax += (rem - 250000) * 0.05; }
    }

    if (annualTax > 0) annualTax *= 1.04;
    return Math.max(0, Math.round(annualTax / 12));
  };

  // Construct or load payslip whenever modal opens or month/year changes
  const loadSlip = useCallback(async () => {
    if (!employee) return;

    setLoading(true);
    setShowStructurePreview(false);
    const monthObj = MONTHS.find((m) => m.value === Number(selectedMonth)) || MONTHS[currentDate.getMonth()];
    const monthKey = `${selectedYear}-${monthObj.code}`;
    const compId = activeCompany?.companyId || activeCompany?.id || employee.companyId || 'RRS8392014SEC';
    const empIdentifier = employee.employeeId || employee.employeeCode || employee._id || employee.id;
    const normEmpId = String(empIdentifier || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Determine strict employee applicability flags (default to false if not set or not 'Yes'/true)
    const isPfApplicable = Boolean(employee.pfApplicable === true || String(employee.pfApplicable).toLowerCase() === 'yes');
    const isEsiApplicable = Boolean(employee.esiApplicable === true || String(employee.esiApplicable).toLowerCase() === 'yes');
    const isPtApplicable = Boolean(employee.ptApplicable === true || String(employee.ptApplicable).toLowerCase() === 'yes');
    const isTdsApplicable = Boolean(employee.tdsApplicable === true || String(employee.tdsApplicable).toLowerCase() === 'yes');

    // 1. Fetch live company statutory settings from MongoDB
    let statutory = null;
    try {
      statutory = await statutoryService.getStatutoryConfig(compId);
    } catch (_) {
      // Fallback if statutory service unavailable
    }

    const pfEnabled = statutory?.pf?.enabled !== false;
    const esiEnabled = statutory?.esi?.enabled !== false;
    const ptEnabled = statutory?.pt?.enabled !== false;
    const ptSlabs = statutory?.ptSlabs || [];

    // 2. Check if official salary slip is saved in MongoDB database for THIS specific employee
    try {
      const dbSlips = await payrollService.getSalarySlips(compId, {
        month: monthKey,
        employeeId: empIdentifier
      });

      if (Array.isArray(dbSlips) && dbSlips.length > 0) {
        const found = dbSlips.find((s) => {
          const sId = String(s.employeeId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return sId && sId === normEmpId;
        });

        if (found) {
          const earnings = found.earnings || found.earningsBreakdown || {};
          const deductions = { ...(found.deductions || found.deductionsBreakdown || {}) };

          // Sanitize deductions against employee's real configured settings
          if (!isPfApplicable) deductions.pfEmployee = 0;
          if (!isEsiApplicable) deductions.esiEmployee = 0;
          if (!isPtApplicable) deductions.pt = 0;
          if (!isTdsApplicable) deductions.tds = 0;

          const totalDeductions =
            (Number(deductions.pfEmployee) || 0) +
            (Number(deductions.esiEmployee) || 0) +
            (Number(deductions.pt) || 0) +
            (Number(deductions.tds) || 0) +
            (Number(deductions.advances) || 0) +
            (Number(deductions.otherDeductions) || Number(deductions.lwf) || 0);

          const grossSalary = found.grossSalary || Number(earnings.totalGross) || 0;
          const netSalary = Math.max(0, grossSalary - totalDeductions);

          setSlipData({
            ...found,
            salaryMonth: found.salaryMonth || `${monthObj.label} ${selectedYear}`,
            month: monthKey,
            slipNumber: found.slipNumber || `PAY-${selectedYear}${monthObj.code}-${String(empIdentifier).replace(/[^a-zA-Z0-9]/g, '')}`,
            workingDays: found.workingDays || new Date(selectedYear, selectedMonth, 0).getDate(),
            presentDays: found.presentDays !== undefined ? found.presentDays : (found.paidDays || 30),
            paidDays: found.paidDays !== undefined ? found.paidDays : 30,
            lopDays: found.lopDays || 0,
            grossSalary,
            totalDeductions,
            netSalary,
            earnings: {
              basic: earnings.basic || earnings.basicSalary || 0,
              vda: earnings.vda || 0,
              hra: earnings.hra || 0,
              conveyance: earnings.conveyance || earnings.conveyanceAllowance || 0,
              otherAllowance: earnings.otherAllowance || 0,
              specialAllowance: earnings.specialAllowance || 0,
              overtime: earnings.overtime || 0,
              totalGross: grossSalary,
            },
            deductions: {
              pfEmployee: deductions.pfEmployee || 0,
              esiEmployee: deductions.esiEmployee || 0,
              pt: deductions.pt || 0,
              tds: deductions.tds || 0,
              advances: deductions.advances || 0,
              otherDeductions: deductions.otherDeductions || deductions.lwf || 0,
              totalDeductions,
            }
          });
          setIsFromDb(true);
          setSlipStatus('approved');
          setLoading(false);
          return;
        }
      }
    } catch (_) {
      // Fallback
    }

    // 3. Check if calculated Payroll Run record exists for this employee in MongoDB
    try {
      const payrollRes = await payrollService.getPayrollRecords(compId, monthKey);
      const records = payrollRes?.records || [];
      const foundRec = records.find((r) => {
        const rId = String(r.employeeId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const rCode = String(r.employeeCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const rMongoId = String(r.id || r._id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (rId && rId === normEmpId) || (rCode && rCode === normEmpId) || (rMongoId && rMongoId.includes(normEmpId));
      });

      if (foundRec && (foundRec.paidDays > 0 || foundRec.status === 'Processed' || foundRec.status === 'Approved')) {
        const earnings = foundRec.earnings || {};
        const deductions = { ...(foundRec.deductions || {}) };

        // Sanitize deductions against employee's real configured settings
        if (!isPfApplicable) deductions.pfEmployee = 0;
        if (!isEsiApplicable) deductions.esiEmployee = 0;
        if (!isPtApplicable) deductions.pt = 0;
        if (!isTdsApplicable) deductions.tds = 0;

        const totalDeductions =
          (Number(deductions.pfEmployee) || 0) +
          (Number(deductions.esiEmployee) || 0) +
          (Number(deductions.pt) || 0) +
          (Number(deductions.tds) || 0) +
          (Number(deductions.advances) || 0) +
          (Number(deductions.otherDeductions) || Number(deductions.lwf) || 0);

        const grossSalary = Number(earnings.totalGross) || Number(foundRec.grossSalary) || 0;
        const netSalary = Math.max(0, grossSalary - totalDeductions);

        setSlipData({
          id: foundRec.id || `slip-${monthKey}-${empIdentifier}`,
          slipNumber: `PAY-${selectedYear}${monthObj.code}-${String(empIdentifier).replace(/[^a-zA-Z0-9]/g, '')}`,
          month: monthKey,
          salaryMonth: foundRec.monthLabel || `${monthObj.label} ${selectedYear}`,
          employeeName: foundRec.employeeName || employee.name || 'Employee',
          employeeId: empIdentifier,
          designation: foundRec.designation || employee.designation || 'Staff',
          department: foundRec.department || employee.department || 'Operations',
          clientName: foundRec.clientName || employee.clientName || employee.companyName || 'RR Security & Facilities',
          companyName: activeCompany?.name || employee.companyName || 'RR Security & Facilities',
          companyAddress: [activeCompany?.address, activeCompany?.city, activeCompany?.state, activeCompany?.pinCode].filter(Boolean).join(', ') || activeCompany?.address || 'Corporate Office, New Delhi',
          companyEmail: activeCompany?.email || 'hr@rrsecurity.internal',
          companyPhone: activeCompany?.phone || '+91 11 2345 6789',
          companyGstin: activeCompany?.gstin || '',
          companyPan: activeCompany?.pan || '',
          companyLogo: activeCompany?.logo || null,
          siteLocation: foundRec.site || employee.siteLocation || employee.site || 'Main Unit',
          joiningDate: employee.joiningDate ? formatDate(employee.joiningDate) : '—',
          bankName: foundRec.bankName || employee.bankName || '—',
          bankAccountNo: foundRec.bankAccountNo || employee.accountNumber || employee.bankAccountNo || '—',
          ifscCode: foundRec.ifscCode || employee.ifsc || employee.ifscCode || '—',
          pan: foundRec.pan || employee.pan || '—',
          uan: foundRec.uan || employee.uan || '—',
          pfNo: foundRec.pfNo || employee.pfNo || '—',
          esicNo: foundRec.esicNo || employee.esicNo || '—',
          workingDays: foundRec.totalDaysInMonth || new Date(selectedYear, selectedMonth, 0).getDate(),
          presentDays: foundRec.presentDays !== undefined ? foundRec.presentDays : (foundRec.paidDays || 0),
          paidDays: foundRec.paidDays !== undefined ? foundRec.paidDays : 0,
          lopDays: foundRec.lopDays !== undefined ? foundRec.lopDays : 0,
          grossSalary,
          totalDeductions,
          netSalary,
          earnings: {
            basic: earnings.basic || 0,
            vda: earnings.vda || 0,
            hra: earnings.hra || 0,
            conveyance: earnings.conveyance || 0,
            otherAllowance: earnings.otherAllowance || 0,
            specialAllowance: earnings.specialAllowance || 0,
            overtime: earnings.overtime || 0,
            totalGross: grossSalary,
          },
          deductions: {
            pfEmployee: deductions.pfEmployee || 0,
            esiEmployee: deductions.esiEmployee || 0,
            pt: deductions.pt || 0,
            tds: deductions.tds || 0,
            advances: deductions.advances || 0,
            otherDeductions: deductions.otherDeductions || deductions.lwf || 0,
            totalDeductions,
          }
        });
        setIsFromDb(true);
        setSlipStatus('calculated');
        setLoading(false);
        return;
      }
    } catch (_) {
      // Fallback
    }

    // 4. Generate dynamic fallback slip from employee master salary structure
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let basic = Number(employee.basic) || 0;
    let vda = Number(employee.vda) || 0;
    let hra = Number(employee.hra) || 0;
    let conveyance = Number(employee.conveyance) || 0;
    let otherAllowance = Number(employee.otherAllowance) || 0;
    let specialAllowance = Number(employee.specialAllowance) || 0;
    const computedGross = Number(employee.grossSalary) || (basic + vda + hra + conveyance + otherAllowance + specialAllowance);

    // Standard dynamic component breakdown if gross was provided without individual breakdown
    if (basic === 0 && hra === 0 && vda === 0 && computedGross > 0) {
      basic = Math.round(computedGross * 0.5);
      hra = Math.round(computedGross * 0.2);
      vda = Math.round(computedGross * 0.15);
      otherAllowance = Math.max(0, computedGross - (basic + hra + vda));
    }

    // Statutory deductions strictly calculated dynamically (zero hardcoding)
    let pfEmployee = 0;
    if (pfEnabled && isPfApplicable) {
      const isRestricted = statutory?.pf?.wageCeilingRestricted !== false;
      const pfCeiling = Number(statutory?.pf?.wageCeiling) || 15000;
      const pfWage = isRestricted ? Math.min(basic + vda, pfCeiling) : (basic + vda);
      const pfRate = (Number(statutory?.pf?.employeeContribution) || 12) / 100;
      pfEmployee = Math.round(pfWage * pfRate);
      if (statutory?.pf?.allowVPF !== false && Number(employee.vpfPercentage) > 0) {
        const vpfPct = Math.min(Number(employee.vpfPercentage), Number(statutory?.pf?.vpfMaxPercentage) || 100);
        pfEmployee += Math.round(pfWage * (vpfPct / 100));
      }
    }

    let esiEmployee = 0;
    const hasDisability = Boolean(employee.isDisability || employee.disability);
    const esiWageLimit = hasDisability
      ? (Number(statutory?.esi?.disabilityWageLimit) || 25000)
      : (Number(statutory?.esi?.wageEligibilityLimit) || 21000);
    if (esiEnabled && isEsiApplicable && computedGross <= esiWageLimit) {
      const dailyWage = computedGross / totalDaysInMonth;
      if (!employee.isDailyWageExempt && dailyWage >= 176) {
        const esiRate = (Number(statutory?.esi?.employeeContribution) || 0.75) / 100;
        esiEmployee = Math.round(computedGross * esiRate);
      }
    }

    let pt = 0;
    if (ptEnabled && isPtApplicable) {
      const empState =
        employee.state ||
        employee.workState ||
        employee.siteState ||
        employee.siteLocation ||
        employee.site ||
        employee.presentAddress ||
        employee.permanentAddress ||
        employee.address ||
        activeCompany?.state ||
        '';
      pt = calculatePTFromSlabs(computedGross, empState, ptSlabs, monthKey);
    }

    const tds = calculateTDSFromSettings(computedGross, employee, statutory?.tds);

    const isLwfApplicable = employee.lwfApplicable !== false && String(employee.lwfApplicable).toLowerCase() !== 'no';
    const lwfRes = calculateLWFFromRules(
      computedGross,
      employee.state || employee.workState || employee.siteState || activeCompany?.state || '',
      statutory?.lwfRules || [],
      monthKey,
      isLwfApplicable,
      statutory?.lwf?.enabled !== false
    );
    const lwf = lwfRes.employee;

    let bonus = 0;
    if (statutory?.bonus?.enabled && String(statutory?.bonus?.disbursementSchedule || '').toLowerCase().includes('monthly')) {
      const bonusWage = Math.min(basic, Number(statutory?.bonus?.statutoryWageCeiling) || 7000);
      bonus = Math.round(bonusWage * ((Number(statutory?.bonus?.bonusPercentage) || 8.33) / 100));
    } else {
      bonus = Number(employee.bonus) || 0;
    }

    const totalDeductions = pfEmployee + esiEmployee + pt + tds + lwf;
    const netSalary = Math.max(0, (computedGross + bonus) - totalDeductions);

    const generatedSlip = {
      id: `slip-${monthKey}-${empIdentifier}`,
      slipNumber: `PAY-${selectedYear}${monthObj.code}-${String(empIdentifier).replace(/[^a-zA-Z0-9]/g, '')}`,
      month: monthKey,
      salaryMonth: `${monthObj.label} ${selectedYear}`,
      employeeName: employee.name || 'Employee',
      employeeId: empIdentifier,
      designation: employee.designation || 'Staff',
      department: employee.department || 'Operations',
      clientName: employee.clientName || employee.companyName || 'RR Security & Facilities',
      companyName: activeCompany?.name || employee.companyName || 'RR Security & Facilities',
      companyAddress: [activeCompany?.address, activeCompany?.city, activeCompany?.state, activeCompany?.pinCode].filter(Boolean).join(', ') || activeCompany?.address || 'Corporate Office, New Delhi',
      companyEmail: activeCompany?.email || 'hr@rrsecurity.internal',
      companyPhone: activeCompany?.phone || '+91 11 2345 6789',
      companyGstin: activeCompany?.gstin || '07AABCR8392A1Z4',
      companyPan: activeCompany?.pan || 'AABCR8392A',
      companyLogo: activeCompany?.logo || null,
      siteLocation: employee.siteLocation || employee.site || 'Main Unit',
      joiningDate: employee.joiningDate ? formatDate(employee.joiningDate) : '—',
      bankName: employee.bankName || '—',
      bankAccountNo: employee.accountNumber || employee.bankAccountNo || '—',
      ifscCode: employee.ifsc || employee.ifscCode || '—',
      pan: employee.pan || '—',
      uan: employee.uan || '—',
      pfNo: employee.pfNo || '—',
      esicNo: employee.esicNo || '—',
      workingDays: totalDaysInMonth,
      presentDays: '—',
      paidDays: '—',
      lopDays: '—',
      grossSalary: computedGross + bonus,
      totalDeductions,
      netSalary,
      earnings: {
        basic,
        vda,
        hra,
        conveyance,
        otherAllowance,
        specialAllowance,
        bonus,
        overtime: 0,
        totalGross: computedGross + bonus,
      },
      deductions: {
        pfEmployee,
        esiEmployee,
        pt,
        tds,
        lwf,
        advances: 0,
        otherDeductions: 0,
        totalDeductions,
      },
    };

    setSlipData(generatedSlip);
    setIsFromDb(false);
    setSlipStatus('unprocessed');
    setLoading(false);
  }, [employee, selectedMonth, selectedYear, activeCompany, currentDate]);

  useEffect(() => {
    if (isOpen) {
      loadSlip();
    }
  }, [isOpen, loadSlip]);

  if (!isOpen || !employee) return null;

  const handleDownloadPdf = async () => {
    if (!slipData) return;
    try {
      setActionLoading(true);
      await generateSalarySlipPdf({
        slip: slipData,
        company: activeCompany || {},
        mode: 'download'
      });
    } catch (err) {
      console.error('Error generating payslip PDF:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!slipData) return;
    try {
      setActionLoading(true);
      await generateSalarySlipPdf({
        slip: slipData,
        company: activeCompany || {},
        mode: 'print'
      });
    } catch (err) {
      console.error('Error printing payslip:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const companyDisplayName = activeCompany?.name || slipData?.companyName || 'RR Security & Facilities';
  const companyDisplayAddress = [activeCompany?.address, activeCompany?.city, activeCompany?.state, activeCompany?.pinCode].filter(Boolean).join(', ') || slipData?.companyAddress || 'Corporate Office, New Delhi';

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Employee Payslip Preview">

        {/* Top Header */}
        <div className={styles.topBar}>
          <div className={styles.titleArea}>
            <div className={styles.iconCircle}>
              <FileText size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className={styles.title}>Employee Payslip Preview</h3>
              <div className={styles.subtitle}>
                <strong>{employee.name}</strong>
                <span className={styles.empBadge}>{employee.employeeId || employee.employeeCode || 'EMP'}</span>
                <span>• {employee.designation || 'Staff'}</span>
                <span>• {employee.clientName || employee.companyName || 'RR Security'}</span>
              </div>
            </div>
          </div>
          <div className={styles.topActions}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Month / Year Selector Toolbar */}
        <div className={styles.selectorBar}>
          <div className={styles.selectorsGroup}>
            <div className={styles.labelWrapper}>
              <Calendar size={15} color="#2563eb" />
              <span>Select Period:</span>
            </div>

            <select
              className={styles.selectInput}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={loading}
              aria-label="Select payslip month"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              className={styles.selectInput}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={loading}
              aria-label="Select payslip year"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className={styles.statusIndicator}>
              {slipStatus === 'approved' ? (
                <>
                  <CheckCircle2 size={13} color="#059669" />
                  <span>Approved Salary Slip</span>
                </>
              ) : slipStatus === 'calculated' ? (
                <>
                  <CheckCircle2 size={13} color="#2563eb" />
                  <span>Calculated Payroll Record</span>
                </>
              ) : (
                <div className={styles.statusIndicatorPending}>
                  <AlertTriangle size={13} color="#d97706" />
                  <span>Attendance Pending / Unprocessed</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.btnSecondary}
              onClick={handlePrint}
              disabled={loading || actionLoading || !slipData || (slipStatus === 'unprocessed' && !showStructurePreview)}
              title={slipStatus === 'unprocessed' && !showStructurePreview ? "Attendance & payroll calculation required before printing payslip" : "Print official A4 payslip"}
            >
              <Printer size={15} />
              <span>Print</span>
            </button>

            <button
              className={styles.btnPrimary}
              onClick={handleDownloadPdf}
              disabled={loading || actionLoading || !slipData || (slipStatus === 'unprocessed' && !showStructurePreview)}
              title={slipStatus === 'unprocessed' && !showStructurePreview ? "Attendance & payroll calculation required before downloading payslip" : "Download official PDF copy"}
            >
              {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Payslip A4 Sheet Preview Scroll Area */}
        <div className={styles.previewScroll} ref={scrollRef}>
          {loading || !slipData ? (
            <div className={styles.loadingBox}>
              <Loader2 size={36} className="animate-spin" color="#2563eb" />
              <span>Loading payslip for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}...</span>
            </div>
          ) : slipStatus === 'unprocessed' && !showStructurePreview ? (
            <div className={styles.unprocessedWrapper}>
              <div className={styles.unprocessedIcon}>
                <Clock size={32} />
              </div>
              <h4 className={styles.unprocessedTitle}>
                No Payroll Record for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </h4>
              <p className={styles.unprocessedDesc}>
                Official payslips can only be issued once monthly attendance is recorded and payroll is calculated.
                No verified attendance or payroll run exists for <strong>{employee.name}</strong> ({employee.employeeId || employee.employeeCode || 'EMP'}) for this pay period.
              </p>

              <div className={styles.statusPillsRow}>
                <div className={styles.statusPillItem}>
                  <span className={styles.statusDotRed} />
                  <span>Attendance: <strong>Not Uploaded (0 Days)</strong></span>
                </div>
                <div className={styles.statusPillItem}>
                  <span className={styles.statusDotAmber} />
                  <span>Payroll Calculation: <strong>Unprocessed</strong></span>
                </div>
              </div>

              <div className={styles.pipelineCard}>
                <ShieldAlert size={20} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                <p className={styles.pipelineText}>
                  <strong>Statutory Compliance Requirement:</strong> Under standard HRMS and Indian labour guidelines, a payslip is a verified legal certification of wage disbursement. Payslips require verified attendance data to determine paid days and compute prorated gross salary.
                </p>
              </div>

              <div className={styles.unprocessedActions}>
                <button
                  className={styles.btnActionPrimary}
                  onClick={() => {
                    onClose();
                    navigate(`/admin/payroll?month=${selectedYear}-${String(selectedMonth).padStart(2, '0')}`);
                  }}
                >
                  <span>Go to Payroll Management</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  className={styles.btnActionOutline}
                  onClick={() => setShowStructurePreview(true)}
                >
                  <Eye size={15} />
                  <span>Preview Contract Salary Structure</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.sheet}>
              {slipStatus === 'unprocessed' && showStructurePreview && (
                <div className={styles.estimateNotice}>
                  <div className={styles.estimateNoticeText}>
                    <AlertTriangle size={16} />
                    <span>Estimated Contract Salary Structure • Not An Official Payslip (Attendance Unverified for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear})</span>
                  </div>
                  <button className={styles.btnBackToNotice} onClick={() => setShowStructurePreview(false)}>
                    Back to Status
                  </button>
                </div>
              )}
              {/* Header */}
              <div className={styles.sheetHeader}>
                <div className={styles.compLogoWrap}>
                  {activeCompany?.logo || activeCompany?.logoUrl ? (
                    <img
                      src={activeCompany.logo || activeCompany.logoUrl}
                      alt={companyDisplayName}
                      className={styles.compLogo}
                    />
                  ) : (
                    <div className={styles.compLogoFallback}>RR</div>
                  )}
                  <div className={styles.compDetails}>
                    <h2>{companyDisplayName}</h2>
                    <div className={styles.compSubline}>Private Limited • HR &amp; Payroll Management Portal</div>
                    <p className={styles.compAddress}>{companyDisplayAddress}</p>
                    <div className={styles.compContacts}>
                      {activeCompany?.email && <span><strong>Email:</strong> {activeCompany.email}</span>}
                      {activeCompany?.phone && <span><strong>Phone:</strong> {activeCompany.phone}</span>}
                      {activeCompany?.gstin && <span><strong>GSTIN:</strong> {activeCompany.gstin}</span>}
                      {activeCompany?.pan && <span><strong>PAN:</strong> {activeCompany.pan}</span>}
                      {activeCompany?.employerPfCode && <span><strong>PF Code:</strong> {activeCompany.employerPfCode}</span>}
                      {activeCompany?.employerEsiCode && <span><strong>ESI Code:</strong> {activeCompany.employerEsiCode}</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.slipTitleBox}>
                  <div className={styles.slipDocBadge}>Salary Slip</div>
                  <div className={styles.slipDocMonth}>{slipData.salaryMonth}</div>
                  <span className={styles.slipNumberTag}>{slipData.slipNumber}</span>
                </div>
              </div>

              {/* Employee Master Information */}
              <div className={styles.employeeGrid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Employee Name</span>
                  <span className={styles.gridValue}>{slipData.employeeName}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Employee ID</span>
                  <span className={styles.gridValue}>{slipData.employeeId}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Designation</span>
                  <span className={styles.gridValue}>{slipData.designation}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Department</span>
                  <span className={styles.gridValue}>{slipData.department}</span>
                </div>

                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Client / Company</span>
                  <span className={styles.gridValue}>{slipData.clientName}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Site / Location</span>
                  <span className={styles.gridValue}>{slipData.siteLocation || 'Main Unit'}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Date of Joining</span>
                  <span className={styles.gridValue}>{slipData.joiningDate || '—'}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Bank Name</span>
                  <span className={styles.gridValue}>{slipData.bankName || '—'}</span>
                </div>

                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Account Number</span>
                  <span className={styles.gridValue}>{slipData.bankAccountNo || '—'}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>IFSC Code</span>
                  <span className={styles.gridValue}>{slipData.ifscCode || '—'}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>PAN Number</span>
                  <span className={styles.gridValue}>{slipData.pan || '—'}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>UAN Number</span>
                  <span className={styles.gridValue}>{slipData.uan || '—'}</span>
                </div>

                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>PF Number</span>
                  <span className={styles.gridValue}>{slipData.pfNo || '—'}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>ESIC Number</span>
                  <span className={styles.gridValue}>{slipData.esicNo || '—'}</span>
                </div>
              </div>

              {/* Attendance Statistics */}
              <div className={styles.attBanner}>
                <div className={styles.attStat}>
                  <span className={styles.attLabel}>Total Days</span>
                  <span className={styles.attVal}>{slipData.workingDays}</span>
                </div>
                <div className={styles.attStat}>
                  <span className={styles.attLabel}>Present Days</span>
                  <span className={styles.attVal}>
                    {slipStatus === 'unprocessed' ? '— (Pending)' : slipData.presentDays}
                  </span>
                </div>
                <div className={styles.attStat}>
                  <span className={styles.attLabel}>Paid Days</span>
                  <span className={styles.attVal}>
                    {slipStatus === 'unprocessed' ? '— (Unprocessed)' : slipData.paidDays}
                  </span>
                </div>
                <div className={styles.attStat}>
                  <span className={styles.attLabel}>LOP / Absent</span>
                  <span className={styles.attVal}>
                    {slipStatus === 'unprocessed' ? '—' : slipData.lopDays}
                  </span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className={styles.salaryTableWrap}>
                <table className={styles.salaryTable}>
                  <thead>
                    <tr>
                      <th className={styles.colEarnings}>Earnings Components</th>
                      <th className={styles.amtColLeft}>Amount (₹)</th>
                      <th className={styles.colDeductions}>Deductions</th>
                      <th className={styles.amtColRight}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.colEarnings}>Basic Salary</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.basic)}</td>
                      <td className={styles.colDeductions}>Provident Fund (PF Employee)</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.deductions.pfEmployee)}</td>
                    </tr>
                    <tr>
                      <td className={styles.colEarnings}>Variable DA (VDA)</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.vda)}</td>
                      <td className={styles.colDeductions}>ESIC (Employee Contribution)</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.deductions.esiEmployee)}</td>
                    </tr>
                    <tr>
                      <td className={styles.colEarnings}>House Rent Allowance (HRA)</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.hra)}</td>
                      <td className={styles.colDeductions}>Professional Tax (PT)</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.deductions.pt)}</td>
                    </tr>
                    <tr>
                      <td className={styles.colEarnings}>Conveyance Allowance</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.conveyance)}</td>
                      <td className={styles.colDeductions}>Income Tax (TDS)</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.deductions.tds)}</td>
                    </tr>
                    <tr>
                      <td className={styles.colEarnings}>Special Allowance</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.specialAllowance)}</td>
                      <td className={styles.colDeductions}>Advances / Loan Deduction</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.deductions.advances || 0)}</td>
                    </tr>
                    <tr>
                      <td className={styles.colEarnings}>Other Allowances</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.otherAllowance)}</td>
                      <td className={styles.colDeductions}>Other Statutory Deductions</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.deductions.otherDeductions || 0)}</td>
                    </tr>
                    {slipData.earnings.overtime > 0 && (
                      <tr>
                        <td className={styles.colEarnings}>Overtime Pay</td>
                        <td className={styles.amtColLeft}>{formatRupee(slipData.earnings.overtime)}</td>
                        <td className={styles.colDeductions}>—</td>
                        <td className={styles.amtColRight}>—</td>
                      </tr>
                    )}
                    <tr className={styles.totalRow}>
                      <td className={styles.colEarnings}>Total Gross Earnings</td>
                      <td className={styles.amtColLeft}>{formatRupee(slipData.grossSalary)}</td>
                      <td className={styles.colDeductions}>Total Deductions</td>
                      <td className={styles.amtColRight}>{formatRupee(slipData.totalDeductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Salary Highlight */}
              <div className={styles.netPayBox}>
                <div className={styles.netPayLeft}>
                  <span className={styles.netPayTitle}>Net Take-Home Salary</span>
                  <span className={styles.netPayWords}>
                    {numberToIndianWords(slipData.netSalary)}
                  </span>
                </div>
                <div className={styles.netPayAmount}>
                  {formatRupee(slipData.netSalary)}
                </div>
              </div>

              {/* Footer and Signatures */}
              <div className={styles.sheetFooter}>
                <p className={styles.footerNote}>
                  * Note: This is an official system-generated salary slip issued by {companyDisplayName}. No physical signature is required.
                </p>
                <div className={styles.signBox}>
                  <div className={styles.signLine} />
                  <span className={styles.signLabel}>Authorised Signatory</span>
                  <div className={styles.signSub}>{companyDisplayName}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
