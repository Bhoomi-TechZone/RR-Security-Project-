/**
 * Statutory Calculation Service
 * Dynamically computes PF, ESI, Professional Tax (PT), TDS, LWF, Bonus, and Gratuity
 * strictly according to the configured Statutory Setup from MongoDB Atlas.
 */

// Normalize ID strings for fuzzy matching
export const normalizeId = (id) => String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Helper to calculate Professional Tax strictly from active dynamic PT slabs in MongoDB
 */
export const calculatePT = (gross, state, ptSlabs = [], month = '', ptEnabled = true) => {
  if (ptEnabled === false || !state || !Array.isArray(ptSlabs) || ptSlabs.length === 0) return 0;
  const stateLower = String(state).trim().toLowerCase();
  const stateSlabs = ptSlabs.filter((s) => {
    if (s.status !== 'active') return false;
    const slabState = String(s.state || '').trim().toLowerCase();
    return slabState && (stateLower === slabState || stateLower.includes(slabState) || slabState.includes(stateLower));
  });
  if (stateSlabs.length === 0) return 0;

  const isFeb = month ? (String(month).includes('-02') || String(month).toLowerCase().includes('feb')) : false;

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

/**
 * Helper to calculate Labour Welfare Fund (LWF) strictly from active dynamic LWF rules in MongoDB
 */
export const calculateLWF = (gross, state, lwfRules = [], month = '', lwfApplicable = true, lwfEnabled = true) => {
  if (lwfEnabled === false || lwfApplicable === false || !state || !Array.isArray(lwfRules) || lwfRules.length === 0) {
    return { employee: 0, employer: 0 };
  }

  const stateLower = String(state).trim().toLowerCase();
  const activeRules = lwfRules.filter((r) => {
    if (r.status !== 'active') return false;
    const ruleState = String(r.state || '').trim().toLowerCase();
    return ruleState && (stateLower === ruleState || stateLower.includes(ruleState) || ruleState.includes(stateLower));
  });

  if (activeRules.length === 0) return { employee: 0, employer: 0 };

  // Parse month number (1 to 12) from "YYYY-MM"
  let monthNum = 0;
  if (month && month.includes('-')) {
    monthNum = Number(month.split('-')[1]) || 0;
  } else {
    monthNum = new Date().getMonth() + 1;
  }

  for (const rule of activeRules) {
    const freq = String(rule.frequency || 'Monthly').trim().toLowerCase();
    const dedMonths = String(rule.deductionMonths || 'Every Month').trim().toLowerCase();

    let appliesThisMonth = false;
    if (freq === 'monthly' || dedMonths.includes('every month')) {
      appliesThisMonth = true;
    } else if (freq.includes('half') || dedMonths.includes('june') || dedMonths.includes('december')) {
      // Half-Yearly: typically deducted in June (month 6) and December (month 12)
      appliesThisMonth = monthNum === 6 || monthNum === 12;
    } else if (freq.includes('yearly') || freq.includes('annual')) {
      // Annual: typically December or specific month
      if (dedMonths.includes('december') || !dedMonths) {
        appliesThisMonth = monthNum === 12;
      } else {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const targetIndex = monthNames.findIndex((m) => dedMonths.includes(m));
        appliesThisMonth = targetIndex !== -1 ? (monthNum === targetIndex + 1) : (monthNum === 12);
      }
    } else {
      appliesThisMonth = true;
    }

    if (appliesThisMonth) {
      return {
        employee: Number(rule.employeeContribution) || 0,
        employer: Number(rule.employerContribution) || 0,
      };
    }
  }

  return { employee: 0, employer: 0 };
};

/**
 * Helper to calculate TDS (Income Tax withholding) based on configured statutory TDS regime & slabs
 */
export const calculateTDS = (earnedGross, emp = {}, statutoryTds = {}) => {
  if (statutoryTds?.enabled === false) return 0;

  const isTdsApplicable = emp.tdsApplicable === true || String(emp.tdsApplicable).toLowerCase() === 'yes';
  if (!isTdsApplicable) return 0;

  // Direct manual override if configured on employee master
  if (emp.tdsAmount !== undefined && emp.tdsAmount !== null && Number(emp.tdsAmount) > 0) {
    return Number(emp.tdsAmount);
  }
  if (emp.tdsPercentage !== undefined && emp.tdsPercentage !== null && Number(emp.tdsPercentage) > 0) {
    return Math.round(earnedGross * (Number(emp.tdsPercentage) / 100));
  }

  const annualGross = earnedGross * 12;
  const threshold = Number(statutoryTds?.monthlyTDSThreshold) || 500000;
  if (annualGross <= threshold && threshold > 0) {
    return 0;
  }

  const regime = emp.taxRegime || statutoryTds?.defaultTaxRegime || 'New Regime';
  const isNewRegime = !String(regime).toLowerCase().includes('old');

  const standardDeduction = isNewRegime
    ? (Number(statutoryTds?.standardDeductionNewRegime) || 75000)
    : (Number(statutoryTds?.standardDeductionOldRegime) || 50000);

  const taxableAnnualIncome = Math.max(0, annualGross - standardDeduction);

  let annualTax = 0;

  if (isNewRegime) {
    // New Tax Regime (Section 115BAC - Budget 2024 revised slabs)
    // Rebate u/s 87A: If taxable income <= 7,00,000, tax is NIL
    if (taxableAnnualIncome <= 700000) {
      annualTax = 0;
    } else {
      // 0 - 300,000: Nil
      // 300,001 - 700,000: 5% (400,000 * 5% = 20,000)
      // 700,001 - 1,000,000: 10% (300,000 * 10% = 30,000)
      // 1,000,001 - 1,200,000: 15% (200,000 * 15% = 30,000)
      // 1,200,001 - 1,500,000: 20% (300,000 * 20% = 60,000)
      // Above 1,500,000: 30%
      let remaining = taxableAnnualIncome;
      if (remaining > 1500000) {
        annualTax += (remaining - 1500000) * 0.30;
        remaining = 1500000;
      }
      if (remaining > 1200000) {
        annualTax += (remaining - 1200000) * 0.20;
        remaining = 1200000;
      }
      if (remaining > 1000000) {
        annualTax += (remaining - 1000000) * 0.15;
        remaining = 1000000;
      }
      if (remaining > 700000) {
        annualTax += (remaining - 700000) * 0.10;
        remaining = 700000;
      }
      if (remaining > 300000) {
        annualTax += (remaining - 300000) * 0.05;
      }
    }
  } else {
    // Old Tax Regime
    // Rebate u/s 87A: If taxable income <= 5,00,000, tax is NIL
    if (taxableAnnualIncome <= 500000) {
      annualTax = 0;
    } else {
      let remaining = taxableAnnualIncome;
      if (remaining > 1000000) {
        annualTax += (remaining - 1000000) * 0.30;
        remaining = 1000000;
      }
      if (remaining > 500000) {
        annualTax += (remaining - 500000) * 0.20;
        remaining = 500000;
      }
      if (remaining > 250000) {
        annualTax += (remaining - 250000) * 0.05;
      }
    }
  }

  // Add 4% Health and Education Cess
  if (annualTax > 0) {
    annualTax = annualTax * 1.04;
  }

  return Math.max(0, Math.round(annualTax / 12));
};

/**
 * Helper to calculate PF strictly according to statutory PF settings
 */
export const calculatePF = (earnedBasic, earnedVda, emp = {}, statutoryPf = {}) => {
  if (statutoryPf?.enabled === false) {
    return { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  }

  const isPfApplicable = emp.pfApplicable === true || String(emp.pfApplicable).toLowerCase() === 'yes';
  if (!isPfApplicable) {
    return { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  }

  const qualifyingWage = Math.max(0, earnedBasic + earnedVda);
  const wageCeiling = Number(statutoryPf?.wageCeiling) || 15000;
  const isRestricted = statutoryPf?.wageCeilingRestricted !== false;

  const pfWage = isRestricted ? Math.min(qualifyingWage, wageCeiling) : qualifyingWage;
  const epsWage = Math.min(qualifyingWage, wageCeiling);

  // Employee contribution
  const empRate = (Number(statutoryPf?.employeeContribution) || 12) / 100;
  let pfEmployee = Math.round(pfWage * empRate);

  // Voluntary Provident Fund (VPF)
  const allowVPF = statutoryPf?.allowVPF !== false;
  const vpfPct = Number(emp.vpfPercentage) || 0;
  if (allowVPF && vpfPct > 0) {
    const maxVpfPct = Number(statutoryPf?.vpfMaxPercentage) || 100;
    const effectiveVpfPct = Math.min(vpfPct, maxVpfPct);
    const vpfAmt = Math.round(pfWage * (effectiveVpfPct / 100));
    pfEmployee += vpfAmt;
  }

  // Employer contribution breakdown
  const epsRate = (Number(statutoryPf?.epsContribution) || 8.33) / 100;
  const eps = Math.round(epsWage * epsRate);

  const employerRate = (Number(statutoryPf?.employerContribution) || 12) / 100;
  const pfEmployer = Math.round(pfWage * employerRate);
  const epfEmployer = Math.max(0, pfEmployer - eps);

  const edliRate = (Number(statutoryPf?.edliContribution) || 0.5) / 100;
  const edli = Math.round(epsWage * edliRate);

  const adminRate = (Number(statutoryPf?.adminCharges) || 0.5) / 100;
  const admin = Math.round(pfWage * adminRate);

  return {
    employee: pfEmployee,
    employer: pfEmployer,
    eps,
    epfEmployer,
    edli,
    admin,
  };
};

/**
 * Helper to calculate ESI strictly according to statutory ESI settings
 */
export const calculateESI = (earnedGross, monthlyGross, paidDays, emp = {}, statutoryEsi = {}) => {
  if (statutoryEsi?.enabled === false) {
    return { employee: 0, employer: 0 };
  }

  const isEsiApplicable = emp.esiApplicable === true || String(emp.esiApplicable).toLowerCase() === 'yes';
  if (!isEsiApplicable) {
    return { employee: 0, employer: 0 };
  }

  // Disability check for enhanced wage limit
  const hasDisability = Boolean(
    emp.isDisability === true ||
    emp.disability === true ||
    String(emp.disability).toLowerCase() === 'yes' ||
    String(emp.isDisability).toLowerCase() === 'yes'
  );

  const wageLimit = hasDisability
    ? (Number(statutoryEsi?.disabilityWageLimit) || 25000)
    : (Number(statutoryEsi?.wageEligibilityLimit) || 21000);

  // Check eligibility threshold against monthlyGross or earnedGross
  const checkGross = monthlyGross > 0 ? monthlyGross : earnedGross;
  if (checkGross > wageLimit) {
    return { employee: 0, employer: 0 };
  }

  // Daily wage exemption check: average daily wage < Rs 176 is exempt from employee share
  const dailyWage = paidDays > 0 ? (earnedGross / paidDays) : 0;
  const isDailyWageExempt = Boolean(emp.isDailyWageExempt === true || (paidDays > 0 && dailyWage < 176));

  const empRate = (Number(statutoryEsi?.employeeContribution) || 0.75) / 100;
  const employerRate = (Number(statutoryEsi?.employerContribution) || 3.25) / 100;

  const esiEmployee = isDailyWageExempt ? 0 : Math.round(earnedGross * empRate);
  const esiEmployer = Math.round(earnedGross * employerRate);

  return {
    employee: esiEmployee,
    employer: esiEmployer,
  };
};

/**
 * Helper to calculate Statutory Bonus if configured for monthly disbursement
 */
export const calculateBonus = (earnedBasic, paidDays, totalDaysInMonth, emp = {}, statutoryBonus = {}) => {
  if (statutoryBonus?.enabled === false) {
    return 0;
  }

  if (statutoryBonus?.enabled && String(statutoryBonus?.disbursementSchedule || '').toLowerCase().includes('monthly')) {
    const minDays = Number(statutoryBonus?.minimumServiceDays) || 30;
    // If attendance is present, check minimum days threshold (pro-rated if full month)
    if (paidDays > 0 && (paidDays >= minDays || paidDays >= Math.min(minDays, totalDaysInMonth))) {
      const ceiling = Number(statutoryBonus?.statutoryWageCeiling) || 7000;
      const bonusWage = Math.min(earnedBasic, ceiling);
      const bonusPct = (Number(statutoryBonus?.bonusPercentage) || 8.33) / 100;
      return Math.round(bonusWage * bonusPct);
    }
  }

  // Fallback to employee's master bonus if configured
  return Number(emp.bonus) || 0;
};

/**
 * Master Unified Calculation Engine for an Employee Record
 */
export const computeEmployeePayrollCalculations = ({
  emp,
  attendanceList = [],
  statutoryConfig = {},
  month = '',
  totalDaysInMonth = 30,
  overrides = {},
}) => {
  const normEmpId = normalizeId(emp.employeeId);
  const normCode = normalizeId(emp.employeeCode);
  const normMongoId = normalizeId(emp._id || emp.id);

  // Match attendance
  const empAtt = Array.isArray(attendanceList)
    ? attendanceList.filter((a) => {
        const aId = normalizeId(a.employeeId);
        return aId === normEmpId || aId === normCode || aId === normMongoId;
      })
    : [];

  const hasAttendance = overrides.hasAttendance !== undefined
    ? Boolean(overrides.hasAttendance)
    : (empAtt.length > 0 || (overrides.paidDays !== undefined && overrides.paidDays > 0));

  let presentDays = 0;
  let weekOffDays = 0;
  let holidayDays = 0;
  let paidLeaves = 0;
  let lopDays = 0;
  let overtimeHours = 0;

  if (empAtt.length > 0) {
    empAtt.forEach((a) => {
      if (a.present !== undefined) presentDays += Number(a.present) || 0;
      if (a.weekOff !== undefined) weekOffDays += Number(a.weekOff) || 0;
      if (a.holidays !== undefined) holidayDays += Number(a.holidays) || 0;
      if (a.cl !== undefined) paidLeaves += Number(a.cl) || 0;
      if (a.sl !== undefined) paidLeaves += Number(a.sl) || 0;
      if (a.el !== undefined) paidLeaves += Number(a.el) || 0;
      if (a.lwp !== undefined) lopDays += Number(a.lwp) || 0;
      if (a.overtimeHours !== undefined) overtimeHours += Number(a.overtimeHours) || 0;
    });
  }

  if (overrides.presentDays !== undefined) presentDays = Number(overrides.presentDays);
  if (overrides.overtimeHours !== undefined) overtimeHours = Number(overrides.overtimeHours);

  const totalPaidDays = hasAttendance
    ? (overrides.paidDays !== undefined
        ? Number(overrides.paidDays)
        : Math.min(totalDaysInMonth, presentDays + weekOffDays + holidayDays + paidLeaves))
    : 0;

  const calculatedLop = hasAttendance
    ? (overrides.lopDays !== undefined
        ? Number(overrides.lopDays)
        : Math.max(0, totalDaysInMonth - totalPaidDays))
    : totalDaysInMonth;

  // Salary components from Employee Master
  let basic = Number(emp.basic) || 0;
  let hra = Number(emp.hra) || 0;
  let vda = Number(emp.vda) || 0;
  let conveyance = Number(emp.conveyance) || 0;
  let specialAllowance = Number(emp.specialAllowance) || 0;
  let otherAllowance = Number(emp.otherAllowance) || 0;
  let monthlyGross = Number(emp.grossSalary) || (basic + hra + vda + conveyance + specialAllowance + otherAllowance);

  // If gross was supplied without individual component breakdown
  if (basic === 0 && hra === 0 && vda === 0 && monthlyGross > 0) {
    basic = Math.round(monthlyGross * 0.5);
    hra = Math.round(monthlyGross * 0.2);
    vda = Math.round(monthlyGross * 0.15);
    otherAllowance = Math.max(0, monthlyGross - (basic + hra + vda));
  }

  const overtimeRate = Number(emp.overtimeRate) || (totalDaysInMonth > 0 ? Math.round((monthlyGross / totalDaysInMonth / 8) * 1.5) : 0);
  const overtimePay = hasAttendance
    ? (overrides.overtimePay !== undefined ? Number(overrides.overtimePay) : Math.round(overtimeHours * overtimeRate))
    : 0;

  // Pro-rate earnings by paid days
  const ratio = (totalDaysInMonth > 0 && hasAttendance) ? totalPaidDays / totalDaysInMonth : 0;
  const earnedBasic = Math.round(basic * ratio);
  const earnedHra = Math.round(hra * ratio);
  const earnedVda = Math.round(vda * ratio);
  const earnedConv = Math.round(conveyance * ratio);
  const earnedSpAll = Math.round(specialAllowance * ratio);
  const earnedOther = Math.round(otherAllowance * ratio);

  // Bonus Calculation from Statutory Bonus Config (strictly respecting module active status)
  const earnedBonus = (hasAttendance && statutoryConfig?.bonus?.enabled !== false)
    ? calculateBonus(earnedBasic, totalPaidDays, totalDaysInMonth, emp, statutoryConfig?.bonus)
    : 0;

  const earnedArrears = hasAttendance ? (Number(overrides.arrears) || 0) : 0;
  const earnedGross = earnedBasic + earnedHra + earnedVda + earnedConv + earnedSpAll + earnedOther + earnedBonus + overtimePay + earnedArrears;

  // Statutory Deductions strictly computed respecting module active status
  let pfRes = { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  let esiRes = { employee: 0, employer: 0 };
  let pt = 0;
  let tds = 0;
  let lwfRes = { employee: 0, employer: 0 };

  if (hasAttendance && totalPaidDays > 0) {
    // 1. PF (only if module is active)
    if (statutoryConfig?.pf?.enabled !== false) {
      pfRes = calculatePF(earnedBasic, earnedVda, emp, statutoryConfig?.pf);
    }

    // 2. ESI (only if module is active)
    if (statutoryConfig?.esi?.enabled !== false) {
      esiRes = calculateESI(earnedGross, monthlyGross, totalPaidDays, emp, statutoryConfig?.esi);
    }

    // 3. PT (only if module is active)
    if (statutoryConfig?.pt?.enabled !== false) {
      const empState = emp.state || emp.workState || emp.siteState || emp.siteLocation || emp.site || emp.presentAddress || emp.address || '';
      pt = calculatePT(earnedGross, empState, statutoryConfig?.ptSlabs, month, true);
    }

    // 4. TDS (only if module is active)
    if (statutoryConfig?.tds?.enabled !== false) {
      tds = calculateTDS(earnedGross, emp, statutoryConfig?.tds);
    }

    // 5. LWF (only if module is active)
    if (statutoryConfig?.lwf?.enabled !== false) {
      const empState = emp.state || emp.workState || emp.siteState || emp.siteLocation || emp.site || emp.presentAddress || emp.address || '';
      const isLwfApplicable = emp.lwfApplicable !== false && String(emp.lwfApplicable).toLowerCase() !== 'no';
      lwfRes = calculateLWF(earnedGross, empState, statutoryConfig?.lwfRules, month, isLwfApplicable, true);
    }
  }

  // Explicit overrides if passed (e.g. from manual adjustments), strictly respecting module active status!
  const finalPfEmployee = statutoryConfig?.pf?.enabled === false ? 0 : (overrides.pfEmployee !== undefined ? Number(overrides.pfEmployee) : pfRes.employee);
  const finalPfEmployer = statutoryConfig?.pf?.enabled === false ? 0 : (overrides.pfEmployer !== undefined ? Number(overrides.pfEmployer) : pfRes.employer);
  const finalEsiEmployee = statutoryConfig?.esi?.enabled === false ? 0 : (overrides.esiEmployee !== undefined ? Number(overrides.esiEmployee) : esiRes.employee);
  const finalEsiEmployer = statutoryConfig?.esi?.enabled === false ? 0 : (overrides.esiEmployer !== undefined ? Number(overrides.esiEmployer) : esiRes.employer);
  const finalPt = statutoryConfig?.pt?.enabled === false ? 0 : (overrides.pt !== undefined ? Number(overrides.pt) : pt);
  const finalTds = statutoryConfig?.tds?.enabled === false ? 0 : (overrides.tds !== undefined ? Number(overrides.tds) : tds);
  const finalLwf = statutoryConfig?.lwf?.enabled === false ? 0 : (overrides.lwf !== undefined ? Number(overrides.lwf) : lwfRes.employee);
  const finalAdvances = Number(overrides.advances) || 0;
  const finalLoanEmi = Number(overrides.loanEmi) || 0;
  const finalOtherDed = Number(overrides.otherDeductions) || 0;

  const totalDeductions =
    finalPfEmployee +
    finalEsiEmployee +
    finalPt +
    finalTds +
    finalLwf +
    finalAdvances +
    finalLoanEmi +
    finalOtherDed;

  const netSalary = Math.max(0, earnedGross - totalDeductions);

  const initials =
    (emp.name || emp.employeeName || 'EM')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'EM';

  return {
    id: `pay-${emp.employeeId || emp._id}`,
    employeeId: emp.employeeId || emp.employeeCode,
    employeeName: emp.name || emp.employeeName,
    initials,
    designation: emp.designation || 'Staff',
    department: emp.department || 'Operations',
    clientId: emp.clientId || '',
    clientName: emp.clientName || emp.companyName || 'RR Security & Facilities',
    companyName: emp.companyName || 'RR Security & Facilities',
    site: emp.site || emp.siteLocation || 'Main Site',
    dutyPost: emp.dutyPost || '',
    joiningDate: emp.joiningDate || '',
    pan: emp.pan || '',
    uan: emp.uan || '',
    pfNo: emp.pfNo || '',
    esicNo: emp.esicNo || '',
    bankName: emp.bankName || '',
    bankAccountNo: emp.bankAccountNo || emp.accountNumber || emp.accountNo || '',
    ifscCode: emp.ifscCode || emp.ifsc || '',
    totalDaysInMonth,
    presentDays: hasAttendance ? presentDays : 0,
    paidDays: totalPaidDays,
    lopDays: calculatedLop,
    overtimeHours: hasAttendance ? overtimeHours : 0,
    overtimeRate,
    overtimePay: hasAttendance ? overtimePay : 0,
    hasAttendance,
    basicSalary: basic,
    basic,
    hra,
    vda,
    conveyance,
    transportAllowance: conveyance,
    otherAllowance,
    specialAllowance,
    grossSalary: monthlyGross,
    pf: finalPfEmployee,
    esi: finalEsiEmployee,
    otherDeduction: finalPt + finalTds + finalLwf + finalAdvances + finalLoanEmi + finalOtherDed,
    totalDeductions,
    netSalary,
    earnings: {
      basic: earnedBasic,
      vda: earnedVda,
      hra: earnedHra,
      conveyance: earnedConv,
      otherAllowance: earnedOther,
      specialAllowance: earnedSpAll,
      bonus: earnedBonus,
      overtime: overtimePay,
      arrears: earnedArrears,
      totalGross: earnedGross,
    },
    deductions: {
      pfEmployee: finalPfEmployee,
      pfEmployer: finalPfEmployer,
      esiEmployee: finalEsiEmployee,
      esiEmployer: finalEsiEmployer,
      pt: finalPt,
      tds: finalTds,
      lwf: finalLwf,
      advances: finalAdvances,
      loanEmi: finalLoanEmi,
      otherDeductions: finalOtherDed,
      totalDeductions,
    },
    status: hasAttendance ? 'Calculated' : 'Pending Attendance',
    remarks: hasAttendance ? '' : 'Attendance record not uploaded for this month',
  };
};
