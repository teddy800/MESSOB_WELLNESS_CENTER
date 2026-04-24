import { Router } from "express";
import authRoutes from "./auth.routes";
import appointmentsRoutes from "./appointments.routes";
import vitalsRoutes from "./vitals.routes";
import usersRoutes from "./users.routes";
import wellnessRoutes from "./wellness.routes";
import feedbackRoutes from "./feedback.routes";
import centersRoutes from "./centers.routes";
import analyticsRoutes from "./analytics.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/vitals", vitalsRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/plans", wellnessRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/centers", centersRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
