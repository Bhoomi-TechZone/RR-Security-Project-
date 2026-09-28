import express from 'express';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  toggleItemStatus,
  getIssuedItems,
  createIssuedItems,
  updateIssuedItem,
  deleteIssuedItem,
  getReturnRecords,
  createReturnRecord,
  getStockMovements,
  getClearanceRecords,
  approveClearance
} from '../controllers/inventoryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All inventory operations require authentication
router.use(protect);

// Master Item Register (Uniforms & Assets)
router.route('/items')
  .get(getInventoryItems)
  .post(adminOnly, createInventoryItem);

router.route('/items/:id')
  .put(adminOnly, updateInventoryItem)
  .delete(adminOnly, deleteInventoryItem);

router.route('/items/:id/status')
  .patch(adminOnly, toggleItemStatus);

// Issued Items
router.route('/issued')
  .get(getIssuedItems)
  .post(adminOnly, createIssuedItems);

router.route('/issued/:id')
  .put(adminOnly, updateIssuedItem)
  .delete(adminOnly, deleteIssuedItem);

// Returns
router.route('/returns')
  .get(getReturnRecords)
  .post(adminOnly, createReturnRecord);

// Movements & Audit Trail
router.route('/movements')
  .get(getStockMovements);

// Exit Clearances
router.route('/clearances')
  .get(getClearanceRecords);

router.route('/clearances/:id/approve')
  .post(adminOnly, approveClearance);

export default router;
