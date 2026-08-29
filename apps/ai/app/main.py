from fastapi import FastAPI

from app.routes.jobs_scraper import router as jobs_scraper_router

app = FastAPI(title="Quinchool AI")
app.include_router(jobs_scraper_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
