import { Router } from "express";
import {
  register,
  createUser,
  login,
  getCurrentUser,
  logout,
  verifyToken,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * Public Routes (No authentication required)
 */

// POST /api/v1/auth/register - Register a new user (CUSTOMER_STAFF only)
router.post("/register", register);

// POST /api/v1/auth/login - Login user
router.post("/login", login);

// POST /api/v1/auth/verify-token - Verify token validity
router.post("/verify-token", verifyToken);

/**
 * Protected Routes (Authentication required)
 */

// POST /api/v1/auth/create-user - Create user with specific role (Hierarchical)
router.post("/create-user", authenticate, createUser);

// GET /api/v1/auth/me - Get current user profile
router.get("/me", authenticate, getCurrentUser);

// POST /api/v1/auth/logout - Logout user
router.post("/logout", authenticate, logout);

export default router;
