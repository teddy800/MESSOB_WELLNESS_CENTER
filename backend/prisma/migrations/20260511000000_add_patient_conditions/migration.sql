-- CreateTable
CREATE TABLE "patient_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "conditions" JSONB NOT NULL,
    "calculated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(3),
    "approved_by" UUID,
    "is_nurse_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_conditions_patient_id_key" ON "patient_conditions"("patient_id");

-- CreateIndex
CREATE INDEX "patient_conditions_patient_id_idx" ON "patient_conditions"("patient_id");

-- CreateIndex
CREATE INDEX "patient_conditions_is_nurse_approved_idx" ON "patient_conditions"("is_nurse_approved");

-- CreateIndex
CREATE INDEX "patient_conditions_approved_at_idx" ON "patient_conditions"("approved_at");

-- AddForeignKey
ALTER TABLE "patient_conditions" ADD CONSTRAINT "patient_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_conditions" ADD CONSTRAINT "patient_conditions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "wellness_plans" ADD COLUMN "conditions" JSONB;
