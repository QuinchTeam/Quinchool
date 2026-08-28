# apps/ai

LLM / GenAI / RAG service (FastAPI). Scraping and other Python-side work lives here too.

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
