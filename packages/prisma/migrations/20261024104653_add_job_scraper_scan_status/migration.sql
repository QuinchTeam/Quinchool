-- AlterTable
ALTER TABLE "job_scraper_config" ADD COLUMN     "scanError" TEXT,
ADD COLUMN     "scanSourceIssues" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "scanStartedAt" TIMESTAMP(3),
ADD COLUMN     "scanStatus" TEXT;
