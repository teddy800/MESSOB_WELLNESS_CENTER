SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE "isExternal" = true) as external_patients,
    COUNT(*) FILTER (WHERE "isExternal" = false) as staff_users
FROM users 
WHERE "isActive" = true;
