from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = decode_access_token(authorization.removeprefix("Bearer ").strip())
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


ADMIN_SUBJECT_PREFIX = "admin:"


def get_current_admin(authorization: str | None = Header(default=None)) -> str:
    """Validates the job-board admin panel's own session token - entirely
    separate from regular user auth (POST /auth/admin-login), so admin
    access never depends on a `users` row or its password. Returns the
    authenticated admin's email."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    subject = decode_access_token(authorization.removeprefix("Bearer ").strip())
    if not subject or not subject.startswith(ADMIN_SUBJECT_PREFIX):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = subject.removeprefix(ADMIN_SUBJECT_PREFIX)
    if email not in settings.admin_email_set:
        raise HTTPException(status_code=403, detail="Admin access required")
    return email
