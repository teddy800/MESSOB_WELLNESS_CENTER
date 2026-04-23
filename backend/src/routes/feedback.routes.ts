import { Router } from "express";
import { createFeedback, getAllFeedback } from "../controllers/feedback.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All feedback routes require authentication
 */

// POST /api/v1/feedback - Create new feedback
router.post("/", authenticate, createFeedback);

// GET /api/v1/feedback - Get all feedback (with optional filters and stats)
router.get("/", authenticate, getAllFeedback);

export default router;
