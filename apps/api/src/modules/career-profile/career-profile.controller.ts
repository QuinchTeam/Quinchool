import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  type CareerProfileValues,
  careerProfileSchema,
  type ResumeLayout,
  resumeLayoutSchema,
} from "./career-profile.contract";
import { CareerProfileService } from "./career-profile.service";

@Controller("career-profile")
@UseGuards(SessionGuard)
export class CareerProfileController {
  constructor(private readonly careerProfile: CareerProfileService) {}

  @Get()
  get(@UserId() userId: string): Promise<CareerProfileValues | null> {
    return this.careerProfile.get(userId);
  }

  @Get("resume-layout")
  getResumeLayout(@UserId() userId: string): Promise<ResumeLayout> {
    return this.careerProfile.getResumeLayout(userId);
  }

  @Put("resume-layout")
  saveResumeLayout(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(resumeLayoutSchema)) layout: ResumeLayout,
  ): Promise<ResumeLayout> {
    return this.careerProfile.saveResumeLayout(userId, layout);
  }

  @Put()
  save(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(careerProfileSchema))
    values: CareerProfileValues,
  ): Promise<CareerProfileValues> {
    return this.careerProfile.save(userId, values);
  }
}
