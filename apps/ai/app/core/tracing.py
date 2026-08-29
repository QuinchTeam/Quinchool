"""Langfuse tracing for LLM calls.

Port of apps/api/src/common/langfuse.ts plus the observations that wrapped the
Nest text-generation service. Entirely optional: without both keys — or without
the package installed — this is a no-op, and a broken tracer never costs the
caller its answer.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any, Literal, Protocol, final

from app.core.config import get_settings

ObservationType = Literal["chain", "generation", "span"]


class Observation(Protocol):
    """The slice of a Langfuse observation this service actually calls."""

    def update(self, **kwargs: Any) -> Any: ...


@final
class NoObservation:
    def update(self, **kwargs: Any) -> None:
        return None


_client: Any = None
_resolved = False


def _get_client() -> Any:
    global _client, _resolved

    if _resolved:
        return _client

    _resolved = True
    settings = get_settings()
    public_key = settings.langfuse_public_key.strip()
    secret_key = settings.langfuse_secret_key.strip()

    if not public_key or not secret_key:
        return None

    try:
        from langfuse import Langfuse

        _client = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=settings.langfuse_host.strip() or None,
        )
    except Exception:  # noqa: BLE001 - a broken tracer must not take generation down
        _client = None

    return _client


@contextmanager
def observe(
    name: str, *, as_type: ObservationType, **fields: Any
) -> Iterator[Observation]:
    client = _get_client()

    if client is None:
        yield NoObservation()
        return

    with client.start_as_current_observation(
        name=name, as_type=as_type, **fields
    ) as observation:
        yield observation


def usage_details(
    input_tokens: int | None, output_tokens: int | None
) -> dict[str, int]:
    """Langfuse counts integers only, and a provider may report neither."""
    counts = {"input": input_tokens, "output": output_tokens}

    return {key: value for key, value in counts.items() if value is not None}
