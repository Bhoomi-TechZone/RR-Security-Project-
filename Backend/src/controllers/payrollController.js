import mongoose from 'mongoose';
import { PayrollRun, SalarySlip, RateRevision, Arrear } from '../models/payrollModel.js';
import Employee from '../models/employeeModel.js';
import Company from '../models/companyModel.js';
import Attendance from '../models/attendanceModel.js';
import StatutoryConfig from '../models/statutoryModel.js';
import { resolveStatutoryConfig } from './statutoryController.js';
import {
  calculatePT,
  calculateLWF,
  calculateTDS,
  calculatePF,
  calculateESI,
  calculateBonus,
  computeEmployeePayrollCalculations,
  normalizeId,
  calculateComponentWageBase,
  computePTWageBase,
} from '../services/statutoryCalculationService.js';

export {
  calculatePT,
  calculateLWF,
  calculateTDS,
  calculatePF,
  calculateESI,
  calculateBonus,
  computeEmployeePayrollCalculations,
  normalizeId,
  calculateComponentWageBase,
  computePTWageBase,
};

// Helper to get total days in a month string "YYYY-MM"
const getDaysInMonthString = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return 30;
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

// Helper to format month name
const getMonthLabel = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Sequentially assign company-configured PF and ESI codes:
 * Format: <EMPLOYER_CODE>/<SEQUENCE> (e.g. 34934934939493/001, 9239292929292/001)
 * Increments strictly only for employees who have PF / ESI applicable.
 * If not applicable, marks as 'N/A'.
 */
export const applySequentialCompanyStatutoryCodes = (records, companyDoc, empMap = new Map()) => {
  if (!Array.isArray(records) || records.length === 0) return records;

  const rawPfCode = companyDoc?.employerPfCode || companyDoc?.pfCode || companyDoc?.pfNo || '';
  const rawEsiCode = companyDoc?.employerEsiCode || companyDoc?.esiCode || companyDoc?.esicNo || '';
  const companyPfCode = String(rawPfCode).trim();
  const companyEsiCode = String(rawEsiCode).trim();

  // Natural sort copy of records by employeeId to ensure deterministic, consistent ordering across runs
  const sortedRecords = [...records].sort((a, b) => {
    const idA = String(a.employeeId || a.id || '');
    const idB = String(b.employeeId || b.id || '');
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  });

  let pfCounter = 1;
  let esiCounter = 1;
  const pfSeqMap = new Map();
  const esiSeqMap = new Map();

  sortedRecords.forEach((rec) => {
    const empIdKey = String(rec.employeeId || rec.id || '').toLowerCase();
    const empDoc = empMap.get(empIdKey);

    // Determine PF applicability:
    // 1. Explicit deduction > 0 in earnings/deductions
    // 2. Or employee master pfApplicable is true / 'yes'
    // 3. And not explicitly false / 'no'
    const pfDeduction = Number(
      rec.deductions?.pfEmployee ??
      rec.deductionsBreakdown?.pfEmployee ??
      rec.pf ??
      0
    );
    const empPfSetting = empDoc?.pfApplicable ?? rec.pfApplicable;
    const isPfExplicitlyDisabled = empPfSetting === false || String(empPfSetting).toLowerCase() === 'no';
    const isPfExplicitlyEnabled = empPfSetting === true || String(empPfSetting).toLowerCase() === 'yes';
    const isPfApplicable = !isPfExplicitlyDisabled && (pfDeduction > 0 || isPfExplicitlyEnabled);

    if (isPfApplicable) {
      const seqStr = String(pfCounter).padStart(3, '0');
      const generatedPf = companyPfCode ? `${companyPfCode}/${seqStr}` : `PF/${seqStr}`;
      pfSeqMap.set(empIdKey, generatedPf);
      pfCounter++;
    } else {
      pfSeqMap.set(empIdKey, 'N/A');
    }

    // Determine ESI applicability:
    // 1. Explicit deduction > 0 in earnings/deductions
    // 2. Or employee master esiApplicable is true / 'yes'
    // 3. And not explicitly false / 'no'
    const esiDeduction = Number(
      rec.deductions?.esiEmployee ??
      rec.deductionsBreakdown?.esiEmployee ??
      rec.esi ??
      0
    );
    const empEsiSetting = empDoc?.esiApplicable ?? rec.esiApplicable;
    const isEsiExplicitlyDisabled = empEsiSetting === false || String(empEsiSetting).toLowerCase() === 'no';
    const isEsiExplicitlyEnabled = empEsiSetting === true || String(empEsiSetting).toLowerCase() === 'yes';
    const isEsiApplicable = !isEsiExplicitlyDisabled && (esiDeduction > 0 || isEsiExplicitlyEnabled);

    if (isEsiApplicable) {
      const seqStr = String(esiCounter).padStart(3, '0');
      const generatedEsi = companyEsiCode ? `${companyEsiCode}/${seqStr}` : `ESI/${seqStr}`;
      esiSeqMap.set(empIdKey, generatedEsi);
      esiCounter++;
    } else {
      esiSeqMap.set(empIdKey, 'N/A');
    }
  });

  // Apply sequential codes back onto records
  records.forEach((rec) => {
    const empIdKey = String(rec.employeeId || rec.id || '').toLowerCase();
    const assignedPf = pfSeqMap.get(empIdKey) || 'N/A';
    const assignedEsi = esiSeqMap.get(empIdKey) || 'N/A';

    rec.pfNo = assignedPf;
    rec.pfNumber = assignedPf;
    rec.esicNo = assignedEsi;
    rec.esiNumber = assignedEsi;
    rec.employerPfCode = companyPfCode;
    rec.employerEsiCode = companyEsiCode;
    rec.pfApplicable = assignedPf !== 'N/A';
    rec.esiApplicable = assignedEsi !== 'N/A';
  });

  return records;
};


/**
 * @desc    Get dynamic payroll records for a month (calculates on-the-fly from MongoDB if not yet run)
 * @route   GET /api/payroll
 * @access  Private
 */
export const getPayrollRecords = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    // 1. Check if a saved Payroll Run exists in MongoDB for this month
    let payrollRun = await PayrollRun.findOne({ companyId, month });

    if (!payrollRun || !payrollRun.records || payrollRun.records.length === 0) {
      // 2. Compute dynamic live payroll preview from MongoDB Employees & Attendance
      const employees = await Employee.find({
        companyId,
        status: { $regex: /^active$/i },
      })
        .select('-documents -documentList -drivingLicenseCopy')
        .sort({ employeeId: 1 })
        .lean();

      const totalDaysInMonth = getDaysInMonthString(month);

      // Fetch month attendance records
      const attendanceList = await Attendance.find({
        companyId,
        date: { $regex: new RegExp(`^${month}`) },
      }).select('employeeId date status present halfDay late').lean();

      // Fetch Statutory Configuration dynamically from MongoDB Atlas
      const statutory = (await resolveStatutoryConfig(companyId, user?.email)).config;

      const records = [];

      for (const emp of employees) {
        const record = computeEmployeePayrollCalculations({
          emp,
          attendanceList,
          statutoryConfig: statutory,
          month,
          totalDaysInMonth,
        });
        records.push(record);
      }

      // Resolve company details & apply sequential PF / ESI codes
      const companyDoc =
        (await Company.findOne({ companyId })) ||
        (await Company.findOne({ isDefault: true })) ||
        (await Company.findOne({}));

      const liveEmpMap = new Map();
      employees.forEach((e) => {
        if (e.employeeId) liveEmpMap.set(String(e.employeeId).toLowerCase(), e);
        if (e.employeeCode) liveEmpMap.set(String(e.employeeCode).toLowerCase(), e);
      });

      applySequentialCompanyStatutoryCodes(records, companyDoc, liveEmpMap);

      return res.status(200).json({
        success: true,
        isCalculatedLive: true,
        month,
        monthLabel: getMonthLabel(month),
        status: 'Calculated',
        approvalStatus: 'Draft',
        totalEmployees: records.length,
        records,
      });
    }

    // If payrollRun was already saved, verify and sanitize any deductions against current employee statutory settings
    const employees = await Employee.find({ companyId })
      .select('-documents -documentList -drivingLicenseCopy')
      .lean();
    const empMap = new Map();
    employees.forEach((e) => {
      if (e.employeeId) empMap.set(String(e.employeeId).toLowerCase(), e);
      if (e.employeeCode) empMap.set(String(e.employeeCode).toLowerCase(), e);
    });

    if (payrollRun && payrollRun.records && payrollRun.records.length > 0) {
      const statutory = (await resolveStatutoryConfig(companyId, user?.email)).config;
      const pfEnabled = statutory?.pf?.enabled !== false;
      const esiEnabled = statutory?.esi?.enabled !== false;
      const ptEnabled = statutory?.pt?.enabled !== false;
      const ptSlabs = statutory?.ptSlabs || [];

      // Fetch month attendance to verify that payroll records match real attendance
      const monthAttendance = await Attendance.find({
        companyId,
        date: { $regex: new RegExp(`^${payrollRun.month}`) },
      }).select('employeeId date status present halfDay late').lean();
      const attendedNormIds = new Set();
      monthAttendance.forEach((a) => {
        if (a.employeeId) attendedNormIds.add(normalizeId(a.employeeId));
      });

      let hasCorrections = false;
      for (const rec of payrollRun.records) {
        const emp = empMap.get(String(rec.employeeId).toLowerCase());
        if (emp) {
          const normRecId = normalizeId(rec.employeeId);
          const normEmpId = normalizeId(emp.employeeId);
          const normCode = normalizeId(emp.employeeCode);
          const normMongoId = normalizeId(emp._id);

          const hasAttendance =
            attendedNormIds.has(normRecId) ||
            attendedNormIds.has(normEmpId) ||
            attendedNormIds.has(normCode) ||
            attendedNormIds.has(normMongoId);

          rec.hasAttendance = hasAttendance;

          const isPf = pfEnabled && (emp.pfApplicable === true || String(emp.pfApplicable).toLowerCase() === 'yes') && hasAttendance;
          const isEsi = esiEnabled && (emp.esiApplicable === true || String(emp.esiApplicable).toLowerCase() === 'yes') && hasAttendance;
          const isPt = ptEnabled && (emp.ptApplicable === true || String(emp.ptApplicable).toLowerCase() === 'yes') && hasAttendance;
          const isTds = (emp.tdsApplicable === true || String(emp.tdsApplicable).toLowerCase() === 'yes') && hasAttendance;

          if (!rec.deductions) rec.deductions = {};
          if (!rec.earnings) rec.earnings = {};

          let modified = false;

          // If payroll run was in draft/calculated status, check attendance
          if (['draft', 'calculated'].includes(String(payrollRun.status || '').toLowerCase())) {
            if (!hasAttendance) {
              // Employee has NO attendance in this month! Paid days must be 0!
              rec.presentDays = 0;
              rec.paidDays = 0;
              rec.lopDays = rec.totalDaysInMonth || getDaysInMonthString(payrollRun.month);
              rec.earnings = {
                basic: 0,
                vda: 0,
                hra: 0,
                conveyance: 0,
                specialAllowance: 0,
                otherAllowance: 0,
                bonus: 0,
                overtime: 0,
                arrears: 0,
                totalGross: 0,
              };
              rec.deductions = {
                pfEmployee: 0,
                pfEmployer: 0,
                esiEmployee: 0,
                esiEmployer: 0,
                pt: 0,
                tds: 0,
                lwf: 0,
                advances: 0,
                loanEmi: 0,
                otherDeductions: 0,
                totalDeductions: 0,
              };
              rec.netSalary = 0;
              rec.status = 'Pending Attendance';
              rec.remarks = 'Attendance record not uploaded for this month';
              modified = true;
            } else {
              // Match attendance for this employee
              const empAtt = monthAttendance.filter((a) => {
                const aId = normalizeId(a.employeeId);
                return aId === normRecId || aId === normEmpId || aId === normCode || aId === normMongoId;
              });
              let presentDays = 0;
              let weekOffDays = 0;
              let holidayDays = 0;
              let paidLeaves = 0;
              empAtt.forEach((a) => {
                if (a.present !== undefined) presentDays += Number(a.present) || 0;
                if (a.weekOff !== undefined) weekOffDays += Number(a.weekOff) || 0;
                if (a.holidays !== undefined) holidayDays += Number(a.holidays) || 0;
                if (a.cl !== undefined) paidLeaves += Number(a.cl) || 0;
                if (a.sl !== undefined) paidLeaves += Number(a.sl) || 0;
                if (a.el !== undefined) paidLeaves += Number(a.el) || 0;
              });
              const totalDaysInMonth = rec.totalDaysInMonth || getDaysInMonthString(payrollRun.month);
              const totalPaidDays = Math.min(totalDaysInMonth, presentDays + weekOffDays + holidayDays + paidLeaves);
              rec.presentDays = presentDays;
              rec.paidDays = totalPaidDays;
              rec.lopDays = Math.max(0, totalDaysInMonth - totalPaidDays);
              rec.status = 'Calculated';
              rec.remarks = '';

              const empGross = Number(emp.grossSalary) || 0;
              const empBasic = Number(emp.basic) || 0;
              let basic = empBasic;
              let hra = Number(emp.hra) || 0;
              let vda = Number(emp.vda) || 0;
              let conveyance = Number(emp.conveyance) || 0;
              let specialAllowance = Number(emp.specialAllowance) || 0;
              let otherAllowance = Number(emp.otherAllowance) || 0;
              let monthlyGross = empGross || (basic + hra + vda + conveyance + specialAllowance + otherAllowance);

              if (basic === 0 && hra === 0 && vda === 0 && monthlyGross > 0) {
                basic = Math.round(monthlyGross * 0.5);
                hra = Math.round(monthlyGross * 0.2);
                vda = Math.round(monthlyGross * 0.15);
                otherAllowance = Math.max(0, monthlyGross - (basic + hra + vda));
              }

              const ratio = totalDaysInMonth > 0 ? totalPaidDays / totalDaysInMonth : 0;
              rec.earnings.basic = Math.round(basic * ratio);
              rec.earnings.hra = Math.round(hra * ratio);
              rec.earnings.vda = Math.round(vda * ratio);
              rec.earnings.conveyance = Math.round(conveyance * ratio);
              rec.earnings.specialAllowance = Math.round(specialAllowance * ratio);
              rec.earnings.otherAllowance = Math.round(otherAllowance * ratio);
              rec.earnings.totalGross =
                rec.earnings.basic +
                rec.earnings.hra +
                rec.earnings.vda +
                rec.earnings.conveyance +
                rec.earnings.specialAllowance +
                rec.earnings.otherAllowance +
                (rec.earnings.overtime || 0);

              modified = true;
            }
          }

          const earnedGross = rec.earnings?.totalGross || 0;
          const earnedBasic = rec.earnings?.basic || 0;
          const earnedVda = rec.earnings?.vda || 0;
          const empState = emp.state || emp.workState || emp.siteState || emp.siteLocation || emp.site || emp.presentAddress || emp.address || '';

          // PF recheck
          const pfCalc = calculatePF(earnedBasic, earnedVda, emp, statutory?.pf, rec.earnings, statutory?.salaryComponents);
          if (rec.deductions.pfEmployee !== pfCalc.employee || rec.deductions.pfEmployer !== pfCalc.employer) {
            rec.deductions.pfEmployee = pfCalc.employee;
            rec.deductions.pfEmployer = pfCalc.employer;
            modified = true;
          }

          // ESI recheck
          const esiCalc = calculateESI(earnedGross, Number(emp.grossSalary) || earnedGross, rec.paidDays || 0, emp, statutory?.esi, rec.earnings, statutory?.salaryComponents);
          if (rec.deductions.esiEmployee !== esiCalc.employee || rec.deductions.esiEmployer !== esiCalc.employer) {
            rec.deductions.esiEmployee = esiCalc.employee;
            rec.deductions.esiEmployer = esiCalc.employer;
            modified = true;
          }

          // PT recheck
          const ptWage1 = computePTWageBase({
            emp,
            statutoryPt: statutory?.pt,
            monthlyGross: Number(emp.grossSalary) || earnedGross,
            earnedGross,
            monthlyEarnings: { basic: emp.basic, vda: emp.vda, hra: emp.hra, conveyance: emp.conveyance, specialAllowance: emp.specialAllowance, otherAllowance: emp.otherAllowance },
            earnedEarnings: rec.earnings,
            salaryComponentsMaster: statutory?.salaryComponents,
          });
          const correctPt = calculatePT(ptWage1, empState, ptSlabs, payrollRun.month, ptEnabled, emp.gender);
          if ((rec.deductions.pt || 0) !== correctPt) {
            rec.deductions.pt = correctPt;
            modified = true;
          }

          // TDS recheck
          const correctTds = calculateTDS(earnedGross, emp, statutory?.tds);
          if ((rec.deductions.tds || 0) !== correctTds) {
            rec.deductions.tds = correctTds;
            modified = true;
          }

          // LWF recheck
          const isLwfApplicable = emp.lwfApplicable !== false && String(emp.lwfApplicable).toLowerCase() !== 'no';
          const lwfCalc = calculateLWF(earnedGross, empState, statutory?.lwfRules, payrollRun.month, isLwfApplicable, statutory?.lwf?.enabled !== false);
          if ((rec.deductions.lwf || 0) !== lwfCalc.employee) {
            rec.deductions.lwf = lwfCalc.employee;
            modified = true;
          }

          // Bonus recheck if draft/calculated
          if (['draft', 'calculated'].includes(String(payrollRun.status || '').toLowerCase())) {
            const correctBonus = calculateBonus(earnedBasic, rec.paidDays || 0, rec.totalDaysInMonth || 30, emp, statutory?.bonus);
            if ((rec.earnings.bonus || 0) !== correctBonus) {
              rec.earnings.bonus = correctBonus;
              rec.earnings.totalGross =
                (rec.earnings.basic || 0) +
                (rec.earnings.hra || 0) +
                (rec.earnings.vda || 0) +
                (rec.earnings.conveyance || 0) +
                (rec.earnings.specialAllowance || 0) +
                (rec.earnings.otherAllowance || 0) +
                (rec.earnings.bonus || 0) +
                (rec.earnings.overtime || 0) +
                (rec.earnings.arrears || 0);
              modified = true;
            }
          }

          if (modified) {
            rec.deductions.totalDeductions =
              (rec.deductions.pfEmployee || 0) +
              (rec.deductions.esiEmployee || 0) +
              (rec.deductions.pt || 0) +
              (rec.deductions.tds || 0) +
              (rec.deductions.lwf || 0) +
              (rec.deductions.advances || 0) +
              (rec.deductions.loanEmi || 0) +
              (rec.deductions.otherDeductions || 0);

            rec.netSalary = Math.max(0, (rec.earnings?.totalGross || 0) - rec.deductions.totalDeductions);
            hasCorrections = true;
          }
        }
      }

      if (hasCorrections) {
        const totalGross = payrollRun.records.reduce((sum, r) => sum + (r.earnings?.totalGross || 0), 0);
        const totalDeductions = payrollRun.records.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
        const totalNet = payrollRun.records.reduce((sum, r) => sum + (r.netSalary || 0), 0);

        payrollRun.totalGross = totalGross;
        payrollRun.totalDeductions = totalDeductions;
        payrollRun.totalNet = totalNet;

        // Use direct updateOne with $set to prevent VersionError on concurrent read-repairs
        await PayrollRun.updateOne(
          { _id: payrollRun._id },
          {
            $set: {
              records: payrollRun.records,
              totalGross,
              totalDeductions,
              totalNet
            }
          }
        ).catch((err) => console.warn('Non-critical payroll background update warning:', err.message));
      }
    }

    // Enrich saved records with employee master salary values so Salary Structure tab displays properly
    const enrichedRecords = (payrollRun?.records || []).map((rec) => {
      const plain = typeof rec.toObject === 'function' ? rec.toObject() : { ...rec };
      const emp = empMap.get(String(rec.employeeId).toLowerCase());
      const basic = emp?.basic !== undefined && emp?.basic !== null ? Number(emp.basic) : (plain.earnings?.basic || 0);
      const hra = emp?.hra !== undefined && emp?.hra !== null ? Number(emp.hra) : (plain.earnings?.hra || 0);
      const vda = emp?.vda !== undefined && emp?.vda !== null ? Number(emp.vda) : (plain.earnings?.vda || 0);
      const conveyance = emp?.conveyance !== undefined && emp?.conveyance !== null ? Number(emp.conveyance) : (plain.earnings?.conveyance || 0);
      const specialAllowance = emp?.specialAllowance !== undefined && emp?.specialAllowance !== null ? Number(emp.specialAllowance) : (plain.earnings?.specialAllowance || 0);
      const otherAllowance = emp?.otherAllowance !== undefined && emp?.otherAllowance !== null ? Number(emp.otherAllowance) : (plain.earnings?.otherAllowance || 0);
      const grossSalary = emp?.grossSalary !== undefined && emp?.grossSalary !== null && Number(emp.grossSalary) > 0
        ? Number(emp.grossSalary)
        : (plain.earnings?.totalGross || (basic + hra + vda + conveyance + specialAllowance + otherAllowance));

      return {
        ...plain,
        basicSalary: basic,
        basic,
        hra,
        vda,
        conveyance,
        transportAllowance: conveyance,
        specialAllowance,
        otherAllowance,
        grossSalary,
        pf: plain.deductions?.pfEmployee || 0,
        esi: plain.deductions?.esiEmployee || 0,
        otherDeduction: (plain.deductions?.otherDeductions || 0) + (plain.deductions?.pt || 0) + (plain.deductions?.tds || 0),
        totalDeductions: plain.deductions?.totalDeductions || 0,
        netSalary: plain.netSalary || 0,
      };
    });

    const companyDoc =
      (await Company.findOne({ companyId })) ||
      (await Company.findOne({ isDefault: true })) ||
      (await Company.findOne({}));

    applySequentialCompanyStatutoryCodes(enrichedRecords, companyDoc, empMap);

    return res.status(200).json({
      success: true,
      isCalculatedLive: false,
      month: payrollRun.month,
      monthLabel: getMonthLabel(payrollRun.month),
      status: payrollRun.status,
      approvalStatus: payrollRun.approvalStatus,
      approvedBy: payrollRun.approvedBy,
      approvedAt: payrollRun.approvedAt,
      totalEmployees: payrollRun.totalEmployees,
      totalGross: payrollRun.totalGross,
      totalDeductions: payrollRun.totalDeductions,
      totalNet: payrollRun.totalNet,
      totalOvertime: payrollRun.totalOvertime,
      records: enrichedRecords,
    });
  } catch (error) {
    console.error('Error fetching dynamic payroll records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payroll records.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save/Update Salary Structure for an employee and persist into MongoDB
 * @route   POST /api/payroll/structure
 * @access  Private (Admin, HR, Manager, Superadmin)
 */
export const saveSalaryStructure = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const {
      employeeId,
      basicSalary,
      basic,
      hra,
      vda,
      conveyance,
      transportAllowance,
      otherAllowance,
      specialAllowance,
      grossSalary,
      pf,
      esi,
      otherDeduction,
      month,
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required to update salary structure.',
      });
    }

    // 1. Locate employee in MongoDB
    const empQuery = {
      companyId,
      $or: [
        { employeeId: String(employeeId).trim() },
        { employeeCode: String(employeeId).trim() },
        ...(mongoose.isValidObjectId(employeeId) ? [{ _id: employeeId }] : []),
      ],
    };

    let employee = await Employee.findOne(empQuery);
    if (!employee) {
      // Fallback without companyId in case of slight string casing
      employee = await Employee.findOne({
        $or: [
          { employeeId: String(employeeId).trim() },
          { employeeCode: String(employeeId).trim() },
          ...(mongoose.isValidObjectId(employeeId) ? [{ _id: employeeId }] : []),
        ],
      });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee "${employeeId}" not found in database.`,
      });
    }

    const numBasic = Number(basic ?? basicSalary ?? 0);
    const numHra = Number(hra ?? 0);
    const numVda = Number(vda ?? 0);
    const numConv = Number(conveyance ?? transportAllowance ?? 0);
    const numSpecial = Number(specialAllowance ?? 0);
    const numOther = Number(otherAllowance ?? 0);
    const sumAllowances = numHra + numVda + numConv + numSpecial + numOther;
    const numGross = Number(grossSalary) || (numBasic + sumAllowances);

    // Persist to Employee Master in MongoDB
    employee.basic = numBasic;
    employee.hra = numHra;
    employee.vda = numVda;
    employee.conveyance = numConv;
    employee.specialAllowance = numSpecial;
    employee.otherAllowance = numOther;
    employee.grossSalary = numGross;

    if (req.body.pfApplicable !== undefined) employee.pfApplicable = req.body.pfApplicable;
    if (req.body.esiApplicable !== undefined) employee.esiApplicable = req.body.esiApplicable;
    if (req.body.ptApplicable !== undefined) employee.ptApplicable = req.body.ptApplicable;
    if (req.body.tdsApplicable !== undefined) employee.tdsApplicable = req.body.tdsApplicable;

    await employee.save();

    // 2. If a PayrollRun exists for this company and month, update the employee record
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const payrollRun = await PayrollRun.findOne({ companyId, month: targetMonth });

    const statutory = (await resolveStatutoryConfig(companyId, req.user?.email)).config;
    const ptEnabled = statutory?.pt?.enabled !== false;
    const ptSlabs = statutory?.ptSlabs || [];

    let updatedPayrollRecord = null;

    if (payrollRun && payrollRun.records && payrollRun.records.length > 0) {
      const empIdLower = String(employee.employeeId || employee.employeeCode || '').toLowerCase();
      const recIndex = payrollRun.records.findIndex(
        (r) => String(r.employeeId || '').toLowerCase() === empIdLower
      );

      if (recIndex !== -1) {
        const rec = payrollRun.records[recIndex];
        const totalDaysInMonth = rec.totalDaysInMonth || getDaysInMonthString(targetMonth);
        const paidDays = rec.paidDays !== undefined && rec.paidDays !== null ? rec.paidDays : totalDaysInMonth;
        const ratio = totalDaysInMonth > 0 ? paidDays / totalDaysInMonth : 1;

        const earnedBasic = Math.round(numBasic * ratio);
        const earnedVda = Math.round(numVda * ratio);
        const earnedHra = Math.round(numHra * ratio);
        const earnedConv = Math.round(numConv * ratio);
        const earnedSpecial = Math.round(numSpecial * ratio);
        const earnedOther = Math.round(numOther * ratio);
        const overtimePay = rec.earnings?.overtime || 0;
        const bonus = statutory?.bonus?.enabled === false
          ? 0
          : (rec.earnings?.bonus !== undefined
              ? rec.earnings.bonus
              : calculateBonus(earnedBasic, paidDays, totalDaysInMonth, employee, statutory?.bonus));
        const arrears = rec.earnings?.arrears || 0;
        const earnedGross = earnedBasic + earnedVda + earnedHra + earnedConv + earnedSpecial + earnedOther + bonus + overtimePay + arrears;

        const empState = employee.state || employee.workState || employee.siteState || employee.siteLocation || employee.site || employee.presentAddress || employee.address || '';

        // PF (strictly respecting module active status)
        let pfEmployee = 0;
        let pfEmployer = 0;
        if (statutory?.pf?.enabled === false) {
          pfEmployee = 0;
          pfEmployer = 0;
        } else if (pf !== undefined && pf !== null) {
          pfEmployee = Number(pf) || 0;
          pfEmployer = Number(pf) || 0;
        } else {
          const pfCalc = calculatePF(earnedBasic, earnedVda, employee, statutory?.pf, rec.earnings, statutory?.salaryComponents);
          pfEmployee = pfCalc.employee;
          pfEmployer = pfCalc.employer;
        }

        // ESI (strictly respecting module active status)
        let esiEmployee = 0;
        let esiEmployer = 0;
        if (statutory?.esi?.enabled === false) {
          esiEmployee = 0;
          esiEmployer = 0;
        } else if (esi !== undefined && esi !== null) {
          esiEmployee = Number(esi) || 0;
          esiEmployer = Math.round(Number(esi) * 4.33);
        } else {
          const esiCalc = calculateESI(earnedGross, numGross, paidDays, employee, statutory?.esi, rec.earnings, statutory?.salaryComponents);
          esiEmployee = esiCalc.employee;
          esiEmployer = esiCalc.employer;
        }

        // PT (strictly respecting module active status)
        const ptWage2 = computePTWageBase({
          emp: employee,
          statutoryPt: statutory?.pt,
          monthlyGross: numGross,
          earnedGross,
          monthlyEarnings: { basic: employee.basic, vda: employee.vda, hra: employee.hra, conveyance: employee.conveyance, specialAllowance: employee.specialAllowance, otherAllowance: employee.otherAllowance },
          earnedEarnings: rec.earnings,
          salaryComponentsMaster: statutory?.salaryComponents,
        });
        const ptVal = statutory?.pt?.enabled === false ? 0 : calculatePT(ptWage2, empState, ptSlabs, targetMonth, ptEnabled, employee.gender);

        // TDS (strictly respecting module active status)
        const tdsVal = statutory?.tds?.enabled === false ? 0 : calculateTDS(earnedGross, employee, statutory?.tds);

        // LWF (strictly respecting module active status)
        const isLwfApplicable = employee.lwfApplicable !== false && String(employee.lwfApplicable).toLowerCase() !== 'no';
        const lwfCalc = statutory?.lwf?.enabled === false
          ? { employee: 0, employer: 0 }
          : calculateLWF(earnedGross, empState, statutory?.lwfRules, targetMonth, isLwfApplicable, statutory?.lwf?.enabled !== false);

        const otherDed = otherDeduction !== undefined ? Number(otherDeduction) || 0 : (rec.deductions?.otherDeductions || 0);

        const totalDeductions =
          pfEmployee +
          esiEmployee +
          ptVal +
          tdsVal +
          lwfCalc.employee +
          (rec.deductions?.advances || 0) +
          (rec.deductions?.loanEmi || 0) +
          otherDed;

        const netSalary = Math.max(0, earnedGross - totalDeductions);

        rec.earnings = {
          basic: earnedBasic,
          vda: earnedVda,
          hra: earnedHra,
          conveyance: earnedConv,
          specialAllowance: earnedSpecial,
          otherAllowance: earnedOther,
          bonus,
          overtime: overtimePay,
          arrears,
          totalGross: earnedGross,
        };

        rec.deductions = {
          pfEmployee,
          pfEmployer,
          esiEmployee,
          esiEmployer,
          pt: ptVal,
          tds: tdsVal,
          lwf: lwfCalc.employee,
          advances: rec.deductions?.advances || 0,
          loanEmi: rec.deductions?.loanEmi || 0,
          otherDeductions: otherDed,
          totalDeductions,
        };

        rec.netSalary = netSalary;
        payrollRun.records[recIndex] = rec;

        payrollRun.totalGross = payrollRun.records.reduce((sum, r) => sum + (r.earnings?.totalGross || 0), 0);
        payrollRun.totalDeductions = payrollRun.records.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
        payrollRun.totalNet = payrollRun.records.reduce((sum, r) => sum + (r.netSalary || 0), 0);

        payrollRun.markModified('records');
        await payrollRun.save();
        updatedPayrollRecord = rec;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Salary structure saved successfully in database for ${employee.name}.`,
      employee: employee.toJSON(),
      payrollRecord: updatedPayrollRecord,
    });
  } catch (error) {
    console.error('Error saving salary structure:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save salary structure to database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Run and lock/save payroll calculation in MongoDB
 * @route   POST /api/payroll/run
 * @access  Private (Admin)
 */
export const runPayrollCalculation = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { month, records: reqRecords } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required.' });
    }

    // Fetch active employees to guarantee accurate master data
    const employees = await Employee.find({
      companyId,
      status: { $regex: /^active$/i },
    })
      .select('-documents -documentList -drivingLicenseCopy')
      .lean();

    const totalDaysInMonth = getDaysInMonthString(month);
    const attendanceList = await Attendance.find({
      companyId,
      date: { $regex: new RegExp(`^${month}`) },
    }).select('employeeId date status present halfDay late overtimeHours').lean();

    const statutory = (await resolveStatutoryConfig(companyId, req.user?.email)).config;

    const reqRecordsMap = new Map();
    if (Array.isArray(reqRecords) && reqRecords.length > 0) {
      reqRecords.forEach((r) => {
        if (r.employeeId) reqRecordsMap.set(normalizeId(r.employeeId), r);
        if (r.id) reqRecordsMap.set(normalizeId(r.id), r);
      });
    }

    const calculatedRecords = employees.map((emp) => {
      const normEmpId = normalizeId(emp.employeeId);
      const normCode = normalizeId(emp.employeeCode);
      const reqRec = reqRecordsMap.get(normEmpId) || reqRecordsMap.get(normCode);

      const overrides = {};
      if (reqRec) {
        if (reqRec.paidDays !== undefined) overrides.paidDays = reqRec.paidDays;
        if (reqRec.presentDays !== undefined) overrides.presentDays = reqRec.presentDays;
        if (reqRec.lopDays !== undefined) overrides.lopDays = reqRec.lopDays;
        if (reqRec.hasAttendance !== undefined) overrides.hasAttendance = reqRec.hasAttendance;
        if (reqRec.overtimeHours !== undefined) overrides.overtimeHours = reqRec.overtimeHours;
        if (reqRec.overtimePay !== undefined) overrides.overtimePay = reqRec.overtimePay;
        if (reqRec.earnings?.overtime !== undefined) overrides.overtimePay = reqRec.earnings.overtime;
        if (reqRec.earnings?.arrears !== undefined) overrides.arrears = reqRec.earnings.arrears;
        if (reqRec.deductions?.advances !== undefined) overrides.advances = reqRec.deductions.advances;
        if (reqRec.deductions?.loanEmi !== undefined) overrides.loanEmi = reqRec.deductions.loanEmi;
        if (reqRec.deductions?.otherDeductions !== undefined) overrides.otherDeductions = reqRec.deductions.otherDeductions;
      }

      return computeEmployeePayrollCalculations({
        emp,
        attendanceList,
        statutoryConfig: statutory,
        month,
        totalDaysInMonth,
        overrides,
      });
    });

    const companyDoc =
      (await Company.findOne({ companyId })) ||
      (await Company.findOne({ isDefault: true })) ||
      (await Company.findOne({}));

    const empMap = new Map();
    employees.forEach((e) => {
      if (e.employeeId) empMap.set(String(e.employeeId).toLowerCase(), e);
      if (e.employeeCode) empMap.set(String(e.employeeCode).toLowerCase(), e);
    });

    applySequentialCompanyStatutoryCodes(calculatedRecords, companyDoc, empMap);

    const totalGross = calculatedRecords.reduce((sum, r) => sum + (r.earnings?.totalGross || 0), 0);
    const totalDeductions = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
    const totalNet = calculatedRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const totalOvertime = calculatedRecords.reduce((sum, r) => sum + (r.earnings?.overtime || 0), 0);
    const totalPF = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.pfEmployee || 0), 0);
    const totalESI = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.esiEmployee || 0), 0);
    const totalPT = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.pt || 0), 0);
    const totalTDS = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.tds || 0), 0);
    const totalLWF = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.lwf || 0), 0);

    const updatedRun = await PayrollRun.findOneAndUpdate(
      { companyId, month },
      {
        $set: {
          companyId,
          month,
          adminEmail: user?.email || '',
          status: 'Calculated',
          approvalStatus: 'Pending Approval',
          totalEmployees: calculatedRecords.length,
          totalGross,
          totalDeductions,
          totalNet,
          totalOvertime,
          totalPF,
          totalESI,
          totalPT,
          totalTDS,
          totalLWF,
          records: calculatedRecords,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `✓ Payroll for ${getMonthLabel(month)} calculated and saved to database successfully!`,
      payrollRun: updatedRun.toJSON(),
    });
  } catch (error) {
    console.error('Error running payroll calculation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payroll calculation.',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve or reject monthly payroll run
 * @route   POST /api/payroll/approve
 * @access  Private (Admin)
 */
export const approvePayroll = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { month, action, remarks } = req.body;

    const isApproved = action !== 'reject';
    const timestamp = new Date().toISOString();

    const payrollRun = await PayrollRun.findOneAndUpdate(
      { companyId, month },
      {
        $set: {
          status: isApproved ? 'Approved' : 'Draft',
          approvalStatus: isApproved ? 'Approved' : 'Rejected',
          approvedBy: isApproved ? user?.name || user?.email || 'Admin' : '',
          approvedAt: isApproved ? timestamp : '',
        },
      },
      { returnDocument: 'after' }
    );

    if (!payrollRun) {
      return res.status(404).json({ success: false, message: 'Payroll run record not found for this month.' });
    }

    return res.status(200).json({
      success: true,
      message: isApproved ? `✓ Payroll for ${getMonthLabel(month)} approved successfully.` : `Payroll for ${getMonthLabel(month)} returned to draft.`,
      payrollRun: payrollRun.toJSON(),
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve payroll.',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate Salary Slips in MongoDB for selected client, selective employees, or all
 * @route   POST /api/payroll/generate-slips
 * @access  Private (Admin)
 */
export const generateSalarySlips = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { month, client, clientName, clientId, department, generationType, employeeIds } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required to generate salary slips.' });
    }

    let payrollRun = await PayrollRun.findOne({ companyId, month });
    
    // If no saved payroll run exists for this month, compute on the fly from active employees & attendance
    if (!payrollRun || !payrollRun.records || payrollRun.records.length === 0) {
      const employees = await Employee.find({
        companyId,
        status: { $regex: /^active$/i },
      }).sort({ employeeId: 1 });

      if (!employees || employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active employees found to generate salary slips.',
        });
      }

      const totalDaysInMonth = getDaysInMonthString(month);
      const attendanceList = await Attendance.find({
        companyId,
        date: { $regex: new RegExp(`^${month}`) },
      });

      const statutory = (await resolveStatutoryConfig(companyId, req.user?.email)).config;
      const pfEnabled = statutory?.pf?.enabled !== false;
      const esiEnabled = statutory?.esi?.enabled !== false;
      const ptEnabled = statutory?.pt?.enabled !== false;
      const ptSlabs = statutory?.ptSlabs || [];

      const calculatedRecords = employees.map((emp) => {
        return computeEmployeePayrollCalculations({
          emp,
          attendanceList,
          statutoryConfig: statutory,
          month,
          totalDaysInMonth,
        });
      });

      const totalGross = calculatedRecords.reduce((sum, r) => sum + (r.earnings?.totalGross || 0), 0);
      const totalDeductions = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
      const totalNet = calculatedRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);

      payrollRun = await PayrollRun.findOneAndUpdate(
        { companyId, month },
        {
          $set: {
            companyId,
            month,
            adminEmail: user?.email || '',
            status: 'Calculated',
            approvalStatus: 'Pending Approval',
            totalEmployees: calculatedRecords.length,
            totalGross,
            totalDeductions,
            totalNet,
            records: calculatedRecords,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    // Fetch month attendance to ensure only employees with valid attendance records get salary slips generated
    const monthAttendance = await Attendance.find({
      companyId,
      date: { $regex: new RegExp(`^${month}`) },
    }).select('employeeId date status present halfDay late').lean();
    const attendedNormIds = new Set();
    monthAttendance.forEach((a) => {
      if (a.employeeId) attendedNormIds.add(normalizeId(a.employeeId));
    });

    const allEmps = await Employee.find({ companyId })
      .select('-documents -documentList -drivingLicenseCopy')
      .lean();
    const empMap = new Map();
    const attendedEmpIdSet = new Set();

    allEmps.forEach((e) => {
      if (e.employeeId) empMap.set(String(e.employeeId).toLowerCase(), e);
      if (e.employeeCode) empMap.set(String(e.employeeCode).toLowerCase(), e);
      if (e._id) empMap.set(String(e._id).toLowerCase(), e);

      const normId = normalizeId(e.employeeId);
      const normCode = normalizeId(e.employeeCode);
      const normMongoId = normalizeId(e._id);
      if (
        attendedNormIds.has(normId) ||
        attendedNormIds.has(normCode) ||
        attendedNormIds.has(normMongoId)
      ) {
        if (normId) attendedEmpIdSet.add(normId);
        if (normCode) attendedEmpIdSet.add(normCode);
        if (normMongoId) attendedEmpIdSet.add(normMongoId);
      }
    });

    // Filter candidate records as per client, department, and selective employee selection
    let candidateRecords = [...(payrollRun.records || [])];

    // 1. Client filter
    const clientTarget = (clientName || client || clientId || '').toString().trim();
    if (clientTarget && !['all', 'all clients', 'all_clients'].includes(clientTarget.toLowerCase())) {
      const ctLower = clientTarget.toLowerCase();
      candidateRecords = candidateRecords.filter((rec) => {
        const cName = (rec.clientName || rec.companyName || '').toLowerCase().trim();
        const cId = (rec.clientId || '').toLowerCase().trim();
        return cName === ctLower || cName.includes(ctLower) || cId === ctLower;
      });
    }

    // 2. Department filter
    const deptTarget = (department || '').toString().trim();
    if (deptTarget && !['all', 'all departments', 'all_departments'].includes(deptTarget.toLowerCase())) {
      const dtLower = deptTarget.toLowerCase();
      candidateRecords = candidateRecords.filter((rec) => {
        return (rec.department || '').toLowerCase().trim() === dtLower;
      });
    }

    // 3. Selective Employees filter
    if (generationType === 'selective' || (Array.isArray(employeeIds) && employeeIds.length > 0)) {
      if (Array.isArray(employeeIds) && employeeIds.length > 0) {
        const idSet = new Set(employeeIds.map((id) => normalizeId(id)));
        candidateRecords = candidateRecords.filter((rec) =>
          idSet.has(normalizeId(rec.employeeId))
        );
      }
      // Strictly verify attendance for selective generation
      const missingAttendance = candidateRecords.filter(
        (rec) => !attendedEmpIdSet.has(normalizeId(rec.employeeId))
      );
      if (missingAttendance.length > 0) {
        const names = missingAttendance.map((r) => `${r.employeeName || r.employeeId} (${r.employeeId})`).join(', ');
        return res.status(400).json({
          success: false,
          message: `Cannot generate salary slip: Attendance data is not present in the database for ${names} for ${getMonthLabel(month)}. Please upload attendance first.`,
        });
      }
    }

    if (candidateRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching employees found for the selected client or criteria to generate salary slips.',
      });
    }

    // Filter candidate records to only those who have recorded attendance and paidDays > 0
    const eligibleRecords = candidateRecords.filter(
      (rec) => attendedEmpIdSet.has(normalizeId(rec.employeeId)) && (rec.paidDays || 0) > 0
    );

    if (eligibleRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot generate salary slips: None of the matching employees have attendance records in the database for ${getMonthLabel(month)}. Please upload or record attendance in Workforce > Attendance before generating salary slips.`,
      });
    }

    // Clean up only the invalid slips previously generated without attendance
    const existingMonthSlips = await SalarySlip.find({ companyId, month });
    const invalidSlipIds = existingMonthSlips
      .filter((s) => !attendedEmpIdSet.has(normalizeId(s.employeeId)))
      .map((s) => s._id);

    if (invalidSlipIds.length > 0) {
      await SalarySlip.deleteMany({ _id: { $in: invalidSlipIds } });
    }

    // Resolve official company details
    const companyDoc =
      (await Company.findOne({ companyId })) ||
      (await Company.findOne({ isDefault: true })) ||
      (await Company.findOne({}));

    const formattedCompAddress = [
      companyDoc?.address,
      companyDoc?.city,
      companyDoc?.state,
      companyDoc?.pinCode,
    ]
      .filter(Boolean)
      .join(', ') || companyDoc?.address || 'Corporate Office';

    const createdSlips = [];
    const generatedDate = new Date().toISOString().split('T')[0];
    const generatedEmpIds = new Set();

    // Fetch statutory configuration & active employees to validate deductions
    const statutory = (await resolveStatutoryConfig(companyId, req.user?.email)).config;
    const pfEnabled = statutory?.pf?.enabled !== false;
    const esiEnabled = statutory?.esi?.enabled !== false;
    const ptEnabled = statutory?.pt?.enabled !== false;
    const ptSlabs = statutory?.ptSlabs || [];
    allEmps.forEach((e) => {
      if (e.employeeId) empMap.set(String(e.employeeId).toLowerCase(), e);
      if (e.employeeCode) empMap.set(String(e.employeeCode).toLowerCase(), e);
    });

    for (let i = 0; i < eligibleRecords.length; i++) {
      const rec = eligibleRecords[i];
      const empDoc = empMap.get(String(rec.employeeId).toLowerCase());
      if (empDoc) {
        if (!rec.deductions) rec.deductions = {};

        const earnedGross = rec.earnings?.totalGross || 0;
        const earnedBasic = rec.earnings?.basic || 0;
        const earnedVda = rec.earnings?.vda || 0;
        const empState = empDoc.state || empDoc.workState || empDoc.siteState || empDoc.siteLocation || empDoc.site || empDoc.presentAddress || empDoc.address || '';

        // PF
        const pfCalc = calculatePF(earnedBasic, earnedVda, empDoc, statutory?.pf, rec.earnings, statutory?.salaryComponents);
        rec.deductions.pfEmployee = pfCalc.employee;
        rec.deductions.pfEmployer = pfCalc.employer;

        // ESI
        const esiCalc = calculateESI(earnedGross, Number(empDoc.grossSalary) || earnedGross, rec.paidDays || 0, empDoc, statutory?.esi, rec.earnings, statutory?.salaryComponents);
        rec.deductions.esiEmployee = esiCalc.employee;
        rec.deductions.esiEmployer = esiCalc.employer;

        // PT
        const ptWage3 = computePTWageBase({
          emp: empDoc,
          statutoryPt: statutory?.pt,
          monthlyGross: Number(empDoc.grossSalary) || earnedGross,
          earnedGross,
          monthlyEarnings: { basic: empDoc.basic, vda: empDoc.vda, hra: empDoc.hra, conveyance: empDoc.conveyance, specialAllowance: empDoc.specialAllowance, otherAllowance: empDoc.otherAllowance },
          earnedEarnings: rec.earnings,
          salaryComponentsMaster: statutory?.salaryComponents,
        });
        rec.deductions.pt = calculatePT(ptWage3, empState, ptSlabs, month, ptEnabled, empDoc.gender);

        // TDS
        rec.deductions.tds = calculateTDS(earnedGross, empDoc, statutory?.tds);

        // LWF
        const isLwfApplicable = empDoc.lwfApplicable !== false && String(empDoc.lwfApplicable).toLowerCase() !== 'no';
        const lwfCalc = calculateLWF(earnedGross, empState, statutory?.lwfRules, month, isLwfApplicable, statutory?.lwf?.enabled !== false);
        rec.deductions.lwf = lwfCalc.employee;

        rec.deductions.totalDeductions =
          (Number(rec.deductions.pfEmployee) || 0) +
          (Number(rec.deductions.esiEmployee) || 0) +
          (Number(rec.deductions.pt) || 0) +
          (Number(rec.deductions.tds) || 0) +
          (Number(rec.deductions.lwf) || 0) +
          (Number(rec.deductions.advances) || 0) +
          (Number(rec.deductions.loanEmi) || 0) +
          (Number(rec.deductions.otherDeductions) || 0);

        rec.netSalary = Math.max(0, (rec.earnings?.totalGross || 0) - rec.deductions.totalDeductions);

        if (!rec.pan && empDoc.pan) rec.pan = empDoc.pan;
        if (!rec.uan && empDoc.uan) rec.uan = empDoc.uan;
        if (!rec.bankName && empDoc.bankName) rec.bankName = empDoc.bankName;
        if (!rec.bankAccountNo && (empDoc.bankAccountNo || empDoc.accountNumber || empDoc.accountNo)) {
          rec.bankAccountNo = empDoc.bankAccountNo || empDoc.accountNumber || empDoc.accountNo;
        }
        if (!rec.ifscCode && (empDoc.ifscCode || empDoc.ifsc)) {
          rec.ifscCode = empDoc.ifscCode || empDoc.ifsc;
        }
      }
    }

    // Sequentially assign company-configured PF (<companyPfCode>/001) & ESI (<companyEsiCode>/001) codes
    applySequentialCompanyStatutoryCodes(eligibleRecords, companyDoc, empMap);

    for (let i = 0; i < eligibleRecords.length; i++) {
      const rec = eligibleRecords[i];
      const empDoc = empMap.get(String(rec.employeeId).toLowerCase());

      const slipNumber = `SLIP-${month.replace('-', '')}-${String(rec.employeeId || i + 1).padStart(4, '0')}`;

      const slip = await SalarySlip.findOneAndUpdate(
        { companyId, employeeId: rec.employeeId, month },
        {
          $set: {
            companyId,
            slipNumber,
            employeeId: rec.employeeId,
            employeeName: rec.employeeName,
            initials: rec.initials || rec.employeeName?.slice(0, 2)?.toUpperCase() || 'EM',
            month,
            monthLabel: getMonthLabel(month),
            designation: rec.designation,
            department: rec.department,
            clientName: rec.clientName,
            site: rec.site,
            bankName: rec.bankName || empDoc?.bankName || '',
            bankAccountNo: rec.bankAccountNo || empDoc?.bankAccountNo || empDoc?.accountNumber || empDoc?.accountNo || '',
            ifscCode: rec.ifscCode || empDoc?.ifscCode || empDoc?.ifsc || '',
            pan: rec.pan || empDoc?.pan || '',
            uan: rec.uan || empDoc?.uan || '',
            pfNo: rec.pfNo,
            pfNumber: rec.pfNumber || rec.pfNo,
            esicNo: rec.esicNo,
            esiNumber: rec.esiNumber || rec.esicNo,
            employerPfCode: companyDoc?.employerPfCode || '',
            employerEsiCode: companyDoc?.employerEsiCode || '',
            pfApplicable: rec.pfApplicable,
            esiApplicable: rec.esiApplicable,
            workingDays: rec.totalDaysInMonth,
            presentDays: rec.presentDays,
            paidDays: rec.paidDays,
            lopDays: rec.lopDays,
            grossSalary: rec.earnings?.totalGross || 0,
            totalDeductions: rec.deductions?.totalDeductions || 0,
            netSalary: rec.netSalary || 0,
            earningsBreakdown: rec.earnings || {},
            deductionsBreakdown: rec.deductions || {},
            companyName: companyDoc?.name || rec.companyName || 'RR Security & Facilities',
            companyAddress: formattedCompAddress,
            companyEmail: companyDoc?.email || '',
            companyPhone: companyDoc?.phone || '',
            companyGstin: companyDoc?.gstin || '',
            companyPan: companyDoc?.pan || '',
            companyLogo: companyDoc?.logo || null,
            status: 'Generated',
            generatedDate,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      createdSlips.push(slip.toJSON());
      generatedEmpIds.add(rec.employeeId);
    }

    // Update the status and corrected deductions in the payrollRun document to 'Processed'
    if (payrollRun && payrollRun.records) {
      payrollRun.records.forEach((r) => {
        if (generatedEmpIds.has(r.employeeId)) {
          r.status = 'Processed';
          const updatedCandidate = candidateRecords.find((c) => c.employeeId === r.employeeId);
          if (updatedCandidate) {
            r.deductions = updatedCandidate.deductions;
            r.netSalary = updatedCandidate.netSalary;
          }
        }
      });
      payrollRun.totalDeductions = payrollRun.records.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
      payrollRun.totalNet = payrollRun.records.reduce((sum, r) => sum + (r.netSalary || 0), 0);
      const allProcessed = payrollRun.records.every((r) => r.status === 'Processed' || r.status === 'processed');
      if (allProcessed) {
        payrollRun.status = 'Processed';
      }
      await payrollRun.save();
    }

    return res.status(200).json({
      success: true,
      message: `✓ Generated ${createdSlips.length} salary slip${createdSlips.length === 1 ? '' : 's'} for ${getMonthLabel(month)} successfully!`,
      count: createdSlips.length,
      slips: createdSlips,
    });
  } catch (error) {
    console.error('Error generating salary slips:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate salary slips.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Salary Slips from MongoDB
 * @route   GET /api/payroll/salary-slips
 * @access  Private
 */
export const getSalarySlips = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const { month, employeeId, search, client, clientName, department } = req.query;

    const query = {};
    if (month) query.month = month;

    if (user.role === 'employee') {
      const empId = (user.employeeId || user.id || employeeId || '').toString().trim();
      if (empId) {
        query.employeeId = { $regex: new RegExp(`^${empId}$`, 'i') };
      }
      if (companyId) {
        query.$or = [{ companyId }, { companyId: user.companyId || 'RRS8392014SEC' }];
      }
    } else {
      if (companyId) query.companyId = companyId;
      if (employeeId) {
        query.employeeId = { $regex: new RegExp(`^${employeeId.trim()}$`, 'i') };
      }
    }

    const cTarget = (clientName || client || '').toString().trim();
    if (cTarget && !['all', 'all clients', 'all_clients'].includes(cTarget.toLowerCase())) {
      query.clientName = { $regex: new RegExp(cTarget, 'i') };
    }

    if (department && !['all', 'all departments', 'all_departments'].includes(department.toLowerCase().trim())) {
      query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ employeeName: searchRegex }, { employeeId: searchRegex }, { slipNumber: searchRegex }];
    }

    // Resolve official company details
    const companyDoc =
      (await Company.findOne({ companyId })) ||
      (await Company.findOne({ isDefault: true })) ||
      (await Company.findOne({}));

    const formattedCompAddress = [
      companyDoc?.address,
      companyDoc?.city,
      companyDoc?.state,
      companyDoc?.pinCode,
    ]
      .filter(Boolean)
      .join(', ') || companyDoc?.address || '';

    // Fetch month attendance to ensure only employees with valid attendance records have salary slips displayed
    const attQuery = { companyId };
    if (month) attQuery.date = { $regex: new RegExp(`^${month}`) };
    const monthAttendance = await Attendance.find(attQuery).select('employeeId date status present halfDay late').lean();

    const attendedNormIds = new Set();
    monthAttendance.forEach((a) => {
      if (a.employeeId) attendedNormIds.add(normalizeId(a.employeeId));
    });

    const allEmpsList = await Employee.find({ companyId })
      .select('-documents -documentList -drivingLicenseCopy')
      .lean();
    const attendedEmpIdSet = new Set();
    allEmpsList.forEach((e) => {
      const normId = normalizeId(e.employeeId);
      const normCode = normalizeId(e.employeeCode);
      const normMongoId = normalizeId(e._id);
      if (
        attendedNormIds.has(normId) ||
        attendedNormIds.has(normCode) ||
        attendedNormIds.has(normMongoId)
      ) {
        if (normId) attendedEmpIdSet.add(normId);
        if (normCode) attendedEmpIdSet.add(normCode);
        if (normMongoId) attendedEmpIdSet.add(normMongoId);
      }
    });

    // Query salary slips from database
    const rawSlips = await SalarySlip.find(query).sort({ month: -1, employeeId: 1 });

    // Clean up only the invalid slips whose employee has NO attendance in this month
    if (month && attendedNormIds.size > 0) {
      const invalidSlipIds = rawSlips
        .filter((s) => s.month === month && !attendedEmpIdSet.has(normalizeId(s.employeeId)))
        .map((s) => s._id);

      if (invalidSlipIds.length > 0) {
        await SalarySlip.deleteMany({ _id: { $in: invalidSlipIds } });
      }
    }

    // Filter out slips belonging to employees without attendance
    const slips = rawSlips.filter((s) => {
      if (month && attendedNormIds.size > 0) {
        return attendedEmpIdSet.has(normalizeId(s.employeeId));
      }
      return true;
    });

    const existingMonths = new Set(slips.map((s) => s.month));

    // Also check if live PayrollRun has calculated/approved records for this employee that are not yet in SalarySlip
    const targetEmpId = (user.role === 'employee' ? (user.employeeId || user.id) : (employeeId || '')).toString().trim();
    const synthesizedFromPayroll = [];

    if (targetEmpId) {
      const runQuery = {
        'records.employeeId': { $regex: new RegExp(`^${targetEmpId}$`, 'i') },
      };
      if (month) runQuery.month = month;

      const payrollRuns = await PayrollRun.find(runQuery).sort({ month: -1 });

      for (const pr of payrollRuns) {
        if (!existingMonths.has(pr.month)) {
          const rec = (pr.records || []).find(
            (r) => String(r.employeeId).toLowerCase() === targetEmpId.toLowerCase()
          );
          if (rec && rec.hasAttendance !== false && (rec.paidDays || 0) > 0 && attendedEmpIdSet.has(normalizeId(rec.employeeId))) {
            synthesizedFromPayroll.push({
              _id: `slip-run-${pr.month}-${rec.employeeId}`,
              id: `slip-run-${pr.month}-${rec.employeeId}`,
              companyId: pr.companyId || companyId,
              slipNumber: `PAY-${pr.month.replace('-', '')}-${String(rec.employeeId).replace(/[^A-Za-z0-9]/g, '')}`,
              employeeId: rec.employeeId,
              employeeName: rec.employeeName,
              initials: rec.initials || (rec.employeeName || 'EM').slice(0, 2).toUpperCase(),
              month: pr.month,
              monthLabel: pr.monthLabel || getMonthLabel(pr.month),
              salaryMonth: pr.monthLabel || getMonthLabel(pr.month),
              designation: rec.designation || 'Staff',
              department: rec.department || 'Operations',
              clientName: rec.clientName || 'RR Security',
              site: rec.site || 'Main Site',
              bankName: rec.bankName || '',
              bankAccountNo: rec.bankAccountNo || '',
              pan: rec.pan || '',
              uan: rec.uan || '',
              pfNo: rec.pfNo || '',
              esicNo: rec.esicNo || '',
              workingDays: rec.totalDaysInMonth || 30,
              presentDays: rec.presentDays || 0,
              paidDays: rec.paidDays || 0,
              lopDays: rec.lopDays || 0,
              grossSalary: rec.earnings?.totalGross || 0,
              totalDeductions: rec.deductions?.totalDeductions || 0,
              netSalary: rec.netSalary || 0,
              earningsBreakdown: rec.earnings || {},
              deductionsBreakdown: rec.deductions || {},
              status: pr.approvalStatus === 'Approved' || pr.status === 'Processed' ? 'Generated' : 'Pending',
              generatedDate: pr.approvedAt ? pr.approvedAt.split('T')[0] : (pr.updatedAt ? pr.updatedAt.toISOString().split('T')[0] : ''),
            });
            existingMonths.add(pr.month);
          }
        }
      }
    }

    const allSlips = [...slips.map((s) => s.toJSON()), ...synthesizedFromPayroll].sort((a, b) => (b.month || '').localeCompare(a.month || ''));

    // Fetch statutory configuration & active employees to sanitize any old stale slips
    const statutory = (await resolveStatutoryConfig(companyId, req.user?.email)).config;
    const pfEnabled = statutory?.pf?.enabled !== false;
    const esiEnabled = statutory?.esi?.enabled !== false;
    const ptEnabled = statutory?.pt?.enabled !== false;
    const ptSlabs = statutory?.ptSlabs || [];

    const employees = allEmpsList;
    const empMap = new Map();
    employees.forEach((e) => {
      if (e.employeeId) empMap.set(String(e.employeeId).toLowerCase(), e);
      if (e.employeeCode) empMap.set(String(e.employeeCode).toLowerCase(), e);
    });

    const enrichedSlips = allSlips.map((json) => {
      const empDoc = empMap.get(String(json.employeeId).toLowerCase());
      const earnings = json.earningsBreakdown || json.earnings || {};
      const deductions = { ...(json.deductionsBreakdown || json.deductions || {}) };
      let grossSalary = json.grossSalary || earnings.totalGross || 0;

      if (empDoc) {
        if (!json.bankAccountNo && (empDoc.bankAccountNo || empDoc.accountNumber || empDoc.accountNo)) {
          json.bankAccountNo = empDoc.bankAccountNo || empDoc.accountNumber || empDoc.accountNo;
        }
        if (!json.bankName && empDoc.bankName) {
          json.bankName = empDoc.bankName;
        }
        if (!json.ifscCode && (empDoc.ifscCode || empDoc.ifsc)) {
          json.ifscCode = empDoc.ifscCode || empDoc.ifsc;
        }
        if (!json.pan && empDoc.pan) json.pan = empDoc.pan;
        if (!json.uan && empDoc.uan) json.uan = empDoc.uan;
        if (!json.pfNo && empDoc.pfNo) json.pfNo = empDoc.pfNo;
        if (!json.esicNo && empDoc.esicNo) json.esicNo = empDoc.esicNo;

        const earnedBasic = earnings.basic || 0;
        const earnedVda = earnings.vda || 0;
        const empState = empDoc.state || empDoc.workState || empDoc.siteState || empDoc.siteLocation || empDoc.site || empDoc.presentAddress || empDoc.address || '';

        let modified = false;

        // PF
        const pfCalc = calculatePF(earnedBasic, earnedVda, empDoc, statutory?.pf, earnings, statutory?.salaryComponents);
        if (Number(deductions.pfEmployee || 0) !== pfCalc.employee || Number(deductions.pfEmployer || 0) !== pfCalc.employer) {
          deductions.pfEmployee = pfCalc.employee;
          deductions.pfEmployer = pfCalc.employer;
          modified = true;
        }

        // ESI
        const esiCalc = calculateESI(grossSalary, Number(empDoc.grossSalary) || grossSalary, json.paidDays || 30, empDoc, statutory?.esi, earnings, statutory?.salaryComponents);
        if (Number(deductions.esiEmployee || 0) !== esiCalc.employee || Number(deductions.esiEmployer || 0) !== esiCalc.employer) {
          deductions.esiEmployee = esiCalc.employee;
          deductions.esiEmployer = esiCalc.employer;
          modified = true;
        }

        // PT
        const ptWage4 = computePTWageBase({
          emp: empDoc,
          statutoryPt: statutory?.pt,
          monthlyGross: Number(empDoc.grossSalary) || grossSalary,
          earnedGross: grossSalary,
          monthlyEarnings: { basic: empDoc.basic, vda: empDoc.vda, hra: empDoc.hra, conveyance: empDoc.conveyance, specialAllowance: empDoc.specialAllowance, otherAllowance: empDoc.otherAllowance },
          earnedEarnings: earnings,
          salaryComponentsMaster: statutory?.salaryComponents,
        });
        const correctPt = calculatePT(ptWage4, empState, ptSlabs, json.month, ptEnabled, empDoc.gender);
        if ((Number(deductions.pt) || 0) !== correctPt) {
          deductions.pt = correctPt;
          modified = true;
        }

        // TDS
        const correctTds = calculateTDS(grossSalary, empDoc, statutory?.tds);
        if ((Number(deductions.tds) || 0) !== correctTds) {
          deductions.tds = correctTds;
          modified = true;
        }

        // LWF
        const isLwfApplicable = empDoc.lwfApplicable !== false && String(empDoc.lwfApplicable).toLowerCase() !== 'no';
        const lwfCalc = calculateLWF(grossSalary, empState, statutory?.lwfRules, json.month, isLwfApplicable, statutory?.lwf?.enabled !== false);
        if ((Number(deductions.lwf) || 0) !== lwfCalc.employee) {
          deductions.lwf = lwfCalc.employee;
          modified = true;
        }

        if (modified) {
          const totalDeductions =
            (Number(deductions.pfEmployee) || 0) +
            (Number(deductions.esiEmployee) || 0) +
            (Number(deductions.pt) || 0) +
            (Number(deductions.tds) || 0) +
            (Number(deductions.lwf) || 0) +
            (Number(deductions.advances) || 0) +
            (Number(deductions.loanEmi) || 0) +
            (Number(deductions.otherDeductions) || 0);

          json.totalDeductions = totalDeductions;
          json.netSalary = Math.max(0, grossSalary - totalDeductions);
          json.deductionsBreakdown = deductions;
          json.deductions = deductions;

          // Asynchronously persist the correction back to the SalarySlip collection in MongoDB
          if (json._id && !String(json._id).startsWith('slip-run-')) {
            SalarySlip.findByIdAndUpdate(json._id, {
              $set: {
                totalDeductions,
                netSalary: json.netSalary,
                deductionsBreakdown: deductions,
                bankAccountNo: json.bankAccountNo,
                bankName: json.bankName,
                ifscCode: json.ifscCode,
                pan: json.pan,
                uan: json.uan,
                pfNo: json.pfNo,
                esicNo: json.esicNo,
              },
            }).exec().catch(() => {});
          }
        }
      }

      return {
        ...json,
        salaryMonth: json.monthLabel || (json.month ? getMonthLabel(json.month) : 'Current Month'),
        companyName: json.companyName || companyDoc?.name || 'RR Security & Facilities',
        companyAddress: json.companyAddress || formattedCompAddress,
        companyEmail: json.companyEmail || companyDoc?.email || '',
        companyPhone: json.companyPhone || companyDoc?.phone || '',
        companyGstin: json.companyGstin || companyDoc?.gstin || '',
        companyPan: json.companyPan || companyDoc?.pan || '',
        companyLogo: json.companyLogo || companyDoc?.logo || null,
        earnings,
        deductions,
      };
    });

    // Sequentially assign company PF and ESI codes to all retrieved slips
    applySequentialCompanyStatutoryCodes(enrichedSlips, companyDoc, empMap);

    // Asynchronously synchronize sequential statutory codes back to MongoDB SalarySlip collection
    enrichedSlips.forEach((s) => {
      if (s._id && !String(s._id).startsWith('slip-run-')) {
        SalarySlip.findByIdAndUpdate(s._id, {
          $set: {
            pfNo: s.pfNo,
            pfNumber: s.pfNumber || s.pfNo,
            esicNo: s.esicNo,
            esiNumber: s.esiNumber || s.esicNo,
            employerPfCode: s.employerPfCode,
            employerEsiCode: s.employerEsiCode,
            pfApplicable: s.pfApplicable,
            esiApplicable: s.esiApplicable,
          },
        }).exec().catch(() => {});
      }
    });

    return res.status(200).json({
      success: true,
      count: enrichedSlips.length,
      slips: enrichedSlips,
    });
  } catch (error) {
    console.error('Error fetching salary slips:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch salary slips.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Rate Revisions from MongoDB
 * @route   GET /api/payroll/rate-revisions
 * @access  Private
 */
export const getRateRevisions = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const revisions = await RateRevision.find({ companyId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: revisions.length,
      revisions: revisions.map((r) => r.toJSON()),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch rate revisions.', error: error.message });
  }
};

/**
 * @desc    Create / Update Rate Revision in MongoDB
 * @route   POST /api/payroll/rate-revisions
 * @access  Private (Admin)
 */
export const saveRateRevision = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const data = req.body;

    const revisionId = data.revisionId || `REV-${Date.now()}`;
    const previousGross = Number(data.previousGross) || 0;
    const revisedGross = Number(data.revisedGross) || 0;
    const incrementAmount = Math.max(0, revisedGross - previousGross);
    const incrementPercentage = previousGross > 0 ? Number(((incrementAmount / previousGross) * 100).toFixed(2)) : 0;

    const revision = await RateRevision.findOneAndUpdate(
      { companyId, revisionId },
      {
        $set: {
          companyId,
          revisionId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          designation: data.designation,
          department: data.department,
          clientName: data.clientName,
          previousGross,
          revisedGross,
          incrementAmount,
          incrementPercentage,
          effectiveDate: data.effectiveDate || new Date().toISOString().split('T')[0],
          reason: data.reason || 'Wage Revision',
          approvedBy: user?.name || 'Admin',
          status: data.status || 'Approved',
          remarks: data.remarks || '',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // If applied, update Employee collection gross salary as well
    if (revision.status === 'Approved' || revision.status === 'Applied') {
      await Employee.findOneAndUpdate(
        { companyId, employeeId: data.employeeId },
        {
          $set: {
            grossSalary: revisedGross,
            basic: Math.round(revisedGross * 0.5),
            hra: Math.round(revisedGross * 0.2),
            vda: Math.round(revisedGross * 0.15),
            otherAllowance: Math.round(revisedGross * 0.15),
            salaryEffectiveFrom: data.effectiveDate,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: '✓ Rate revision saved and employee salary updated in database.',
      revision: revision.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save rate revision.', error: error.message });
  }
};

/**
 * @desc    Delete Rate Revision from MongoDB
 * @route   DELETE /api/payroll/rate-revisions/:id
 * @access  Private (Admin)
 */
export const deleteRateRevision = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;

    await RateRevision.deleteOne({ companyId, $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { revisionId: id }] });
    return res.status(200).json({ success: true, message: '✓ Rate revision deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete rate revision.', error: error.message });
  }
};

/**
 * @desc    Get Arrears from MongoDB
 * @route   GET /api/payroll/arrears
 * @access  Private
 */
export const getArrears = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const arrears = await Arrear.find({ companyId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: arrears.length,
      arrears: arrears.map((a) => a.toJSON()),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch arrears.', error: error.message });
  }
};

/**
 * @desc    Save Arrear Record in MongoDB
 * @route   POST /api/payroll/arrears
 * @access  Private (Admin)
 */
export const saveArrear = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const data = req.body;

    const arrearId = data.arrearId || `ARR-${Date.now()}`;
    const monthlyDifference = Number(data.monthlyDifference) || 0;
    const monthsCount = Number(data.monthsCount) || 1;
    const totalArrearAmount = Number(data.totalArrearAmount) || (monthlyDifference * monthsCount);

    const arrear = await Arrear.findOneAndUpdate(
      { companyId, arrearId },
      {
        $set: {
          companyId,
          arrearId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          designation: data.designation,
          department: data.department,
          fromMonth: data.fromMonth,
          toMonth: data.toMonth,
          monthsCount,
          monthlyDifference,
          totalArrearAmount,
          disbursementMonth: data.disbursementMonth,
          reason: data.reason || 'Retrospective Wage Revision',
          status: data.status || 'Pending',
          approvedBy: user?.name || 'Admin',
          remarks: data.remarks || '',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: '✓ Arrear calculation saved to database.',
      arrear: arrear.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save arrear record.', error: error.message });
  }
};

/**
 * @desc    Delete Arrear Record from MongoDB
 * @route   DELETE /api/payroll/arrears/:id
 * @access  Private (Admin)
 */
export const deleteArrear = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;

    await Arrear.deleteOne({ companyId, $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { arrearId: id }] });
    return res.status(200).json({ success: true, message: '✓ Arrear record deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete arrear record.', error: error.message });
  }
};

/**
 * @desc    Delete a Salary Slip from MongoDB
 * @route   DELETE /api/payroll/salary-slips/:id
 * @access  Private (Admin, Superadmin, HR)
 */
export const deleteSalarySlip = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;

    const query = { companyId };
    if (mongoose.isValidObjectId(id)) {
      query._id = id;
    } else {
      query.$or = [{ slipNumber: id }, { employeeId: id }];
    }

    const deleted = await SalarySlip.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Salary slip not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Salary slip deleted successfully from database.',
    });
  } catch (error) {
    console.error('Error deleting salary slip:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete salary slip.', error: error.message });
  }
};

