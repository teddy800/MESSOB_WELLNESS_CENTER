import { Request, Response } from "express";
import * as reportsService from "../services/reports.service";

export async function generateReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, reportType } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
      return;
    }

    const report = await reportsService.generateCustomReport(startDate, endDate);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
    });
  }
}

export async function generateMonthlyReport(req: Request, res: Response) {
  try {
    const { year, month } = req.params;
    
    const report = await reportsService.generateMonthlyReport(
      parseInt(year as string), 
      parseInt(month as string)
    );
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating monthly report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate monthly report",
    });
  }
}

export async function generateQuarterlyReport(req: Request, res: Response) {
  try {
    const { year, quarter } = req.params;
    
    const report = await reportsService.generateQuarterlyReport(
      parseInt(year as string), 
      parseInt(quarter as string)
    );
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating quarterly report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate quarterly report",
    });
  }
}