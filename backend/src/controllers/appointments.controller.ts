import { Request, Response } from "express";
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} from "../services/appointments.service";
import { AppointmentStatus } from "../generated/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

interface AppointmentRequestBody {
  patientId: unknown;
  scheduledAt: unknown;
  reason: unknown;
}

interface UpdateStatusRequestBody {
  status: unknown;
  notes?: unknown;
  diagnosis?: unknown;
  prescription?: unknown;
  cancellationReason?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function getAppointments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;

    const appointments = await listAppointments(userId, status);

    res.status(200).json({
      status: "success",
      data: {
        count: appointments.length,
        appointments,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve appointments",
    });
  }
}

export async function postAppointment(req: AuthRequest, res: Response): Promise<void> {
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

  try {
    const appointment = await createAppointment({
      patientId,
      scheduledAt,
      reason: reason.trim(),
    });

    res.status(201).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create appointment",
    });
  }
}

export async function getAppointment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        status: "error",
        message: "Appointment ID is required",
      });
      return;
    }

    const appointment = await getAppointmentById(id);

    if (!appointment) {
      res.status(404).json({
        status: "error",
        message: "Appointment not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve appointment",
    });
  }
}

export async function updateAppointment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const { status, notes, diagnosis, prescription, cancellationReason } =
      req.body as Partial<UpdateStatusRequestBody>;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        status: "error",
        message: "Appointment ID is required",
      });
      return;
    }

    if (!isNonEmptyString(status)) {
      res.status(400).json({
        status: "error",
        message: "Status is required",
      });
      return;
    }

    // Validate status
    const validStatuses = Object.values(AppointmentStatus);
    const upperStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperStatus as AppointmentStatus)) {
      res.status(400).json({
        status: "error",
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const appointment = await updateAppointmentStatus(
      id,
      upperStatus as AppointmentStatus,
      typeof notes === "string" ? notes : undefined,
      typeof diagnosis === "string" ? diagnosis : undefined,
      typeof prescription === "string" ? prescription : undefined,
      typeof cancellationReason === "string" ? cancellationReason : undefined
    );

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({
        status: "error",
        message: "Appointment not found",
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update appointment",
    });
  }
}
