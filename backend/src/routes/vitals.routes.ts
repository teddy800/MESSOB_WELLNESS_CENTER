import { Router } from "express";
import {
  getVitalsModuleStatus,
  postBmi,
  postBloodPressure,
} from "../controllers/vitals.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma";

const router = Router();

// Public route - no authentication required
router.get("/status", getVitalsModuleStatus);

// Protected routes - require authentication
// Only NURSE_OFFICER and higher roles can record vitals
router.post(
  "/bmi",
  authenticate,
  authorize(
    UserRole.NURSE_OFFICER,
    UserRole.MANAGER,
    UserRole.REGIONAL_OFFICE,
    UserRole.FEDERAL_ADMIN,
  ),
  postBmi,
);

router.post(
  "/blood-pressure",
  authenticate,
  authorize(
    UserRole.NURSE_OFFICER,
    UserRole.MANAGER,
    UserRole.REGIONAL_OFFICE,
    UserRole.FEDERAL_ADMIN,
  ),
  postBloodPressure,
);

export default router;
