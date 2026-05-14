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
   * Create a new center
   */
  async createCenter(centerData: any): Promise<any> {
    try {
      return await prisma.center.create({
        data: centerData,
      });
    } catch (error) {
      console.error("Error creating center:", error);
      throw error;
    }
  },

  /**
   * Get all unique regions from centers
   */
  async getAllRegions(): Promise<string[]> {
    try {
      const centers = await prisma.center.findMany({
        select: { region: true },
        distinct: ["region"],
      });
      return centers.map(c => c.region).sort();
    } catch (error) {
      console.error("Error getting regions:", error);
      throw error;
    }
  },

  /**
   * Get centers by region
   */
  async getCentersByRegion(region: string): Promise<any[]> {
    try {
      return await prisma.center.findMany({
        where: { region },
        select: {
          id: true,
          name: true,
          region: true,
          city: true,
          status: true,
        },
      });
    } catch (error) {
      console.error("Error getting centers by region:", error);
      throw error;
    }
  },

  /**
   * Get system-wide dashboard metrics
   */
  async getDashboardMetrics(timePeriod?: string): Promise<DashboardMetrics> {
    try {
      // Calculate date range based on time period
      const now = new Date();
      let dateFrom: Date | undefined;
      
      if (timePeriod === 'daily') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      } else if (timePeriod === 'weekly') {
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timePeriod === 'monthly') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      }

      // Get user stats (not filtered by date)
      const users = await prisma.user.groupBy({
        by: ["role"],
        _count: true,
      });

      const userStats = {
        total: await prisma.user.count(),
        active: await prisma.user.count({ where: { isActive: true } }),
        inactive: await prisma.user.count({ where: { isActive: false } }),
        verified: await prisma.user.count({ where: { isVerified: true } }),
        unverified: await prisma.user.count({ where: { isVerified: false } }),
        byRole: users.reduce((acc: any, u: any) => {
          acc[u.role] = u._count;
          return acc;
        }, {}),
        byRegion: {},
      };

      // Get center stats (not filtered by date)
      const centers = await prisma.center.groupBy({
        by: ["region"],
        _count: true,
      });

      const centerStats = {
        total: await prisma.center.count(),
        active: await prisma.center.count({ where: { status: "ACTIVE" } }),
        inactive: await prisma.center.count({ where: { status: "INACTIVE" } }),
        maintenance: await prisma.center.count({ where: { status: "MAINTENANCE" } }),
        byRegion: centers.reduce((acc: any, c: any) => {
          acc[c.region] = c._count;
          return acc;
        }, {}),
      };

      // Get appointment stats with date filter
      const appointmentWhere: any = dateFrom ? { 
        createdAt: { gte: dateFrom } 
      } : {};

      const appointments = await prisma.appointment.groupBy({
        by: ["status"],
        where: appointmentWhere,
        _count: true,
      });

      const appointmentStats = {
        total: await prisma.appointment.count({ where: appointmentWhere }),
        waiting: await prisma.appointment.count({ where: { ...appointmentWhere, status: "WAITING" } }),
        inProgress: await prisma.appointment.count({ where: { ...appointmentWhere, status: "IN_PROGRESS" } }),
        inService: await prisma.appointment.count({ where: { ...appointmentWhere, status: "IN_SERVICE" } }),
        completed: await prisma.appointment.count({ where: { ...appointmentWhere, status: "COMPLETED" } }),
        cancelled: await prisma.appointment.count({ where: { ...appointmentWhere, status: "CANCELLED" } }),
        noShow: await prisma.appointment.count({ where: { ...appointmentWhere, status: "NO_SHOW" } }),
        byRegion: {},
        byStatus: appointments.reduce((acc: any, a: any) => {
          acc[a.status] = a._count;
          return acc;
        }, {}),
      };

      // Get vital stats with date filter
      const vitalWhere: any = dateFrom ? { 
        recordedAt: { gte: dateFrom } 
      } : {};

      const vitals = await prisma.vitalRecord.findMany({
        where: vitalWhere,
        select: {
          bmi: true,
          systolic: true,
          diastolic: true,
          heartRate: true,
          temperature: true,
          oxygenSaturation: true,
          bmiCategory: true,
          bpCategory: true,
        },
      });

      const vitalStats = {
        total: vitals.length,
        averageBMI: vitals.length > 0 ? vitals.reduce((sum, v) => sum + (v.bmi || 0), 0) / vitals.length : 0,
        averageSystolic: vitals.length > 0 ? vitals.reduce((sum, v) => sum + (v.systolic || 0), 0) / vitals.length : 0,
        averageDiastolic: vitals.length > 0 ? vitals.reduce((sum, v) => sum + (v.diastolic || 0), 0) / vitals.length : 0,
        averageHeartRate: vitals.length > 0 ? vitals.reduce((sum, v) => sum + (v.heartRate || 0), 0) / vitals.length : 0,
        averageTemperature: vitals.length > 0 ? vitals.reduce((sum, v) => sum + (v.temperature || 0), 0) / vitals.length : 0,
        averageOxygenSaturation: vitals.length > 0 ? vitals.reduce((sum, v) => sum + (v.oxygenSaturation || 0), 0) / vitals.length : 0,
        byBmiCategory: {
          UNDERWEIGHT: 0,
          NORMAL: 0,
          OVERWEIGHT: 0,
          OBESITY: 0,
        },
        byBpCategory: {
          NORMAL: 0,
          ELEVATED: 0,
          HYPERTENSION_STAGE_1: 0,
          HYPERTENSION_STAGE_2: 0,
          HYPERTENSIVE_CRISIS: 0,
        },
      };

      // Get feedback stats with date filter
      const feedbackWhere: any = dateFrom ? { 
        createdAt: { gte: dateFrom } 
      } : {};

      const feedback = await prisma.feedback.findMany({
        where: feedbackWhere,
        select: {
          npsScore: true,
          serviceQuality: true,
          staffBehavior: true,
          cleanliness: true,
          waitTime: true,
        },
      });

      const feedbackStats = {
        total: feedback.length,
        averageNPS: feedback.length > 0 ? feedback.reduce((sum, f) => sum + (f.npsScore || 0), 0) / feedback.length : 0,
        averageServiceQuality: feedback.length > 0 ? feedback.reduce((sum, f) => sum + (f.serviceQuality || 0), 0) / feedback.length : 0,
        averageStaffBehavior: feedback.length > 0 ? feedback.reduce((sum, f) => sum + (f.staffBehavior || 0), 0) / feedback.length : 0,
        averageCleanliness: feedback.length > 0 ? feedback.reduce((sum, f) => sum + (f.cleanliness || 0), 0) / feedback.length : 0,
        averageWaitTime: feedback.length > 0 ? feedback.reduce((sum, f) => sum + (f.waitTime || 0), 0) / feedback.length : 0,
        npsDistribution: {},
        byRegion: {},
      };

      // Get regions (unique regions from centers)
      const regions = await prisma.center.findMany({
        select: { region: true },
        distinct: ["region"],
      });

      const regionStats = {
        total: regions.length,
        regions: regions.map(r => r.region),
      };

      // Get patients (users with STAFF or EXTERNAL_PATIENT role) - not filtered by date
      const patientStats = {
        total: await prisma.user.count({
          where: {
            role: { in: ["STAFF", "EXTERNAL_PATIENT"] },
          },
        }),
      };

      // Get walk-in completed visits (count vital records without completed appointments)
      // Each vital record for a patient without a COMPLETED appointment = 1 walk-in visit
      // This includes external patients AND staff coming for emergency without appointment
      const walkInCompletedWhere: any = dateFrom ? { 
        recordedAt: { gte: dateFrom }
      } : {};

      // Get all vital records in the date range
      const allVitalRecords = await prisma.vitalRecord.findMany({
        where: walkInCompletedWhere,
        select: { userId: true },
      });

      // Get all COMPLETED appointments in the date range
      const completedAppointments = await prisma.appointment.findMany({
        where: dateFrom ? { 
          scheduledAt: { gte: dateFrom },
          status: "COMPLETED"
        } : {
          status: "COMPLETED"
        },
        select: { userId: true },
      });

      // Get unique user IDs with completed appointments
      const completedAppointmentUserIds = new Set(completedAppointments.map(apt => apt.userId));

      // Count vital records for users WITHOUT completed appointments (walk-in visits)
      const walkInVisitCount = allVitalRecords.filter(vr => !completedAppointmentUserIds.has(vr.userId)).length;

      const walkInStats = {
        total: walkInVisitCount,
      };

      // Get completed appointments - filtered by date
      const completedAppointmentsWhere: any = dateFrom ? { 
        status: "COMPLETED",
        updatedAt: { gte: dateFrom }
      } : { status: "COMPLETED" };

      const completedAppointmentsCount = await prisma.appointment.count({ where: completedAppointmentsWhere });

      // Get patients served (walk-ins + completed appointments) - filtered by date
      const patientsServedStats = {
        total: walkInStats.total + completedAppointmentsCount,
      };

      // Get wellness plans stats with date filter
      const wellnessWhere: any = dateFrom ? { 
        createdAt: { gte: dateFrom } 
      } : {};

      const wellnessStats = {
        total: await prisma.wellnessPlan.count({ where: wellnessWhere }),
        active: await prisma.wellnessPlan.count({ where: { ...wellnessWhere, isActive: true } }),
        inactive: await prisma.wellnessPlan.count({ where: { ...wellnessWhere, isActive: false } }),
      };

      return {
        users: userStats,
        centers: centerStats,
        appointments: appointmentStats,
        vitals: vitalStats,
        feedback: feedbackStats,
        regions: regionStats,
        patients: patientStats,
        walkIns: walkInStats,
        patientsServed: patientsServedStats,
        wellness: wellnessStats,
        lastUpdated: new Date(),
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
      if (filters.region) {
        where.center = {
          region: filters.region,
        };
      }
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
          include: {
            center: {
              select: {
                id: true,
                name: true,
                region: true,
                city: true,
              },
            },
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
            user: { select: { fullName: true, email: true, userId: true } },
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
            user: { select: { fullName: true, email: true, userId: true } },
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
            user: { select: { fullName: true, email: true, userId: true } },
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
            user: { select: { fullName: true, email: true, userId: true } },
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
