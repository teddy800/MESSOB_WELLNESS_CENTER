SELECT a.id, a.status, u."fullName", u.email, u."userId" 
FROM appointments a 
JOIN users u ON a."userId" = u.id 
WHERE a.status IN ('WAITING', 'CONFIRMED', 'IN_PROGRESS', 'IN_SERVICE');
