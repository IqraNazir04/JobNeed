from types import SimpleNamespace
from unittest.mock import patch

from app.models.job import Job
from app.rag.interview_prep import generate_interview_prep
from app.schemas.cv import CVData

FAKE_REPLY = """{
  "role_summary": "A backend-focused engineering role building APIs.",
  "questions": [
    {"question": "Tell me about a time you optimized a slow API.", "category": "Behavioral", "talking_points": ["Cut latency by 40%", "Used profiling tools"]},
    {"question": "How would you design a rate limiter?", "category": "Technical", "talking_points": ["Token bucket", "Redis-backed counters"]}
  ],
  "research_tips": ["Read the company's engineering blog", "Check their tech stack on their careers page"]
}"""


def _fake_response(text: str):
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def _job(**overrides) -> Job:
    defaults = dict(
        id="job-1",
        source="sample",
        title="Backend Engineer",
        company="Acme",
        location="Remote",
        description="Build APIs.",
        url="https://example.com",
    )
    defaults.update(overrides)
    return Job(**defaults)


def test_generate_interview_prep_from_job():
    job = _job()
    with patch(
        "app.rag.interview_prep._client.messages.create",
        return_value=_fake_response(FAKE_REPLY),
    ) as mock_create:
        result = generate_interview_prep(job=job, raw_description=None, cv=None)

    mock_create.assert_called_once()
    prompt = mock_create.call_args.kwargs["messages"][0]["content"]
    assert "Backend Engineer" in prompt
    assert "Acme" in prompt

    assert result.job_title == "Backend Engineer"
    assert result.company == "Acme"
    assert result.role_summary.startswith("A backend-focused")
    assert len(result.questions) == 2
    assert result.questions[0].category == "Behavioral"
    assert result.research_tips[0] == "Read the company's engineering blog"


def test_generate_interview_prep_from_raw_description_has_no_company():
    with patch(
        "app.rag.interview_prep._client.messages.create",
        return_value=_fake_response(FAKE_REPLY),
    ):
        result = generate_interview_prep(
            job=None, raw_description="We need a backend engineer.", cv=None
        )

    assert result.job_title == "This role"
    assert result.company == ""


def test_generate_interview_prep_includes_cv_in_prompt_when_given():
    cv = CVData(name="Alex Rivera", skills=["Python", "Redis"])
    with patch(
        "app.rag.interview_prep._client.messages.create",
        return_value=_fake_response(FAKE_REPLY),
    ) as mock_create:
        generate_interview_prep(job=_job(), raw_description=None, cv=cv)

    prompt = mock_create.call_args.kwargs["messages"][0]["content"]
    assert "Alex Rivera" in prompt
    assert "Redis" in prompt


def test_generate_interview_prep_strips_markdown_fences():
    fenced = f"```json\n{FAKE_REPLY}\n```"
    with patch(
        "app.rag.interview_prep._client.messages.create",
        return_value=_fake_response(fenced),
    ):
        result = generate_interview_prep(job=_job(), raw_description=None, cv=None)

    assert len(result.questions) == 2
