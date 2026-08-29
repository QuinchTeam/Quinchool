import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../auth/session";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JobsScraperService } from "./jobs-scraper.service";
import { JobsScraperStorage } from "./jobs-scraper.storage";
import {
  type ClassificationUpdate,
  classificationUpdateSchema,
  type JobScraperConfig,
  jobScraperConfigSchema,
  type JobScraperState,
} from "./scan-contract";

/**
 * The whole jobs scraper surface. Every route answers with the same state
 * object so the client never has to stitch a response together from two calls.
 */
@Controller("jobs-scraper")
@UseGuards(SessionGuard)
export class JobsScraperController {
  constructor(
    private readonly jobsScraper: JobsScraperService,
    private readonly storage: JobsScraperStorage,
  ) {}

  @Get()
  getState(@UserId() userId: string): Promise<JobScraperState> {
    return this.storage.getState(userId);
  }

  @Put()
  async saveConfig(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(jobScraperConfigSchema))
    config: JobScraperConfig,
  ): Promise<JobScraperState> {
    await this.storage.saveConfig(userId, config);
    return this.storage.getState(userId);
  }

  @Patch()
  async updateClassification(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(classificationUpdateSchema))
    update: ClassificationUpdate,
  ): Promise<JobScraperState> {
    const updated = await this.storage.updateClassification(
      userId,
      update.id,
      update.classification,
    );

    if (!updated) {
      throw new NotFoundException({ error: "Job not found" });
    }

    return this.storage.getState(userId);
  }

  /**
   * Scans with the criteria this user has saved, stores the graded listings,
   * and answers with the state the review page renders. A failed scan throws
   * from the service with the AI service's own status and wording.
   */
  @Post()
  async scan(@UserId() userId: string): Promise<JobScraperState> {
    const config = await this.storage.getConfig(userId);
    const result = await this.jobsScraper.scan({
      config,
      scannedAt: new Date().toISOString(),
    });

    await this.storage.persistScan(
      userId,
      result.scanId,
      new Date(result.scannedAt),
      result.jobs,
    );

    return this.storage.getState(userId, result.sourceIssues);
  }
}
