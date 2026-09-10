import json

import anthropic

from app.core.config import settings
from app.models.job import Job
from app.schemas.cv import CVData
from app.schemas.interview import InterviewPrepResponse

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You are an interview coach. Given a job posting (and optionally the "
    "candidate's CV), produce interview preparation material grounded ONLY "
    "in the information given — never invent employer facts not present in "
    "the posting, and never invent candidate experience not present in the "
    "CV.\n\n"
    "Produce: a 1-2 sentence role summary, 6 likely interview questions "
    "spanning Behavioral, Technical, and Role-specific categories with 2-3 "
    "concise talking points each (grounded in the candidate's real "
    "background when a CV is provided, otherwise general best-practice "
    "points), and 3 short research tips about the role/company to look into "
    "before the interview.\n\n"
    "Respond with ONLY a JSON object, no markdown fences, no commentary, "
    'shaped exactly like: {"role_summary": "...", "questions": '
    '[{"question": "...", "category": "...", "talking_points": ["...", "..."]}], '
    '"research_tips": ["...", "...", "..."]}'
)


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def generate_interview_prep(
    job: Job | None, raw_description: str | None, cv: CVData | None
) -> InterviewPrepResponse:
    if job is not None:
        title, company, description = job.title, job.company, job.description
    else:
        title, company, description = "", "", raw_description or ""

    prompt_parts = [f"Job posting:\nTitle: {title}\nCompany: {company}\n{description}"]
    if cv is not None:
        prompt_parts.append(f"Candidate CV:\n{cv.model_dump_json(indent=2)}")
    prompt = "\n\n".join(prompt_parts)

    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1200,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    data = _extract_json(text)

    return InterviewPrepResponse(job_title=title or "This role", company=company, **data)
