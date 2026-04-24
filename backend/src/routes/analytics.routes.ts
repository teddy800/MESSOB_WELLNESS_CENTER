import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";

const router = Router();

// System Settings
router.get("/settings", analyticsController.getSystemSettings);
router.put("/settings", analyticsController.updateSystemSettings);

// Capacity Management
router.get("/capacity", analyticsController.getCapacityInfo);

// Booking Statistics
router.get("/appointments/stats", analyticsController.getBookingStats);

// Queue Analytics
router.get("/queue/analytics", analyticsController.getQueueAnalytics);

// Health Analytics
router.get("/health/analytics", analyticsController.getHealthAnalytics);

export default router;