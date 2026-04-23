import { PrismaClient, CenterStatus } from "../generated/prisma";
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

export interface CreateCenterInput {
  name: string;
  code: string;
  region: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  capacity?: number;
}

export interface UpdateCenterInput {
  name?: string;
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: CenterStatus;
  capacity?: number;
}

export async function createCenter(input: CreateCenterInput) {
  return prisma.center.create({
    data: input,
  });
}

export async function getAllCenters(filters?: {
  region?: string;
  status?: CenterStatus;
}) {
  const where: any = {};
  
  if (filters?.region) {
    where.region = filters.region;
  }
  
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.center.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          staff: true,
        },
      },
    },
  });
}

export async function getCenterById(id: string) {
  return prisma.center.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          staff: true,
        },
      },
    },
  });
}

export async function updateCenter(id: string, data: UpdateCenterInput) {
  return prisma.center.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteCenter(id: string) {
  return prisma.center.delete({
    where: { id },
  });
}

export async function getCenterAnalytics(centerId: string) {
  const [
    totalStaff,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    totalVitals,
    averageFeedback,
  ] = await Promise.all([
    prisma.user.count({
      where: { centerId },
    }),
    prisma.appointment.count({
      where: {
        user: {
          centerId,
        },
      },
    }),
    prisma.appointment.count({
      where: {
        user: {
          centerId,
        },
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        user: {
          centerId,
        },
        status: 'PENDING',
      },
    }),
    prisma.vitalRecord.count({
      where: {
        user: {
          centerId,
        },
      },
    }),
    prisma.feedback.aggregate({
      where: {
        user: {
          centerId,
        },
      },
      _avg: {
        rating: true,
      },
    }),
  ]);

  return {
    centerId,
    totalStaff,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    totalVitals,
    averageFeedback: averageFeedback._avg?.rating || 0,
  };
}

export async function getRegionalAnalytics(region: string) {
  const centers = await prisma.center.findMany({
    where: { region },
    include: {
      _count: {
        select: {
          staff: true,
        },
      },
    },
  });

  const analyticsPromises = centers.map((center: any) => getCenterAnalytics(center.id));
  const centerAnalytics = await Promise.all(analyticsPromises);

  const totalStats = centerAnalytics.reduce(
    (acc: any, curr: any) => ({
      totalStaff: acc.totalStaff + curr.totalStaff,
      totalAppointments: acc.totalAppointments + curr.totalAppointments,
      completedAppointments: acc.completedAppointments + curr.completedAppointments,
      pendingAppointments: acc.pendingAppointments + curr.pendingAppointments,
      totalVitals: acc.totalVitals + curr.totalVitals,
      totalFeedback: acc.totalFeedback + (curr.averageFeedback > 0 ? 1 : 0),
      sumFeedback: acc.sumFeedback + curr.averageFeedback,
    }),
    {
      totalStaff: 0,
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      totalVitals: 0,
      totalFeedback: 0,
      sumFeedback: 0,
    }
  );

  return {
    region,
    totalCenters: centers.length,
    centers: centerAnalytics,
    summary: {
      ...totalStats,
      averageFeedback: totalStats.totalFeedback > 0 
        ? totalStats.sumFeedback / totalStats.totalFeedback 
        : 0,
    },
  };
}

export async function getAllAnalytics() {
  const centers = await prisma.center.findMany({
    include: {
      _count: {
        select: {
          staff: true,
        },
      },
    },
  });

  const analyticsPromises = centers.map((center: any) => getCenterAnalytics(center.id));
  const centerAnalytics = await Promise.all(analyticsPromises);

  const regions = [...new Set(centers.map((c: any) => c.region))];
  const regionalStats = await Promise.all(
    regions.map((region: string) => getRegionalAnalytics(region))
  );

  const totalStats = centerAnalytics.reduce(
    (acc: any, curr: any) => ({
      totalStaff: acc.totalStaff + curr.totalStaff,
      totalAppointments: acc.totalAppointments + curr.totalAppointments,
      completedAppointments: acc.completedAppointments + curr.completedAppointments,
      pendingAppointments: acc.pendingAppointments + curr.pendingAppointments,
      totalVitals: acc.totalVitals + curr.totalVitals,
      totalFeedback: acc.totalFeedback + (curr.averageFeedback > 0 ? 1 : 0),
      sumFeedback: acc.sumFeedback + curr.averageFeedback,
    }),
    {
      totalStaff: 0,
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      totalVitals: 0,
      totalFeedback: 0,
      sumFeedback: 0,
    }
  );

  return {
    totalCenters: centers.length,
    totalRegions: regions.length,
    regions: regionalStats,
    summary: {
      ...totalStats,
      averageFeedback: totalStats.totalFeedback > 0 
        ? totalStats.sumFeedback / totalStats.totalFeedback 
        : 0,
    },
  };
}
