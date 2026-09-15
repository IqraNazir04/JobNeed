from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.scrapers.url_import import fetch_from_url

LINKEDIN_HTML = """
<html><head>
  <meta property="og:title" content="MeeBoss hiring Software Engineer in United States | LinkedIn" />
  <meta property="og:site_name" content="LinkedIn" />
  <meta property="og:description" content="About the job. Build things." />
  <meta property="og:url" content="https://www.linkedin.com/jobs/view/software-engineer-at-meeboss-4463366960" />
</head><body></body></html>
"""

# Real LinkedIn responses omit og:site_name for some User-Agents (observed
# live) - the parser must still work using only the URL to detect LinkedIn.
LINKEDIN_HTML_NO_SITE_NAME = """
<html><head>
  <meta property="og:title" content="MeeBoss hiring Software Engineer in United States | LinkedIn" />
  <meta property="og:description" content="About the job. Build things." />
  <meta property="og:url" content="https://www.linkedin.com/jobs/view/software-engineer-at-meeboss-4463366960" />
</head><body></body></html>
"""

GENERIC_HTML = """
<html><head>
  <meta property="og:title" content="Backend Engineer" />
  <meta property="og:site_name" content="Acme Careers" />
  <meta property="og:description" content="Ship things at Acme." />
</head><body></body></html>
"""


def _fake_response(html: str):
    resp = MagicMock()
    resp.text = html
    resp.is_redirect = False
    resp.raise_for_status = MagicMock()
    return resp


def _redirect_response(location: str):
    resp = MagicMock()
    resp.is_redirect = True
    resp.headers = {"location": location}
    return resp


# ensure_safe_url does real DNS resolution, which these tests shouldn't
# depend on - they're testing HTML parsing, not the SSRF guard (that has
# its own dedicated tests in test_url_safety.py). Patching it to a no-op
# here also means test URLs like https://acme.example don't need to
# actually resolve (.example is a reserved, non-resolvable TLD).
_NOOP_SAFETY = patch("app.scrapers.url_import.ensure_safe_url")


def test_fetch_from_url_parses_linkedin_title():
    url = "https://www.linkedin.com/jobs/view/software-engineer-at-meeboss-4463366960"
    with _NOOP_SAFETY, patch("app.scrapers.url_import.httpx.get", return_value=_fake_response(LINKEDIN_HTML)):
        job = fetch_from_url(url)

    assert job.title == "Software Engineer"
    assert job.company == "MeeBoss"
    assert job.location == "United States"
    assert job.description == "About the job. Build things."
    assert job.url == "https://www.linkedin.com/jobs/view/software-engineer-at-meeboss-4463366960"
    assert job.source == "url_import"
    assert job.id.startswith("url-")


def test_fetch_from_url_parses_linkedin_title_without_site_name_tag():
    url = "https://www.linkedin.com/jobs/view/software-engineer-at-meeboss-4463366960"
    with _NOOP_SAFETY, patch(
        "app.scrapers.url_import.httpx.get",
        return_value=_fake_response(LINKEDIN_HTML_NO_SITE_NAME),
    ):
        job = fetch_from_url(url)

    assert job.title == "Software Engineer"
    assert job.company == "MeeBoss"
    assert job.location == "United States"


def test_fetch_from_url_falls_back_for_non_linkedin_sites():
    url = "https://acme.example/careers/backend-engineer"
    with _NOOP_SAFETY, patch("app.scrapers.url_import.httpx.get", return_value=_fake_response(GENERIC_HTML)):
        job = fetch_from_url(url)

    assert job.title == "Backend Engineer"
    assert job.company == "Acme Careers"
    assert job.description == "Ship things at Acme."
    assert job.url == url  # no og:url tag present, falls back to the input url


def test_fetch_from_url_raises_when_no_title_found():
    with _NOOP_SAFETY, patch(
        "app.scrapers.url_import.httpx.get",
        return_value=_fake_response("<html><head></head><body></body></html>"),
    ):
        with pytest.raises(ValueError):
            fetch_from_url("https://example.com/no-metadata")


def test_fetch_from_url_propagates_http_errors():
    with _NOOP_SAFETY, patch(
        "app.scrapers.url_import.httpx.get",
        side_effect=httpx.ConnectError("boom"),
    ):
        with pytest.raises(httpx.HTTPError):
            fetch_from_url("https://example.com/unreachable")


def test_fetch_from_url_rejects_unsafe_initial_url():
    with patch(
        "app.scrapers.url_import.ensure_safe_url", side_effect=ValueError("blocked")
    ), patch("app.scrapers.url_import.httpx.get") as mock_get:
        with pytest.raises(ValueError):
            fetch_from_url("http://169.254.169.254/latest/meta-data/")
    mock_get.assert_not_called()


def test_fetch_from_url_follows_a_safe_redirect():
    with _NOOP_SAFETY, patch(
        "app.scrapers.url_import.httpx.get",
        side_effect=[_redirect_response("https://acme.example/final"), _fake_response(GENERIC_HTML)],
    ):
        job = fetch_from_url("https://acme.example/careers/backend-engineer")
    assert job.title == "Backend Engineer"


def test_fetch_from_url_blocks_a_redirect_to_an_unsafe_host():
    def fake_ensure_safe_url(url):
        if "internal" in url:
            raise ValueError("That URL points to a private or internal address, which isn't allowed.")

    with patch(
        "app.scrapers.url_import.ensure_safe_url", side_effect=fake_ensure_safe_url
    ), patch(
        "app.scrapers.url_import.httpx.get",
        return_value=_redirect_response("http://internal.local/secret"),
    ):
        with pytest.raises(ValueError):
            fetch_from_url("https://acme.example/careers/backend-engineer")
