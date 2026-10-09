import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getStatutoryConfig,
  updateStatutoryModule,
  toggleModuleStatus,
  savePTSlab,
  deletePTSlab,
  saveLWFRule,
  deleteLWFRule,
} from '../controllers/statutoryController.js';

const router = express.Router();

// All statutory configuration endpoints require authentication
router.use(protect);

// GET full statutory configuration
router.get('/', getStatutoryConfig);

// Module toggle
router.put('/toggle/:moduleKey', authorize('superadmin', 'admin', 'hr', 'manager'), toggleModuleStatus);

// PT Slabs
router.post('/pt-slabs', authorize('superadmin', 'admin', 'hr', 'manager'), savePTSlab);
router.delete('/pt-slabs/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deletePTSlab);

// LWF Rules
router.post('/lwf-rules', authorize('superadmin', 'admin', 'hr', 'manager'), saveLWFRule);
router.delete('/lwf-rules/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteLWFRule);

// Module settings update (pf, esi, pt, tds, bonus, gratuity, lwf)
router.put('/:moduleKey', authorize('superadmin', 'admin', 'hr', 'manager'), updateStatutoryModule);

export default router;
