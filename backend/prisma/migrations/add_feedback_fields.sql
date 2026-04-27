-- Add new feedback fields to support NPS and satisfaction ratings
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "npsScore" INTEGER;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "serviceQuality" INTEGER;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "staffBehavior" INTEGER;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "cleanliness" INTEGER;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "waitTime" INTEGER;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "comments" TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "feedbackType" VARCHAR(50) DEFAULT 'SERVICE';

-- Rename old columns for backward compatibility
ALTER TABLE feedback RENAME COLUMN "comment" TO "comment_old";
ALTER TABLE feedback RENAME COLUMN "category" TO "category_old";

-- Make rating nullable
ALTER TABLE feedback ALTER COLUMN "rating" DROP NOT NULL;
