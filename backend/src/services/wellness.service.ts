import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { Prisma } from "../generated/prisma";
import { upsertPatientConditions } from "./patientConditions.service";

export interface CreateWellnessPlanInput {
  userId: string;
  planText: string;
  goals?: string;
  duration?: number;
  conditions?: string[];
}

export async function createWellnessPlan(input: CreateWellnessPlanInput, nurseId?: string) {
  // Use transaction to ensure both wellness plan and conditions are saved atomically
  return prisma.$transaction(async (tx) => {
    const plan = await tx.wellnessPlan.create({
      data: {
        userId: input.userId,
        planText: input.planText,
        goals: input.goals,
        duration: input.duration,
        conditions: input.conditions || [],
        isActive: true,
      },
    });

    // If conditions are provided, update patient_conditions with nurse approval
    if (input.conditions && input.conditions.length > 0 && nurseId) {
      await upsertPatientConditions(
        input.userId,
        input.conditions,
        true, // Nurse approved
        nurseId,
        tx as Prisma.TransactionClient
      );
    }

    return plan;
  });
}

export async function getWellnessPlans(userId: string, activeOnly: boolean = false) {
  const where: any = { userId };
  
  if (activeOnly) {
    where.isActive = true;
  }

  return prisma.wellnessPlan.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function getWellnessPlanById(id: string) {
  return prisma.wellnessPlan.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function updateWellnessPlan(
  id: string,
  data: {
    planText?: string;
    goals?: string;
    duration?: number;
    isActive?: boolean;
  }
) {
  return prisma.wellnessPlan.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteWellnessPlan(id: string) {
  return prisma.wellnessPlan.delete({
    where: { id },
  });
}

export async function getAllWellnessPlans() {
  return prisma.wellnessPlan.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      conditions: true,
    },
  });
}
