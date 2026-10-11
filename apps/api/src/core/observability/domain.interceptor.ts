import {
  HttpException,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Observable } from "rxjs";
import { domainLog, domainName } from "./logger";

@Injectable()
export class DomainInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const domain =
      context.getClass().name === "TextGenerationController" &&
      context.getHandler().name === "enhance"
        ? "prompt-enhancer"
        : domainName(context.getClass().name);
    if (domain === "observability" || domain === "app") return next.handle();
    const operation = `${domain}.${context.getHandler().name}`;
    return new Observable((subscriber) =>
      trace
        .getTracer("quinchool.domains")
        .startActiveSpan(
          operation,
          { attributes: { "app.domain": domain } },
          (span) => {
            const started = performance.now();
            domainLog("info", "operation.started", { domain, operation });
            const subscription = next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (error: unknown) => {
                const status =
                  error instanceof HttpException ? error.getStatus() : 500;
                if (status >= 500) {
                  span.setStatus({ code: SpanStatusCode.ERROR });
                  span.addEvent("exception", {
                    "exception.type":
                      error instanceof Error ? error.name : "UnknownError",
                  });
                }
                domainLog(
                  status >= 500 ? "error" : "warn",
                  "operation.failed",
                  {
                    domain,
                    operation,
                    status,
                    durationMs: Math.round(performance.now() - started),
                  },
                );
                span.end();
                subscriber.error(error);
              },
              complete: () => {
                domainLog("info", "operation.completed", {
                  domain,
                  operation,
                  durationMs: Math.round(performance.now() - started),
                });
                span.end();
                subscriber.complete();
              },
            });
            return () => {
              subscription.unsubscribe();
              span.end();
            };
          },
        ),
    );
  }
}
