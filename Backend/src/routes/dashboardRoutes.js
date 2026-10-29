import express from 'express';
import { getAdminDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin / User dashboard statistics with company isolation
router.get('/stats', protect, getAdminDashboardStats);
router.get('/admin', protect, getAdminDashboardStats);

export default router;
