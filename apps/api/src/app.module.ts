import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { BuildResumeModule } from "./modules/build-resume/build-resume.module";
import { CareerProfileModule } from "./modules/career-profile/career-profile.module";
import { ChatbotModule } from "./modules/chatbot/chatbot.module";
import { JobsScraperModule } from "./modules/jobs-scraper/jobs-scraper.module";
import { PrismaModule } from "./core/database/prisma/prisma.module";
import { TextGenerationModule } from "./modules/text-generation/text-generation.module";

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
