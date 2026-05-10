-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "lastReminderBy" UUID,
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderSentAt" TIMESTAMPTZ(3);
