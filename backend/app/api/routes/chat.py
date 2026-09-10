from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.rag import chat as rag_chat
from app.rag.retriever import retrieve_jobs
from app.schemas.job import ChatRequest, ChatResponse, JobOut

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    hits = retrieve_jobs(db, request.message, top_k=request.top_k)
    jobs = [job for job, _ in hits]
    answer = rag_chat.answer(request.message, jobs)
    return ChatResponse(
        answer=answer, matches=[JobOut.model_validate(job) for job in jobs]
    )
