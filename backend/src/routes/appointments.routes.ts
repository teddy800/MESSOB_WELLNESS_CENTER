import { Router } from "express";
import {
  getAppointments,
  postAppointment,
  getAppointment,
  updateAppointment,
  sendReminderHandler,
  getQueueHandler,
  getAvailableSlotsHandler,
  checkStaffActiveHandler,
  cancelAppointmentHandler,
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

// Get available time slots for a date - STAFF and above
router.get(
  "/available-slots",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  getAvailableSlotsHandler,
);

// Get queue - NURSE_OFFICER and above
router.get(
  "/queue",
  authenticate,
  authorizeMinRole(UserRole.NURSE_OFFICER),
  getQueueHandler,
);

router.post(
  "/",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  postAppointment,
);

// Cancel appointment - STAFF and above can cancel (must be before /:id routes)
router.delete(
  "/:id/cancel",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  cancelAppointmentHandler,
);

// Send SMS reminder - STAFF and above can request reminders (must be before /:id routes)
router.post(
  "/:id/send-reminder",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  sendReminderHandler,
);

// Check if staff has active appointment - STAFF and above (must be before /:id routes)
router.get(
  "/staff/:staffId/active",
  authenticate,
  authorizeMinRole(UserRole.STAFF),
  checkStaffActiveHandler,
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

export default router;
