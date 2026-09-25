// NovaSpark HRMS - Mock advance and loan requests.
// Replace with API data when the backend is ready.
import { mockEmployees } from './employeeData';

const reasons = ['Emergency', 'Medical / Personal', 'Education', 'Family Expense', 'Travel', 'Personal Loan'];
const statuses = ['pending', 'approved', 'rejected', 'completed'];

export const mockAdvanceLoanRequests = Array.from({ length: 32 }, (_, index) => {
  const employee = mockEmployees[index % mockEmployees.length];
  const type = index % 3 === 0 ? 'loan' : 'advance';
  const amount = type === 'loan' ? [50000, 75000, 100000][index % 3] : [15000, 25000, 35000][index % 3];
  const numberOfMonths = type === 'loan' ? (index % 3) + 5 : 1;
  const emiAmount = type === 'loan' ? Math.ceil(amount / numberOfMonths) : amount;
  const status = statuses[index % statuses.length];
  const requestDate = `2026-08-${String(2 + (index % 23)).padStart(2, '0')}`;
  const approvedAmount = status === 'approved' || status === 'completed' ? amount : 0;
  const deductedAmount = status === 'completed' ? amount : status === 'approved' ? Math.min(emiAmount * (index % 3 + 1), amount) : 0;

  return {
    id: index + 1,
    requestId: `REQ-${1001 + index}`,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    initials: employee.initials,
    clientId: employee.companyId,
    clientName: employee.companyName,
    department: employee.department,
    designation: employee.designation,
    currentSalary: employee.salaryStructure?.basic || 20000,
    type,
    amount,
    reason: reasons[index % reasons.length],
    requestDate,
    deductionMethod: type === 'loan' ? 'monthly-emi' : 'salary-adjustment',
    adjustmentMonth: '2026-09',
    emiAmount,
    numberOfMonths,
    firstDeductionMonth: '2026-09',
    approvedAmount,
    approvedDate: approvedAmount ? '2026-08-25' : null,
    deductedAmount,
    remainingAmount: Math.max(0, approvedAmount - deductedAmount || amount),
    status,
    rejectionReason: status === 'rejected' ? 'Amount exceeds eligible limit.' : null,
    remarks: 'Frontend demo request for salary adjustment workflow.'
  };
});
