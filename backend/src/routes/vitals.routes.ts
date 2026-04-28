import { Router } from "express";
import {
  getVitalsModuleStatus,
  postVitals,
  postBmi,
  postBloodPressure,
  getVitalsHistoryHandler,
  getLatestVitalsHandler,
  getRiskScoreHandler,
} from "../controllers/vitals.controller";
import {
  authenticate,
  authorize,
  authorizeSelfOrAdmin,
} from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma";

const router = Router();

// Public route - no authentication required
router.get("/status", getVitalsModuleStatus);

// Protected routes - require authentication
// Only NURSE_OFFICER and higher roles can record vitals
router.post(
  "/",
  authenticate,
  authorize(
    UserRole.NURSE_OFFICER,
    UserRole.MANAGER,
    UserRole.REGIONAL_OFFICE,
    UserRole.FEDERAL_ADMIN,
  ),
  postVitals,
);

router.post(
  "/bmi",
  authenticate,
  authorize(
    UserRole.NURSE_OFFICER,
    UserRole.MANAGER,
    UserRole.REGIONAL_OFFICE,
    UserRole.SYSTEM_ADMIN,
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
    UserRole.SYSTEM_ADMIN,
  ),
  postBloodPressure,
);

// Get vitals history - user can view own history, admins can view any
router.get(
  "/history/:userId",
  authenticate,
  authorizeSelfOrAdmin("userId"),
  getVitalsHistoryHandler,
);

// Get latest vitals - user can view own latest, admins can view any
router.get(
  "/latest/:userId",
  authenticate,
  authorizeSelfOrAdmin("userId"),
  getLatestVitalsHandler,
);

// Get risk score - user can view own risk score, admins can view any
router.get(
  "/risk-score/:userId",
  authenticate,
  authorizeSelfOrAdmin("userId"),
  getRiskScoreHandler,
);

export default router;
