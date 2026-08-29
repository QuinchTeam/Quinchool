import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../auth/session";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { getTextGenerationErrorResponse } from "../text-generation/errors";
import {
  type BuildResumeValues,
  buildResumeSchema,
} from "./build-resume.contract";
import {
  BuildResumeService,
  UnreadableTailorReplyError,
} from "./build-resume.service";
import type { TailoredResume } from "./tailoring";

@Controller("build-resume")
@UseGuards(SessionGuard)
export class BuildResumeController {
  constructor(private readonly buildResume: BuildResumeService) {}

  @Post()
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

      if (error instanceof UnreadableTailorReplyError) {
        // The model answered, just not with the selection that was asked for.
        throw new HttpException({ error: error.message }, 502);
      }

      const response = getTextGenerationErrorResponse(error);

      if (response) {
        throw new HttpException(response.body, response.status);
      }

      throw new InternalServerErrorException({
        error: "Failed to build resume",
      });
    }
  }
}
