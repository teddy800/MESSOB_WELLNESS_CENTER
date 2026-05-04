import { Request, Response } from "express";
import { AuthService, RegisterInput, LoginInput } from "../services/auth.service";
import { UserRole, Gender } from "../generated/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * POST /api/v1/auth/register
 * Register a new user (Public - only creates CUSTOMER_STAFF)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      fullName,
      dateOfBirth,
      gender,
      phone,
      centerId,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      res.status(400).json({
        status: "error",
        message: "Email, password, and full name are required",
      });
      return;
    }

    // Validate gender if provided
    if (gender && !Object.values(Gender).includes(gender)) {
      res.status(400).json({
        status: "error",
        message: "Invalid gender specified",
      });
      return;
    }

    // Public registration always creates STAFF
    const registerInput: RegisterInput = {
      email,
      password,
      fullName,
      role: UserRole.STAFF,
      centerId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    };

    // Audit context
    const auditContext = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Register user
    const result = await AuthService.register(registerInput, auditContext);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("email") ||
        error.message.includes("password") ||
        error.message.includes("exists")
      ) {
        res.status(400).json({
          status: "error",
          message: error.message,
        });
        return;
      }
    }

    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again later.",
    });
  }
};

/**
 * POST /api/v1/auth/create-user
 * Create user with specific role (Hierarchical - requires authentication)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const {
      email,
      password,
      fullName,
      role,
      centerId,
      dateOfBirth,
      gender,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      res.status(400).json({
        status: "error",
        message: "Email, password, full name, and role are required",
      });
      return;
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        status: "error",
        message: "Invalid role specified",
      });
      return;
    }

    // Hierarchical role creation rules
    const creatorRole = req.user.role;
    
    // SYSTEM_ADMIN can create any role
    if (creatorRole === UserRole.SYSTEM_ADMIN) {
      // Can create any role
    }
    // MANAGER can only create NURSE_OFFICER and STAFF
    else if (creatorRole === UserRole.MANAGER) {
      if (role !== UserRole.NURSE_OFFICER && role !== UserRole.STAFF) {
        res.status(403).json({
          status: "error",
          message: "Managers can only create Nurse Officers and Staff",
        });
        return;
      }
      // Manager must assign users to their own center
      if (!centerId) {
        res.status(400).json({
          status: "error",
          message: "Center ID is required when creating users",
        });
        return;
      }
    }
    // Other roles cannot create users
    else {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions to create users",
      });
      return;
    }

    // Validate gender if provided
    if (gender && !Object.values(Gender).includes(gender)) {
      res.status(400).json({
        status: "error",
        message: "Invalid gender specified",
      });
      return;
    }

    // Prepare registration input
    const registerInput: RegisterInput = {
      email,
      password,
      fullName,
      role,
      centerId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    };

    // Audit context
    const auditContext = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      createdBy: req.user.userId,
    };

    // Create user
    const result = await AuthService.register(registerInput, auditContext);

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("email") ||
        error.message.includes("password") ||
        error.message.includes("exists")
      ) {
        res.status(400).json({
          status: "error",
          message: error.message,
        });
        return;
      }
    }

    console.error("Create user error:", error);
    res.status(500).json({
      status: "error",
      message: "User creation failed. Please try again later.",
    });
  }
};

/**
 * POST /api/v1/auth/login
 * Login user and return JWT token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
      return;
    }

    // Prepare login input
    const loginInput: LoginInput = {
      email,
      password,
    };

    // Audit context
    const auditContext = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Login user
    const result = await AuthService.login(loginInput, auditContext);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle known errors
      if (error.message.includes("Invalid") || error.message.includes("deactivated")) {
        res.status(401).json({
          status: "error",
          message: error.message,
        });
        return;
      }
    }

    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Login failed. Please try again later.",
    });
  }
};

/**
 * GET /api/v1/auth/me
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

    const user = await AuthService.getUserById(req.user.userId);

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
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePicture: user.profilePicture,
        }
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
 * POST /api/v1/auth/logout
 * Logout user (client-side token removal, server-side audit log)
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      // Create audit log for logout
      await AuthService.createAuditLog({
        userId: req.user.userId,
        action: "LOGOUT",
        resource: "USER",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Logout failed",
    });
  }
};

/**
 * POST /api/v1/auth/verify-token
 * Verify if a token is valid
 */
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        status: "error",
        message: "Token is required",
      });
      return;
    }

    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.userId);

    if (!user || !user.isActive) {
      res.status(401).json({
        status: "error",
        message: "Invalid token or user inactive",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Token is valid",
      data: {
        userId: decoded.userId,
        role: decoded.role,
      },
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};
