import express from 'express';
import {
  getCandidates,
  getCandidateById,
  getNextCandidateId,
  createCandidate,
  updateCandidate,
  updateCandidateStatus,
  deleteCandidate
} from '../controllers/candidateController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All candidate routes require authentication
router.use(protect);

router.get('/next-id', getNextCandidateId);

router.route('/')
  .get(getCandidates)
  .post(adminOnly, createCandidate);

router.route('/:id')
  .get(getCandidateById)
  .put(adminOnly, updateCandidate)
  .delete(adminOnly, deleteCandidate);

router.patch('/:id/status', adminOnly, updateCandidateStatus);

export default router;

