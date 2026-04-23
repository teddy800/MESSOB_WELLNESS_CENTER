import { Router } from "express";
import { createWellnessPlan, getWellnessPlans } from "../controllers/wellness.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All wellness plan routes require authentication
 */

// POST /api/v1/plans - Create a new wellness plan
router.post("/", authenticate, createWellnessPlan);

// GET /api/v1/plans/:userId - Get wellness plans for a user
router.get("/:userId", authenticate, getWellnessPlans);

export default router;
