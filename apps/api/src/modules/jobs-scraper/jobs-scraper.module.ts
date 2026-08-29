import { Module } from "@nestjs/common";

import { JobsScraperController } from "./jobs-scraper.controller";
import { JobsScraperService } from "./jobs-scraper.service";
import { JobsScraperRepository } from "./jobs-scraper.repository";

@Module({
  controllers: [JobsScraperController],
  providers: [JobsScraperService, JobsScraperRepository],
  exports: [JobsScraperService],
})
export class JobsScraperModule {}
