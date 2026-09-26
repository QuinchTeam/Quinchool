from __future__ import annotations

from app.lib.tools.registry import register_tools


def test_registry_namespaces_every_tool_by_domain() -> None:
    tools = register_tools()

    assert tools.get("career_profile.get") is not None
    assert all("." in tool.name for tool in tools.all())
    assert any(tool.writes for tool in tools.all())
