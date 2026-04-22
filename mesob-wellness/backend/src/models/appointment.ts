export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface AppointmentInput {
  patientId: number;
  scheduledAt: string;
  reason: string;
}

export interface Appointment extends AppointmentInput {
  id: number;
  status: AppointmentStatus;
  createdAt: string;
}
