import express from 'express';
import {
  getClientProfile,
  updateClientProfile,
  getAssignedEmployees,
  getClientDashboard,
  getClientAttendance,
  getClientBilling,
  getClientNotifications
} from '../controllers/clientPortalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all client portal endpoints
router.use(protect);

// Client Profile
router.route('/profile')
  .get(getClientProfile)
  .put(updateClientProfile);

// Assigned Employees exclusively for this client
router.get('/employees', getAssignedEmployees);

// Dashboard metrics & Analytics
router.get('/dashboard', getClientDashboard);

// Attendance register
router.get('/attendance', getClientAttendance);

// Billing & Invoices
router.get('/billing', getClientBilling);

// Notifications
router.get('/notifications', getClientNotifications);

export default router;
