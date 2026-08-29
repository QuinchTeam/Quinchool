# apps/ai

LLM / GenAI / RAG service (FastAPI). Scraping and other Python-side work lives here too.

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Provider keys, fallback order, prompts, and model-output handling belong here.
Set the provider keys you use in `apps/ai/.env`; `CRAWL4AI_URL` defaults to
`http://127.0.0.1:11235`.

FastAPI is stateless and never accesses the database. NestJS authenticates,
reads or writes data, and sends only the required JSON to these workflows:

- `/text-generation` and `/prompt-enhancer`
- `/chatbot/respond` and `/chatbot/respond-with-profile`
- `/resume/tailor`
- `/jobs-scraper/scan`

```bash
python -m unittest discover -s tests -v
```
