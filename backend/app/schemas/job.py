from datetime import datetime

from pydantic import BaseModel


class JobOut(BaseModel):
    id: str
    source: str
    title: str
    company: str
    location: str
    description: str
    url: str
    posted_at: datetime | None = None

    model_config = {"from_attributes": True}


class ImportUrlRequest(BaseModel):
    url: str


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10


class SearchResult(BaseModel):
    job: JobOut
    score: float


class ChatRequest(BaseModel):
    message: str
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    matches: list[JobOut]
