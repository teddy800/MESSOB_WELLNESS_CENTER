import { PrismaClient } from "../generated/prisma";
import { prisma } from "../config/prisma";

export interface CreateFeedbackInput {
  userId: string;
  rating: number;
  comment?: string;
  category?: string;
}

export async function createFeedback(input: CreateFeedbackInput) {
  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return prisma.feedback.create({
    data: {
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
      category: input.category,
    },
  });
}

export async function getAllFeedback(filters?: {
  userId?: string;
  rating?: number;
  category?: string;
  limit?: number;
}) {
  const where: any = {};
  
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  
  if (filters?.rating) {
    where.rating = filters.rating;
  }
  
  if (filters?.category) {
    where.category = filters.category;
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
  
  const ratingCounts = await prisma.feedback.groupBy({
    by: ['rating'],
    _count: {
      rating: true,
    },
  });

  const averageRating = await prisma.feedback.aggregate({
    _avg: {
      rating: true,
    },
  });

  return {
    total: totalFeedback,
    averageRating: averageRating._avg.rating || 0,
    ratingDistribution: ratingCounts.map((r: any) => ({
      rating: r.rating,
      count: r._count.rating,
    })),
  };
}
