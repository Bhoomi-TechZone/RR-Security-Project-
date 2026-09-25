// NovaSpark HRMS — Mock Payroll Setup Configuration Data

export const mockPaySchedules = [
  {
    id: 'ps-1',
    name: 'Monthly Payroll',
    description: 'Standard monthly payroll processing schedule for regular on-site security and administration staff',
    status: 'active'
  },
  {
    id: 'ps-2',
    name: 'Weekly Payroll',
    description: 'Weekly payroll schedule for short-term temporary manpower and daily wages',
    status: 'active'
  },
  {
    id: 'ps-3',
    name: 'Bi-Weekly Payroll',
    description: 'Fortnightly payout schedule processed every 14 days',
    status: 'active'
  },
  {
    id: 'ps-4',
    name: 'Daily Wage Settlement',
    description: 'Ad-hoc daily payment schedule for spot-hired event security guards',
    status: 'inactive'
  }
];

export const mockPayCycles = [
  {
    id: 'pc-1',
    name: 'Standard Monthly (1st to End of Month)',
    frequency: 'Monthly',
    cycleStartDay: 1,
    cycleEndDay: 31,
    description: 'Full calendar month cycle from 1st day to last calendar day of the month',
    status: 'active'
  },
  {
    id: 'pc-2',
    name: 'Mid-Month Cutoff (26th to 25th)',
    frequency: 'Monthly',
    cycleStartDay: 26,
    cycleEndDay: 25,
    description: 'Attendance & overtime cutoff from 26th of previous month to 25th of current month',
    status: 'active'
  },
  {
    id: 'pc-3',
    name: 'Standard Weekly (Monday to Sunday)',
    frequency: 'Weekly',
    cycleStartDay: 1,
    cycleEndDay: 7,
    description: '7-day weekly roster cycle beginning every Monday morning',
    status: 'active'
  },
  {
    id: 'pc-4',
    name: 'Bi-Weekly 14-Day Cycle',
    frequency: 'Bi-Weekly',
    cycleStartDay: 1,
    cycleEndDay: 14,
    description: 'Two-week cycle starting 1st and 15th of the calendar month',
    status: 'active'
  }
];

export const mockPayDayConfigs = [
  {
    id: 'pd-1',
    name: '7th of Every Month',
    payDayType: 'Fixed Day',
    fixedDay: 7,
    description: 'Salary disbursement on the 7th of every month. If holiday, processed prior.',
    status: 'active'
  },
  {
    id: 'pd-2',
    name: 'Last Working Day',
    payDayType: 'Last Working Day',
    fixedDay: null,
    description: 'Disbursed on the last official working day before month end.',
    status: 'active'
  },
  {
    id: 'pd-3',
    name: '10th of Every Month',
    payDayType: 'Fixed Day',
    fixedDay: 10,
    description: 'Payout on 10th of every month for contract workers.',
    status: 'active'
  },
  {
    id: 'pd-4',
    name: 'Last Calendar Day',
    payDayType: 'Last Calendar Day',
    fixedDay: null,
    description: 'Disbursed directly on 28th/30th/31st calendar close date.',
    status: 'inactive'
  }
];

export const mockSalaryCalculationMethods = [
  {
    id: 'scm-1',
    name: 'Calendar Days Basis',
    code: 'CAL_DAYS',
    formula: 'Per Day Salary = Monthly Gross / Total Days in Month (28/29/30/31)',
    description: 'Calculates per-day salary by dividing fixed gross by total days in the month. Standard industry practice for monthly salaried workforce.',
    status: 'active',
    isDefault: true
  },
  {
    id: 'scm-2',
    name: 'Working Days Basis (26 Days)',
    code: 'WORK_DAYS_26',
    formula: 'Per Day Salary = Monthly Gross / Fixed 26 Days',
    description: 'Calculates daily rate on a fixed 26 working days basis excluding weekly off days as per Minimum Wages Act guidelines.',
    status: 'active',
    isDefault: false
  },
  {
    id: 'scm-3',
    name: 'Actual Attendance Days',
    code: 'ACTUAL_ATTENDANCE',
    formula: 'Payout = (Daily Rate × Present Days) + Paid Leaves',
    description: 'Strict pay calculation where salary is strictly prorated for each verified check-in shift and approved paid leave balance.',
    status: 'active',
    isDefault: false
  }
];

export const mockPayGroups = [
  {
    id: 'pg-1',
    name: 'Monthly Security Guard Staff',
    code: 'PG-SEC-01',
    paySchedule: 'Monthly Payroll',
    payCycle: 'Standard Monthly (1st to End of Month)',
    payDay: 'Fixed Day (7th of Month)',
    salaryCalculationMethod: 'Calendar Days Basis',
    salaryComponentIds: ['sal-1', 'sal-2', 'sal-3', 'sal-4', 'sal-5', 'sal-6', 'sal-7', 'sal-8', 'sal-10'],
    description: 'Primary pay group for on-site security guards, supervisors, and gate operators',
    employeeCount: 840,
    status: 'active'
  },
  {
    id: 'pg-2',
    name: 'Corporate & Office Staff',
    code: 'PG-OFF-02',
    paySchedule: 'Monthly Payroll',
    payCycle: 'Standard Monthly (1st to End of Month)',
    payDay: 'Last Working Day',
    salaryCalculationMethod: 'Calendar Days Basis',
    salaryComponentIds: ['sal-1', 'sal-2', 'sal-3', 'sal-4', 'sal-6', 'sal-8', 'sal-9'],
    description: 'Pay structure for head office executives, HR, accounts, and branch managers',
    employeeCount: 95,
    status: 'active'
  },
  {
    id: 'pg-3',
    name: 'Weekly Contract Manpower',
    code: 'PG-CONT-03',
    paySchedule: 'Weekly Payroll',
    payCycle: 'Standard Weekly (Monday to Sunday)',
    payDay: 'Fixed Day (10th of Month)',
    salaryCalculationMethod: 'Working Days Basis (26 Days)',
    salaryComponentIds: ['sal-1', 'sal-3', 'sal-5', 'sal-7', 'sal-10'],
    description: 'Short-tenure workforce and temporary event deployment manpower',
    employeeCount: 160,
    status: 'active'
  },
  {
    id: 'pg-4',
    name: 'Executive & Facility In-Charge',
    code: 'PG-EXEC-04',
    paySchedule: 'Monthly Payroll',
    payCycle: 'Standard Monthly (1st to End of Month)',
    payDay: 'Last Working Day',
    salaryCalculationMethod: 'Calendar Days Basis',
    salaryComponentIds: ['sal-1', 'sal-2', 'sal-4', 'sal-6', 'sal-8', 'sal-9'],
    description: 'Senior facility directors and regional operations managers',
    employeeCount: 22,
    status: 'active'
  }
];
