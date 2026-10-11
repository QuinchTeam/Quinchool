import { z } from "zod";

const traceId = z
  .string()
  .regex(/^[a-f0-9]{32}$/)
  .refine((id) => !/^0+$/.test(id));
const spanId = z
  .string()
  .regex(/^[a-f0-9]{16}$/)
  .refine((id) => !/^0+$/.test(id));
const log = z
  .object({
    kind: z.enum(["error", "log"]),
    message: z.string().max(512),
    severity: z.enum(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]),
    eventId: z
      .string()
      .regex(/^[a-f0-9]{32}$/)
      .optional(),
    errorType: z.string().max(80).optional(),
    domain: z
      .enum([
        "auth",
        "profile",
        "dashboard",
        "career-profile",
        "resume-builder",
        "build-resume",
        "chatbot",
        "finance-tracker",
        "jobs-scraper",
        "node-based-builder",
        "text-generation",
        "prompt-enhancer",
        "tools",
        "application",
      ])
      .optional(),
    traceId: traceId.optional(),
    spanId: spanId.optional(),
  })
  .strict();
const span = z
  .object({
    domain: log.shape.domain,
    kind: z.literal("trace"),
    traceId,
    spanId,
    parentSpanId: spanId.optional(),
    startTime: z.number().finite().positive().max(1e11),
    endTime: z.number().finite().positive().max(1e11),
    operation: z.string().min(1).max(80),
    status: z.string().max(40).optional(),
  })
  .strict()
  .refine((record) => record.endTime >= record.startTime);

export const webTelemetrySchema = z
  .array(z.union([log, span]))
  .min(1)
  .max(50);
export type WebTelemetry = z.infer<typeof webTelemetrySchema>;
