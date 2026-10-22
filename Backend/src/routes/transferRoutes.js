import express from 'express';
import {
  getTransfers,
  createTransfer,
  deleteTransfer,
} from '../controllers/transferController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected with JWT auth
router.use(protect);

router.route('/')
  .get(getTransfers)
  .post(adminOnly, createTransfer);

router.route('/:id')
  .delete(adminOnly, deleteTransfer);

export default router;
