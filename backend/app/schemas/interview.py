from pydantic import BaseModel

from app.schemas.cv import CVData


class InterviewPrepRequest(BaseModel):
    job_id: str | None = None
    query: str | None = None
    job_description: str | None = None
    cv: CVData | None = None


class InterviewQuestion(BaseModel):
    question: str
    category: str
    talking_points: list[str]


class InterviewPrepResponse(BaseModel):
    job_title: str
    company: str
    role_summary: str
    questions: list[InterviewQuestion]
    research_tips: list[str]
