import { Body, Controller, ForbiddenException, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { env } from "../../core/config/env";
import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { type WebTelemetry, webTelemetrySchema } from "./observability.contract";
import { ObservabilityService } from "./observability.service";

@Controller("observability")
export class ObservabilityController {
  constructor(private readonly service: ObservabilityService) {}

  @Post("web")
  @UseGuards(SessionGuard)
  @HttpCode(204)
  async receive(
    @Body(new ZodValidationPipe(webTelemetrySchema)) records: WebTelemetry,
    @UserId() userId: string,
  ) {
    await this.service.receive(records, userId);
  }

  @Post("web-public")
  @HttpCode(204)
  async receivePublic(
    @Body(new ZodValidationPipe(webTelemetrySchema)) records: WebTelemetry,
    @Req() request: Request,
  ) {
    if (request.headers.origin !== new URL(env.WEB_ORIGIN).origin) throw new ForbiddenException();
    // Origin is not authentication; anonymous telemetry stays explicitly untrusted and tightly bounded.
    await this.service.receive(records, `anonymous:${request.socket.remoteAddress ?? "unknown"}`, 20);
  }
}
