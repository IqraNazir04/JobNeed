import hashlib
import json

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.scrapers.base import JobSource, RawJob, strip_html

_USER_AGENT = "Mozilla/5.0 (compatible; JobNeedBot/1.0)"


class JobPostingSchemaSource(JobSource):
    """Crawls company career pages for schema.org JobPosting structured
    data (https://developers.google.com/search/docs/appearance/structured-data/job-posting)
    — the same markup companies publish specifically so Google for Jobs can
    index them, so reading it is squarely within its intended, machine-read
    purpose. No API key, no ToS conflict.

    Configure which pages to check via JOBPOSTING_URLS in .env
    (comma-separated career-page URLs that embed JobPosting JSON-LD).
    """

    name = "jobposting_schema"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        urls = [u.strip() for u in settings.jobposting_urls.split(",") if u.strip()]
        if not urls:
            raise NotImplementedError(
                "No pages configured. Set JOBPOSTING_URLS to a comma-separated "
                "list of company career-page URLs that publish JobPosting "
                "structured data."
            )

        query_lower = query.strip().lower()
        jobs: list[RawJob] = []
        for page_url in urls:
            try:
                response = httpx.get(
                    page_url,
                    timeout=20.0,
                    follow_redirects=True,
                    headers={"User-Agent": _USER_AGENT},
                )
                response.raise_for_status()
            except httpx.HTTPError:
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            for script in soup.find_all("script", type="application/ld+json"):
                for posting in _extract_job_postings(script.string):
                    title = posting.get("title", "")
                    description = strip_html(posting.get("description", ""))
                    if (
                        query_lower
                        and query_lower not in title.lower()
                        and query_lower not in description.lower()
                    ):
                        continue

                    org = posting.get("hiringOrganization")
                    company = org.get("name", "") if isinstance(org, dict) else ""
                    posting_url = posting.get("url") or page_url
                    job_id = f"jobposting-{hashlib.sha1(posting_url.encode()).hexdigest()[:16]}"

                    jobs.append(
                        RawJob(
                            id=job_id,
                            source=self.name,
                            title=title,
                            company=company,
                            location=_format_location(posting.get("jobLocation")),
                            description=description,
                            url=posting_url,
                        )
                    )
                    if len(jobs) >= limit:
                        return jobs
        return jobs


def _extract_job_postings(raw_json: str | None) -> list[dict]:
    if not raw_json:
        return []
    try:
        data = json.loads(raw_json)
    except (json.JSONDecodeError, TypeError):
        return []

    candidates = data if isinstance(data, list) else [data]
    postings = []
    for item in candidates:
        if not isinstance(item, dict):
            continue
        graph = item.get("@graph")
        nodes = graph if isinstance(graph, list) else [item]
        for node in nodes:
            if isinstance(node, dict) and _is_job_posting(node.get("@type")):
                postings.append(node)
    return postings


def _is_job_posting(type_field) -> bool:
    if isinstance(type_field, str):
        return type_field == "JobPosting"
    if isinstance(type_field, list):
        return "JobPosting" in type_field
    return False


def _format_location(job_location) -> str:
    if isinstance(job_location, list):
        job_location = job_location[0] if job_location else None
    if not isinstance(job_location, dict):
        return ""
    address = job_location.get("address")
    if isinstance(address, dict):
        parts = [
            address.get("addressLocality"),
            address.get("addressRegion"),
            address.get("addressCountry"),
        ]
        return ", ".join(p for p in parts if p)
    if isinstance(address, str):
        return address
    return ""
