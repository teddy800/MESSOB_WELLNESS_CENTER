-- Fix users that should be external patients
-- Update users with NURSE_OFFICER role who were created via walk-in registration to EXTERNAL_PATIENT

-- First, let's see which users might be external patients (created without email or with specific patterns)
-- Run this to identify them:
SELECT id, "fullName", email, role, "isExternal", "canLogin", "employeeId", "createdAt"
FROM users
WHERE role = 'NURSE_OFFICER' 
  AND "isExternal" = false
  AND "employeeId" IS NULL
ORDER BY "createdAt" DESC;

-- If you identify the walk-in users from the above query, update them:
-- Replace 'USER_ID_HERE' with the actual user IDs

-- Example: Update specific users to be external patients
-- UPDATE users 
-- SET 
--   role = 'EXTERNAL_PATIENT',
--   "isExternal" = true,
--   "canLogin" = false
-- WHERE id IN ('user-id-1', 'user-id-2');

-- Or update ALL nurse officers without employee IDs (be careful with this!)
UPDATE users 
SET 
  role = 'EXTERNAL_PATIENT',
  "isExternal" = true,
  "canLogin" = false
WHERE role = 'NURSE_OFFICER' 
  AND "isExternal" = false
  AND "employeeId" IS NULL
  AND email IS NULL;

-- Verify the changes
SELECT id, "fullName", email, role, "isExternal", "canLogin", "createdAt"
FROM users
WHERE "isExternal" = true
ORDER BY "createdAt" DESC;
