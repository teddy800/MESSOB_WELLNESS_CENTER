import { Request, Response } from "express";
import {
  createAppointment,
  listAppointments,
} from "../services/appointments.service";

interface AppointmentRequestBody {
  patientId: unknown;
  scheduledAt: unknown;
  reason: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getAppointments(_req: Request, res: Response): void {
  res.status(200).json({
    status: "success",
    data: listAppointments(),
  });
}

export function postAppointment(req: Request, res: Response): void {
  const { patientId, scheduledAt, reason } =
    req.body as Partial<AppointmentRequestBody>;

  if (
    typeof patientId !== "number" ||
    !Number.isInteger(patientId) ||
    patientId <= 0
  ) {
    res.status(400).json({
      status: "error",
      message: "patientId must be a positive integer.",
    });
    return;
  }

  if (!isNonEmptyString(scheduledAt) || Number.isNaN(Date.parse(scheduledAt))) {
    res.status(400).json({
      status: "error",
      message: "scheduledAt must be a valid ISO date string.",
    });
    return;
  }

  if (!isNonEmptyString(reason)) {
    res.status(400).json({
      status: "error",
      message: "reason is required.",
    });
    return;
  }

  const appointment = createAppointment({
    patientId,
    scheduledAt,
    reason: reason.trim(),
  });

  res.status(201).json({
    status: "success",
    data: appointment,
  });
}
