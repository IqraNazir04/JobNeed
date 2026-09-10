from unittest.mock import patch

from app.core.database import SessionLocal
from app.models.job import Job
from app.scrapers.sample import SampleSource
from app.services.ingestion import ingest


def test_ingest_persists_jobs_to_db():
    db = SessionLocal()
    try:
        jobs = ingest(db, SampleSource(), query="")
        assert len(jobs) == 3
        assert db.query(Job).count() == 3
    finally:
        db.close()


def test_ingest_upserts_without_duplicating():
    db = SessionLocal()
    try:
        ingest(db, SampleSource(), query="")
        ingest(db, SampleSource(), query="")
        assert db.query(Job).count() == 3
    finally:
        db.close()


def test_ingest_updates_existing_row_fields():
    db = SessionLocal()
    try:
        ingest(db, SampleSource(), query="")
        job = db.get(Job, "sample-1")
        job.title = "stale title"
        db.commit()

        ingest(db, SampleSource(), query="")
        refreshed = db.get(Job, "sample-1")
        assert refreshed.title == "Senior Backend Engineer (Python)"
    finally:
        db.close()


def test_ingest_runs_descriptions_through_claude_cleanup():
    db = SessionLocal()
    try:
        with patch(
            "app.services.ingestion.maybe_summarize", side_effect=lambda d: f"CLEANED: {d}"
        ) as mock_summarize:
            jobs = ingest(db, SampleSource(), query="")
        assert mock_summarize.call_count == 3
        assert all(job.description.startswith("CLEANED: ") for job in jobs)
    finally:
        db.close()
