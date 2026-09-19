import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

import app.models  # noqa: F401 - registers all models on Base.metadata
from app.api.routes import admin_content, auth, blog, chat, cv, interview, jobs, saved_jobs, search, speaking
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine, run_lightweight_migrations
from app.core.rate_limit import limiter
from app.services.admin_bootstrap import ensure_bootstrap_admins

Base.metadata.create_all(bind=engine)
run_lightweight_migrations()

Path("uploads/blog").mkdir(parents=True, exist_ok=True)

_bootstrap_db = SessionLocal()
try:
    ensure_bootstrap_admins(_bootstrap_db)
finally:
    _bootstrap_db.close()

if settings.jwt_secret_key == "dev-insecure-secret-change-me-in-your-own-dotenv-file":
    logging.getLogger("uvicorn.error").warning(
        "JWT_SECRET_KEY is not set - using the insecure default from source control. "
        "Anyone who has read this code can forge login tokens. Set JWT_SECRET_KEY in "
        "backend/.env before exposing this server beyond local dev."
    )

app = FastAPI(title="JobNeed API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(jobs.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(cv.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(saved_jobs.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(speaking.router, prefix="/api")
app.include_router(admin_content.router, prefix="/api")
app.include_router(blog.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
