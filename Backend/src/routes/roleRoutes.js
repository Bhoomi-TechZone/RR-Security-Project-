import express from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  updateRolePermissions,
  deleteRole,
  getAssignedUsers,
  assignUserToRole,
  removeUserFromRole,
} from '../controllers/roleController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All role and permission routes require JWT authentication
router.use(protect);

// User assignment endpoints
router.route('/users/assignments')
  .get(getAssignedUsers)
  .post(adminOnly, assignUserToRole);

router.route('/users/assignments/:userId')
  .delete(adminOnly, removeUserFromRole);

// Roles CRUD
router.route('/')
  .get(getRoles)
  .post(adminOnly, createRole);

router.route('/:id')
  .put(adminOnly, updateRole)
  .delete(adminOnly, deleteRole);

router.route('/:id/permissions')
  .put(adminOnly, updateRolePermissions);

export default router;
