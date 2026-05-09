import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { authenticate, authorizeMinRole } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma";

const router = Router();

// ─── Public-ish (authenticated) ──────────────────────────────────────────────
router.get("/settings",      authenticate, analyticsController.getSystemSettings);
router.put("/settings",      authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.updateSystemSettings);

// ─── Manager+ only ───────────────────────────────────────────────────────────
router.get("/capacity",             authenticate, authorizeMinRole(UserRole.NURSE_OFFICER), analyticsController.getCapacityInfo);
router.get("/appointments/stats",   authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.getBookingStats);
router.get("/queue/analytics",      authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.getQueueAnalytics);
router.get("/health/analytics",     authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.getHealthAnalytics);

// ─── Staff / User management ─────────────────────────────────────────────────
router.get("/users/staff",          authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.getStaffUsers);
router.post("/users/staff",         authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.createStaffUser);
router.put("/users/:userId",        authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.updateStaffUser);
router.patch("/users/:userId/toggle", authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.toggleUserStatus);

// ─── Audit logs ──────────────────────────────────────────────────────────────
router.get("/audit-logs",           authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.getAuditLogs);

// ─── Trends (daily / weekly / monthly) ───────────────────────────────────────
router.get("/trends",               authenticate, authorizeMinRole(UserRole.MANAGER), analyticsController.getTrends);

export default router;
