from sqlalchemy.orm import Session

from app.models.job import Job
from app.rag import vector_store
from app.rag.enrich import maybe_summarize
from app.scrapers.base import JobSource, RawJob


def _upsert(db: Session, raw: RawJob) -> Job:
    job = db.get(Job, raw.id)
    if job is None:
        job = Job(id=raw.id)
        db.add(job)
    job.source = raw.source
    job.title = raw.title
    job.company = raw.company
    job.location = raw.location
    job.description = maybe_summarize(raw.description)
    job.url = raw.url
    job.posted_at = raw.posted_at
    job.salary_range = raw.salary_range
    job.is_active = raw.is_active
    return job


def ingest(db: Session, source: JobSource, query: str, limit: int = 50) -> list[Job]:
    """Fetch postings from a source, upsert them into Postgres and the
    vector index, and return the persisted Job rows."""
    raw_jobs = source.fetch(query, limit=limit)
    jobs = [_upsert(db, raw) for raw in raw_jobs]

    db.commit()
    vector_store.upsert_jobs(jobs)
    return jobs


def ingest_one(db: Session, raw: RawJob) -> Job:
    """Persist a single already-fetched posting (e.g. from a pasted URL)."""
    job = _upsert(db, raw)
    db.commit()
    vector_store.upsert_job(job)
    return job
