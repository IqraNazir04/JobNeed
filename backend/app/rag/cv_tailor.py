import json
import re

import anthropic

from app.core.config import settings
from app.schemas.cv import CVData, TailorCVResponse

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You help job seekers tailor their CV to a specific job posting. Given the "
    "candidate's existing CV data and a target job description, produce: a "
    "rewritten 2-3 sentence professional summary tailored to the role; the "
    "candidate's existing skills re-ordered to put the most relevant ones "
    "first (never invent skills they don't already list); up to 5 additional "
    "skills, tools, or technologies named in the job description that the "
    "candidate does NOT already list on their CV but that a candidate with "
    "their stated experience plausibly already has - these are suggestions "
    "for the candidate to review and add only if actually true, framed as "
    "suggestions rather than facts, not experience-gap advice about what to "
    "go learn; and a one-sentence note on what you emphasized and why.\n\n"
    "Respond with ONLY a JSON object, no markdown fences, no commentary, "
    'shaped exactly like: {"tailored_summary": "...", "emphasized_skills": '
    '["...", "..."], "suggested_new_skills": ["...", "..."], "notes": "..."}'
)

_JSON_OBJECT = re.compile(r"\{.*\}", re.DOTALL)


class TailorCVError(Exception):
    """The model didn't return a parseable response after retrying."""


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    # The prompt asks for ONLY a JSON object, but models occasionally wrap it
    # in a stray sentence anyway - pull out the outermost {...} rather than
    # assuming the whole trimmed reply is valid JSON on its own.
    match = _JSON_OBJECT.search(text)
    return json.loads(match.group(0) if match else text)


def _call_model(cv: CVData, job_description: str) -> str:
    prompt = (
        f"Candidate CV data:\n{cv.model_dump_json(indent=2)}\n\n"
        f"Target job description:\n{job_description}"
    )
    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=900,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


def tailor_cv(cv: CVData, job_description: str) -> TailorCVResponse:
    # A single malformed reply shouldn't surface as a hard failure - retry
    # once before giving up, since this is the model occasionally not
    # following the "JSON only" instruction rather than a real error.
    last_error: Exception | None = None
    for _attempt in range(2):
        text = _call_model(cv, job_description)
        try:
            return TailorCVResponse(**_extract_json(text))
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
    raise TailorCVError("The model didn't return a usable response after retrying.") from last_error
