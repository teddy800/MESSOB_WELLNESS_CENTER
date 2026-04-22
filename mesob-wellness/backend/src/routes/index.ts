import { Router } from "express";
import authRoutes from "./auth.routes";
import appointmentsRoutes from "./appointments.routes";
import vitalsRoutes from "./vitals.routes";

const router = Router();

// Authentication routes
router.use("/auth", authRoutes);

// Protected resource routes
router.use("/vitals", vitalsRoutes);
router.use("/appointments", appointmentsRoutes);

export default router;
