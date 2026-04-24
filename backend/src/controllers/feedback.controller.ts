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

    const { userId, rating, comment, category } = req.body;

    // Validate required fields
    if (!userId || !rating) {
      res.status(400).json({
        status: "error",
        message: "userId and rating are required",
      });
      return;
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        status: "error",
        message: "Rating must be between 1 and 5",
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

    const feedback = await FeedbackService.createFeedback({
      userId,
      rating,
      comment,
      category,
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
      message: "Failed to create feedback",
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

    const { userId, rating, category, limit, stats } = req.query;

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
    if (rating) filters.rating = parseInt(rating as string);
    if (category) filters.category = category as string;
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
