from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.integrations.github import fetch_github_stats
from app.models.cv import CVRecord
from app.models.user import User
from app.rag.cover_letter import generate_cover_letter
from app.rag.cv_tailor import TailorCVError, tailor_cv
from app.schemas.cv import CoverLetterRequest, CoverLetterResponse, CVData, TailorCVRequest, TailorCVResponse

router = APIRouter(prefix="/cv", tags=["cv"])


@router.post("/tailor", response_model=TailorCVResponse)
@limiter.limit("10/minute")
def tailor(request: Request, payload: TailorCVRequest, current_user: User = Depends(get_current_user)):
    try:
        return tailor_cv(payload.cv, payload.job_description)
    except TailorCVError:
        raise HTTPException(
            status_code=502, detail="Couldn't tailor your CV right now - please try again."
        )


def _build_profile_context(user: User) -> str:
    """Pulls the candidate's connected profiles (set on the Account page)
    into a few lines of extra context for the cover letter - GitHub is
    fetched live since it's the one profile with a public API; a bad/stale
    username or a GitHub outage just means less context, not a failure."""
    lines = []
    if user.linkedin_url:
        lines.append(f"LinkedIn: {user.linkedin_url}")
    if user.indeed_url:
        lines.append(f"Indeed: {user.indeed_url}")
    if user.upwork_url:
        lines.append(f"Upwork: {user.upwork_url}")
    if user.github_username:
        try:
            stats = fetch_github_stats(user.github_username)
            github_line = f"GitHub ({stats.profile_url})"
            if stats.bio:
                github_line += f" - {stats.bio}"
            if stats.top_languages:
                github_line += f". Most-used languages: {', '.join(stats.top_languages)}"
            lines.append(github_line)
        except Exception:
            pass
    return "\n".join(lines)


@router.post("/cover-letter", response_model=CoverLetterResponse)
@limiter.limit("10/minute")
def cover_letter(
    request: Request, payload: CoverLetterRequest, current_user: User = Depends(get_current_user)
):
    profile_context = _build_profile_context(current_user)
    return generate_cover_letter(
        payload.cv, payload.job_description, payload.company, payload.job_title, profile_context
    )


@router.get("", response_model=CVData)
def get_my_cv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.get(CVRecord, current_user.id)
    if record is None:
        # A brand-new CV starts pre-filled with what we already know from
        # the account, rather than a fully blank form.
        return CVData(name="", email=current_user.email)
    return CVData.model_validate_json(record.data)


@router.put("", response_model=CVData)
def save_my_cv(
    payload: CVData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.get(CVRecord, current_user.id)
    if record is None:
        record = CVRecord(user_id=current_user.id, data=payload.model_dump_json())
        db.add(record)
    else:
        record.data = payload.model_dump_json()
    db.commit()
    return payload
