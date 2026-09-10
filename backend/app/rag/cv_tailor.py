import json

import anthropic

from app.core.config import settings
from app.schemas.cv import CVData, TailorCVResponse

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You help job seekers tailor their CV to a specific job posting. Given the "
    "candidate's existing CV data and a target job description, produce: a "
    "rewritten 2-3 sentence professional summary tailored to the role, the "
    "candidate's existing skills re-ordered to put the most relevant ones "
    "first (never invent skills they don't already list), and a one-sentence "
    "note on what you emphasized and why.\n\n"
    "Respond with ONLY a JSON object, no markdown fences, no commentary, "
    'shaped exactly like: {"tailored_summary": "...", "emphasized_skills": '
    '["...", "..."], "notes": "..."}'
)


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def tailor_cv(cv: CVData, job_description: str) -> TailorCVResponse:
    prompt = (
        f"Candidate CV data:\n{cv.model_dump_json(indent=2)}\n\n"
        f"Target job description:\n{job_description}"
    )
    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=600,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    return TailorCVResponse(**_extract_json(text))
