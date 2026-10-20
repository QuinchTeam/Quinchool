import "./core/observability/instrumentation";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { toNodeHandler } from "better-auth/node";
import * as express from "express";

import { AppModule } from "./app.module";
import { createAuth } from "./core/auth/better-auth";
import { env } from "./core/config/env";
import { PrismaService } from "./core/database/prisma/prisma.service";
import { TelemetryLogger } from "./core/observability/logger";
import { requestTelemetry } from "./core/observability/request";

async function bootstrap() {
  // Mount auth before body parsing because better-auth reads the raw request.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: new TelemetryLogger(),
  });
  app.enableShutdownHooks();

  // Browser requests authenticate with cross-origin session cookies.
  app.enableCors({ credentials: true, origin: env.WEB_ORIGIN });

  app.use(requestTelemetry);
  app.use("/api/auth", toNodeHandler(createAuth(app.get(PrismaService))));
  app.use(express.json({ limit: "5mb" }));

  await app.listen(env.PORT);
}

void bootstrap();
