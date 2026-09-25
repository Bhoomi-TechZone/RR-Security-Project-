// NovaSpark HRMS - Mock inventory return history.
import { mockIssuedItems } from './inventoryIssuedData';

export const mockReturnHistory = mockIssuedItems.slice(0, 10).map((issue, index) => ({
  id: index + 1,
  issueId: issue.id,
  employeeId: issue.employeeId,
  employeeName: issue.employeeName,
  itemId: issue.itemId,
  itemName: issue.itemName,
  category: issue.category,
  quantity: index % 4 === 0 ? 1 : issue.quantity,
  issueDate: issue.issueDate,
  returnDate: `2026-08-${String(25 + (index % 5)).padStart(2, '0')}`,
  condition: index % 5 === 0 ? 'damaged' : index % 7 === 0 ? 'lost' : 'good',
  status: index % 4 === 0 ? 'partially-returned' : 'returned',
  remarks: index % 5 === 0 ? 'Returned with visible wear.' : 'Returned during routine inventory check.'
}));
