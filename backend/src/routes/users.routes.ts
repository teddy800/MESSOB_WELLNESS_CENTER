import { Router } from "express";
import { getCurrentUser, updateCurrentUser, searchUsers, getUserById } from "../controllers/users.controller";
import { changePassword } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All user routes require authentication
 */

// GET /api/v1/users - Search users
router.get("/", authenticate, searchUsers);

// GET /api/v1/users/me - Get current user profile
router.get("/me", authenticate, getCurrentUser);

// GET /api/v1/users/:id - Get user by ID
router.get("/:id", authenticate, getUserById);

// PUT /api/v1/users/me - Update current user profile
router.put("/me", authenticate, updateCurrentUser);

// POST /api/v1/users/change-password - Change password
router.post("/change-password", authenticate, changePassword);

export default router;
