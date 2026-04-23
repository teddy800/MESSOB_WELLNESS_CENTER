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
