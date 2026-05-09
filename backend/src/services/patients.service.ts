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
  try {
    console.log('Creating external patient with input:', {
      fullName: input.fullName,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      registeredByNurseId: input.registeredByNurseId,
    });

    // Validate gender enum value
    const validGenders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
    if (!validGenders.includes(input.gender)) {
      throw new Error(`Invalid gender value: ${input.gender}. Must be one of: ${validGenders.join(', ')}`);
    }

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

    console.log('✓ External patient created:', patient.id);
    return patient;
  } catch (error) {
    console.error('Error creating external patient:', error);
    throw error;
  }
}
