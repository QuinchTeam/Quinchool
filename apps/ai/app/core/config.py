from __future__ import annotations

from functools import lru_cache
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env", extra="ignore"
    )

    crawl4ai_url: str = "http://127.0.0.1:11235"

    # Text-generation provider credentials. A model falls through to the next
    # provider its config lists, so a missing key costs a fallback, not a scan.
    gemini_api_key: str = ""
    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""
    openrouter_api_key: str = ""
    groq_api_key: str = ""

    # Optional. Without both keys, tracing is off and generation is untouched.
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = ""

    # The job scraper pins its own model: its prompt and JSON schema are tuned
    # for Gemini, so it does not go through the text-generation provider chain.
    gemini_model: str = "gemini-3.1-flash-lite"

    @property
    def crawl4ai_base_url(self) -> str:
        return self.crawl4ai_url.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
