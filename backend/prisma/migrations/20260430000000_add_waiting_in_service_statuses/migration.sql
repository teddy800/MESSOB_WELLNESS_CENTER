-- Add new appointment statuses: WAITING and IN_SERVICE
-- This migration adds the new statuses to support the updated workflow

-- Add WAITING and IN_SERVICE to the AppointmentStatus enum
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'WAITING';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'IN_SERVICE';

-- Update existing PENDING appointments to WAITING
UPDATE "appointments" 
SET status = 'WAITING' 
WHERE status = 'PENDING';

-- Note: PENDING and CONFIRMED are kept for backward compatibility
-- but new appointments will use WAITING as the default status
