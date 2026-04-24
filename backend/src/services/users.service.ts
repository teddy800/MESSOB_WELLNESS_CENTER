import { PrismaClient } from "../generated/prisma";
import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";

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

// Manager Dashboard: Get all users with filtering
export async function getAllUsers(filters?: {
  role?: string;
  centerId?: string;
  isActive?: boolean;
  search?: string;
}) {
  const where: any = {};

  if (filters?.role) {
    where.role = filters.role;
  }

  if (filters?.centerId) {
    where.centerId = filters.centerId;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      centerId: true,
      phone: true,
      isActive: true,
      isVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Manager Dashboard: Create new user (nurse/staff)
export async function createUser(userData: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  centerId?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const createData: any = {
    email: userData.email,
    password: hashedPassword,
    fullName: userData.fullName,
    role: userData.role,
    isActive: true,
    isVerified: true,
  };

  if (userData.centerId) createData.centerId = userData.centerId;
  if (userData.phone) createData.phone = userData.phone;
  if (userData.dateOfBirth) createData.dateOfBirth = userData.dateOfBirth;
  if (userData.gender) createData.gender = userData.gender;

  return prisma.user.create({
    data: createData,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      centerId: true,
      phone: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

// Manager Dashboard: Update user status
export async function updateUserStatus(userId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { 
      isActive,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
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
