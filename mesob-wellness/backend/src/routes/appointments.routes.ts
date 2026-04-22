import { Router } from "express";
import {
  getAppointments,
  postAppointment,
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

export default router;
