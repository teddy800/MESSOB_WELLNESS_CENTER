import { prisma } from "../config/prisma";
import { env } from "../config/env";

export interface CreateFeedbackInput {
  userId: string;
  npsScore?: number;
  serviceQuality?: number;
  staffBehavior?: number;
  cleanliness?: number;
  waitTime?: number;
  comments?: string;
  feedbackType?: string;
}

export async function createFeedback(input: CreateFeedbackInput) {
  // Validate NPS score if provided
  if (input.npsScore !== undefined && (input.npsScore < 0 || input.npsScore > 10)) {
    throw new Error("NPS score must be between 0 and 10");
  }

  // Validate ratings if provided
  const validateRating = (rating: number | undefined, fieldName: string) => {
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error(`${fieldName} must be between 1 and 5`);
    }
  };

  validateRating(input.serviceQuality, "Service Quality");
  validateRating(input.staffBehavior, "Staff Behavior");
  validateRating(input.cleanliness, "Cleanliness");
  validateRating(input.waitTime, "Wait Time");

  // Calculate average rating from individual ratings
  const ratings = [
    input.serviceQuality,
    input.staffBehavior,
    input.cleanliness,
    input.waitTime,
  ].filter(r => r !== undefined) as number[];

  const averageRating = ratings.length > 0 
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  return prisma.feedback.create({
    data: {
      userId: input.userId,
      npsScore: input.npsScore,
      serviceQuality: input.serviceQuality,
      staffBehavior: input.staffBehavior,
      cleanliness: input.cleanliness,
      waitTime: input.waitTime,
      comments: input.comments,
      feedbackType: input.feedbackType || "SERVICE",
      rating: averageRating, // Store average for backward compatibility
    },
  });
}

export async function getAllFeedback(filters?: {
  userId?: string;
  npsScore?: number;
  limit?: number;
}) {
  const where: any = {};
  
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  
  if (filters?.npsScore) {
    where.npsScore = filters.npsScore;
  }

  return prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
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

export async function getFeedbackById(id: string) {
  return prisma.feedback.findUnique({
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

export async function getFeedbackStats() {
  const totalFeedback = await prisma.feedback.count();
  
  const averageNps = await prisma.feedback.aggregate({
    _avg: {
      npsScore: true,
    },
  });

  const averageServiceQuality = await prisma.feedback.aggregate({
    _avg: {
      serviceQuality: true,
    },
  });

  const averageStaffBehavior = await prisma.feedback.aggregate({
    _avg: {
      staffBehavior: true,
    },
  });

  const averageCleanliness = await prisma.feedback.aggregate({
    _avg: {
      cleanliness: true,
    },
  });

  const averageWaitTime = await prisma.feedback.aggregate({
    _avg: {
      waitTime: true,
    },
  });

  return {
    total: totalFeedback,
    averageNps: averageNps._avg.npsScore || 0,
    averageServiceQuality: averageServiceQuality._avg.serviceQuality || 0,
    averageStaffBehavior: averageStaffBehavior._avg.staffBehavior || 0,
    averageCleanliness: averageCleanliness._avg.cleanliness || 0,
    averageWaitTime: averageWaitTime._avg.waitTime || 0,
  };
}
