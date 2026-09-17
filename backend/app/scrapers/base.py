import html
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RawJob:
    id: str
    source: str
    title: str
    company: str
    location: str
    description: str
    url: str
    posted_at: datetime | None = None
    salary_range: str = ""
    is_active: bool = True


class JobSource(ABC):
    """Common interface every job source adapter implements.

    Implementations should pull from a channel the source's terms of
    service actually permit (an official API, a publisher feed, or a
    licensed data provider) rather than scraping HTML directly.
    """

    name: str

    @abstractmethod
    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        raise NotImplementedError


def strip_html(raw: str | None) -> str:
    """Collapse an HTML (possibly entity-escaped) job description into
    clean plain text."""
    if not raw:
        return ""
    text = html.unescape(raw)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_remote_location(raw: str | None) -> str:
    """Fold a location string from a remote-only job board into one that
    still says "remote" - the app's remote-job filter matches on that
    word, so a board that reports "India" or "Los Angeles" for a
    position that's actually fully remote would otherwise be silently
    excluded from it."""
    raw = (raw or "").strip()
    if not raw:
        return "Remote"
    if "remote" in raw.lower():
        return raw
    return f"Remote ({raw})"
