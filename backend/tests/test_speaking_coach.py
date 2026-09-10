from types import SimpleNamespace
from unittest.mock import patch

from app.rag.speaking_coach import get_speaking_feedback

FAKE_REPLY = """{
  "overall_score": 7,
  "strengths": ["Clear structure", "Good use of specific examples"],
  "grammar_notes": [
    {"original": "I have work there for two years", "suggestion": "I worked there for two years", "explanation": "Use simple past tense for a completed period of time."}
  ],
  "filler_word_count": 4,
  "vocabulary_suggestions": ["Use 'collaborated with' instead of 'worked with'", "Try 'achieved' instead of 'did good'"],
  "improved_answer": "I worked there for two years and collaborated closely with the design team."
}"""


def _fake_response(text: str):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def test_get_speaking_feedback_parses_response():
    with patch(
        "app.rag.speaking_coach._client.messages.create",
        return_value=_fake_response(FAKE_REPLY),
    ) as mock_create:
        result = get_speaking_feedback(
            "Tell me about your last job.", "Um, I have work there for two years, like."
        )

    mock_create.assert_called_once()
    prompt = mock_create.call_args.kwargs["messages"][0]["content"]
    assert "Tell me about your last job." in prompt
    assert "I have work there for two years" in prompt

    assert result.overall_score == 7
    assert result.filler_word_count == 4
    assert len(result.grammar_notes) == 1
    assert result.grammar_notes[0].original == "I have work there for two years"
    assert "collaborated" in result.improved_answer


def test_get_speaking_feedback_strips_markdown_fences():
    fenced = f"```json\n{FAKE_REPLY}\n```"
    with patch(
        "app.rag.speaking_coach._client.messages.create",
        return_value=_fake_response(fenced),
    ):
        result = get_speaking_feedback("Q", "A")

    assert result.overall_score == 7


def test_get_speaking_feedback_handles_no_grammar_notes():
    reply = """{
      "overall_score": 9,
      "strengths": ["Excellent grammar", "Confident delivery"],
      "grammar_notes": [],
      "filler_word_count": 0,
      "vocabulary_suggestions": [],
      "improved_answer": "Great answer as is."
    }"""
    with patch(
        "app.rag.speaking_coach._client.messages.create",
        return_value=_fake_response(reply),
    ):
        result = get_speaking_feedback("Q", "A perfectly spoken answer.")

    assert result.grammar_notes == []
    assert result.filler_word_count == 0
