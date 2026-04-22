import { Request, Response } from "express";
import {
  calculateBmiMetrics,
  classifyBloodPressure as classifyBloodPressureMetrics,
} from "../services/vitals.service";

interface BmiRequestBody {
  weightKg: unknown;
  heightCm: unknown;
}

interface BloodPressureRequestBody {
  systolic: unknown;
  diastolic: unknown;
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
      ],
    },
  });
}

export function postBmi(req: Request, res: Response): void {
  const { weightKg, heightCm } = req.body as Partial<BmiRequestBody>;
  const weight = toNumber(weightKg);
  const height = toNumber(heightCm);

  if (weight === null || height === null) {
    res.status(400).json({
      status: "error",
      message: "weightKg and heightCm must be numeric values.",
    });
    return;
  }

  try {
    const result = calculateBmiMetrics({
      weightKg: weight,
      heightCm: height,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Invalid BMI input.",
    });
  }
}

export function postBloodPressure(req: Request, res: Response): void {
  const { systolic, diastolic } = req.body as Partial<BloodPressureRequestBody>;
  const systolicValue = toNumber(systolic);
  const diastolicValue = toNumber(diastolic);

  if (systolicValue === null || diastolicValue === null) {
    res.status(400).json({
      status: "error",
      message: "systolic and diastolic must be numeric values.",
    });
    return;
  }

  try {
    const result = classifyBloodPressureMetrics({
      systolic: systolicValue,
      diastolic: diastolicValue,
    });

    res.status(200).json({
      status: "success",
      data: result,
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
