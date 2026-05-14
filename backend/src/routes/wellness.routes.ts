import { Router } from "express";
import {
  createWellnessPlan,
  getWellnessPlans,
  getAllWellnessPlans,
  updateWellnessPlan,
} from "../controllers/wellness.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * All wellness plan routes require authentication
 */

// GET /api/v1/plans/all/list - Get all wellness plans (for analytics)
router.get("/all/list", authenticate, getAllWellnessPlans);

// POST /api/v1/plans - Create a new wellness plan
router.post("/", authenticate, createWellnessPlan);

// GET /api/v1/plans/:userId - Get wellness plans for a user
router.get("/:userId", authenticate, getWellnessPlans);

// PUT /api/v1/plans/:id - Update a wellness plan
router.put("/:id", authenticate, updateWellnessPlan);

export default router;
