import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 - registers all models on Base.metadata
from app.api.routes import auth, chat, cv, interview, jobs, saved_jobs, search, speaking
from app.core.config import settings
from app.core.database import Base, engine, run_lightweight_migrations

Base.metadata.create_all(bind=engine)
run_lightweight_migrations()

if settings.jwt_secret_key == "dev-insecure-secret-change-me-in-your-own-dotenv-file":
    logging.getLogger("uvicorn.error").warning(
        "JWT_SECRET_KEY is not set - using the insecure default from source control. "
        "Anyone who has read this code can forge login tokens. Set JWT_SECRET_KEY in "
        "backend/.env before exposing this server beyond local dev."
    )

app = FastAPI(title="JobNeed API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(cv.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(saved_jobs.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(speaking.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
