import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as UsersService from "../services/users.service";
import { prisma } from "../config/prisma";

/**
 * GET /api/v1/users
 * Search users by name or email
 */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;

    if (!search || search.trim().length < 2) {
      res.status(400).json({
        status: "error",
        message: "Search term must be at least 2 characters",
      });
      return;
    }

    const users = await UsersService.searchUsers(search.trim());

    res.status(200).json({
      status: "success",
      data: users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isExternal: user.isExternal,
        userId: user.userId,
      })),
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to search users",
    });
  }
};

/**
 * GET /api/v1/users/:id
 * Get user by ID (UUID or employeeId)
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
      return;
    }

    let user;
    
    // Check if it's a 4-digit userId format (0001, 0009, etc.)
    if (/^\d{4}$/.test(userId)) {
      // Search by userId
      user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          isExternal: true,
          userId: true,
        },
      });
    } else {
      // Search by UUID
      user = await UsersService.getUserProfile(userId);
    }

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
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isExternal: user.isExternal,
        userId: user.userId,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve user",
    });
  }
};

/**
 * GET /api/v1/users/me
 * Get current user profile
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
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roleId: user.role,
        profilePicture: user.profilePicture,
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

    const { name, fullName, dateOfBirth, gender, phone, emergencyContactName, emergencyContactPhone, profilePicture } = req.body;

    console.log('Update user request received:', {
      userId: req.user.userId,
      name,
      fullName,
      dateOfBirth,
      gender,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      profilePictureLength: profilePicture ? profilePicture.length : 0,
    });

    // Prepare update data
    const updateData: any = {};
    
    // Accept both 'name' and 'fullName' for compatibility
    if (name !== undefined && name !== null && name !== '') updateData.fullName = name;
    if (fullName !== undefined && fullName !== null && fullName !== '') updateData.fullName = fullName;
    if (dateOfBirth !== undefined && dateOfBirth) {
      const date = new Date(dateOfBirth);
      if (!isNaN(date.getTime())) {
        updateData.dateOfBirth = date;
      }
    }
    if (gender !== undefined && gender !== null && gender !== '') updateData.gender = gender;
    if (phone !== undefined && phone !== null && phone !== '') updateData.phone = phone;
    if (emergencyContactName !== undefined && emergencyContactName !== null && emergencyContactName !== '') updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined && emergencyContactPhone !== null && emergencyContactPhone !== '') updateData.emergencyContactPhone = emergencyContactPhone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    console.log('Update data to be saved:', {
      ...updateData,
      profilePicture: updateData.profilePicture ? `[base64 image, ${updateData.profilePicture.length} chars]` : undefined,
    });

    const updatedUser = await UsersService.updateUserProfile(req.user.userId, updateData);

    res.status(200).json({
      status: "success",
      data: {
        id: updatedUser.id,
        name: updatedUser.fullName,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profilePicture: updatedUser.profilePicture,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      status: "error",
      message: "Failed to update user information",
      details: errorMessage,
    });
  }
};
