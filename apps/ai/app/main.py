from fastapi import FastAPI

app = FastAPI(title="Quinchool AI")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
