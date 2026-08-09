import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
const router = Router();
router.use(authenticate);
router.get("/", getNotifications);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);
export default router;
