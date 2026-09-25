// NovaSpark HRMS - Mock approved deduction schedules.
import { mockAdvanceLoanRequests } from './advanceLoanData';

export const mockDeductionSchedules = mockAdvanceLoanRequests
  .filter((request) => request.status === 'approved' || request.status === 'completed')
  .map((request, index) => ({
    id: index + 1,
    requestId: request.requestId,
    employeeId: request.employeeId,
    employeeName: request.employeeName,
    initials: request.initials,
    clientName: request.clientName,
    type: request.type,
    approvedAmount: request.approvedAmount,
    monthlyDeduction: request.emiAmount,
    totalMonths: request.numberOfMonths,
    deductedAmount: request.deductedAmount,
    remainingAmount: request.remainingAmount,
    nextDeductionMonth: '2026-09',
    status: request.status === 'completed' ? 'completed' : index % 5 === 0 ? 'paused' : 'active'
  }));
