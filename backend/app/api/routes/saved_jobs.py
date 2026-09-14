from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.job import Job
from app.models.saved_job import SavedJob
from app.models.user import User
from app.schemas.job import JobOut, SavedJobOut, UpdateStatusRequest

router = APIRouter(prefix="/saved-jobs", tags=["saved-jobs"])


@router.get("", response_model=list[SavedJobOut])
def list_saved_jobs(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    rows = db.query(SavedJob).filter(SavedJob.user_id == current_user.id).all()
    if not rows:
        return []
    jobs_by_id = {
        job.id: job
        for job in db.query(Job).filter(Job.id.in_([row.job_id for row in rows])).all()
    }
    return [
        SavedJobOut(job=JobOut.model_validate(jobs_by_id[row.job_id]), status=row.status, created_at=row.created_at)
        for row in rows
        if row.job_id in jobs_by_id
    ]


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


@router.patch("/{job_id}/status", response_model=SavedJobOut)
def update_status(
    job_id: str,
    payload: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.get(SavedJob, (current_user.id, job_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Job is not saved")
    row.status = payload.status
    db.commit()
    job = db.get(Job, job_id)
    return SavedJobOut(job=JobOut.model_validate(job), status=row.status, created_at=row.created_at)


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
