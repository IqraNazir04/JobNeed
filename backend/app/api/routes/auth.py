from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import ADMIN_SUBJECT_PREFIX, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.integrations.github import fetch_github_stats
from app.models.user import User
from app.schemas.auth import (
    AdminLoginRequest,
    AdminTokenResponse,
    GithubStats,
    LoginRequest,
    ProfileUpdateRequest,
    TokenResponse,
    UserCreate,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.linkedin_url = payload.linkedin_url
    current_user.indeed_url = payload.indeed_url
    current_user.upwork_url = payload.upwork_url
    current_user.github_username = payload.github_username
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/github-stats/{username}", response_model=GithubStats)
def github_stats(username: str, current_user: User = Depends(get_current_user)):
    return fetch_github_stats(username)


@router.post("/admin-login", response_model=AdminTokenResponse)
def admin_login(payload: AdminLoginRequest):
    """Separate login for the job-board admin panel - checked against
    ADMIN_EMAILS/ADMIN_PASSWORD in .env, never against the `users` table.
    An admin's access and password are entirely independent of any regular
    job-seeker account, even one that happens to share the same email."""
    email = payload.email.strip().lower()
    if (
        not settings.admin_password
        or email not in settings.admin_email_set
        or payload.password != settings.admin_password
    ):
        raise HTTPException(status_code=401, detail="Invalid admin email or password")

    token = create_access_token(f"{ADMIN_SUBJECT_PREFIX}{email}")
    return AdminTokenResponse(access_token=token, email=email)
