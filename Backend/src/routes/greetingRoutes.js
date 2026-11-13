import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGreetingsConfig,
  updateGreetingsConfig,
  triggerGreetingsDispatch
} from '../controllers/greetingController.js';

const router = express.Router();

router.use(protect);

router.get('/', getGreetingsConfig);
router.put('/', updateGreetingsConfig);
router.post('/dispatch', triggerGreetingsDispatch);

export default router;

