import { Router } from "express";
import {
  getAppointments,
  postAppointment,
  getAppointment,
  updateAppointment,
  sendReminderHandler,
} from "../controllers/appointments.controller";
import { authenticate, authorizeMinRole } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma";

const router = Router();

// All appointment routes require authentication
// STAFF and above can view and create appointments
router.get(
  "/",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  getAppointments,
);

router.post(
  "/",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  postAppointment,
);

router.get(
  "/:id",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  getAppointment,
);

// Only NURSE_OFFICER and above can update appointment status
router.patch(
  "/:id",
  authenticate,
  authorizeMinRole(UserRole.NURSE_OFFICER),
  updateAppointment,
);

// Send SMS reminder - STAFF and above can request reminders
router.post(
  "/:id/send-reminder",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  sendReminderHandler,
);

export default router;
