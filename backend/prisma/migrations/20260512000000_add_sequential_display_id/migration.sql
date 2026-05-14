-- Add unique constraint to employeeId and create sequence for auto-increment
-- This migration adds sequential display IDs for users

-- Create a sequence for generating sequential IDs
CREATE SEQUENCE IF NOT EXISTS user_display_id_seq START WITH 1;

-- Backfill existing users with sequential IDs (if they don't have one)
DO $$
DECLARE
  user_record RECORD;
  next_id INTEGER := 1;
BEGIN
  FOR user_record IN 
    SELECT id FROM users WHERE "employeeId" IS NULL ORDER BY "createdAt" ASC
  LOOP
    UPDATE users 
    SET "employeeId" = LPAD(next_id::TEXT, 6, '0')
    WHERE id = user_record.id;
    next_id := next_id + 1;
  END LOOP;
  
  -- Set the sequence to the next available number
  PERFORM setval('user_display_id_seq', next_id);
END $$;

-- Make employeeId unique (now that all users have one)
CREATE UNIQUE INDEX IF NOT EXISTS "users_employeeId_key" ON "users"("employeeId");
