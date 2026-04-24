import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as analyticsController from "../controllers/analytics.controller";
import * as reportsController from "../controllers/reports.controller";

const router = Router();

// All analytics routes require authentication and manager+ role
router.use(authenticate);

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

// Staff Performance
router.get("/staff/performance", analyticsController.getStaffPerformance);

// Audit Trail
router.get("/audit-trail", analyticsController.getAuditTrail);

// Reports
router.post("/reports/generate", reportsController.generateReport);
router.get("/reports/monthly/:year/:month", reportsController.generateMonthlyReport);
router.get("/reports/quarterly/:year/:quarter", reportsController.generateQuarterlyReport);

export default router;