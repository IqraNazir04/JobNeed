from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.rag.retriever import retrieve_jobs
from app.schemas.job import JobOut, SearchRequest, SearchResult

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=list[SearchResult])
def search(request: SearchRequest, db: Session = Depends(get_db)):
    hits = retrieve_jobs(db, request.query, top_k=request.top_k)
    return [
        SearchResult(job=JobOut.model_validate(job), score=score)
        for job, score in hits
    ]
