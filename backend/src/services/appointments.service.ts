import { AppointmentStatus } from "../generated/prisma";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

interface AppointmentInput {
  patientId: string; // UUID string
  scheduledAt: string;
  reason: string;
}

interface Appointment {
  id: string;
  patientId: string;
  scheduledAt: string;
  reason: string;
  status: string;
  createdAt: string;
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  // Parse the date from scheduledAt - handle both YYYY-MM-DD and ISO formats
  let appointmentDate: Date;
  
  if (input.scheduledAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Date string format (YYYY-MM-DD) - create UTC date to avoid timezone issues
    const [year, month, day] = input.scheduledAt.split('-').map(Number);
    appointmentDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  } else {
    // ISO format - parse normally
    appointmentDate = new Date(input.scheduledAt);
    appointmentDate.setUTCHours(0, 0, 0, 0);
  }

  // Service hours: 2:30 AM to 11:30 AM (UTC)
  const SERVICE_START_HOUR = 2; // 2:30 AM
  const SERVICE_START_MINUTE = 30;
  const SERVICE_END_HOUR = 11; // 11:30 AM
  const SERVICE_END_MINUTE = 30;
  const TIME_PER_CUSTOMER_MINUTES = 15; // 15 minutes per customer

  // Get all appointments for this date to find the next available slot
  const startOfDay = new Date(appointmentDate);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
  
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // Calculate next available time slot
  let nextSlotTime = new Date(appointmentDate);
  nextSlotTime.setUTCHours(SERVICE_START_HOUR, SERVICE_START_MINUTE, 0, 0);

  // If there are existing appointments, find the next available slot after the last one
  if (existingAppointments.length > 0) {
    const lastAppointment = existingAppointments[existingAppointments.length - 1];
    nextSlotTime = new Date(lastAppointment.scheduledAt);
    nextSlotTime.setUTCMinutes(nextSlotTime.getUTCMinutes() + TIME_PER_CUSTOMER_MINUTES);
  }

  // Check if the calculated time is within service hours
  const hours = nextSlotTime.getUTCHours();
  const minutes = nextSlotTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  const serviceEndTotalMinutes = SERVICE_END_HOUR * 60 + SERVICE_END_MINUTE;

  // If time exceeds service hours, move to next day at service start time
  if (totalMinutes > serviceEndTotalMinutes) {
    nextSlotTime = new Date(appointmentDate);
    nextSlotTime.setUTCDate(nextSlotTime.getUTCDate() + 1);
    nextSlotTime.setUTCHours(SERVICE_START_HOUR, SERVICE_START_MINUTE, 0, 0);
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: input.patientId,
      scheduledAt: nextSlotTime,
      reason: input.reason,
      status: AppointmentStatus.PENDING,
    },
  });

  return {
    id: appointment.id,
    patientId: appointment.userId,
    scheduledAt: appointment.scheduledAt.toISOString(),
    reason: appointment.reason,
    status: appointment.status.toLowerCase(),
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
    id: apt.id,
    patientId: apt.userId,
    scheduledAt: apt.scheduledAt.toISOString(),
    reason: apt.reason,
    status: apt.status.toLowerCase(),
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


export async function getQueueAppointments(dateString?: string) {
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  // If a date is provided, use that date instead of today
  if (dateString) {
    const providedDate = new Date(dateString);
    startDate = new Date(providedDate);
    startDate.setHours(0, 0, 0, 0);
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startDate,
        lt: endDate,
      },
      status: {
        in: [
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PENDING,
          AppointmentStatus.IN_PROGRESS,
          AppointmentStatus.COMPLETED,
        ],
      },
    },
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
    id: apt.id,
    appointmentId: apt.id,
    customerName: apt.user.fullName,
    customerId: apt.userId,
    checkInTime: apt.scheduledAt.toISOString(),
    scheduledAt: apt.scheduledAt.toISOString(),
    reason: apt.reason,
    status: apt.status === AppointmentStatus.IN_PROGRESS ? 'IN_SERVICE' : 
            apt.status === AppointmentStatus.COMPLETED ? 'COMPLETED' : 'WAITING',
    type: 'ONLINE', // Default to ONLINE, can be enhanced later
    notes: apt.notes || undefined,
  }));
}
