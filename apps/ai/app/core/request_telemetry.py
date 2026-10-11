import time

from opentelemetry import trace

from app.core.logging import log_event
from app.core.telemetry import domain_tracer


class RequestTelemetry:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] == "/health":
            return await self.app(scope, receive, send)
        segment = scope["path"].split("/")[1]
        domain = (
            "resume-builder"
            if segment == "resume"
            else segment
            if segment
            in {
                "chatbot",
                "jobs-scraper",
                "resume",
                "text-generation",
                "prompt-enhancer",
            }
            else "application"
        )
        with domain_tracer().start_as_current_span(
            f"{domain}.request",
            attributes={"app.domain": domain},
            record_exception=False,
            set_status_on_exception=False,
        ) as span:
            started = time.monotonic()
            status = 500
            log_event("info", domain, "request.started")

            async def observed_send(message):
                nonlocal status
                if message["type"] == "http.response.start":
                    status = message["status"]
                await send(message)

            try:
                await self.app(scope, receive, observed_send)
            except Exception as error:
                span.add_event("exception", {"exception.type": type(error).__name__})
                raise
            finally:
                span.set_attribute("http.response.status_code", status)
                if status >= 500:
                    span.set_status(trace.Status(trace.StatusCode.ERROR))
                log_event(
                    "error" if status >= 500 else "warn" if status >= 400 else "info",
                    domain,
                    "request.failed" if status >= 400 else "request.completed",
                    {
                        "status": status,
                        "durationMs": round((time.monotonic() - started) * 1000),
                    },
                )
