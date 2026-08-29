import { Module } from "@nestjs/common";

import { JobsScraperController } from "./jobs-scraper.controller";
import { JobsScraperService } from "./jobs-scraper.service";
import { JobsScraperStorage } from "./jobs-scraper.storage";

@Module({
  controllers: [JobsScraperController],
  providers: [JobsScraperService, JobsScraperStorage],
  exports: [JobsScraperService],
})
export class JobsScraperModule {}
