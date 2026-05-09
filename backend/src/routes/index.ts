import { Router } from "express";
import authRoutes from "./auth.routes";
import appointmentsRoutes from "./appointments.routes";
import vitalsRoutes from "./vitals.routes";
import usersRoutes from "./users.routes";
import wellnessRoutes from "./wellness.routes";
import feedbackRoutes from "./feedback.routes";
import centersRoutes from "./centers.routes";
import analyticsRoutes from "./analytics.routes";
import regionsRoutes from "./regions.routes";
import hrRoutes from "./hr.routes";
import patientsRoutes from "./patients.routes";
import reportsRoutes from "./reports.routes";
import adminRoutes from "./admin.routes";
import notificationsRoutes from "./notifications.routes";
import settingsRoutes from "./settings.routes";
import testRoutes from "./test.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/vitals", vitalsRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/plans", wellnessRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/centers", centersRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/patients", patientsRoutes);
router.use("/reports", reportsRoutes);
router.use("/admin", adminRoutes); // Admin dashboard endpoints
router.use("/notifications", notificationsRoutes); // Notifications endpoints
router.use("/settings", settingsRoutes); // System settings endpoints
router.use("/test", testRoutes); // Test endpoints for notifications
router.use("/", regionsRoutes); // Regions and centers at root level
router.use("/hr", hrRoutes); // HR integration endpoints

export default router;
