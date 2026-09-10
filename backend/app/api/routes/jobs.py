import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job import Job
from app.schemas.job import ImportUrlRequest, JobOut
from app.scrapers.base import JobSource
from app.scrapers.google_jobs import GoogleJobsSource
from app.scrapers.greenhouse import GreenhouseSource
from app.scrapers.jobposting_schema import JobPostingSchemaSource
from app.scrapers.lever import LeverSource
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
}


@router.get("", response_model=list[JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.fetched_at.desc()).limit(100).all()


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/ingest/{source_name}", response_model=list[JobOut])
def ingest_source(source_name: str, query: str = "", db: Session = Depends(get_db)):
    """Fetch postings from a named source and persist them. `sample` is a
    local fixture; `greenhouse`, `lever`, and `jobposting_schema` pull live
    postings with no API key; `google_jobs` requires SERPAPI_API_KEY."""
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
def import_from_url(payload: ImportUrlRequest, db: Session = Depends(get_db)):
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
