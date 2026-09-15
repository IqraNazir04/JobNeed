import httpx

from app.core.config import settings
from app.scrapers.base import JobSource, RawJob, strip_html


class AshbySource(JobSource):
    """Pulls live postings from Ashby's public Job Board API
    (https://developers.ashbyhq.com/docs/job-board-api) — the same feed
    companies embed on their own public careers pages, so this needs no
    authentication, the same reasoning already used for Greenhouse/Lever.

    Configure which companies to pull from via ASHBY_BOARDS in .env
    (comma-separated board names, found in the URL of a company's Ashby
    careers page, e.g. jobs.ashbyhq.com/<name>).
    """

    name = "ashby"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        boards = [b.strip() for b in settings.ashby_boards.split(",") if b.strip()]
        if not boards:
            raise NotImplementedError(
                "No Ashby boards configured. Set ASHBY_BOARDS to a "
                "comma-separated list of company board names, e.g. 'ramp'."
            )

        query_lower = query.strip().lower()
        jobs: list[RawJob] = []
        for board in boards:
            response = httpx.get(
                f"https://api.ashbyhq.com/posting-api/job-board/{board}", timeout=20.0
            )
            if response.status_code == 404:
                continue
            response.raise_for_status()

            for result in response.json().get("jobs", []):
                if not result.get("isListed", True):
                    continue

                title = result.get("title", "")
                description = strip_html(result.get("descriptionHtml"))
                if query_lower and query_lower not in title.lower() and query_lower not in description.lower():
                    continue

                jobs.append(
                    RawJob(
                        id=f"ashby-{result['id']}",
                        source=self.name,
                        title=title,
                        company=board,
                        location=result.get("location") or ("Remote" if result.get("isRemote") else ""),
                        description=description,
                        url=result.get("jobUrl", ""),
                    )
                )
                if len(jobs) >= limit:
                    return jobs
        return jobs
