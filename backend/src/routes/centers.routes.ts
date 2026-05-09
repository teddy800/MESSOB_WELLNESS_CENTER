import { Router } from "express";
import {
  createCenter,
  getAllCenters,
  getPublicCenters,
  getCenterById,
  updateCenter,
  deleteCenter,
  getCenterAnalytics,
  getRegionalAnalytics,
  getAllAnalytics,
} from "../controllers/centers.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public route for registration page - get centers with optional region filter
router.get("/", getPublicCenters);

// Protected routes
router.post("/", authenticate, createCenter);
router.get("/analytics/all", authenticate, getAllAnalytics);
router.get("/analytics/region/:region", authenticate, getRegionalAnalytics);
router.get("/:id", authenticate, getCenterById);
router.put("/:id", authenticate, updateCenter);
router.delete("/:id", authenticate, deleteCenter);
router.get("/:id/analytics", authenticate, getCenterAnalytics);

export default router;
