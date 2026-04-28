import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UserRole, Gender } from "../generated/prisma";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

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
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          password: hashedPassword,
          fullName: input.fullName.trim(),
          role: input.role || UserRole.STAFF,
          centerId: input.centerId,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          phone: input.phone,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
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
      // Log failed login attempt
      await this.createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        resource: "USER",
        details: { reason: "invalid_password" },
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
      });

      throw new Error("Invalid email or password");
    }

    // Step B: Token Generation
    const token = this.generateToken(user.id, user.role);

    // Update last login timestamp and create audit log
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
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
      },
    });
  }
}
