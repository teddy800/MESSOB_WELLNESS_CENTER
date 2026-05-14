-- Check for users with userId starting with 100
SELECT id, "userId", "fullName", email, role 
FROM users 
WHERE "userId" LIKE '100%' 
LIMIT 10;
