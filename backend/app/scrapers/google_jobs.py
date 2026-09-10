import hashlib

import httpx

from app.core.config import settings
from app.scrapers.base import JobSource, RawJob

_SERPAPI_URL = "https://serpapi.com/search.json"


class GoogleJobsSource(JobSource):
    """Google for Jobs results are drawn from structured data on employer
    sites, not a public scrape target. This adapter uses SerpApi's Google
    Jobs API (https://serpapi.com/google-jobs-api), a licensed aggregator,
    rather than scraping Google's results pages directly. Set
    SERPAPI_API_KEY in .env to use it.
    """

    name = "google_jobs"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        if not settings.serpapi_api_key:
            raise NotImplementedError(
                "No SerpApi key configured. Sign up at https://serpapi.com "
                "and set SERPAPI_API_KEY."
            )

        response = httpx.get(
            _SERPAPI_URL,
            params={
                "engine": "google_jobs",
                "q": query,
                "api_key": settings.serpapi_api_key,
            },
            timeout=20.0,
        )
        response.raise_for_status()
        results = response.json().get("jobs_results", [])

        jobs = []
        for i, result in enumerate(results[:limit]):
            apply_options = result.get("apply_options") or []
            url = apply_options[0]["link"] if apply_options else ""
            external_id = result.get("job_id") or f"{query}-{i}"
            job_id = f"google-{hashlib.sha1(external_id.encode()).hexdigest()[:16]}"
            jobs.append(
                RawJob(
                    id=job_id,
                    source=self.name,
                    title=result.get("title", ""),
                    company=result.get("company_name", ""),
                    location=result.get("location", ""),
                    description=result.get("description", ""),
                    url=url,
                )
            )
        return jobs
