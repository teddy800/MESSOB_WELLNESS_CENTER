import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

/**
 * Dashboard Metrics
 */
router.get("/dashboard/metrics", AdminController.getDashboardMetrics);

/**
 * Regions Management
 */
router.get("/regions", AdminController.getRegions);
router.get("/regions/:region/centers", AdminController.getCentersByRegion);

/**
 * Users Management
 */
router.post("/users", AdminController.createUser);
router.get("/users", AdminController.getUsers);
router.put("/users/:id", AdminController.updateUser);
router.delete("/users/:id", AdminController.deleteUser);

/**
 * Centers Management
 */
router.post("/centers", AdminController.createCenter);
router.get("/centers", AdminController.getCenters);

/**
 * Appointments Management
 */
router.get("/appointments", AdminController.getAppointments);

/**
 * Vitals Management
 */
router.get("/vitals", AdminController.getVitals);

/**
 * Feedback Management
 */
router.get("/feedback", AdminController.getFeedback);

/**
 * Audit Logs
 */
router.get("/audit-logs", AdminController.getAuditLogs);

export default router;
