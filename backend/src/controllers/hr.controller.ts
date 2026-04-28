import { Request, Response } from "express";
import * as HRService from "../services/hr.service";

/**
 * GET /api/v1/hr/employee/:employeeId
 * Fetch employee data from HR system (stubbed for now)
 */
export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    if (!employeeId || typeof employeeId !== 'string') {
      res.status(400).json({
        status: "error",
        message: "Employee ID is required",
      });
      return;
    }

    const employee = await HRService.getEmployeeById(employeeId);

    if (!employee) {
      res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: employee,
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch employee data",
    });
  }
};
