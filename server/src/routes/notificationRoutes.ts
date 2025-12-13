import { Router } from 'express';
import * as NotificationController from '../controllers/notificationController';
import { ensureAuthenticated } from '../middleware/auth';

const router = Router();

router.use(ensureAuthenticated);

router.get('/', NotificationController.getNotifications);
router.get('/count', NotificationController.getNotificationCount);
router.post('/mark-read', NotificationController.markNotificationsRead);

export default router;
