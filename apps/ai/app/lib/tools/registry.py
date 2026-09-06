"""What tools exist, what they do, and how they are described to a model.

Every LLM concern lives on this side of the boundary. Nest never sees a tool
description or a prompt: it receives a tool name plus arguments and decides
what to run. Adding a domain means adding a module next to career_profile.py
and registering it here.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Tool:
    """One callable operation, as the model sees it."""

    name: str
    """Namespaced as `<domain>.<operation>`, e.g. career_profile.add_item."""

    description: str
    """One line. What it does and when to reach for it."""

    arguments: dict[str, str] = field(default_factory=dict)
    """Argument name to a short spec. Rendered verbatim into the prompt."""

    writes: bool = False
    """True when the tool changes stored data.

    Nest never runs a writing tool straight from a model decision; it asks the
    user to confirm first. Declared here so the prompt can tell the model that
    proposing a write is safe.
    """

    examples: tuple[str, ...] = ()
    """Optional argument payloads that show the model the expected shape."""


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, *tools: Tool) -> None:
        for tool in tools:
            if tool.name in self._tools:
                raise ValueError(f"Tool already registered: {tool.name}")
            self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def all(self) -> list[Tool]:
        return list(self._tools.values())

    def catalog_text(self) -> str:
        """The tool list as the prompt sees it, grouped by domain."""
        lines: list[str] = []
        domain = ""

        for tool in self._tools.values():
            tool_domain = tool.name.split(".", 1)[0]

            if tool_domain != domain:
                domain = tool_domain
                lines.append(f"\nDOMAIN: {domain}")

            suffix = " [changes data, the user confirms before it runs]" if tool.writes else ""
            lines.append(f"- {tool.name}: {tool.description}{suffix}")

            for argument, spec in tool.arguments.items():
                lines.append(f"    {argument}: {spec}")

            for example in tool.examples:
                lines.append(f"    example: {example}")

        return "\n".join(lines).strip()


registry = ToolRegistry()


def register_tools() -> ToolRegistry:
    """Import every domain module so its tools land in the registry."""
    from app.lib.tools import career_profile  # noqa: F401

    return registry


def describe_tool_result(name: str, result: object) -> str:
    return f"{name} RESULT:\n{json.dumps(result, default=str)}"
