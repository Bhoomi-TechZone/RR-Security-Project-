import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getReimbursementClaims,
  createReimbursementClaim,
  updateReimbursementClaim,
  deleteReimbursementClaim,
  reviewReimbursementClaim,
  processReimbursementPayment,
  getExpenseTypes,
  saveExpenseType,
  deleteExpenseType,
} from '../controllers/reimbursementController.js';

const router = express.Router();

router.use(protect);

// Expense Types
router.get('/expense-types', getExpenseTypes);
router.post('/expense-types', authorize('superadmin', 'admin', 'hr', 'manager'), saveExpenseType);
router.delete('/expense-types/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteExpenseType);

// Claims CRUD & Workflows
router.get('/', getReimbursementClaims);
router.post('/', createReimbursementClaim);
router.put('/:id', updateReimbursementClaim);
router.delete('/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteReimbursementClaim);
router.put('/:id/review', authorize('superadmin', 'admin', 'hr', 'manager'), reviewReimbursementClaim);
router.post('/:id/pay', authorize('superadmin', 'admin', 'hr', 'manager'), processReimbursementPayment);

export default router;
