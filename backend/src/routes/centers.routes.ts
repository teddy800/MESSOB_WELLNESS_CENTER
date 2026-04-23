import { Router } from "express";
import {
  createCenter,
  getAllCenters,
  getCenterById,
  updateCenter,
  deleteCenter,
  getCenterAnalytics,
  getRegionalAnalytics,
  getAllAnalytics,
} from "../controllers/centers.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createCenter);
router.get("/", authenticate, getAllCenters);
router.get("/analytics/all", authenticate, getAllAnalytics);
router.get("/analytics/region/:region", authenticate, getRegionalAnalytics);
router.get("/:id", authenticate, getCenterById);
router.put("/:id", authenticate, updateCenter);
router.delete("/:id", authenticate, deleteCenter);
router.get("/:id/analytics", authenticate, getCenterAnalytics);

export default router;
