from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.admin import AdminAccount
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
ADMIN_PENDING_SUBJECT_PREFIX = "admin-pending:"


def get_current_admin_account(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AdminAccount:
    """Validates the job-board admin panel's own session token - entirely
    separate from regular user auth (POST /auth/admin-login), so admin
    access never depends on a `users` row or its password. Checked against
    the admin_accounts table (not just a static allowlist) so adding or
    removing an admin takes effect immediately, without restarting the
    server. Returns the full account (email + role)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    subject = decode_access_token(authorization.removeprefix("Bearer ").strip())
    if not subject or not subject.startswith(ADMIN_SUBJECT_PREFIX):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = subject.removeprefix(ADMIN_SUBJECT_PREFIX)
    admin = db.query(AdminAccount).filter(AdminAccount.email == email).first()
    if admin is None:
        raise HTTPException(status_code=403, detail="Admin access required")
    return admin


def get_current_admin(account: AdminAccount = Depends(get_current_admin_account)) -> str:
    """Same as get_current_admin_account, but for the (more common) case
    where a route only needs to know who's logged in, not their role."""
    return account.email


def require_admin_role(account: AdminAccount = Depends(get_current_admin_account)) -> AdminAccount:
    """Gates actions reserved for full admins: managing other admin
    accounts/roles, and viewing/removing regular user accounts. An "editor"
    can do everything else (job board CRUD, the dashboard, their own
    password/2FA) but not these."""
    if account.role != "admin":
        raise HTTPException(status_code=403, detail="This requires the admin role, not editor.")
    return account
