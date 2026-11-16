import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  sendEmployeeCredentials,
  sendDirectEmployeeCredentials,
  bulkImportEmployees,
} from '../controllers/employeeController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected with JWT auth
router.use(protect);

router.route('/')
  .get(getEmployees)
  .post(adminOnly, createEmployee);

router.post('/bulk-import', adminOnly, bulkImportEmployees);
router.post('/send-credentials-direct', adminOnly, sendDirectEmployeeCredentials);

router.route('/:id')
  .get(getEmployeeById)
  .put(adminOnly, updateEmployee)
  .delete(adminOnly, deleteEmployee);

router.post('/:id/send-credentials', adminOnly, sendEmployeeCredentials);

export default router;
