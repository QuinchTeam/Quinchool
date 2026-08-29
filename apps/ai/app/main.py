from fastapi import FastAPI

from app.modules.chatbot.router import router as chatbot_router
from app.modules.jobs_scraper.router import router as jobs_scraper_router
from app.modules.resume.router import router as resume_router
from app.modules.text_generation.router import router as text_generation_router

app = FastAPI(title="Quinchool AI")
app.include_router(chatbot_router)
app.include_router(jobs_scraper_router)
app.include_router(resume_router)
app.include_router(text_generation_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
