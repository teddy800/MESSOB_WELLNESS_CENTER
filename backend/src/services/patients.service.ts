import { prisma } from "../config/prisma";
import { UserRole, Gender } from "../generated/prisma";

interface CreateExternalPatientInput {
  fullName: string;
  email: string | null;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  registeredByNurseId: string;
}

export async function createExternalPatient(input: CreateExternalPatientInput) {
  const patient = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender as Gender,
      role: UserRole.EXTERNAL_PATIENT,
      isExternal: true,
      canLogin: false,
      employeeId: null,
      centerId: null,
      password: null,
      isActive: true,
    },
  });

  return patient;
}
