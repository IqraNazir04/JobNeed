from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings
from app.scrapers.greenhouse import GreenhouseSource

FAKE_JOB = {
    "id": 8556658002,
    "title": "AI Engineer",
    "company_name": "GitLab",
    "location": {"name": "Remote, Bangalore"},
    "absolute_url": "https://job-boards.greenhouse.io/gitlab/jobs/8556658002",
    "content": "&lt;div&gt;&lt;p&gt;Build things with &lt;strong&gt;AI&lt;/strong&gt;.&lt;/p&gt;&lt;/div&gt;",
}


def test_fetch_without_boards_raises(monkeypatch):
    monkeypatch.setattr(settings, "greenhouse_boards", "")
    with pytest.raises(NotImplementedError):
        GreenhouseSource().fetch("")


def test_fetch_parses_and_cleans_html(monkeypatch):
    monkeypatch.setattr(settings, "greenhouse_boards", "gitlab")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {"jobs": [FAKE_JOB]}

    with patch("app.scrapers.greenhouse.httpx.get", return_value=fake_response):
        jobs = GreenhouseSource().fetch("")

    assert len(jobs) == 1
    job = jobs[0]
    assert job.id == "greenhouse-8556658002"
    assert job.source == "greenhouse"
    assert job.title == "AI Engineer"
    assert job.company == "GitLab"
    assert job.location == "Remote, Bangalore"
    assert job.url == "https://job-boards.greenhouse.io/gitlab/jobs/8556658002"
    assert job.description == "Build things with AI ."


def test_fetch_filters_by_query(monkeypatch):
    monkeypatch.setattr(settings, "greenhouse_boards", "gitlab")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {
        "jobs": [FAKE_JOB, {**FAKE_JOB, "id": 2, "title": "Product Designer"}]
    }

    with patch("app.scrapers.greenhouse.httpx.get", return_value=fake_response):
        jobs = GreenhouseSource().fetch("designer")

    assert len(jobs) == 1
    assert jobs[0].title == "Product Designer"


def test_fetch_skips_404_boards(monkeypatch):
    monkeypatch.setattr(settings, "greenhouse_boards", "nonexistent-co")

    fake_response = MagicMock()
    fake_response.status_code = 404

    with patch("app.scrapers.greenhouse.httpx.get", return_value=fake_response):
        jobs = GreenhouseSource().fetch("")

    assert jobs == []


def test_fetch_respects_limit_across_boards(monkeypatch):
    monkeypatch.setattr(settings, "greenhouse_boards", "co-a,co-b")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {
        "jobs": [{**FAKE_JOB, "id": i} for i in range(5)]
    }

    with patch("app.scrapers.greenhouse.httpx.get", return_value=fake_response):
        jobs = GreenhouseSource().fetch("", limit=2)

    assert len(jobs) == 2
