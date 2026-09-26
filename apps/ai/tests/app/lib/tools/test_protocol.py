from __future__ import annotations

from app.lib.tools.protocol import parse_tool_call


def test_parses_a_bare_tool_call() -> None:
    call, prose = parse_tool_call(
        '<tool_call>{"name": "career_profile.get", "arguments": {"sections": ["skillGroups"]}}</tool_call>'
    )

    assert call is not None
    assert call.name == "career_profile.get"
    assert call.arguments == {"sections": ["skillGroups"]}
    assert prose == ""


def test_tolerates_code_fences_and_a_preamble() -> None:
    call, prose = parse_tool_call(
        'Sure.\n<tool_call>\n```json\n{"name": "career_profile.remove_item", '
        '"arguments": {"section": "skills"}}\n```\n</tool_call>'
    )

    assert call is not None
    assert call.name == "career_profile.remove_item"
    assert prose == "Sure."


def test_plain_prose_is_not_a_tool_call() -> None:
    assert parse_tool_call("Just an answer.") == (None, "Just an answer.")


def test_a_broken_tag_never_reaches_the_user() -> None:
    call, prose = parse_tool_call("Here you go <tool_call>not json</tool_call>")

    assert call is None
    assert "tool_call" not in prose


def test_missing_name_is_not_a_tool_call() -> None:
    call, _ = parse_tool_call('<tool_call>{"arguments": {}}</tool_call>')

    assert call is None
