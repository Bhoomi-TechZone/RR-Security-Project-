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
  savePFRate,
  deletePFRate,
  savePFApplicability,
  saveESIRate,
  deleteESIRate,
  saveESIApplicability,
  savePTApplicability,
} from '../controllers/statutoryController.js';

const router = express.Router();

// All statutory configuration endpoints require authentication
router.use(protect);

// GET full statutory configuration
router.get('/', getStatutoryConfig);

// Module toggle
router.put('/toggle/:moduleKey', authorize('superadmin', 'admin', 'hr', 'manager'), toggleModuleStatus);

// PF Rates & Applicability
router.post('/pf-rates', authorize('superadmin', 'admin', 'hr', 'manager'), savePFRate);
router.delete('/pf-rates/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deletePFRate);
router.put('/pf/applicability', authorize('superadmin', 'admin', 'hr', 'manager'), savePFApplicability);

// ESI Rates & Applicability
router.post('/esi-rates', authorize('superadmin', 'admin', 'hr', 'manager'), saveESIRate);
router.delete('/esi-rates/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteESIRate);
router.put('/esi/applicability', authorize('superadmin', 'admin', 'hr', 'manager'), saveESIApplicability);

// PT Slabs & Applicability
router.post('/pt-slabs', authorize('superadmin', 'admin', 'hr', 'manager'), savePTSlab);
router.delete('/pt-slabs/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deletePTSlab);
router.put('/pt/applicability', authorize('superadmin', 'admin', 'hr', 'manager'), savePTApplicability);

// LWF Rules
router.post('/lwf-rules', authorize('superadmin', 'admin', 'hr', 'manager'), saveLWFRule);
router.delete('/lwf-rules/:id', authorize('superadmin', 'admin', 'hr', 'manager'), deleteLWFRule);

// Module settings update (pf, esi, pt, tds, bonus, gratuity, lwf)
router.put('/:moduleKey', authorize('superadmin', 'admin', 'hr', 'manager'), updateStatutoryModule);

export default router;
