import express from 'express';
import {
  getWorkLocations,
  createWorkLocation,
  updateWorkLocation,
  toggleWorkLocationStatus,
  deleteWorkLocation,
} from '../controllers/workLocationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All work location endpoints are protected with JWT auth
router.use(protect);

router.route('/')
  .get(getWorkLocations)
  .post(adminOnly, createWorkLocation);

router.route('/:id')
  .put(adminOnly, updateWorkLocation)
  .delete(adminOnly, deleteWorkLocation);

router.route('/:id/status')
  .patch(adminOnly, toggleWorkLocationStatus);

export default router;
