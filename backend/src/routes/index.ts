import { Router } from "express";
import authRoutes from "./auth.routes";
import appointmentsRoutes from "./appointments.routes";
import vitalsRoutes from "./vitals.routes";
import usersRoutes from "./users.routes";
import wellnessRoutes from "./wellness.routes";
import feedbackRoutes from "./feedback.routes";
import centersRoutes from "./centers.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/vitals", vitalsRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/plans", wellnessRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/centers", centersRoutes);

export default router;
