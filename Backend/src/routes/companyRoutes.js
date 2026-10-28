import express from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyCredentials,
  sendCompanyCredentials,
  getBrandLogo,
  updateBrandLogo,
} from '../controllers/companyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All company management routes require authentication and admin role
router.use(protect);

// Global Brand Logo routes (mounted before :id routes)
router.route('/brand-logo')
  .get(getBrandLogo)
  .put(adminOnly, updateBrandLogo);

router.route('/')
  .get(getCompanies)
  .post(adminOnly, createCompany);

router.route('/:id/credentials')
  .get(adminOnly, getCompanyCredentials)
  .post(adminOnly, sendCompanyCredentials);

router.post('/:id/send-credentials', adminOnly, sendCompanyCredentials);

router.route('/:id')
  .get(getCompanyById)
  .put(adminOnly, updateCompany)
  .delete(adminOnly, deleteCompany);

export default router;
