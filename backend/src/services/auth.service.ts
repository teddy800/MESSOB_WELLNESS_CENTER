import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UserRole, Gender } from "../generated/prisma";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { NotificationService } from "./notifications.service";
import SettingsService from "./settings.service";
import { generateNextDisplayId } from "../utils/sequentialId";

// Constants
const SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;

// Types
export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  centerId?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    profilePicture?: string | null;
    userId?: string;
  };
  token: string;
}

export interface AuditLogInput {
  userId?: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Validation Functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { valid: true };
}

// Service Functions
export class AuthService {
  /**
   * Register a new user with atomic transaction
   * Creates both User and HealthProfile in a single transaction
   */
  static async register(input: RegisterInput, auditContext?: Partial<AuditLogInput>): Promise<AuthResponse> {
    const startTime = Date.now();

    // Step A: Input Validation
    if (!validateEmail(input.email)) {
      throw new Error("Invalid email format");
    }

    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || "Invalid password");
    }

    if (!input.fullName || input.fullName.trim().length < 2) {
      throw new Error("Full name must be at least 2 characters long");
    }

    // Require centerId for STAFF role registration
    if (input.role === UserRole.STAFF && !input.centerId) {
      throw new Error("Center ID is required for staff registration");
    }

    // Step B: Check for Duplicates
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Step C: Password Hashing
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Step D: Atomic Transaction - Create User and HealthProfile
    const user = await prisma.$transaction(async (tx) => {
      // Generate sequential display ID
      const displayId = await generateNextDisplayId();
      
      // Create user
      const role = input.role || UserRole.STAFF;
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          password: hashedPassword,
          fullName: input.fullName.trim(),
          role,
          userId: displayId, // Sequential display ID
          centerId: input.centerId,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          phone: input.phone,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          // Only external patients are unverified (need email verification)
          // STAFF and other roles are verified by default
          isVerified: role !== UserRole.EXTERNAL_PATIENT,
        },
      });

      // Create health profile
      await tx.healthProfile.create({
        data: {
          userId: newUser.id,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: "REGISTER",
          resource: "USER",
          details: {
            role: newUser.role,
            registrationMethod: "email",
          },
          ipAddress: auditContext?.ipAddress,
          userAgent: auditContext?.userAgent,
        },
      });

      return newUser;
    });

    // Create notification for system admin about new registration
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.SYSTEM_ADMIN },
        select: { id: true },
      });

      for (const admin of admins) {
        await NotificationService.createNotification(
          admin.id,
          "USER_REGISTRATION",
          "HIGH",
          "New User Registration",
          `New ${input.role} registered: ${input.fullName} (${input.email})`,
          user.id
        );
      }
    } catch (notificationError) {
      // Log but don't fail registration if notification creation fails
      console.warn("Failed to create registration notification:", notificationError);
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.role);

    // Performance check (must be < 2 seconds)
    const duration = Date.now() - startTime;
    if (duration > 2000) {
      console.warn(`Registration took ${duration}ms - exceeds 2s requirement`);
    }

    // Step E: Response (without password)
    return {
      user: {
        id: user.id,
        email: user.email || "", // Handle nullable email for external patients
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        userId: user.userId, // Include display ID
      },
      token,
    };
  }

  /**
   * Login user with JWT generation
   */
  static async login(input: LoginInput, auditContext?: Partial<AuditLogInput>): Promise<AuthResponse> {
    const startTime = Date.now();

    // Step A: Verification
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Account lock check removed for now

    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact support.");
    }

    // Check if user can login (external patients cannot login)
    if (!user.canLogin) {
      throw new Error("This account cannot login. External patients must visit in person.");
    }

    // Verify password - handle nullable password for external patients
    if (!user.password) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Step B: Token Generation
    const token = this.generateToken(user.id, user.role);

    // Update last login timestamp and create audit log
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          resource: "USER",
          details: {
            role: user.role,
            loginMethod: "email",
          },
          ipAddress: auditContext?.ipAddress,
          userAgent: auditContext?.userAgent,
        },
      }),
    ]);

    // Performance check (must be < 2 seconds)
    const duration = Date.now() - startTime;
    if (duration > 2000) {
      console.warn(`Login took ${duration}ms - exceeds 2s requirement`);
    }

    // Step C: Secure Delivery
    return {
      user: {
        id: user.id,
        email: user.email || "", // Handle nullable email for external patients
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        userId: user.userId, // Include display ID
      },
      token,
    };
  }

  /**
   * Generate JWT token with user ID and role
   */
  private static generateToken(userId: string, role: UserRole): string {
    const payload = {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, env.JWT_SECRET, { 
      expiresIn: env.JWT_EXPIRES_IN
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { userId: string; role: UserRole } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        role: UserRole;
      };
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        details: input.details,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (!user.password) {
      throw new Error("User does not have a password set");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || "Invalid password");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Create audit log
    await this.createAuditLog({
      userId,
      action: "PASSWORD_CHANGED",
      resource: "USER",
      details: { method: "self_service" },
    });
  }

  /**
   * Get user by ID (for middleware)
   */
  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        canLogin: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        profilePicture: true,
        userId: true, // Include display ID
      },
    });
  }
}
