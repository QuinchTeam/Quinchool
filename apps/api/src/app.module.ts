import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { BuildResumeModule } from "./build-resume/build-resume.module";
import { CareerProfileModule } from "./career-profile/career-profile.module";
import { ChatbotModule } from "./chatbot/chatbot.module";
import { JobsScraperModule } from "./jobs-scraper/jobs-scraper.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TextGenerationModule } from "./text-generation/text-generation.module";

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    BuildResumeModule,
    CareerProfileModule,
    ChatbotModule,
    JobsScraperModule,
    TextGenerationModule,
  ],
})
export class AppModule {}
