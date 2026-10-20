# Use text tool calls across providers because native calling is not available everywhere.

from __future__ import annotations

import json
import re
from dataclasses import dataclass

TOOL_CALL_OPEN = "<tool_call>"
TOOL_CALL_CLOSE = "</tool_call>"

_TOOL_CALL = re.compile(
    rf"{re.escape(TOOL_CALL_OPEN)}(.*?){re.escape(TOOL_CALL_CLOSE)}",
    re.DOTALL,
)
_CODE_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


@dataclass(frozen=True)
class ParsedToolCall:
    name: str
    arguments: dict[str, object]


def parse_tool_call(text: str) -> tuple[ParsedToolCall | None, str]:
    # Malformed tool JSON falls back to prose with its tag removed.
    match = _TOOL_CALL.search(text)

    if not match:
        return None, text.strip()

    without_tag = (text[: match.start()] + text[match.end() :]).strip()
    payload = _CODE_FENCE.sub("", match.group(1)).strip()

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError:
        return None, without_tag

    if not isinstance(parsed, dict):
        return None, without_tag

    name = parsed.get("name")

    if not isinstance(name, str) or not name:
        return None, without_tag

    arguments = parsed.get("arguments")

    if not isinstance(arguments, dict):
        arguments = {}

    return ParsedToolCall(name=name, arguments=arguments), without_tag
