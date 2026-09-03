import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { JobsScraperService } from "./jobs-scraper.service";
import { JobsScraperRepository } from "./jobs-scraper.repository";
import {
  type ClassificationUpdate,
  classificationUpdateSchema,
  getUnsetScanCriteria,
  type JobScraperConfig,
  jobScraperConfigSchema,
  type JobScraperState,
} from "./jobs-scraper.contract";

/**
 * The whole jobs scraper surface. Every route answers with the same state
 * object so the client never has to stitch a response together from two calls.
 */
@Controller("jobs-scraper")
@UseGuards(SessionGuard)
export class JobsScraperController {
  constructor(
    private readonly jobsScraper: JobsScraperService,
    private readonly repository: JobsScraperRepository,
  ) {}

  @Get()
  getState(@UserId() userId: string): Promise<JobScraperState> {
    return this.repository.getState(userId);
  }

  @Put()
  async saveConfig(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(jobScraperConfigSchema))
    config: JobScraperConfig,
  ): Promise<JobScraperState> {
    await this.repository.saveConfig(userId, config);
    return this.repository.getState(userId);
  }

  @Patch()
  async updateClassification(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(classificationUpdateSchema))
    update: ClassificationUpdate,
  ): Promise<JobScraperState> {
    const updated = await this.repository.updateClassification(
      userId,
      update.id,
      update.classification,
    );

    if (!updated) {
      throw new NotFoundException({ error: "Job not found" });
    }

    return this.repository.getState(userId);
  }

  /**
   * Scans with the criteria this user has saved, stores the graded listings,
   * and answers with the state the review page renders. A failed scan throws
   * from the service with the AI service's own status and wording.
   */
  @Post()
  async scan(@UserId() userId: string): Promise<JobScraperState> {
    const config = await this.repository.getConfig(userId);
    const unset = getUnsetScanCriteria(config);

    if (unset.length > 0) {
      throw new BadRequestException({
        error: `Edit your criteria to add ${unset.join(", ")} before scanning.`,
      });
    }

    const result = await this.jobsScraper.scan({
      config,
      scannedAt: new Date().toISOString(),
    });

    await this.repository.persistScan(
      userId,
      result.scanId,
      new Date(result.scannedAt),
      result.jobs,
    );

    return this.repository.getState(userId, result.sourceIssues);
  }
}
