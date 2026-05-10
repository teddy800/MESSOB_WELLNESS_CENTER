import { Router } from "express";
import * as HRController from "../controllers/hr.controller";

const router = Router();

// Public route (no authentication required for registration page)
router.get("/employee/:employeeId", HRController.getEmployeeById);

export default router;
