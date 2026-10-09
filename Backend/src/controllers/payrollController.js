import mongoose from 'mongoose';
import { PayrollRun, SalarySlip, RateRevision, Arrear } from '../models/payrollModel.js';
import Employee from '../models/employeeModel.js';
import Attendance from '../models/attendanceModel.js';
import StatutoryConfig from '../models/statutoryModel.js';

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

// Helper to calculate PT for an employee gross salary & state
const calculatePT = (gross, state, ptSlabs = []) => {
  if (!Array.isArray(ptSlabs) || ptSlabs.length === 0) return 200;
  const stateSlabs = ptSlabs.filter((s) => s.status === 'active' && s.state?.toLowerCase() === (state || '').toLowerCase());
  const slabsToUse = stateSlabs.length > 0 ? stateSlabs : ptSlabs.filter((s) => s.state === 'Maharashtra');
  
  for (const slab of slabsToUse) {
    if (gross >= slab.minSalary && gross <= slab.maxSalary) {
      return slab.taxAmount || 0;
    }
  }
  return 200;
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
      }).sort({ employeeId: 1 });

      const totalDaysInMonth = getDaysInMonthString(month);

      // Fetch month attendance records
      const attendanceList = await Attendance.find({
        companyId,
        date: { $regex: new RegExp(`^${month}`) },
      });

      // Fetch Statutory Configuration
      const statutory = await StatutoryConfig.findOne({ companyId });
      const pfEnabled = statutory?.pf?.enabled !== false;
      const esiEnabled = statutory?.esi?.enabled !== false;
      const ptEnabled = statutory?.pt?.enabled !== false;
      const ptSlabs = statutory?.ptSlabs || [];

      const records = [];

      for (const emp of employees) {
        // Match attendance for this employee
        const empAtt = attendanceList.filter(
          (a) => a.employeeId === emp.employeeId || a.employeeId === emp.employeeCode
        );

        let presentDays = 0;
        let weekOffDays = 0;
        let holidayDays = 0;
        let paidLeaves = 0;
        let lopDays = 0;
        let overtimeHours = 0;

        if (empAtt.length > 0) {
          // If aggregated monthly records exist
          empAtt.forEach((a) => {
            if (a.present !== undefined) presentDays += Number(a.present) || 0;
            if (a.weekOff !== undefined) weekOffDays += Number(a.weekOff) || 0;
            if (a.holidays !== undefined) holidayDays += Number(a.holidays) || 0;
            if (a.cl !== undefined) paidLeaves += Number(a.cl) || 0;
            if (a.sl !== undefined) paidLeaves += Number(a.sl) || 0;
            if (a.el !== undefined) paidLeaves += Number(a.el) || 0;
            if (a.lwp !== undefined) lopDays += Number(a.lwp) || 0;
          });
        }

        const totalPaidDays = Math.min(
          totalDaysInMonth,
          presentDays + weekOffDays + holidayDays + paidLeaves > 0
            ? presentDays + weekOffDays + holidayDays + paidLeaves
            : totalDaysInMonth
        );

        const calculatedLop = Math.max(0, totalDaysInMonth - totalPaidDays);

        // Salary components from Employee Master
        const monthlyGross = Number(emp.grossSalary) || 25000;
        const basic = Number(emp.basic) || Math.round(monthlyGross * 0.5);
        const hra = Number(emp.hra) || Math.round(monthlyGross * 0.2);
        const vda = Number(emp.vda) || Math.round(monthlyGross * 0.15);
        const otherAllowance = Number(emp.otherAllowance) || Math.max(0, monthlyGross - (basic + hra + vda));
        const overtimeRate = Number(emp.overtimeRate) || Math.round((monthlyGross / totalDaysInMonth / 8) * 1.5);
        const overtimePay = Math.round(overtimeHours * overtimeRate);

        // Pro-rate earnings by paid days
        const ratio = totalPaidDays / totalDaysInMonth;
        const earnedBasic = Math.round(basic * ratio);
        const earnedHra = Math.round(hra * ratio);
        const earnedVda = Math.round(vda * ratio);
        const earnedOther = Math.round(otherAllowance * ratio);
        const earnedGross = earnedBasic + earnedHra + earnedVda + earnedOther + overtimePay;

        // Statutory Deductions
        let pfEmployee = 0;
        let pfEmployer = 0;
        if (pfEnabled && emp.pfApplicable !== false && emp.pfApplicable !== 'No') {
          const pfWage = Math.min(earnedBasic + earnedVda, statutory?.pf?.wageCeiling || 15000);
          pfEmployee = Math.round(pfWage * ((statutory?.pf?.employeeContribution || 12) / 100));
          pfEmployer = Math.round(pfWage * ((statutory?.pf?.employerContribution || 12) / 100));
        }

        let esiEmployee = 0;
        let esiEmployer = 0;
        if (esiEnabled && emp.esiApplicable !== false && emp.esiApplicable !== 'No' && monthlyGross <= (statutory?.esi?.wageEligibilityLimit || 21000)) {
          esiEmployee = Math.round(earnedGross * ((statutory?.esi?.employeeContribution || 0.75) / 100));
          esiEmployer = Math.round(earnedGross * ((statutory?.esi?.employerContribution || 3.25) / 100));
        }

        let pt = 0;
        if (ptEnabled) {
          pt = calculatePT(earnedGross, emp.siteLocation || emp.site || 'Maharashtra', ptSlabs);
        }

        const tds = emp.tdsApplicable === true ? Math.round(earnedGross * 0.05) : 0;
        const totalDeductions = pfEmployee + esiEmployee + pt + tds;
        const netSalary = Math.max(0, earnedGross - totalDeductions);

        const initials =
          (emp.name || emp.employeeName || 'EM')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'EM';

        records.push({
          id: `pay-${emp.employeeId || emp._id}`,
          employeeId: emp.employeeId || emp.employeeCode,
          employeeName: emp.name || emp.employeeName,
          initials,
          designation: emp.designation || 'Staff',
          department: emp.department || 'Operations',
          clientName: emp.clientName || 'RR Security Services',
          companyName: emp.companyName || 'RR Security Services',
          site: emp.site || emp.siteLocation || 'Main Site',
          dutyPost: emp.dutyPost || '',
          joiningDate: emp.joiningDate || '',
          pan: emp.pan || '',
          uan: emp.uan || '',
          pfNo: emp.pfNo || '',
          esicNo: emp.esicNo || '',
          bankName: emp.bankName || '',
          bankAccountNo: emp.bankAccountNo || emp.accountNo || '',
          ifscCode: emp.ifscCode || '',
          totalDaysInMonth,
          presentDays: presentDays || totalPaidDays,
          paidDays: totalPaidDays,
          lopDays: calculatedLop,
          overtimeHours,
          overtimeRate,
          overtimePay,
          earnings: {
            basic: earnedBasic,
            vda: earnedVda,
            hra: earnedHra,
            conveyance: 0,
            otherAllowance: earnedOther,
            specialAllowance: 0,
            bonus: 0,
            overtime: overtimePay,
            arrears: 0,
            totalGross: earnedGross,
          },
          deductions: {
            pfEmployee,
            pfEmployer,
            esiEmployee,
            esiEmployer,
            pt,
            tds,
            lwf: 0,
            advances: 0,
            loanEmi: 0,
            otherDeductions: 0,
            totalDeductions,
          },
          netSalary,
          status: 'Calculated',
          remarks: '',
        });
      }

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
      records: payrollRun.records,
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

    let calculatedRecords = reqRecords;

    if (!Array.isArray(calculatedRecords) || calculatedRecords.length === 0) {
      // Pull and calculate from MongoDB database
      const employees = await Employee.find({
        companyId,
        status: { $regex: /^active$/i },
      });

      const totalDaysInMonth = getDaysInMonthString(month);
      const attendanceList = await Attendance.find({
        companyId,
        date: { $regex: new RegExp(`^${month}`) },
      });

      const statutory = await StatutoryConfig.findOne({ companyId });
      const pfEnabled = statutory?.pf?.enabled !== false;
      const esiEnabled = statutory?.esi?.enabled !== false;
      const ptEnabled = statutory?.pt?.enabled !== false;
      const ptSlabs = statutory?.ptSlabs || [];

      calculatedRecords = employees.map((emp) => {
        const empAtt = attendanceList.filter((a) => a.employeeId === emp.employeeId);
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

        const totalPaidDays = Math.min(
          totalDaysInMonth,
          presentDays + weekOffDays + holidayDays + paidLeaves > 0
            ? presentDays + weekOffDays + holidayDays + paidLeaves
            : totalDaysInMonth
        );

        const monthlyGross = Number(emp.grossSalary) || 25000;
        const basic = Number(emp.basic) || Math.round(monthlyGross * 0.5);
        const hra = Number(emp.hra) || Math.round(monthlyGross * 0.2);
        const vda = Number(emp.vda) || Math.round(monthlyGross * 0.15);
        const otherAllowance = Number(emp.otherAllowance) || Math.max(0, monthlyGross - (basic + hra + vda));

        const ratio = totalPaidDays / totalDaysInMonth;
        const earnedBasic = Math.round(basic * ratio);
        const earnedHra = Math.round(hra * ratio);
        const earnedVda = Math.round(vda * ratio);
        const earnedOther = Math.round(otherAllowance * ratio);
        const earnedGross = earnedBasic + earnedHra + earnedVda + earnedOther;

        let pfEmployee = 0;
        let pfEmployer = 0;
        if (pfEnabled && emp.pfApplicable !== false && emp.pfApplicable !== 'No') {
          const pfWage = Math.min(earnedBasic + earnedVda, statutory?.pf?.wageCeiling || 15000);
          pfEmployee = Math.round(pfWage * 0.12);
          pfEmployer = Math.round(pfWage * 0.12);
        }

        let esiEmployee = 0;
        let esiEmployer = 0;
        if (esiEnabled && emp.esiApplicable !== false && emp.esiApplicable !== 'No' && monthlyGross <= (statutory?.esi?.wageEligibilityLimit || 21000)) {
          esiEmployee = Math.round(earnedGross * 0.0075);
          esiEmployer = Math.round(earnedGross * 0.0325);
        }

        let pt = 0;
        if (ptEnabled) {
          pt = calculatePT(earnedGross, emp.siteLocation || emp.site || 'Maharashtra', ptSlabs);
        }

        const totalDeductions = pfEmployee + esiEmployee + pt;
        const netSalary = Math.max(0, earnedGross - totalDeductions);

        return {
          id: `pay-${emp.employeeId}`,
          employeeId: emp.employeeId,
          employeeName: emp.name,
          designation: emp.designation || 'Staff',
          department: emp.department || 'Operations',
          clientName: emp.clientName || 'RR Security',
          site: emp.site || 'Main Site',
          totalDaysInMonth,
          presentDays: presentDays || totalPaidDays,
          paidDays: totalPaidDays,
          lopDays: Math.max(0, totalDaysInMonth - totalPaidDays),
          overtimeHours: 0,
          overtimeRate: 0,
          overtimePay: 0,
          earnings: {
            basic: earnedBasic,
            vda: earnedVda,
            hra: earnedHra,
            conveyance: 0,
            otherAllowance: earnedOther,
            specialAllowance: 0,
            bonus: 0,
            overtime: 0,
            arrears: 0,
            totalGross: earnedGross,
          },
          deductions: {
            pfEmployee,
            pfEmployer,
            esiEmployee,
            esiEmployer,
            pt,
            tds: 0,
            lwf: 0,
            advances: 0,
            loanEmi: 0,
            otherDeductions: 0,
            totalDeductions,
          },
          netSalary,
          status: 'Calculated',
          remarks: '',
        };
      });
    }

    const totalGross = calculatedRecords.reduce((sum, r) => sum + (r.earnings?.totalGross || 0), 0);
    const totalDeductions = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.totalDeductions || 0), 0);
    const totalNet = calculatedRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const totalOvertime = calculatedRecords.reduce((sum, r) => sum + (r.earnings?.overtime || 0), 0);
    const totalPF = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.pfEmployee || 0), 0);
    const totalESI = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.esiEmployee || 0), 0);
    const totalPT = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.pt || 0), 0);
    const totalTDS = calculatedRecords.reduce((sum, r) => sum + (r.deductions?.tds || 0), 0);

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
          records: calculatedRecords,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
      { new: true }
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
 * @desc    Generate Salary Slips in MongoDB for all employees in a monthly payroll
 * @route   POST /api/payroll/generate-slips
 * @access  Private (Admin)
 */
export const generateSalarySlips = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { month } = req.body;

    const payrollRun = await PayrollRun.findOne({ companyId, month });
    if (!payrollRun || !payrollRun.records || payrollRun.records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payroll records found for this month. Please run payroll calculation first.',
      });
    }

    const createdSlips = [];
    const generatedDate = new Date().toISOString().split('T')[0];

    for (let i = 0; i < payrollRun.records.length; i++) {
      const rec = payrollRun.records[i];
      const slipNumber = `SLIP-${month.replace('-', '')}-${String(rec.employeeId || i + 1).padStart(4, '0')}`;

      const slip = await SalarySlip.findOneAndUpdate(
        { companyId, employeeId: rec.employeeId, month },
        {
          $set: {
            companyId,
            slipNumber,
            employeeId: rec.employeeId,
            employeeName: rec.employeeName,
            month,
            monthLabel: getMonthLabel(month),
            designation: rec.designation,
            department: rec.department,
            clientName: rec.clientName,
            site: rec.site,
            bankName: rec.bankName,
            bankAccountNo: rec.bankAccountNo,
            pan: rec.pan,
            uan: rec.uan,
            pfNo: rec.pfNo,
            esicNo: rec.esicNo,
            workingDays: rec.totalDaysInMonth,
            presentDays: rec.presentDays,
            paidDays: rec.paidDays,
            lopDays: rec.lopDays,
            grossSalary: rec.earnings?.totalGross || 0,
            totalDeductions: rec.deductions?.totalDeductions || 0,
            netSalary: rec.netSalary || 0,
            earningsBreakdown: rec.earnings || {},
            deductionsBreakdown: rec.deductions || {},
            status: 'Generated',
            generatedDate,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      createdSlips.push(slip.toJSON());
    }

    return res.status(200).json({
      success: true,
      message: `✓ Generated ${createdSlips.length} salary slips for ${getMonthLabel(month)} successfully!`,
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
    const { month, employeeId, search } = req.query;

    const query = { companyId };
    if (month) query.month = month;
    if (employeeId) query.employeeId = employeeId;
    if (user.role === 'employee') {
      query.employeeId = user.employeeId || user.id;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ employeeName: searchRegex }, { employeeId: searchRegex }, { slipNumber: searchRegex }];
    }

    const slips = await SalarySlip.find(query).sort({ month: -1, employeeId: 1 });

    return res.status(200).json({
      success: true,
      count: slips.length,
      slips: slips.map((s) => s.toJSON()),
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
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
