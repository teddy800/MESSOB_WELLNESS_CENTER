-- List valid users that can be used for vitals recording
SELECT 
    id as uuid_id,
    "userId" as user_id,
    "fullName" as name,
    email,
    role,
    "isExternal"
FROM users 
WHERE "isActive" = true
ORDER BY "createdAt" DESC
LIMIT 20;
