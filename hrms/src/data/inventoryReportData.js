import { mockInventoryItems } from './inventoryData';

export const inventoryReportData = mockInventoryItems.slice(0, 10).map((item) => ({
  item: item.itemName,
  itemId: item.itemId,
  category: item.category,
  client: item.clientName,
  totalQuantity: item.totalQuantity,
  available: item.availableQuantity,
  issued: item.issuedQuantity,
  damaged: item.damagedQuantity,
  lost: item.lostQuantity,
  status: item.status === 'in-stock' ? 'In Stock' : item.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'
}));
