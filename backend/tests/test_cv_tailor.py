from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.rag.cv_tailor import TailorCVError, tailor_cv
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
    assert result.suggested_new_skills == []


def test_tailor_cv_includes_suggested_new_skills():
    reply = (
        '{"tailored_summary": "Backend engineer.", "emphasized_skills": '
        '["Python"], "suggested_new_skills": ["Kubernetes", "AWS"], "notes": "n/a"}'
    )
    with patch("app.rag.cv_tailor._client.messages.create", return_value=_fake_response(reply)):
        result = tailor_cv(CV, "We need a Python engineer with Kubernetes and AWS experience.")

    assert result.suggested_new_skills == ["Kubernetes", "AWS"]


def test_tailor_cv_extracts_json_from_surrounding_commentary():
    # Models occasionally ignore the "JSON only" instruction and wrap the
    # object in a stray sentence - this should still parse.
    reply = (
        "Sure, here's the tailored info:\n"
        '{"tailored_summary": "Fits well.", "emphasized_skills": ["SQL"], '
        '"suggested_new_skills": [], "notes": "n/a"}\n'
        "Let me know if you need anything else!"
    )
    with patch("app.rag.cv_tailor._client.messages.create", return_value=_fake_response(reply)):
        result = tailor_cv(CV, "Data role.")

    assert result.tailored_summary == "Fits well."


def test_tailor_cv_retries_once_on_malformed_json():
    bad_reply = _fake_response("Sorry, I can't help with that.")
    good_reply = _fake_response(
        '{"tailored_summary": "Fits well.", "emphasized_skills": ["SQL"], '
        '"suggested_new_skills": [], "notes": "n/a"}'
    )
    with patch("app.rag.cv_tailor._client.messages.create", side_effect=[bad_reply, good_reply]) as mock_create:
        result = tailor_cv(CV, "Data role.")

    assert result.tailored_summary == "Fits well."
    assert mock_create.call_count == 2


def test_tailor_cv_raises_after_two_malformed_replies():
    bad_reply = _fake_response("Sorry, I can't help with that.")
    with patch("app.rag.cv_tailor._client.messages.create", return_value=bad_reply) as mock_create:
        with pytest.raises(TailorCVError):
            tailor_cv(CV, "Data role.")

    assert mock_create.call_count == 2
