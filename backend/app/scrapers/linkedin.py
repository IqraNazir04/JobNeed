from app.core.config import settings
from app.scrapers.base import JobSource, RawJob


class LinkedInSource(JobSource):
    """LinkedIn's Terms of Service prohibit scraping, and it has pursued
    legal action against scrapers (e.g. hiQ Labs v. LinkedIn).

    Use LinkedIn's official Talent/Jobs API via partner access
    (https://learn.microsoft.com/en-us/linkedin/talent/job-postings/), or a
    licensed data provider such as Proxycurl. Set LINKEDIN_API_TOKEN in .env
    and implement the request/parse below once you have access.
    """

    name = "linkedin"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        if not settings.linkedin_api_token:
            raise NotImplementedError(
                "No LinkedIn API token configured. Apply for partner access "
                "and set LINKEDIN_API_TOKEN."
            )
        raise NotImplementedError(
            "Implement the LinkedIn Talent API request/parse here."
        )
