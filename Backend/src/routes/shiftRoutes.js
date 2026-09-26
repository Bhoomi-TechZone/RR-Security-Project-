import express from 'express';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getShiftRoster,
  assignShift,
  changeShift,
  unassignEmployee,
  getShiftStats
} from '../controllers/shiftController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authenticated user
router.use(protect);

// Dynamic Summary Stats
router.get('/stats', getShiftStats);

// Shift Roster routes
router.get('/roster', getShiftRoster);
router.post('/roster/assign', adminOnly, assignShift);
router.put('/roster/:id/change', adminOnly, changeShift);
router.delete('/roster/:id', adminOnly, unassignEmployee);

// Shift Pattern / CRUD routes
router.route('/')
  .get(getShifts)
  .post(adminOnly, createShift);

router.route('/:id')
  .put(adminOnly, updateShift)
  .delete(adminOnly, deleteShift);

export default router;
