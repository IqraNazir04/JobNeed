import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.models.job import Job
from app.models.user import User
from app.rag import vector_store
from app.schemas.job import ImportUrlRequest, JobBoardCreate, JobBoardUpdate, JobOut
from app.scrapers.ashby import AshbySource
from app.scrapers.base import JobSource, RawJob, normalize_remote_location
from app.scrapers.google_jobs import GoogleJobsSource
from app.scrapers.greenhouse import GreenhouseSource
from app.scrapers.jobicy import JobicySource
from app.scrapers.jobposting_schema import JobPostingSchemaSource
from app.scrapers.lever import LeverSource
from app.scrapers.remoteok import RemoteOKSource
from app.scrapers.sample import SampleSource
from app.scrapers.url_import import fetch_from_url
from app.services.ingestion import ingest, ingest_one

router = APIRouter(prefix="/jobs", tags=["jobs"])

_SOURCES: dict[str, type[JobSource]] = {
    "sample": SampleSource,
    "google_jobs": GoogleJobsSource,
    "greenhouse": GreenhouseSource,
    "lever": LeverSource,
    "jobposting_schema": JobPostingSchemaSource,
    "remoteok": RemoteOKSource,
    "jobicy": JobicySource,
    "ashby": AshbySource,
}


@router.get("", response_model=list[JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return (
        db.query(Job)
        .filter(Job.is_active.is_(True))
        .order_by(Job.fetched_at.desc())
        .limit(100)
        .all()
    )


def _compose_board_location(location: str, remote: bool) -> str:
    location = (location or "").strip()
    return normalize_remote_location(location) if remote else (location or "Not specified")


@router.get("/board/mine", response_model=list[JobOut])
def list_my_board_jobs(
    db: Session = Depends(get_db),
    _admin_email: str = Depends(get_current_admin),
):
    return (
        db.query(Job)
        .filter(Job.source == "jobneed")
        .order_by(Job.fetched_at.desc())
        .all()
    )


@router.post("/board", response_model=JobOut)
def create_board_job(
    payload: JobBoardCreate,
    db: Session = Depends(get_db),
    _admin_email: str = Depends(get_current_admin),
):
    """Post a job directly on JobNeed (the site owner only). It's stored and
    indexed exactly like a scraped posting - source "jobneed" - so it shows
    up in Search and the Assistant alongside everything else with no extra
    plumbing."""
    raw = RawJob(
        id=f"jobneed-{uuid.uuid4().hex[:12]}",
        source="jobneed",
        title=payload.title.strip(),
        company=payload.company.strip(),
        location=_compose_board_location(payload.location, payload.remote),
        description=payload.description.strip(),
        url=payload.url.strip(),
        salary_range=payload.salary_range.strip(),
        is_active=True,
    )
    return ingest_one(db, raw)


@router.patch("/board/{job_id}", response_model=JobOut)
def update_board_job(
    job_id: str,
    payload: JobBoardUpdate,
    db: Session = Depends(get_db),
    _admin_email: str = Depends(get_current_admin),
):
    job = db.get(Job, job_id)
    if job is None or job.source != "jobneed":
        raise HTTPException(status_code=404, detail="Job posting not found")

    if payload.title is not None:
        job.title = payload.title.strip()
    if payload.company is not None:
        job.company = payload.company.strip()
    if payload.location is not None or payload.remote is not None:
        remote = payload.remote if payload.remote is not None else "remote" in job.location.lower()
        location = payload.location if payload.location is not None else job.location
        job.location = _compose_board_location(location, remote)
    if payload.description is not None:
        job.description = payload.description.strip()
    if payload.url is not None:
        job.url = payload.url.strip()
    if payload.salary_range is not None:
        job.salary_range = payload.salary_range.strip()
    if payload.is_active is not None:
        job.is_active = payload.is_active

    db.commit()
    db.refresh(job)
    if job.is_active:
        vector_store.upsert_job(job)
    else:
        vector_store.delete_job(job.id)
    return job


@router.post("/board/{job_id}/close", response_model=JobOut)
def close_board_job(
    job_id: str,
    db: Session = Depends(get_db),
    _admin_email: str = Depends(get_current_admin),
):
    job = db.get(Job, job_id)
    if job is None or job.source != "jobneed":
        raise HTTPException(status_code=404, detail="Job posting not found")
    job.is_active = False
    db.commit()
    vector_store.delete_job(job.id)
    return job


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/ingest/{source_name}", response_model=list[JobOut])
def ingest_source(source_name: str, query: str = "", db: Session = Depends(get_db)):
    """Fetch postings from a named source and persist them. `sample` is a
    local fixture; `greenhouse`, `lever`, `ashby`, `jobposting_schema`,
    `remoteok`, and `jobicy` pull live postings with no API key;
    `google_jobs` requires SERPAPI_API_KEY."""
    source_cls = _SOURCES.get(source_name)
    if source_cls is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown source '{source_name}'. Available: {', '.join(_SOURCES)}",
        )
    try:
        return ingest(db, source_cls(), query=query)
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import-url", response_model=JobOut)
def import_from_url(
    payload: ImportUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import a single job posting from its public URL (e.g. a LinkedIn job
    link) using the page's Open Graph preview metadata — no bulk scraping,
    no credentials, just the same tags the site publishes for link previews."""
    try:
        raw = fetch_from_url(payload.url)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=400,
            detail=f"That URL responded with {e.response.status_code}.",
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=400, detail="Could not reach that URL.")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ingest_one(db, raw)
