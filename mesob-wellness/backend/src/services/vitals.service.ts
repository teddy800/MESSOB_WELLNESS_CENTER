import type {
  BmiCategory,
  BmiInput,
  BmiResult,
  BloodPressureCategory,
  BloodPressureInput,
  BloodPressureResult,
} from "../models/healthMetrics";

function assertPositiveNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number.`);
  }
}

function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return "underweight";
  }

  if (bmi < 25) {
    return "normal";
  }

  if (bmi < 30) {
    return "overweight";
  }

  return "obesity";
}

function getBloodPressureCategory(
  input: BloodPressureInput,
): BloodPressureCategory {
  if (input.systolic > 180 || input.diastolic > 120) {
    return "hypertensive_crisis";
  }

  if (input.systolic >= 140 || input.diastolic >= 90) {
    return "hypertension_stage_2";
  }

  if (input.systolic >= 130 || input.diastolic >= 80) {
    return "hypertension_stage_1";
  }

  if (input.systolic >= 120 && input.diastolic < 80) {
    return "elevated";
  }

  return "normal";
}

export function calculateBmiMetrics(input: BmiInput): BmiResult {
  assertPositiveNumber(input.weightKg, "weightKg");
  assertPositiveNumber(input.heightCm, "heightCm");

  const heightMeters = input.heightCm / 100;
  const bmi = Number(
    (input.weightKg / (heightMeters * heightMeters)).toFixed(1),
  );

  return {
    ...input,
    bmi,
    category: getBmiCategory(bmi),
  };
}

export function classifyBloodPressure(
  input: BloodPressureInput,
): BloodPressureResult {
  assertPositiveNumber(input.systolic, "systolic");
  assertPositiveNumber(input.diastolic, "diastolic");

  if (input.systolic < input.diastolic) {
    throw new Error("systolic must be greater than or equal to diastolic.");
  }

  return {
    ...input,
    category: getBloodPressureCategory(input),
  };
}
