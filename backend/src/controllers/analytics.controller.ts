import { Request, Response } from "express";
import * as analyticsService from "../services/analytics.service";

// System Settings
export async function getSystemSettings(req: Request, res: Response) {
  try {
    const settings = await analyticsService.getSystemSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system settings",
    });
  }
}

export async function updateSystemSettings(req: Request, res: Response) {
  try {
    const settings = await analyticsService.updateSystemSettings(req.body);
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update system settings",
    });
  }
}

// Capacity Management
export async function getCapacityInfo(req: Request, res: Response) {
  try {
    const { date } = req.query;
    const capacity = await analyticsService.getCapacityInfo(date as string);
    res.json({
      success: true,
      data: capacity,
    });
  } catch (error) {
    console.error("Error fetching capacity info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch capacity information",
    });
  }
}

// Booking Statistics
export async function getBookingStats(req: Request, res: Response) {
  try {
    const { date } = req.query;
    const stats = await analyticsService.getBookingStats(date as string);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking statistics",
    });
  }
}

// Queue Analytics
export async function getQueueAnalytics(req: Request, res: Response) {
  try {
    const analytics = await analyticsService.getQueueAnalytics();
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching queue analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch queue analytics",
    });
  }
}

// Health Analytics
export async function getHealthAnalytics(req: Request, res: Response) {
  try {
    const analytics = await analyticsService.getHealthAnalytics();
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching health analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch health analytics",
    });
  }
}

// Staff Performance
export async function getStaffPerformance(req: Request, res: Response) {
  try {
    const performance = await analyticsService.getStaffPerformance();
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error fetching staff performance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff performance",
    });
  }
}

// Audit Trail
export async function getAuditTrail(req: Request, res: Response) {
  try {
    const { limit } = req.query;
    const auditTrail = await analyticsService.getAuditTrail(
      limit ? parseInt(limit as string) : 50
    );
    res.json({
      success: true,
      data: auditTrail,
    });
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit trail",
    });
  }
}