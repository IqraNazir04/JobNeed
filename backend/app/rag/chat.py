import anthropic

from app.core.config import settings
from app.models.job import Job

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You are JobNeed's assistant. You are given a user's request and a list "
    "of candidate job/project postings retrieved from a vector search. "
    "Recommend the best matches from the provided list only — never invent "
    "postings that aren't listed. Briefly explain why each recommended "
    "posting fits the user's request. If none of the postings fit well, say so."
)


def _format_context(jobs: list[Job]) -> str:
    blocks = []
    for job in jobs:
        blocks.append(
            f"[{job.id}] {job.title} at {job.company} ({job.location})\n"
            f"Source: {job.source}\nURL: {job.url}\n{job.description}"
        )
    return "\n\n---\n\n".join(blocks)


def answer(user_message: str, candidate_jobs: list[Job]) -> str:
    context = _format_context(candidate_jobs)
    prompt = (
        f"User request: {user_message}\n\n"
        f"Candidate postings:\n\n{context if context else '(none found)'}"
    )
    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(
        block.text for block in response.content if block.type == "text"
    )
