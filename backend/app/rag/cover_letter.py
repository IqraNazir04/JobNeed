import anthropic

from app.core.config import settings
from app.schemas.cv import CoverLetterResponse, CVData

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

_SYSTEM_PROMPT = (
    "You write concise, specific cover letters for job seekers. Given the "
    "candidate's CV data and a target job description, write a cover letter "
    "of 3-4 short paragraphs: an opening naming the role and why it's a fit, "
    "1-2 paragraphs connecting specific experience from the CV to what the "
    "posting asks for (never invent experience they don't have), and a brief "
    "closing. Plain prose, no markdown, no placeholders like [Company Name] "
    "- use the company/role names given. Do not include a salutation or "
    "signature line; the caller adds those.\n\n"
    "You may also receive additional candidate profile context (their "
    "LinkedIn/Indeed/Upwork links and GitHub bio/top languages, pulled from "
    "their connected accounts). Weave in genuinely relevant details from it "
    "- e.g. real GitHub languages that match the role's stack - but never "
    "fabricate employers, titles, or achievements beyond what the CV or this "
    "context actually states.\n\n"
    "Respond with ONLY the letter body text, no commentary, no JSON."
)


def generate_cover_letter(
    cv: CVData,
    job_description: str,
    company: str = "",
    job_title: str = "",
    profile_context: str = "",
) -> CoverLetterResponse:
    context = f"Company: {company}\nRole: {job_title}\n" if company or job_title else ""
    profile_block = f"Candidate's other profiles:\n{profile_context}\n\n" if profile_context else ""
    prompt = (
        f"Candidate CV data:\n{cv.model_dump_json(indent=2)}\n\n"
        f"{profile_block}"
        f"{context}Target job description:\n{job_description}"
    )
    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=700,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    return CoverLetterResponse(cover_letter=text.strip())
