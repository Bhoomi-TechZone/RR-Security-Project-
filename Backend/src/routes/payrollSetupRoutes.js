import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPayrollSetup,
  createPayGroup,
  updatePayGroup,
  deletePayGroup,
  createPaySchedule,
  updatePaySchedule,
  createPayCycle,
  updatePayCycle,
  createPayDay,
  updatePayDay,
  setDefaultCalculationMethod
} from '../controllers/payrollSetupController.js';

const router = express.Router();

router.use(protect);

// Get All Configurations
router.get('/', getPayrollSetup);

// Pay Groups
router.post('/pay-groups', createPayGroup);
router.put('/pay-groups/:id', updatePayGroup);
router.delete('/pay-groups/:id', deletePayGroup);

// Pay Schedules
router.post('/schedules', createPaySchedule);
router.put('/schedules/:id', updatePaySchedule);

// Pay Cycles
router.post('/cycles', createPayCycle);
router.put('/cycles/:id', updatePayCycle);

// Pay Days
router.post('/pay-days', createPayDay);
router.put('/pay-days/:id', updatePayDay);

// Calculation Methods
router.put('/calculation-methods/:id/default', setDefaultCalculationMethod);

export default router;
