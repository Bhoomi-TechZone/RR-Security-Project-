import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected with JWT auth
router.use(protect);

router.route('/')
  .get(getEmployees)
  .post(adminOnly, createEmployee);

router.route('/:id')
  .get(getEmployeeById)
  .put(adminOnly, updateEmployee)
  .delete(adminOnly, deleteEmployee);

export default router;
