import express from 'express';
import {
  getLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,
  getLetterTemplates,
  saveLetterTemplate
} from '../controllers/letterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getLetters)
  .post(createLetter);

router.route('/templates')
  .get(getLetterTemplates)
  .post(saveLetterTemplate);

router.route('/:id')
  .get(getLetterById)
  .put(updateLetter)
  .delete(deleteLetter);

export default router;
