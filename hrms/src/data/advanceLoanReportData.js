import { mockAdvanceLoanRequests } from './advanceLoanData';

export const advanceLoanReportData = mockAdvanceLoanRequests.slice(0, 10).map((request) => ({
  requestId: request.requestId,
  employee: request.employeeName,
  employeeId: request.employeeId,
  client: request.clientName,
  type: 'Loan',
  amount: request.amount,
  approvedAmount: request.approvedAmount,
  deducted: request.deductedAmount,
  remaining: request.remainingAmount,
  status: request.status === 'approved' ? 'Approved' : request.status === 'completed' ? 'Completed' : request.status === 'rejected' ? 'Rejected' : 'Pending'
}));
