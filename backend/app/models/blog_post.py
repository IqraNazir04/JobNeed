import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BlogPost(Base):
    """A post written from the admin panel. published=False + a future
    scheduled_for is how the content calendar shows upcoming posts."""

    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    author_email: Mapped[str] = mapped_column(String(255))
    image_url: Mapped[str] = mapped_column(String(1024), default="")
    # Comma-separated, e.g. "career, remote-work" - kept as plain text rather
    # than a separate table since posts are only ever tagged by whoever
    # writes them, not searched/filtered by tag yet.
    tags: Mapped[str] = mapped_column(String(512), default="")
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
