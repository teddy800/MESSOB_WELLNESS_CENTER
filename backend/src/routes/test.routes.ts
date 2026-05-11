import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { NotificationService } from "../services/notifications.service";
import { prisma } from "../config/prisma";

const router = Router();

/**
 * POST /api/v1/test/notification/system-alert
 * Create a test SYSTEM_ALERT notification
 */
router.post("/notification/system-alert", authenticate, async (req: any, res: Response) => {
  try {
    const adminId = req.user.userId;

    await NotificationService.createNotification(
      adminId,
      "SYSTEM_ALERT",
      "CRITICAL",
      "Database Connection Failed",
      "Unable to connect to PostgreSQL database. Please check your connection settings.",
      undefined
    );

    res.status(201).json({
      status: "success",
      message: "Test SYSTEM_ALERT notification created",
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create test notification",
    });
  }
});

/**
 * POST /api/v1/test/notification/data-issue
 * Create a test DATA_ISSUE notification
 */
router.post("/notification/data-issue", authenticate, async (req: any, res: Response) => {
  try {
    const adminId = req.user.userId;

    await NotificationService.createNotification(
      adminId,
      "DATA_ISSUE",
      "HIGH",
      "Missing Vital Records",
      "Patient John Doe (ID: 12345) has not recorded vitals for 7 days.",
      undefined
    );

    res.status(201).json({
      status: "success",
      message: "Test DATA_ISSUE notification created",
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create test notification",
    });
  }
});

/**
 * POST /api/v1/test/notification/maintenance
 * Create a test SYSTEM_ALERT for maintenance
 */
router.post("/notification/maintenance", authenticate, async (req: any, res: Response) => {
  try {
    const adminId = req.user.userId;

    await NotificationService.createNotification(
      adminId,
      "SYSTEM_ALERT",
      "HIGH",
      "Maintenance Mode Activated",
      "System maintenance will begin at 2:00 AM. All users will be logged out.",
      undefined
    );

    res.status(201).json({
      status: "success",
      message: "Test maintenance notification created",
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create test notification",
    });
  }
});

export default router;
