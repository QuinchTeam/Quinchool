import { Module } from "@nestjs/common";

import { BuildResumeController } from "./build-resume.controller";
import { BuildResumeService } from "./build-resume.service";

@Module({
  controllers: [BuildResumeController],
  providers: [BuildResumeService],
})
export class BuildResumeModule {}
