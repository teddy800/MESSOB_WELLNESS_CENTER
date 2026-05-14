/**
 * Patient Conditions Controller
 * 
 * Handles API endpoints for patient health conditions
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as PatientConditionsService from '../services/patientConditions.service';

/**
 * GET /api/v1/conditions/all/list
 * Get all patient conditions (for analytics)
 */
export async function getAllPatientConditions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    // Authorization: Only staff can view all conditions
    const allowedRoles = [
      'NURSE_OFFICER',
      'MANAGER',
      'REGIONAL_OFFICE',
      'FEDERAL_OFFICE',
      'SYSTEM_ADMIN',
    ];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions to view all patient conditions',
      });
      return;
    }

    const conditions = await PatientConditionsService.getAllPatientConditions();

    res.status(200).json({
      status: 'success',
      data: conditions,
    });
  } catch (error) {
    console.error('Get all patient conditions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve patient conditions',
    });
  }
}

/**
 * GET /api/v1/conditions/:patientId
 * Get conditions for a specific patient
 */
export async function getPatientConditions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { patientId } = req.params;

    if (!patientId || typeof patientId !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Invalid patientId parameter',
      });
      return;
    }

    const conditions = await PatientConditionsService.getPatientConditions(patientId);

    if (!conditions) {
      res.status(200).json({
        status: 'success',
        data: {
          patientId,
          conditions: [],
          isNurseApproved: false,
          calculatedAt: null,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: conditions.id,
        patientId: conditions.patientId,
        conditions: conditions.conditions,
        isNurseApproved: conditions.isNurseApproved,
        calculatedAt: conditions.calculatedAt,
        approvedAt: conditions.approvedAt,
        approvedBy: conditions.approvedBy,
        approver: conditions.approver,
      },
    });
  } catch (error) {
    console.error('Get patient conditions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve patient conditions',
    });
  }
}

/**
 * PUT /api/v1/conditions/:patientId
 * Update conditions for a patient (nurse approval)
 */
export async function updatePatientConditions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    // Authorization: Only nurses and above can update conditions
    const allowedRoles = [
      'NURSE_OFFICER',
      'MANAGER',
      'REGIONAL_OFFICE',
      'FEDERAL_OFFICE',
      'SYSTEM_ADMIN',
    ];

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions to update patient conditions',
      });
      return;
    }

    const { patientId } = req.params;
    const { conditions, isNurseApproved } = req.body;

    if (!patientId || typeof patientId !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Invalid patientId parameter',
      });
      return;
    }

    if (!Array.isArray(conditions)) {
      res.status(400).json({
        status: 'error',
        message: 'conditions must be an array',
      });
      return;
    }

    const approvedBy = isNurseApproved ? req.user.userId : undefined;

    const updated = await PatientConditionsService.upsertPatientConditions(
      patientId,
      conditions,
      isNurseApproved || false,
      approvedBy
    );

    res.status(200).json({
      status: 'success',
      data: {
        id: updated.id,
        patientId: updated.patientId,
        conditions: updated.conditions,
        isNurseApproved: updated.isNurseApproved,
        calculatedAt: updated.calculatedAt,
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
      },
    });
  } catch (error) {
    console.error('Update patient conditions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update patient conditions',
    });
  }
}

/**
 * GET /api/v1/conditions/trends
 * Get health condition trends over time for line chart
 */
export async function getConditionTrends(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { period } = req.query;

    if (!period || !['daily', 'weekly', 'monthly', 'all'].includes(period as string)) {
      res.status(400).json({
        status: 'error',
        message: 'Valid period is required (daily, weekly, monthly, all)',
      });
      return;
    }

    const trends = await PatientConditionsService.getConditionTrends(period as string);

    res.status(200).json({
      status: 'success',
      data: trends,
    });
  } catch (error) {
    console.error('Get condition trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve condition trends',
    });
  }
}

/**
 * GET /api/v1/conditions/period
 * Get aggregated condition counts for a date range (or all time if no dates provided)
 */
export async function getConditionsByPeriod(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    // If no dates provided, fetch all time data
    let start: Date | null = null;
    let end: Date | null = null;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid date format',
        });
        return;
      }
    }

    // Get all wellness plans within the date range (or all time)
    const conditions = await PatientConditionsService.getConditionsByDateRange(start, end);

    // Total wellness plans count
    const totalWellnessPlans = conditions.length;

    // Aggregate condition counts
    const conditionCounts: Record<string, number> = {};
    conditions.forEach((record) => {
      const raw: unknown = record.conditions;

      // Safely normalize to string[] (DB JSON may differ from the nominal Prisma type)
      let conditionList: string[] = [];
      if (Array.isArray(raw)) {
        conditionList = raw.map(String);
      } else if (typeof raw === 'string' && raw.trim().length > 0) {
        conditionList = [raw];
      } else if (raw && typeof raw === 'object') {
        conditionList = Object.values(raw as Record<string, unknown>).map(String);
      }

      // If no conditions or empty array, count as "normal"
      if (conditionList.length === 0) {
        conditionCounts['normal'] = (conditionCounts['normal'] || 0) + 1;
      } else {
        conditionList.forEach((condition) => {
          const key = condition.toLowerCase().trim();
          if (key) conditionCounts[key] = (conditionCounts[key] || 0) + 1;
        });
      }
    });

    // Convert to array format
    const result = Object.entries(conditionCounts).map(([condition, count]) => ({
      condition,
      count,
    }));

    res.status(200).json({
      status: 'success',
      data: result,
      meta: {
        totalWellnessPlans: totalWellnessPlans,
      },
    });
  } catch (error) {
    console.error('Get conditions by period error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve conditions for period',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
