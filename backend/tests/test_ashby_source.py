from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings
from app.scrapers.ashby import AshbySource

FAKE_POSTING = {
    "id": "abc-123",
    "title": "Backend Engineer",
    "isListed": True,
    "isRemote": False,
    "location": "New York, NY",
    "descriptionHtml": "<p>Build the postings API.</p>",
    "jobUrl": "https://jobs.ashbyhq.com/ramp/abc-123",
}


def test_fetch_without_boards_raises(monkeypatch):
    monkeypatch.setattr(settings, "ashby_boards", "")
    with pytest.raises(NotImplementedError):
        AshbySource().fetch("")


def test_fetch_parses_postings(monkeypatch):
    monkeypatch.setattr(settings, "ashby_boards", "ramp")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {"jobs": [FAKE_POSTING]}

    with patch("app.scrapers.ashby.httpx.get", return_value=fake_response):
        jobs = AshbySource().fetch("")

    assert len(jobs) == 1
    job = jobs[0]
    assert job.id == "ashby-abc-123"
    assert job.source == "ashby"
    assert job.title == "Backend Engineer"
    assert job.company == "ramp"
    assert job.location == "New York, NY"
    assert job.url == "https://jobs.ashbyhq.com/ramp/abc-123"
    assert job.description == "Build the postings API."


def test_fetch_labels_remote_postings_without_a_location(monkeypatch):
    monkeypatch.setattr(settings, "ashby_boards", "ramp")
    remote_posting = {**FAKE_POSTING, "location": "", "isRemote": True}

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {"jobs": [remote_posting]}

    with patch("app.scrapers.ashby.httpx.get", return_value=fake_response):
        jobs = AshbySource().fetch("")

    assert jobs[0].location == "Remote"


def test_fetch_skips_unlisted_postings(monkeypatch):
    monkeypatch.setattr(settings, "ashby_boards", "ramp")
    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {"jobs": [{**FAKE_POSTING, "isListed": False}]}

    with patch("app.scrapers.ashby.httpx.get", return_value=fake_response):
        jobs = AshbySource().fetch("")

    assert jobs == []


def test_fetch_filters_by_query(monkeypatch):
    monkeypatch.setattr(settings, "ashby_boards", "ramp")
    other = {**FAKE_POSTING, "id": "xyz", "title": "Product Designer"}

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {"jobs": [FAKE_POSTING, other]}

    with patch("app.scrapers.ashby.httpx.get", return_value=fake_response):
        jobs = AshbySource().fetch("designer")

    assert len(jobs) == 1
    assert jobs[0].title == "Product Designer"


def test_fetch_skips_404_boards(monkeypatch):
    monkeypatch.setattr(settings, "ashby_boards", "nonexistent-co")
    fake_response = MagicMock()
    fake_response.status_code = 404

    with patch("app.scrapers.ashby.httpx.get", return_value=fake_response):
        jobs = AshbySource().fetch("")

    assert jobs == []
