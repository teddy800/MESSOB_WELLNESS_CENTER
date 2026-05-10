import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import SettingsService from "../services/settings.service";
import { UserRole } from "../generated/prisma";

/**
 * GET /api/v1/settings
 * Get all system settings
 */
export const getSettings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    // Only SYSTEM_ADMIN can access settings
    if (req.user.role !== UserRole.SYSTEM_ADMIN) {
      res.status(403).json({
        status: "error",
        message: "Only system administrators can access settings",
      });
      return;
    }

    const settings = await SettingsService.getSettings();

    res.status(200).json({
      status: "success",
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve settings",
    });
  }
};

/**
 * PUT /api/v1/settings
 * Update system settings
 */
export const updateSettings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    // Only SYSTEM_ADMIN can update settings
    if (req.user.role !== UserRole.SYSTEM_ADMIN) {
      res.status(403).json({
        status: "error",
        message: "Only system administrators can update settings",
      });
      return;
    }

    const { maxLoginAttempts, sessionTimeout, maintenanceMode, lockoutDuration } = req.body;

    // Validate input
    if (maxLoginAttempts !== undefined) {
      const attempts = parseInt(maxLoginAttempts, 10);
      if (isNaN(attempts) || attempts < 1 || attempts > 10) {
        res.status(400).json({
          status: "error",
          message: "Max login attempts must be between 1 and 10",
        });
        return;
      }
    }

    if (sessionTimeout !== undefined) {
      const timeout = parseInt(sessionTimeout, 10);
      if (isNaN(timeout) || timeout < 5 || timeout > 480) {
        res.status(400).json({
          status: "error",
          message: "Session timeout must be between 5 and 480 minutes",
        });
        return;
      }
    }

    if (lockoutDuration !== undefined) {
      const duration = parseInt(lockoutDuration, 10);
      if (isNaN(duration) || duration < 5 || duration > 120) {
        res.status(400).json({
          status: "error",
          message: "Lockout duration must be between 5 and 120 minutes",
        });
        return;
      }
    }

    const updatedSettings = await SettingsService.updateSettings({
      maxLoginAttempts: maxLoginAttempts ? parseInt(maxLoginAttempts, 10) : undefined,
      sessionTimeout: sessionTimeout ? parseInt(sessionTimeout, 10) : undefined,
      maintenanceMode: typeof maintenanceMode === "boolean" ? maintenanceMode : undefined,
      lockoutDuration: lockoutDuration ? parseInt(lockoutDuration, 10) : undefined,
    });

    res.status(200).json({
      status: "success",
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update settings",
    });
  }
};
