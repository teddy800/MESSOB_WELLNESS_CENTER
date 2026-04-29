import { Router } from "express";
import { createExternalPatientHandler } from "../controllers/patients.controller";
import { authenticate, authorizeMinRole } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma";

const router = Router();

// Register external patient - NURSE_OFFICER and above
router.post(
  "/external",
  authenticate,
  authorizeMinRole(UserRole.NURSE_OFFICER),
  createExternalPatientHandler,
);

export default router;
