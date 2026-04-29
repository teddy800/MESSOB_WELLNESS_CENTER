import { prisma } from "../config/prisma";
import { env } from "../config/env";

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      isActive: true,
      isVerified: true,
      isExternal: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    dateOfBirth?: Date;
    gender?: string;
    phone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }
) {
  // Prepare update data with proper typing
  const updateData: any = {
    updatedAt: new Date(),
  };
  
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.emergencyContactName !== undefined) updateData.emergencyContactName = data.emergencyContactName;
  if (data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = data.emergencyContactPhone;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      updatedAt: true,
    },
  });
}

export async function getUserHealthProfile(userId: string) {
  return prisma.healthProfile.findUnique({
    where: { userId },
  });
}

export async function updateUserHealthProfile(
  userId: string,
  data: {
    bloodType?: string;
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
  }
) {
  // Check if health profile exists
  const existing = await prisma.healthProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    return prisma.healthProfile.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create if doesn't exist
    return prisma.healthProfile.create({
      data: {
        userId,
        ...data,
      },
    });
  }
}

export async function searchUsers(searchTerm: string) {
  return prisma.user.findMany({
    where: {
      OR: [
        {
          fullName: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      isExternal: true,
    },
    take: 20, // Limit results
    orderBy: {
      fullName: 'asc',
    },
  });
}
