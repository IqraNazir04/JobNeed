import anthropic

from app.core.config import settings
from app.models.job import Job

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You are JobNeed's assistant, helping a candidate find postings that fit what "
    "they're looking for. You are given a user's request and a list of candidate "
    "postings retrieved from a vector search. Recommend the best matches from the "
    "provided list only — never invent postings that aren't listed.\n\n"
    "Each posting in the list is labeled with an internal ID like [abc123] so you "
    "can tell them apart — that label is for your reference only and must never "
    "appear anywhere in your answer, in any form (not '[abc123]', not 'abc123', not "
    "'the first posting's ID'). The matching postings are already shown to the user "
    "as cards right below your answer, complete with title, company, and location, "
    "so don't restate those either — refer to a posting by its title or company name "
    "in your own words, and spend your words on *why* it fits or falls short.\n\n"
    "Formatting: short paragraphs of plain sentences, markdown **bold**, short markdown "
    "headers, and '- ' bullet lists are all fine when comparing several postings — but "
    "never use emoji or symbols like checkmarks/warning signs in place of words.\n\n"
    "Be honest about fit. Only call something a strong match if it genuinely is one — "
    "don't dress up a weak or tangential result as a top recommendation just because it "
    "was retrieved. If a posting is only a partial fit, say so plainly and name the gap. "
    "If nothing in the list fits well, say that clearly instead of forcing a recommendation.\n\n"
    "Keep the whole answer tight — lead with the verdict in one sentence. Give real "
    "detail only to the one or two closest postings; dismiss a clear non-fit in a single "
    "short line rather than giving it the same depth as a genuine candidate. Never end "
    "your answer mid-sentence or mid-word — finish every thought you start, and if you're "
    "running long, cut a weaker candidate rather than truncating the summary at the end."
)


def _format_context(jobs: list[Job]) -> str:
    blocks = []
    for job in jobs:
        blocks.append(
            f"[{job.id}] {job.title} at {job.company} ({job.location})\n"
            f"Source: {job.source}\nURL: {job.url}\n{job.description}"
        )
    return "\n\n---\n\n".join(blocks)


_COMPLETE_ENDINGS = ".!?\"')]"


def _looks_complete(text: str) -> bool:
    stripped = text.rstrip()
    return bool(stripped) and stripped[-1] in _COMPLETE_ENDINGS


def _trim_to_safe_ending(text: str) -> str:
    """Last-resort cleanup if every retry still ends mid-sentence: drop
    trailing lines until we're left with one that itself ends cleanly,
    rather than ever showing the user a cut-off word or sentence."""
    stripped = text.rstrip()
    if _looks_complete(stripped):
        return stripped
    lines = stripped.split("\n")
    while lines and not _looks_complete(lines[-1]):
        lines.pop()
    trimmed = "\n".join(lines).rstrip()
    return trimmed if trimmed else stripped


def answer(user_message: str, candidate_jobs: list[Job]) -> str:
    context = _format_context(candidate_jobs)
    prompt = (
        f"User request: {user_message}\n\n"
        f"Candidate postings:\n\n{context if context else '(none found)'}"
    )

    # Claude occasionally ends its turn mid-sentence on this prompt shape even
    # well under the token budget (stop_reason is "end_turn", not
    # "max_tokens" - it's not a truncation limit, just an occasional quirk of
    # this particular generation). A cut-off answer reads as broken, so retry
    # a couple of times, and if it's still incomplete, trim back to the last
    # clean sentence rather than ever show a dangling half-word.
    text = ""
    for _ in range(3):
        response = _client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1536,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        if _looks_complete(text):
            return text
    return _trim_to_safe_ending(text)
