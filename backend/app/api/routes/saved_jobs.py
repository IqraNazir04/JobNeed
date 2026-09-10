from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.job import Job
from app.models.saved_job import SavedJob
from app.models.user import User
from app.schemas.job import JobOut

router = APIRouter(prefix="/saved-jobs", tags=["saved-jobs"])


@router.get("", response_model=list[JobOut])
def list_saved_jobs(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    job_ids = [
        row.job_id
        for row in db.query(SavedJob).filter(SavedJob.user_id == current_user.id).all()
    ]
    if not job_ids:
        return []
    return db.query(Job).filter(Job.id.in_(job_ids)).all()


@router.put("/{job_id}", status_code=204)
def save_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Job, job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if db.get(SavedJob, (current_user.id, job_id)) is None:
        db.add(SavedJob(user_id=current_user.id, job_id=job_id))
        db.commit()


@router.delete("/{job_id}", status_code=204)
def unsave_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.get(SavedJob, (current_user.id, job_id))
    if row is not None:
        db.delete(row)
        db.commit()
