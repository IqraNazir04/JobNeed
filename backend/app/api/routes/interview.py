from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job import Job
from app.rag.interview_prep import generate_interview_prep
from app.rag.retriever import retrieve_jobs
from app.schemas.interview import InterviewPrepRequest, InterviewPrepResponse

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/prepare", response_model=InterviewPrepResponse)
def prepare(payload: InterviewPrepRequest, db: Session = Depends(get_db)):
    """Grounds interview prep in a real job posting, found one of three ways:
    an exact `job_id`, a semantic search (`query`) over the jobs already
    indexed in the vector store, or a raw pasted `job_description`."""
    job: Job | None = None
    raw_description: str | None = None

    if payload.job_id:
        job = db.get(Job, payload.job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")
    elif payload.query:
        hits = retrieve_jobs(db, payload.query, top_k=1)
        if not hits:
            raise HTTPException(
                status_code=404,
                detail="No indexed jobs match that query. Try pasting a job description instead.",
            )
        job = hits[0][0]
    elif payload.job_description:
        raw_description = payload.job_description
    else:
        raise HTTPException(
            status_code=422, detail="Provide a job_id, a query, or a job_description."
        )

    return generate_interview_prep(job=job, raw_description=raw_description, cv=payload.cv)
