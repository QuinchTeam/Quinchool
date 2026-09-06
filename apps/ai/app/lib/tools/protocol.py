"""Reading a tool call back out of plain model text.

Four providers serve these models and only one of them supports native function
calling, so the wire format has to be text the fallback chain can carry. The
parser is deliberately forgiving: models wrap JSON in code fences, add a
preamble, or emit the tag twice, and none of that should reach the user as a
literal answer.
"""

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
    """Split model output into a tool call and whatever prose surrounded it.

    Returns (None, text) when there is no usable call, so a malformed tag
    degrades into an ordinary answer instead of an error.
    """
    match = _TOOL_CALL.search(text)

    if not match:
        return None, text.strip()

    # Whatever happens next, the tag itself must not reach the user.
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
