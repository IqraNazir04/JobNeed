import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AdminAccount(Base):
    """A job-board admin. Deliberately its own table, separate from `users`
    (regular job-seeker accounts) - see app/api/routes/auth.py's admin-login
    docstring for why that separation matters."""

    __tablename__ = "admin_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    # "admin" can manage other admin accounts and roles, plus view/remove
    # regular user accounts; "editor" can do everything else (post/edit/
    # close job board listings, view the dashboard) but not those two.
    # New admins default to "editor" - granting full "admin" is an explicit
    # choice, not the path of least resistance.
    role: Mapped[str] = mapped_column(String(20), default="editor")

    # TOTP-based two-factor auth (RFC 6238 - Google Authenticator, Authy, etc.).
    # totp_secret is generated at "setup" time but totp_enabled stays False
    # until the admin proves they can produce a valid code with it, so a
    # setup call that's never followed through doesn't silently turn on 2FA.
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
