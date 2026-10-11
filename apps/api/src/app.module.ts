import { Module, type OnApplicationShutdown } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DomainInterceptor } from "./core/observability/domain.interceptor";

import { telemetrySdk } from "./core/observability/instrumentation";

import { AppController } from "./app.controller";
import { BuildResumeModule } from "./modules/build-resume/build-resume.module";
import { CareerProfileModule } from "./modules/career-profile/career-profile.module";
import { ChatbotModule } from "./modules/chatbot/chatbot.module";
import { FinanceTrackerModule } from "./modules/finance-tracker/finance-tracker.module";
import { JobsScraperModule } from "./modules/jobs-scraper/jobs-scraper.module";
import { PrismaModule } from "./core/database/prisma/prisma.module";
import { TextGenerationModule } from "./modules/text-generation/text-generation.module";
import { ObservabilityModule } from "./modules/observability/observability.module";

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: DomainInterceptor }],
  controllers: [AppController],
  imports: [
    PrismaModule,
    BuildResumeModule,
    CareerProfileModule,
    ChatbotModule,
    FinanceTrackerModule,
    JobsScraperModule,
    TextGenerationModule,
    ObservabilityModule,
  ],
})
export class AppModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await telemetrySdk?.shutdown();
  }
}
