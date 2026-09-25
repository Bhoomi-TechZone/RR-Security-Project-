// NovaSpark HRMS - Mock inventory stock data.
// Replace with API-backed inventory records when the backend is ready.

const catalog = [
  ['Security Uniform', 'Uniform', 'non-consumable', 'ABC Security Services', 120, 84, 20, 'Set'],
  ['Security Shoes', 'Uniform', 'non-consumable', 'ABC Security Services', 90, 54, 15, 'Pair'],
  ['Safety Helmet', 'Safety Gear', 'asset', 'XYZ Facility Management', 40, 8, 10, 'Piece'],
  ['Handheld Torch', 'Equipment', 'asset', 'XYZ Facility Management', 80, 12, 8, 'Piece'],
  ['ID Card', 'ID Card', 'non-consumable', 'Central Stock', 200, 160, 20, 'Piece'],
  ['Security Kit', 'Security Kit', 'non-consumable', 'ABC Security Services', 60, 28, 12, 'Kit'],
  ['Raincoat', 'Safety Gear', 'non-consumable', 'PQR Housekeeping Pvt Ltd', 50, 34, 10, 'Piece'],
  ['First Aid Box', 'Equipment', 'asset', 'Central Stock', 24, 18, 5, 'Box'],
  ['Reflective Jacket', 'Uniform', 'non-consumable', 'Suraksha Security Corp', 70, 45, 12, 'Piece'],
  ['Walkie Talkie', 'Equipment', 'asset', 'ABC Security Services', 35, 0, 5, 'Piece'],
  ['Safety Gloves', 'Safety Gear', 'consumable', 'Central Stock', 160, 68, 25, 'Pair'],
  ['Belt', 'Uniform', 'non-consumable', 'XYZ Facility Management', 95, 60, 15, 'Piece'],
  ['Access Card Holder', 'ID Card', 'consumable', 'Central Stock', 100, 74, 15, 'Piece'],
  ['Cleaning Kit', 'Security Kit', 'consumable', 'PQR Housekeeping Pvt Ltd', 80, 42, 18, 'Kit'],
  ['Safety Goggles', 'Safety Gear', 'asset', 'Suraksha Security Corp', 32, 9, 10, 'Piece'],
  ['Lanyard', 'ID Card', 'consumable', 'Central Stock', 120, 90, 20, 'Piece'],
  ['Tool Box', 'Equipment', 'asset', 'XYZ Facility Management', 18, 11, 4, 'Box'],
  ['Security Cap', 'Uniform', 'non-consumable', 'ABC Security Services', 75, 42, 12, 'Piece'],
  ['Rain Boots', 'Safety Gear', 'non-consumable', 'PQR Housekeeping Pvt Ltd', 44, 24, 10, 'Pair'],
  ['Visitor Badge Set', 'ID Card', 'consumable', 'Central Stock', 70, 50, 12, 'Set'],
  ['Fire Extinguisher', 'Equipment', 'asset', 'Central Stock', 20, 14, 5, 'Piece'],
  ['Utility Belt', 'Security Kit', 'non-consumable', 'Suraksha Security Corp', 55, 31, 10, 'Piece']
];

export const mockInventoryItems = catalog.map((item, index) => {
  const [itemName, category, type, clientName, totalQuantity, availableQuantity, minimumStock, unit] = item;
  return {
    id: index + 1,
    itemId: `ITM${String(index + 1).padStart(3, '0')}`,
    itemName,
    category,
    type,
    clientId: clientName === 'Central Stock' ? 'central' : `c00${(index % 4) + 1}`,
    clientName,
    totalQuantity,
    availableQuantity,
    issuedQuantity: totalQuantity - availableQuantity,
    damagedQuantity: index % 7 === 0 ? 2 : 0,
    lostQuantity: index % 9 === 0 ? 1 : 0,
    minimumStock,
    unit,
    description: `${itemName} maintained for employee issue and site operations.`,
    status: availableQuantity === 0 ? 'out-of-stock' : availableQuantity <= minimumStock ? 'low-stock' : 'in-stock'
  };
});

export const inventoryCategories = ['Uniform', 'Equipment', 'ID Card', 'Security Kit', 'Safety Gear', 'Other'];
export const inventoryTypes = ['consumable', 'non-consumable', 'asset'];
export const inventoryUnits = ['Piece', 'Pair', 'Set', 'Box', 'Kit'];
