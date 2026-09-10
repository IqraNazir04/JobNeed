from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings
from app.scrapers.google_jobs import GoogleJobsSource


def test_fetch_without_api_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "serpapi_api_key", "")
    with pytest.raises(NotImplementedError):
        GoogleJobsSource().fetch("react")


def test_fetch_parses_serpapi_response(monkeypatch):
    monkeypatch.setattr(settings, "serpapi_api_key", "fake-key")

    fake_response = MagicMock()
    fake_response.json.return_value = {
        "jobs_results": [
            {
                "job_id": "abc123",
                "title": "Backend Engineer",
                "company_name": "Acme",
                "location": "Remote",
                "description": "Build things.",
                "apply_options": [{"title": "Indeed", "link": "https://example.com/apply"}],
            }
        ]
    }

    with patch("app.scrapers.google_jobs.httpx.get", return_value=fake_response) as mock_get:
        jobs = GoogleJobsSource().fetch("backend engineer")

    mock_get.assert_called_once()
    assert mock_get.call_args.kwargs["params"]["q"] == "backend engineer"
    assert mock_get.call_args.kwargs["params"]["api_key"] == "fake-key"

    assert len(jobs) == 1
    job = jobs[0]
    assert job.source == "google_jobs"
    assert job.title == "Backend Engineer"
    assert job.company == "Acme"
    assert job.location == "Remote"
    assert job.url == "https://example.com/apply"
    assert job.id.startswith("google-")


def test_fetch_handles_missing_apply_options(monkeypatch):
    monkeypatch.setattr(settings, "serpapi_api_key", "fake-key")

    fake_response = MagicMock()
    fake_response.json.return_value = {
        "jobs_results": [
            {
                "title": "Data Engineer",
                "company_name": "Bright Path",
                "location": "Remote",
                "description": "Pipelines.",
            }
        ]
    }

    with patch("app.scrapers.google_jobs.httpx.get", return_value=fake_response):
        jobs = GoogleJobsSource().fetch("data engineer")

    assert len(jobs) == 1
    assert jobs[0].url == ""


def test_fetch_respects_limit(monkeypatch):
    monkeypatch.setattr(settings, "serpapi_api_key", "fake-key")

    fake_response = MagicMock()
    fake_response.json.return_value = {
        "jobs_results": [
            {"title": f"Role {i}", "company_name": "Co", "location": "Remote", "description": ""}
            for i in range(5)
        ]
    }

    with patch("app.scrapers.google_jobs.httpx.get", return_value=fake_response):
        jobs = GoogleJobsSource().fetch("role", limit=2)

    assert len(jobs) == 2
