import { Module } from "@nestjs/common";

import { BuildResumeController } from "./build-resume.controller";
import { BuildResumeRepository } from "./build-resume.repository";
import { BuildResumeService } from "./build-resume.service";

@Module({
  controllers: [BuildResumeController],
  providers: [BuildResumeService, BuildResumeRepository],
})
export class BuildResumeModule {}
