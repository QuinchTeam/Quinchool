import { Module } from "@nestjs/common";

import { CareerProfileController } from "./career-profile.controller";
import { CareerProfileRepository } from "./career-profile.repository";
import { CareerProfileService } from "./career-profile.service";

@Module({
  controllers: [CareerProfileController],
  providers: [CareerProfileService, CareerProfileRepository],
  exports: [CareerProfileService],
})
export class CareerProfileModule {}
