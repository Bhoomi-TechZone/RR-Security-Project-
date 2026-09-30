import express from 'express';
import {
  getMasters,
  createMaster,
  updateMaster,
  toggleMasterStatus,
  deleteMaster
} from '../controllers/masterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMasters)
  .post(createMaster);

router.route('/:id')
  .put(updateMaster)
  .delete(deleteMaster);

router.route('/:id/status')
  .patch(toggleMasterStatus);

export default router;
