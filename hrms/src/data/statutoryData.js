// NovaSpark HRMS — Mock Statutory Data (PF / ESI)
import { mockPayrollRecords } from './payrollData';

export const mockPFRecords = mockPayrollRecords.map((item) => {
  const eligibleSalary = Math.min(item.basicSalary, 15000) === 15000 && item.basicSalary > 15000 
    ? item.basicSalary 
    : item.basicSalary;
  const employeePF = item.pf || Math.round(eligibleSalary * 0.12);
  const employerPF = employeePF; // 12% employer matching
  const totalPF = employeePF + employerPF;

  return {
    id: `pf-${item.id}`,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    initials: item.initials,
    clientName: item.clientName,
    department: item.department,
    designation: item.designation,
    payrollMonth: 'August 2026',
    uan: item.uan,
    pfNumber: item.pfNumber,
    eligibleSalary,
    employeePF,
    employerPF,
    totalPF,
    status: item.status === 'processed' ? 'Compliant' : 'Calculated'
  };
});

export const mockESIRecords = mockPayrollRecords.map((item) => {
  const eligibleSalary = item.grossSalary;
  const employeeESI = item.grossSalary <= 21000 ? Math.round(eligibleSalary * 0.0075) : 0;
  const employerESI = item.grossSalary <= 21000 ? Math.round(eligibleSalary * 0.0325) : 0;
  const totalESI = employeeESI + employerESI;

  return {
    id: `esi-${item.id}`,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    initials: item.initials,
    clientName: item.clientName,
    department: item.department,
    designation: item.designation,
    payrollMonth: 'August 2026',
    esiNumber: item.esiNumber,
    eligibleSalary,
    employeeESI: item.esi || employeeESI,
    employerESI: item.esi ? Math.round(item.esi * (3.25 / 0.75)) : employerESI,
    totalESI: (item.esi || employeeESI) + (item.esi ? Math.round(item.esi * (3.25 / 0.75)) : employerESI),
    status: item.status === 'processed' ? 'Compliant' : 'Calculated'
  };
});

export const mockStatutorySummary = {
  pfContribution: 842500,
  pfEmployeeShare: 421250,
  pfEmployerShare: 421250,
  esiContribution: 218400,
  esiEmployeeShare: 109200,
  esiEmployerShare: 109200,
  employeesCovered: 1184,
  reportsGenerated: 6
};
