import { AppointmentStatus } from "../generated/prisma";
import { prisma } from "../config/prisma";

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

export async function checkStaffActiveAppointment(staffId: string): Promise<boolean> {
  const activeAppointment = await prisma.appointment.findFirst({
    where: {
      userId: staffId,
      status: {
        in: [AppointmentStatus.WAITING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.IN_SERVICE],
      },
    },
  });
  return !!activeAppointment;
}

export async function getStaffActiveAppointment(staffId: string) {
  return prisma.appointment.findFirst({
    where: {
      userId: staffId,
      status: {
        in: [AppointmentStatus.WAITING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.IN_SERVICE],
      },
    },
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

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  // Check if staff already has an active appointment
  const hasActiveAppointment = await checkStaffActiveAppointment(input.patientId);
  if (hasActiveAppointment) {
    throw new Error('Staff member already has an active appointment. Please cancel the existing appointment before booking a new one.');
  }

  // Parse the date and time from scheduledAt
  let appointmentDateTime: Date;
  
  console.log(`[createAppointment] Input scheduledAt: ${input.scheduledAt}`);
  
  // Handle ISO format with time (e.g., "2026-05-15T08:30:00+03:00")
  if (input.scheduledAt.includes('T')) {
    appointmentDateTime = new Date(input.scheduledAt);
    console.log(`[createAppointment] Parsed ISO format with time`);
  } 
  // Handle date-only format (YYYY-MM-DD) - legacy support
  else if (input.scheduledAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = input.scheduledAt.split('-').map(Number);
    appointmentDateTime = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    
    // Auto-assign next available slot for date-only bookings
    const SERVICE_START_HOUR = 5;
    const SERVICE_START_MINUTE = 30;
    appointmentDateTime.setUTCHours(SERVICE_START_HOUR, SERVICE_START_MINUTE, 0, 0);
    console.log(`[createAppointment] Date-only format - assigning first slot`);
  } else {
    throw new Error('Invalid date format. Use ISO format with time or YYYY-MM-DD');
  }

  // Service hours in Ethiopia (UTC+3): 8:30 AM to 5:30 PM EAT
  // Converted to UTC: 5:30 AM to 2:30 PM UTC
  const SERVICE_START_HOUR = 5; // 5:30 AM UTC = 8:30 AM EAT
  const SERVICE_START_MINUTE = 30;
  const SERVICE_END_HOUR = 14; // 2:30 PM UTC = 5:30 PM EAT
  const SERVICE_END_MINUTE = 30;

  // Validate that the requested time is within service hours
  const hours = appointmentDateTime.getUTCHours();
  const minutes = appointmentDateTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  const serviceStartMinutes = SERVICE_START_HOUR * 60 + SERVICE_START_MINUTE;
  const serviceEndMinutes = SERVICE_END_HOUR * 60 + SERVICE_END_MINUTE;

  if (totalMinutes < serviceStartMinutes || totalMinutes >= serviceEndMinutes) {
    throw new Error('Appointment time must be between 8:30 AM and 5:30 PM (Ethiopia time)');
  }

  // Validate that the time is on a 15-minute interval
  if (minutes % 15 !== 0) {
    throw new Error('Appointment time must be on 15-minute intervals (e.g., 8:30, 8:45, 9:00)');
  }

  // Check if this exact time slot is already booked
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      scheduledAt: appointmentDateTime,
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
    },
  });

  if (existingAppointment) {
    throw new Error('This time slot is already booked. Please choose another time.');
  }

  console.log(`[createAppointment] Booking appointment at: ${appointmentDateTime.toISOString()}`);

  const appointment = await prisma.appointment.create({
    data: {
      userId: input.patientId,
      scheduledAt: appointmentDateTime,
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

export async function getAvailableTimeSlots(dateString: string): Promise<string[]> {
  // Parse the date (YYYY-MM-DD format)
  const [year, month, day] = dateString.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  console.log(`[getAvailableTimeSlots] Querying for date: ${dateString}`);
  console.log(`[getAvailableTimeSlots] UTC range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

  // Get all booked appointments for this date
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
    },
    select: {
      scheduledAt: true,
      userId: true,
    },
  });

  console.log(`[getAvailableTimeSlots] Found ${bookedAppointments.length} booked appointments`);
  bookedAppointments.forEach(apt => {
    console.log(`  - Appointment at ${apt.scheduledAt.toISOString()} for user ${apt.userId}`);
  });

  // Create set of booked times for quick lookup
  const bookedTimes = new Set(
    bookedAppointments.map(apt => apt.scheduledAt.toISOString())
  );

  // Generate all possible time slots (8:30 AM - 5:15 PM Ethiopia time)
  // In UTC: 5:30 AM - 2:15 PM
  const SERVICE_START_HOUR = 5;
  const SERVICE_START_MINUTE = 30;
  const SERVICE_END_HOUR = 14;
  const SERVICE_END_MINUTE = 15; // Last slot at 5:15 PM (14:15 UTC)
  const SLOT_INTERVAL = 15;

  const availableSlots: string[] = [];
  const slotDate = new Date(Date.UTC(year, month - 1, day, SERVICE_START_HOUR, SERVICE_START_MINUTE, 0, 0));

  while (
    slotDate.getUTCHours() < SERVICE_END_HOUR ||
    (slotDate.getUTCHours() === SERVICE_END_HOUR && slotDate.getUTCMinutes() <= SERVICE_END_MINUTE)
  ) {
    const slotISO = slotDate.toISOString();
    
    if (!bookedTimes.has(slotISO)) {
      availableSlots.push(slotISO);
    }

    slotDate.setUTCMinutes(slotDate.getUTCMinutes() + SLOT_INTERVAL);
  }

  console.log(`[getAvailableTimeSlots] Available slots: ${availableSlots.length}`);

  return availableSlots;
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
      updateData.cancelledAt = new Date();
      if (cancellationReason) updateData.cancellationReason = cancellationReason;
      break;
    case AppointmentStatus.NO_SHOW:
      // NO_SHOW automatically cancels the appointment
      updateData.status = AppointmentStatus.CANCELLED;
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = cancellationReason || 'No-show';
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
  let whereClause: any = {
    status: {
      in: [
        AppointmentStatus.WAITING,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.IN_SERVICE,
        AppointmentStatus.NO_SHOW,
        AppointmentStatus.COMPLETED,
        // Legacy support
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
      ],
    },
  };

  if (dateString) {
    // Parse the provided date string (YYYY-MM-DD format)
    const [year, month, day] = dateString.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
    
    console.log(`Fetching queue appointments for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    whereClause.scheduledAt = {
      gte: startDate,
      lt: endDate,
    };
  } else {
    // No date provided - fetch all appointments (all time)
    console.log('Fetching all queue appointments (all time)');
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    orderBy: { scheduledAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          userId: true,
          isExternal: true,
        },
      },
    },
  });

  console.log(`Found ${appointments.length} appointments in queue`);

  // All appointments in this list are appointment-based (they have appointment records)
  // Walk-ins (whether external patients or staff coming for emergency) don't have appointment records
  // So we only return appointments that exist in the appointments table
  return appointments.map((apt) => ({
    id: apt.id,
    appointmentId: apt.id,
    customerName: apt.user.fullName,
    customerId: apt.userId,
    userId: apt.user.userId,
    customerEmail: apt.user.email,
    checkInTime: apt.scheduledAt.toISOString(),
    scheduledAt: apt.scheduledAt.toISOString(),
    reason: apt.reason,
    status: apt.status === AppointmentStatus.PENDING ? 'WAITING' : apt.status, // Map legacy PENDING to WAITING
    type: 'ONLINE', // Default to ONLINE, can be enhanced later
    notes: apt.notes || undefined,
  }));
}

export async function cancelAppointment(
  id: string,
  cancellationReason: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Check if appointment can be cancelled (not already completed or cancelled)
  if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
    throw new Error(`Cannot cancel appointment with status ${appointment.status}`);
  }

  return prisma.appointment.update({
    where: { id },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason,
      updatedAt: new Date(),
    },
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
