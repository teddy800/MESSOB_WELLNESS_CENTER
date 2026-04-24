import { Router } from "express";
import { getCurrentUser, updateCurrentUser, getAllUsers, createUser, updateUserStatus } from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All user routes require authentication
 */

// GET /api/v1/users/me - Get current user profile
router.get("/me", authenticate, getCurrentUser);

// PUT /api/v1/users/me - Update current user profile
router.put("/me", authenticate, updateCurrentUser);

// Manager Dashboard routes
// GET /api/v1/users - Get all users (Manager+)
router.get("/", authenticate, getAllUsers);

// POST /api/v1/users - Create new user (Manager+)
router.post("/", authenticate, createUser);

// PUT /api/v1/users/:userId/status - Update user status (Manager+)
router.put("/:userId/status", authenticate, updateUserStatus);

export default router;
