import express from 'express';
import {
  getOnboardingList,
  getOnboardingById,
  getNextOnboardingId,
  createOnboarding,
  updateOnboarding,
  updateOnboardingStage,
  convertToEmployee,
  deleteOnboarding,
  getPublicOnboardingById,
  submitPublicOnboarding,
  sendOnboardingInvite
} from '../controllers/onboardingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Candidate Induction / Self-Onboarding routes
router.get('/public/:id', getPublicOnboardingById);
router.post('/public/:id/submit', submitPublicOnboarding);

// Protected Admin Routes
router.use(protect);

router.get('/next-id', getNextOnboardingId);
router.get('/', getOnboardingList);
router.get('/:id', getOnboardingById);
router.post('/', createOnboarding);
router.put('/:id', updateOnboarding);
router.patch('/:id/stage', updateOnboardingStage);
router.post('/:id/convert', convertToEmployee);
router.post('/:id/send-invite', sendOnboardingInvite);
router.delete('/:id', deleteOnboarding);

export default router;

