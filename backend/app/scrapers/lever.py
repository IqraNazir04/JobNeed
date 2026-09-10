import httpx

from app.core.config import settings
from app.scrapers.base import JobSource, RawJob, strip_html


class LeverSource(JobSource):
    """Pulls live postings from Lever's public postings API
    (https://github.com/lever/postings-api) — the same feed companies
    embed on their own public careers pages, so this needs no
    authentication, unlike Indeed/LinkedIn.

    Configure which companies to pull from via LEVER_BOARDS in .env
    (comma-separated site tokens, found in the URL of a company's Lever
    careers page, e.g. jobs.lever.co/<token>).
    """

    name = "lever"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        boards = [b.strip() for b in settings.lever_boards.split(",") if b.strip()]
        if not boards:
            raise NotImplementedError(
                "No Lever boards configured. Set LEVER_BOARDS to a "
                "comma-separated list of company site tokens, e.g. 'lever'."
            )

        query_lower = query.strip().lower()
        jobs: list[RawJob] = []
        for board in boards:
            response = httpx.get(
                f"https://api.lever.co/v0/postings/{board}",
                params={"mode": "json"},
                timeout=20.0,
            )
            if response.status_code == 404:
                continue
            response.raise_for_status()

            for result in response.json():
                title = result.get("text", "")
                description = strip_html(result.get("descriptionPlain") or result.get("description"))
                if query_lower and query_lower not in title.lower() and query_lower not in description.lower():
                    continue

                categories = result.get("categories") or {}
                jobs.append(
                    RawJob(
                        id=f"lever-{result['id']}",
                        source=self.name,
                        title=title,
                        company=board,
                        location=categories.get("location", ""),
                        description=description,
                        url=result.get("hostedUrl", ""),
                    )
                )
                if len(jobs) >= limit:
                    return jobs
        return jobs
