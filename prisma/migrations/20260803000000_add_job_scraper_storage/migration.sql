-- CreateTable
CREATE TABLE "job_scraper_config" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roles" TEXT[] NOT NULL,
    "includedLevels" TEXT[] NOT NULL,
    "requiredTechnologies" TEXT[] NOT NULL,
    "excludedLevels" TEXT[] NOT NULL,
    "excludedTechnologies" TEXT[] NOT NULL,
    "sources" TEXT[] NOT NULL,
    "timeRange" TEXT NOT NULL,
    "customStartDate" DATE,
    "customEndDate" DATE,
    "worldwideWorkModes" TEXT[] NOT NULL,
    "philippinesWorkModes" TEXT[] NOT NULL,
    "lastScannedAt" TIMESTAMP(3),
    "lastScanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_scraper_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraped_job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceJobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "workMode" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "postedDate" DATE,
    "postedAt" TIMESTAMPTZ(3),
    "postedText" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "matchedSkills" TEXT[] NOT NULL,
    "reviewReasons" TEXT[] NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstSeenScanId" TEXT NOT NULL,
    "lastSeenScanId" TEXT NOT NULL,

    CONSTRAINT "scraped_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_scraper_config_userId_key" ON "job_scraper_config"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scraped_job_userId_source_sourceJobId_key" ON "scraped_job"("userId", "source", "sourceJobId");

-- CreateIndex
CREATE INDEX "scraped_job_userId_lastSeenAt_idx" ON "scraped_job"("userId", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "job_scraper_config" ADD CONSTRAINT "job_scraper_config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraped_job" ADD CONSTRAINT "scraped_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
