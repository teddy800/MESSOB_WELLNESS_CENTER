-- Fix appointments that were saved on wrong date due to timezone bug
-- Move appointments from April 28 to April 29, 2026

-- First, check which appointments will be affected
SELECT 
    id, 
    "userId", 
    "scheduledAt", 
    "scheduledAt" + INTERVAL '1 day' as new_scheduled_at,
    status, 
    reason 
FROM appointments 
WHERE DATE("scheduledAt") = '2026-04-28'
ORDER BY "scheduledAt";

-- Uncomment the line below to execute the update
-- UPDATE appointments 
-- SET "scheduledAt" = "scheduledAt" + INTERVAL '1 day'
-- WHERE DATE("scheduledAt") = '2026-04-28';

-- Verify the changes
-- SELECT DATE("scheduledAt") as date, COUNT(*) as count 
-- FROM appointments 
-- WHERE DATE("scheduledAt") IN ('2026-04-28', '2026-04-29', '2026-04-30')
-- GROUP BY DATE("scheduledAt") 
-- ORDER BY date;
