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
  
  console.log(`[createAppointment] Input scheduledAt: ${input.scheduledAt}`);
  
  if (input.scheduledAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Date string format (YYYY-MM-DD) - create UTC date to avoid timezone issues
    const [year, month, day] = input.scheduledAt.split('-').map(Number);
    appointmentDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    console.log(`[createAppointment] Parsed YYYY-MM-DD format: year=${year}, month=${month}, day=${day}`);
  } else {
    // ISO format - parse normally
    appointmentDate = new Date(input.scheduledAt);
    appointmentDate.setUTCHours(0, 0, 0, 0);
    console.log(`[createAppointment] Parsed ISO format`);
  }

  // Service hours: 2:30 AM to 11:30 AM (UTC)
  const SERVICE_START_HOUR = 2; // 2:30 AM
  const SERVICE_START_MINUTE = 30;
  const SERVICE_END_HOUR = 11; // 11:30 AM
  const SERVICE_END_MINUTE = 30;
  const TIME_PER_CUSTOMER_MINUTES = 15; // 15 minutes per customer

  // Get all appointments for THIS SPECIFIC DATE to find the next available slot
  const startOfDay = new Date(appointmentDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(appointmentDate);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  console.log(`[createAppointment] Appointment date (UTC): ${appointmentDate.toISOString()}`);
  console.log(`[createAppointment] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  console.log(`[createAppointment] Found ${existingAppointments.length} existing appointments on this date`);

  // Calculate next available time slot
  let nextSlotTime = new Date(appointmentDate);
  nextSlotTime.setUTCHours(SERVICE_START_HOUR, SERVICE_START_MINUTE, 0, 0);

  // If there are existing appointments, find the next available slot after the last one
  if (existingAppointments.length > 0) {
    const lastAppointment = existingAppointments[existingAppointments.length - 1];
    nextSlotTime = new Date(lastAppointment.scheduledAt);
    nextSlotTime.setUTCMinutes(nextSlotTime.getUTCMinutes() + TIME_PER_CUSTOMER_MINUTES);
    console.log(`[createAppointment] Last appointment at: ${lastAppointment.scheduledAt.toISOString()}, next slot: ${nextSlotTime.toISOString()}`);
  }

  // Check if the calculated time is within service hours
  const hours = nextSlotTime.getUTCHours();
  const minutes = nextSlotTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  const serviceEndTotalMinutes = SERVICE_END_HOUR * 60 + SERVICE_END_MINUTE;

  // If time exceeds service hours, reject the booking (day is full)
  if (totalMinutes > serviceEndTotalMinutes) {
    throw new Error('No available slots for this date. Please choose another date.');
  }

  console.log(`[createAppointment] Booking appointment at: ${nextSlotTime.toISOString()}`);

  const appointment = await prisma.appointment.create({
    data: {
      userId: input.patientId,
      scheduledAt: nextSlotTime,
      reason: input.reason,
      status: AppointmentStatus.WAITING,
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
    case AppointmentStatus.WAITING:
      // Initial waiting state - no specific timestamp
      break;
    case AppointmentStatus.CONFIRMED:
      updateData.confirmedAt = new Date();
      break;
    case AppointmentStatus.IN_PROGRESS:
      updateData.startedAt = new Date();
      break;
    case AppointmentStatus.IN_SERVICE:
      // Patient is being served - vitals being recorded
      if (!updateData.startedAt) {
        updateData.startedAt = new Date();
      }
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
  let startDate: Date;
  let endDate: Date;

  if (dateString) {
    // Parse the provided date string (YYYY-MM-DD format)
    const [year, month, day] = dateString.split('-').map(Number);
    startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  } else {
    // Use today's date in UTC
    const now = new Date();
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  }

  console.log(`Fetching queue appointments for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startDate,
        lt: endDate,
      },
      status: {
        in: [
          AppointmentStatus.WAITING,
          AppointmentStatus.IN_PROGRESS,
          AppointmentStatus.IN_SERVICE,
          AppointmentStatus.COMPLETED,
          // Legacy support
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
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

  console.log(`Found ${appointments.length} appointments in queue`);

  return appointments.map((apt) => ({
    id: apt.id,
    appointmentId: apt.id,
    customerName: apt.user.fullName,
    customerId: apt.userId,
    customerEmail: apt.user.email,
    checkInTime: apt.scheduledAt.toISOString(),
    scheduledAt: apt.scheduledAt.toISOString(),
    reason: apt.reason,
    status: apt.status === AppointmentStatus.PENDING ? 'WAITING' : apt.status, // Map legacy PENDING to WAITING
    type: 'ONLINE', // Default to ONLINE, can be enhanced later
    notes: apt.notes || undefined,
  }));
}
