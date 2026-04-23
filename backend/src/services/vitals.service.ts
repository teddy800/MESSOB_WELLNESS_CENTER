import { BmiCategory as PrismaBmiCategory, BloodPressureCategory as PrismaBloodPressureCategory } from "../generated/prisma";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

type BmiCategory = "underweight" | "normal" | "overweight" | "obesity";
type BloodPressureCategory = "normal" | "elevated" | "hypertension_stage_1" | "hypertension_stage_2" | "hypertensive_crisis";

interface BloodPressureInput {
  systolic: number;
  diastolic: number;
}

interface BloodPressureResult extends BloodPressureInput {
  category: BloodPressureCategory;
}

interface BmiInput {
  weightKg: number;
  heightCm: number;
}

interface BmiResult extends BmiInput {
  bmi: number;
  category: BmiCategory;
}

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

function mapBmiCategoryToPrisma(category: BmiCategory): PrismaBmiCategory {
  const mapping: Record<BmiCategory, PrismaBmiCategory> = {
    underweight: PrismaBmiCategory.UNDERWEIGHT,
    normal: PrismaBmiCategory.NORMAL,
    overweight: PrismaBmiCategory.OVERWEIGHT,
    obesity: PrismaBmiCategory.OBESITY,
  };
  return mapping[category];
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

function mapBloodPressureCategoryToPrisma(category: BloodPressureCategory): PrismaBloodPressureCategory {
  const mapping: Record<BloodPressureCategory, PrismaBloodPressureCategory> = {
    normal: PrismaBloodPressureCategory.NORMAL,
    elevated: PrismaBloodPressureCategory.ELEVATED,
    hypertension_stage_1: PrismaBloodPressureCategory.HYPERTENSION_STAGE_1,
    hypertension_stage_2: PrismaBloodPressureCategory.HYPERTENSION_STAGE_2,
    hypertensive_crisis: PrismaBloodPressureCategory.HYPERTENSIVE_CRISIS,
  };
  return mapping[category];
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

// Database operations
export async function saveBmiRecord(
  userId: string,
  recordedBy: string,
  input: BmiInput,
  result: BmiResult,
  notes?: string
) {
  return prisma.vitalRecord.create({
    data: {
      userId,
      recordedBy,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      bmi: result.bmi,
      bmiCategory: mapBmiCategoryToPrisma(result.category),
      notes,
    },
  });
}

export async function saveBloodPressureRecord(
  userId: string,
  recordedBy: string,
  input: BloodPressureInput,
  result: BloodPressureResult,
  notes?: string
) {
  return prisma.vitalRecord.create({
    data: {
      userId,
      recordedBy,
      systolic: input.systolic,
      diastolic: input.diastolic,
      bpCategory: mapBloodPressureCategoryToPrisma(result.category),
      notes,
    },
  });
}

export async function getVitalsHistory(userId: string, limit: number = 50) {
  return prisma.vitalRecord.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: limit,
    include: {
      recorder: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
}

export async function getLatestVitals(userId: string) {
  return prisma.vitalRecord.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    include: {
      recorder: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
}
