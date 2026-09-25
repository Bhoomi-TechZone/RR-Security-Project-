// NovaSpark HRMS — Mock Salary Slip Data
import { mockPayrollRecords } from './payrollData';

export const mockSalarySlips = mockPayrollRecords.map((record, index) => {
  const isGenerated = ['processed', 'calculated'].includes(record.status);
  return {
    id: `slip-${record.id}`,
    slipNumber: `NS-PS-202608-${String(index + 1).padStart(4, '0')}`,
    payrollId: record.id,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    initials: record.initials,
    clientId: record.clientId,
    clientName: record.clientName,
    department: record.department,
    designation: record.designation,
    site: record.site,
    salaryMonth: 'August 2026',
    salaryPeriod: '01 Aug 2026 - 31 Aug 2026',
    generatedDate: isGenerated ? '31 Aug 2026' : null,
    status: isGenerated ? 'Generated' : 'Pending',
    workingDays: record.workingDays,
    presentDays: record.presentDays,
    absentDays: record.absentDays,
    leaveDays: record.leaveDays,
    paidDays: record.paidDays,
    
    // Earnings breakdown
    earnings: {
      basicSalary: record.basicSalary,
      hra: record.hra,
      transportAllowance: record.transportAllowance,
      otherAllowance: record.otherAllowance,
      overtime: record.overtimeAmount,
      grossSalary: record.grossSalary,
    },
    
    // Deductions breakdown
    deductions: {
      pf: record.pf,
      esi: record.esi,
      advanceAdjustment: record.advanceAdjustment,
      otherDeduction: record.otherDeduction,
      totalDeductions: record.totalDeductions,
    },
    
    netSalary: record.netSalary,
    bankDetails: record.bankDetails,
    uan: record.uan,
    pfNumber: record.pfNumber,
    esiNumber: record.esiNumber,
  };
});
