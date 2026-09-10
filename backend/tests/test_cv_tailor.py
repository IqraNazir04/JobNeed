from types import SimpleNamespace
from unittest.mock import patch

from app.rag.cv_tailor import tailor_cv
from app.schemas.cv import CVData

CV = CVData(
    name="Alex Rivera",
    email="alex@example.com",
    summary="Backend engineer.",
    skills=["Python", "SQL", "Docker"],
)


def _fake_response(text: str):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def test_tailor_cv_parses_plain_json():
    reply = (
        '{"tailored_summary": "Backend engineer skilled in Python and cloud '
        'infra.", "emphasized_skills": ["Python", "Docker", "SQL"], "notes": '
        '"Prioritized Python and Docker to match the job\'s stack."}'
    )
    with patch("app.rag.cv_tailor._client.messages.create", return_value=_fake_response(reply)):
        result = tailor_cv(CV, "We need a Python/Docker backend engineer.")

    assert result.tailored_summary.startswith("Backend engineer skilled")
    assert result.emphasized_skills == ["Python", "Docker", "SQL"]
    assert "Python" in result.notes


def test_tailor_cv_strips_markdown_code_fences():
    reply = (
        "```json\n"
        '{"tailored_summary": "Fits the role.", "emphasized_skills": '
        '["SQL"], "notes": "Focused on data skills."}\n'
        "```"
    )
    with patch("app.rag.cv_tailor._client.messages.create", return_value=_fake_response(reply)):
        result = tailor_cv(CV, "Looking for a data-focused engineer.")

    assert result.tailored_summary == "Fits the role."
    assert result.emphasized_skills == ["SQL"]
