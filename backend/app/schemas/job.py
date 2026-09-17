from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ApplicationStatus = Literal["saved", "applied", "interviewing", "offer", "rejected"]


class JobOut(BaseModel):
    id: str
    source: str
    title: str
    company: str
    location: str
    description: str
    url: str
    posted_at: datetime | None = None
    salary_range: str = ""
    is_active: bool = True

    model_config = {"from_attributes": True}


class JobBoardCreate(BaseModel):
    title: str
    company: str
    location: str = ""
    remote: bool = False
    description: str
    url: str
    salary_range: str = ""


class JobBoardUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    remote: bool | None = None
    description: str | None = None
    url: str | None = None
    salary_range: str | None = None
    is_active: bool | None = None


class SavedJobOut(BaseModel):
    job: JobOut
    status: ApplicationStatus
    created_at: datetime


class UpdateStatusRequest(BaseModel):
    status: ApplicationStatus


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
