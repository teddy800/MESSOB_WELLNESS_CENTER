/*
  Warnings:

  - The values [CUSTOMER_STAFF,FEDERAL_ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('EXTERNAL_PATIENT', 'STAFF', 'NURSE_OFFICER', 'MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_OFFICE', 'SYSTEM_ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STAFF';
COMMIT;

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "lastReminderBy" UUID,
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderSentAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'STAFF';

-- CreateIndex
CREATE INDEX "users_employeeId_idx" ON "users"("employeeId");

-- CreateIndex
CREATE INDEX "users_isExternal_idx" ON "users"("isExternal");
