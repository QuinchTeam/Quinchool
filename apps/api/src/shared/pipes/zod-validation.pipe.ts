import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import type { ApiErrorPayload } from "../../core/http/api-response";

/**
 * Validates a payload against a zod schema at the route boundary, so a
 * controller only ever receives data that already has its parsed type.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid request",
        details: parsed.error.issues.map((issue) => ({
          ...(issue.path.length > 0 && { field: issue.path.join(".") }),
          code: issue.code.toUpperCase(),
          message: issue.message,
        })),
      } satisfies ApiErrorPayload);
    }

    return parsed.data;
  }
}
