import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import AdminService from "../services/admin.service";
import {
  UserFilters,
  CenterFilters,
  AppointmentFilters,
  VitalFilters,
  FeedbackFilters,
  AuditFilters,
} from "../types/admin.types";

/**
 * GET /api/v1/admin/dashboard/metrics
 * Get system-wide dashboard metrics
 */
export const getDashboardMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const metrics = await AdminService.getDashboardMetrics();

    res.status(200).json({
      status: "success",
      data: metrics,
    });
  } catch (error) {
    console.error("Get dashboard metrics error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve dashboard metrics",
    });
  }
};

/**
 * GET /api/v1/admin/users
 * Get all users with filters
 */
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const filters: UserFilters = {
      role: req.query.role as any,
      region: req.query.region as string,
      center: req.query.center as string,
      status: req.query.status as 'active' | 'inactive',
      verification: req.query.verification as 'verified' | 'unverified',
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await AdminService.getAllUsers(filters);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve users",
    });
  }
};

/**
 * GET /api/v1/admin/centers
 * Get all centers with filters
 */
export const getCenters = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const filters: CenterFilters = {
      region: req.query.region as string,
      status: req.query.status as any,
      city: req.query.city as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await AdminService.getAllCenters(filters);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get centers error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve centers",
    });
  }
};

/**
 * GET /api/v1/admin/appointments
 * Get all appointments with filters
 */
export const getAppointments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const filters: AppointmentFilters = {
      region: req.query.region as string,
      center: req.query.center as string,
      status: req.query.status as any,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await AdminService.getAllAppointments(filters);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve appointments",
    });
  }
};

/**
 * GET /api/v1/admin/vitals
 * Get all vital records with filters
 */
export const getVitals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const filters: VitalFilters = {
      region: req.query.region as string,
      center: req.query.center as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      bmiCategory: req.query.bmiCategory as any,
      bpCategory: req.query.bpCategory as any,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await AdminService.getAllVitals(filters);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get vitals error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve vital records",
    });
  }
};

/**
 * GET /api/v1/admin/feedback
 * Get all feedback with filters
 */
export const getFeedback = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const filters: FeedbackFilters = {
      region: req.query.region as string,
      center: req.query.center as string,
      npsScore: req.query.npsScore ? parseInt(req.query.npsScore as string) : undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      feedbackType: req.query.feedbackType as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await AdminService.getAllFeedback(filters);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve feedback",
    });
  }
};

/**
 * GET /api/v1/admin/audit-logs
 * Get all audit logs with filters
 */
export const getAuditLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const filters: AuditFilters = {
      region: req.query.region as string,
      center: req.query.center as string,
      user: req.query.user as string,
      action: req.query.action as string,
      resource: req.query.resource as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await AdminService.getAllAuditLogs(filters);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve audit logs",
    });
  }
};
