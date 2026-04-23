import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as CentersService from "../services/centers.service";

export const createCenter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (req.user.role !== "FEDERAL_ADMIN") {
      res.status(403).json({
        status: "error",
        message: "Only FEDERAL_ADMIN can create centers",
      });
      return;
    }

    const { name, code, region, city, address, phone, email, capacity } = req.body;

    if (!name || !code || !region || !city || !address) {
      res.status(400).json({
        status: "error",
        message: "name, code, region, city, and address are required",
      });
      return;
    }

    const center = await CentersService.createCenter({
      name,
      code,
      region,
      city,
      address,
      phone,
      email,
      capacity,
    });

    res.status(201).json({
      status: "success",
      data: center,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        status: "error",
        message: "Center code already exists",
      });
      return;
    }
    console.error("Create center error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create center",
    });
  }
};

export const getAllCenters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { region, status } = req.query;

    const filters: any = {};
    if (region) filters.region = region as string;
    if (status) filters.status = status as any;

    const centers = await CentersService.getAllCenters(filters);

    res.status(200).json({
      status: "success",
      data: centers,
    });
  } catch (error) {
    console.error("Get centers error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve centers",
    });
  }
};

export const getCenterById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Invalid center ID",
      });
      return;
    }

    const center = await CentersService.getCenterById(id);

    if (!center) {
      res.status(404).json({
        status: "error",
        message: "Center not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: center,
    });
  } catch (error) {
    console.error("Get center error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve center",
    });
  }
};

export const updateCenter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (req.user.role !== "FEDERAL_ADMIN") {
      res.status(403).json({
        status: "error",
        message: "Only FEDERAL_ADMIN can update centers",
      });
      return;
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Invalid center ID",
      });
      return;
    }

    const { name, region, city, address, phone, email, status, capacity } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (region !== undefined) updateData.region = region;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;
    if (capacity !== undefined) updateData.capacity = capacity;

    const center = await CentersService.updateCenter(id, updateData);

    res.status(200).json({
      status: "success",
      data: center,
    });
  } catch (error) {
    console.error("Update center error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update center",
    });
  }
};

export const deleteCenter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (req.user.role !== "FEDERAL_ADMIN") {
      res.status(403).json({
        status: "error",
        message: "Only FEDERAL_ADMIN can delete centers",
      });
      return;
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Invalid center ID",
      });
      return;
    }

    await CentersService.deleteCenter(id);

    res.status(200).json({
      status: "success",
      message: "Center deleted successfully",
    });
  } catch (error) {
    console.error("Delete center error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete center",
    });
  }
};

export const getCenterAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Invalid center ID",
      });
      return;
    }

    const allowedRoles = ["NURSE_OFFICER", "MANAGER", "REGIONAL_OFFICE", "FEDERAL_ADMIN"];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions to view analytics",
      });
      return;
    }

    const analytics = await CentersService.getCenterAnalytics(id);

    res.status(200).json({
      status: "success",
      data: analytics,
    });
  } catch (error) {
    console.error("Get center analytics error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve analytics",
    });
  }
};

export const getRegionalAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const { region } = req.params;

    if (!region || typeof region !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Invalid region parameter",
      });
      return;
    }

    const allowedRoles = ["REGIONAL_OFFICE", "FEDERAL_ADMIN"];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Only REGIONAL_OFFICE and FEDERAL_ADMIN can view regional analytics",
      });
      return;
    }

    const analytics = await CentersService.getRegionalAnalytics(region);

    res.status(200).json({
      status: "success",
      data: analytics,
    });
  } catch (error) {
    console.error("Get regional analytics error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve regional analytics",
    });
  }
};

export const getAllAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (req.user.role !== "FEDERAL_ADMIN") {
      res.status(403).json({
        status: "error",
        message: "Only FEDERAL_ADMIN can view all analytics",
      });
      return;
    }

    const analytics = await CentersService.getAllAnalytics();

    res.status(200).json({
      status: "success",
      data: analytics,
    });
  } catch (error) {
    console.error("Get all analytics error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve analytics",
    });
  }
};
