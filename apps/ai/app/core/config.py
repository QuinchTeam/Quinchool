from __future__ import annotations

from functools import lru_cache
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env", extra="ignore"
    )

    crawl4ai_url: str = "http://127.0.0.1:11235"
    gemini_api_key: str = ""
    # Mirrors DEFAULT_TEXT_GENERATION_MODEL_ID (GEMINI_3_1_FLASH_LITE) in the
    # web app's model registry. Only the resolved provider id matters here.
    gemini_model: str = "gemini-3.1-flash-lite"

    @property
    def crawl4ai_base_url(self) -> str:
        return self.crawl4ai_url.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
