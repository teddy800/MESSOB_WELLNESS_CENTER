import { PrismaClient, AppointmentStatus } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env";

const adapter = new PrismaMariaDb({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

const prisma = new PrismaClient({ adapter });

interface AppointmentInput {
  patientId: number;
  scheduledAt: string;
  reason: string;
}

interface Appointment extends AppointmentInput {
  id: number;
  status: string;
  createdAt: string;
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const appointment = await prisma.appointment.create({
    data: {
      userId: String(input.patientId), // Convert to string for UUID
      scheduledAt: new Date(input.scheduledAt),
      reason: input.reason,
      status: AppointmentStatus.PENDING,
    },
  });

  return {
    id: parseInt(appointment.id.substring(0, 8), 16), // Convert UUID to number for compatibility
    patientId: input.patientId,
    scheduledAt: appointment.scheduledAt.toISOString(),
    reason: appointment.reason,
    status: appointment.status.toLowerCase() as "pending",
    createdAt: appointment.createdAt.toISOString(),
  };
}

export async function listAppointments(userId?: string, status?: string): Promise<Appointment[]> {
  const where: any = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (status) {
    where.status = status.toUpperCase() as AppointmentStatus;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return appointments.map((apt) => ({
    id: parseInt(apt.id.substring(0, 8), 16),
    patientId: parseInt(apt.userId.substring(0, 8), 16),
    scheduledAt: apt.scheduledAt.toISOString(),
    reason: apt.reason,
    status: apt.status.toLowerCase() as any,
    createdAt: apt.createdAt.toISOString(),
    patient: apt.user,
    notes: apt.notes || undefined,
    diagnosis: apt.diagnosis || undefined,
    prescription: apt.prescription || undefined,
  }));
}

export async function getAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  notes?: string,
  diagnosis?: string,
  prescription?: string,
  cancellationReason?: string
) {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  // Set timestamp based on status
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      updateData.confirmedAt = new Date();
      break;
    case AppointmentStatus.IN_PROGRESS:
      updateData.startedAt = new Date();
      break;
    case AppointmentStatus.COMPLETED:
      updateData.completedAt = new Date();
      if (diagnosis) updateData.diagnosis = diagnosis;
      if (prescription) updateData.prescription = prescription;
      break;
    case AppointmentStatus.CANCELLED:
    case AppointmentStatus.NO_SHOW:
      updateData.cancelledAt = new Date();
      if (cancellationReason) updateData.cancellationReason = cancellationReason;
      break;
  }

  if (notes) {
    updateData.notes = notes;
  }

  return prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}
