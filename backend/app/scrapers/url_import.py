import hashlib
import re
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.url_safety import ensure_safe_url
from app.scrapers.base import RawJob

_USER_AGENT = "Mozilla/5.0 (compatible; JobNeedBot/1.0)"
_MAX_REDIRECTS = 5

# LinkedIn's og:title for a job posting reliably reads
# "<Company> hiring <Title> in <Location> | LinkedIn" - parse it when it
# matches, but never fail if a differently-formatted title shows up.
_LINKEDIN_TITLE_RE = re.compile(
    r"^(?P<company>.+?) hiring (?P<title>.+?) in (?P<location>.+?)(?:\s*\|\s*LinkedIn)?$"
)


def _parse_linkedin_title(raw_title: str) -> dict | None:
    match = _LINKEDIN_TITLE_RE.match(raw_title)
    return match.groupdict() if match else None


def fetch_from_url(url: str) -> RawJob:
    """Fetch a single job posting page (e.g. a LinkedIn job URL) and build a
    RawJob from its Open Graph preview metadata. This reads only the same
    public preview tags a site publishes for link unfurling — a single,
    user-supplied URL is a very different risk profile from bulk scraping a
    site's listings.

    Every hop (the initial URL and each redirect) is checked against
    ensure_safe_url before it's requested, since this URL is caller-supplied
    and fetched server-side - without that check this would be an SSRF
    vector (e.g. pointing the server at a cloud metadata endpoint)."""
    ensure_safe_url(url)
    current_url = url
    response = None
    for _ in range(_MAX_REDIRECTS):
        response = httpx.get(
            current_url, timeout=20.0, follow_redirects=False, headers={"User-Agent": _USER_AGENT}
        )
        if not response.is_redirect:
            break
        location = response.headers.get("location")
        if not location:
            break
        current_url = urljoin(current_url, location)
        ensure_safe_url(current_url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    def meta(property_name: str) -> str:
        tag = soup.find("meta", property=property_name)
        content = tag.get("content") if tag else None
        return content.strip() if isinstance(content, str) else ""

    raw_title = meta("og:title") or (
        soup.title.string.strip() if soup.title and soup.title.string else ""
    )
    if not raw_title:
        raise ValueError("Could not find a job title in that page's metadata.")

    # og:site_name is unreliable here - LinkedIn omits it for some User-Agents -
    # so detect LinkedIn from the URL itself instead.
    is_linkedin = "linkedin.com" in urlparse(url).netloc.lower()
    title, company, location = raw_title, meta("og:site_name"), ""
    if is_linkedin:
        parsed = _parse_linkedin_title(raw_title)
        if parsed:
            title, company, location = parsed["title"], parsed["company"], parsed["location"]

    canonical_url = meta("og:url") or url
    job_id = f"url-{hashlib.sha1(canonical_url.encode()).hexdigest()[:16]}"

    return RawJob(
        id=job_id,
        source="url_import",
        title=title,
        company=company,
        location=location,
        description=meta("og:description"),
        url=canonical_url,
    )
