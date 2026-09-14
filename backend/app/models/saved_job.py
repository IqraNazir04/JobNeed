from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


APPLICATION_STATUSES = ("saved", "applied", "interviewing", "offer", "rejected")


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    job_id: Mapped[str] = mapped_column(String(64), ForeignKey("jobs.id"), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default="saved")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
