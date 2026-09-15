from datetime import datetime, timezone

import httpx

from app.scrapers.base import JobSource, RawJob, normalize_remote_location, strip_html

_USER_AGENT = "Mozilla/5.0 (compatible; JobNeedBot/1.0)"


class RemoteOKSource(JobSource):
    """Pulls live postings from Remote OK's public JSON API
    (https://remoteok.com/api) - a free, keyless feed Remote OK
    publishes specifically for other sites to use. Their stated terms
    (embedded as the first element of the API response) only ask that
    listings link back to the original Remote OK posting and credit
    Remote OK as the source - this app already does both via each job's
    "View original posting" link and its source badge, so no separate
    agreement or key is needed.
    """

    name = "remoteok"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        response = httpx.get(
            "https://remoteok.com/api", timeout=20.0, headers={"User-Agent": _USER_AGENT}
        )
        response.raise_for_status()

        query_lower = query.strip().lower()
        jobs: list[RawJob] = []
        for result in response.json():
            # The feed's first element is a legal notice, not a job posting.
            if "id" not in result:
                continue

            title = result.get("position", "")
            description = strip_html(result.get("description"))
            tags = " ".join(result.get("tags") or [])
            haystack = f"{title} {description} {tags}".lower()
            if query_lower and query_lower not in haystack:
                continue

            posted_at = None
            epoch = result.get("epoch")
            if epoch:
                posted_at = datetime.fromtimestamp(epoch, tz=timezone.utc)

            jobs.append(
                RawJob(
                    id=f"remoteok-{result['id']}",
                    source=self.name,
                    title=title,
                    company=result.get("company", ""),
                    # Remote OK postings are all remote, but the location
                    # field is often a city/country instead of saying so.
                    location=normalize_remote_location(result.get("location")),
                    description=description,
                    url=result.get("url") or result.get("apply_url", ""),
                    posted_at=posted_at,
                )
            )
            if len(jobs) >= limit:
                break
        return jobs
