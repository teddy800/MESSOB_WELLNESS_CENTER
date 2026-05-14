SELECT 
    a.id, 
    a.status, 
    a.reason,
    a."scheduledAt",
    u."fullName", 
    u.email, 
    u."userId"
FROM appointments a 
JOIN users u ON a."userId" = u.id 
WHERE a.id = '2d8ed4c4-d84f-4d4a-bf37-b94df8c00818';
