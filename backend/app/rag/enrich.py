import logging

import anthropic

from app.core.config import settings

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

# Real postings (Greenhouse, Lever, ...) are often padded with repeated
# company boilerplate, legal/benefits copy, and formatting cruft. Short
# descriptions (sample fixtures, terse feeds) are already clean, so only
# the verbose ones are worth the extra API call.
_MIN_LENGTH_TO_SUMMARIZE = 400

_SYSTEM_PROMPT = (
    "You clean up real job postings for a job board. Rewrite the given "
    "posting as a clear, concise 2-4 sentence description covering the "
    "role, key responsibilities, and must-have requirements. Use only "
    "information present in the source text — never invent details. "
    "Reply with the description only, no preamble."
)


def maybe_summarize(description: str) -> str:
    """Condense a verbose real job description with Claude. Falls back to
    the original text if no API key is configured or the call fails, so
    an ingest never breaks because of this enrichment step."""
    if len(description) < _MIN_LENGTH_TO_SUMMARIZE or not settings.anthropic_api_key:
        return description

    try:
        response = _client.messages.create(
            model=settings.anthropic_model,
            max_tokens=300,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": description}],
        )
        text = "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
        return text or description
    except Exception:
        # Ingestion of real postings must survive a flaky/unavailable LLM
        # call - fall back to the original (already usable) description.
        logger.warning("Claude description cleanup failed; using raw text", exc_info=True)
        return description
