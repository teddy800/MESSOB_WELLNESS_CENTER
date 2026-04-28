import { Request, Response } from "express";
import * as RegionsService from "../services/regions.service";

/**
 * GET /api/v1/regions
 * Get all unique regions
 */
export const getRegions = async (req: Request, res: Response): Promise<void> => {
  try {
    const regions = await RegionsService.getRegions();

    res.status(200).json({
      status: "success",
      data: regions,
    });
  } catch (error) {
    console.error("Get regions error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch regions",
    });
  }
};

/**
 * GET /api/v1/centers
 * Get all active centers, optionally filtered by region
 */
export const getCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const region = req.query.region as string | undefined;

    const centers = await RegionsService.getCenters(region);

    res.status(200).json({
      status: "success",
      data: centers,
    });
  } catch (error) {
    console.error("Get centers error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch centers",
    });
  }
};
