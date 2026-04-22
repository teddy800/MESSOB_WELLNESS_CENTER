export interface BloodPressureInput {
  systolic: number;
  diastolic: number;
}

export type BloodPressureCategory =
  | "normal"
  | "elevated"
  | "hypertension_stage_1"
  | "hypertension_stage_2"
  | "hypertensive_crisis";

export interface BloodPressureResult extends BloodPressureInput {
  category: BloodPressureCategory;
}

export interface BmiInput {
  weightKg: number;
  heightCm: number;
}

export type BmiCategory = "underweight" | "normal" | "overweight" | "obesity";

export interface BmiResult extends BmiInput {
  bmi: number;
  category: BmiCategory;
}
