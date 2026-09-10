import json

import anthropic

from app.core.config import settings
from app.schemas.speaking import SpeakingFeedbackResponse

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You are an English speaking coach helping someone practice for job "
    "interviews in English. You are given an interview question and the "
    "candidate's SPOKEN answer, transcribed from speech - so it may contain "
    "natural speech patterns, filler words, or minor transcription quirks. "
    "Assess their ENGLISH SPEAKING specifically: grammar, fluency, clarity, "
    "vocabulary, and sentence structure. Do NOT judge whether the answer's "
    "content would impress an interviewer - that is a separate concern.\n\n"
    "Produce: an overall_score from 1-10 for English fluency and clarity, "
    "2-3 genuine strengths in how they expressed themselves, a list of "
    "specific grammar corrections (each with the original phrase, a "
    "corrected phrase, and a one-sentence explanation - omit this list if "
    "their grammar was already correct), a count of filler words used ('um', "
    "'uh', 'like', 'you know', etc.), 2-3 vocabulary or phrasing suggestions "
    "to sound more natural or professional, and a rewritten improved_answer "
    "that keeps their original meaning and content but fixes the English.\n\n"
    "Respond with ONLY a JSON object, no markdown fences, no commentary, "
    'shaped exactly like: {"overall_score": 7, "strengths": ["...", "..."], '
    '"grammar_notes": [{"original": "...", "suggestion": "...", '
    '"explanation": "..."}], "filler_word_count": 3, '
    '"vocabulary_suggestions": ["...", "..."], "improved_answer": "..."}'
)


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def get_speaking_feedback(question: str, transcript: str) -> SpeakingFeedbackResponse:
    prompt = f"Interview question: {question}\n\nCandidate's spoken answer (transcribed): {transcript}"

    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1000,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    return SpeakingFeedbackResponse(**_extract_json(text))
