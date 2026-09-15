from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.cv import CVRecord
from app.models.user import User
from app.rag.cover_letter import generate_cover_letter
from app.rag.cv_tailor import tailor_cv
from app.schemas.cv import CoverLetterRequest, CoverLetterResponse, CVData, TailorCVRequest, TailorCVResponse

router = APIRouter(prefix="/cv", tags=["cv"])


@router.post("/tailor", response_model=TailorCVResponse)
@limiter.limit("10/minute")
def tailor(request: Request, payload: TailorCVRequest, current_user: User = Depends(get_current_user)):
    return tailor_cv(payload.cv, payload.job_description)


@router.post("/cover-letter", response_model=CoverLetterResponse)
@limiter.limit("10/minute")
def cover_letter(
    request: Request, payload: CoverLetterRequest, current_user: User = Depends(get_current_user)
):
    return generate_cover_letter(payload.cv, payload.job_description, payload.company, payload.job_title)


@router.get("", response_model=CVData)
def get_my_cv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.get(CVRecord, current_user.id)
    if record is None:
        return CVData()
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
