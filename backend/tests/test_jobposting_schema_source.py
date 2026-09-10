from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings
from app.scrapers.jobposting_schema import JobPostingSchemaSource

PAGE_URL = "https://example.com/careers/software-engineer"

JOBPOSTING_JSON = """
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "Software Engineer",
  "description": "Build things. &lt;b&gt;Ship fast&lt;/b&gt;.",
  "datePosted": "2026-07-07",
  "hiringOrganization": {"@type": "Organization", "name": "Acme Corp"},
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bengaluru",
      "addressCountry": "India"
    }
  }
}
"""


def _html_with_jsonld(json_text: str) -> str:
    return f"""
    <html><head>
      <script type="application/ld+json">{json_text}</script>
    </head><body>Job page</body></html>
    """


def test_fetch_without_urls_raises(monkeypatch):
    monkeypatch.setattr(settings, "jobposting_urls", "")
    with pytest.raises(NotImplementedError):
        JobPostingSchemaSource().fetch("")


def test_fetch_parses_jobposting_jsonld(monkeypatch):
    monkeypatch.setattr(settings, "jobposting_urls", PAGE_URL)

    fake_response = MagicMock()
    fake_response.text = _html_with_jsonld(JOBPOSTING_JSON)
    fake_response.raise_for_status = MagicMock()

    with patch("app.scrapers.jobposting_schema.httpx.get", return_value=fake_response):
        jobs = JobPostingSchemaSource().fetch("")

    assert len(jobs) == 1
    job = jobs[0]
    assert job.source == "jobposting_schema"
    assert job.title == "Software Engineer"
    assert job.company == "Acme Corp"
    assert job.location == "Bengaluru, India"
    assert job.description == "Build things. Ship fast ."
    assert job.url == PAGE_URL
    assert job.id.startswith("jobposting-")


def test_fetch_ignores_non_jobposting_jsonld(monkeypatch):
    monkeypatch.setattr(settings, "jobposting_urls", PAGE_URL)

    fake_response = MagicMock()
    fake_response.text = _html_with_jsonld('{"@type": "Organization", "name": "Acme"}')
    fake_response.raise_for_status = MagicMock()

    with patch("app.scrapers.jobposting_schema.httpx.get", return_value=fake_response):
        jobs = JobPostingSchemaSource().fetch("")

    assert jobs == []


def test_fetch_filters_by_query(monkeypatch):
    monkeypatch.setattr(settings, "jobposting_urls", PAGE_URL)

    fake_response = MagicMock()
    fake_response.text = _html_with_jsonld(JOBPOSTING_JSON)
    fake_response.raise_for_status = MagicMock()

    with patch("app.scrapers.jobposting_schema.httpx.get", return_value=fake_response):
        jobs = JobPostingSchemaSource().fetch("designer")

    assert jobs == []


def test_fetch_skips_unreachable_pages(monkeypatch):
    import httpx

    monkeypatch.setattr(settings, "jobposting_urls", PAGE_URL)

    with patch(
        "app.scrapers.jobposting_schema.httpx.get",
        side_effect=httpx.ConnectError("boom"),
    ):
        jobs = JobPostingSchemaSource().fetch("")

    assert jobs == []
