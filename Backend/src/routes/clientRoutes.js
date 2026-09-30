import express from 'express';
import {
  getClients,
  createClient,
  updateClient,
  toggleClientStatus,
  deleteClient,
} from '../controllers/clientController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected with JWT auth
router.use(protect);

router.route('/')
  .get(getClients)
  .post(adminOnly, createClient);

router.route('/:id/status')
  .patch(adminOnly, toggleClientStatus);

router.route('/:id')
  .put(adminOnly, updateClient)
  .patch(adminOnly, toggleClientStatus)
  .delete(adminOnly, deleteClient);

export default router;
