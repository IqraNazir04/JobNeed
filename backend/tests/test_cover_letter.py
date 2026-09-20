from types import SimpleNamespace
from unittest.mock import patch

from app.rag.cover_letter import generate_cover_letter
from app.schemas.cv import CVData

CV = CVData(name="Alex Rivera", email="alex@example.com", summary="Backend engineer.")


def _fake_response(text: str):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def test_cover_letter_without_profile_context():
    with patch("app.rag.cover_letter._client.messages.create", return_value=_fake_response("Dear hiring team...")) as mock_create:
        result = generate_cover_letter(CV, "Backend engineer role.")

    assert result.cover_letter == "Dear hiring team..."
    prompt = mock_create.call_args.kwargs["messages"][0]["content"]
    assert "Candidate's other profiles" not in prompt


def test_cover_letter_includes_profile_context_when_given():
    profile_context = "LinkedIn: https://linkedin.com/in/alex\nGitHub (https://github.com/alex) - Most-used languages: Python, Go"
    with patch("app.rag.cover_letter._client.messages.create", return_value=_fake_response("Letter body")) as mock_create:
        generate_cover_letter(CV, "Backend engineer role.", profile_context=profile_context)

    prompt = mock_create.call_args.kwargs["messages"][0]["content"]
    assert "Candidate's other profiles" in prompt
    assert "github.com/alex" in prompt
    assert "Python, Go" in prompt
