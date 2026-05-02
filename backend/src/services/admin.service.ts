import prisma from "../config/prisma";
import {
  UserFilters,
  CenterFilters,
  AppointmentFilters,
  VitalFilters,
  FeedbackFilters,
  AuditFilters,
  DashboardMetrics,
  PaginatedResponse,
} from "../types/admin.types";

const AdminService = {
  /**
   * Get system-wide dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [totalUsers, totalCenters, totalAppointments, totalVitals, totalFeedback] = await Promise.all([
        prisma.user.count(),
        prisma.center.count(),
        prisma.appointment.count(),
        prisma.vitalRecord.count(),
        prisma.feedback.count(),
      ]);

      return {
        totalUsers,
        totalCenters,
        totalAppointments,
        totalVitals,
        totalFeedback,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      throw error;
    }
  },

  /**
   * Get all users with filters
   */
  async getAllUsers(filters: UserFilters): Promise<PaginatedResponse<any>> {
    try {
      const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
      const take = filters.limit || 20;

      const where: any = {};

      if (filters.role) where.role = filters.role;
      if (filters.status) where.isActive = filters.status === 'active';
      if (filters.verification) where.isVerified = filters.verification === 'verified';
      if (filters.region) where.center = { region: filters.region };
      if (filters.center) where.centerId = filters.center;
      if (filters.search) {
        where.OR = [
          { email: { contains: filters.search, mode: "insensitive" } },
          { fullName: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            isVerified: true,
            centerId: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },

  /**
   * Get all centers with filters
   */
  async getAllCenters(filters: CenterFilters): Promise<PaginatedResponse<any>> {
    try {
      const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
      const take = filters.limit || 20;

      const where: any = {};

      if (filters.region) where.region = filters.region;
      if (filters.status) where.status = filters.status;
      if (filters.city) where.city = filters.city;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { city: { contains: filters.search, mode: "insensitive" } },
          { region: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.center.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            name: true,
            region: true,
            city: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.center.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      console.error("Error getting centers:", error);
      throw error;
    }
  },

  /**
   * Get all appointments with filters
   */
  async getAllAppointments(filters: AppointmentFilters): Promise<PaginatedResponse<any>> {
    try {
      const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
      const take = filters.limit || 20;

      const where: any = {};

      if (filters.region) where.user = { center: { region: filters.region } };
      if (filters.center) where.user = { centerId: filters.center };
      if (filters.status) where.status = filters.status;
      if (filters.dateFrom || filters.dateTo) {
        where.scheduledAt = {};
        if (filters.dateFrom) where.scheduledAt.gte = filters.dateFrom;
        if (filters.dateTo) where.scheduledAt.lte = filters.dateTo;
      }
      if (filters.search) {
        where.OR = [
          { userId: { contains: filters.search, mode: "insensitive" } },
          { reason: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take,
          include: {
            user: { select: { fullName: true, email: true } },
          },
        }),
        prisma.appointment.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      console.error("Error getting appointments:", error);
      throw error;
    }
  },

  /**
   * Get all vitals with filters
   */
  async getAllVitals(filters: VitalFilters): Promise<PaginatedResponse<any>> {
    try {
      const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
      const take = filters.limit || 20;

      const where: any = {};

      if (filters.region) where.user = { center: { region: filters.region } };
      if (filters.center) where.user = { centerId: filters.center };
      if (filters.bmiCategory) where.bmiCategory = filters.bmiCategory;
      if (filters.bpCategory) where.bpCategory = filters.bpCategory;
      if (filters.dateFrom || filters.dateTo) {
        where.recordedAt = {};
        if (filters.dateFrom) where.recordedAt.gte = filters.dateFrom;
        if (filters.dateTo) where.recordedAt.lte = filters.dateTo;
      }
      if (filters.search) {
        where.OR = [
          { userId: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.vitalRecord.findMany({
          where,
          skip,
          take,
          include: {
            user: { select: { fullName: true, email: true } },
          },
        }),
        prisma.vitalRecord.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      console.error("Error getting vitals:", error);
      throw error;
    }
  },

  /**
   * Get all feedback with filters
   */
  async getAllFeedback(filters: FeedbackFilters): Promise<PaginatedResponse<any>> {
    try {
      const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
      const take = filters.limit || 20;

      const where: any = {};

      if (filters.region) where.user = { center: { region: filters.region } };
      if (filters.center) where.user = { centerId: filters.center };
      if (filters.npsScore !== undefined) where.npsScore = filters.npsScore;
      if (filters.feedbackType) where.feedbackType = filters.feedbackType;
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }

      const [data, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          skip,
          take,
          include: {
            user: { select: { fullName: true, email: true } },
          },
        }),
        prisma.feedback.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      console.error("Error getting feedback:", error);
      throw error;
    }
  },

  /**
   * Get all audit logs with filters
   */
  async getAllAuditLogs(filters: AuditFilters): Promise<PaginatedResponse<any>> {
    try {
      const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
      const take = filters.limit || 20;

      const where: any = {};

      if (filters.user) where.userId = filters.user;
      if (filters.action) where.action = filters.action;
      if (filters.resource) where.resource = filters.resource;
      if (filters.dateFrom || filters.dateTo) {
        where.timestamp = {};
        if (filters.dateFrom) where.timestamp.gte = filters.dateFrom;
        if (filters.dateTo) where.timestamp.lte = filters.dateTo;
      }

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take,
          orderBy: { timestamp: "desc" },
          include: {
            user: { select: { fullName: true, email: true } },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      console.error("Error getting audit logs:", error);
      throw error;
    }
  },
};

export default AdminService;
