/*
  Warnings:

  - You are about to drop the column `category` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `feedback` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "feedback_rating_createdAt_idx";

-- DropIndex
DROP INDEX "feedback_rating_idx";

-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "category",
DROP COLUMN "comment",
ADD COLUMN     "cleanliness" INTEGER,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "feedbackType" TEXT DEFAULT 'SERVICE',
ADD COLUMN     "npsScore" INTEGER,
ADD COLUMN     "serviceQuality" INTEGER,
ADD COLUMN     "staffBehavior" INTEGER,
ADD COLUMN     "waitTime" INTEGER,
ALTER COLUMN "rating" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "feedback_npsScore_idx" ON "feedback"("npsScore");

-- CreateIndex
CREATE INDEX "feedback_userId_createdAt_idx" ON "feedback"("userId", "createdAt" DESC);
