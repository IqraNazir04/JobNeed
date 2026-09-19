import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SocialLink(Base):
    """A social media account the admin panel advertises on the site (e.g.
    the company's LinkedIn/X/GitHub page) - not a per-user connection."""

    __tablename__ = "social_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform: Mapped[str] = mapped_column(String(64))
    url: Mapped[str] = mapped_column(String(1024))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
