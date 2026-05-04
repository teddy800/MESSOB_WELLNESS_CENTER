import { Router } from "express";
import * as RegionsController from "../controllers/regions.controller";

const router = Router();

// Public routes (no authentication required for registration page)
router.get("/regions", RegionsController.getRegions);

export default router;
