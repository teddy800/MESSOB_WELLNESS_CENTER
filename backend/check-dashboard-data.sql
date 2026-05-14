-- Check real data for dashboard verification

-- 1. Total appointments
SELECT 
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
    COUNT(*) FILTER (WHERE status = 'WAITING') as waiting,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
    COUNT(*) FILTER (WHERE status = 'IN_SERVICE') as in_service
FROM appointments;

-- 2. Total vitals records
SELECT COUNT(*) as total_vitals FROM vital_records;

-- 3. Total users by role
SELECT 
    role,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE "isActive" = true) as active_count
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- 4. Total centers
SELECT 
    COUNT(*) as total_centers,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_centers
FROM centers;

-- 5. Total wellness plans
SELECT COUNT(*) as total_wellness_plans FROM wellness_plans;

-- 6. Total feedback
SELECT 
    COUNT(*) as total_feedback,
    AVG("npsScore") as avg_nps,
    AVG(rating) as avg_rating
FROM feedback;
