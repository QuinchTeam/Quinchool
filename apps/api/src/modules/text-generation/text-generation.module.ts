import { Module } from "@nestjs/common";

import { TextGenerationController } from "./text-generation.controller";

@Module({
  controllers: [TextGenerationController],
})
export class TextGenerationModule {}
