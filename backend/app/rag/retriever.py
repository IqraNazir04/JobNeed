from sqlalchemy.orm import Session

from app.models.job import Job
from app.rag import vector_store


def retrieve_jobs(db: Session, text: str, top_k: int = 10) -> list[tuple[Job, float]]:
    hits = vector_store.query(text, top_k=top_k)
    if not hits:
        return []

    ids = [job_id for job_id, _ in hits]
    jobs_by_id = {job.id: job for job in db.query(Job).filter(Job.id.in_(ids)).all()}

    results = []
    for job_id, score in hits:
        job = jobs_by_id.get(job_id)
        if job is not None:
            results.append((job, score))
    return results
