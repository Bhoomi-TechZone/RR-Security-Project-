import express from 'express';
import {
  getPreferences,
  getEmployeePortalAccess,
  updateEmployeePortalPreferences,
  updatePreferences,
} from '../controllers/preferenceController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / token-optional portal access endpoint for employee panel navigation
router.get('/portal-access', getEmployeePortalAccess);

// Protected Admin preference endpoints
router.use(protect);

router.route('/')
  .get(getPreferences)
  .put(adminOnly, updatePreferences);

router.route('/employee-portal')
  .put(adminOnly, updateEmployeePortalPreferences);

export default router;
