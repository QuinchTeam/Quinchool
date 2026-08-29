import { Module } from "@nestjs/common";

import { CareerProfileController } from "./career-profile.controller";
import { CareerProfileService } from "./career-profile.service";

@Module({
  controllers: [CareerProfileController],
  providers: [CareerProfileService],
  exports: [CareerProfileService],
})
export class CareerProfileModule {}
