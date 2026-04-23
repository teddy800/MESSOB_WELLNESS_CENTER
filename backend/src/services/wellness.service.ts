import { PrismaClient } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env";

// Create Prisma adapter
const adapter = new PrismaMariaDb({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

// Initialize Prisma with adapter
const prisma = new PrismaClient({ adapter });

export interface CreateWellnessPlanInput {
  userId: string;
  planText: string;
  goals?: string;
  duration?: number;
}

export async function createWellnessPlan(input: CreateWellnessPlanInput) {
  return prisma.wellnessPlan.create({
    data: {
      userId: input.userId,
      planText: input.planText,
      goals: input.goals,
      duration: input.duration,
      isActive: true,
    },
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
