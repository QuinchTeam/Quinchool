from __future__ import annotations

from functools import lru_cache
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env", extra="ignore"
    )

    crawl4ai_url: str = "http://127.0.0.1:11235"

    # Missing provider keys skip that provider and continue the fallback chain.
    gemini_api_key: str = ""
    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""
    openrouter_api_key: str = ""
    groq_api_key: str = ""

    # Tracing is disabled unless both Langfuse keys are present.
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = ""

    otel_exporter_otlp_endpoint: str = ""

    # Job extraction uses Gemini directly because its prompt and JSON schema are model-specific.
    gemini_model: str = "gemini-3.5-flash-lite"

    @property
    def crawl4ai_base_url(self) -> str:
        return self.crawl4ai_url.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
