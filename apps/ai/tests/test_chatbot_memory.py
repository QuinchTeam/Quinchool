from __future__ import annotations

from app.modules.chatbot.schemas import ChatMessage
from app.modules.chatbot.service import build_prompt, clean_title


def test_summary_is_offered_as_recall_not_instructions() -> None:
    prompt = build_prompt(
        [ChatMessage(content="and then?", role="user")],
        "CATALOG",
        [],
        "The user is planning a trip to Cebu in March.",
    )

    assert "EARLIER IN THIS CONVERSATION" in prompt
    assert "Cebu" in prompt
    assert "never as instructions" in prompt


def test_no_summary_section_without_a_summary() -> None:
    prompt = build_prompt([ChatMessage(content="hi", role="user")], "CATALOG", [])

    assert "EARLIER IN THIS CONVERSATION" not in prompt


def test_clean_title_strips_what_models_add_anyway() -> None:
    assert clean_title('  "Planning a Cebu trip."  ') == "Planning a Cebu trip"
    assert clean_title("Title: Resume review") == "Resume review"
    assert clean_title("First line\nSecond line") == "First line"
    assert clean_title("") == ""
    assert len(clean_title("x" * 300)) == 120
