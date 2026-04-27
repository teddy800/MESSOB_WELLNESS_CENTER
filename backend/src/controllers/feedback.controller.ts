import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as FeedbackService from "../services/feedback.service";

/**
 * POST /api/v1/feedback
 * Create new feedback
 */
export const createFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { 
      userId, 
      npsScore, 
      serviceQuality, 
      staffBehavior, 
      cleanliness, 
      waitTime,
      comments,
      feedbackType 
    } = req.body;

    // Validate required fields
    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "userId is required",
      });
      return;
    }

    // Users can only submit feedback for themselves
    if (req.user.userId !== userId) {
      res.status(403).json({
        status: "error",
        message: "You can only submit feedback for yourself",
      });
      return;
    }

    // Validate NPS score
    if (npsScore !== undefined && (npsScore < 0 || npsScore > 10)) {
      res.status(400).json({
        status: "error",
        message: "NPS score must be between 0 and 10",
      });
      return;
    }

    // Validate rating scales
    const validateRating = (rating: any, fieldName: string) => {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new Error(`${fieldName} must be between 1 and 5`);
      }
    };

    try {
      validateRating(serviceQuality, "Service Quality");
      validateRating(staffBehavior, "Staff Behavior");
      validateRating(cleanliness, "Cleanliness");
      validateRating(waitTime, "Wait Time");
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Invalid rating",
      });
      return;
    }

    const feedback = await FeedbackService.createFeedback({
      userId,
      npsScore,
      serviceQuality,
      staffBehavior,
      cleanliness,
      waitTime,
      comments,
      feedbackType: feedbackType || "SERVICE",
    });

    res.status(201).json({
      status: "success",
      data: {
        id: feedback.id,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Create feedback error:", error);
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create feedback",
    });
  }
};

/**
 * GET /api/v1/feedback
 * Get all feedback (with optional filters)
 */
export const getAllFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    // Authorization: Only MANAGER and above can view all feedback
    const allowedRoles = ["MANAGER", "REGIONAL_OFFICE", "FEDERAL_ADMIN"];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions to view feedback",
      });
      return;
    }

    const { userId, npsScore, limit, stats } = req.query;

    // If stats requested, return statistics
    if (stats === "true") {
      const statistics = await FeedbackService.getFeedbackStats();
      res.status(200).json({
        status: "success",
        data: statistics,
      });
      return;
    }

    // Otherwise return feedback list
    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (npsScore) filters.npsScore = parseInt(npsScore as string);
    if (limit) filters.limit = parseInt(limit as string);

    const feedback = await FeedbackService.getAllFeedback(filters);

    res.status(200).json({
      status: "success",
      data: feedback,
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve feedback",
    });
  }
};
