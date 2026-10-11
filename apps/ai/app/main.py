from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.request_telemetry import RequestTelemetry
from app.core.telemetry import instrument_app, shutdown_logs
from app.modules.chatbot.router import router as chatbot_router
from app.modules.jobs_scraper.router import router as jobs_scraper_router
from app.modules.resume.router import router as resume_router
from app.modules.text_generation.router import router as text_generation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if telemetry_provider is not None:
        telemetry_provider.shutdown()
    shutdown_logs()


app = FastAPI(title="Quinchool AI", lifespan=lifespan)
telemetry_provider = instrument_app(app)
app.add_middleware(RequestTelemetry)
app.include_router(chatbot_router)
app.include_router(jobs_scraper_router)
app.include_router(resume_router)
app.include_router(text_generation_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
