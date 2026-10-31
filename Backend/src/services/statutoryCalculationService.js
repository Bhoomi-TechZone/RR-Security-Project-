/**
 * Statutory Calculation Service
 * Dynamically computes PF, ESI, Professional Tax (PT), TDS, LWF, Bonus, and Gratuity
 * strictly according to the configured Statutory Setup from MongoDB Atlas.
 */

// Normalize ID strings for fuzzy matching
export const normalizeId = (id) => String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Calculates the wage base from selected salary components.
 * Matches selectedComponentIds against salary components master list (if available)
 * as well as common component codes, short names, names, and keys.
 */
export const calculateComponentWageBase = ({
  selectedComponentIds = null,
  salaryComponentsMaster = null,
  earningsMap = {},
  defaultComponents = ['basic', 'vda'],
}) => {
  // If selectedComponentIds is explicitly null or undefined (not configured at all), use defaultComponents
  if (selectedComponentIds === null || selectedComponentIds === undefined) {
    return defaultComponents.reduce((sum, key) => sum + (Number(earningsMap[key]) || 0), 0);
  }

  // If selectedComponentIds is an array but empty, it means user selected ZERO components! Return 0.
  if (!Array.isArray(selectedComponentIds) || selectedComponentIds.length === 0) {
    return 0;
  }

  const selectedSet = new Set(selectedComponentIds.map((id) => String(id).trim().toLowerCase()));
  const normalizedSelected = selectedComponentIds.map((id) => normalizeId(id));

  const keyMatch = (val) => {
    const s = String(val || '').trim().toLowerCase();
    const sn = normalizeId(val);
    return selectedSet.has(s) || normalizedSelected.includes(sn);
  };

  let totalWage = 0;
  const processedKeys = new Set();

  // 1. If salaryComponentsMaster items are present, match them first:
  if (Array.isArray(salaryComponentsMaster) && salaryComponentsMaster.length > 0) {
    for (const comp of salaryComponentsMaster) {
      const id = String(comp.id || comp._id || '').toLowerCase();
      const code = String(comp.code || '').toLowerCase();
      const shortName = String(comp.shortName || '').toLowerCase();
      const name = String(comp.name || '').toLowerCase();
      const normId = normalizeId(comp.id || comp._id);
      const normCode = normalizeId(comp.code);
      const normShort = normalizeId(comp.shortName);
      const normName = normalizeId(comp.name);

      const isSelected =
        selectedSet.has(id) ||
        (code && selectedSet.has(code)) ||
        (shortName && selectedSet.has(shortName)) ||
        (name && selectedSet.has(name)) ||
        normalizedSelected.includes(normId) ||
        (normCode && normalizedSelected.includes(normCode)) ||
        (normShort && normalizedSelected.includes(normShort)) ||
        (normName && normalizedSelected.includes(normName));

      if (isSelected) {
        let earningKey = null;
        const combined = (name + ' ' + code + ' ' + shortName).toLowerCase();
        if (combined.includes('basic') || combined.includes('general') || code === 'gen' || code === 'basic') {
          earningKey = 'basic';
        } else if (combined.includes('dearness') || combined.includes('vda') || combined.includes('da') || code === 'da' || code === 'vda') {
          earningKey = 'vda';
        } else if (combined.includes('house rent') || combined.includes('hra') || code === 'hra') {
          earningKey = 'hra';
        } else if (combined.includes('conveyance') || combined.includes('transport') || combined.includes('ca') || code === 'ca') {
          earningKey = 'conveyance';
        } else if (combined.includes('special') || combined.includes('sa') || code === 'sa') {
          earningKey = 'specialAllowance';
        } else if (combined.includes('other') || combined.includes('oa') || code === 'oa') {
          earningKey = 'otherAllowance';
        } else if (combined.includes('bonus')) {
          earningKey = 'bonus';
        } else if (combined.includes('overtime') || combined.includes('ot')) {
          earningKey = 'overtime';
        } else if (combined.includes('arrear')) {
          earningKey = 'arrears';
        } else {
          earningKey = comp.code || comp.shortName || comp.name;
        }

        if (earningKey && !processedKeys.has(earningKey)) {
          processedKeys.add(earningKey);
          totalWage += (Number(earningsMap[earningKey]) || 0);
        }
      }
    }
  }

  // 2. Also check standard keys directly in case selectedComponentIds stored standard codes or names directly
  const standardKeyChecks = [
    { key: 'basic', aliases: ['basic', 'general', 'basicsalary', 'basic salary', 'gen', 'bs'] },
    { key: 'vda', aliases: ['vda', 'da', 'dearness', 'dearnessallowance', 'dearness allowance'] },
    { key: 'hra', aliases: ['hra', 'houserent', 'house rent', 'houserentallowance', 'house rent allowance'] },
    { key: 'conveyance', aliases: ['conveyance', 'ca', 'conveyanceallowance', 'conveyance allowance', 'transport', 'transportallowance'] },
    { key: 'specialAllowance', aliases: ['specialallowance', 'special allowance', 'special', 'sa'] },
    { key: 'otherAllowance', aliases: ['otherallowance', 'other allowance', 'other', 'oa'] },
    { key: 'bonus', aliases: ['bonus', 'statutorybonus'] },
    { key: 'overtime', aliases: ['overtime', 'ot'] },
    { key: 'arrears', aliases: ['arrears', 'arrear'] },
  ];

  for (const item of standardKeyChecks) {
    if (!processedKeys.has(item.key)) {
      const isMatched = item.aliases.some((alias) => keyMatch(alias));
      if (isMatched) {
        processedKeys.add(item.key);
        totalWage += (Number(earningsMap[item.key]) || 0);
      }
    }
  }

  // 3. Check any additional custom keys in earningsMap that might match
  for (const [k, val] of Object.entries(earningsMap)) {
    if (!processedKeys.has(k) && keyMatch(k)) {
      processedKeys.add(k);
      totalWage += (Number(val) || 0);
    }
  }

  return Math.max(0, totalWage);
};

/**
 * Helper to compute the dynamic PT calculation wage base based on selected components and calculateOn setting
 */
export const computePTWageBase = ({
  emp = {},
  statutoryPt = {},
  monthlyGross = 0,
  earnedGross = 0,
  monthlyEarnings = {},
  earnedEarnings = {},
  salaryComponentsMaster = null,
}) => {
  if (statutoryPt?.enabled === false) return 0;

  const calculateOn = statutoryPt?.calculateOn || 'Gross Salary';
  const isEarned = calculateOn === 'Earned Salary';
  const defaultBase = isEarned ? earnedGross : monthlyGross;

  if (!Array.isArray(statutoryPt?.selectedComponentIds)) {
    return defaultBase;
  }

  if (statutoryPt.selectedComponentIds.length === 0) {
    return 0;
  }

  const targetMap = isEarned
    ? {
        basic: earnedEarnings.basic !== undefined ? earnedEarnings.basic : (Number(emp.basic) || 0),
        vda: earnedEarnings.vda !== undefined ? earnedEarnings.vda : (Number(emp.vda) || 0),
        hra: earnedEarnings.hra !== undefined ? earnedEarnings.hra : (Number(emp.hra) || 0),
        conveyance: earnedEarnings.conveyance !== undefined ? earnedEarnings.conveyance : (Number(emp.conveyance) || 0),
        specialAllowance: earnedEarnings.specialAllowance !== undefined ? earnedEarnings.specialAllowance : (Number(emp.specialAllowance) || 0),
        otherAllowance: earnedEarnings.otherAllowance !== undefined ? earnedEarnings.otherAllowance : (Number(emp.otherAllowance) || 0),
        bonus: earnedEarnings.bonus !== undefined ? earnedEarnings.bonus : (Number(emp.bonus) || 0),
        ...(earnedEarnings || {}),
      }
    : {
        basic: Number(emp.basic) || 0,
        vda: Number(emp.vda) || 0,
        hra: Number(emp.hra) || 0,
        conveyance: Number(emp.conveyance) || 0,
        specialAllowance: Number(emp.specialAllowance) || 0,
        otherAllowance: Number(emp.otherAllowance) || 0,
        bonus: Number(emp.bonus) || 0,
        ...(monthlyEarnings || {}),
      };

  return calculateComponentWageBase({
    selectedComponentIds: statutoryPt.selectedComponentIds,
    salaryComponentsMaster: (Array.isArray(salaryComponentsMaster) && salaryComponentsMaster.length > 0 ? salaryComponentsMaster : statutoryPt?.salaryComponents) || [],
    earningsMap: targetMap,
    defaultComponents: ['basic', 'vda', 'hra', 'conveyance', 'specialAllowance', 'otherAllowance'],
  });
};

/**
 * Helper to calculate Professional Tax strictly from active dynamic PT slabs in MongoDB
 */
export const calculatePT = (gross, state, ptSlabs = [], month = '', ptEnabled = true, gender = '') => {
  if (ptEnabled === false || !state || !Array.isArray(ptSlabs) || ptSlabs.length === 0 || Number(gross) <= 0) return 0;
  const stateLower = String(state).trim().toLowerCase();
  let stateSlabs = ptSlabs.filter((s) => {
    if (s.status === 'inactive') return false;
    const slabState = String(s.state || '').trim().toLowerCase();
    return slabState && (stateLower === slabState || stateLower.includes(slabState) || slabState.includes(stateLower));
  });
  if (stateSlabs.length === 0) return 0;

  // Month override logic (rates for specific month override rates for 'All Months')
  let targetMonth = '';
  if (month) {
    try {
      const d = new Date(month);
      if (!isNaN(d.getTime())) {
        targetMonth = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
      }
    } catch (e) { }
  }
  if (targetMonth) {
    const monthMatched = stateSlabs.filter((s) => s.month && !s.month.toLowerCase().includes('all') && s.month.toLowerCase().startsWith(targetMonth.slice(0, 3)));
    if (monthMatched.length > 0) stateSlabs = monthMatched;
  }

  // Gender override logic (rates for specific gender override rates for 'All Genders')
  const genderLower = String(gender || '').trim().toLowerCase();
  if (genderLower) {
    const genderMatched = stateSlabs.filter((s) => s.gender && !s.gender.toLowerCase().includes('all') && s.gender.toLowerCase() === genderLower);
    if (genderMatched.length > 0) stateSlabs = genderMatched;
  }

  const isFeb = month ? (String(month).includes('-02') || String(month).toLowerCase().includes('feb')) : false;

  for (const slab of stateSlabs) {
    const min = Number(slab.salaryAbove !== undefined && slab.salaryAbove !== '' ? slab.salaryAbove : (slab.minSalary || 0));
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
export const calculatePF = (earnedBasic, earnedVda, emp = {}, statutoryPf = {}, earningsMap = {}, salaryComponentsMaster = null) => {
  if (statutoryPf?.enabled === false) {
    return { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  }

  const isPfApplicable = emp.pfApplicable === true || String(emp.pfApplicable).toLowerCase() === 'yes';
  if (!isPfApplicable) {
    return { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  }

  // Check if an active dynamic rate change is configured in statutoryPf
  let activeRate = null;
  if (Array.isArray(statutoryPf?.pfRates) && statutoryPf.pfRates.length > 0) {
    activeRate = statutoryPf.pfRates.find((r) => r.enabled);
  }

  let qualifyingWage = 0;
  if (Array.isArray(statutoryPf?.selectedComponentIds)) {
    if (statutoryPf.selectedComponentIds.length === 0) {
      qualifyingWage = 0;
    } else {
      const fullMap = {
        basic: earnedBasic,
        vda: earnedVda,
        ...(earningsMap || {}),
      };
      qualifyingWage = calculateComponentWageBase({
        selectedComponentIds: statutoryPf.selectedComponentIds,
        salaryComponentsMaster: (Array.isArray(salaryComponentsMaster) && salaryComponentsMaster.length > 0 ? salaryComponentsMaster : statutoryPf?.salaryComponents) || [],
        earningsMap: fullMap,
        defaultComponents: ['basic', 'vda'],
      });
    }
  } else {
    qualifyingWage = Math.max(0, (Number(earnedBasic) || 0) + (Number(earnedVda) || 0));
  }

  if (qualifyingWage <= 0) {
    return { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  }

  const wageCeiling = activeRate?.wageCeiling !== undefined ? Number(activeRate.wageCeiling) : (Number(statutoryPf?.wageCeiling) || 15000);
  const isRestricted = statutoryPf?.wageCeilingRestricted !== false;

  const pfWage = isRestricted ? Math.min(qualifyingWage, wageCeiling) : qualifyingWage;
  const epsWage = Math.min(qualifyingWage, wageCeiling);

  // Employee contribution (dynamic rate)
  const empRate = (activeRate?.employeeRate !== undefined ? Number(activeRate.employeeRate) : (Number(statutoryPf?.employeeContribution) || 12)) / 100;
  let pfEmployee = Math.round(pfWage * empRate);

  // Voluntary Provident Fund (VPF)
  const allowVPF = statutoryPf?.vpfEnabled !== undefined ? Boolean(statutoryPf.vpfEnabled) : (statutoryPf?.allowVPF !== false);
  const vpfPct = Number(emp.vpfPercentage) || 0;
  if (allowVPF && vpfPct > 0) {
    const maxVpfPct = Number(statutoryPf?.vpfMaxPercentage) || 100;
    const effectiveVpfPct = Math.min(vpfPct, maxVpfPct);
    const vpfAmt = Math.round(pfWage * (effectiveVpfPct / 100));
    pfEmployee += vpfAmt;
  }

  // Employer contribution breakdown (dynamic rates)
  const epsRate = (activeRate?.pensionRate !== undefined ? Number(activeRate.pensionRate) : (Number(statutoryPf?.epsContribution) || 8.33)) / 100;
  const eps = Math.round(epsWage * epsRate);

  const employerRate = activeRate?.employerRate !== undefined
    ? ((Number(activeRate.employerRate) + Number(activeRate.pensionRate || 0)) / 100)
    : ((Number(statutoryPf?.employerContribution) || 12) / 100);
  const pfEmployer = Math.round(pfWage * employerRate);
  const epfEmployer = Math.max(0, pfEmployer - eps);

  const edliRate = (activeRate?.edliAdminRate !== undefined ? Number(activeRate.edliAdminRate) / 2 : (Number(statutoryPf?.edliContribution) || 0.5)) / 100;
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
export const calculateESI = (earnedGross, monthlyGross, paidDays, emp = {}, statutoryEsi = {}, earningsMap = {}, salaryComponentsMaster = []) => {
  if (statutoryEsi?.enabled === false) {
    return { employee: 0, employer: 0 };
  }

  const isEsiApplicable = emp.esiApplicable === true || String(emp.esiApplicable).toLowerCase() === 'yes';
  if (!isEsiApplicable) {
    return { employee: 0, employer: 0 };
  }

  // Check if an active dynamic rate change is configured in statutoryEsi
  let activeRate = null;
  if (Array.isArray(statutoryEsi?.esiRates) && statutoryEsi.esiRates.length > 0) {
    activeRate = statutoryEsi.esiRates.find((r) => r.enabled);
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
    : (activeRate?.eligibilityWageCeiling !== undefined
      ? Number(activeRate.eligibilityWageCeiling)
      : (Number(statutoryEsi?.wageEligibilityLimit) || 21000));

  // Check eligibility threshold against monthlyGross or earnedGross
  const checkGross = monthlyGross > 0 ? monthlyGross : earnedGross;
  if (checkGross > wageLimit) {
    return { employee: 0, employer: 0 };
  }

  // Determine ESI calculation wage base strictly from selectedComponentIds
  let esiWage = 0;
  if (Array.isArray(statutoryEsi?.selectedComponentIds)) {
    if (statutoryEsi.selectedComponentIds.length === 0) {
      esiWage = 0;
    } else {
      const fullMap = {
        basic: Number(emp.basic) || 0,
        vda: Number(emp.vda) || 0,
        hra: Number(emp.hra) || 0,
        conveyance: Number(emp.conveyance) || 0,
        specialAllowance: Number(emp.specialAllowance) || 0,
        otherAllowance: Number(emp.otherAllowance) || 0,
        bonus: Number(emp.bonus) || 0,
        ...(earningsMap || {}),
      };
      esiWage = calculateComponentWageBase({
        selectedComponentIds: statutoryEsi.selectedComponentIds,
        salaryComponentsMaster: (Array.isArray(salaryComponentsMaster) && salaryComponentsMaster.length > 0 ? salaryComponentsMaster : statutoryEsi?.salaryComponents) || [],
        earningsMap: fullMap,
        defaultComponents: ['basic', 'vda', 'hra', 'conveyance', 'specialAllowance', 'otherAllowance'],
      });
    }
  } else {
    esiWage = earnedGross;
  }

  if (esiWage <= 0) {
    return { employee: 0, employer: 0 };
  }

  // Daily wage exemption check: average daily wage < Rs 176 is exempt from employee share
  const dailyWage = paidDays > 0 ? (esiWage / paidDays) : 0;
  const isDailyWageExempt = Boolean(emp.isDailyWageExempt === true || (paidDays > 0 && dailyWage < 176));

  const empRate = (activeRate?.employeeContribution !== undefined
    ? Number(activeRate.employeeContribution)
    : (Number(statutoryEsi?.employeeContribution) || 0.75)) / 100;

  const employerRate = (activeRate?.employerContribution !== undefined
    ? Number(activeRate.employerContribution)
    : (Number(statutoryEsi?.employerContribution) || 3.25)) / 100;

  const esiEmployee = isDailyWageExempt ? 0 : Math.round(esiWage * empRate);
  const esiEmployer = Math.round(esiWage * employerRate);

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
  salaryComponentsMaster = null,
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

  const masterComponents = (Array.isArray(salaryComponentsMaster) && salaryComponentsMaster.length > 0
    ? salaryComponentsMaster
    : statutoryConfig?.salaryComponents) || [];

  // Active earnings components configured for this company in Masters
  const activeEarnings = masterComponents.filter(
    (c) =>
      (c.type === 'earning' || c.type_kind === 'earning' || (c.type === 'salary-components' && c.type_kind !== 'deduction')) &&
      c.status !== 'inactive' &&
      c.status !== 'Inactive'
  );

  // Active deductions components configured for this company in Masters
  const activeDeductions = masterComponents.filter(
    (c) =>
      (c.type === 'deduction' || c.type_kind === 'deduction' || (c.type === 'salary-components' && c.type_kind === 'deduction')) &&
      c.status !== 'inactive' &&
      c.status !== 'Inactive'
  );

  const matchesComponent = (c, canonicalKey, aliases = []) => {
    const rawName = String(c.name || '').toLowerCase();
    const nameNorm = rawName.replace(/[^a-z0-9]/g, '');
    const code = String(c.code || '').trim().toLowerCase();
    const short = String(c.shortName || '').trim().toLowerCase();

    const all = [canonicalKey, ...aliases];
    return all.some((item) => {
      const a = item.toLowerCase().trim();
      const aNorm = a.replace(/[^a-z0-9]/g, '');
      // For short codes (<= 2 chars like da, sa, ca, oa), require exact match on code/shortName or word boundary in name
      if (a.length <= 2) {
        return code === a || short === a || new RegExp(`\\b${a}\\b`, 'i').test(rawName);
      }
      return code === a || short === a || nameNorm.includes(aNorm) || rawName.includes(a);
    });
  };

  const hasActiveComponent = (canonicalKey, aliases = []) => {
    if (activeEarnings.length === 0) return true;
    return activeEarnings.some((c) => matchesComponent(c, canonicalKey, aliases));
  };

  const getComponentType = (canonicalKey, aliases = [], defaultType = 'Paid Days') => {
    const found = activeEarnings.find((c) => matchesComponent(c, canonicalKey, aliases));
    return found?.componentType || defaultType;
  };

  // Salary components strictly computed as per active Salary Components in Masters
  const basicActive = hasActiveComponent('basic', ['basicsalary', 'basic salary', 'general', 'gen', 'bs']);
  const vdaActive = hasActiveComponent('vda', ['da', 'dearness', 'dearnessallowance', 'dearness allowance']);
  const hraActive = hasActiveComponent('hra', ['houserent', 'house rent', 'houserentallowance', 'house rent allowance']);
  const convActive = hasActiveComponent('conveyance', ['ca', 'transport', 'conveyanceallowance', 'conveyance allowance']);
  const spAllActive = hasActiveComponent('specialAllowance', ['special', 'specialallowance', 'special allowance', 'sa']);
  const otherActive = hasActiveComponent('otherAllowance', ['other', 'otherallowance', 'other allowance', 'oa']);

  let basic = basicActive ? (Number(emp.basic) || 0) : 0;
  let vda = vdaActive ? (Number(emp.vda) || 0) : 0;
  let hra = hraActive ? (Number(emp.hra) || 0) : 0;
  let conveyance = convActive ? (Number(emp.conveyance) || 0) : 0;
  let specialAllowance = spAllActive ? (Number(emp.specialAllowance) || 0) : 0;
  let otherAllowance = otherActive ? (Number(emp.otherAllowance) || 0) : 0;

  // Custom earnings from activeEarnings:
  const customEarningsMonthly = {};
  const customEarningsEarned = {};
  let customMonthlySum = 0;
  let customEarnedSum = 0;

  const standardAliases = ['basic', 'basicsalary', 'general', 'gen', 'bs', 'vda', 'da', 'dearness', 'dearnessallowance', 'hra', 'houserent', 'houserentallowance', 'conveyance', 'ca', 'transport', 'special', 'specialallowance', 'sa', 'other', 'otherallowance', 'oa', 'bonus'];

  if (activeEarnings.length > 0) {
    for (const c of activeEarnings) {
      const cCode = String(c.code || c.shortName || '').trim();
      const normCode = cCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normName = String(c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const isStandard = standardAliases.some((a) => normCode === a || normName.includes(a));

      if (!isStandard && cCode) {
        const empVal = Number(emp[cCode] || emp[c.shortName] || emp[c.name] || emp.salaryStructure?.[cCode] || emp.components?.[cCode] || c.fixedAmount || c.amount) || 0;
        if (empVal > 0) {
          customEarningsMonthly[cCode] = empVal;
          customMonthlySum += empVal;

          const cType = String(c.componentType || 'Paid Days').toLowerCase();
          let earnedVal = 0;
          if (cType.includes('fixed')) {
            earnedVal = (hasAttendance && totalPaidDays > 0) ? empVal : 0;
          } else if (cType.includes('variable')) {
            earnedVal = hasAttendance ? empVal : 0;
          } else {
            earnedVal = (totalDaysInMonth > 0 && hasAttendance) ? Math.round(empVal * (totalPaidDays / totalDaysInMonth)) : 0;
          }
          customEarningsEarned[cCode] = earnedVal;
          customEarnedSum += earnedVal;
        }
      }
    }
  }

  // Monthly Gross: strictly sum active earnings components
  let monthlyGross = basic + vda + hra + conveyance + specialAllowance + otherAllowance + customMonthlySum;

  if (monthlyGross === 0 && Number(emp.grossSalary) > 0) {
    const rawGross = Number(emp.grossSalary);
    if (basicActive && vdaActive) {
      basic = Math.round(rawGross * 0.7);
      vda = Math.round(rawGross * 0.3);
    } else if (basicActive) {
      basic = rawGross;
    } else if (vdaActive) {
      vda = rawGross;
    } else {
      basic = rawGross;
    }
    monthlyGross = basic + vda + hra + conveyance + specialAllowance + otherAllowance + customMonthlySum;
  }

  const overtimeRate = Number(emp.overtimeRate) || (totalDaysInMonth > 0 ? Math.round((monthlyGross / totalDaysInMonth / 8) * 1.5) : 0);
  const overtimePay = hasAttendance
    ? (overrides.overtimePay !== undefined ? Number(overrides.overtimePay) : Math.round(overtimeHours * overtimeRate))
    : 0;

  // Pro-rate earnings by paid days and calculationType
  const ratio = (totalDaysInMonth > 0 && hasAttendance) ? totalPaidDays / totalDaysInMonth : 0;

  const prorate = (amt, cType) => {
    if (amt <= 0) return 0;
    const lower = String(cType || 'Paid Days').toLowerCase();
    if (lower.includes('fixed')) {
      return (hasAttendance && totalPaidDays > 0) ? amt : 0;
    }
    if (lower.includes('variable')) {
      return hasAttendance ? amt : 0;
    }
    return Math.round(amt * ratio);
  };

  const earnedBasic = prorate(basic, getComponentType('basic', ['basicsalary', 'general']));
  const earnedVda = prorate(vda, getComponentType('vda', ['da', 'dearness']));
  const earnedHra = prorate(hra, getComponentType('hra', ['houserent']));
  const earnedConv = prorate(conveyance, getComponentType('conveyance', ['ca', 'transport']));
  const earnedSpAll = prorate(specialAllowance, getComponentType('specialAllowance', ['special', 'sa']));
  const earnedOther = prorate(otherAllowance, getComponentType('otherAllowance', ['other', 'oa']));

  // Bonus Calculation from Statutory Bonus Config (strictly respecting module active status)
  const earnedBonus = (hasAttendance && statutoryConfig?.bonus?.enabled !== false && hasActiveComponent('bonus', ['statutorybonus', 'bonus']))
    ? calculateBonus(earnedBasic, totalPaidDays, totalDaysInMonth, emp, statutoryConfig?.bonus)
    : 0;

  const earnedArrears = hasAttendance ? (Number(overrides.arrears) || 0) : 0;
  const earnedGross = earnedBasic + earnedHra + earnedVda + earnedConv + earnedSpAll + earnedOther + customEarnedSum + earnedBonus + overtimePay + earnedArrears;

  const monthlyEarningsMap = {
    basic,
    vda,
    hra,
    conveyance,
    specialAllowance,
    otherAllowance,
    bonus: Number(emp.bonus) || 0,
    grossSalary: monthlyGross,
    ...customEarningsMonthly,
    ...(emp.salaryStructure || {}),
    ...(emp.components || {})
  };

  const earnedEarningsMap = {
    basic: earnedBasic,
    vda: earnedVda,
    hra: earnedHra,
    conveyance: earnedConv,
    specialAllowance: earnedSpAll,
    otherAllowance: earnedOther,
    bonus: earnedBonus,
    overtime: overtimePay,
    arrears: earnedArrears,
    grossSalary: earnedGross,
    ...customEarningsEarned,
    ...(emp.salaryStructure || {}),
    ...(emp.components || {})
  };

  // Statutory Deductions strictly computed respecting module active status
  let pfRes = { employee: 0, employer: 0, eps: 0, epfEmployer: 0, edli: 0, admin: 0 };
  let esiRes = { employee: 0, employer: 0 };
  let pt = 0;
  let tds = 0;
  let lwfRes = { employee: 0, employer: 0 };

  if (hasAttendance && totalPaidDays > 0) {
    // 1. PF (only if module is active)
    if (statutoryConfig?.pf?.enabled !== false) {
      pfRes = calculatePF(earnedBasic, earnedVda, emp, statutoryConfig?.pf, earnedEarningsMap, masterComponents);
    }

    // 2. ESI (only if module is active)
    if (statutoryConfig?.esi?.enabled !== false) {
      esiRes = calculateESI(earnedGross, monthlyGross, totalPaidDays, emp, statutoryConfig?.esi, earnedEarningsMap, masterComponents);
    }

    // 3. PT (only if module is active)
    if (statutoryConfig?.pt?.enabled !== false) {
      const empState = emp.state || emp.workState || emp.siteState || emp.siteLocation || emp.site || emp.presentAddress || emp.address || '';
      const ptGross = computePTWageBase({
        emp,
        statutoryPt: statutoryConfig?.pt,
        monthlyGross,
        earnedGross,
        monthlyEarnings: monthlyEarningsMap,
        earnedEarnings: earnedEarningsMap,
        salaryComponentsMaster: masterComponents,
      });
      pt = calculatePT(ptGross, empState, statutoryConfig?.ptSlabs, month, true, emp.gender);
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

  // Deductions from Masters (activeDeductions)
  let customDeductionsTotal = 0;
  const customDeductionsMap = {};

  const statutoryDeductionAliases = ['pf', 'providentfund', 'provident fund', 'epf', 'esi', 'esic', 'pt', 'professionaltax', 'professional tax', 'tds', 'incometax', 'income tax', 'lwf', 'labourwelfarefund', 'labour welfare fund'];

  if (activeDeductions.length > 0) {
    for (const d of activeDeductions) {
      const dCode = String(d.code || d.shortName || '').trim();
      const normDCode = dCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normDName = String(d.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const isStatutory = statutoryDeductionAliases.some((a) => normDCode === a || normDName === a || normDName.includes(a));

      if (!isStatutory && dCode) {
        let dedVal = Number(
          overrides[dCode] ||
          overrides[d.name] ||
          overrides.deductions?.[dCode] ||
          emp[dCode] ||
          emp[d.shortName] ||
          emp[d.name] ||
          emp.salaryStructure?.[dCode] ||
          emp.deductions?.[dCode] ||
          d.fixedAmount ||
          d.amount ||
          0
        );

        if (d.deductionType === 'Percent Based' && Number(d.percentage) > 0) {
          dedVal = Math.round(earnedGross * (Number(d.percentage) / 100));
        } else if (d.deductionType === 'Attendance Based' && dedVal > 0) {
          dedVal = Math.round(dedVal * ratio);
        }

        if (dedVal > 0) {
          customDeductionsMap[dCode] = dedVal;
          customDeductionsTotal += dedVal;
        }
      }
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
    finalOtherDed +
    customDeductionsTotal;

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
      ...customEarningsEarned,
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
      otherDeductions: finalOtherDed + customDeductionsTotal,
      ...customDeductionsMap,
      totalDeductions,
    },
    status: hasAttendance ? 'Calculated' : 'Pending Attendance',
    remarks: hasAttendance ? '' : 'Attendance record not uploaded for this month',
  };
};
