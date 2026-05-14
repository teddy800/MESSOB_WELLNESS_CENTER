-- Rename employeeId column to userId in users table
-- Add NOT NULL constraint and unique constraint

-- Step 1: Drop the existing unique index on employeeId
DROP INDEX IF EXISTS "users_employeeId_key";

-- Step 2: Rename the column from employeeId to userId
ALTER TABLE "users" RENAME COLUMN "employeeId" TO "userId";

-- Step 3: Add NOT NULL constraint to userId
ALTER TABLE "users" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Create unique constraint on userId
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- Step 5: Update the index on the renamed column
CREATE INDEX IF NOT EXISTS "users_userId_idx" ON "users"("userId");
