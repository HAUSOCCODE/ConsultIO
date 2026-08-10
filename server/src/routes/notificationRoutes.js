import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getNotifications,
  clearNotifications,
  clearReadNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
const router = Router();
router.use(authenticate);
router.get("/", getNotifications);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);
router.delete("/read", clearReadNotifications);
router.delete("/:id", deleteNotification);
router.delete("/", clearNotifications);
export default router;
