// NovaSpark HRMS — Employee Salary Slip Data (EMP001 – Rahul Kumar)
// Extends the existing payroll data pattern.
// DO NOT duplicate payrollData.js or salarySlipData.js wholesale.
// This file provides multi-month history for the Employee Panel.

import { mockSalarySlips } from './salarySlipData';

// Filter the August 2026 slip from the shared data (it already covers EMP001)
const aug2026Slip = mockSalarySlips.find((s) => s.employeeId === 'EMP001') || null;

// Additional historical months for EMP001
const historicalSlips = [
  {
    id: 'emp-slip-jul-2026',
    slipNumber: 'NS-PS-202607-0001',
    payrollId: null,
    employeeId: 'EMP001',
    employeeName: 'Rahul Kumar',
    initials: 'RK',
    clientId: 'c001',
    clientName: 'ABC Security Services',
    department: 'Security',
    designation: 'Security Guard',
    site: 'Main Gate',
    salaryMonth: 'July 2026',
    salaryPeriod: '01 Jul 2026 - 31 Jul 2026',
    generatedDate: '31 Jul 2026',
    status: 'Generated',
    workingDays: 31,
    presentDays: 25,
    absentDays: 3,
    leaveDays: 3,
    paidDays: 28,
    earnings: {
      basicSalary: 20000,
      hra: 8000,
      transportAllowance: 2000,
      otherAllowance: 2000,
      overtime: 3800,
      grossSalary: 35800,
    },
    deductions: {
      pf: 2400,
      esi: 540,
      advanceAdjustment: 800,
      otherDeduction: 260,
      totalDeductions: 4000,
    },
    netSalary: 31800,
    bankDetails: {
      bank: 'State Bank of India',
      accountNumber: 'XXXX XXXX 4521',
      ifsc: 'SBIN0001234',
      accountHolder: 'Rahul Kumar',
    },
    uan: '100904582194',
    pfNumber: 'UP/BRL/0045219/000/0001',
    esiNumber: '31000548920000608',
  },
  {
    id: 'emp-slip-jun-2026',
    slipNumber: 'NS-PS-202606-0001',
    payrollId: null,
    employeeId: 'EMP001',
    employeeName: 'Rahul Kumar',
    initials: 'RK',
    clientId: 'c001',
    clientName: 'ABC Security Services',
    department: 'Security',
    designation: 'Security Guard',
    site: 'Main Gate',
    salaryMonth: 'June 2026',
    salaryPeriod: '01 Jun 2026 - 30 Jun 2026',
    generatedDate: '30 Jun 2026',
    status: 'Generated',
    workingDays: 30,
    presentDays: 24,
    absentDays: 3,
    leaveDays: 3,
    paidDays: 27,
    earnings: {
      basicSalary: 20000,
      hra: 8000,
      transportAllowance: 2000,
      otherAllowance: 2000,
      overtime: 3500,
      grossSalary: 35500,
    },
    deductions: {
      pf: 2400,
      esi: 530,
      advanceAdjustment: 700,
      otherDeduction: 270,
      totalDeductions: 3900,
    },
    netSalary: 31600,
    bankDetails: {
      bank: 'State Bank of India',
      accountNumber: 'XXXX XXXX 4521',
      ifsc: 'SBIN0001234',
      accountHolder: 'Rahul Kumar',
    },
    uan: '100904582194',
    pfNumber: 'UP/BRL/0045219/000/0001',
    esiNumber: '31000548920000608',
  },
  {
    id: 'emp-slip-may-2026',
    slipNumber: 'NS-PS-202605-0001',
    payrollId: null,
    employeeId: 'EMP001',
    employeeName: 'Rahul Kumar',
    initials: 'RK',
    clientId: 'c001',
    clientName: 'ABC Security Services',
    department: 'Security',
    designation: 'Security Guard',
    site: 'Main Gate',
    salaryMonth: 'May 2026',
    salaryPeriod: '01 May 2026 - 31 May 2026',
    generatedDate: '31 May 2026',
    status: 'Generated',
    workingDays: 31,
    presentDays: 27,
    absentDays: 1,
    leaveDays: 3,
    paidDays: 30,
    earnings: {
      basicSalary: 20000,
      hra: 8000,
      transportAllowance: 2000,
      otherAllowance: 2000,
      overtime: 2800,
      grossSalary: 34800,
    },
    deductions: {
      pf: 2400,
      esi: 520,
      advanceAdjustment: 500,
      otherDeduction: 230,
      totalDeductions: 3650,
    },
    netSalary: 31150,
    bankDetails: {
      bank: 'State Bank of India',
      accountNumber: 'XXXX XXXX 4521',
      ifsc: 'SBIN0001234',
      accountHolder: 'Rahul Kumar',
    },
    uan: '100904582194',
    pfNumber: 'UP/BRL/0045219/000/0001',
    esiNumber: '31000548920000608',
  },
  {
    id: 'emp-slip-apr-2026',
    slipNumber: null,
    payrollId: null,
    employeeId: 'EMP001',
    employeeName: 'Rahul Kumar',
    initials: 'RK',
    clientId: 'c001',
    clientName: 'ABC Security Services',
    department: 'Security',
    designation: 'Security Guard',
    site: 'Main Gate',
    salaryMonth: 'April 2026',
    salaryPeriod: '01 Apr 2026 - 30 Apr 2026',
    generatedDate: null,
    status: 'Pending',
    workingDays: 30,
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    paidDays: 0,
    earnings: {
      basicSalary: 0,
      hra: 0,
      transportAllowance: 0,
      otherAllowance: 0,
      overtime: 0,
      grossSalary: 0,
    },
    deductions: {
      pf: 0,
      esi: 0,
      advanceAdjustment: 0,
      otherDeduction: 0,
      totalDeductions: 0,
    },
    netSalary: 0,
    bankDetails: null,
    uan: '100904582194',
    pfNumber: 'UP/BRL/0045219/000/0001',
    esiNumber: '31000548920000608',
  },
];

/**
 * All salary slips for the logged-in employee (EMP001).
 * Merges the August 2026 slip from the shared data source with the historical records.
 * Sorted newest first.
 */
export const employeeSalarySlips = [
  ...(aug2026Slip ? [aug2026Slip] : []),
  ...historicalSlips,
];

/**
 * Employee identity used across the Employee Panel.
 * Sourced from the same employee dashboard data pattern.
 */
export const loggedInEmployee = {
  name: 'Rahul Kumar',
  employeeId: 'EMP001',
  designation: 'Security Guard',
  department: 'Security',
  company: 'ABC Security Services',
  initials: 'RK',
};

/**
 * Month filter options derived from the slip data.
 */
export const salaryMonthOptions = [
  { value: 'all', label: 'All Months' },
  { value: 'August 2026', label: 'August 2026' },
  { value: 'July 2026', label: 'July 2026' },
  { value: 'June 2026', label: 'June 2026' },
  { value: 'May 2026', label: 'May 2026' },
  { value: 'April 2026', label: 'April 2026' },
];
