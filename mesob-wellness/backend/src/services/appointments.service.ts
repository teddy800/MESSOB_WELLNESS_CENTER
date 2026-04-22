import type { Appointment, AppointmentInput } from "../models/appointment";

const appointments: Appointment[] = [];
let nextAppointmentId = 1;

export function createAppointment(input: AppointmentInput): Appointment {
  const appointment: Appointment = {
    id: nextAppointmentId,
    patientId: input.patientId,
    scheduledAt: input.scheduledAt,
    reason: input.reason,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  nextAppointmentId += 1;
  appointments.push(appointment);

  return appointment;
}

export function listAppointments(): Appointment[] {
  return [...appointments];
}
