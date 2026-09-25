import express from 'express';
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All company management routes require authentication and admin role
router.use(protect);

router.route('/')
  .get(getCompanies)
  .post(adminOnly, createCompany);

router.route('/:id')
  .put(adminOnly, updateCompany)
  .delete(adminOnly, deleteCompany);

export default router;
