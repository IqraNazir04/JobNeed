from app.core.config import settings
from app.scrapers.base import JobSource, RawJob


class IndeedSource(JobSource):
    """Indeed prohibits scraping its site in its Terms of Service.

    Use the Indeed Publisher/XML feed (https://www.indeed.com/publisher) if
    you hold a publisher account, or a licensed job-aggregator API. Fill in
    INDEED_PUBLISHER_ID in .env and implement the request/parse below once
    you have access.
    """

    name = "indeed"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        if not settings.indeed_publisher_id:
            raise NotImplementedError(
                "No Indeed publisher ID configured. Sign up at "
                "https://www.indeed.com/publisher and set INDEED_PUBLISHER_ID."
            )
        raise NotImplementedError(
            "Implement the Indeed Publisher feed request/parse here."
        )
