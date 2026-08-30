# syntax=docker/dockerfile:1.7

FROM python:3.12-slim
ENV PORT=8080
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app ai
COPY apps/ai/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --requirement requirements.txt
COPY --chown=ai:app apps/ai/app ./app
USER ai
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]

