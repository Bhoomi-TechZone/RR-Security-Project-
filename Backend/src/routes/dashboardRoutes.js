import express from 'express';
import { getAdminDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Admin / User dashboard statistics with company isolation
router.get('/stats', getAdminDashboardStats);
router.get('/admin', getAdminDashboardStats);

export default router;
