import { Router } from "express";
import {
	createWellnessPlan,
	getWellnessPlans,
	updateWellnessPlan,
} from "../controllers/wellness.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All wellness plan routes require authentication
 */

// POST /api/v1/plans - Create a new wellness plan
router.post("/", authenticate, createWellnessPlan);

// GET /api/v1/plans/:userId - Get wellness plans for a user
router.get("/:userId", authenticate, getWellnessPlans);

// PUT /api/v1/plans/:id - Update a wellness plan
router.put("/:id", authenticate, updateWellnessPlan);

export default router;
