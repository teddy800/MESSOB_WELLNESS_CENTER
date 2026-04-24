import { Router } from "express";
import { getCurrentUser, updateCurrentUser } from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All user routes require authentication
 */

// GET /api/v1/users/me - Get current user profile
router.get("/me", authenticate, getCurrentUser);

// PUT /api/v1/users/me - Update current user profile
router.put("/me", authenticate, updateCurrentUser);

export default router;
