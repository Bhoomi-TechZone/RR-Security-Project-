import express from 'express';
import {
  getLeaveRequests,
  createLeaveRequest,
  reviewLeaveRequest,
  cancelLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getLeaveTypes,
  saveLeaveType,
  deleteLeaveType,
  getEmployeeLeaveBalances,
  assignLeavePolicy,
} from '../controllers/leaveController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Leave Types Master
router
  .route('/types')
  .get(getLeaveTypes)
  .post(adminOnly, saveLeaveType);

router.delete('/types/:id', adminOnly, deleteLeaveType);

// Leave Balances & Policy Assignment
router.get('/balances', getEmployeeLeaveBalances);
router.post('/balances/assign', adminOnly, assignLeavePolicy);

// Leaves CRUD & Workflow
router
  .route('/')
  .get(getLeaveRequests)
  .post(createLeaveRequest);

router
  .route('/:id')
  .put(adminOnly, updateLeaveRequest)
  .delete(adminOnly, deleteLeaveRequest);

router.put('/:id/review', adminOnly, reviewLeaveRequest);
router.put('/:id/cancel', cancelLeaveRequest);

export default router;
