import { Request, Response } from "express";

// System Settings
export async function getSystemSettings(req: Request, res: Response) {
  try {
    // Return default settings for now
    const settings = {
      dailySlotLimit: 100,
      appointmentIntervalMinutes: 30,
      walkInEnabled: true,
      autoConfirmBookings: false,
    };

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
    // For now, just return the updated settings
    // In production, this would update a settings table
    const updatedSettings = {
      dailySlotLimit: req.body.dailySlotLimit || 100,
      appointmentIntervalMinutes: req.body.appointmentIntervalMinutes || 30,
      walkInEnabled: req.body.walkInEnabled !== undefined ? req.body.walkInEnabled : true,
      autoConfirmBookings: req.body.autoConfirmBookings !== undefined ? req.body.autoConfirmBookings : false,
    };

    res.json({
      success: true,
      data: updatedSettings,
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
    // Mock data for now - in production this would query the database
    const capacity = {
      dailyLimit: 100,
      slotsUsed: 45,
      slotsRemaining: 55,
      date: new Date().toISOString().split('T')[0],
    };

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
    // Mock data for now - in production this would query appointments
    const stats = {
      totalAppointments: 45,
      onlineBookings: 35,
      walkInBookings: 10,
      noShowRate: 8.5,
      averageServiceTime: 25,
      date: new Date().toISOString().split('T')[0],
    };

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
    // Mock data for now
    const analytics = {
      currentQueueSize: 12,
      averageWaitTime: 15,
      peakHours: [
        { hour: 9, count: 15 },
        { hour: 10, count: 18 },
        { hour: 11, count: 12 },
        { hour: 14, count: 16 },
        { hour: 15, count: 14 }
      ],
      efficiencyMetrics: {
        completionRate: 92,
        onTimeRate: 85,
      },
    };

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
    // Mock data for now
    const analytics = {
      totalPatients: 150,
      highRiskCount: 8,
      averageBP: { systolic: 120, diastolic: 80 },
      averageGlucose: 95,
      riskDistribution: {
        low: 120,
        medium: 22,
        high: 8,
      },
    };

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