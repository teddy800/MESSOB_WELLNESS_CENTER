import { Router } from "express";
import {
  getAppointments,
  postAppointment,
  getAppointment,
  updateAppointment,
} from "../controllers/appointments.controller";
import { authenticate, authorizeMinRole } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma";

const router = Router();

// All appointment routes require authentication
// CUSTOMER_STAFF and above can view and create appointments
router.get(
  "/",
  authenticate,
  authorizeMinRole(UserRole.CUSTOMER_STAFF),
  getAppointments,
);

router.post(
  "/",
  authenticate,
  authorizeMinRole(UserRole.CUSTOMER_STAFF),
  postAppointment,
);

router.get(
  "/:id",
  authenticate,
  authorizeMinRole(UserRole.CUSTOMER_STAFF),
  getAppointment,
);

// Only NURSE_OFFICER and above can update appointment status
router.patch(
  "/:id",
  authenticate,
  authorizeMinRole(UserRole.NURSE_OFFICER),
  updateAppointment,
);

export default router;
