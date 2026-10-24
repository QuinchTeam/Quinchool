import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UnprocessableEntityException,
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
  jobIdSchema,
} from "./jobs-scraper.contract";

// Return the full scraper state so the client does not need a second request.
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

  @Put("config")
  async saveConfig(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(jobScraperConfigSchema))
    config: JobScraperConfig,
  ): Promise<JobScraperState> {
    await this.repository.saveConfig(userId, config);
    return this.repository.getState(userId);
  }

  @Patch("jobs/:id")
  async updateClassification(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(jobIdSchema)) id: string,
    @Body(new ZodValidationPipe(classificationUpdateSchema))
    update: ClassificationUpdate,
  ): Promise<JobScraperState> {
    const updated = await this.repository.updateClassification(
      userId,
      id,
      update.classification,
    );

    if (!updated) {
      throw new NotFoundException({
        code: "JOB_NOT_FOUND",
        message: "Job not found",
      });
    }

    return this.repository.getState(userId);
  }

  // 202: the scan keeps running after this returns; clients poll GET until scan.status leaves RUNNING.
  @Post("scans")
  @HttpCode(202)
  async scan(@UserId() userId: string): Promise<JobScraperState> {
    const config = await this.repository.getConfig(userId);
    const unset = getUnsetScanCriteria(config);

    if (unset.length > 0) {
      throw new UnprocessableEntityException({
        code: "SCAN_CRITERIA_MISSING",
        message: `Edit your criteria to add ${unset.join(", ")} before scanning.`,
      });
    }

    // A second click while a scan runs just returns the running state.
    if (await this.repository.startScan(userId)) {
      void this.jobsScraper.runInBackground(userId, config);
    }

    return this.repository.getState(userId);
  }
}
