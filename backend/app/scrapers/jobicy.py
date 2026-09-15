import httpx

from app.scrapers.base import JobSource, RawJob, normalize_remote_location, strip_html


class JobicySource(JobSource):
    """Pulls live postings from Jobicy's public JSON API
    (https://jobicy.com/api/v2/remote-jobs) - a free, keyless feed Jobicy
    publishes for other sites to use. Their own API response states the
    terms directly: credit Jobicy as the source and link application
    buttons to the original job URL - this app already does both via
    each job's "View original posting" link and its source badge.
    """

    name = "jobicy"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        response = httpx.get(
            "https://jobicy.com/api/v2/remote-jobs",
            params={"count": limit},
            timeout=20.0,
        )
        response.raise_for_status()

        query_lower = query.strip().lower()
        jobs: list[RawJob] = []
        for result in response.json().get("jobs", []):
            title = result.get("jobTitle", "")
            description = strip_html(result.get("jobDescription") or result.get("jobExcerpt"))
            if query_lower and query_lower not in title.lower() and query_lower not in description.lower():
                continue

            jobs.append(
                RawJob(
                    id=f"jobicy-{result['id']}",
                    source=self.name,
                    title=title,
                    company=result.get("companyName", ""),
                    # Jobicy is remote-only by definition; jobGeo just
                    # narrows the eligible region rather than meaning
                    # "not remote".
                    location=normalize_remote_location(result.get("jobGeo")),
                    description=description,
                    url=result.get("url", ""),
                )
            )
            if len(jobs) >= limit:
                break
        return jobs
