import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiErrorBody, ApiErrorPayload } from "./api-response";

const logger = new Logger("ExceptionsHandler");

/**
 * Turns every thrown error into `{ error: { code, message, details? } }`.
 * Routes throw `{ code, message }`; Nest's own exceptions (unknown route,
 * bare `new ForbiddenException()`) get a code derived from their status.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        },
      });
      return;
    }

    const status = exception.getStatus();
    const { meta, ...error } = toPayload(exception.getResponse(), status);

    response.status(status).json(meta ? { error, meta } : { error });
  }
}

function toPayload(body: unknown, status: number): ApiErrorPayload {
  const code = HttpStatus[status] ?? "HTTP_ERROR";

  if (typeof body === "string") return { code, message: body };

  const fields = (body ?? {}) as Partial<ApiErrorPayload> & {
    message?: string | string[];
  };
  const message = Array.isArray(fields.message)
    ? fields.message.join(", ")
    : fields.message;

  return {
    code: fields.code ?? code,
    message: message ?? "Request failed.",
    ...(fields.details && { details: fields.details }),
    ...(fields.meta && { meta: fields.meta }),
  } satisfies ApiErrorBody & Pick<ApiErrorPayload, "meta">;
}
