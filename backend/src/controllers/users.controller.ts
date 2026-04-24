import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as UsersService from "../services/users.service";

/**
 * GET /api/v1/users/me
 * Get current user profile
 *
 * FIX: Returns fullName (not name), role (not roleId), plus centerId,
 * isActive, isVerified, lastLoginAt, createdAt so the frontend
 * AuthContext can store and use the complete user object.
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const user = await UsersService.getUserProfile(req.user.userId);

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        centerId: user.centerId,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phone: user.phone,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        isActive: user.isActive,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve user information",
    });
  }
};

/**
 * PUT /api/v1/users/me
 * Update current user profile
 */
export const updateCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { name, dateOfBirth, gender, phone, emergencyContactName, emergencyContactPhone } = req.body;

    const updateData: any = {};
    if (name) updateData.fullName = name;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (phone) updateData.phone = phone;
    if (emergencyContactName) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone) updateData.emergencyContactPhone = emergencyContactPhone;

    const updatedUser = await UsersService.updateUserProfile(req.user.userId, updateData);

    res.status(200).json({
      status: "success",
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update user information",
    });
  }
};

// Manager Dashboard: Get all users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    // Check if user is manager or above
    const managerRoles = ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'];
    if (!managerRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Access denied. Manager role required.",
      });
      return;
    }

    const { role, centerId, isActive, search } = req.query;
    
    const filters: any = {};
    if (role) filters.role = role as string;
    if (centerId) filters.centerId = centerId as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search as string;

    const users = await UsersService.getAllUsers(filters);

    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve users",
    });
  }
};

// Manager Dashboard: Create new user
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    // Check if user is manager or above
    const managerRoles = ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'];
    if (!managerRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Access denied. Manager role required.",
      });
      return;
    }

    const { email, password, fullName, role, centerId, phone, dateOfBirth, gender } = req.body;

    if (!email || !password || !fullName || !role) {
      res.status(400).json({
        status: "error",
        message: "Email, password, fullName, and role are required",
      });
      return;
    }

    const userData: any = {
      email,
      password,
      fullName,
      role,
    };

    if (centerId) userData.centerId = centerId;
    if (phone) userData.phone = phone;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (gender) userData.gender = gender;

    const newUser = await UsersService.createUser(userData);

    res.status(201).json({
      status: "success",
      data: newUser,
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.code === 'P2002') {
      res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Failed to create user",
      });
    }
  }
};

// Manager Dashboard: Update user status
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    // Check if user is manager or above
    const managerRoles = ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'];
    if (!managerRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Access denied. Manager role required.",
      });
      return;
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        status: "error",
        message: "isActive must be a boolean value",
      });
      return;
    }

    const updatedUser = await UsersService.updateUserStatus(userId as string, isActive);

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update user status",
    });
  }
};
