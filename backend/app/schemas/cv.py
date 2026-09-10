from pydantic import BaseModel


class CVExperience(BaseModel):
    title: str = ""
    company: str = ""
    dates: str = ""
    bullets: list[str] = []


class CVEducation(BaseModel):
    school: str = ""
    degree: str = ""
    dates: str = ""


class CVData(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    links: str = ""
    summary: str = ""
    experience: list[CVExperience] = []
    education: list[CVEducation] = []
    skills: list[str] = []


class TailorCVRequest(BaseModel):
    cv: CVData
    job_description: str


class TailorCVResponse(BaseModel):
    tailored_summary: str
    emphasized_skills: list[str]
    notes: str
