import express from 'express';
import {
  getSeparations,
  getSeparationAnalytics,
  createSeparation,
  updateSeparation,
  finalizeSeparation,
  rehireSeparatedEmployee,
  cancelSeparation
} from '../controllers/separationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getSeparations);
router.get('/analytics', getSeparationAnalytics);
router.post('/', createSeparation);
router.put('/:id', updateSeparation);
router.post('/:id/finalize', finalizeSeparation);
router.post('/:id/rehire', rehireSeparatedEmployee);
router.delete('/:id', cancelSeparation);

export default router;

