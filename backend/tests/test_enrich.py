from types import SimpleNamespace
from unittest.mock import patch

from app.core.config import settings
from app.rag.enrich import maybe_summarize

LONG_TEXT = "A" * 500
SHORT_TEXT = "A short, already-clean description."


def _fake_response(text: str):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def test_short_description_is_returned_unchanged_without_calling_claude(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key")
    with patch("app.rag.enrich._client.messages.create") as mock_create:
        result = maybe_summarize(SHORT_TEXT)
    mock_create.assert_not_called()
    assert result == SHORT_TEXT


def test_long_description_without_api_key_is_unchanged(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "")
    with patch("app.rag.enrich._client.messages.create") as mock_create:
        result = maybe_summarize(LONG_TEXT)
    mock_create.assert_not_called()
    assert result == LONG_TEXT


def test_long_description_is_summarized_via_claude(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key")
    with patch(
        "app.rag.enrich._client.messages.create",
        return_value=_fake_response("A concise summary."),
    ) as mock_create:
        result = maybe_summarize(LONG_TEXT)
    mock_create.assert_called_once()
    assert result == "A concise summary."


def test_claude_failure_falls_back_to_original_text(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key")
    with patch("app.rag.enrich._client.messages.create", side_effect=RuntimeError("boom")):
        result = maybe_summarize(LONG_TEXT)
    assert result == LONG_TEXT


def test_empty_claude_reply_falls_back_to_original_text(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key")
    with patch("app.rag.enrich._client.messages.create", return_value=_fake_response("")):
        result = maybe_summarize(LONG_TEXT)
    assert result == LONG_TEXT
