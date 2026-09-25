// NovaSpark HRMS - Mock deduction history.
import { mockDeductionSchedules } from './deductionData';

export const mockDeductionHistory = mockDeductionSchedules.flatMap((schedule, index) => {
  const count = Math.min(2, schedule.totalMonths);
  return Array.from({ length: count }, (_, deductionIndex) => ({
    id: `${schedule.id}-${deductionIndex + 1}`,
    requestId: schedule.requestId,
    employeeId: schedule.employeeId,
    employeeName: schedule.employeeName,
    clientName: schedule.clientName,
    type: schedule.type,
    month: `2026-${String(7 + deductionIndex).padStart(2, '0')}`,
    deductionDate: `2026-${String(7 + deductionIndex).padStart(2, '0')}-28`,
    amount: schedule.monthlyDeduction,
    salaryMonth: deductionIndex === 0 ? 'July 2026' : 'August 2026',
    status: index % 4 === 0 && deductionIndex === 1 ? 'pending' : 'deducted',
    remarks: 'Monthly salary adjustment'
  }));
});
