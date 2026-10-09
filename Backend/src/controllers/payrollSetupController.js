import {
  PayGroup,
  PaySchedule,
  PayCycle,
  PayDayConfig,
  SalaryCalculationMethod
} from '../models/payrollSetupModel.js';

/**
 * Seed initial payroll setup defaults for a company if not yet created
 */
const seedDefaultPayrollSetup = async (companyId) => {
  const scheduleCount = await PaySchedule.countDocuments({ companyId });
  if (scheduleCount === 0) {
    await PaySchedule.insertMany([
      {
        companyId,
        name: 'Monthly Payroll',
        description: 'Standard monthly payroll processing schedule for regular on-site security and administration staff',
        status: 'active'
      },
      {
        companyId,
        name: 'Weekly Payroll',
        description: 'Weekly payroll schedule for short-term temporary manpower and daily wages',
        status: 'active'
      },
      {
        companyId,
        name: 'Bi-Weekly Payroll',
        description: 'Fortnightly payout schedule processed every 14 days',
        status: 'active'
      },
      {
        companyId,
        name: 'Daily Wage Settlement',
        description: 'Ad-hoc daily payment schedule for spot-hired event security guards',
        status: 'inactive'
      }
    ]);
  }

  const cycleCount = await PayCycle.countDocuments({ companyId });
  if (cycleCount === 0) {
    await PayCycle.insertMany([
      {
        companyId,
        name: 'Standard Monthly (1st to End of Month)',
        frequency: 'Monthly',
        cycleStartDay: 1,
        cycleEndDay: 31,
        description: 'Full calendar month cycle from 1st day to last calendar day of the month',
        status: 'active'
      },
      {
        companyId,
        name: 'Mid-Month Cutoff (26th to 25th)',
        frequency: 'Monthly',
        cycleStartDay: 26,
        cycleEndDay: 25,
        description: 'Attendance & overtime cutoff from 26th of previous month to 25th of current month',
        status: 'active'
      },
      {
        companyId,
        name: 'Standard Weekly (Monday to Sunday)',
        frequency: 'Weekly',
        cycleStartDay: 1,
        cycleEndDay: 7,
        description: '7-day weekly roster cycle beginning every Monday morning',
        status: 'active'
      },
      {
        companyId,
        name: 'Bi-Weekly 14-Day Cycle',
        frequency: 'Bi-Weekly',
        cycleStartDay: 1,
        cycleEndDay: 14,
        description: 'Two-week cycle starting 1st and 15th of the calendar month',
        status: 'active'
      }
    ]);
  }

  const payDayCount = await PayDayConfig.countDocuments({ companyId });
  if (payDayCount === 0) {
    await PayDayConfig.insertMany([
      {
        companyId,
        name: '7th of Every Month',
        payDayType: 'Fixed Day',
        fixedDay: 7,
        description: 'Salary disbursement on the 7th of every month. If holiday, processed prior.',
        status: 'active'
      },
      {
        companyId,
        name: 'Last Working Day',
        payDayType: 'Last Working Day',
        fixedDay: null,
        description: 'Disbursed on the last official working day before month end.',
        status: 'active'
      },
      {
        companyId,
        name: '10th of Every Month',
        payDayType: 'Fixed Day',
        fixedDay: 10,
        description: 'Payout on 10th of every month for contract workers.',
        status: 'active'
      },
      {
        companyId,
        name: 'Last Calendar Day',
        payDayType: 'Last Calendar Day',
        fixedDay: null,
        description: 'Disbursed directly on 28th/30th/31st calendar close date.',
        status: 'inactive'
      }
    ]);
  }

  const calcCount = await SalaryCalculationMethod.countDocuments({ companyId });
  if (calcCount === 0) {
    await SalaryCalculationMethod.insertMany([
      {
        companyId,
        name: 'Calendar Days Basis',
        code: 'CAL_DAYS',
        formula: 'Per Day Salary = Monthly Gross / Total Days in Month (28/29/30/31)',
        description: 'Calculates per-day salary by dividing fixed gross by total days in the month. Standard industry practice for monthly salaried workforce.',
        status: 'active',
        isDefault: true
      },
      {
        companyId,
        name: 'Working Days Basis (26 Days)',
        code: 'WORK_DAYS_26',
        formula: 'Per Day Salary = Monthly Gross / Fixed 26 Days',
        description: 'Calculates daily rate on a fixed 26 working days basis excluding weekly off days as per Minimum Wages Act guidelines.',
        status: 'active',
        isDefault: false
      },
      {
        companyId,
        name: 'Actual Attendance Days',
        code: 'ACTUAL_ATTENDANCE',
        formula: 'Payout = (Daily Rate × Present Days) + Paid Leaves',
        description: 'Strict pay calculation where salary is strictly prorated for each verified check-in shift and approved paid leave balance.',
        status: 'active',
        isDefault: false
      }
    ]);
  }

  const groupCount = await PayGroup.countDocuments({ companyId });
  if (groupCount === 0) {
    await PayGroup.insertMany([
      {
        companyId,
        name: 'Monthly Security Guard Staff',
        code: 'PG-SEC-01',
        paySchedule: 'Monthly Payroll',
        payCycle: 'Standard Monthly (1st to End of Month)',
        payDay: '7th of Every Month',
        salaryCalculationMethod: 'Calendar Days Basis',
        salaryComponentIds: ['sal-1', 'sal-2', 'sal-3', 'sal-4', 'sal-5', 'sal-6', 'sal-7', 'sal-8', 'sal-10'],
        description: 'Primary pay group for on-site security guards, supervisors, and gate operators',
        employeeCount: 0,
        status: 'active'
      },
      {
        companyId,
        name: 'Corporate & Office Staff',
        code: 'PG-OFF-02',
        paySchedule: 'Monthly Payroll',
        payCycle: 'Standard Monthly (1st to End of Month)',
        payDay: 'Last Working Day',
        salaryCalculationMethod: 'Calendar Days Basis',
        salaryComponentIds: ['sal-1', 'sal-2', 'sal-3', 'sal-4', 'sal-6', 'sal-8', 'sal-9'],
        description: 'Pay structure for head office executives, HR, accounts, and branch managers',
        employeeCount: 0,
        status: 'active'
      },
      {
        companyId,
        name: 'Weekly Contract Manpower',
        code: 'PG-CONT-03',
        paySchedule: 'Weekly Payroll',
        payCycle: 'Standard Weekly (Monday to Sunday)',
        payDay: '10th of Every Month',
        salaryCalculationMethod: 'Working Days Basis (26 Days)',
        salaryComponentIds: ['sal-1', 'sal-3', 'sal-5', 'sal-7', 'sal-10'],
        description: 'Short-tenure workforce and temporary event deployment manpower',
        employeeCount: 0,
        status: 'active'
      },
      {
        companyId,
        name: 'Executive & Facility In-Charge',
        code: 'PG-EXEC-04',
        paySchedule: 'Monthly Payroll',
        payCycle: 'Standard Monthly (1st to End of Month)',
        payDay: 'Last Working Day',
        salaryCalculationMethod: 'Calendar Days Basis',
        salaryComponentIds: ['sal-1', 'sal-2', 'sal-4', 'sal-6', 'sal-8', 'sal-9'],
        description: 'Senior facility directors and regional operations managers',
        employeeCount: 0,
        status: 'active'
      }
    ]);
  }
};

/**
 * @desc    Get all payroll setup configurations for company
 * @route   GET /api/payroll-setup
 * @access  Private
 */
export const getPayrollSetup = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';

    // Ensure company defaults exist in database
    await seedDefaultPayrollSetup(companyId);

    const [payGroups, schedules, cycles, payDays, calculationMethods] = await Promise.all([
      PayGroup.find({ companyId }).sort({ createdAt: -1 }),
      PaySchedule.find({ companyId }).sort({ createdAt: 1 }),
      PayCycle.find({ companyId }).sort({ createdAt: 1 }),
      PayDayConfig.find({ companyId }).sort({ createdAt: 1 }),
      SalaryCalculationMethod.find({ companyId }).sort({ createdAt: 1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        payGroups,
        schedules,
        cycles,
        payDays,
        calculationMethods
      }
    });
  } catch (error) {
    console.error('Error in getPayrollSetup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== PAY GROUPS ===================
export const createPayGroup = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || 'RRS8392014SEC';
    const body = req.body;

    if (!body.name || !body.code) {
      return res.status(400).json({ success: false, message: 'Pay Group Name and Code are required' });
    }

    const payGroup = new PayGroup({
      companyId,
      name: body.name.trim(),
      code: body.code.trim().toUpperCase(),
      paySchedule: body.paySchedule || 'Monthly Payroll',
      payCycle: body.payCycle || 'Standard Monthly (1st to End of Month)',
      payDay: body.payDay || '7th of Every Month',
      salaryCalculationMethod: body.salaryCalculationMethod || 'Calendar Days Basis',
      salaryComponentIds: body.salaryComponentIds || [],
      description: body.description || '',
      employeeCount: Number(body.employeeCount) || 0,
      status: body.status || 'active'
    });

    const saved = await payGroup.save();
    res.status(201).json({ success: true, message: 'Pay group created successfully', data: saved });
  } catch (error) {
    console.error('Error creating pay group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const updated = await PayGroup.findOneAndUpdate(
      { _id: id, companyId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Pay group not found' });
    res.status(200).json({ success: true, message: 'Pay group updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating pay group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePayGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const deleted = await PayGroup.findOneAndDelete({ _id: id, companyId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Pay group not found' });
    res.status(200).json({ success: true, message: 'Pay group deleted successfully' });
  } catch (error) {
    console.error('Error deleting pay group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== PAY SCHEDULES ===================
export const createPaySchedule = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || 'RRS8392014SEC';
    const { name, description, status } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Schedule name is required' });

    const schedule = new PaySchedule({
      companyId,
      name: name.trim(),
      description: description || '',
      status: status || 'active'
    });

    const saved = await schedule.save();
    res.status(201).json({ success: true, message: 'Pay schedule created successfully', data: saved });
  } catch (error) {
    console.error('Error creating pay schedule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaySchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const updated = await PaySchedule.findOneAndUpdate(
      { _id: id, companyId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Pay schedule not found' });
    res.status(200).json({ success: true, message: 'Pay schedule updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating pay schedule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== PAY CYCLES ===================
export const createPayCycle = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || 'RRS8392014SEC';
    const { name, frequency, cycleStartDay, cycleEndDay, description, status } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Pay cycle name is required' });

    const cycle = new PayCycle({
      companyId,
      name: name.trim(),
      frequency: frequency || 'Monthly',
      cycleStartDay: Number(cycleStartDay) || 1,
      cycleEndDay: Number(cycleEndDay) || 31,
      description: description || '',
      status: status || 'active'
    });

    const saved = await cycle.save();
    res.status(201).json({ success: true, message: 'Pay cycle created successfully', data: saved });
  } catch (error) {
    console.error('Error creating pay cycle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const updated = await PayCycle.findOneAndUpdate(
      { _id: id, companyId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Pay cycle not found' });
    res.status(200).json({ success: true, message: 'Pay cycle updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating pay cycle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== PAY DAYS ===================
export const createPayDay = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || 'RRS8392014SEC';
    const { name, payDayType, fixedDay, description, status } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Pay day name is required' });

    const payDay = new PayDayConfig({
      companyId,
      name: name.trim(),
      payDayType: payDayType || 'Fixed Day',
      fixedDay: fixedDay ? Number(fixedDay) : null,
      description: description || '',
      status: status || 'active'
    });

    const saved = await payDay.save();
    res.status(201).json({ success: true, message: 'Pay day rule created successfully', data: saved });
  } catch (error) {
    console.error('Error creating pay day:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayDay = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const updated = await PayDayConfig.findOneAndUpdate(
      { _id: id, companyId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Pay day rule not found' });
    res.status(200).json({ success: true, message: 'Pay day rule updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating pay day:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== CALCULATION METHODS ===================
export const setDefaultCalculationMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    // Remove isDefault from all methods for company
    await SalaryCalculationMethod.updateMany({ companyId }, { $set: { isDefault: false } });

    // Set selected as default
    const updated = await SalaryCalculationMethod.findOneAndUpdate(
      { _id: id, companyId },
      { $set: { isDefault: true, status: 'active' } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Calculation method not found' });
    res.status(200).json({ success: true, message: 'Default calculation method updated', data: updated });
  } catch (error) {
    console.error('Error setting default calculation method:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
