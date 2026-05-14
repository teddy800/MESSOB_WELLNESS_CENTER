-- Fix stuck appointments by marking them as COMPLETED
UPDATE appointments 
SET status = 'COMPLETED', 
    "completedAt" = NOW(),
    "updatedAt" = NOW()
WHERE "userId" IN (
    SELECT id FROM users WHERE "userId" = '000001'
) 
AND status IN ('WAITING', 'CONFIRMED', 'IN_PROGRESS', 'IN_SERVICE');

-- Show the results
SELECT COUNT(*) as updated_count FROM appointments 
WHERE "userId" IN (SELECT id FROM users WHERE "userId" = '000001') 
AND status = 'COMPLETED';
