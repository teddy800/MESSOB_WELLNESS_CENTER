import { Request, Response } from "express";
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getQueueAppointments,
} from "../services/appointments.service";
import { sendAppointmentReminder } from "../services/email.service";
import { AppointmentStatus } from "../generated/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../config/prisma";

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
    const userId = req.user?.userId; // Get authenticated user's ID
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

  // Use authenticated user's ID if patientId is not provided or is invalid
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  console.log(`[postAppointment] Received request - scheduledAt: ${scheduledAt}, reason: ${reason}`);

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
      patientId: userId, // Use authenticated user's ID
      scheduledAt,
      reason: reason.trim(),
    });

    console.log(`[postAppointment] Appointment created successfully: ${appointment.id}`);

    res.status(201).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    console.error("Appointment creation error:", error);
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create appointment",
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

export async function sendReminderHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const appointmentId = req.params.id;
    const userId = req.user?.userId;

    if (!appointmentId || typeof appointmentId !== "string") {
      res.status(400).json({
        status: "error",
        message: "Appointment ID is required",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const appointment = await getAppointmentById(appointmentId);

    if (!appointment) {
      res.status(404).json({
        status: "error",
        message: "Appointment not found",
      });
      return;
    }

    // Send email reminder
    const emailSent = await sendAppointmentReminder(
      appointment.user.email,
      appointment.user.fullName,
      appointmentId,
      new Date(appointment.scheduledAt).toLocaleString(),
      appointment.reason
    );

    // Update appointment with reminder tracking
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        reminderSentAt: new Date(),
        reminderCount: { increment: 1 },
        lastReminderBy: userId,
      },
    });

    if (emailSent) {
      console.log(`✅ Email reminder sent for appointment ${appointmentId} by user ${userId}`);
      res.status(200).json({
        status: "success",
        message: "Email reminder sent successfully",
        data: {
          appointmentId,
          emailSent: true,
          reminderCount: updatedAppointment.reminderCount,
          timestamp: updatedAppointment.reminderSentAt,
        },
      });
    } else {
      console.warn(`⚠️ Email reminder failed for appointment ${appointmentId}`);
      res.status(500).json({
        status: "error",
        message: "Failed to send email reminder. Please check email configuration.",
      });
    }
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to send reminder",
    });
  }
}


export async function getQueueHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const date = req.query.date as string | undefined;
    const queue = await getQueueAppointments(date);

    res.status(200).json({
      status: "success",
      data: queue,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve queue",
    });
  }
}
