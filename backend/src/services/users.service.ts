import { PrismaClient } from "../generated/prisma";
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

/**
 * FIX: Added centerId and lastLoginAt to the select so the frontend
 * can display center assignment and last login time on the Profile page.
 */
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      centerId: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      isActive: true,
      isVerified: true,
      lastLoginAt: true,
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
      centerId: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      isActive: true,
      isVerified: true,
      lastLoginAt: true,
      createdAt: true,
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
  const existing = await prisma.healthProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    return prisma.healthProfile.update({
      where: { userId },
      data: { ...data, updatedAt: new Date() },
    });
  } else {
    return prisma.healthProfile.create({
      data: { userId, ...data },
    });
  }
}
