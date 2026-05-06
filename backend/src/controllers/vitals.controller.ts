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
import prisma from "../config/prisma";
import { BmiCategory, BloodPressureCategory } from "../generated/prisma";

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

interface VitalsRequestBody {
  userId?: unknown;
  systolicBP?: unknown;
  diastolicBP?: unknown;
  heartRate?: unknown;
  bmi?: unknown;
  glucose?: unknown;
  temperature?: unknown;
  oxygenSaturation?: unknown;
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
        "POST /api/v1/vitals",
        "POST /api/v1/vitals/bmi",
        "POST /api/v1/vitals/blood-pressure",
        "GET /api/v1/vitals/history/:userId",
        "GET /api/v1/vitals/latest/:userId",
        "GET /api/v1/vitals/risk-score/:userId",
      ],
    },
  });
}

function getBmiCategoryFromValue(bmi: number): BmiCategory {
  if (bmi < 18.5) return BmiCategory.UNDERWEIGHT;
  if (bmi < 25) return BmiCategory.NORMAL;
  if (bmi < 30) return BmiCategory.OVERWEIGHT;
  return BmiCategory.OBESITY;
}

function getBloodPressureCategoryFromValues(
  systolic: number,
  diastolic: number,
): BloodPressureCategory {
  const result = classifyBloodPressureMetrics({ systolic, diastolic });

  if (result.category === "normal") return BloodPressureCategory.NORMAL;
  if (result.category === "elevated") return BloodPressureCategory.ELEVATED;
  if (result.category === "hypertension_stage_1")
    return BloodPressureCategory.HYPERTENSION_STAGE_1;
  if (result.category === "hypertension_stage_2")
    return BloodPressureCategory.HYPERTENSION_STAGE_2;
  return BloodPressureCategory.HYPERTENSIVE_CRISIS;
}

async function resolvePatientUserId(inputId: string): Promise<string | null> {
  const trimmedId = inputId.trim();

  const user = await prisma.user.findUnique({
    where: { id: trimmedId },
    select: { id: true },
  });

  if (user) {
    return user.id;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: trimmedId },
    select: { userId: true },
  });

  if (appointment) {
    return appointment.userId;
  }

  return null;
}

export async function postVitals(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const {
      userId,
      systolicBP,
      diastolicBP,
      heartRate,
      bmi,
      glucose,
      temperature,
      oxygenSaturation,
      notes,
    } = req.body as Partial<VitalsRequestBody>;

    const rawIdentifier =
      typeof userId === "string" && userId.trim() ? userId.trim() : undefined;
    if (!rawIdentifier) {
      res.status(400).json({
        status: "error",
        message: "Customer ID is required",
      });
      return;
    }

    const patientId = await resolvePatientUserId(rawIdentifier);
    if (!patientId) {
      res.status(400).json({
        status: "error",
        message:
          "Invalid customer ID. Enter a valid User ID or Appointment ID.",
      });
      return;
    }

    const recordedBy = req.user!.userId;
    const systolic = toNumber(systolicBP);
    const diastolic = toNumber(diastolicBP);
    const heartRateValue = toNumber(heartRate);
    const bmiValue = toNumber(bmi);
    const glucoseValue = toNumber(glucose);
    const temperatureValue = toNumber(temperature);
    const oxygenValue = toNumber(oxygenSaturation);
    const notesValue = typeof notes === "string" ? notes.trim() : "";

    const hasAnySupportedVital =
      systolic !== null ||
      diastolic !== null ||
      heartRateValue !== null ||
      bmiValue !== null ||
      temperatureValue !== null ||
      oxygenValue !== null ||
      glucoseValue !== null;

    if (!hasAnySupportedVital) {
      res.status(400).json({
        status: "error",
        message: "At least one vital value is required",
      });
      return;
    }

    if ((systolic === null) !== (diastolic === null)) {
      res.status(400).json({
        status: "error",
        message:
          "Both systolic and diastolic values are required when recording blood pressure",
      });
      return;
    }

    let bpCategory: BloodPressureCategory | undefined;
    if (systolic !== null && diastolic !== null) {
      try {
        bpCategory = getBloodPressureCategoryFromValues(systolic, diastolic);
      } catch (bpError) {
        res.status(400).json({
          status: "error",
          message:
            bpError instanceof Error
              ? bpError.message
              : "Invalid blood pressure values",
        });
        return;
      }
    }

    const combinedNotes = [
      notesValue,
      glucoseValue !== null ? `Blood glucose: ${glucoseValue} mg/dL` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const record = await prisma.vitalRecord.create({
      data: {
        userId: patientId,
        recordedBy,
        systolic: systolic ?? undefined,
        diastolic: diastolic ?? undefined,
        bpCategory,
        heartRate: heartRateValue ?? undefined,
        bmi: bmiValue ?? undefined,
        bmiCategory:
          bmiValue !== null ? getBmiCategoryFromValue(bmiValue) : undefined,
        temperature: temperatureValue ?? undefined,
        oxygenSaturation: oxygenValue ?? undefined,
        notes: combinedNotes || undefined,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        id: record.id,
        userId: record.userId,
        recordedAt: record.recordedAt,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2003") {
      res.status(400).json({
        status: "error",
        message:
          "Invalid customer reference. Please verify the ID and try again.",
      });
      return;
    }

    if (error?.code === "P2025") {
      res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
      return;
    }

    console.error("Record vitals error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to record vitals",
    });
  }
}

export async function postBmi(req: AuthRequest, res: Response): Promise<void> {
  const { weightKg, heightCm, userId, notes } =
    req.body as Partial<BmiRequestBody>;
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
      notesStr,
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

export async function postBloodPressure(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { systolic, diastolic, userId, notes } =
    req.body as Partial<BloodPressureRequestBody>;
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
      notesStr,
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

export async function getVitalsHistoryHandler(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.params.userId;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;

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

export async function getLatestVitalsHandler(
  req: AuthRequest,
  res: Response,
): Promise<void> {
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

export async function getRiskScoreHandler(req: AuthRequest, res: Response): Promise<void> {
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

    // Calculate risk scores
    const hypertensionRisk = calculateHypertensionRisk(latest.systolic ?? undefined, latest.diastolic ?? undefined);
    const diabetesRisk = 0; // Glucose not yet tracked in vitals
    const obesityRisk = calculateObesityRisk(latest.bmi ?? undefined);

    const scores = {
      hypertension: hypertensionRisk,
      diabetes: diabetesRisk,
      obesity: obesityRisk,
      overall: Math.round((hypertensionRisk + diabetesRisk + obesityRisk) / 3),
    };

    res.status(200).json({
      status: "success",
      data: scores,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to calculate risk scores",
    });
  }
}

export async function getAllVitalsHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.recordedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const vitals = await prisma.vitalRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        recordedAt: true,
        systolic: true,
        diastolic: true,
        heartRate: true,
        bmi: true,
        temperature: true,
        oxygenSaturation: true,
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    res.status(200).json({
      status: "success",
      data: vitals,
    });
  } catch (error) {
    console.error("Get all vitals error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve vitals records",
    });
  }
}

function calculateHypertensionRisk(systolic?: number, diastolic?: number): number {
  if (!systolic) return 0;
  if (systolic < 120) return 0;
  if (systolic < 130) return 20;
  if (systolic < 140) return 50;
  return 100;
}

function calculateDiabetesRisk(glucose?: number): number {
  if (!glucose) return 0;
  if (glucose < 100) return 0;
  if (glucose < 126) return 50;
  return 100;
}

function calculateObesityRisk(bmi?: number): number {
  if (!bmi) return 0;
  if (bmi < 25) return 0;
  if (bmi < 30) return 50;
  return 100;
}
