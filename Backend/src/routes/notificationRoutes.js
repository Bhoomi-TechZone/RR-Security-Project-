import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
  updateNotificationAction
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getUnreadNotificationCount);
router.put('/mark-all-read', markAllNotificationsAsRead);
router.delete('/clear-read', clearReadNotifications);

router.route('/')
  .get(getNotifications);

router.route('/:id')
  .delete(deleteNotification);

router.put('/:id/read', markNotificationAsRead);
router.put('/:id/action', updateNotificationAction);

export default router;
