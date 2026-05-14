SELECT 
    a.id, 
    a.status, 
    a.reason, 
    a."scheduledAt",
    u."fullName", 
    u.email, 
    u.role,
    u."userId" as user_id
FROM appointments a 
JOIN users u ON a."userId" = u.id 
WHERE a.status IN ('WAITING', 'CONFIRMED', 'IN_PROGRESS', 'IN_SERVICE') 
ORDER BY a."createdAt" DESC 
LIMIT 15;
