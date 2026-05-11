import { Router } from "express";
import {
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} from "../controllers/notifications.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All notification routes require authentication
 */

// GET /api/v1/notifications/unread-count - Get unread count
router.get("/unread-count", authenticate, getUnreadCount);

// PUT /api/v1/notifications/mark-all-read - Mark all as read (must be before /:id routes)
router.put("/mark-all-read", authenticate, markAllAsRead);

// DELETE /api/v1/notifications/read - Delete all read (must be before /:id routes)
router.delete("/read", authenticate, deleteReadNotifications);

// GET /api/v1/notifications - Get notifications with filters
router.get("/", authenticate, getNotifications);

// PUT /api/v1/notifications/:id/read - Mark as read
router.put("/:id/read", authenticate, markAsRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete("/:id", authenticate, deleteNotification);

export default router;
