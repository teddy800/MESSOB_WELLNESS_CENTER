import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import AdminService from "../services/admin.service";
import prisma from "../config/prisma";
import {
  UserFilters,
  CenterFilters,
  AppointmentFilters,
  VitalFilters,
  FeedbackFilters,
  AuditFilters,
} from "../types/admin.types";

/**
 * POST /api/v1/admin/centers
 * Create a new center
 */
export const createCenter = async (
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

    const { name, code, region, city, address, phone, email, capacity } = req.body;

    if (!name || !code || !region || !city || !address) {
      res.status(400).json({
        status: "error",
        message: "name, code, region, city, and address are required",
      });
      return;
    }

    const center = await AdminService.createCenter({
      name,
      code,
      region,
      city,
      address,
      phone,
      email,
      capacity,
      status: "ACTIVE",
    });

    res.status(201).json({
      status: "success",
      data: center,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        status: "error",
        message: "Center code already exists",
      });
      return;
    }
    console.error("Create center error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create center",
    });
  }
};

/**
 * GET /api/v1/admin/regions
 * Get all unique regions
 */
export const getRegions = async (
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

    const regions = await AdminService.getAllRegions();

    res.status(200).json({
      status: "success",
      data: regions,
    });
  } catch (error) {
    console.error("Get regions error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve regions",
    });
  }
};

/**
 * GET /api/v1/admin/regions/:region/centers
 * Get centers by region
 */
export const getCentersByRegion = async (
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

    const { region } = req.params;
    const centers = await AdminService.getCentersByRegion(region as string);

    res.status(200).json({
      status: "success",
      data: centers,
    });
  } catch (error) {
    console.error("Get centers by region error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve centers",
    });
  }
};

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
 * PUT /api/v1/admin/users/:id
 * Update a user
 */
export const updateUser = async (
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

    const userId = req.params.id as string;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    const { fullName, email, role, isActive } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
      return;
    }
    console.error("Update user error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update user",
    });
  }
};

/**
 * POST /api/v1/admin/users
 * Create a new user
 */
export const createUser = async (
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

    const { fullName, email, password, role, centerId } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({
        status: "error",
        message: "fullName, email, password, and role are required",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        status: "error",
        message: "User with this email already exists",
      });
      return;
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        centerId: centerId || null,
        isActive: true,
        isVerified: false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    res.status(201).json({
      status: "success",
      data: newUser,
      message: "User created successfully",
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        status: "error",
        message: "User with this email already exists",
      });
      return;
    }
    console.error("Create user error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create user",
    });
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 * Delete a user
 */
export const deleteUser = async (
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

    const userId = req.params.id as string;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete user",
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
