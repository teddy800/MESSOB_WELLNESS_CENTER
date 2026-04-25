import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as WellnessService from "../services/wellness.service";

/**
 * POST /api/v1/plans
 * Create a new wellness plan
 */
export const createWellnessPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { userId, planText, goals, duration } = req.body;

    // Validate required fields
    if (!userId || !planText) {
      res.status(400).json({
        status: "error",
        message: "userId and planText are required",
      });
      return;
    }

    // Authorization: Only NURSE_OFFICER and above can create wellness plans
    const allowedRoles = ["NURSE_OFFICER", "MANAGER", "REGIONAL_OFFICE", "FEDERAL_ADMIN"];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions to create wellness plans",
      });
      return;
    }

    const plan = await WellnessService.createWellnessPlan({
      userId,
      planText,
      goals,
      duration,
    });

    res.status(201).json({
      status: "success",
      data: {
        id: plan.id,
        userId: plan.userId,
        createdAt: plan.createdAt,
      },
    });
  } catch (error) {
    console.error("Create wellness plan error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create wellness plan",
    });
  }
};

/**
 * GET /api/v1/plans/:userId
 * Get wellness plans for a user
 */
export const getWellnessPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { userId } = req.params;
    const { activeOnly } = req.query;

    // Ensure userId is a string
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Invalid userId parameter",
      });
      return;
    }

    // Authorization: Users can view their own plans, staff can view any
    const allowedRoles = ["NURSE_OFFICER", "MANAGER", "REGIONAL_OFFICE", "FEDERAL_ADMIN"];
    if (req.user.userId !== userId && !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions to view wellness plans",
      });
      return;
    }

    const plans = await WellnessService.getWellnessPlans(
      userId,
      activeOnly === "true"
    );

    res.status(200).json({
      status: "success",
      data: plans.map((plan) => ({
        id: plan.id,
        userId: plan.userId,
        planText: plan.planText,
        goals: plan.goals,
        duration: plan.duration,
        isActive: plan.isActive,
        updatedAt: plan.updatedAt,
        createdAt: plan.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get wellness plans error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve wellness plans",
    });
  }
};

/**
 * PUT /api/v1/plans/:id
 * Update an existing wellness plan
 */
export const updateWellnessPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      res.status(400).json({
        status: "error",
        message: "Invalid plan id",
      });
      return;
    }

    const existing = await WellnessService.getWellnessPlanById(id);
    if (!existing) {
      res.status(404).json({
        status: "error",
        message: "Wellness plan not found",
      });
      return;
    }

    const allowedRoles = ["NURSE_OFFICER", "MANAGER", "REGIONAL_OFFICE", "FEDERAL_ADMIN"];
    const canEdit = req.user.userId === existing.userId || allowedRoles.includes(req.user.role);
    if (!canEdit) {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions to update this wellness plan",
      });
      return;
    }

    const { planText, goals, duration, isActive } = req.body as {
      planText?: unknown;
      goals?: unknown;
      duration?: unknown;
      isActive?: unknown;
    };

    const normalizeGoals = () => {
      if (Array.isArray(goals)) {
        return goals
          .map((goal: any) => {
            if (typeof goal === "string") return goal.trim();
            if (goal && typeof goal === "object" && typeof goal.title === "string") {
              return `${goal.completed ? "[x]" : "[ ]"} ${goal.title.trim()}`;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");
      }

      if (typeof goals === "string") {
        return goals;
      }

      return undefined;
    };

    const updated = await WellnessService.updateWellnessPlan(id, {
      planText: typeof planText === "string" ? planText : undefined,
      goals: normalizeGoals(),
      duration: typeof duration === "number" ? duration : undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
    });

    res.status(200).json({
      status: "success",
      data: {
        id: updated.id,
        userId: updated.userId,
        planText: updated.planText,
        goals: updated.goals,
        duration: updated.duration,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update wellness plan error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update wellness plan",
    });
  }
};
