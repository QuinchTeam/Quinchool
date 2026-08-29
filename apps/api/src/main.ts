import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { toNodeHandler } from "better-auth/node";
import * as express from "express";

import { AppModule } from "./app.module";
import { createAuth } from "./auth/better-auth";
import { env } from "./config/env";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  // better-auth reads the raw request body itself, so Nest's parser is left
  // off at boot and mounted after the auth handler has claimed its routes.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // The browser calls this API directly and authenticates with the session
  // cookie, so the allowlist has to admit credentials.
  app.enableCors({ credentials: true, origin: env.WEB_ORIGIN });

  app.use("/api/auth", toNodeHandler(createAuth(app.get(PrismaService))));
  app.use(express.json({ limit: "5mb" }));

  await app.listen(env.PORT);
}

void bootstrap();
