import { Request, Response } from "express";
import {
  calculateBmiMetrics,
  classifyBloodPressure as classifyBloodPressureMetrics,
  saveBmiRecord,
  saveBloodPressureRecord,
  getVitalsHistory,
  getLatestVitals,
} from "../services/vitals.service";
import { AuthRequest } from "../middleware/auth.middleware";

interface BmiRequestBody {
  weightKg: unknown;
  heightCm: unknown;
  userId?: unknown;
  notes?: unknown;
}

interface BloodPressureRequestBody {
  systolic: unknown;
  diastolic: unknown;
  userId?: unknown;
  notes?: unknown;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

export function getVitalsModuleStatus(_req: Request, res: Response): void {
  res.status(200).json({
    status: "success",
    data: {
      module: "vitals",
      supportedEndpoints: [
        "POST /api/v1/vitals/bmi",
        "POST /api/v1/vitals/blood-pressure",
        "GET /api/v1/vitals/history/:userId",
        "GET /api/v1/vitals/latest/:userId",
      ],
    },
  });
}

export async function postBmi(req: AuthRequest, res: Response): Promise<void> {
  const { weightKg, heightCm, userId, notes } = req.body as Partial<BmiRequestBody>;
  const weight = toNumber(weightKg);
  const height = toNumber(heightCm);

  if (weight === null || height === null) {
    res.status(400).json({
      status: "error",
      message: "weightKg and heightCm must be numeric values.",
    });
    return;
  }

  // Determine patient ID (can record for self or another user)
  const patientId = typeof userId === "string" ? userId : req.user!.userId;
  const recordedBy = req.user!.userId;
  const notesStr = typeof notes === "string" ? notes : undefined;

  try {
    const result = calculateBmiMetrics({
      weightKg: weight,
      heightCm: height,
    });

    // Save to database
    const record = await saveBmiRecord(
      patientId,
      recordedBy,
      { weightKg: weight, heightCm: height },
      result,
      notesStr
    );

    res.status(200).json({
      status: "success",
      data: {
        ...result,
        recordId: record.id,
        recordedAt: record.recordedAt,
        recordedBy: recordedBy,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Invalid BMI input.",
    });
  }
}

export async function postBloodPressure(req: AuthRequest, res: Response): Promise<void> {
  const { systolic, diastolic, userId, notes } = req.body as Partial<BloodPressureRequestBody>;
  const systolicValue = toNumber(systolic);
  const diastolicValue = toNumber(diastolic);

  if (systolicValue === null || diastolicValue === null) {
    res.status(400).json({
      status: "error",
      message: "systolic and diastolic must be numeric values.",
    });
    return;
  }

  // Determine patient ID (can record for self or another user)
  const patientId = typeof userId === "string" ? userId : req.user!.userId;
  const recordedBy = req.user!.userId;
  const notesStr = typeof notes === "string" ? notes : undefined;

  try {
    const result = classifyBloodPressureMetrics({
      systolic: systolicValue,
      diastolic: diastolicValue,
    });

    // Save to database
    const record = await saveBloodPressureRecord(
      patientId,
      recordedBy,
      { systolic: systolicValue, diastolic: diastolicValue },
      result,
      notesStr
    );

    res.status(200).json({
      status: "success",
      data: {
        ...result,
        recordId: record.id,
        recordedAt: record.recordedAt,
        recordedBy: recordedBy,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Invalid blood pressure input.",
    });
  }
}

export async function getVitalsHistoryHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({
        status: "error",
        message: "userId is required",
      });
      return;
    }

    const history = await getVitalsHistory(userId, limit);

    res.status(200).json({
      status: "success",
      data: {
        userId,
        count: history.length,
        records: history,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve vitals history",
    });
  }
}

export async function getLatestVitalsHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({
        status: "error",
        message: "userId is required",
      });
      return;
    }

    const latest = await getLatestVitals(userId);

    if (!latest) {
      res.status(404).json({
        status: "error",
        message: "No vitals records found for this user",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: latest,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve latest vitals",
    });
  }
}
