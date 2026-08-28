-- AlterTable
ALTER TABLE "scraped_job" ADD COLUMN "isManualClassification" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "scraped_job_userId_classification_lastSeenAt_idx" ON "scraped_job"("userId", "classification", "lastSeenAt");
