// NovaSpark HRMS - Mock issued inventory records.
import { mockEmployees } from './employeeData';
import { mockInventoryItems } from './inventoryData';

export const mockIssuedItems = Array.from({ length: 24 }, (_, index) => {
  const employee = mockEmployees[index % mockEmployees.length];
  const item = mockInventoryItems[index % 12];
  const quantity = (index % 3) + 1;
  const returnedQuantity = index % 6 === 0 ? quantity : index % 5 === 0 ? 1 : 0;
  return {
    id: index + 1,
    itemId: item.itemId,
    itemName: item.itemName,
    category: item.category,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    initials: employee.initials,
    clientId: employee.companyId,
    clientName: employee.companyName,
    site: employee.site || 'Main Gate',
    quantity,
    issueDate: index % 2 ? '2026-08-23' : '2026-08-24',
    condition: index % 4 === 0 ? 'good' : 'new',
    returnedQuantity,
    returnStatus: returnedQuantity === quantity ? 'returned' : returnedQuantity ? 'partially-returned' : 'not-returned'
  };
});
