import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { NotificationService } from "../services/notifications.service";
import { NotificationType, NotificationSeverity } from "../generated/prisma";

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notifications count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    let count = 0;
    try {
      count = await NotificationService.getUnreadCount(req.user.userId);
    } catch (error: any) {
      // If notifications table doesn't exist, return 0
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        count = 0;
      } else {
        throw error;
      }
    }

    res.status(200).json({
      status: "success",
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get unread count",
    });
  }
};

/**
 * GET /api/v1/notifications
 * Get notifications with optional filtering
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const type = req.query.type as NotificationType | undefined;
    const severity = req.query.severity as NotificationSeverity | undefined;
    const isRead = req.query.isRead === "true" ? true : req.query.isRead === "false" ? false : undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    let result: any = { notifications: [], total: 0 };
    try {
      result = await NotificationService.getNotifications(req.user.userId, {
        type,
        severity,
        isRead,
        limit,
        offset,
      });
    } catch (error: any) {
      // If notifications table doesn't exist, return empty list
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        result = { notifications: [], total: 0 };
      } else {
        throw error;
      }
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get notifications",
    });
  }
};

/**
 * PUT /api/v1/notifications/:id/read
 * Mark notification as read
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const notification = await NotificationService.markAsRead(id);

    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to mark notification as read",
    });
  }
};

/**
 * PUT /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    await NotificationService.markAllAsRead(req.user.userId);

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to mark all notifications as read",
    });
  }
};

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await NotificationService.deleteNotification(id);

    res.status(200).json({
      status: "success",
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete notification",
    });
  }
};

/**
 * DELETE /api/v1/notifications/read
 * Delete all read notifications
 */
export const deleteReadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    await NotificationService.deleteReadNotifications(req.user.userId);

    res.status(200).json({
      status: "success",
      message: "Read notifications deleted",
    });
  } catch (error) {
    console.error("Delete read notifications error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete read notifications",
    });
  }
};
