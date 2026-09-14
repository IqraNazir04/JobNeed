import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    linkedin_url: Mapped[str] = mapped_column(String(512), default="")
    indeed_url: Mapped[str] = mapped_column(String(512), default="")
    upwork_url: Mapped[str] = mapped_column(String(512), default="")
    github_username: Mapped[str] = mapped_column(String(128), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
