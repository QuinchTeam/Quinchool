import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { getAiErrorResponse } from "../../shared/clients/ai/ai-client.errors";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  type BuildResumeValues,
  buildResumeSchema,
} from "./build-resume.contract";
import {
  BuildResumeService,
  type TailoredResume,
} from "./build-resume.service";

@Controller("build-resume")
@UseGuards(SessionGuard)
export class BuildResumeController {
  constructor(private readonly buildResume: BuildResumeService) {}

  /** The tailored resume is returned, not stored, so this answers 200. */
  @Post("tailored-resumes")
  @HttpCode(200)
  async tailor(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(buildResumeSchema)) body: BuildResumeValues,
  ): Promise<TailoredResume> {
    try {
      return await this.buildResume.tailor(userId, body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const response = getAiErrorResponse(error);

      if (response) {
        throw new HttpException(response.body, response.status);
      }

      throw new InternalServerErrorException({
        code: "RESUME_BUILD_FAILED",
        message: "Failed to build resume",
      });
    }
  }
}
