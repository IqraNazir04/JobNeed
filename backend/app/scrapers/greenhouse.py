import httpx

from app.core.config import settings
from app.scrapers.base import JobSource, RawJob, strip_html


class GreenhouseSource(JobSource):
    """Pulls live postings from Greenhouse's public job board API
    (https://developers.greenhouse.io/job-board.html) — the same feed
    companies embed on their own public careers pages, so this needs no
    authentication or partner agreement, unlike Indeed/LinkedIn.

    Configure which companies to pull from via GREENHOUSE_BOARDS in .env
    (comma-separated board tokens, found in the URL of a company's
    Greenhouse careers page, e.g. boards.greenhouse.io/<token>).
    """

    name = "greenhouse"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        boards = [b.strip() for b in settings.greenhouse_boards.split(",") if b.strip()]
        if not boards:
            raise NotImplementedError(
                "No Greenhouse boards configured. Set GREENHOUSE_BOARDS to a "
                "comma-separated list of company board tokens, e.g. 'gitlab'."
            )

        query_lower = query.strip().lower()
        jobs: list[RawJob] = []
        for board in boards:
            response = httpx.get(
                f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs",
                params={"content": "true"},
                timeout=20.0,
            )
            if response.status_code == 404:
                continue
            response.raise_for_status()

            for result in response.json().get("jobs", []):
                title = result.get("title", "")
                description = strip_html(result.get("content"))
                if query_lower and query_lower not in title.lower() and query_lower not in description.lower():
                    continue

                jobs.append(
                    RawJob(
                        id=f"greenhouse-{result['id']}",
                        source=self.name,
                        title=title,
                        company=result.get("company_name", board),
                        location=(result.get("location") or {}).get("name", ""),
                        description=description,
                        url=result.get("absolute_url", ""),
                    )
                )
                if len(jobs) >= limit:
                    return jobs
        return jobs
