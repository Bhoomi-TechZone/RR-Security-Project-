import express from 'express';
import {
  getUsers,
  getNextUserId,
  getUserById,
  createUser,
  updateUser,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
} from '../controllers/userAccountController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user management routes require JWT authentication
router.use(protect);

router.route('/next-id')
  .get(getNextUserId);

router.route('/')
  .get(getUsers)
  .post(adminOnly, createUser);

router.route('/:id')
  .get(getUserById)
  .put(adminOnly, updateUser)
  .delete(adminOnly, deleteUser);

router.route('/:id/role')
  .patch(adminOnly, changeUserRole);

router.route('/:id/status')
  .patch(adminOnly, toggleUserStatus);

export default router;
