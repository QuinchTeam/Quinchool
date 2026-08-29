# apps/ai

LLM / GenAI / RAG service (FastAPI). Scraping and other Python-side work lives here too.

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set `GEMINI_API_KEY` in `apps/ai/.env` before scanning. `CRAWL4AI_URL`
defaults to `http://127.0.0.1:11235`.

```bash
python -m unittest discover -s tests -v
```
