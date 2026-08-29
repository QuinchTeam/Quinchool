import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

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
        error: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    return parsed.data;
  }
}
